"use client";

import { Mail } from "@/lib/types";
import {
  MoreVerticalIcon,
  ReplyIcon,
  ReplyAllIcon,
  ForwardIcon,
  Trash2Icon,
  ArchiveIcon,
  MailIcon,
  MailOpenIcon,
  StarIcon,
  FolderIcon,
  InboxIcon,
  SendIcon,
  FileIcon,
  AlertCircleIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  deleteMailAction,
  toggleReadAction,
  archiveMailAction,
  toggleStarAction,
  moveMailAction,
  getMailContentAction,
} from "@/lib/actions/mail";
import { getSessionAction } from "@/lib/actions/auth";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useMemo } from "react";
import { Loader2Icon } from "lucide-react";

interface Props {
  mail: Mail | null;
}

const FOLDER_ICONS: Record<string, any> = {
  inbox: InboxIcon,
  sent: SendIcon,
  drafts: FileIcon,
  archive: ArchiveIcon,
  junk: AlertCircleIcon,
  trash: Trash2Icon,
  starred: StarIcon,
};

const MailDisplay = ({ mail }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  const params = useParams();
  const rawFolder = (params.folder as string) || "INBOX";
  const folderId = decodeURIComponent(rawFolder);

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: () => getSessionAction(),
  });
  const currentUserEmail = session?.email?.toLowerCase();

  const deleteMutation = useMutation({
    mutationFn: () => deleteMailAction(folderId, mail!.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["mails", folderId] });
      const previousMails = queryClient.getQueryData<Mail[]>([
        "mails",
        folderId,
      ]);

      queryClient.setQueryData<Mail[]>(["mails", folderId], (old) =>
        old?.filter((m) => m.id !== mail!.id),
      );

      return { previousMails };
    },
    onError: (err, variables, context) => {
      if (context?.previousMails) {
        queryClient.setQueryData(["mails", folderId], context.previousMails);
      }
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({ title: "Message deleted" });
      router.replace(`/mail/${rawFolder}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["mails", folderId] });
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => archiveMailAction(folderId, mail!.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["mails", folderId] });
      const previousMails = queryClient.getQueryData<Mail[]>([
        "mails",
        folderId,
      ]);

      queryClient.setQueryData<Mail[]>(["mails", folderId], (old) =>
        old?.filter((m) => m.id !== mail!.id),
      );

      return { previousMails };
    },
    onError: (err, variables, context) => {
      if (context?.previousMails) {
        queryClient.setQueryData(["mails", folderId], context.previousMails);
      }
      toast({
        title: "Error",
        description: "Failed to archive message",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({ title: "Message archived" });
      router.replace(`/mail/${rawFolder}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["mails", folderId] });
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });

  const moveMutation = useMutation({
    mutationFn: (targetFolderSlug: string) =>
      moveMailAction(folderId, targetFolderSlug, mail!.id),
    onSuccess: (res, variables) => {
      if (res.success) {
        // Human readable folder name for toast
        const folderName =
          variables.charAt(0).toUpperCase() + variables.slice(1);
        toast({ title: `Moved to ${folderName}` });

        queryClient.invalidateQueries({ queryKey: ["mails", folderId] });
        queryClient.invalidateQueries({ queryKey: ["mails", variables] });
        queryClient.invalidateQueries({ queryKey: ["folders"] });
        router.replace(`/mail/${rawFolder}`);
      } else {
        toast({
          title: "Error",
          description: res.error,
          variant: "destructive",
        });
      }
    },
  });

  const toggleReadMutation = useMutation({
    mutationFn: ({ seen, silent }: { seen: boolean; silent?: boolean }) =>
      toggleReadAction(folderId, mail!.id, seen),
    onMutate: async ({ seen }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["mails", folderId] });

      // Snapshot the previous value
      const previousMails = queryClient.getQueryData<Mail[]>([
        "mails",
        folderId,
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData<Mail[]>(["mails", folderId], (old) =>
        old?.map((m) => (m.id === mail!.id ? { ...m, read: seen } : m)),
      );

      return { previousMails };
    },
    onError: (err, variables, context) => {
      if (context?.previousMails) {
        queryClient.setQueryData(["mails", folderId], context.previousMails);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["mails", folderId] });
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });

  const toggleStarMutation = useMutation({
    mutationFn: (starred: boolean) =>
      toggleStarAction(folderId, mail!.id, starred),
    onMutate: async (starred) => {
      await queryClient.cancelQueries({ queryKey: ["mails", folderId] });
      const previousMails = queryClient.getQueryData<Mail[]>([
        "mails",
        folderId,
      ]);

      queryClient.setQueryData<Mail[]>(["mails", folderId], (old) =>
        old?.map((m) => (m.id === mail!.id ? { ...m, starred: starred } : m)),
      );

      return { previousMails };
    },
    onError: (err, variables, context) => {
      if (context?.previousMails) {
        queryClient.setQueryData(["mails", folderId], context.previousMails);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["mails", folderId] });
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });

  // Auto-mark as read when mail is opened
  useEffect(() => {
    if (mail && !mail.read && !toggleReadMutation.isPending) {
      toggleReadMutation.mutate({ seen: true, silent: true });
    }
  }, [mail?.id, mail?.read]);

  const { data: contentData, isLoading: isContentLoading } = useQuery({
    queryKey: ["mail-content", folderId, mail?.id],
    queryFn: () => getMailContentAction(folderId, mail!.id),
    enabled: !!mail?.id,
    staleTime: Infinity, // Content doesn't change
  });

  const mailContent = useMemo(() => {
    return contentData || mail?.content || "";
  }, [contentData, mail?.content]);

  if (!mail) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-muted-foreground h-full bg-muted/5">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 border">
          <MailIcon className="h-10 w-10 opacity-20" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground/80">
          No message selected
        </h3>
        <p className="mb-4 text-sm text-muted-foreground max-w-[250px]">
          Choose a message from the list to view its details.
        </p>
      </div>
    );
  }

  const senderName = mail.from?.name || mail.from?.address || "Unknown";
  const senderInitials = senderName.charAt(0).toUpperCase();

  const handleReply = () => {
    const query = new URLSearchParams({
      to: mail.from.address,
      subject: mail.subject.toLowerCase().startsWith("re:")
        ? mail.subject
        : `Re: ${mail.subject}`,
      content: `<br><br><div class="gmail_quote"><div dir="ltr" class="gmail_attr">On ${format(new Date(mail.date), "PPP p")}, ${senderName} &lt;${mail.from.address}&gt; wrote:<br></div><blockquote class="gmail_quote" style="margin:0px 0px 0px 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex">${mailContent || mail.preview}</blockquote></div>`,
    });
    router.push(`/mail/compose?${query.toString()}`);
  };

  const handleReplyAll = () => {
    const toRecipients = new Set<string>();
    const ccRecipients = new Set<string>();

    // Add sender to "to"
    toRecipients.add(mail.from.address.toLowerCase());

    // Add all original "to" recipients to "to"
    mail.to?.forEach((r) => toRecipients.add(r.address.toLowerCase()));

    // Add all original "cc" recipients to "cc"
    mail.cc?.forEach((r) => ccRecipients.add(r.address.toLowerCase()));

    // Remove current user from both
    if (currentUserEmail) {
      toRecipients.delete(currentUserEmail);
      ccRecipients.delete(currentUserEmail);
    }

    const query = new URLSearchParams({
      to: Array.from(toRecipients).join(", "),
      cc: Array.from(ccRecipients).join(", "),
      subject: mail.subject.toLowerCase().startsWith("re:")
        ? mail.subject
        : `Re: ${mail.subject}`,
      content: `<br><br><div class="gmail_quote"><div dir="ltr" class="gmail_attr">On ${format(new Date(mail.date), "PPP p")}, ${senderName} &lt;${mail.from.address}&gt; wrote:<br></div><blockquote class="gmail_quote" style="margin:0px 0px 0px 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex">${mailContent || mail.preview}</blockquote></div>`,
    });
    router.push(`/mail/compose?${query.toString()}`);
  };

  const handleForward = () => {
    const query = new URLSearchParams({
      subject: mail.subject.toLowerCase().startsWith("fwd:")
        ? mail.subject
        : `Fwd: ${mail.subject}`,
      content: `<br><br>---------- Forwarded message ---------<br>From: <b>${senderName}</b> &lt;${mail.from.address}&gt;<br>Date: ${format(new Date(mail.date), "PPP p")}<br>Subject: ${mail.subject}<br>To: ${mail.to?.map((r) => r.address).join(", ") || ""}<br><br>${mailContent || mail.preview}`,
    });
    router.push(`/mail/compose?${query.toString()}`);
  };

  const standardFolders = [
    { slug: "inbox", name: "Inbox" },
    { slug: "drafts", name: "Drafts" },
    { slug: "sent", name: "Sent" },
    { slug: "junk", name: "Junk" },
    { slug: "trash", name: "Trash" },
    { slug: "archive", name: "Archive" },
  ];

  const availableMoveFolders = standardFolders.filter(
    (f) => f.slug !== folderId.toLowerCase(),
  );

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 border-b shrink-0 h-14">
        <div className="flex items-center gap-1">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => archiveMutation.mutate()}
                  disabled={archiveMutation.isPending}
                >
                  <ArchiveIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Archive</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="hover:bg-destructive/20 text-destructive hover:text-destructive"
                  size="icon"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2Icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>

            <div className="flex items-center">
              <Separator orientation="vertical" className="mx-2 h-5" />
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleReply}>
                  <ReplyIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reply</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleReplyAll}>
                  <ReplyAllIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reply All</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleForward}>
                  <ForwardIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Forward</TooltipContent>
            </Tooltip>

            <div className="flex items-center">
              <Separator orientation="vertical" className="mx-2 h-5" />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <FolderIcon className="h-4 w-4" />
                  <span className="sr-only">Move to...</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {availableMoveFolders.map((folder) => {
                  const Icon = FOLDER_ICONS[folder.slug] || FolderIcon;
                  return (
                    <DropdownMenuItem
                      key={folder.slug}
                      onClick={() => moveMutation.mutate(folder.slug)}
                    >
                      <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{folder.name}</span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    toggleReadMutation.mutate({ seen: !mail.read })
                  }
                >
                  {mail.read ? (
                    <MailIcon className="h-4 w-4" />
                  ) : (
                    <MailOpenIcon className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Mark as {mail.read ? "unread" : "read"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleStarMutation.mutate(!mail.starred)}
                  className={cn(
                    mail.starred && "text-yellow-500 hover:text-yellow-600",
                  )}
                >
                  <StarIcon
                    className={cn("h-4 w-4", mail.starred && "fill-current")}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {mail.starred ? "Unstar" : "Star"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

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
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FolderIcon className="mr-2 h-4 w-4" />
                  Move to
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-48">
                  {availableMoveFolders.map((folder) => {
                    const Icon = FOLDER_ICONS[folder.slug] || FolderIcon;
                    return (
                      <DropdownMenuItem
                        key={folder.slug}
                        onClick={() => moveMutation.mutate(folder.slug)}
                      >
                        <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{folder.name}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col p-8 md:p-10 lg:p-12 gap-8 max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                  {senderInitials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="font-semibold text-base flex items-baseline gap-2">
                  {senderName}
                  <span className="font-normal text-muted-foreground text-sm">
                    &lt;{mail.from.address}&gt;
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  To:{" "}
                  {mail.to?.map((t) => t.name || t.address).join(", ") || "me"}
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              {format(new Date(mail.date), "PPP p")}
            </div>
          </div>

          {/* Subject */}
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {mail.subject}
          </h1>

          <Separator />

          {/* Content Body */}
          <div className="prose prose-sm md:prose-base w-full max-w-none dark:prose-invert">
            {isContentLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
                <Loader2Icon className="h-8 w-8 animate-spin" />
                <p className="text-sm">Loading message content...</p>
              </div>
            ) : mailContent ? (
              <div
                className="[&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                dangerouslySetInnerHTML={{ __html: mailContent }}
              />
            ) : (
              <div className="whitespace-pre-wrap">
                {mail.preview || "No content to display."}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Reply Footer */}
      <div className="p-6 border-t shrink-0">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <Button variant="outline" className="gap-2" onClick={handleReply}>
            <ReplyIcon className="h-4 w-4" />
            Reply
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleForward}>
            <ForwardIcon className="h-4 w-4" />
            Forward
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MailDisplay;
