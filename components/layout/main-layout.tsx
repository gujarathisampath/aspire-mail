"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { Folder } from "@/lib/types";
import AppHeader from "./app-header";
import AppSidebar from "../sidebar/app-sidebar";

const MainLayout = ({
  children,
  initialFolders,
  user,
}: {
  children: React.ReactNode;
  initialFolders?: Folder[];
  user?: { email: string; name: string } | null;
}) => {
  const pathname = usePathname();
  useKeyboardShortcuts();

  useEffect(() => {
    if (user && initialFolders) {
      const parts = pathname.split("/");
      const currentSlug = parts[2] || "inbox";

      const folder =
        initialFolders.find((f) => f.slug === currentSlug) ||
        initialFolders.find(
          (f) => f.name.toLowerCase() === currentSlug.toLowerCase(),
        );

      if (folder) {
        const count = folder.unreadCount > 0 ? ` (${folder.unreadCount})` : "";
        const displayName = folder.slug === "inbox" ? "Inbox" : folder.name;
        document.title = `${displayName}${count} — ${user.email}`;
      } else {
        document.title = `Mail — ${user.email}`;
      }
    }
  }, [pathname, user, initialFolders]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar initialFolders={initialFolders} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-hidden relative">{children}</main>
      </div>
    </div>
  );
};

export default MainLayout;
