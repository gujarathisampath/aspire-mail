"use server";

import { prisma } from "@/lib/prisma";
import { getSessionAction } from "./auth";
import { FolderData, IdentityData, ContactData, folderSchema, identitySchema, contactSchema } from "@/lib/validation/user-settings";
import { revalidatePath } from "next/cache";
import { getImapClient } from "./mail";

async function getUser() {
  const session = await getSessionAction();
  if (!session || !session.email) {
    throw new Error("Unauthorized");
  }

  let user = await prisma.user.findUnique({
    where: { email: session.email },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: session.email,
        name: session.name,
      },
    });
  }
  return user;
}

export async function getSettings() {
  const user = await getUser();
  
  const folders = await prisma.folder.findMany({ where: { userEmail: user.email } });
  const identities = await prisma.identity.findMany({ where: { userEmail: user.email }, orderBy: { isDefault: 'desc' } });
  const contacts = await prisma.contact.findMany({ where: { userEmail: user.email } });

  return {
    folders,
    identities,
    contacts,
    smartCategorizationEnabled: user.smartCategorizationEnabled,
  };
}

export async function getDefaultIdentity() {
  const user = await getUser();
  
  const identity = await prisma.identity.findFirst({
    where: { userEmail: user.email, isDefault: true },
  });
  
  return identity;
}

// ============================================================
// FOLDERS - Synced with IMAP server
// ============================================================

export async function createFolder(data: FolderData) {
  const user = await getUser();
  const valid = folderSchema.parse(data);
  
  // Check if folder already exists in database
  const existing = await prisma.folder.findFirst({
    where: { userEmail: user.email, name: valid.name },
  });
  
  if (existing) {
    throw new Error("A folder with this name already exists");
  }
  
  // Create folder on IMAP server first
  const client = await getImapClient();
  try {
    await client.connect();
    
    // Try to create the folder on IMAP
    await client.mailboxCreate(valid.name);
    
    // If IMAP creation succeeds, store in local database
    await prisma.folder.create({
      data: {
        name: valid.name,
        icon: valid.icon,
        userEmail: user.email,
      },
    });
    
    revalidatePath("/settings");
    revalidatePath("/mail");
  } catch (error: any) {
    console.error("[IMAP] createFolder Error:", error.message);
    
    // Check if it's a "folder already exists" error from IMAP
    if (error.message?.includes("ALREADYEXISTS") || error.message?.includes("already exists")) {
      throw new Error("This folder already exists on the mail server");
    }
    
    throw new Error(`Failed to create folder: ${error.message}`);
  } finally {
    try {
      await client.logout();
    } catch {
      client.close();
    }
  }
}

export async function deleteFolder(id: string) {
  const user = await getUser();
  
  // Get folder from database first
  const folder = await prisma.folder.findUnique({
    where: { id, userEmail: user.email },
  });
  
  if (!folder) {
    throw new Error("Folder not found");
  }
  
  // Delete from IMAP server
  const client = await getImapClient();
  try {
    await client.connect();
    
    // Try to delete the folder on IMAP
    await client.mailboxDelete(folder.name);
    
    // If IMAP deletion succeeds, remove from local database
    await prisma.folder.delete({
      where: { id, userEmail: user.email },
    });
    
    revalidatePath("/settings");
    revalidatePath("/mail");
  } catch (error: any) {
    console.error("[IMAP] deleteFolder Error:", error.message);
    throw new Error(`Failed to delete folder: ${error.message}`);
  } finally {
    try {
      await client.logout();
    } catch {
      client.close();
    }
  }
}

export async function updateFolder(id: string, data: Partial<FolderData>) {
  const user = await getUser();
  
  // Get existing folder
  const folder = await prisma.folder.findUnique({
    where: { id, userEmail: user.email },
  });
  
  if (!folder) {
    throw new Error("Folder not found");
  }
  
  // If name is changing, rename on IMAP server
  if (data.name && data.name !== folder.name) {
    const client = await getImapClient();
    try {
      await client.connect();
      
      // Rename the folder on IMAP
      await client.mailboxRename(folder.name, data.name);
      
      // Update local database
      await prisma.folder.update({
        where: { id, userEmail: user.email },
        data: {
          name: data.name,
          icon: data.icon ?? folder.icon,
        },
      });
      
      revalidatePath("/settings");
      revalidatePath("/mail");
    } catch (error: any) {
      console.error("[IMAP] renameFolder Error:", error.message);
      throw new Error(`Failed to rename folder: ${error.message}`);
    } finally {
      try {
        await client.logout();
      } catch {
        client.close();
      }
    }
  } else {
    // Only updating icon (local-only property)
    await prisma.folder.update({
      where: { id, userEmail: user.email },
      data,
    });
    revalidatePath("/settings");
  }
}

// ============================================================
// IDENTITIES - Used for sending emails via SMTP
// ============================================================

export async function createIdentity(data: IdentityData) {
  const user = await getUser();
  const valid = identitySchema.parse(data);

  if (valid.isDefault) {
    await prisma.identity.updateMany({
      where: { userEmail: user.email },
      data: { isDefault: false },
    });
  }

  await prisma.identity.create({
    data: {
      ...valid,
      userEmail: user.email,
    },
  });
  revalidatePath("/settings");
}

export async function updateIdentity(id: string, data: IdentityData) {
  const user = await getUser();
  const valid = identitySchema.parse(data);

  if (valid.isDefault) {
    await prisma.identity.updateMany({
      where: { userEmail: user.email },
      data: { isDefault: false },
    });
  }

  await prisma.identity.update({
    where: { id, userEmail: user.email },
    data: valid,
  });
  revalidatePath("/settings");
}

export async function deleteIdentity(id: string) {
  const user = await getUser();
  await prisma.identity.delete({
    where: { id, userEmail: user.email },
  });
  revalidatePath("/settings");
}

export async function setDefaultIdentity(id: string) {
  const user = await getUser();
  
  await prisma.$transaction([
    prisma.identity.updateMany({
      where: { userEmail: user.email },
      data: { isDefault: false },
    }),
    prisma.identity.update({
      where: { id, userEmail: user.email },
      data: { isDefault: true },
    }),
  ]);
  revalidatePath("/settings");
}

export async function setSmartCategorizationEnabled(enabled: boolean) {
  const user = await getUser();

  await prisma.user.update({
    where: { email: user.email },
    data: { smartCategorizationEnabled: enabled },
  });

  revalidatePath("/settings");
  revalidatePath("/mail");
}

// ============================================================
// CONTACTS - Local address book (no IMAP sync needed)
// ============================================================

export async function createContact(data: ContactData) {
  const user = await getUser();
  const valid = contactSchema.parse(data);

  await prisma.contact.create({
    data: {
      ...valid,
      userEmail: user.email,
    },
  });
  revalidatePath("/settings");
}

export async function updateContact(id: string, data: ContactData) {
  const user = await getUser();
  const valid = contactSchema.parse(data);

  await prisma.contact.update({
    where: { id, userEmail: user.email },
    data: valid,
  });
  revalidatePath("/settings");
}

export async function deleteContact(id: string) {
  const user = await getUser();
  await prisma.contact.delete({
    where: { id, userEmail: user.email },
  });
  revalidatePath("/settings");
}

export async function searchContacts(query: string) {
  const user = await getUser();
  
  if (!query || query.length < 2) {
    return [];
  }
  
  const contacts = await prisma.contact.findMany({
    where: {
      userEmail: user.email,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ],
    },
    take: 10,
  });
  
  return contacts;
}
