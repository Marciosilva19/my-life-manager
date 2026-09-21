import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { getNotes, getTasks, getWorkspace } from "@/lib/data";
import { bucketTasks } from "@/lib/domain";
import { todayISO } from "@/lib/dates";
import { pluralize } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MorePage({ params }: { params: Promise<{ ws: string }> }) {
  const { ws } = await params;
  const workspace = await getWorkspace(ws);
  const [tasks, notes] = await Promise.all([getTasks(workspace.id), getNotes(workspace.id)]);
  const today = todayISO();
  const buckets = bucketTasks(tasks, today);

  const links = [
    {
      href: `/w/${ws}/tarefas`,
      emoji: "✅",
      title: "Tarefas",
      hint: `${buckets.hoje.length} ${pluralize(buckets.hoje.length, "para hoje", "para hoje")}`,
    },
    {
      href: `/w/${ws}/notas`,
      emoji: "⏳",
      title: "Notas temporárias",
      hint: `${notes.length} ${pluralize(notes.length, "nota ativa", "notas ativas")}`,
    },
    { href: `/w/${ws}/calendario`, emoji: "🗓️", title: "Horário e calendário", hint: "Dia, semana e mês" },
    { href: `/w/${ws}/definicoes`, emoji: "⚙️", title: "Definições", hint: "Tema, cartões e link privado" },
  ];

  return (
    <main>
      <PageHeader title="Mais" subtitle={workspace.name} />

      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="card flex items-center gap-3">
              <span aria-hidden className="text-xl">
                {link.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[16px] font-medium">{link.title}</p>
                <p className="text-[13px] text-muted">{link.hint}</p>
              </div>
              <span aria-hidden className="text-muted">
                ›
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-center text-[12px] leading-relaxed text-muted">
        Versão de testes · os dados vivem nesta área privada e o link funciona como chave de acesso.
      </p>
    </main>
  );
}
