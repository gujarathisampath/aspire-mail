"use server";

import { ImapFlow } from "imapflow";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { Mail, Folder } from "@/lib/types";
import { APP_CONFIG } from "@/lib/config";
import { simpleParser } from "mailparser";
import MailComposer from "nodemailer/lib/mail-composer";

export const buildMimeSource = async (mailOptions: any): Promise<Buffer> => {
  const composer = new MailComposer(mailOptions);
  return new Promise<Buffer>((resolve, reject) => {
    composer.compile().build((err: any, message: Buffer) => {
      if (err) reject(err);
      else resolve(message);
    });
  });
};

export const getImapClient = async () => {
  const cookieStore = await cookies();
  const session = cookieStore.get("mail-session");

  if (!session) {
    redirect("/login");
  }
  let sessionData: any;
  try {
    sessionData = JSON.parse(session.value);
  } catch (e) {
    cookieStore.delete("mail-session");
    redirect("/login");
  }

  if (
    typeof sessionData?.email !== "string" ||
    !sessionData.email.includes("@") ||
    typeof sessionData?.password !== "string" ||
    sessionData.password.length === 0
  ) {
    redirect("/login");
  }

  const { email, password } = sessionData;
  const domain = email.split("@")[1];
  const { host, port, secure, rejectUnauthorized } = APP_CONFIG.server.imap;
  const imapHost = host || `mail.${domain}`;

  // Ensure global pool exists
  const globalAny = global as any;
  if (!globalAny.imapPool) {
    globalAny.imapPool = new Map<string, { connections: { promise: Promise<ImapFlow>, lastUsed: number }[], nextIdx: number }>();
  }
  const pool = globalAny.imapPool;

  const connectionKey = `${email}:${imapHost}:${port}`;
  let poolData = pool.get(connectionKey);

  if (!poolData) {
    poolData = { connections: [], nextIdx: 0 };
    pool.set(connectionKey, poolData);
  }

  // Try to find a usable connection from the pool using round-robin
  for (let i = 0; i < poolData.connections.length; i++) {
    const idx = (poolData.nextIdx + i) % poolData.connections.length;
    const entry = poolData.connections[idx];
    if (!entry) continue;

    try {
      const client = await entry.promise;
      if (client.usable) {
        poolData.nextIdx = (idx + 1) % poolData.connections.length;
        entry.lastUsed = Date.now();
        return client;
      }
    } catch (e) {
      // Connection failed, mark to be filtered out
    }
    poolData.connections[idx] = null as any;
  }

  // Filter out any dead connections
  poolData.connections = poolData.connections.filter(Boolean);

  // If no usable connection found or we can spawn more concurrent lines (max 3)
  const connectPromise = (async () => {
    const client = new ImapFlow({
      host: imapHost,
      port: port,
      secure: secure,
      auth: {
        user: email,
        pass: password,
      },
      logger: false,
      tls: {
        rejectUnauthorized: rejectUnauthorized,
      },
    });

    await client.connect();

    const originalLogout = client.logout.bind(client);
    client.logout = async () => {};
    client.close = () => {};
    (client as any).realLogout = originalLogout;
    client.connect = async () => {}; // no-op if already connected
    return client;
  })();

  poolData.connections.push({ promise: connectPromise, lastUsed: Date.now() });

  // If we exceed max connections (3), evict the oldest
  if (poolData.connections.length > 3) {
    const oldest = poolData.connections.shift();
    if (oldest) {
      oldest.promise.then((c: any) => c.realLogout?.()).catch(() => {});
    }
  }

  // Clean up idle connections periodically (e.g., every 5 minutes)
  if (!globalAny.imapPoolInterval) {
    globalAny.imapPoolInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, pd] of pool.entries()) {
        pd.connections = pd.connections.filter((entry: any) => {
          if (now - entry.lastUsed > 5 * 60 * 1000) {
            entry.promise.then((c: any) => {
              try {
                if (typeof c.realLogout === 'function') c.realLogout();
                else c.logout();
              } catch (e) {}
            }).catch(() => {});
            return false;
          }
          return true;
        });
        if (pd.connections.length === 0) {
          pool.delete(key);
        }
      }
    }, 60 * 1000);
  }

  return connectPromise;
};

