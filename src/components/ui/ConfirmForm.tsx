"use client";

import type { ReactNode } from "react";

/** Formulário que pede confirmação antes de executar (apagar, limpar, etc.). */
export default function ConfirmForm({
  action,
  message,
  children,
  className,
}: {
  action: (form: FormData) => Promise<void>;
  message: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </form>
  );
}
