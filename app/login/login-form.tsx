"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginData } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth-store";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { loginAction } from "@/lib/actions/auth";
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
      const result = await loginAction(data);
      if (!result.success) {
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
      className="mt-8 space-y-6"
    >
      <div className="space-y-4">
        <RHFTextField
          name="email"
          label="Email"
          placeholder="name@aspiredev.in"
          type="email"
          required
        />

        <RHFPasswordField
          name="password"
          label="Password"
          placeholder="**************"
          required
        />
      </div>

      <Button
        type="submit"
        className="w-full py-2 font-medium"
        size={"lg"}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? (
          <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
        ) : null}
        Sign In
      </Button>
    </RHFFormProvider>
  );
};

export default LoginForm;
