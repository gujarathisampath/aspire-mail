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
}

// ----------------------------------------------------------------------

export const MailDisplayHeader = ({ mail }: Props) => {
  const senderName = mail.from?.name || mail.from?.address || "Unknown";
  const senderInitials = senderName.charAt(0).toUpperCase();
  const toList = mail.to?.map((t) => t.name || t.address).join(", ") || "me";
  const hasCc = mail.cc && mail.cc.length > 0;

  return (
    <div className="flex flex-col gap-4 p-6 md:p-8 pb-4">
      {/* Sender Row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarFallback className="text-sm font-medium bg-primary/10 text-primary">
              {senderInitials}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{senderName}</span>
            </div>

            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors group">
                <span>
                  to {toList.length > 30 ? toList.slice(0, 30) + "..." : toList}
                </span>
                {hasCc && (
                  <Badge variant="outline" className="text-[10px] h-4 px-1">
                    +{mail.cc!.length} CC
                  </Badge>
                )}
                <ChevronDownIcon className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
              </CollapsibleTrigger>

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

        <time className="text-xs text-muted-foreground flex-shrink-0 tabular-nums">
          {format(new Date(mail.date), "MMM d, h:mm a")}
        </time>
      </div>

      {/* Subject */}
      <h1 className="text-lg md:text-xl font-semibold leading-tight">
        {mail.subject}
      </h1>
    </div>
  );
};
