"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns/format";
import { useQuery } from "@tanstack/react-query";
import { Mail } from "@/lib/types";
import { getMailDetailsAction } from "@/lib/actions/mail";

interface UseMailComposeProps {
  mail: Mail | null;
  folderId: string;
  currentUserEmail?: string;
}

export const useMailCompose = ({
  mail,
  folderId,
  currentUserEmail,
}: UseMailComposeProps) => {
  const router = useRouter();

  const { data, isLoading: isContentLoading } = useQuery({
    queryKey: ["mail-details", folderId, mail?.id],
    queryFn: () => getMailDetailsAction(folderId, mail!.id),
    enabled: !!mail?.id,
    staleTime: Infinity,
  });

  const mailContent = data?.content || mail?.content || "";
  const attachments = data?.attachments || [];

  const onReply = useCallback(() => {
    if (!mail) return;
    const senderName = mail.from?.name || mail.from?.address || "Unknown";
    const query = new URLSearchParams({
      to: mail.from.address,
      subject: mail.subject.toLowerCase().startsWith("re:")
        ? mail.subject
        : `Re: ${mail.subject}`,
      content: `<br><br><div class="gmail_quote"><div dir="ltr" class="gmail_attr">On ${format(
        new Date(mail.date),
        "PPP p",
      )}, ${senderName} &lt;${
        mail.from.address
      }&gt; wrote:<br></div><blockquote class="gmail_quote" style="margin:0px 0px 0px 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex">${
        mailContent || mail.preview
      }</blockquote></div>`,
    });
    router.push(`/mail/compose?${query.toString()}`);
  }, [mail, mailContent, router]);

  const onReplyAll = useCallback(() => {
    if (!mail) return;
    const senderName = mail.from?.name || mail.from?.address || "Unknown";
    const toRecipients = new Set<string>();
    const ccRecipients = new Set<string>();

    toRecipients.add(mail.from.address.toLowerCase());
    mail.to?.forEach((r) => toRecipients.add(r.address.toLowerCase()));
    mail.cc?.forEach((r) => ccRecipients.add(r.address.toLowerCase()));

    if (currentUserEmail) {
      toRecipients.delete(currentUserEmail.toLowerCase());
      ccRecipients.delete(currentUserEmail.toLowerCase());
    }

    const query = new URLSearchParams({
      to: Array.from(toRecipients).join(", "),
      cc: Array.from(ccRecipients).join(", "),
      subject: mail.subject.toLowerCase().startsWith("re:")
        ? mail.subject
        : `Re: ${mail.subject}`,
      content: `<br><br><div class="gmail_quote"><div dir="ltr" class="gmail_attr">On ${format(
        new Date(mail.date),
        "PPP p",
      )}, ${senderName} &lt;${
        mail.from.address
      }&gt; wrote:<br></div><blockquote class="gmail_quote" style="margin:0px 0px 0px 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex">${
        mailContent || mail.preview
      }</blockquote></div>`,
    });
    router.push(`/mail/compose?${query.toString()}`);
  }, [mail, mailContent, currentUserEmail, router]);

  const onForward = useCallback(() => {
    if (!mail) return;
    const senderName = mail.from?.name || mail.from?.address || "Unknown";
    const query = new URLSearchParams({
      subject: mail.subject.toLowerCase().startsWith("fwd:")
        ? mail.subject
        : `Fwd: ${mail.subject}`,
      content: `<br><br>---------- Forwarded message ---------<br>From: <b>${senderName}</b> &lt;${
        mail.from.address
      }&gt;<br>Date: ${format(new Date(mail.date), "PPP p")}<br>Subject: ${
        mail.subject
      }<br>To: ${
        mail.to?.map((r) => r.address).join(", ") || ""
      }<br><br>${mailContent || mail.preview}`,
    });
    router.push(`/mail/compose?${query.toString()}`);
  }, [mail, mailContent, router]);

  return {
    onReply,
    onReplyAll,
    onForward,
    mailContent,
    isContentLoading,
    attachments,
  };
};
