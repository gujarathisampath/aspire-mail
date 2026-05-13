import MainLayout from "@/components/layout/main-layout";
import { getFoldersAction } from "@/lib/actions/mail";
import { getSessionAction } from "@/lib/actions/auth";
import { cookies } from "next/headers";

const MailLayout = async ({ children }: { children: React.ReactNode }) => {
  const [initialFolders, session, cookieStore] = await Promise.all([
    getFoldersAction(),
    getSessionAction(),
    cookies()
  ]);
  
  const defaultCollapsed = cookieStore.get("sidebar-collapsed")?.value === "true";

  return (
    <MainLayout
      initialFolders={initialFolders}
      user={session}
      defaultCollapsed={defaultCollapsed}
    >
      {children}
    </MainLayout>
  );
};

export default MailLayout;
