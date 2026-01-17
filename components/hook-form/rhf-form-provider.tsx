"use client";

import { ReactNode } from "react";
import { FormProvider, UseFormReturn } from "react-hook-form";

interface Props extends React.FormHTMLAttributes<HTMLFormElement> {
  children: ReactNode;
  methods: UseFormReturn<any>;
}

const RHFFormProvider = ({ children, methods, onSubmit, ...props }: Props) => {
  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} className="w-full h-full" {...props}>
        {children}
      </form>
    </FormProvider>
  );
};

export default RHFFormProvider;
