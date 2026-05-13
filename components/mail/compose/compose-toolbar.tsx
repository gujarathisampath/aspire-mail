"use client";

import { Editor } from "@tiptap/react";
import { useEffect, useState } from "react";
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  ListIcon,
  ListOrderedIcon,
  LinkIcon,
  Undo2Icon,
  Redo2Icon,
  SendIcon,
  Loader2Icon,
  Trash2Icon,
  PaperclipIcon,
  PenLineIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface Props {
  editor: Editor | null;
  onSend: () => void;
  onDiscard: () => void;
  onLink: () => void;
  onAttach: () => void;
  onSignature: () => void;
  isSending: boolean;
}

const ComposeToolbar = ({
  editor,
  onSend,
  onDiscard,
  onLink,
  onAttach,
  onSignature,
  isSending,
}: Props) => {
  // Mechanism to force update when editor state changes
  const [, forceUpdate] = useState({});

  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      forceUpdate({});
    };

    editor.on("transaction", handleUpdate);
    editor.on("selectionUpdate", handleUpdate);

    return () => {
      editor.off("transaction", handleUpdate);
      editor.off("selectionUpdate", handleUpdate);
    };
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="border-t bg-background px-4 py-3 shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={onSend}
            disabled={isSending}
            className="gap-2"
          >
            {isSending ? (
              <>
                <Loader2Icon className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <SendIcon className="h-4 w-4" />
                Send
              </>
            )}
          </Button>

          <Separator orientation="vertical" className="h-8" />

          <TooltipProvider delayDuration={0}>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={onAttach}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <PaperclipIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Attach File</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={onSignature}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Insert signature"
                  >
                    <PenLineIcon className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Insert Signature</TooltipContent>
              </Tooltip>

              <Separator orientation="vertical" className="h-6 mx-1" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    disabled={!editor.can().chain().focus().toggleBold().run()}
                    className={cn(editor.isActive("bold") && "bg-accent")}
                  >
                    <BoldIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bold</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    disabled={
                      !editor.can().chain().focus().toggleItalic().run()
                    }
                    className={cn(editor.isActive("italic") && "bg-accent")}
                  >
                    <ItalicIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Italic</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={() =>
                      editor.chain().focus().toggleUnderline().run()
                    }
                    disabled={
                      !editor.can().chain().focus().toggleUnderline().run()
                    }
                    className={cn(editor.isActive("underline") && "bg-accent")}
                  >
                    <UnderlineIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Underline</TooltipContent>
              </Tooltip>

              <Separator orientation="vertical" className="h-6 mx-1" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={() =>
                      editor.chain().focus().toggleBulletList().run()
                    }
                    className={cn(editor.isActive("bulletList") && "bg-accent")}
                  >
                    <ListIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bullet List</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={() =>
                      editor.chain().focus().toggleOrderedList().run()
                    }
                    className={cn(
                      editor.isActive("orderedList") && "bg-accent",
                    )}
                  >
                    <ListOrderedIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Numbered List</TooltipContent>
              </Tooltip>

              <Separator orientation="vertical" className="h-6 mx-1" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={onLink}
                    className={cn(editor.isActive("link") && "bg-accent")}
                  >
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Insert Link</TooltipContent>
              </Tooltip>

              <Separator orientation="vertical" className="h-6 mx-1" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                  >
                    <Undo2Icon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Undo</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                  >
                    <Redo2Icon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Redo</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>

        <Button
          type="button"
          variant="destructive"
          onClick={onDiscard}
          className="bg-destructive/10 hover:bg-destructive/20 text-destructive gap-2"
        >
          <Trash2Icon className="h-4 w-4" />
          Discard
        </Button>
      </div>
    </div>
  );
};

export default ComposeToolbar;
