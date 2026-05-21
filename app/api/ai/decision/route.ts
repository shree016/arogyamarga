import { NextResponse } from "next/server";
import { fetchOpenAIDecision } from "@/lib/openai";

export async function POST(request: Request) {
  const body = await request.json();
  const symptoms = String(body?.symptoms ?? "").trim();
  const answers = body?.answers ?? {};
  const patientName = String(body?.patientName ?? "").trim();
  const patientAge = String(body?.patientAge ?? "").trim();
  const patientGender = String(body?.patientGender ?? "").trim();

  if (!symptoms) {
    return NextResponse.json(
      { error: "Symptoms are required." },
      { status: 400 },
    );
  }

  const promptLines = [
    "Patient profile:",
    patientName ? `- Name: ${patientName}` : "- Name: not provided",
    patientAge ? `- Age: ${patientAge}` : "- Age: not provided",
    patientGender ? `- Gender: ${patientGender}` : "- Gender: not provided",
    `Patient symptoms: ${symptoms}`,
    "Follow-up answers:",
    ...Object.entries(answers).map(([q, a]) => `- ${q}: ${a}`),
    "\nPlease recommend which department or specialist to consult and a concise next-step plan.",
  ];

  const prompt = promptLines.join("\n");

  const result = await fetchOpenAIDecision(prompt).catch(() => null);

  return NextResponse.json({ decision: result?.raw ?? null });
}
