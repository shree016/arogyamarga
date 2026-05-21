"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThemeStore } from "@/store/theme-store";

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <Button
      variant="glass"
      size="sm"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="gap-2"
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      <span className="text-xs font-semibold">
        {theme === "dark" ? "Light" : "Dark"}
      </span>
    </Button>
  );
}
