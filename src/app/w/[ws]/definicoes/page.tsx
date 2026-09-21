import CopyButton from "@/components/CopyButton";
import PageHeader from "@/components/PageHeader";
import FormSheet from "@/components/ui/FormSheet";
import ConfirmForm from "@/components/ui/ConfirmForm";
import { Field, Input } from "@/components/ui/Field";
import {
  clearDemo,
  moveCard,
  renameWorkspace,
  resetCards,
  seedDemo,
  setAppearance,
  setWeekStart,
  toggleCard,
} from "@/lib/actions/workspace";
import { getWorkspace, resolveSettings } from "@/lib/data";
import { getOrigin } from "@/lib/origin";
import { CARD_LABELS, type ThemeName } from "@/lib/types";

export const dynamic = "force-dynamic";

const THEMES: { value: ThemeName; label: string; swatch: string }[] = [
  { value: "rosa", label: "Rosa", swatch: "#d1648e" },
  { value: "lilas", label: "Lilás", swatch: "#8f6fc8" },
  { value: "azul", label: "Azul", swatch: "#3882c1" },
  { value: "neutro", label: "Neutro", swatch: "#5a6268" },
  { value: "escuro", label: "Escuro", swatch: "#2c2733" },
];

export default async function SettingsPage({ params }: { params: Promise<{ ws: string }> }) {
  const { ws } = await params;
  const workspace = await getWorkspace(ws);
  const settings = resolveSettings(workspace.settings);
  const origin = await getOrigin();
  const workspaceUrl = `${origin}/w/${ws}`;

  return (
    <main>
      <PageHeader title="Definições" subtitle={workspace.name} />

      <div className="space-y-4">
        {/* ------------------------------------------------------- tema */}
        <section className="card">
          <h2 className="mb-3 text-[16px]">Tema</h2>
          <div className="flex flex-wrap gap-2">
            {THEMES.map((theme) => (
              <form key={theme.value} action={setAppearance}>
                <input type="hidden" name="slug" value={ws} />
                <input type="hidden" name="theme" value={theme.value} />
                <input type="hidden" name="mode" value={settings.mode} />
                <button
                  type="submit"
                  aria-pressed={settings.theme === theme.value}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[14px] transition-colors ${
                    settings.theme === theme.value ? "border-primary bg-primarySoft text-primaryInk" : "border-border bg-surface2"
                  }`}
                >
                  <span aria-hidden className="h-4 w-4 rounded-full" style={{ background: theme.swatch }} />
                  {theme.label}
                </button>
              </form>
            ))}
          </div>

          <h3 className="mb-2 mt-5 text-[14px] font-medium">Modo</h3>
          <div className="flex gap-2">
            {(["light", "dark"] as const).map((mode) => (
              <form key={mode} action={setAppearance} className="flex-1">
                <input type="hidden" name="slug" value={ws} />
                <input type="hidden" name="theme" value={settings.theme} />
                <input type="hidden" name="mode" value={mode} />
                <button
                  type="submit"
                  aria-pressed={settings.mode === mode}
                  disabled={settings.theme === "escuro"}
                  className={`w-full rounded-xl border px-3 py-2 text-[14px] transition-colors ${
                    settings.mode === mode ? "border-primary bg-primarySoft text-primaryInk" : "border-border bg-surface2"
                  } disabled:opacity-50`}
                >
                  {mode === "light" ? "Claro" : "Escuro"}
                </button>
              </form>
            ))}
          </div>
          {settings.theme === "escuro" ? (
            <p className="mt-2 text-[12px] text-muted">O tema Escuro já usa o modo escuro.</p>
          ) : null}
        </section>

        {/* --------------------------------------------- início da semana */}
        <section className="card">
          <h2 className="mb-3 text-[16px]">Início da semana</h2>
          <div className="flex gap-2">
            {([1, 0] as const).map((value) => (
              <form key={value} action={setWeekStart} className="flex-1">
                <input type="hidden" name="slug" value={ws} />
                <input type="hidden" name="week_start" value={value} />
                <button
                  type="submit"
                  aria-pressed={settings.weekStart === value}
                  className={`w-full rounded-xl border px-3 py-2 text-[14px] transition-colors ${
                    settings.weekStart === value ? "border-primary bg-primarySoft text-primaryInk" : "border-border bg-surface2"
                  }`}
                >
                  {value === 1 ? "Segunda-feira" : "Domingo"}
                </button>
              </form>
            ))}
          </div>
        </section>

        {/* ----------------------------------------- cartões do ecrã Hoje */}
        <section className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[16px]">Cartões do ecrã Hoje</h2>
            <form action={resetCards}>
              <input type="hidden" name="slug" value={ws} />
              <button type="submit" className="btn-ghost btn-sm">
                Repor
              </button>
            </form>
          </div>

          <ul className="space-y-1.5">
            {settings.cards.map((card, index) => (
              <li key={card.id} className="flex items-center gap-2 rounded-xl bg-surface2 px-3 py-2">
                <span className={`flex-1 text-[14px] ${card.visible ? "" : "text-muted line-through"}`}>
                  {CARD_LABELS[card.id]}
                </span>

                <form action={moveCard}>
                  <input type="hidden" name="slug" value={ws} />
                  <input type="hidden" name="card" value={card.id} />
                  <input type="hidden" name="direction" value="up" />
                  <button type="submit" className="btn-ghost btn-sm" disabled={index === 0} aria-label={`Subir ${CARD_LABELS[card.id]}`}>
                    ↑
                  </button>
                </form>
                <form action={moveCard}>
                  <input type="hidden" name="slug" value={ws} />
                  <input type="hidden" name="card" value={card.id} />
                  <input type="hidden" name="direction" value="down" />
                  <button
                    type="submit"
                    className="btn-ghost btn-sm"
                    disabled={index === settings.cards.length - 1}
                    aria-label={`Descer ${CARD_LABELS[card.id]}`}
                  >
                    ↓
                  </button>
                </form>
                <form action={toggleCard}>
                  <input type="hidden" name="slug" value={ws} />
                  <input type="hidden" name="card" value={card.id} />
                  <button type="submit" className="btn-ghost btn-sm" aria-pressed={card.visible}>
                    {card.visible ? "Ocultar" : "Mostrar"}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>

        {/* -------------------------------------------------- nome e link */}
        <section className="card">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-[16px]">A minha área</h2>
            <FormSheet
              trigger="Mudar nome"
              triggerClassName="btn-ghost btn-sm"
              title="Nome da área"
              action={renameWorkspace}
              hidden={{ slug: ws }}
              submitLabel="Guardar"
            >
              <Field label="Nome" htmlFor="name">
                <Input id="name" name="name" required maxLength={60} defaultValue={workspace.name} />
              </Field>
            </FormSheet>
          </div>

          <p className="mb-2 break-all rounded-xl bg-surface2 px-3 py-2.5 text-[12px] text-muted">{workspaceUrl}</p>
          <CopyButton value={workspaceUrl} label="Copiar link da área" className="btn-soft btn-sm" />

          <p className="mt-3 rounded-xl bg-warning/10 px-3 py-2.5 text-[13px] leading-relaxed text-warning">
            Nesta versão de testes não há início de sessão: quem tiver este link vê e edita todos os dados desta área,
            incluindo as finanças. Trata-o como uma palavra-passe.
          </p>
        </section>

        {/* ------------------------------------------- dados de exemplo */}
        <section className="card">
          <h2 className="mb-2 text-[16px]">Dados de exemplo</h2>
          <p className="mb-3 text-[13px] leading-relaxed text-muted">
            Preenche a app com tarefas, horário, despesas, contas, uma lista de compras e notas temporárias para
            experimentares. Podes remover tudo de uma vez.
          </p>
          <div className="flex flex-wrap gap-2">
            <form action={seedDemo}>
              <input type="hidden" name="slug" value={ws} />
              <button type="submit" className="btn-soft btn-sm">
                Adicionar dados de exemplo
              </button>
            </form>
            <ConfirmForm action={clearDemo} message="Apagar todos os dados de exemplo desta área?">
              <input type="hidden" name="slug" value={ws} />
              <button type="submit" className="btn-ghost btn-sm">
                Apagar dados de exemplo
              </button>
            </ConfirmForm>
          </div>
        </section>
      </div>
    </main>
  );
}
