"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginData } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth-store";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import RHFFormProvider from "@/components/hook-form/rhf-form-provider";
import RHFTextField from "@/components/hook-form/rhf-text-field";
import RHFPasswordField from "@/components/hook-form/rhf-password-field";
import { toast } from "sonner";

const LoginForm = () => {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const methods = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { handleSubmit } = methods;

  const mutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Authentication failed.");
      }
      return { ...result, email: data.email };
    },
    onSuccess: (data) => {
      setAuth({
        email: data.email,
        name: data.email.split("@")[0],
      });
      toast.success(`Welcome back, ${data.email.split("@")[0]}!`);
      router.push("/mail/inbox");
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Sign in failed");
    },
  });

  const onSubmit = (data: LoginData) => {
    mutation.mutate(data);
  };

  return (
    <RHFFormProvider
      methods={methods}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
    >
      <div className="space-y-5">
        <RHFTextField
          name="email"
          label="Email address"
          placeholder="you@company.com"
          type="email"
          required
          autoComplete="email"
          className="h-11 rounded-lg border border-border bg-background/50 px-4 py-2.5 shadow-sm transition-all placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/30"
        />

        <RHFPasswordField
          name="password"
          label="Password"
          placeholder="••••••••"
          required
          autoComplete="current-password"
          className="h-11 rounded-lg border border-border bg-background/50 px-4 py-2.5 shadow-sm transition-all placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/30"
        />
      </div>

      <Button
        type="submit"
        className="mt-8 w-full rounded-lg py-6 font-semibold shadow-md transition-all duration-200 hover:shadow-lg hover:brightness-110"
        size={"lg"}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? (
          <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
        ) : null}
        Sign in
      </Button>
    </RHFFormProvider>
  );
};

export default LoginForm;
