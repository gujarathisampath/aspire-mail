export interface MailContact {
  name?: string;
  address: string;
}

export interface Attachment {
  filename: string;
  contentType: string;
  size: number;
  contentId?: string;
}

export interface Mail {
  id: string;
  from: MailContact;
  to: MailContact[];
  cc?: MailContact[];
  bcc?: MailContact[];
  subject: string;
  preview: string;
  content?: string;
  date: string;
  read: boolean;
  starred: boolean;
  size?: number;
  hasAttachments?: boolean;
  attachments?: Attachment[];
}

export interface MailSearchFilters {
  q?: string;
  from?: string;
  exact?: string;
  dateFrom?: string;
  dateTo?: string;
  minSize?: string;
  maxSize?: string;
}

export type MailCategory = "primary" | "promotions" | "social" | "updates";

export interface Folder {
  id: string;
  name: string;
  slug: string;
  unreadCount: number;
  totalCount: number;
}
