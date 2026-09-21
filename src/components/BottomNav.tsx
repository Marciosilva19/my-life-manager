"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const icons = {
  hoje: "M4 5.5h16M6.5 3v2.5M17.5 3v2.5M4 9.5h16M4 5.5v13.5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V5.5",
  calendario: "M8 13h3v3H8zM4 5.5h16v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM4 9.5h16M7.5 3v3M16.5 3v3",
  financas: "M3 7.5h18v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM3 7.5 6 4h12l3 3.5M9 13h6",
  compras: "M4 7h16l-1.2 11.2a1 1 0 0 1-1 .9H6.2a1 1 0 0 1-1-.9zM9 7a3 3 0 0 1 6 0",
  mais: "M4 7h16M4 12h16M4 17h10",
};

const tabs = [
  { href: "", label: "Hoje", icon: icons.hoje },
  { href: "/calendario", label: "Calendário", icon: icons.calendario },
  { href: "/financas", label: "Finanças", icon: icons.financas },
  { href: "/compras", label: "Compras", icon: icons.compras },
  { href: "/mais", label: "Mais", icon: icons.mais },
];

export default function BottomNav({ slug }: { slug: string }) {
  const pathname = usePathname();
  const base = `/w/${slug}`;

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
    >
      <ul className="mx-auto flex max-w-3xl">
        {tabs.map((tab) => {
          const href = `${base}${tab.href}`;
          const active = tab.href === "" ? pathname === base : pathname.startsWith(href);
          return (
            <li key={tab.label} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-medium transition-colors ${
                  active ? "text-primaryInk" : "text-muted"
                }`}
              >
                <span
                  className={`flex h-8 w-14 items-center justify-center rounded-full transition-colors ${
                    active ? "bg-primarySoft" : ""
                  }`}
                >
                  <svg viewBox="0 0 24 24" className="h-[21px] w-[21px]" aria-hidden>
                    <path
                      d={tab.icon}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
