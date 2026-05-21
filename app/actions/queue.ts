"use server";

import { createQueueToken } from "@/lib/queue";

export async function createToken(emergency: boolean) {
  return {
    token: createQueueToken(emergency),
    createdAt: new Date().toISOString(),
  };
}
