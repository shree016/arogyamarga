import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Language, StructuredIntake, TriageResult, ChatMessage } from "@/lib/types";

export type ChatPhase = "idle" | "followup" | "complete";

type IntakeState = {
  // Persisted chat state
  messages: ChatMessage[];
  initialSymptoms: string;
  followQueue: string[];
  currentFollowIndex: number;
  followAnswers: Record<string, string>;
  chatPhase: ChatPhase;
  // Triage / routing
  language: Language;
  structured?: StructuredIntake;
  triage?: TriageResult;
  emergency: boolean;
  token?: string;
  doctor?: string;
  doctorId?: string;
  department?: string;
  // Actions
  addMessage: (message: ChatMessage) => void;
  setInitialSymptoms: (s: string) => void;
  setFollowState: (queue: string[], index: number, answers: Record<string, string>) => void;
  advanceFollow: (question: string, answer: string) => void;
  setChatPhase: (phase: ChatPhase) => void;
  setLanguage: (language: Language) => void;
  setStructured: (structured: StructuredIntake) => void;
  setTriage: (triage: TriageResult) => void;
  setEmergency: (emergency: boolean) => void;
  setRouting: (department: string, doctor: string, doctorId?: string) => void;
  setToken: (token: string) => void;
  reset: () => void;
};

const GREETING: ChatMessage = {
  id: "intro",
  role: "ai",
  content: "Hi, I am Arogya AI. Tell me how you feel today and I will guide you to the right doctor.",
  timestamp: new Date(0).toISOString(),
};

const BLANK: Omit<IntakeState,
  | "addMessage" | "setInitialSymptoms" | "setFollowState" | "advanceFollow"
  | "setChatPhase" | "setLanguage" | "setStructured" | "setTriage"
  | "setEmergency" | "setRouting" | "setToken" | "reset"
> = {
  messages: [GREETING],
  initialSymptoms: "",
  followQueue: [],
  currentFollowIndex: 0,
  followAnswers: {},
  chatPhase: "idle",
  language: "English",
  emergency: false,
};

export const useIntakeStore = create<IntakeState>()(
  persist(
    (set) => ({
      ...BLANK,

      addMessage: (message) =>
        set((s) => ({ messages: [...s.messages, message] })),

      setInitialSymptoms: (initialSymptoms) => set({ initialSymptoms }),

      setFollowState: (followQueue, currentFollowIndex, followAnswers) =>
        set({ followQueue, currentFollowIndex, followAnswers, chatPhase: "followup" }),

      advanceFollow: (question, answer) =>
        set((s) => ({
          followAnswers: { ...s.followAnswers, [question]: answer },
          currentFollowIndex: s.currentFollowIndex + 1,
        })),

      setChatPhase: (chatPhase) => set({ chatPhase }),
      setLanguage: (language) => set({ language }),
      setStructured: (structured) => set({ structured }),
      setTriage: (triage) => set({ triage }),
      setEmergency: (emergency) => set({ emergency }),
      setRouting: (department, doctor, doctorId) => set({ department, doctor, doctorId }),
      setToken: (token) => set({ token }),

      reset: () => set({ ...BLANK, messages: [GREETING] }),
    }),
    { name: "am-intake" },
  ),
);
