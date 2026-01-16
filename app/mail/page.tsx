import { redirect } from "next/navigation";

const MailPage = () => {
  redirect("/mail/inbox");
};

export default MailPage;
