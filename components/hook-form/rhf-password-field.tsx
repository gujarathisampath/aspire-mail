"use client";

import { useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldLabel,
  FieldContent,
  FieldError,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label?: string;
  helperText?: string;
  required?: boolean;
}

const RHFPasswordField = ({
  name,
  label,
  helperText,
  required,
  className,
  ...other
}: Props) => {
  const { control } = useFormContext();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Field data-invalid={!!error}>
          {label && (
            <FieldLabel htmlFor={name}>
              {label}
              {required && "*"}
            </FieldLabel>
          )}
          <FieldContent>
            <div className="relative">
              <Input
                {...field}
                {...other}
                id={name}
                type={showPassword ? "text" : "password"}
                className={cn("border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 h-9 rounded-md border bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] file:h-7 file:text-sm file:font-medium focus-visible:ring-[1px] aria-invalid:ring-[1px] md:text-sm file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50", className)}
                aria-invalid={!!error}
                value={field.value ?? ""}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOffIcon className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <EyeIcon className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {error ? (
              <FieldError>{error.message}</FieldError>
            ) : (
              helperText && (
                <p className="text-xs text-muted-foreground mt-1">
                  {helperText}
                </p>
              )
            )}
          </FieldContent>
        </Field>
      )}
    />
  );
};

export default RHFPasswordField;
