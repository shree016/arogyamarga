"use client";

import { type ReactNode, useEffect } from "react";
import { createClient } from "@/lib/client";
import { useAuthStore } from "@/store/auth-store";
import type { UserRole } from "@/lib/permissions";

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setUser, clearUser, setHydrated } = useAuthStore();

  useEffect(() => {
    const supabase = createClient();

    async function syncUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, full_name, email")
          .eq("id", user.id)
          .single();

        let patientType: string | null = null;
        let patientId: string | null = null;

        if (profile?.role === "Patient") {
          const { data: pp } = await supabase
            .from("patient_profiles")
            .select("patient_type, patient_id")
            .eq("id", user.id)
            .single();
          patientType = pp?.patient_type ?? null;
          patientId = pp?.patient_id ?? null;
        }

        if (profile) {
          setUser({
            userId: user.id,
            role: profile.role as UserRole,
            name: profile.full_name,
            email: profile.email ?? user.email ?? "",
            patientType,
            patientId,
          });
        }
      } else {
        clearUser();
      }
      setHydrated(true);
    }

    syncUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        syncUser();
      } else {
        clearUser();
        setHydrated(true);
        // If the session was explicitly signed out (not just an initial check),
        // redirect to login so the user isn't stuck on a protected page.
        if (event === "SIGNED_OUT" && !window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, clearUser, setHydrated]);

  return <>{children}</>;
}
