"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Editor } from "@tiptap/react";
import { ArrowLeftIcon, FileIcon, XIcon, SaveIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

import { sendMailAction, AttachmentData } from "@/lib/actions/send";
import { saveDraftAction } from "@/lib/actions/mail";
import { sendMailSchema, SendMailFormData } from "@/lib/validation/mail";

import ComposeRecipients from "@/components/mail/compose/compose-recipients";
import ComposeEditor from "@/components/mail/compose/compose-editor";
import ComposeToolbar from "@/components/mail/compose/compose-toolbar";
import LinkDialog from "@/components/mail/compose/link-dialog";

const ComposePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [editor, setEditor] = useState<Editor | null>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialTo = searchParams.get("to") || "";
  const initialCc = searchParams.get("cc") || "";
  const initialBcc = searchParams.get("bcc") || "";
  const initialSubject = searchParams.get("subject") || "";
  const initialContent = searchParams.get("content") || "";

  const methods = useForm<SendMailFormData>({
    resolver: zodResolver(sendMailSchema),
    defaultValues: {
      to: initialTo,
      cc: initialCc,
      bcc: initialBcc,
      subject: initialSubject,
      content: initialContent,
      showCc: !!initialCc,
      showBcc: !!initialBcc,
    },
  });
  const { handleSubmit, reset, watch, getValues } = methods;
  const subject = watch("subject");

  useEffect(() => {
    if (editor && initialContent && !editor.getText()) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

  const queryClient = useQueryClient();

  const sendMutation = useMutation({
    mutationFn: sendMailAction,
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Email sent successfully");
        queryClient.invalidateQueries({ queryKey: ["mails"] });
        queryClient.invalidateQueries({ queryKey: ["folders"] });
        router.push("/mail/sent");
      } else {
        toast.error(result.error || "Failed to send email");
      }
    },
    onError: () => {
      toast.error("An unexpected error occurred.");
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: saveDraftAction,
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Draft saved");
        queryClient.invalidateQueries({ queryKey: ["mails", "drafts"] });
        queryClient.invalidateQueries({ queryKey: ["folders"] });
      } else {
        toast.error(result.error || "Failed to save draft");
      }
    },
  });

  const onSubmit = (data: SendMailFormData) => {
    sendMutation.mutate({
      to: data.to,
      cc: data.cc,
      bcc: data.bcc,
      subject: data.subject,
      content: data.content,
      attachments: attachments,
    });
  };

  const handleSaveDraft = () => {
    const values = getValues();
    saveDraftMutation.mutate({
      to: values.to || "",
      subject: values.subject || "(No Subject)",
      content: values.content || "",
    });
  };

  const handleDiscard = () => {
    reset();
    setAttachments([]);
    editor?.commands.clearContent();
    router.back();
  };

  const handleLinkApply = useCallback(
    (url: string, text?: string) => {
      if (!editor) return;

      if (!url) {
        editor.chain().focus().extendMarkRange("link").unsetLink().run();
        return;
      }

      const formattedUrl = url.startsWith("http") ? url : `https://${url}`;

      // If there's custom text, insert it with the link
      if (text && text.trim()) {
        const { from, to } = editor.state.selection;
        const hasSelection = from !== to;

        if (hasSelection) {
          // Replace selected text with linked text
          editor
            .chain()
            .focus()
            .deleteSelection()
            .insertContent(`<a href="${formattedUrl}">${text}</a>`)
            .run();
        } else {
          // Insert new linked text at cursor
          editor
            .chain()
            .focus()
            .insertContent(`<a href="${formattedUrl}">${text}</a>`)
            .run();
        }
      } else {
        // Just apply link to selection
        editor
          .chain()
          .focus()
          .extendMarkRange("link")
          .setLink({ href: formattedUrl })
          .run();
      }
    },
    [editor],
  );

  const getSelectedText = () => {
    if (!editor) return "";
    const { from, to } = editor.state.selection;
    return editor.state.doc.textBetween(from, to, " ");
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newAttachments: AttachmentData[] = [];

      for (const file of files) {
        const reader = new FileReader();
        await new Promise<void>((resolve) => {
          reader.onload = (e) => {
            const result = e.target?.result as string;
            const content = result.split(",")[1];
            newAttachments.push({
              filename: file.name,
              contentType: file.type,
              content,
            });
            resolve();
          };
          reader.readAsDataURL(file);
        });
      }
      setAttachments((prev) => [...prev, ...newAttachments]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <FormProvider {...methods}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold truncate">
              {subject || "New Message"}
            </h1>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSaveDraft}
            disabled={saveDraftMutation.isPending}
            className="gap-2"
          >
            <SaveIcon className="h-4 w-4" />
            {saveDraftMutation.isPending ? "Saving..." : "Save Draft"}
          </Button>
        </div>

        {/* Form */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ComposeRecipients />

          {/* Attachments List */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 px-4 py-2 bg-muted/20 border-b">
              {attachments.map((att, i) => (
                <Badge key={i} variant="secondary" className="gap-1 pr-1">
                  <FileIcon className="h-3 w-3" />
                  <span className="max-w-[150px] truncate">{att.filename}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 rounded-full hover:bg-muted-foreground/20"
                    onClick={() => removeAttachment(i)}
                  >
                    <XIcon className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}

          <ComposeEditor onEditorCreated={setEditor} />
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileSelect}
        />

        {/* Toolbar */}
        <ComposeToolbar
          editor={editor}
          onSend={handleSubmit(onSubmit)}
          onDiscard={handleDiscard}
          onLink={() => setLinkDialogOpen(true)}
          onAttach={handleAttachClick}
          isSending={sendMutation.isPending}
        />

        {/* Link Dialog */}
        <LinkDialog
          open={linkDialogOpen}
          onOpenChange={setLinkDialogOpen}
          initialUrl={editor?.getAttributes("link").href}
          selectedText={getSelectedText()}
          onApply={handleLinkApply}
        />
      </div>
    </FormProvider>
  );
};

export default ComposePage;
