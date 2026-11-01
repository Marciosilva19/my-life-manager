"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/types";

const ITEMS: Record<Role, { href: string; label: string; icon: string }[]> = {
  trainer: [
    { href: "/dashboard", label: "Home", icon: "🏠" },
    { href: "/sessions", label: "Schedule", icon: "📅" },
    { href: "/clients", label: "Clients", icon: "👥" },
    { href: "/videos", label: "Videos", icon: "🎬" },
  ],
  client: [
    { href: "/dashboard", label: "Home", icon: "🏠" },
    { href: "/sessions", label: "Book", icon: "📅" },
    { href: "/videos", label: "Workouts", icon: "🎬" },
    { href: "/trainers", label: "Trainers", icon: "💪" },
  ],
};

/** Top tabs on desktop, bottom bar on phones. */
export default function Nav({ role }: { role: Role }) {
  const path = usePathname();
  const active = (href: string) => path === href || path.startsWith(href + "/");
  return (
    <>
      <nav className="hidden gap-1 sm:flex">
        {ITEMS[role].map((i) => (
          <Link
            key={i.href}
            href={i.href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              active(i.href) ? "bg-primarySoft text-primary" : "text-muted hover:bg-surface2 hover:text-text"
            }`}
          >
            {i.label}
          </Link>
        ))}
      </nav>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
        {ITEMS[role].map((i) => (
          <Link
            key={i.href}
            href={i.href}
            className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
              active(i.href) ? "text-primary" : "text-muted"
            }`}
          >
            <span aria-hidden className="text-lg leading-none">
              {i.icon}
            </span>
            {i.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
