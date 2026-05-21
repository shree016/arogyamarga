"use client";

import Link from "next/link";
import { LogOut, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";

export function UserMenu() {
  const { isAuthenticated, role, name, logout, hasHydrated } = useAuthStore();
  const router = useRouter();
  const roleLabel = role === "Super Admin" ? "Admin" : role;

  if (!hasHydrated) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <Button asChild size="sm" variant="secondary">
        <Link href="/login">Sign in</Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {role && <Badge variant="outline">{roleLabel}</Badge>}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          logout();
          router.push("/login");
        }}
      >
        <LogOut size={14} />
        Log out
      </Button>
    </div>
  );
}
