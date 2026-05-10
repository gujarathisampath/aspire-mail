"use client";

import {
  SearchIcon,
  BellIcon,
  MenuIcon,
  LogOutIcon,
  RefreshCw,
  SettingsIcon,
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
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { useQueryClient, useIsFetching } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MailSearchFilters } from "@/lib/types";
import { buildMailSearchKey, readMailSearchFilters } from "@/lib/search";

const AppHeader = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, clearAuth } = useAuthStore();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<MailSearchFilters>(() =>
    readMailSearchFilters(searchParams),
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isFetchingMails = useIsFetching({ queryKey: ["mails"] }) > 0;
  const isFetchingFolders = useIsFetching({ queryKey: ["folders"] }) > 0;
  const isFetchingDetails = useIsFetching({ queryKey: ["mail-details"] }) > 0;
  const isGlobalFetching =
    isFetchingMails || isFetchingFolders || isFetchingDetails || isRefreshing;

  // Sync search query when URL params change (e.g., browser back/forward)
  // Using a derived value pattern instead of useEffect to avoid cascading renders
  const urlQuery = searchParams.get("q") || "";
  useEffect(() => {
    if (document.activeElement?.tagName !== "INPUT") {
      setSearchQuery(urlQuery);
      setAdvancedFilters(readMailSearchFilters(searchParams));
    }
  }, [searchParams, urlQuery]);

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

  const hasAdvancedSearch = Boolean(
    advancedFilters.from ||
      advancedFilters.exact ||
      advancedFilters.dateFrom ||
      advancedFilters.dateTo ||
      advancedFilters.minSize ||
      advancedFilters.maxSize,
  );

  const applyAdvancedSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());

    if (searchQuery) {
      params.set("q", searchQuery);
    } else {
      params.delete("q");
    }

    const normalizedFilters: MailSearchFilters = {
      q: searchQuery || undefined,
      from: advancedFilters.from?.trim() || undefined,
      exact: advancedFilters.exact?.trim() || undefined,
      dateFrom: advancedFilters.dateFrom || undefined,
      dateTo: advancedFilters.dateTo || undefined,
      minSize: advancedFilters.minSize || undefined,
      maxSize: advancedFilters.maxSize || undefined,
    };

    const normalizedKey = buildMailSearchKey(normalizedFilters);
    const normalizedParams = new URLSearchParams(normalizedKey);

    for (const key of ["from", "exact", "dateFrom", "dateTo", "minSize", "maxSize"] as const) {
      const value = normalizedParams.get(key);
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }

    router.push(`?${params.toString()}`);
    setAdvancedOpen(false);
  };

  const clearAdvancedSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    for (const key of ["from", "exact", "dateFrom", "dateTo", "minSize", "maxSize"] as const) {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
    setAdvancedFilters({});
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    : user?.email?.substring(0, 2).toUpperCase() || "??";

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
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
        <div className="flex w-full max-w-2xl items-center gap-2">
          <form onSubmit={handleSearch} className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          <Dialog open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" className="shrink-0">
                Advanced{hasAdvancedSearch ? " · On" : ""}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Advanced Search</DialogTitle>
                <DialogDescription>
                  Filter by sender, date range, file size, or an exact phrase.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={applyAdvancedSearch} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium">Sender</label>
                    <Input
                      placeholder="sender@example.com"
                      value={advancedFilters.from || ""}
                      onChange={(e) =>
                        setAdvancedFilters((prev) => ({ ...prev, from: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium">Exact keywords</label>
                    <Input
                      placeholder="Invoice #1042"
                      value={advancedFilters.exact || ""}
                      onChange={(e) =>
                        setAdvancedFilters((prev) => ({ ...prev, exact: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">From date</label>
                    <Input
                      type="date"
                      value={advancedFilters.dateFrom || ""}
                      onChange={(e) =>
                        setAdvancedFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">To date</label>
                    <Input
                      type="date"
                      value={advancedFilters.dateTo || ""}
                      onChange={(e) =>
                        setAdvancedFilters((prev) => ({ ...prev, dateTo: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Min size (MB)</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="10"
                      value={advancedFilters.minSize || ""}
                      onChange={(e) =>
                        setAdvancedFilters((prev) => ({ ...prev, minSize: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Max size (MB)</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="25"
                      value={advancedFilters.maxSize || ""}
                      onChange={(e) =>
                        setAdvancedFilters((prev) => ({ ...prev, maxSize: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={clearAdvancedSearch}>
                    Clear
                  </Button>
                  <Button type="submit">Search</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
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
            <Link href="/settings">
              <DropdownMenuItem
                className="mb-1"
              >
                <SettingsIcon className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
            </Link>
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
