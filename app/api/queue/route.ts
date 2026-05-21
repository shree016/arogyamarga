import { NextResponse } from "next/server";
import { queuePatients } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({ queue: queuePatients });
}
