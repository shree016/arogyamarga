import { create } from "zustand";
import { persist } from "zustand/middleware";
import { queuePatients } from "@/lib/mock-data";
import type { QueuePatient } from "@/lib/types";
import { nextQueueStatus } from "@/lib/queue";

type QueueState = {
  patients: QueuePatient[];
  addPatient: (patient: QueuePatient) => void;
  prioritizeEmergency: (patient: QueuePatient) => void;
  updateStatus: (id: string) => void;
  tickWait: () => void;
  reset: () => void;
};

export const useQueueStore = create<QueueState>()(
  persist(
    (set, get) => ({
      patients: queuePatients,
      addPatient: (patient) =>
        set((state) => ({ patients: [...state.patients, patient] })),
      prioritizeEmergency: (patient) =>
        set((state) => ({
          patients: [
            patient,
            ...state.patients.filter((p) => p.id !== patient.id),
          ],
        })),
      updateStatus: (id) =>
        set((state) => ({
          patients: state.patients.map((patient) =>
            patient.id === id
              ? { ...patient, status: nextQueueStatus(patient.status) }
              : patient,
          ),
        })),
      tickWait: () => {
        const { patients } = get();
        set({
          patients: patients.map((patient) => ({
            ...patient,
            waitMinutes: Math.max(0, patient.waitMinutes - 1),
          })),
        });
      },
      reset: () => set({ patients: queuePatients }),
    }),
    { name: "am-queue" },
  ),
);
