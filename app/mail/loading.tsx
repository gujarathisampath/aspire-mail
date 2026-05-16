import { Loader2Icon } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex h-full w-full items-center justify-center p-8 text-muted-foreground">
      <div className="flex items-center gap-2">
        <Loader2Icon className="h-5 w-5 animate-spin text-primary" />
        <span>Loading...</span>
      </div>
    </div>
  );
}