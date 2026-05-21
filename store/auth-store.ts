import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserRole } from "@/lib/permissions";

type AuthState = {
  isAuthenticated: boolean;
  role: UserRole | null;
  name: string | null;
  age: string | null;
  gender: string | null;
  hasHydrated: boolean;
  login: (payload: {
    role: UserRole;
    name: string;
    age?: string | null;
    gender?: string | null;
  }) => void;
  logout: () => void;
  setRole: (role: UserRole) => void;
  setHydrated: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      role: null,
      name: null,
      age: null,
      gender: null,
      hasHydrated: false,
      login: ({ role, name, age, gender }) =>
        set({
          isAuthenticated: true,
          role,
          name,
          age: age ?? null,
          gender: gender ?? null,
        }),
      logout: () =>
        set({
          isAuthenticated: false,
          role: null,
          name: null,
          age: null,
          gender: null,
        }),
      setRole: (role) => set({ role }),
      setHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "am-auth",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
