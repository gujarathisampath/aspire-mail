"use client";

import { useFormContext, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldLabel,
  FieldContent,
  FieldError,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label?: string;
  helperText?: string;
  required?: boolean;
}

const RHFTextField = ({
  name,
  label,
  helperText,
  required,
  type = "text",
  className,
  ...other
}: Props) => {
  const { control } = useFormContext();

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
            <Input
              {...field}
              {...other}
              id={name}
              type={type}
              className={cn("border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 h-9 rounded-md border bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] file:h-7 file:text-sm file:font-medium focus-visible:ring-[1px] aria-invalid:ring-[1px] md:text-sm file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50", className)}
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

export default RHFTextField;
