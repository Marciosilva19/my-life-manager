import type { Config } from "tailwindcss";

const c = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: c("--bg"),
        surface: c("--surface"),
        surface2: c("--surface-2"),
        text: c("--text"),
        muted: c("--muted"),
        border: c("--border"),
        primary: c("--primary"),
        primarySoft: c("--primary-soft"),
        onprimary: c("--on-primary"),
        success: c("--success"),
        warning: c("--warning"),
        danger: c("--danger"),
      },
      boxShadow: {
        soft: "0 1px 2px rgb(0 0 0 / 0.04), 0 10px 30px -18px rgb(0 0 0 / 0.25)",
      },
    },
  },
  plugins: [],
} satisfies Config;
