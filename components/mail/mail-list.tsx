"use client";

import {
  useSearchParams,
  useRouter,
  usePathname,
  useParams,
} from "next/navigation";
import { Mail } from "@/lib/types";
import { cn } from "@/lib/utils";

import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useMemo } from "react";
import { MailIcon, StarIcon, PaperclipIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getMailDetailsAction } from "@/lib/actions/mail";

interface Props {
  mails: Mail[];
  currentUserEmail?: string;
}

type FilterType = "all" | "unread" | "read";

const MailList = ({ mails, currentUserEmail }: Props) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const queryClient = useQueryClient();

  const rawFolder = (params.folder as string) || "INBOX";
  const folderId = decodeURIComponent(rawFolder);
  const selectedId = searchParams.get("id");

  const query = searchParams.get("q") || "";
  const [filter, setFilter] = useState<FilterType>("all");

  const handlePrefetch = (uid: string) => {
    queryClient.prefetchQuery({
      queryKey: ["mail-details", folderId, uid, currentUserEmail],
      queryFn: () => getMailDetailsAction(folderId, uid),
      staleTime: Infinity,
    });
  };

  const handleSelect = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("id", id);
    router.replace(`${pathname}?${params.toString()}`);
  };
  const filteredMails = useMemo(() => {
    return mails.filter((mail) => {
      const matchesSearch =
        mail.subject.toLowerCase().includes(query.toLowerCase()) ||
        mail.from.name?.toLowerCase().includes(query.toLowerCase()) ||
        mail.from.address.toLowerCase().includes(query.toLowerCase());

      const matchesFilter =
        filter === "all" ? true : filter === "unread" ? !mail.read : mail.read;

      return matchesSearch && matchesFilter;
    });
  }, [mails, query, filter]);

  const filters: { value: FilterType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "unread", label: "Unread" },
    { value: "read", label: "Read" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 space-y-3 border-b shrink-0">
        {/* Filter Tabs - matching design system */}
        <div className="flex items-center gap-1 p-1 rounded-lg border bg-card">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
                filter === f.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mail List */}
      <ScrollArea className="flex-1">
        {filteredMails.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <MailIcon className="h-10 w-10 mb-4 opacity-20" />
            <p className="text-sm font-medium">No messages found</p>
            <p className="text-xs">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredMails.map((mail) => {
              const isSelected = selectedId === mail.id;
              
              // Determine display name based on folder
              let displayName = "";
              const isSent = folderId === "sent" || rawFolder.toLowerCase() === "sent";

              if (isSent) {
                if (mail.to && mail.to.length > 0) {
                   const names = mail.to.map((t) => t.name || t.address).join(", ");
                   displayName = `To: ${names}`;
                } else {
                   displayName = "To: Unknown";
                }
              } else {
                displayName = mail.from?.name || mail.from?.address || "Unknown";
              }

              // Format date
              const date = new Date(mail.date);
              const now = new Date();
              let dateDisplay = "";
              if (date.toDateString() === now.toDateString()) {
                dateDisplay = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
              } else if (date.getFullYear() === now.getFullYear()) {
                dateDisplay = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
              } else {
                dateDisplay = date.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: 'numeric' });
              }

              return (
                <button
                  key={mail.id}
                  onClick={() => handleSelect(mail.id)}
                  onMouseEnter={() => handlePrefetch(mail.id)}
                  className={cn(
                    "flex flex-col gap-1 p-4 text-left border-b transition-all duration-200 group",
                    isSelected 
                      ? "bg-primary/5 border-l-2 border-l-primary" 
                      : "hover:bg-muted/50 border-l-2 border-l-transparent",
                    !mail.read && !isSelected && "bg-muted",
                  )}
                >
                  <div className="flex items-start justify-between gap-3 w-full">
                    {/* Top Row: Name and Date */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span
                        className={cn(
                          "text-sm truncate",
                          !mail.read
                            ? "font-semibold text-foreground"
                            : "font-medium text-muted-foreground",
                        )}
                      >
                        {displayName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
                       {mail.hasAttachments && (
                         <PaperclipIcon className="h-3 w-3" />
                       )}
                       <span>{dateDisplay}</span>
                    </div>
                  </div>

                  {/* Middle Row: Subject */}
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                     <span
                       className={cn(
                         "text-sm flex-1",
                         !mail.read ? "font-medium text-foreground" : "text-muted-foreground",
                       )}
                     >
                       {mail.subject}
                     </span>
                     {mail.starred && (
                        <StarIcon className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500 shrink-0" />
                      )}
                  </div>

                  {/* Bottom Row: Preview */}
                  <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5 font-normal">
                    {mail.preview}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default MailList;
