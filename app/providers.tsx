"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store/theme-store";
import { AuthProvider } from "@/components/auth/auth-context";

export function Providers({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    const stored = localStorage.getItem("am-theme");
    setTheme((stored as "light" | "dark") ?? "light");
  }, [setTheme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
    localStorage.setItem("am-theme", theme);
  }, [theme]);

  return <AuthProvider>{children}</AuthProvider>;
}
