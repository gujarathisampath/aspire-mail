"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deleteMailAction,
  toggleReadAction,
  archiveMailAction,
  toggleStarAction,
  moveMailAction,
} from "@/lib/actions/mail";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Mail } from "@/lib/types";

interface UseMailActionsProps {
  mail: Mail | null;
  folderId: string;
}

export const useMailActions = ({ mail, folderId }: UseMailActionsProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  // Helper to optimize repetition
  const invalidateKey = () => {
    queryClient.invalidateQueries({ queryKey: ["mails", folderId] });
    queryClient.invalidateQueries({ queryKey: ["folders"] });
    if (mail?.id) {
      queryClient.invalidateQueries({
        queryKey: ["mail-details", folderId, mail.id],
      });
    }
  };

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
      toast.error("Failed to delete message");
    },
    onSuccess: () => {
      toast.success("Message deleted");
      router.replace(`/mail/${folderId}`);
    },
    onSettled: invalidateKey,
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
      toast.error("Failed to archive message");
    },
    onSuccess: () => {
      toast.success("Message archived");
      router.replace(`/mail/${folderId}`);
    },
    onSettled: invalidateKey,
  });

  const moveMutation = useMutation({
    mutationFn: (targetFolderSlug: string) =>
      moveMailAction(folderId, targetFolderSlug, mail!.id),
    onSuccess: (res, variables) => {
      if (res.success) {
        const folderName =
          variables.charAt(0).toUpperCase() + variables.slice(1);
        toast.success(`Moved to ${folderName}`);

        queryClient.invalidateQueries({ queryKey: ["mails", folderId] });
        queryClient.invalidateQueries({ queryKey: ["mails", variables] });
        queryClient.invalidateQueries({ queryKey: ["folders"] });
        router.replace(`/mail/${folderId}`);
      } else {
        toast.error(res.error || "Failed to move message");
      }
    },
  });

  const toggleReadMutation = useMutation({
    mutationFn: ({ seen, silent }: { seen: boolean; silent?: boolean }) =>
      toggleReadAction(folderId, mail!.id, seen),
    onMutate: async ({ seen }) => {
      await queryClient.cancelQueries({ queryKey: ["mails", folderId] });
      const previousMails = queryClient.getQueryData<Mail[]>([
        "mails",
        folderId,
      ]);

      queryClient.setQueryData<Mail[]>(["mails", folderId], (old) =>
        old?.map((m) => (m.id === mail!.id ? { ...m, read: seen } : m)),
      );

      return { previousMails };
    },
    onError: (err, variables, context) => {
      if (context?.previousMails) {
        queryClient.setQueryData(["mails", folderId], context.previousMails);
      }
      toast.error("Failed to update read status");
    },
    onSuccess: (data, variables) => {
      if (!variables.silent) {
        toast.info(variables.seen ? "Marked as read" : "Marked as unread");
      }
    },
    onSettled: invalidateKey,
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
      toast.error("Failed to update star status");
    },
    onSuccess: (data, variables) => {
      toast.success(variables ? "Message starred" : "Message unstarred");
    },
    onSettled: invalidateKey,
  });

  return {
    deleteMutation,
    archiveMutation,
    moveMutation,
    toggleReadMutation,
    toggleStarMutation,
  };
};
