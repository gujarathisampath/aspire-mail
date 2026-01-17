import {
  ArchiveIcon,
  FileIcon,
  InboxIcon,
  SendIcon,
  Trash2Icon,
  AlertCircleIcon,
  StarIcon,
} from "lucide-react";

export const FOLDER_ICONS: Record<string, any> = {
  inbox: InboxIcon,
  sent: SendIcon,
  drafts: FileIcon,
  archive: ArchiveIcon,
  junk: AlertCircleIcon,
  trash: Trash2Icon,
  starred: StarIcon,
};
