import { z } from "zod";

export const serverSettingsSchema = z.object({
  imapHost: z.string().min(1, "IMAP Host is required"),
  imapPort: z.number().int().positive("IMAP Port must be a positive integer"),
  smtpHost: z.string().min(1, "SMTP Host is required"),
  smtpPort: z.number().int().positive("SMTP Port must be a positive integer"),
});

export type ServerSettingsData = z.infer<typeof serverSettingsSchema>;
