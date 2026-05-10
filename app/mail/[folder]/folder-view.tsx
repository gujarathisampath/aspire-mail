"use client";

import { useQuery } from "@tanstack/react-query";
import { getMailsAction } from "@/lib/actions/mail";
import MailList from "@/components/mail/mail-list";
import MailDisplay from "@/components/mail/mail-display";
import { InboxTabs } from "@/components/mail/inbox-tabs";
import { Button } from "@/components/ui/button";
import { Mail } from "@/lib/types";
import Loading from "./loading";
import { useSearchParams } from "next/navigation";
import { buildMailSearchKey, hasMailSearchFilters, readMailSearchFilters } from "@/lib/search";

interface Props {
  folder: string;
  initialMails?: Mail[];
  selectedId?: string;
  searchQuery?: string;
  session: { email: string; name: string } | null;
  smartCategorizationEnabled: boolean;
}

const FolderView = ({
  folder,
  initialMails,
  selectedId,
  searchQuery,
  session,
  smartCategorizationEnabled,
}: Props) => {
  const searchParams = useSearchParams();
  const searchFilters = readMailSearchFilters(searchParams);
  const searchKey = buildMailSearchKey(searchFilters);
  const selectedIdFromUrl = searchParams.get("id") || selectedId;

  const {
    data: mails,
    isError,
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ["mails", folder, searchKey, session?.email],
    queryFn: () => getMailsAction(folder, searchKey),
    initialData: initialMails,
    refetchInterval: 60000,
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
    enabled: !!session?.email,
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

  const selectedMail = mails?.find((m) => m.id === selectedIdFromUrl) || null;
  const allMails = mails || [];

  // Only apply Smart Categorization tabs for the inbox
  const isInbox = folder.toLowerCase() === "inbox";
  const hasSearch = hasMailSearchFilters(searchFilters);

  const renderMailPane = (filteredMails: Mail[]) => (
    <div className="flex h-full">
      <div className="w-87.5 flex-none border-r text-sidebar-foreground">
        <MailList mails={filteredMails} currentUserEmail={session?.email} />
      </div>
      <div className="flex-1 overflow-hidden">
        <MailDisplay
          mail={selectedMail}
          currentUserEmail={session?.email || ""}
        />
      </div>
    </div>
  );

  if (isInbox && !hasSearch && smartCategorizationEnabled) {
    return (
      <InboxTabs mails={allMails} enabled={smartCategorizationEnabled}>
        {(filteredMails) => renderMailPane(filteredMails)}
      </InboxTabs>
    );
  }

  return renderMailPane(allMails);
};

export default FolderView;
