"use client";

import { FolderIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { FOLDER_ICONS } from "./folder-icons";

const STANDARD_FOLDERS = [
  { slug: "inbox", name: "Inbox" },
  { slug: "sent", name: "Sent" },
  { slug: "drafts", name: "Drafts" },
  { slug: "junk", name: "Junk" },
  { slug: "trash", name: "Trash" },
  { slug: "archive", name: "Archive" },
];

interface Props {
  currentFolderId: string;
  onMove: (targetSlug: string) => void;
  isSubmenu?: boolean;
  disabled?: boolean;
}

export const FolderMoveDropdown = ({
  currentFolderId,
  onMove,
  isSubmenu,
  disabled,
}: Props) => {
  const availableFolders = STANDARD_FOLDERS.filter(
    (f) => f.slug !== currentFolderId.toLowerCase(),
  );

  if (isSubmenu) {
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger disabled={disabled}>
          <FolderIcon className="mr-2 h-4 w-4" />
          Move to
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="w-48">
          {availableFolders.map((folder) => {
            const Icon = FOLDER_ICONS[folder.slug] || FolderIcon;
            return (
              <DropdownMenuItem
                key={folder.slug}
                onClick={() => onMove(folder.slug)}
                disabled={disabled}
              >
                <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{folder.name}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={disabled}>
          <FolderIcon className="h-4 w-4" />
          <span className="sr-only">Move to...</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {availableFolders.map((folder) => {
          const Icon = FOLDER_ICONS[folder.slug] || FolderIcon;
          return (
            <DropdownMenuItem
              key={folder.slug}
              onClick={() => onMove(folder.slug)}
            >
              <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{folder.name}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
