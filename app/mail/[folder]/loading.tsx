import { Loader2Icon } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2Icon className="h-6 w-6 animate-spin" />
        <p className="text-sm">Loading...</p>
      </div>
    </div>
  );
}
