"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { Mail } from "@/lib/types";
import { useMailActions } from "@/hooks/use-mail-actions";

import { MailDisplayToolbar } from "./display/mail-toolbar";
import { MailDisplayHeader } from "./display/mail-header";
import { MailDisplayContent } from "./display/mail-content";
import { MailReplyFooter } from "./display/mail-reply-footer";
import { MailDisplayEmpty } from "./display/mail-empty";
import { TooltipProvider } from "@/components/ui/tooltip";

interface Props {
  mail: Mail | null;
  currentUserEmail: string;
}

const MailDisplay = ({ mail, currentUserEmail }: Props) => {
  const params = useParams();
  const rawFolder = (params.folder as string) || "INBOX";
  const folderId = decodeURIComponent(rawFolder);

  const { toggleReadMutation } = useMailActions({ mail, folderId, currentUserEmail });

  // Auto-mark as read when mail is opened
  useEffect(() => {
    if (mail && !mail.read && !toggleReadMutation.isPending) {
      toggleReadMutation.mutate({ seen: true, silent: true });
    }
  }, [mail?.id, mail?.read, toggleReadMutation]);

  if (!mail) {
    return <MailDisplayEmpty />;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full flex-col bg-background">
        <MailDisplayToolbar
          mail={mail}
          folderId={folderId}
          currentUserEmail={currentUserEmail}
          toggleReadMutation={toggleReadMutation}
        />

        <div className="flex-1 overflow-y-auto">
          <MailDisplayHeader mail={mail} currentUserEmail={currentUserEmail} />
          <MailDisplayContent mail={mail} folderId={folderId} currentUserEmail={currentUserEmail} />
        </div>

        <MailReplyFooter mail={mail} folderId={folderId} />
      </div>
    </TooltipProvider>
  );
};

export default MailDisplay;
