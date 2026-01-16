"use client";

import { useQuery } from "@tanstack/react-query";
import { getMailsAction } from "@/lib/actions/mail";
import MailList from "@/components/mail/mail-list";
import MailDisplay from "@/components/mail/mail-display";
import { Button } from "@/components/ui/button";
import { Mail } from "@/lib/types";
import Loading from "./loading";

interface Props {
  folder: string;
  initialMails?: Mail[];
  selectedId?: string;
  searchQuery?: string;
}

const FolderView = ({
  folder,
  initialMails,
  selectedId,
  searchQuery,
}: Props) => {
  const {
    data: mails,
    isError,
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ["mails", folder, searchQuery],
    queryFn: () => getMailsAction(folder, searchQuery),
    initialData: initialMails,
    refetchInterval: 30000,
    staleTime: 60 * 1000,
    placeholderData: (previousData) => previousData,
  });

  if (isLoading && !mails) {
    return <Loading />;
  }

  if (isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground p-8 text-center">
        <p>Failed to load messages from this folder.</p>
        <Button onClick={() => refetch()} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  const selectedMail = mails?.find((m) => m.id === selectedId) || null;

  return (
    <div className="flex h-full">
      <div className="w-[350px] flex-none border-r">
        <MailList mails={mails || []} />
      </div>
      <div className="flex-1">
        <MailDisplay mail={selectedMail} />
      </div>
    </div>
  );
};

export default FolderView;
