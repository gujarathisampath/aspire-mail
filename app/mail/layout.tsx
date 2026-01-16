import MainLayout from "@/components/layout/main-layout";
import { getFoldersAction } from "@/lib/actions/mail";

const MailLayout = async ({ children }: { children: React.ReactNode }) => {
  const initialFolders = await getFoldersAction();

  return <MainLayout initialFolders={initialFolders}>{children}</MainLayout>;
};

export default MailLayout;
