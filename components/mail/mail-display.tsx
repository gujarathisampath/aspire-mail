"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Mail } from "@/lib/types";
import { useMailActions } from "@/hooks/use-mail-actions";
import { getMailDetailsAction } from "@/lib/actions/mail";

import { MailDisplayToolbar } from "./display/mail-toolbar";
import { MailDisplayHeader } from "./display/mail-header";
import { MailDisplayContent } from "./display/mail-content";
import { MailReplyFooter } from "./display/mail-reply-footer";
import { MailDisplayEmpty } from "./display/mail-empty";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2Icon } from "lucide-react";

interface Props {
  mail: Mail | null;
  currentUserEmail: string;
}

const MailDisplay = ({ mail, currentUserEmail }: Props) => {
  const params = useParams();
  const rawFolder = (params.folder as string) || "INBOX";
  const folderId = decodeURIComponent(rawFolder);

  const { data: details, isPending } = useQuery({
    queryKey: ["mail-details", folderId, mail?.id, currentUserEmail],
    queryFn: () => getMailDetailsAction(folderId, mail!.id),
    enabled: !!mail,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

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

  if (isPending) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8 text-muted-foreground">
        <div className="flex items-center gap-2">
          <Loader2Icon className="h-5 w-5 animate-spin text-primary" />
          <span>Loading message...</span>
        </div>
      </div>
    );
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
          <MailDisplayContent
            mail={mail}
            folderId={folderId}
            currentUserEmail={currentUserEmail}
            content={details?.content ?? ""}
            attachments={details?.attachments ?? []}
          />
        </div>

        <MailReplyFooter mail={mail} folderId={folderId} />
      </div>
    </TooltipProvider>
  );
};

export default MailDisplay;
