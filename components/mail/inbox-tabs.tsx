"use client";

import { useState, useMemo } from "react";
import { Mail, MailCategory } from "@/lib/types";
import { categorizeMails } from "@/lib/utils/categorize";
import { cn } from "@/lib/utils";
import {
  InboxIcon,
  TagIcon,
  UsersIcon,
  BellIcon,
} from "lucide-react";

interface Tab {
  key: MailCategory;
  label: string;
  icon: React.ElementType;
  description: string;
}

const TABS: Tab[] = [
  {
    key: "primary",
    label: "Primary",
    icon: InboxIcon,
    description: "Personal and direct emails",
  },
  {
    key: "promotions",
    label: "Promotions",
    icon: TagIcon,
    description: "Deals, offers and newsletters",
  },
  {
    key: "social",
    label: "Social",
    icon: UsersIcon,
    description: "Notifications from social networks",
  },
  {
    key: "updates",
    label: "Updates",
    icon: BellIcon,
    description: "Receipts, alerts and confirmations",
  },
];

interface Props {
  mails: Mail[];
  enabled?: boolean;
  children: (filteredMails: Mail[]) => React.ReactNode;
}

export const InboxTabs = ({ mails, enabled = true, children }: Props) => {
  const [activeTab, setActiveTab] = useState<MailCategory>("primary");

  const categorized = useMemo(() => categorizeMails(mails), [mails]);

  if (!enabled) {
    return <div className="flex flex-col h-full">{children(mails)}</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab Bar */}
      <div className="flex border-b shrink-0 bg-background overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const count = categorized[tab.key].length;
          const unread = categorized[tab.key].filter((m) => !m.read).length;
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap",
                "border-b-2 transition-all duration-200 relative",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
              )}
              title={tab.description}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
              {count > 0 && (
                <span
                  className={cn(
                    "inline-flex items-center justify-center rounded-full text-[10px] font-semibold px-1",
                    isActive
                      ? unread > 0
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary/20 text-primary"
                      : unread > 0
                        ? "bg-muted-foreground/20 text-muted-foreground"
                        : "bg-muted text-muted-foreground/60",
                  )}
                  style={{ minWidth: 18, height: 18 }}
                >
                  {unread > 0 ? unread : count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {children(categorized[activeTab])}
      </div>
    </div>
  );
};
