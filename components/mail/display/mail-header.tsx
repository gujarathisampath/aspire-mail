import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Mail } from "@/lib/types";
import { format } from "date-fns";
import { ChevronDownIcon } from "lucide-react";

// ----------------------------------------------------------------------

interface Props {
  mail: Mail;
  currentUserEmail: string;
}

// ----------------------------------------------------------------------

export const MailDisplayHeader = ({ mail, currentUserEmail }: Props) => {
  const senderName = mail.from?.name || mail.from?.address || "Unknown";
  const senderInitials = senderName.charAt(0).toUpperCase();
  const toList = mail.to?.map((t) => t.address).join(", ") || "me";
  const hasCc = mail.cc && mail.cc.length > 0;
  

  const formattedSender = (() => {
    const recipients = mail.to
      .map((c) => {
        if (
          currentUserEmail &&
          c.address.toLowerCase() === currentUserEmail.toLowerCase()
        ) {
          return "me";
        }
        return c.name || c.address;
      })
      .join(", ");

    return recipients.length > 30 ? recipients.slice(0, 30) + "..." : recipients;
  })();
  return (
    <div className="flex flex-col gap-4 p-6 md:p-8 pb-4">
      {/* Sender Row */}
      <h1 className="text-lg md:text-xl font-semibold leading-tight pl-13">
        {mail.subject}
      </h1>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback className="text-sm font-medium bg-primary/10 text-primary">
              {senderInitials}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium">{senderName}</span>
            </div>
            <Collapsible>
              <div className="flex items-center gap-1 text-sm text-muted-foreground group">
                <span className="text-sm text-muted-foreground">
                  to {formattedSender}
                </span>
                {hasCc && (
                  <Badge variant="outline" className="text-[10px] h-4 px-1">
                    +{mail.cc!.length} CC
                  </Badge>
                )}
                <CollapsibleTrigger asChild>
                  <button className="ml-1 p-0.5 rounded-sm">
                    <ChevronDownIcon className="h-3 w-3 opacity-50 hover:opacity-100 transition-opacity" />
                  </button>
                </CollapsibleTrigger>
              </div>

              <CollapsibleContent className="mt-2 text-sm space-y-1 text-muted-foreground">
                <div>
                  <span className="font-medium text-foreground">From:</span>{" "}
                  {senderName} &lt;{mail.from.address}&gt;
                </div>
                <div>
                  <span className="font-medium text-foreground">To:</span>{" "}
                  {toList}
                </div>
                {hasCc && (
                  <div>
                    <span className="font-medium text-foreground">Cc:</span>{" "}
                    {mail.cc!.map((c) => c.name || c.address).join(", ")}
                  </div>
                )}
                <div>
                  <span className="font-medium text-foreground">Date:</span>{" "}
                  {format(
                    new Date(mail.date),
                    "EEEE, MMMM d, yyyy 'at' h:mm a",
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        <time className="text-xs text-muted-foreground shrink-0 tabular-nums">
          {format(new Date(mail.date), "MMM d, h:mm a")}
        </time>
      </div>
    </div>
  );
};
