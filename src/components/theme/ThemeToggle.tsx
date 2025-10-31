"use client";

import { useTheme } from "@/src/contexts/ThemeContext";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-lg cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600 transition-all duration-200 group"
      aria-label="Alternar tema"
    >
      {/* Ícone do Sol (aparece no dark mode) */}
      <Sun
        className={`
          w-5 h-5 text-slate-600 dark:text-yellow-400
          transition-all duration-300
          ${theme === "dark" ? "rotate-0 scale-100" : "rotate-90 scale-0"}
          absolute inset-0 m-auto
        `}
      />

      {/* Ícone da Lua (aparece no light mode) */}
      <Moon
        className={`
          w-5 h-5 text-slate-600 dark:text-slate-300
          transition-all duration-300
          ${theme === "light" ? "rotate-0 scale-100" : "-rotate-90 scale-0"}
        `}
      />
    </button>
  );
}
