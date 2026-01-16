import { Suspense } from "react";
// import { getMailsAction } from "@/lib/actions/mail";
import FolderView from "./folder-view";
import Loading from "./loading";

interface Props {
  params: Promise<{ folder: string }>;
  searchParams: Promise<{ id?: string; q?: string }>;
}

export default async function FolderPage({ params, searchParams }: Props) {
  const { folder: rawFolder } = await params;
  const folder = decodeURIComponent(rawFolder);
  const { id: selectedId, q: query } = await searchParams;

  // We rely on client-side fetching + prefetching for "instant" navigation
  // But we can optionally fetch here if we want SSR SEO or First Paint guarantee
  // Given the user wants to avoid "loading spinner", we trust our prefetching strategy more.
  // HOWEVER, removing initialMails means the first ever visit will show loading.
  // We will keep fetching for the FIRST visit, but subsequent client navigations (via Link)
  // shouldn't re-trigger this server component fully if we can avoid it?
  // Actually, Server Components run on navigation.
  // To solve "spinner every time", we rely on Stale-While-Revalidate and prefetching.

  // Strategy: We still fetch on server for the initial render robustness.
  // But we ensure the client component uses `placeholderData` to avoid flickering.
  // We fetch data on the client or rely on prefetching to avoid blocking the UI
  // This ensures checking a folder is "instant" and shows a skeleton locally if needed.
  // const initialMails = await getMailsAction(folder);

  return (
    <Suspense fallback={<Loading />}>
      <FolderView
        folder={folder}
        // initialMails={initialMails} // Disabled to prevent blocking
        selectedId={selectedId}
        searchQuery={query}
      />
    </Suspense>
  );
}
