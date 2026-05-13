"use client";

import {
  PaperclipIcon,
  DownloadIcon,
  FileTextIcon,
  ImageIcon,
  FileIcon,
  FileSpreadsheetIcon,
  FileArchiveIcon,
} from "lucide-react";
import { downloadAttachmentAction } from "@/lib/actions/mail";
import { Mail, Attachment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------

interface Props {
  mail: Mail;
  folderId: string;
  currentUserEmail: string;
  content?: string;
  attachments?: Attachment[];
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

export const MailDisplayContent = ({
  mail,
  folderId,
  currentUserEmail,
  content,
  attachments,
}: Props) => {
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

  return (
    <div className="flex flex-col pl-13">
      {/* Email Body */}
      <div className="px-6 md:px-8 pb-6">
        {content ? (
          <div className="bg-white rounded-md overflow-hidden border border-border/50">
            <iframe
              title="Mail Content"
              srcDoc={`<style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                  font-size: 14px;
                  line-height: 1.6;
                  color: #333;
                  margin: 0;
                  padding: 16px;
                  word-wrap: break-word;
                }
                h1, h2, h3, h4, h5, h6 { margin-top: 24px; margin-bottom: 16px; font-weight: 600; line-height: 1.25; }
                h1 { font-size: 2em; border-bottom: 1px solid #eaecef; padding-bottom: .3em; }
                h2 { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: .3em; }
                h3 { font-size: 1.25em; }
                h4 { font-size: 1em; }
                h5 { font-size: 0.875em; }
                h6 { font-size: 0.85em; color: #6a737d; }
                p, blockquote, ul, ol, dl, table, pre, details { margin-top: 0; margin-bottom: 16px; }
                a { color: #0366d6; text-decoration: none; }
                a:hover { text-decoration: underline; }
                ul, ol { padding-left: 2em; }
                ul ul, ul ol, ol ol, ol ul { margin-top: 0; margin-bottom: 0; }
                li > p { margin-top: 16px; }
                li + li { margin-top: 0.25em; }
                blockquote { border-left: 4px solid #dfe2e5; color: #6a737d; padding: 0 1em; margin-left: 0; }
                code {
                  background-color: rgba(27,31,35,0.05);
                  border-radius: 3px;
                  font-size: 85%;
                  margin: 0;
                  padding: 0.2em 0.4em;
                  font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
                }
                pre {
                  background-color: #f6f8fa;
                  border-radius: 3px;
                  font-size: 85%;
                  line-height: 1.45;
                  overflow: auto;
                  padding: 16px;
                }
                pre code { background-color: transparent; border: 0; display: inline; margin: 0; padding: 0; word-wrap: normal; }
                img { max-width: 100%; box-sizing: content-box; border-style: none; }
                hr { box-sizing: content-box; height: 0.25em; margin: 24px 0; background-color: #e1e4e8; border: 0; padding: 0; }
                table { border-collapse: collapse; width: 100%; }
                table th, table td { border: 1px solid #dfe2e5; padding: 6px 13px; }
                table tr:nth-child(2n) { background-color: #f6f8fa; }
              </style>${content}`}
              sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
              className="w-full min-h-75"
              style={{ border: "none" }}
              onLoad={(e) => {
                const iframe = e.target as HTMLIFrameElement;
                if (iframe.contentWindow) {
                  try {
                    const adjustHeight = () => {
                      if (iframe.contentWindow?.document.body) {
                        iframe.style.height = '0px';
                        const scrollHeight = iframe.contentWindow.document.documentElement.scrollHeight;
                        iframe.style.height = `${Math.max(300, scrollHeight)}px`;
                        
                        const links = iframe.contentWindow.document.querySelectorAll('a');
                        links.forEach((link: HTMLAnchorElement) => {
                          link.setAttribute('target', '_blank');
                          link.setAttribute('rel', 'noopener noreferrer');
                        });
                      }
                    };
                    
                    adjustHeight();
                    setTimeout(adjustHeight, 500);
                    setTimeout(adjustHeight, 2000);
                  } catch (err) {
                    console.error("Error adjusting iframe height", err);
                  }
                }
              }}
            />
          </div>
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
