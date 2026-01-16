"use client";

import { ReactNode } from "react";
import { FormProvider, UseFormReturn } from "react-hook-form";

interface Props {
  children: ReactNode;
  methods: UseFormReturn<any>;
  onSubmit?: (data: any) => void;
}

const RHFFormProvider = ({ children, methods, onSubmit }: Props) => {
  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} className="w-full h-full">
        {children}
      </form>
    </FormProvider>
  );
};

export default RHFFormProvider;
