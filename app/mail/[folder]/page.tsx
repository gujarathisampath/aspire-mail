import { Suspense } from "react";
import FolderView from "./folder-view";
import Loading from "./loading";
import { getSessionAction } from "@/lib/actions/auth";
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

  return (
    <Suspense fallback={<Loading />}>
      <FolderView
        folder={folder}
        selectedId={selectedId}
        searchQuery={query}
        session={session}
      />
    </Suspense>
  );
}
