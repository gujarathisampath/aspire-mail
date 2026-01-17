"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginData } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { useAuthStore } from "@/lib/store/auth-store";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react";
import { loginAction } from "@/lib/actions/auth";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";

const LoginPage = () => {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

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
      router.push("/mail/inbox");
      router.refresh();
    },
  });

  const onSubmit = (data: LoginData) => {
    mutation.mutate(data);
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-2">
      <div className="flex flex-1 flex-col justify-center px-4 py-10 lg:px-6">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h3 className="text-start text-5xl text-foreground dark:text-foreground">
            Welcome
          </h3>
          <p className="text-start text-md text-muted-foreground dark:text-muted-foreground">
            Access your account and continue your journey with us
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <Label
                htmlFor="email"
                className="text-sm font-medium text-foreground dark:text-foreground"
              >
                Email
              </Label>
              <Input
                type="email"
                id="email"
                placeholder="name@aspiredev.in"
                className="mt-2"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-foreground dark:text-foreground"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="**************"
                  className="mt-2"
                  {...register("password")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-1 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <EyeIcon className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
            <Button type="submit" className="mt-4 w-full py-2 font-medium" size={"lg"} disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2Icon className="h-4 w-4 animate-spin" /> : null} Sign In
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
             <span>
                {process.env.NEXT_PUBLIC_APP_NAME}
             </span>
             <span className="text-muted-foreground px-2">
              •
             </span>
             {process.env.NEXT_PUBLIC_SUPPORT_URL && (
              <Link href={process.env.NEXT_PUBLIC_SUPPORT_URL} className="font-medium text-primary hover:underline">
                Get Support
              </Link>
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
