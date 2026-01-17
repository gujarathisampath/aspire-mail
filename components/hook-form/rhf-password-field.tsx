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
                className={className}
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
