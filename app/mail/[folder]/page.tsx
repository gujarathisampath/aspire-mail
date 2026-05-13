import { Suspense } from "react";
import FolderView from "./folder-view";
import Loading from "./loading";
import { getSessionAction } from "@/lib/actions/auth";
import { getSettings } from "@/lib/actions/user-settings";
import { getMailsAction } from "@/lib/actions/mail";

interface Props {
  params: Promise<{ folder: string }>;
  searchParams: Promise<{ id?: string; q?: string }>;
}

export default async function FolderPage({ params, searchParams }: Props) {
  const { folder: rawFolder } = await params;
  const folder = decodeURIComponent(rawFolder);
  const { id: selectedId, q: query } = await searchParams;

  const session = await getSessionAction();
  
  let settings = null;
  let initialMails = undefined;
  
  if (session) {
    const [settingsResult, initialMailsResult] = await Promise.all([
      getSettings(),
      getMailsAction(folder, query)
    ]);
    settings = settingsResult;
    initialMails = initialMailsResult;
  }

  return (
    <Suspense fallback={<Loading />}>
      <FolderView
        folder={folder}
        initialMails={initialMails}
        selectedId={selectedId}
        searchQuery={query}
        session={session}
        smartCategorizationEnabled={settings?.smartCategorizationEnabled ?? false}
      />
    </Suspense>
  );
}
