import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoginPanel } from "@/components/auth/login-panel";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-6 px-84">
        <BrandMark />
        <ThemeToggle />
      </header>

      {/* Centered login panel */}
      <main className="flex flex-1 items-center justify-center px-6 py-4">
        <LoginPanel />
      </main>
    </div>
  );
}
