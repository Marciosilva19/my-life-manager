"use client";

import { useActionState } from "react";
import { createWorkspace } from "@/lib/actions/workspace";
import SubmitButton from "@/components/ui/SubmitButton";
import { Field, Input } from "@/components/ui/Field";
import type { ActionState } from "@/lib/types";

export default function CreateWorkspaceForm() {
  const [state, action] = useActionState<ActionState, FormData>(createWorkspace, {});

  return (
    <form action={action} className="space-y-4">
      <Field label="Como queres chamar a tua área?" htmlFor="name">
        <Input id="name" name="name" placeholder="A minha vida" maxLength={60} autoComplete="off" />
      </Field>

      {state.error ? (
        <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-[13px] text-danger">
          {state.error}
        </p>
      ) : null}

      <SubmitButton className="btn-primary w-full" pendingLabel="A preparar…">
        Criar a minha área
      </SubmitButton>
    </form>
  );
}
