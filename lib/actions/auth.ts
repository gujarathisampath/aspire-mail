"use server";

import { ImapFlow } from "imapflow";
import { cookies } from "next/headers";
import { cache } from "react";
import { LoginData } from "@/lib/validation/auth";
import { APP_CONFIG } from "@/lib/config";

export const loginAction = async (data: LoginData) => {
  const domain = data.email.split("@")[1];
  const { host, port, secure, rejectUnauthorized } = APP_CONFIG.server.imap;
  const imapHost = host || `mail.${domain}`;

  console.log(
    `[Auth] Attempting IMAP connection to ${imapHost}:${port} (secure: ${secure})`,
  );

  const client = new ImapFlow({
    host: imapHost,
    port: port,
    secure: secure,
    auth: {
      user: data.email,
      pass: data.password,
    },
    logger: false,
    tls: {
      rejectUnauthorized: rejectUnauthorized,
    },
  });

  try {
    await client.connect();
    console.log("[Auth] IMAP connection successful");
    await client.logout();

    // Store credentials securely in an HTTP-only cookie
    const cookieStore = await cookies();
    const sessionData = JSON.stringify({
      email: data.email,
      password: data.password,
    });

    // We only use ONE cookie now to act as the single source of truth for auth
    cookieStore.set("mail-session", sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/", // Explicitly set path to ensure accessibility
    });

    return { success: true, email: data.email };
  } catch (error: any) {
    console.error("[Auth] IMAP Error:", error.message);

    let errorMessage = "Failed to authenticate with mail server.";

    if (error.authenticationFailed) {
      errorMessage = "Invalid email or password.";
    } else if (error.code === "ECONNREFUSED") {
      errorMessage = `Cannot connect to ${imapHost}:${port}. Server may be down.`;
    } else if (error.code === "ENOTFOUND") {
      errorMessage = `Server ${imapHost} not found. Check IMAP host setting.`;
    } else if (
      error.message?.includes("SSL") ||
      error.message?.includes("packet length")
    ) {
      errorMessage = `SSL error. Try changing IMAP port to ${secure ? "143" : "993"}.`;
    }

    return { success: false, error: errorMessage };
  }
};

export const logoutAction = async () => {
  const cookieStore = await cookies();
  cookieStore.delete("mail-session");
  return { success: true };
};

export const getSessionAction = cache(async () => {
  const cookieStore = await cookies();
  const session = cookieStore.get("mail-session");
  if (!session) return null;

  try {
    const data = JSON.parse(session.value);
    return {
      email: data.email,
      name: data.email.split("@")[0],
    };
  } catch (_e) {
    cookieStore.delete("mail-session");
    return null;
  }
});
