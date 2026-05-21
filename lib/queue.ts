import type { QueuePatient } from "@/lib/types";

export function createQueueToken(isEmergency: boolean) {
  const prefix = isEmergency ? "EM" : "AM";
  const token = `${prefix}-${Math.floor(100 + Math.random() * 900)}`;
  return token;
}

export function nextQueueStatus(status: QueuePatient["status"]) {
  const order: QueuePatient["status"][] = [
    "Registered",
    "Waiting",
    "File With Doctor",
    "Your Turn",
  ];
  const currentIndex = order.indexOf(status);
  return order[Math.min(order.length - 1, currentIndex + 1)];
}
