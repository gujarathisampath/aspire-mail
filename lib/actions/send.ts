"use server";

import nodemailer from "nodemailer";
import { cookies } from "next/headers";
import { APP_CONFIG } from "@/lib/config";
import { getImapClient, resolveFolder, buildMimeSource } from "./mail";
import { getDefaultIdentity } from "./user-settings";

export interface AttachmentData {
  filename: string;
  content: string;
  contentType: string;
}

export interface SendMailData {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  content: string;
  attachments?: AttachmentData[];
  // Optional: override identity settings
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
}

export const sendMailAction = async (data: SendMailData) => {
  const cookieStore = await cookies();
  const session = cookieStore.get("mail-session");

  if (!session) {
    return { success: false, error: "No active session." };
  }

  const { email, password } = JSON.parse(session.value);
  const domain = email.split("@")[1];
  const { host, port, secure, rejectUnauthorized } = APP_CONFIG.server.smtp;
  const smtpHost = host || `smtp.${domain}`;

  // Get default identity for sender info
  let senderName = email.split("@")[0];
  let senderEmail = email;
  let replyTo = data.replyTo;
  let autoBcc = data.bcc;

  try {
    const defaultIdentity = await getDefaultIdentity();
    if (defaultIdentity) {
      senderName = defaultIdentity.name || senderName;
      senderEmail = defaultIdentity.email || senderEmail;
      replyTo = replyTo || defaultIdentity.replyTo || undefined;
      // Merge BCC: include both user-specified and identity's auto-BCC
      if (defaultIdentity.bcc) {
        autoBcc = autoBcc ? `${autoBcc}, ${defaultIdentity.bcc}` : defaultIdentity.bcc;
      }
    }
  } catch (e) {
    // If fetching identity fails, continue with defaults
    console.warn("[SMTP] Could not fetch default identity, using session email");
  }

  // Allow overriding from data
  if (data.fromName) senderName = data.fromName;
  if (data.fromEmail) senderEmail = data.fromEmail;

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: port,
    secure: secure,
    auth: {
      user: email,
      pass: password,
    },
    tls: {
      rejectUnauthorized: rejectUnauthorized,
    },
  });

  try {
    await transporter.verify();

    const attachments = data.attachments?.map((att) => ({
      filename: att.filename,
      content: att.content,
      encoding: "base64",
      contentType: att.contentType,
    }));

    const mailOptions: any = {
      from: `"${senderName}" <${senderEmail}>`,
      to: data.to,
      cc: data.cc,
      bcc: autoBcc,
      subject: data.subject,
      text: data.content,
      html: `<div style="font-family: sans-serif; white-space: pre-wrap;">${data.content}</div>`,
      attachments: attachments,
    };

    // Set Reply-To if specified
    if (replyTo) {
      mailOptions.replyTo = replyTo;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP] Message sent: ${info.messageId}`);

    // Store in Sent folder via IMAP
    try {
      const imapClient = await getImapClient();
      await imapClient.connect();
      const sentFolder = await resolveFolder(imapClient, "sent");

      const mailSource = await buildMimeSource(mailOptions);

      await imapClient.append(sentFolder, mailSource, ["\\Seen"]);
      console.log(`[IMAP] Message appended to ${sentFolder}`);
      await imapClient.logout();
    } catch (imapErr: any) {
      console.error(
        `[IMAP] Failed to store in Sent folder: ${imapErr.message}`,
      );
      // Don't fail the whole action if only IMAP append fails
    }

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[SMTP] Error: ${error.message}`);
    return { success: false, error: error.message };
  }
};
