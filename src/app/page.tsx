import CreateWorkspaceForm from "@/components/CreateWorkspaceForm";
import { isConfigured } from "@/lib/supabase";

const highlights = [
  { emoji: "✅", title: "Tarefas e rotinas", text: "Com prioridades, categorias e repetições." },
  { emoji: "🗓️", title: "Horário e calendário", text: "Grelha semanal e vistas de dia, semana e mês." },
  { emoji: "💶", title: "Finanças simples", text: "Rendimentos, despesas, orçamentos e contas a pagar." },
  { emoji: "🛒", title: "Compras partilháveis", text: "Um link por lista, sem criar conta." },
  { emoji: "⏳", title: "Notas temporárias", text: "Desaparecem sozinhas quando deixam de fazer sentido." },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-5 py-12">
      <div className="animate-riseIn">
        <p className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-primaryInk">Versão de testes</p>
        <h1 className="text-[32px] leading-tight">My Life Manager</h1>
        <p className="mt-3 text-[16px] leading-relaxed text-muted">
          Tarefas, horário, calendário, finanças, listas de compras e notas temporárias num só lugar — pensado para o
          telemóvel e para reduzir carga mental.
        </p>
      </div>

      <div className="card mt-7 animate-riseIn">
        {isConfigured() ? (
          <>
            <h2 className="mb-1">Começar</h2>
            <p className="mb-4 text-[14px] text-muted">
              É criada uma área privada com um link próprio. Guarda esse link: é a tua chave de acesso.
            </p>
            <CreateWorkspaceForm />
          </>
        ) : (
          <div>
            <h2 className="mb-1">Falta configurar o Supabase</h2>
            <p className="text-[14px] leading-relaxed text-muted">
              Define <code className="rounded bg-surface2 px-1">NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
              <code className="rounded bg-surface2 px-1">SUPABASE_SERVICE_ROLE_KEY</code> no ficheiro{" "}
              <code className="rounded bg-surface2 px-1">.env.local</code> (ver <code>.env.example</code>) e volta a
              carregar a página.
            </p>
          </div>
        )}
      </div>

      <ul className="mt-6 grid gap-2.5">
        {highlights.map((h) => (
          <li key={h.title} className="flex items-start gap-3 rounded-2xl bg-surface/70 px-4 py-3">
            <span aria-hidden className="text-lg">
              {h.emoji}
            </span>
            <div>
              <p className="text-[15px] font-medium">{h.title}</p>
              <p className="text-[13px] text-muted">{h.text}</p>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-7 text-center text-[12px] leading-relaxed text-muted">
        Nesta versão de testes não existe início de sessão: quem tiver o link da área vê os dados. Trata-o como privado.
      </p>
    </main>
  );
}
