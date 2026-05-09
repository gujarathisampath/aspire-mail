import { Mail, MailCategory } from "@/lib/types";

// ─── Domain lists ────────────────────────────────────────────────────────────

const SOCIAL_DOMAINS = new Set([
  "facebook.com", "facebookmail.com",
  "twitter.com", "t.co", "twitteremail.com",
  "instagram.com", "notifications.instagram.com",
  "linkedin.com", "notifications.linkedin.com",
  "pinterest.com",
  "tiktok.com",
  "snapchat.com",
  "reddit.com", "redditmail.com",
  "youtube.com",
  "discord.com",
  "telegram.org",
  "whatsapp.com",
  "github.com", "noreply.github.com",
  "gitlab.com",
  "slack.com", "notifications.slack.com",
  "zoom.us",
  "meetup.com",
  "quora.com",
  "tumblr.com",
  "twitch.tv",
]);

const PROMO_DOMAINS = new Set([
  "mailchimp.com", "list-manage.com",
  "sendgrid.net", "sendgrid.com",
  "amazonses.com",
  "constantcontact.com",
  "campaignmonitor.com",
  "klaviyo.com",
  "hubspot.com", "hs-mail.com",
  "salesforce.com", "salesforcemarketing.com",
  "marketo.com", "mktoweb.com",
  "exacttarget.com",
  "omnisend.com",
  "drip.com",
  "mailerlite.com",
  "convertkit.com",
  "activecampaign.com",
  "sendinblue.com", "brevo.com",
  "postmarkapp.com",
  "sparkpost.com",
  "mandrill.com",
  "elasticemail.com",
]);

const UPDATES_DOMAINS = new Set([
  "google.com", "accounts.google.com", "no-reply.accounts.google.com",
  "paypal.com",
  "amazon.com", "amazon.co.in",
  "apple.com",
  "microsoft.com",
  "github.com",
  "stripe.com",
  "notion.so",
  "atlassian.com", "jira.atlassian.com",
  "zendesk.com",
  "shopify.com",
  "uber.com",
  "ola.com",
  "swiggy.com",
  "zomato.com",
  "flipkart.com",
  "myntra.com",
  "booking.com",
  "airbnb.com",
  "netflix.com",
  "spotify.com",
  "trello.com",
  "dropbox.com",
  "box.com",
  "figma.com",
  "vercel.com",
  "netlify.com",
  "heroku.com",
  "digitalocean.com",
  "cloudflare.com",
  "namecheap.com",
  "godaddy.com",
]);

// ─── Keyword lists ───────────────────────────────────────────────────────────

const PROMO_SUBJECT_KEYWORDS = [
  "% off", "discount", "sale", "deal", "offer", "coupon", "promo",
  "save ", "free ", "limited time", "exclusive", "flash sale",
  "black friday", "cyber monday", "clearance", "buy now", "shop now",
  "unsubscribe", "newsletter", "special offer", "earn ", "redeem",
  "reward", "cashback", "voucher", "gift card", "subscribe",
];

const SOCIAL_SUBJECT_KEYWORDS = [
  "friend request", "connection request", "accepted your",
  "mentioned you", "tagged you", "commented on", "replied to",
  "liked your", "followed you", "sent you a message",
  "new follower", "invitation to connect", "wants to connect",
  "joined linkedin", "new message from",
];

const UPDATES_SUBJECT_KEYWORDS = [
  "invoice", "receipt", "order", "shipped", "delivery", "tracking",
  "confirmed", "confirmation", "payment", "transaction", "account",
  "statement", "bill", "subscription", "renewal", "updated",
  "security alert", "sign-in", "signin", "login", "verify",
  "two-factor", "2fa", "otp", "password", "reset password",
  "your booking", "reservation", "ticket", "boarding pass",
  "notification", "alert", "reminder", "action required",
];

// ─── Core classifier ─────────────────────────────────────────────────────────

function extractDomain(email: string): string {
  const match = email.match(/@([^>]+)/);
  return (match?.[1] || "").toLowerCase().trim();
}

export function categorizeMail(mail: Mail): MailCategory {
  const fromDomain = extractDomain(mail.from.address);
  const subject = (mail.subject || "").toLowerCase();

  // Check by sender domain first (most reliable signal)
  if (SOCIAL_DOMAINS.has(fromDomain)) return "social";
  if (PROMO_DOMAINS.has(fromDomain)) return "promotions";
  if (UPDATES_DOMAINS.has(fromDomain)) return "updates";

  // Subdomain matching (e.g. notifications.github.com → social)
  const baseDomain = fromDomain.split(".").slice(-2).join(".");
  if (SOCIAL_DOMAINS.has(baseDomain)) return "social";
  if (PROMO_DOMAINS.has(baseDomain)) return "promotions";
  if (UPDATES_DOMAINS.has(baseDomain)) return "updates";

  // Check subject keywords
  if (SOCIAL_SUBJECT_KEYWORDS.some((kw) => subject.includes(kw))) return "social";
  if (PROMO_SUBJECT_KEYWORDS.some((kw) => subject.includes(kw))) return "promotions";
  if (UPDATES_SUBJECT_KEYWORDS.some((kw) => subject.includes(kw))) return "updates";

  // Check for bulk email patterns in from address
  const fromLocal = (mail.from.address.split("@")[0] || "").toLowerCase();
  if (
    fromLocal.includes("noreply") ||
    fromLocal.includes("no-reply") ||
    fromLocal.includes("newsletter") ||
    fromLocal.includes("mailer") ||
    fromLocal.includes("notify") ||
    fromLocal.includes("notification") ||
    fromLocal.includes("updates") ||
    fromLocal.includes("info") ||
    fromLocal.includes("hello") ||
    fromLocal.includes("support") ||
    fromLocal.includes("marketing")
  ) {
    // Distinguish updates vs promos for no-reply senders
    if (UPDATES_SUBJECT_KEYWORDS.some((kw) => subject.includes(kw))) return "updates";
    return "promotions";
  }

  return "primary";
}

export function categorizeMails(mails: Mail[]): Record<MailCategory, Mail[]> {
  const result: Record<MailCategory, Mail[]> = {
    primary: [],
    social: [],
    promotions: [],
    updates: [],
  };

  for (const mail of mails) {
    result[categorizeMail(mail)].push(mail);
  }

  return result;
}
