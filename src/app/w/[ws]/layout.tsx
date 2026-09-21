import type { ReactNode } from "react";
import BottomNav from "@/components/BottomNav";
import ThemeApplier from "@/components/ThemeApplier";
import { getWorkspace, purgeExpiredNotes, resolveSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ ws: string }>;
}) {
  const { ws } = await params;
  const workspace = await getWorkspace(ws);
  const settings = resolveSettings(workspace.settings);

  // Limpeza automática das notas temporárias cuja validade já passou.
  await purgeExpiredNotes();

  return (
    <>
      <ThemeApplier theme={settings.theme} mode={settings.mode} />
      <div className="mx-auto min-h-dvh w-full max-w-3xl px-4 pt-6 safe-bottom sm:px-6">{children}</div>
      <BottomNav slug={ws} />
    </>
  );
}
