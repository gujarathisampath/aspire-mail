"use client";

import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { Folder } from "@/lib/types";
import AppHeader from "./app-header";
import AppSidebar from "../sidebar/app-sidebar";

const MainLayout = ({
  children,
  initialFolders,
}: {
  children: React.ReactNode;
  initialFolders?: Folder[];
}) => {
  useKeyboardShortcuts();

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
