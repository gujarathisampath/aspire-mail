import { Skeleton } from "@/components/ui/skeleton";

const MailLoadingSkeleton = () => {
  return (
    <div className="flex h-full overflow-hidden bg-background">
      <aside className="w-87.5 flex-none border-r p-4">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full rounded-lg" />

          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-8 w-18 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>

          <div className="space-y-2">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="space-y-2 rounded-lg border px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-10" />
                </div>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex items-center justify-between gap-4 border-b pb-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-44" />
              <Skeleton className="h-4 w-56" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-24 rounded-md" />
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
          </div>

          <div className="space-y-4">
            <Skeleton className="h-5 w-3/5" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-10/12" />
              <Skeleton className="h-4 w-9/12" />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Skeleton className="h-9 w-20 rounded-md" />
              <Skeleton className="h-9 w-20 rounded-md" />
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MailLoadingSkeleton;