export const getMailDetailsAction = async (
  folderId: string,
  uid: string,
): Promise<{ content: string; attachments: any[] }> => {
  const client = await getImapClient();
  let content = "";
  const attachments: any[] = [];

  try {
    await client.connect();
    const targetFolder = await resolveFolder(client, folderId);
    const lock = await client.getMailboxLock(targetFolder);

    try {
      const structureMessage = await client.fetchOne(
        uid,
        { bodyStructure: true },
        { uid: true },
      );

      if (structureMessage && structureMessage.bodyStructure) {
        let htmlPart: any = null;
        let textPart: any = null;

        const findParts = (part: any) => {
          if (
            part.disposition?.toLowerCase() === "attachment" ||
            part.parameters?.name ||
            part.parameters?.filename
          ) {
            attachments.push({
              id: part.part || part.id,
              filename:
                part.parameters?.filename || part.parameters?.name || "unnamed",
              contentType:
                part.contentType || part.type || "application/octet-stream",
              size: part.size,
              contentId: part.contentId || part.id,
            });
          } else {
            const type = (part.contentType || part.type || "").toLowerCase();
            if (type === "text/html" && !htmlPart) htmlPart = part;
            if (type === "text/plain" && !textPart) textPart = part;
          }
          if (part.childNodes) {
            part.childNodes.forEach(findParts);
          }
        };

        findParts(structureMessage.bodyStructure);

        const targetPart = htmlPart || textPart;
        const partId =
          targetPart?.part ||
          ((structureMessage.bodyStructure.contentType ||
            structureMessage.bodyStructure.type ||
            "")
            .toLowerCase()
            .startsWith("text/")
            ? "1"
            : null);

        if (targetPart && partId) {
          // Fetch ONLY the text part to skip heavy attachments
          const partMessage = await client.fetchOne(
            uid,
            { bodyParts: [partId] },
            { uid: true }
          );

          if (partMessage && partMessage.bodyParts) {
            const rawContent = partMessage.bodyParts.get(partId);
            if (rawContent) {
              const charset = targetPart.parameters?.charset || "utf-8";
              const encoding = targetPart.encoding || "7bit";
              const fakeHeader = `Content-Type: ${targetPart.contentType || targetPart.type || "text/plain"}; charset="${charset}"\r\nContent-Transfer-Encoding: ${encoding}\r\n\r\n`;
              const fakeSource = Buffer.concat([
                Buffer.from(fakeHeader),
                rawContent,
              ]);

              const parsed = await simpleParser(fakeSource);
              content = parsed.html || parsed.textAsHtml || parsed.text || "";
            }
          }
        } else {
           // Fallback to fetching full source if no clear text part is found
           const message = await client.fetchOne(uid, { source: true }, { uid: true });
           if (message && message.source) {
              const parsed = await simpleParser(message.source);
              content = parsed.html || parsed.textAsHtml || parsed.text || "";
           }
        }
      }
    } finally {
      lock.release();
    }
  } catch (error: any) {
    console.error("[IMAP] getMailDetailsAction Error:", error.message);
    return { content: "", attachments: [] };
  } finally {
    try {
      await client.logout();
    } catch {
      client.close();
    }
  }
  return { content, attachments };
};

export const downloadAttachmentAction = async (
  folderId: string,
  uid: string,
  partId: string,
) => {
  const client = await getImapClient();
  try {
    await client.connect();
    const targetFolder = await resolveFolder(client, folderId);
    const lock = await client.getMailboxLock(targetFolder);

    try {
      // Fetch only the specific attachment part
      const message = await client.fetchOne(
        uid,
        { bodyParts: [partId] },
        { uid: true },
      );

      const structure = await client.fetchOne(
        uid,
        { bodyStructure: true },
        { uid: true },
      );

      // Find metadata for this part
      let metadata: any = null;
      const findPart = (part: any) => {
        if (part.part === partId) {
          metadata = part;
          return true;
        }
        if (part.childNodes) {
          for (const child of part.childNodes) {
            if (findPart(child)) return true;
          }
        }
        return false;
      };
      if (structure && structure.bodyStructure)
        findPart(structure.bodyStructure);

      if (message && message.bodyParts) {
        const content = message.bodyParts.get(partId);
        if (content) {
          return {
            filename:
              metadata?.parameters?.filename ||
              metadata?.parameters?.name ||
              "download",
            contentType: metadata?.contentType || "application/octet-stream",
            content: content.toString("base64"),
          };
        }
      }
    } finally {
      lock.release();
    }
  } catch (error: any) {
    console.error("[IMAP] downloadAttachmentAction Error:", error.message);
    return null;
  } finally {
    try {
      await client.logout();
    } catch {
      client.close();
    }
  }
  return null;
};

