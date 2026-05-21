import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Language, StructuredIntake, TriageResult } from "@/lib/types";

type IntakeState = {
  language: Language;
  structured?: StructuredIntake;
  triage?: TriageResult;
  emergency: boolean;
  token?: string;
  doctor?: string;
  department?: string;
  setLanguage: (language: Language) => void;
  setStructured: (structured: StructuredIntake) => void;
  setTriage: (triage: TriageResult) => void;
  setEmergency: (emergency: boolean) => void;
  setRouting: (department: string, doctor: string) => void;
  setToken: (token: string) => void;
  reset: () => void;
};

export const useIntakeStore = create<IntakeState>()(
  persist(
    (set) => ({
      language: "English",
      emergency: false,
      setLanguage: (language) => set({ language }),
      setStructured: (structured) => set({ structured }),
      setTriage: (triage) => set({ triage }),
      setEmergency: (emergency) => set({ emergency }),
      setRouting: (department, doctor) => set({ department, doctor }),
      setToken: (token) => set({ token }),
      reset: () =>
        set({
          structured: undefined,
          triage: undefined,
          emergency: false,
          token: undefined,
          doctor: undefined,
          department: undefined,
        }),
    }),
    {
      name: "am-intake",
      partialize: (state) => ({
        language: state.language,
        structured: state.structured,
        triage: state.triage,
        emergency: state.emergency,
        token: state.token,
        doctor: state.doctor,
        department: state.department,
      }),
    },
  ),
);
