"use client";

import { Globe } from "lucide-react";
import { useIntakeStore } from "@/store/intake-store";
import type { Language } from "@/lib/types";

const languages: Language[] = ["English", "Hindi", "Kannada", "Tamil"];

export function LanguageSelector() {
  const { language, setLanguage } = useIntakeStore();

  return (
    <label className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground">
      <Globe size={14} />
      <span className="sr-only">Select language</span>
      <select
        className="bg-transparent text-xs font-semibold text-foreground outline-none"
        value={language}
        onChange={(event) => setLanguage(event.target.value as Language)}
      >
        {languages.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
