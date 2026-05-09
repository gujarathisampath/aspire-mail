"use client";

import { useState, useTransition } from "react";
import { Folder, Identity, Contact } from "@/lib/generated/prisma/client";
import { FolderSettings } from "./folder-settings";
import { IdentitySettings } from "./identity-settings";
import { ContactSettings } from "./contact-settings";
import { FolderIcon, User, Users, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { setSmartCategorizationEnabled } from "@/lib/actions/user-settings";
import { toast } from "sonner";
import Link from "next/link";

interface SettingsClientProps {
  initialData: {
    folders: Folder[];
    identities: Identity[];
    contacts: Contact[];
    smartCategorizationEnabled: boolean;
  };
  userEmail: string;
}

type SettingsTab = "identities" | "folders" | "contacts";

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: "identities", label: "Identities", icon: User },
  { id: "folders", label: "Folders", icon: FolderIcon },
  { id: "contacts", label: "Contacts", icon: Users },
];

export function SettingsClient({ initialData, userEmail }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("identities");
  const [smartCategorizationEnabled, setSmartCategorizationEnabledState] = useState(
    initialData.smartCategorizationEnabled,
  );
  const [isPending, startTransition] = useTransition();

  const handleSmartCategorizationChange = (enabled: boolean) => {
    setSmartCategorizationEnabledState(enabled);
    startTransition(async () => {
      try {
        await setSmartCategorizationEnabled(enabled);
        toast.success(enabled ? "Smart categorization enabled" : "Smart categorization disabled");
      } catch (error: any) {
        setSmartCategorizationEnabledState(!enabled);
        toast.error(error.message || "Failed to update categorization setting");
      }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/mail/inbox">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold">Settings</h1>
              <p className="text-sm text-muted-foreground">{userEmail}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b">
        <div className="max-w-5xl mx-auto px-6">
          <nav className="flex gap-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 py-3 border-b-2 text-sm font-medium transition-colors",
                    activeTab === tab.id
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-6">
        <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold">Smart categorization</h2>
            <p className="text-sm text-muted-foreground">
              Split Inbox into Primary, Promotions, Social, and Updates.
            </p>
          </div>
          <Switch
            checked={smartCategorizationEnabled}
            onCheckedChange={handleSmartCategorizationChange}
            disabled={isPending}
          />
        </div>
      </div>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {activeTab === "identities" && (
          <IdentitySettings initialIdentities={initialData.identities} />
        )}
        {activeTab === "folders" && (
          <FolderSettings initialFolders={initialData.folders} />
        )}
        {activeTab === "contacts" && (
          <ContactSettings initialContacts={initialData.contacts} />
        )}
      </main>
    </div>
  );
}
