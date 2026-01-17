"use client";

import {
  SearchIcon,
  BellIcon,
  MenuIcon,
  LogOutIcon,
  RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/lib/actions/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { useQueryClient, useIsFetching } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const AppHeader = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, clearAuth } = useAuthStore();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isFetchingMails = useIsFetching({ queryKey: ["mails"] }) > 0;
  const isFetchingFolders = useIsFetching({ queryKey: ["folders"] }) > 0;
  const isFetchingDetails = useIsFetching({ queryKey: ["mail-details"] }) > 0;
  const isGlobalFetching =
    isFetchingMails || isFetchingFolders || isFetchingDetails || isRefreshing;

  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
  }, [searchParams]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["mails"] });
    await queryClient.invalidateQueries({ queryKey: ["folders"] });
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery) {
      params.set("q", searchQuery);
    } else {
      params.delete("q");
    }
    router.push(`?${params.toString()}`);
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    : user?.email?.substring(0, 2).toUpperCase() || "??";

  const handleLogout = async () => {
    await logoutAction();
    clearAuth();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b px-4">
      <div className="flex flex-1 items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden">
          <MenuIcon className="h-5 w-5" />
        </Button>
        <form onSubmit={handleSearch} className="relative w-full max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          disabled={isGlobalFetching}
        >
          <RefreshCw
            className={cn("h-5 w-5 text-muted-foreground", {
              "animate-spin": isGlobalFetching,
            })}
          />
        </Button>
        <Button variant="ghost" size="icon">
          <BellIcon className="h-5 w-5 text-muted-foreground" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar>
              {/* <AvatarImage src="https://github.com/shadcn.png" /> */}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="bg-destructive/10 focus:bg-destructive/15"
              variant={"destructive"}
            >
              <LogOutIcon className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default AppHeader;
