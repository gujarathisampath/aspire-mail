import { Skeleton } from "@/components/ui/skeleton";
import { MailContentSkeleton } from "./mail-content-skeleton";

export const MailDisplaySkeleton = () => {
  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between px-4 border-b shrink-0 h-14 bg-background">
        <div className="flex items-center gap-1">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-9 rounded-md" />
          ))}
        </div>

        <div className="flex items-center gap-1">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 md:px-8 py-6 space-y-6">
          <div className="space-y-3 border-b pb-4">
            <Skeleton className="h-8 w-4/5 max-w-3xl" />
            <div className="flex flex-wrap items-center gap-3">
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-72 max-w-full" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-4 w-20 shrink-0" />
          </div>

          <MailContentSkeleton />
        </div>
      </div>

      <div className="border-t bg-muted/30 p-4 shrink-0">
        <div className="mx-auto max-w-5xl flex items-center gap-2">
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>
    </div>
  );
};

export default MailDisplaySkeleton;