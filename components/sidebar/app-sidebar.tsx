"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  InboxIcon,
  SendIcon,
  FileIcon,
  Trash2Icon,
  ArchiveIcon,
  AlertCircleIcon,
  PenSquareIcon,
  Loader2Icon,
  StarIcon,
  LogOutIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFoldersAction, getMailsAction, createFolderAction, deleteFolderAction, renameFolderAction } from "@/lib/actions/mail";
import { getSessionAction } from "@/lib/actions/auth";
import { useAuthStore } from "@/lib/store/auth-store";
import { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

const FOLDER_ICONS: Record<string, any> = {
  inbox: InboxIcon,
  sent: SendIcon,
  drafts: FileIcon,
  archive: ArchiveIcon,
  junk: AlertCircleIcon,
  trash: Trash2Icon,
  starred: StarIcon,
};

import { Folder } from "@/lib/types";
import { Avatar, AvatarFallback } from "../ui/avatar";

const AppSidebar = ({
  initialFolders,
  defaultCollapsed = false,
}: {
  initialFolders?: Folder[];
  defaultCollapsed?: boolean;
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { clearAuth } = useAuthStore();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isRenameFolderOpen, setIsRenameFolderOpen] = useState(false);
  const [folderToRename, setFolderToRename] = useState<{oldName: string, newName: string} | null>(null);
  const [isRenamingFolder, setIsRenamingFolder] = useState(false);

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: () => getSessionAction(),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const { data: folders, isLoading } = useQuery({
    queryKey: ["folders", session?.email],
    queryFn: () => getFoldersAction(),
    initialData: initialFolders,
    refetchInterval: 60000,
    enabled: !!session?.email,
  });

  const [prefetchTimeout, setPrefetchTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );

  const handlePrefetch = (slug: string) => {
    if (prefetchTimeout) clearTimeout(prefetchTimeout);
    if (!session?.email) return;

    const timeout = setTimeout(() => {
      queryClient.prefetchQuery({
        queryKey: ["mails", slug, "", session.email],
        queryFn: () => getMailsAction(slug),
        staleTime: 30 * 1000,
      });
    }, 100);

    setPrefetchTimeout(timeout);
  };

  useEffect(() => {
    return () => {
      if (prefetchTimeout) clearTimeout(prefetchTimeout);
    };
  }, [prefetchTimeout]);

  const logoutMutation = useMutation({
    mutationFn: () => fetch("/api/auth/logout", { method: "POST" }),
    onSuccess: () => {
      clearAuth();
      queryClient.removeQueries();
      queryClient.clear();
      router.replace("/login");
      router.refresh();
    },
  });

  const toggleCollapsed = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    document.cookie = `sidebar-collapsed=${newState}; path=/; max-age=31536000; SameSite=Lax`;
    localStorage.setItem("sidebar-collapsed", String(newState));
  };

  const clearPrefetch = () => {
    if (prefetchTimeout) clearTimeout(prefetchTimeout);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setIsCreatingFolder(true);
    try {
      const res = await createFolderAction(newFolderName.trim());
      if (res.success) {
        toast.success("Folder created successfully");
        setNewFolderName("");
        setIsCreateFolderOpen(false);
        queryClient.invalidateQueries({ queryKey: ["folders"] });
      } else {
        toast.error(res.error || "Failed to create folder");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to create folder");
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleDeleteFolder = async (folderSlug: string) => {
    if (!confirm(`Are you sure you want to delete the folder?`)) return;
    try {
      const res = await deleteFolderAction(folderSlug);
      if (res.success) {
        toast.success("Folder deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["folders"] });
        if (pathname === `/mail/${folderSlug}`) {
          router.push("/mail/inbox");
        }
      } else {
        toast.error(res.error || "Failed to delete folder");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to delete folder");
    }
  };

  const handleRenameFolder = async () => {
    if (!folderToRename || !folderToRename.newName.trim()) return;
    setIsRenamingFolder(true);
    try {
      const res = await renameFolderAction(folderToRename.oldName, folderToRename.newName.trim());
      if (res.success) {
        toast.success("Folder renamed successfully");
        setIsRenameFolderOpen(false);
        setFolderToRename(null);
        queryClient.invalidateQueries({ queryKey: ["folders"] });
        if (pathname === `/mail/${folderToRename.oldName}`) {
           router.push("/mail/inbox");
        }
      } else {
        toast.error(res.error || "Failed to rename folder");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to rename folder");
    } finally {
      setIsRenamingFolder(false);
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex h-full flex-col border-r bg-muted/40 transition-all duration-200",
          collapsed ? "w-16" : "w-64",
        )}
      >
        {/* Compose Button */}
        <div className="p-3">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" className="w-full" asChild>
                  <Link href="/mail/compose">
                    <PenSquareIcon className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Compose</TooltipContent>
            </Tooltip>
          ) : (
            <Button className="w-full gap-2" asChild>
              <Link href="/mail/compose">
                <PenSquareIcon className="h-4 w-4" />
                Compose
              </Link>
            </Button>
          )}
        </div>

        <Separator />

        {/* Folder Navigation */}
        <div className="flex items-center justify-between p-2">
          {!collapsed && (
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-2">
              Folders
            </span>
          )}
          <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className={cn("h-6 w-6", collapsed && "mx-auto w-full mb-2")}>
                <PlusIcon className="h-4 w-4" />
                <span className="sr-only">New Folder</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-106.25">
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Folder Name</Label>
                  <Input
                    id="name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="e.g. Work, Personal"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateFolder();
                    }}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateFolder} disabled={!newFolderName.trim() || isCreatingFolder}>
                  {isCreatingFolder && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isRenameFolderOpen} onOpenChange={setIsRenameFolderOpen}>
            <DialogContent className="sm:max-w-106.25">
              <DialogHeader>
                <DialogTitle>Rename Folder</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="rename">New Folder Name</Label>
                  <Input
                    id="rename"
                    value={folderToRename?.newName || ""}
                    onChange={(e) => setFolderToRename(prev => prev ? { ...prev, newName: e.target.value } : null)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameFolder();
                    }}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsRenameFolderOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleRenameFolder} disabled={!folderToRename?.newName.trim() || isRenamingFolder}>
                  {isRenamingFolder && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                  Rename
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            folders?.map((folder) => {
              const Icon = FOLDER_ICONS[folder.slug] || FileIcon;
              const href = `/mail/${folder.slug}`;
              const isActive = pathname.startsWith(href);
              const displayName =
                folder.slug === "inbox" ? "Inbox" : folder.name;
              
              const isSystemFolder = ["inbox", "sent", "drafts", "archive", "junk", "trash", "starred"].includes(folder.slug);

              const FolderButton = (
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start mb-1 gap-2 px-2",
                    isActive && "font-semibold",
                    collapsed && "justify-center"
                  )}
                  asChild
                  onMouseEnter={() => handlePrefetch(folder.slug)}
                  onMouseLeave={clearPrefetch}
                >
                  <Link href={href}>
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="truncate flex-1 text-left">
                          {displayName}
                        </span>
                        {folder.unreadCount > 0 && (
                          <span className="ml-auto text-xs text-muted-foreground">
                            {folder.unreadCount}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                </Button>
              );

              if (collapsed) {
                return (
                  <Tooltip key={folder.id}>
                    <TooltipTrigger asChild>
                      {FolderButton}
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className="flex items-center gap-2"
                    >
                      {displayName}
                      {folder.unreadCount > 0 && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {folder.unreadCount}
                        </span>
                      )}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              if (isSystemFolder) {
                return <div key={folder.id}>{FolderButton}</div>;
              }

              return (
                <ContextMenu key={folder.id}>
                  <ContextMenuTrigger asChild>
                    <div>{FolderButton}</div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => {
                      setFolderToRename({ oldName: folder.slug, newName: folder.name });
                      setIsRenameFolderOpen(true);
                    }}>
                      <PenSquareIcon className="mr-2 h-4 w-4" />
                      Rename
                    </ContextMenuItem>
                    <ContextMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDeleteFolder(folder.slug)}
                    >
                      <Trash2Icon className="mr-2 h-4 w-4" />
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              );
            })
          )}
        </nav>

        <Separator />

        {/* User Menu & Collapse Toggle */}
        <div className="p-2 space-y-1">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full"
                  onClick={() => logoutMutation.mutate()}
                >
                  <LogOutIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign Out</TooltipContent>
            </Tooltip>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-2 p-2 rounded-md cursor-pointer">
                  <Avatar className="h-8 w-8 rounded-md after:rounded-md">
                    <AvatarFallback className="rounded-md after:rounded-md">
                      {session?.name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {session?.name}
                    </span>
                    <span className="truncate text-xs">{session?.email}</span>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>{session?.name || "User"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="bg-destructive/10 focus:bg-destructive/15"
                  variant={"destructive"}
                  onClick={() => logoutMutation.mutate()}
                >
                  <LogOutIcon className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapsed}
            className="w-full"
          >
            {collapsed ? (
              <ChevronRightIcon className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeftIcon className="h-4 w-4 mr-2" />
                Collapse
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
};

export default AppSidebar;
