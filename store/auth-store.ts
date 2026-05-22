import { create } from "zustand";
import type { UserRole } from "@/lib/permissions";

type AuthState = {
  isAuthenticated: boolean;
  userId: string | null;
  role: UserRole | null;
  name: string | null;
  email: string | null;
  patientType: string | null;
  patientId: string | null; // PT-XXXX identifier for patients
  hasHydrated: boolean;
  setUser: (payload: {
    userId: string;
    role: UserRole;
    name: string;
    email: string;
    patientType?: string | null;
    patientId?: string | null;
  }) => void;
  clearUser: () => void;
  setHydrated: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>()((set) => ({
  isAuthenticated: false,
  userId: null,
  role: null,
  name: null,
  email: null,
  patientType: null,
  patientId: null,
  hasHydrated: false,
  setUser: ({ userId, role, name, email, patientType, patientId }) =>
    set({
      isAuthenticated: true,
      userId,
      role,
      name,
      email,
      patientType: patientType ?? null,
      patientId: patientId ?? null,
    }),
  clearUser: () =>
    set({
      isAuthenticated: false,
      userId: null,
      role: null,
      name: null,
      email: null,
      patientType: null,
      patientId: null,
    }),
  setHydrated: (value) => set({ hasHydrated: value }),
}));
