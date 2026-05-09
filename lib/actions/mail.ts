"use server";

import { ImapFlow } from "imapflow";
import { cookies } from "next/headers";
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
    throw new Error("No active session. Please log in.");
  }

  const { email, password } = JSON.parse(session.value);
  const domain = email.split("@")[1];
  const { host, port, secure, rejectUnauthorized } = APP_CONFIG.server.imap;
  const imapHost = host || `mail.${domain}`;

  return new ImapFlow({
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
      const message = await client.fetchOne(
        uid,
        { source: true, bodyStructure: true },
        { uid: true },
      );

      if (message) {
        if (message.source) {
          const parsed = await simpleParser(message.source);
          content = parsed.html || parsed.textAsHtml || parsed.text || "";
        }

        const findAttachments = (part: any) => {
          if (
            part.disposition?.toLowerCase() === "attachment" ||
            part.parameters?.name ||
            part.parameters?.filename
          ) {
            attachments.push({
              id: part.part,
              filename:
                part.parameters?.filename || part.parameters?.name || "unnamed",
              contentType: part.contentType,
              size: part.size,
              contentId: part.contentId,
            });
          }
          if (part.childNodes) {
            part.childNodes.forEach(findAttachments);
          }
        };
        if (message.bodyStructure) findAttachments(message.bodyStructure);
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

  const folders = await client.list();

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
    const found = folders.find((f) => f.specialUse === targetAttribute);
    if (found) return found.path;
  }

  const foundByDirectName = folders.find(
    (f) =>
      f.name.toLowerCase() === normalizedSlug ||
      f.path.toLowerCase() === normalizedSlug,
  );
  if (foundByDirectName) return foundByDirectName.path;

  const foundByKeyword = folders.find(
    (f) =>
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
        const status = await client.status(targetFolder, { messages: true });
        const total = status.messages || 0;
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
            bodyStructure: true,
          },
          { uid: Array.isArray(range) },
        )) {
          if (message.envelope && message.uid) {
            // Check for attachments in bodyStructure
            let hasAttachments = false;
            if (message.bodyStructure) {
              const checkPart = (part: any) => {
                if (part.disposition === "attachment") {
                  hasAttachments = true;
                  return;
                }
                if (part.childNodes) {
                  part.childNodes.forEach(checkPart);
                }
              };
              checkPart(message.bodyStructure);
            }

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
                message.envelope.to?.map((t) => ({
                  name: cleanName(t.name),
                  address: t.address || "",
                })) || [],
              cc: message.envelope.cc?.map((t) => ({
                name: cleanName(t.name),
                address: t.address || "",
              })),
              bcc: message.envelope.bcc?.map((t) => ({
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
    // List all folders first
    const mailboxes = await client.list();

    const folders: Folder[] = [];
    const reverseSpecialUseMap: Record<string, string> = {
      "\\Inbox": "inbox",
      "\\Sent": "sent",
      "\\Drafts": "drafts",
      "\\Trash": "trash",
      "\\Junk": "junk",
      "\\Archive": "archive",
      "\\Flagged": "starred",
    };

    for (const mailbox of mailboxes) {
      if (
        mailbox.flags.has("\\Noselect") &&
        !mailbox.flags.has("\\HasChildren")
      )
        continue;

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

        folders.push({
          id: mailbox.path,
          name: mailbox.name || mailbox.path,
          slug,
          unreadCount: status?.unseen || 0,
          totalCount: status?.messages || 0,
        });
      } catch {
        // Skip inaccessible folders
      }
    }

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
        (f) =>
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