import Link from "next/link";
import LoginForm from "./login-form";

export const metadata = {
  title: "Login | Aspire Mail",
  description: "Access your account and continue your journey with us",
};

const LoginPage = () => {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "Aspire Mail";
  const supportUrl = process.env.NEXT_PUBLIC_SUPPORT_URL;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">{appName}</h1>
          <p className="mt-3 text-base text-muted-foreground">Access your mailbox</p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/50 px-8 py-10 shadow-lg backdrop-blur-sm">
          <LoginForm />
        </div>

        {supportUrl ? (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <Link
              href={supportUrl}
              className="text-primary transition-colors hover:text-primary/90 underline-offset-4 hover:underline"
            >
              Need help?
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  );
};

export default LoginPage;
