import { Skeleton } from "@/components/ui/skeleton";

const MailLoadingSkeleton = () => {
  return (
    <div className="flex h-full overflow-hidden bg-background">
      <aside className="w-87.5 flex-none border-r bg-muted/10 p-4">
        <div className="space-y-4">
          <div className="space-y-3 rounded-2xl border bg-card/80 p-4 shadow-sm">
            <Skeleton className="h-10 w-full rounded-xl" />
            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="h-8 rounded-lg" />
              <Skeleton className="h-8 rounded-lg" />
              <Skeleton className="h-8 rounded-lg" />
            </div>
          </div>

          <div className="space-y-3">
            <Skeleton className="h-4 w-20" />
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="space-y-2 rounded-xl border bg-card/60 p-3 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-10" />
                </div>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
              </div>
            ))}
          </div>
        </div>
      </aside>

      <div className="flex-1 p-6 md:p-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-44" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-24 rounded-full" />
              <Skeleton className="h-9 w-24 rounded-full" />
            </div>
          </div>

          <div className="rounded-2xl border bg-card/70 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-3/5" />
                <Skeleton className="h-4 w-1/3" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>

            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-10/12" />
            </div>

            <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
              <Skeleton className="h-4 w-28" />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="rounded-lg border bg-background p-3 space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-md shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-full rounded-md" />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Skeleton className="h-9 w-20 rounded-md" />
              <Skeleton className="h-9 w-20 rounded-md" />
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MailLoadingSkeleton;