import { MailIcon } from "lucide-react";

export const MailDisplayEmpty = () => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-muted-foreground h-full">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <MailIcon className="h-8 w-8 opacity-50" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">
        No message selected
      </h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-[250px]">
        Choose a message from the list to view its contents.
      </p>
    </div>
  );
};
