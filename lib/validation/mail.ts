import { z } from "zod";

export const sendMailSchema = z.object({
  to: z.string().min(1, "Recipient is required"),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(1, "Content is required"),
  showCc: z.boolean(),
  showBcc: z.boolean(),
});

export type SendMailFormData = z.infer<typeof sendMailSchema>;
