"use client";

import { ReplyIcon, ForwardIcon, ReplyAllIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Mail } from "@/lib/types";
import { useMailCompose } from "@/hooks/use-mail-compose";

// ----------------------------------------------------------------------

interface Props {
  mail: Mail;
  folderId: string;
}

// ----------------------------------------------------------------------

export const MailReplyFooter = ({ mail, folderId }: Props) => {
  const { onReply, onReplyAll, onForward } = useMailCompose({ mail, folderId });

  const hasMultipleRecipients =
    (mail.to?.length ?? 0) > 1 || (mail.cc?.length ?? 0) > 0;

  return (
    <div className="border-t bg-muted/30 p-4 shrink-0">
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={onReply} className="gap-2">
          <ReplyIcon className="h-4 w-4" />
          Reply
        </Button>

        {hasMultipleRecipients && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onReplyAll}
            className="gap-2"
          >
            <ReplyAllIcon className="h-4 w-4" />
            Reply all
          </Button>
        )}

        <Button
          variant="secondary"
          size="sm"
          onClick={onForward}
          className="gap-2"
        >
          <ForwardIcon className="h-4 w-4" />
          Forward
        </Button>
      </div>
    </div>
  );
};
