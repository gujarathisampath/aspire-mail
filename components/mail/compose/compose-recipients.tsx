"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";

const ComposeRecipients = () => {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();
  const showCc = watch("showCc");
  const showBcc = watch("showBcc");

  return (
    <div className="border-b shrink-0">
      {/* To Field */}
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        <Label htmlFor="to" className="w-16 text-muted-foreground">
          To
        </Label>
        <Input
          id="to"
          placeholder="Recipients"
          className="flex-1 border-0 shadow-none focus-visible:ring-0 px-0"
          {...register("to")}
        />
        <div className="flex gap-1 text-sm shrink-0">
          {!showCc && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setValue("showCc", true)}
            >
              Cc
            </Button>
          )}
          {!showBcc && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setValue("showBcc", true)}
            >
              Bcc
            </Button>
          )}
        </div>
      </div>

      {/* Cc Field */}
      {showCc && (
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Label htmlFor="cc" className="w-16 text-muted-foreground">
            Cc
          </Label>
          <Input
            id="cc"
            placeholder="Cc recipients"
            className="flex-1 border-0 shadow-none focus-visible:ring-0 px-0"
            {...register("cc")}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setValue("showCc", false)}
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Bcc Field */}
      {showBcc && (
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Label htmlFor="bcc" className="w-16 text-muted-foreground">
            Bcc
          </Label>
          <Input
            id="bcc"
            placeholder="Bcc recipients"
            className="flex-1 border-0 shadow-none focus-visible:ring-0 px-0"
            {...register("bcc")}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setValue("showBcc", false)}
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Subject Field */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Label htmlFor="subject" className="w-16 text-muted-foreground">
          Subject
        </Label>
        <Input
          id="subject"
          placeholder="Subject"
          className="flex-1 border-0 shadow-none focus-visible:ring-0 px-0 font-medium"
          {...register("subject")}
        />
      </div>
    </div>
  );
};

export default ComposeRecipients;
