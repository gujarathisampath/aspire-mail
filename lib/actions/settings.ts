"use server";

import { cookies } from "next/headers";
import { ServerSettingsData } from "@/lib/validation/settings";

export const getServerSettingsAction = async (): Promise<
  Partial<ServerSettingsData>
> => {
  const cookieStore = await cookies();
  const settings = cookieStore.get("server-settings");

  if (!settings) return {};

  try {
    return JSON.parse(settings.value);
  } catch (e) {
    return {};
  }
};

export const updateServerSettingsAction = async (data: ServerSettingsData) => {
  const cookieStore = await cookies();

  // Store settings in an HTTP-only cookie
  // In a real app, you might save this to a database linked to the user
  cookieStore.set("server-settings", JSON.stringify(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return { success: true };
};
