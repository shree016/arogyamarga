"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Switch({
  className,
  checked,
  onCheckedChange,
  ...props
}: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange">) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 items-center rounded-full border border-border transition",
        checked ? "bg-accent" : "bg-muted",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition",
          checked ? "translate-x-5" : "translate-x-1",
        )}
      />
    </button>
  );
}