export const resolveFolder = async (client: ImapFlow, slug: string) => {
  const normalizedSlug = slug.toLowerCase();

  if (normalizedSlug === "inbox") return "INBOX";

  if (!(client as any)._folderCache) {
    (client as any)._folderCache = await client.list();
    // Invalidate cache after 5 minutes
    setTimeout(() => {
      (client as any)._folderCache = null;
    }, 5 * 60 * 1000);
  }
  
  const folders = (client as any)._folderCache;

  const specialUseMap: Record<string, string> = {
    sent: "\\Sent",
    drafts: "\\Drafts",
    trash: "\\Trash",
    junk: "\\Junk",
    archive: "\\Archive",
    starred: "\\Flagged",
  };

  const targetAttribute = specialUseMap[normalizedSlug];
  if (targetAttribute) {
    const found = folders.find((f: any) => f.specialUse === targetAttribute);
    if (found) return found.path;
  }

  const foundByDirectName = folders.find(
    (f: any) =>
      f.name.toLowerCase() === normalizedSlug ||
      f.path.toLowerCase() === normalizedSlug,
  );
  if (foundByDirectName) return foundByDirectName.path;

  const foundByKeyword = folders.find(
    (f: any) =>
      f.name.toLowerCase().includes(normalizedSlug) ||
      f.path.toLowerCase().includes(normalizedSlug),
  );
  if (foundByKeyword) return foundByKeyword.path;

  return slug;
};

