"use client";

import { useFormContext, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label?: string;
  helperText?: string;
  required?: boolean;
  variant?: "default" | "inline";
  labelWidth?: string;
}

const RHFTextField = ({
  name,
  label,
  helperText,
  required,
  type = "text",
  className,
  variant = "default",
  labelWidth = "w-12",
  ...other
}: Props) => {
  const { control } = useFormContext();

  if (variant === "inline") {
    return (
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <div className="flex items-center gap-2">
            {label && (
              <span
                className={cn(
                  "text-sm text-muted-foreground shrink-0",
                  labelWidth,
                )}
              >
                {label}
              </span>
            )}
            <Input
              {...field}
              {...other}
              id={name}
              type={type}
              className={cn(
                "flex-1 border-0 shadow-none focus-visible:ring-0 px-0 h-9",
                className,
              )}
              aria-invalid={!!error}
              value={type === "number" && field.value === 0 ? "" : field.value}
              onChange={(event) => {
                if (type === "number") {
                  field.onChange(Number(event.target.value));
                } else {
                  field.onChange(event.target.value);
                }
              }}
            />
            {error && (
              <p className="text-xs text-destructive">{error.message}</p>
            )}
          </div>
        )}
      />
    );
  }

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Field>
          {label && (
            <FieldLabel htmlFor={name}>
              {label}
              {required && "*"}
            </FieldLabel>
          )}
          <Input
            {...field}
            {...other}
            id={name}
            type={type}
            className={className}
            aria-invalid={!!error}
            value={type === "number" && field.value === 0 ? "" : field.value}
            onChange={(event) => {
              if (type === "number") {
                field.onChange(Number(event.target.value));
              } else {
                field.onChange(event.target.value);
              }
            }}
          />
          {(error || helperText) && (
            <p
              className={`text-xs mt-1 ${error ? "text-destructive" : "text-muted-foreground"}`}
            >
              {error ? error.message : helperText}
            </p>
          )}
        </Field>
      )}
    />
  );
};

export default RHFTextField;
