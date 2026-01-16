"use server";

import nodemailer from "nodemailer";
import { cookies } from "next/headers";
import { APP_CONFIG } from "@/lib/config";
import { getImapClient, resolveFolder, buildMimeSource } from "./mail";

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

    const mailOptions = {
      from: `"${email.split("@")[0]}" <${email}>`,
      to: data.to,
      cc: data.cc,
      bcc: data.bcc,
      subject: data.subject,
      text: data.content,
      html: `<div style="font-family: sans-serif; white-space: pre-wrap;">${data.content}</div>`,
      attachments: attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP] Message sent: ${info.messageId}`);

    // Store in Sent folder via IMAP
    try {
      const imapClient = await getImapClient();
      await imapClient.connect();
      const sentFolder = await resolveFolder(imapClient, "sent");

      // Building MIME manually for append since we already sent it
      // Alternatively, we could use transporter.sendMail's result if it provided the full source
      // But nodemailer's buildEML is not public. We can use the mailOptions to build it.

      const mailSource = await buildMimeSource(mailOptions);

      await imapClient.append(sentFolder, mailSource, ["\\Seen"]);
      console.log(`[IMAP] Message appended to ${sentFolder}`);
      await imapClient.logout();
    } catch (imapErr: any) {
      console.error(
        `[IMAP] Failed to store in Sent folder: ${imapErr.message}`,
      );
      // Don't fail the whole action if only IMAP append fails, but log it
    }

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[SMTP] Error: ${error.message}`);
    return { success: false, error: error.message };
  }
};
