"use client";

import {
  PaperclipIcon,
  DownloadIcon,
  FileTextIcon,
  ImageIcon,
  FileIcon,
  FileSpreadsheetIcon,
  FileArchiveIcon,
  ExternalLinkIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  getMailDetailsAction,
  downloadAttachmentAction,
} from "@/lib/actions/mail";
import { Mail, Attachment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------

interface Props {
  mail: Mail;
  folderId: string;
}

// ----------------------------------------------------------------------

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const getFileInfo = (contentType: string, filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase() || "";

  const fileTypes: Record<string, { icon: React.ReactNode; color: string }> = {
    pdf: { icon: <FileTextIcon className="h-6 w-6" />, color: "text-red-500" },
    doc: { icon: <FileTextIcon className="h-6 w-6" />, color: "text-blue-500" },
    docx: {
      icon: <FileTextIcon className="h-6 w-6" />,
      color: "text-blue-500",
    },
    xls: {
      icon: <FileSpreadsheetIcon className="h-6 w-6" />,
      color: "text-green-600",
    },
    xlsx: {
      icon: <FileSpreadsheetIcon className="h-6 w-6" />,
      color: "text-green-600",
    },
    csv: {
      icon: <FileSpreadsheetIcon className="h-6 w-6" />,
      color: "text-green-600",
    },
    zip: {
      icon: <FileArchiveIcon className="h-6 w-6" />,
      color: "text-yellow-600",
    },
    rar: {
      icon: <FileArchiveIcon className="h-6 w-6" />,
      color: "text-yellow-600",
    },
  };

  if (contentType?.startsWith("image/")) {
    return {
      icon: <ImageIcon className="h-6 w-6" />,
      color: "text-purple-500",
    };
  }

  return (
    fileTypes[ext] || {
      icon: <FileIcon className="h-6 w-6" />,
      color: "text-muted-foreground",
    }
  );
};

// ----------------------------------------------------------------------

export const MailDisplayContent = ({ mail, folderId }: Props) => {
  const { data, isLoading } = useQuery({
    queryKey: ["mail-details", folderId, mail.id],
    queryFn: () => getMailDetailsAction(folderId, mail.id),
    staleTime: 30 * 60 * 1000, // 30 minutes for individual mail content
  });

  const content = data?.content;
  const attachments = data?.attachments as Attachment[] | undefined;
  const hasAttachments = attachments && attachments.length > 0;

  const handleDownload = async (attachmentId: string, filename: string) => {
    const loadingId = toast.loading(`Downloading ${filename}...`);

    try {
      const result = await downloadAttachmentAction(
        folderId,
        mail.id,
        attachmentId,
      );
      toast.dismiss(loadingId);

      if (result) {
        const link = document.createElement("a");
        link.href = `data:${result.contentType};base64,${result.content}`;
        link.download = result.filename || filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Download complete");
      } else {
        toast.error("Download failed");
      }
    } catch {
      toast.dismiss(loadingId);
      toast.error("Download failed");
    }
  };

  const handleDownloadAll = () => {
    if (!attachments) return;
    attachments.forEach((att, idx) => {
      setTimeout(() => handleDownload(idx.toString(), att.filename), idx * 500);
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Email Body */}
      <div className="px-6 md:px-8 pb-6">
        {content ? (
          <div
            className="prose prose-sm max-w-none dark:prose-invert prose-a:text-primary prose-img:rounded-md"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <FileTextIcon className="h-12 w-12 mb-4 opacity-20" />
            <p className="font-medium">No content available</p>
            {mail.preview && (
              <p className="text-sm mt-2 max-w-md opacity-70">{mail.preview}</p>
            )}
          </div>
        )}
      </div>

      {/* Attachments */}
      {hasAttachments && (
        <div className="border-t">
          <div className="px-6 md:px-8 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <PaperclipIcon className="h-4 w-4 text-muted-foreground" />
                <span>
                  {attachments.length} attachment
                  {attachments.length > 1 ? "s" : ""}
                </span>
              </div>

              {attachments.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownloadAll}
                  className="h-8 text-xs"
                >
                  <DownloadIcon className="h-3.5 w-3.5 mr-1.5" />
                  Download all
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {attachments.map((att, idx) => {
                const { icon, color } = getFileInfo(
                  att.contentType,
                  att.filename,
                );

                return (
                  <button
                    key={idx}
                    onClick={() => handleDownload(idx.toString(), att.filename)}
                    className="group relative flex flex-col items-center p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-center"
                  >
                    <div className={cn("mb-2", color)}>{icon}</div>
                    <span className="text-xs font-medium truncate w-full px-1">
                      {att.filename}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      {formatFileSize(att.size)}
                    </span>

                    {/* Download overlay on hover */}
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                      <DownloadIcon className="h-5 w-5 text-primary" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
