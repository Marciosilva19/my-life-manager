"use client";

import { useActionState, useEffect, useId, useRef, useState, type ReactNode } from "react";
import Sheet from "./Sheet";
import SubmitButton from "./SubmitButton";
import type { ActionState } from "@/lib/types";

type Props = {
  trigger: ReactNode;
  triggerClassName?: string;
  triggerAriaLabel?: string;
  title: string;
  description?: string;
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  hidden?: Record<string, string | undefined>;
  submitLabel?: string;
  children: ReactNode;
};

/** Botão que abre um painel com um formulário ligado a uma Server Action. */
export default function FormSheet({
  trigger,
  triggerClassName = "btn-primary",
  triggerAriaLabel,
  title,
  description,
  action,
  hidden = {},
  submitLabel = "Guardar",
  children,
}: Props) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});
  const [formKey, setFormKey] = useState(0);
  const errorId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const submitted = useRef<[string, FormDataEntryValue][]>([]);

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      setFormKey((k) => k + 1);
      submitted.current = [];
      return;
    }
    // Em caso de erro, o formulário é reposto pelo React: devolvemos o que já
    // tinha sido escrito para não obrigar a preencher tudo de novo.
    const form = formRef.current;
    if (!state.error || !form || submitted.current.length === 0) return;
    const entries = submitted.current;
    for (const element of Array.from(form.elements)) {
      const field = element as HTMLInputElement;
      if (!field.name || field.type === "hidden" || field.type === "submit") continue;
      if (field.type === "checkbox" || field.type === "radio") {
        field.checked = entries.some(([name, value]) => name === field.name && String(value) === field.value);
      } else {
        const match = entries.find(([name]) => name === field.name);
        if (match) field.value = String(match[1]);
      }
    }
  }, [state]);

  return (
    <>
      <button type="button" className={triggerClassName} aria-label={triggerAriaLabel} onClick={() => setOpen(true)}>
        {trigger}
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title={title} description={description}>
        <form
          key={formKey}
          ref={formRef}
          action={formAction}
          onSubmit={(event) => {
            submitted.current = [...new FormData(event.currentTarget).entries()];
          }}
          className="space-y-4"
        >
          {Object.entries(hidden).map(([name, value]) =>
            value === undefined ? null : <input key={name} type="hidden" name={name} value={value} />,
          )}

          {children}

          {state.error ? (
            <p id={errorId} role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-[13px] text-danger">
              {state.error}
            </p>
          ) : null}

          <div className="flex gap-2 pt-1">
            <button type="button" className="btn-outline flex-1" onClick={() => setOpen(false)}>
              Cancelar
            </button>
            <SubmitButton className="btn-primary flex-1">{submitLabel}</SubmitButton>
          </div>
        </form>
      </Sheet>
    </>
  );
}
