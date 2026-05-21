import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export function AuthShell({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 pb-6 pt-8">
        <BrandMark />
        <ThemeToggle />
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 pb-16">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-semibold">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {children}
      </main>
    </div>
  );
}
