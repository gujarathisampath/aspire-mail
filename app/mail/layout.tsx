import MainLayout from "@/components/layout/main-layout";
import { getFoldersAction } from "@/lib/actions/mail";
import { getSessionAction } from "@/lib/actions/auth";

const MailLayout = async ({ children }: { children: React.ReactNode }) => {
  const initialFolders = await getFoldersAction();
  const session = await getSessionAction();

  return (
    <MainLayout initialFolders={initialFolders} user={session}>
      {children}
    </MainLayout>
  );
};

export default MailLayout;
