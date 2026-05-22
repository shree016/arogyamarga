"use client";

import Link from "next/link";
import { LogOut, UserCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";

export function UserMenu() {
  const { isAuthenticated, role, name, patientId, clearUser, hasHydrated } = useAuthStore();

  if (!hasHydrated) return null;

  if (!isAuthenticated) {
    return (
      <Button asChild size="sm" variant="secondary">
        <Link href="/login">Sign in</Link>
      </Button>
    );
  }

  const roleLabel = role === "Super Admin" ? "Admin" : role;
  const displayName = role === "Patient" && patientId ? `${name} · ${patientId}` : name;

  const handleLogout = () => {
    clearUser();
    // Clear persisted stores
    try {
      localStorage.removeItem("am-intake");
    } catch { /* ignore */ }
    // Hard navigate to server-side signout route so cookies are cleared
    // before the middleware runs on /login.
    window.location.href = "/api/auth/signout";
  };

  return (
    <div className="flex items-center gap-2">
      <div className="hidden items-center gap-2 md:flex">
        <UserCircle size={16} className="text-muted-foreground" />
        <span className="text-sm font-medium">{displayName}</span>
      </div>
      {roleLabel && (
        <Badge variant="outline" className="hidden md:inline-flex">
          {roleLabel}
        </Badge>
      )}
      <Button size="sm" variant="ghost" onClick={handleLogout}>
        <LogOut size={14} />
        <span className="hidden sm:inline">Log out</span>
      </Button>
    </div>
  );
}
