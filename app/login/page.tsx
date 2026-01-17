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
    <div className="flex items-center justify-center min-h-screen p-2">
      <div className="flex flex-1 flex-col justify-center px-4 py-10 lg:px-6">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h3 className="text-start text-5xl font-bold text-foreground">
            Welcome
          </h3>
          <p className="text-start text-md text-muted-foreground mt-2">
            Access your account and continue your journey with us
          </p>

          <LoginForm />

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <span>{appName}</span>
            {supportUrl && (
              <>
                <span className="text-muted-foreground px-2">•</span>
                <Link
                  href={supportUrl}
                  className="font-medium text-primary hover:underline"
                >
                  Get Support
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
      <div
        className="hidden w-1/2 self-stretch bg-cover bg-center lg:block rounded-4xl"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=2160&q=80')",
        }}
      />
    </div>
  );
};

export default LoginPage;
