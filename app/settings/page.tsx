import { getSettings } from "@/lib/actions/user-settings";
import { SettingsClient } from "@/components/settings/settings-client";
import { redirect } from "next/navigation";
import { getSessionAction } from "@/lib/actions/auth";

export default async function SettingsPage() {
  const session = await getSessionAction();
  if (!session) {
    redirect("/login");
  }

  const settings = await getSettings();

  return <SettingsClient initialData={settings} userEmail={session.email} />;
}
