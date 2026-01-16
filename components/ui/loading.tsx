import { Loader2Icon } from "lucide-react";

const Loading = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
      <Loader2Icon className="h-6 w-6 animate-spin" />
      <p className="text-sm">Loading...</p>
    </div>
  );
};

export default Loading;
