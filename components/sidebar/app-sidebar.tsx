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
  ChevronsUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFoldersAction, getMailsAction } from "@/lib/actions/mail";
import { getSessionAction, logoutAction } from "@/lib/actions/auth";
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

const AppSidebar = ({ initialFolders }: { initialFolders?: Folder[] }) => {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { clearAuth } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const { data: folders, isLoading } = useQuery({
    queryKey: ["folders"],
    queryFn: () => getFoldersAction(),
    initialData: initialFolders,
    refetchInterval: 60000,
  });

  const [prefetchTimeout, setPrefetchTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );

  const handlePrefetch = (slug: string) => {
    if (prefetchTimeout) clearTimeout(prefetchTimeout);

    const timeout = setTimeout(() => {
      queryClient.prefetchQuery({
        queryKey: ["mails", slug],
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

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: () => getSessionAction(),
    staleTime: Infinity,
  });

  const logoutMutation = useMutation({
    mutationFn: () => logoutAction(),
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      router.push("/login");
      router.refresh();
    },
  });

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", String(newState));
  };

  const clearPrefetch = () => {
    if (prefetchTimeout) clearTimeout(prefetchTimeout);
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

              if (collapsed) {
                return (
                  <Tooltip key={folder.id}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        size="icon"
                        className="w-full mb-1"
                        asChild
                        onMouseEnter={() => handlePrefetch(folder.slug)}
                        onMouseLeave={clearPrefetch}
                      >
                        <Link href={href}>
                          <Icon className="h-4 w-4" />
                          <span className="sr-only">{displayName}</span>
                        </Link>
                      </Button>
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

              return (
                <Button
                  key={folder.id}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start mb-1 gap-2 px-2",
                    isActive && "font-semibold",
                  )}
                  asChild
                  onMouseEnter={() => handlePrefetch(folder.slug)}
                  onMouseLeave={clearPrefetch}
                >
                  <Link href={href}>
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate flex-1 text-left">
                      {displayName}
                    </span>
                    {folder.unreadCount > 0 && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {folder.unreadCount}
                      </span>
                    )}
                  </Link>
                </Button>
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
