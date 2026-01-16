"use client";

import { SearchIcon, BellIcon, MenuIcon, LogOutIcon } from "lucide-react";
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

const AppHeader = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, clearAuth } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");

  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
  }, [searchParams]);

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
        <Button variant="ghost" size="icon">
          <BellIcon className="h-5 w-5 text-muted-foreground" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full bg-primary text-primary-foreground"
            >
              {initials}
            </Button>
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
              className="text-destructive"
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
