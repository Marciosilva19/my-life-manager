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
        primaryInk: c("--primary-ink"),
        primarySoft: c("--primary-soft"),
        onprimary: c("--on-primary"),
        accent: c("--accent"),
        success: c("--success"),
        warning: c("--warning"),
        danger: c("--danger"),
      },
      boxShadow: {
        soft: "0 1px 2px rgb(0 0 0 / 0.04), 0 10px 30px -18px rgb(0 0 0 / 0.25)",
        lift: "0 2px 6px rgb(0 0 0 / 0.06), 0 18px 40px -20px rgb(0 0 0 / 0.30)",
      },
      borderRadius: { "2xl": "1.125rem", "3xl": "1.5rem" },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      keyframes: {
        zoomIn: { "0%": { opacity: "0", transform: "scale(.965)" }, "100%": { opacity: "1", transform: "scale(1)" } },
        zoomOut: { "0%": { opacity: "0", transform: "scale(1.035)" }, "100%": { opacity: "1", transform: "scale(1)" } },
        riseIn: { "0%": { opacity: "0", transform: "translateY(10px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        sheetIn: { "0%": { transform: "translateY(16px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
      },
      animation: {
        zoomIn: "zoomIn .28s cubic-bezier(.22,.9,.3,1)",
        zoomOut: "zoomOut .28s cubic-bezier(.22,.9,.3,1)",
        riseIn: "riseIn .3s ease-out",
        sheetIn: "sheetIn .24s cubic-bezier(.22,.9,.3,1)",
        fadeIn: "fadeIn .2s ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;
