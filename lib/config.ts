export const APP_CONFIG = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "Aspire Mail",
  description:
    process.env.NEXT_PUBLIC_APP_DESCRIPTION ||
    "Modern, open-source webmail for custom mail servers.",
  logoUrl: process.env.NEXT_PUBLIC_LOGO_URL || "/logo.png",
  meta: {
    title: process.env.NEXT_PUBLIC_META_TITLE || "Aspire Mail",
    description:
      process.env.NEXT_PUBLIC_META_DESCRIPTION || "Premium webmail experience.",
  },
  server: {
    imap: {
      host: process.env.IMAP_HOST || "",
      port: parseInt(process.env.IMAP_PORT || "993"),
      secure: process.env.IMAP_SECURE === "true",
      rejectUnauthorized: process.env.IMAP_REJECT_UNAUTHORIZED !== "false",
    },
    smtp: {
      host: process.env.SMTP_HOST || "",
      port: parseInt(process.env.SMTP_PORT || "465"),
      secure: process.env.SMTP_SECURE === "true",
      rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== "false",
    },
  },
} as const;

export type AppConfig = typeof APP_CONFIG;

export const getAppConfig = () => APP_CONFIG;
