"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialUrl?: string;
  onApply: (url: string, text?: string) => void;
  selectedText?: string;
}

const LinkDialog = ({
  open,
  onOpenChange,
  initialUrl,
  onApply,
  selectedText,
}: Props) => {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");

  useEffect(() => {
    if (open) {
      setUrl(initialUrl || "");
      setText(selectedText || "");
    }
  }, [open, initialUrl, selectedText]);

  const handleApply = () => {
    onApply(url, text);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Insert Link</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="link-text">Text</Label>
            <Input
              id="link-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Link text"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="link-url">URL</Label>
            <Input
              id="link-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleApply();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={!url && !initialUrl}>
            {url ? "Apply" : "Remove Link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LinkDialog;
