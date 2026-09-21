"use client";

import { useEffect } from "react";
import type { Mode, ThemeName } from "@/lib/types";

/**
 * Aplica o tema guardado na workspace ao documento e mantém uma cópia local
 * para evitar um salto visual no arranque seguinte.
 */
export default function ThemeApplier({ theme, mode }: { theme: ThemeName; mode: Mode }) {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.mode = theme === "escuro" ? "dark" : mode;
    try {
      localStorage.setItem("mlm-theme", JSON.stringify({ theme, mode }));
    } catch {
      /* armazenamento indisponível: sem impacto */
    }
  }, [theme, mode]);

  return null;
}
