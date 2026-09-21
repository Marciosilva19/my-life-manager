import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Life Manager",
  description: "Tarefas, horário, calendário, finanças, compras e notas temporárias num só lugar.",
  applicationName: "My Life Manager",
  appleWebApp: { capable: true, title: "My Life Manager", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdf7fa" },
    { media: "(prefers-color-scheme: dark)", color: "#131116" },
  ],
};

/** Aplica o tema guardado antes da primeira pintura, evitando um salto visual. */
const themeBootstrap = `
try {
  var s = JSON.parse(localStorage.getItem('mlm-theme') || '{}');
  document.documentElement.dataset.theme = s.theme || 'rosa';
  document.documentElement.dataset.mode = s.theme === 'escuro' ? 'dark' : (s.mode || 'light');
} catch (e) {
  document.documentElement.dataset.theme = 'rosa';
  document.documentElement.dataset.mode = 'light';
}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT" data-theme="rosa" data-mode="light" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        {children}
      </body>
    </html>
  );
}
