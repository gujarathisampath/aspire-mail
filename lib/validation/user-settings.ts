import { z } from "zod";

export const folderSchema = z.object({
  name: z.string().min(1, "Name is required"),
  icon: z.string().optional(),
});

export type FolderData = z.infer<typeof folderSchema>;

export const identitySchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Invalid email address"),
  replyTo: z.string().email("Invalid reply-to email address").optional().or(z.literal("")),
  bcc: z.string().email("Invalid BCC email address").optional().or(z.literal("")),
  signature: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export type IdentityData = z.infer<typeof identitySchema>;

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  avatar: z.string().optional(),
});

export type ContactData = z.infer<typeof contactSchema>;