const getMails = async (
  folderId: string = "INBOX",
  query?: string,
): Promise<Mail[]> => {
  const client = await getImapClient();
  try {
    await client.connect();
    const targetFolder = await resolveFolder(client, folderId);
    const lock = await client.getMailboxLock(targetFolder);
    const mails: Mail[] = [];

    try {
      let range: string | number[] = "";

      if (query && query.trim()) {
        const searchCriteria = {
          or: [
            { subject: query },
            { from: query },
            { body: query },
            { text: query },
          ],
        };
        const uids = await client.search(searchCriteria, { uid: true });
        // Only take the last 50 matches for performance if there are many
        if (uids && Array.isArray(uids)) {
          range = uids.slice(-50);
        } else {
          range = [];
        }
      } else {
        // Read total from already selected mailbox state to avoid network round-trip
        const total = client.mailbox?.exists || 0;
        if (total > 0) {
          const start = Math.max(1, total - 49);
          range = `${start}:*`;
        }
      }

      if (range && (Array.isArray(range) ? range.length > 0 : true)) {
        for await (const message of client.fetch(
          range,
          {
            envelope: true,
            flags: true,
            uid: true,
          },
          { uid: Array.isArray(range) },
        )) {
          if (message.envelope && message.uid) {
            let hasAttachments = false;

            const cleanName = (name?: string) => {
              if (!name) return "";
              return name.replace(/^['"]|['"]$/g, "").trim();
            };

            mails.push({
              id: message.uid.toString(),
              from: {
                name: cleanName(message.envelope.from?.[0]?.name),
                address: message.envelope.from?.[0]?.address || "",
              },
              subject: message.envelope.subject || "(No Subject)",
              to:
                message.envelope.to?.map((t: any) => ({
                  name: cleanName(t.name),
                  address: t.address || "",
                })) || [],
              cc: message.envelope.cc?.map((t: any) => ({
                name: cleanName(t.name),
                address: t.address || "",
              })),
              bcc: message.envelope.bcc?.map((t: any) => ({
                name: cleanName(t.name),
                address: t.address || "",
              })),
              preview: "", // Content will be fetched on demand
              date:
                message.envelope.date?.toISOString() ||
                new Date().toISOString(),
              read: message.flags?.has("\\Seen") || false,
              starred: message.flags?.has("\\Flagged") || false,
              hasAttachments,
            });
          }
        }
      }
    } finally {
      lock.release();
    }

    return mails.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  } catch (error: any) {
    console.error("[IMAP] getMailsAction Error:", error.message);
    return [];
  } finally {
    try {
      await client.logout();
    } catch {
      client.close();
    }
  }
};

export const getMailsAction = cache(getMails);

const getFolders = async (): Promise<Folder[]> => {
  const client = await getImapClient();
  try {
    await client.connect();
    if (!(client as any)._folderCache) {
      (client as any)._folderCache = await client.list();
      setTimeout(() => {
        (client as any)._folderCache = null;
      }, 5 * 60 * 1000);
    }
    const mailboxes = (client as any)._folderCache;

    const reverseSpecialUseMap: Record<string, string> = {
      "\\Inbox": "inbox",
      "\\Sent": "sent",
      "\\Drafts": "drafts",
      "\\Trash": "trash",
      "\\Junk": "junk",
      "\\Archive": "archive",
      "\\Flagged": "starred",
    };

    const folderPromises = mailboxes.map(async (mailbox: any) => {
      if (
        mailbox.flags.has("\\Noselect") &&
        !mailbox.flags.has("\\HasChildren")
      )
        return null;

      try {
        let status = null;
        if (!mailbox.flags.has("\\Noselect")) {
          status = await client.status(mailbox.path, {
            messages: true,
            unseen: true,
          });
        }

        let slug = mailbox.name.toLowerCase();
        if (mailbox.path.toUpperCase() === "INBOX") {
          slug = "inbox";
        } else if (
          mailbox.specialUse &&
          reverseSpecialUseMap[mailbox.specialUse]
        ) {
          slug = reverseSpecialUseMap[mailbox.specialUse];
        } else if (mailbox.name.toLowerCase().includes("sent")) {
          slug = "sent";
        } else if (mailbox.name.toLowerCase().includes("trash")) {
          slug = "trash";
        } else if (mailbox.name.toLowerCase().includes("draft")) {
          slug = "drafts";
        } else if (
          mailbox.name.toLowerCase().includes("junk") ||
          mailbox.name.toLowerCase().includes("spam")
        ) {
          slug = "junk";
        }

        return {
          id: mailbox.path,
          name: mailbox.name || mailbox.path,
          slug,
          unreadCount: status?.unseen || 0,
          totalCount: status?.messages || 0,
        };
      } catch {
        return null; // Skip inaccessible folders
      }
    });

    const results = await Promise.all(folderPromises);
    const folders: Folder[] = results.filter(Boolean) as Folder[];

    const order = [
      "inbox",
      "sent",
      "drafts",
      "starred",
      "archive",
      "junk",
      "trash",
    ];
    folders.sort((a, b) => {
      const indexA = order.indexOf(a.slug);
      const indexB = order.indexOf(b.slug);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

    return folders;
  } catch (error: any) {
    console.error("[IMAP] getFoldersAction Error:", error.message);
    return [];
  } finally {
    try {
      await client.logout();
    } catch {
      client.close();
    }
  }
};

export const getFoldersAction = cache(getFolders);

export const deleteMailAction = async (folderId: string, uid: string) => {
  const client = await getImapClient();
  try {
    await client.connect();
    const targetFolder = await resolveFolder(client, folderId);
    const lock = await client.getMailboxLock(targetFolder);
    try {
      // Use uid: true option for all message actions
      await client.messageDelete(uid, { uid: true });
      return { success: true };
    } finally {
      lock.release();
    }
  } catch (error: any) {
    console.error("[IMAP] deleteMailAction Error:", error.message);
    return { success: false, error: error.message };
  } finally {
    await client.logout();
  }
};

export const toggleReadAction = async (
  folderId: string,
  uid: string,
  seen: boolean,
) => {
  const client = await getImapClient();
  try {
    await client.connect();
    const targetFolder = await resolveFolder(client, folderId);
    const lock = await client.getMailboxLock(targetFolder);
    try {
      if (seen) {
        await client.messageFlagsAdd(uid, ["\\Seen"], { uid: true });
      } else {
        await client.messageFlagsRemove(uid, ["\\Seen"], { uid: true });
      }
      return { success: true };
    } finally {
      lock.release();
    }
  } catch (error: any) {
    console.error("[IMAP] toggleReadAction Error:", error.message);
    return { success: false, error: error.message };
  } finally {
    await client.logout();
  }
};

export const archiveMailAction = async (folderId: string, uid: string) => {
  const client = await getImapClient();
  try {
    await client.connect();
    const sourceFolder = await resolveFolder(client, folderId);

    // Try to resolve archive folder, create if doesn't exist
    let targetFolder = await resolveFolder(client, "archive");

    // If resolveFolder returned "archive" as-is, the folder wasn't found
    // Try to create it or use a common archive path
    if (targetFolder === "archive") {
      // Check if we need to create the folder
      const folders = await client.list();
      const archiveExists = folders.some(
        (f: any) =>
          f.name.toLowerCase() === "archive" || f.specialUse === "\\Archive",
      );

      if (!archiveExists) {
        // Create the Archive folder
        try {
          await client.mailboxCreate("Archive");
          targetFolder = "Archive";
        } catch (_createErr) {
          // If creation fails, try INBOX.Archive for some servers
          try {
            await client.mailboxCreate("INBOX.Archive");
            targetFolder = "INBOX.Archive";
          } catch {
            return {
              success: false,
              error: "Could not find or create Archive folder",
            };
          }
        }
      }
    }

    const lock = await client.getMailboxLock(sourceFolder);
    try {
      await client.messageMove(uid, targetFolder, { uid: true });
      return { success: true };
    } finally {
      lock.release();
    }
  } catch (error: any) {
    console.error("[IMAP] archiveMailAction Error:", error.message);
    return { success: false, error: error.message };
  } finally {
    await client.logout();
  }
};

// New action to move mail to any folder
export const moveMailAction = async (
  folderId: string,
  targetFolderSlug: string,
  uid: string,
) => {
  const client = await getImapClient();
  try {
    await client.connect();
    const sourceFolder = await resolveFolder(client, folderId);
    const targetFolder = await resolveFolder(client, targetFolderSlug);

    const lock = await client.getMailboxLock(sourceFolder);
    try {
      await client.messageMove(uid, targetFolder, { uid: true });
      return { success: true };
    } finally {
      lock.release();
    }
  } catch (error: any) {
    console.error("[IMAP] moveMailAction Error:", error.message);
    return { success: false, error: error.message };
  } finally {
    await client.logout();
  }
};

export const toggleStarAction = async (
  folderId: string,
  uid: string,
  starred: boolean,
) => {
  const client = await getImapClient();
  try {
    await client.connect();
    const targetFolder = await resolveFolder(client, folderId);
    const lock = await client.getMailboxLock(targetFolder);
    try {
      if (starred) {
        await client.messageFlagsAdd(uid, ["\\Flagged"], { uid: true });
      } else {
        await client.messageFlagsRemove(uid, ["\\Flagged"], { uid: true });
      }
      return { success: true };
    } finally {
      lock.release();
    }
  } catch (error: any) {
    console.error("[IMAP] toggleStarAction Error:", error.message);
    return { success: false, error: error.message };
  } finally {
    await client.logout();
  }
};

export const saveDraftAction = async (data: {
  to: string;
  subject: string;
  content: string;
}) => {
  const client = await getImapClient();
  try {
    await client.connect();
    const draftsFolder = await resolveFolder(client, "drafts");

    const mailOptions = {
      to: data.to,
      subject: data.subject,
      html: `<div style="font-family: sans-serif; white-space: pre-wrap;">${data.content}</div>`,
    };

    const mime = await buildMimeSource(mailOptions);

    await client.append(draftsFolder, mime);
    return { success: true };
  } catch (error: any) {
    console.error("[IMAP] saveDraftAction Error:", error.message);
    return { success: false, error: error.message };
  } finally {
    await client.logout();
  }
};

export const createFolderAction = async (name: string) => {
  const client = await getImapClient();
  try {
    await client.connect();
    await client.mailboxCreate(name);
    return { success: true };
  } catch (error: any) {
    console.error("[IMAP] createFolderAction Error:", error.message);
    try {
      await client.mailboxCreate("INBOX." + name);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  } finally {
    try { await client.logout(); } catch { client.close(); }
  }
};

export const deleteFolderAction = async (name: string) => {
  const client = await getImapClient();
  try {
    await client.connect();
    const targetFolder = await resolveFolder(client, name);
    await client.mailboxDelete(targetFolder);
    return { success: true };
  } catch (error: any) {
    console.error("[IMAP] deleteFolderAction Error:", error.message);
    return { success: false, error: error.message };
  } finally {
    try { await client.logout(); } catch { client.close(); }
  }
};

export const renameFolderAction = async (oldName: string, newName: string) => {
  const client = await getImapClient();
  try {
    await client.connect();
    const targetFolder = await resolveFolder(client, oldName);
    
    // Guess the path for the new folder based on the old folder's path
    let newPath = newName;
    if (targetFolder.includes('.')) {
      const parts = targetFolder.split('.');
      parts[parts.length - 1] = newName;
      newPath = parts.join('.');
    }
    
    await client.mailboxRename(targetFolder, newPath);
    return { success: true };
  } catch (error: any) {
    console.error("[IMAP] renameFolderAction Error:", error.message);
    return { success: false, error: error.message };
  } finally {
    try { await client.logout(); } catch { client.close(); }
  }
};
