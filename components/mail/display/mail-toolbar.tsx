"use client";

import { UseMutationResult } from "@tanstack/react-query";
import {
  ArchiveIcon,
  ForwardIcon,
  MailIcon,
  MailOpenIcon,
  MoreVerticalIcon,
  ReplyAllIcon,
  ReplyIcon,
  StarIcon,
  Trash2Icon,
  Loader2Icon,
} from "lucide-react";

import { useMailActions } from "@/hooks/use-mail-actions";
import { useMailCompose } from "@/hooks/use-mail-compose";
import { Mail } from "@/lib/types";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { FolderMoveDropdown } from "./folder-move-dropdown";

// ----------------------------------------------------------------------

interface Props {
  mail: Mail;
  folderId: string;
  currentUserEmail: string;
  toggleReadMutation: UseMutationResult<
    { success: boolean; error?: string },
    Error,
    { seen: boolean; silent?: boolean }
  >;
}

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

// ----------------------------------------------------------------------

const ToolbarButton = ({
  icon,
  label,
  onClick,
  disabled,
  loading,
  className,
}: ToolbarButtonProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClick}
        disabled={disabled || loading}
        className={className}
      >
        {loading ? <Loader2Icon className="h-4 w-4 animate-spin" /> : icon}
      </Button>
    </TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
);

// ----------------------------------------------------------------------

export const MailDisplayToolbar = ({
  mail,
  folderId,
  currentUserEmail,
  toggleReadMutation,
}: Props) => {
  const { onReply, onReplyAll, onForward } = useMailCompose({
    mail,
    folderId,
    currentUserEmail,
  });

  const { archiveMutation, deleteMutation, moveMutation, toggleStarMutation } =
    useMailActions({ mail, folderId, currentUserEmail });

  return (
    <div className="flex items-center justify-between px-4 border-b shrink-0 h-14 bg-background">
      {/* Left Actions */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          icon={<ArchiveIcon className="h-4 w-4" />}
          label="Archive"
          onClick={() => archiveMutation.mutate()}
          loading={archiveMutation.isPending}
        />
        <ToolbarButton
          icon={<Trash2Icon className="h-4 w-4" />}
          label="Delete"
          onClick={() => deleteMutation.mutate()}
          loading={deleteMutation.isPending}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        />

        <Separator orientation="vertical" className="mx-1 h-auto" />

        <ToolbarButton
          icon={<ReplyIcon className="h-4 w-4" />}
          label="Reply"
          onClick={onReply}
        />
        <ToolbarButton
          icon={<ReplyAllIcon className="h-4 w-4" />}
          label="Reply All"
          onClick={onReplyAll}
        />
        <ToolbarButton
          icon={<ForwardIcon className="h-4 w-4" />}
          label="Forward"
          onClick={onForward}
        />

        <Separator orientation="vertical" className="mx-1 h-auto" />

        <FolderMoveDropdown
          currentFolderId={folderId}
          onMove={(target) => moveMutation.mutate(target)}
          disabled={moveMutation.isPending}
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          icon={
            mail.read ? (
              <MailIcon className="h-4 w-4" />
            ) : (
              <MailOpenIcon className="h-4 w-4" />
            )
          }
          label={`Mark as ${mail.read ? "unread" : "read"}`}
          onClick={() => toggleReadMutation.mutate({ seen: !mail.read })}
          loading={toggleReadMutation.isPending}
        />
        <ToolbarButton
          icon={
            <StarIcon
              className={cn("h-4 w-4", mail.starred && "fill-current")}
            />
          }
          label={mail.starred ? "Unstar" : "Star"}
          onClick={() => toggleStarMutation.mutate(!mail.starred)}
          loading={toggleStarMutation.isPending}
          className={cn(
            mail.starred && "text-yellow-500 hover:text-yellow-600",
          )}
        />

        {/* More Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVerticalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => toggleReadMutation.mutate({ seen: !mail.read })}
            >
              {mail.read ? (
                <MailIcon className="mr-2 h-4 w-4" />
              ) : (
                <MailOpenIcon className="mr-2 h-4 w-4" />
              )}
              Mark as {mail.read ? "unread" : "read"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => toggleStarMutation.mutate(!mail.starred)}
            >
              <StarIcon
                className={cn(
                  "mr-2 h-4 w-4",
                  mail.starred && "fill-current text-yellow-500",
                )}
              />
              {mail.starred ? "Remove star" : "Add star"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <FolderMoveDropdown
              isSubmenu
              currentFolderId={folderId}
              onMove={(target) => moveMutation.mutate(target)}
              disabled={moveMutation.isPending}
            />
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => deleteMutation.mutate()}
            >
              <Trash2Icon className="mr-2 h-4 w-4" />
              Delete message
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
