import { Skeleton } from "@/components/ui/skeleton";

export const MailContentSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-3">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>

        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-64 max-w-full" />
            <Skeleton className="h-3 w-44" />
          </div>
          <Skeleton className="h-3 w-20 shrink-0" />
        </div>

        <div className="space-y-3 pt-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-10/12" />
          <Skeleton className="h-4 w-9/12" />
          <Skeleton className="h-4 w-8/12" />
        </div>
      </div>

      <div className="space-y-3 border-t pt-4">
        <Skeleton className="h-4 w-32" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-lg border p-3 space-y-3">
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
    </div>
  );
};

export default MailContentSkeleton;