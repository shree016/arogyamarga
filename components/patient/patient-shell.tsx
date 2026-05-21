import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { UserMenu } from "@/components/auth/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export function PatientShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 pb-6 pt-8">
        <BrandMark />
        <div className="flex items-center gap-3">
          <nav className="hidden items-center gap-4 text-xs font-semibold text-muted-foreground md:flex">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <Link href="/patient/intake" className="hover:text-foreground">
              Intake
            </Link>
            <Link href="/patient/triage" className="hover:text-foreground">
              Triage
            </Link>
            <Link href="/patient/queue" className="hover:text-foreground">
              Queue
            </Link>
          </nav>
          <UserMenu />
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 pb-16">{children}</main>
    </div>
  );
}
