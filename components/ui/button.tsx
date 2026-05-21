import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type ButtonVariant =
  | "default"
  | "secondary"
  | "ghost"
  | "outline"
  | "destructive"
  | "glass";

type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
};

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60 cursor-pointer";

const variantStyles: Record<ButtonVariant, string> = {
  default:
    "bg-accent text-accent-foreground hover:brightness-105 cursor-pointer",
  secondary: "bg-muted text-foreground hover:bg-muted/90",
  ghost: "bg-transparent text-foreground hover:bg-muted/60",
  outline:
    "border border-border bg-transparent text-foreground hover:bg-muted/50",
  destructive: "bg-danger text-white hover:brightness-105",
  glass: "glass text-foreground hover:shadow-glow",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-14 px-8 text-base",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
