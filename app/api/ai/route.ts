import { NextResponse } from "next/server";
import {
  generateFollowUpQuestions,
  generateStructuredIntake,
  generateTriageResult,
} from "@/lib/ai";
import { detectEmergency } from "@/lib/triage";
import { fetchOpenAIFollowUps } from "@/lib/openai";

export async function POST(request: Request) {
  const body = await request.json();
  const symptoms = String(body?.symptoms ?? "").trim();

  if (!symptoms) {
    return NextResponse.json(
      { error: "Symptoms are required." },
      { status: 400 },
    );
  }

  const openAiResult = body?.useOpenAI
    ? await fetchOpenAIFollowUps(symptoms)
    : null;

  return NextResponse.json({
    emergency: detectEmergency(symptoms),
    structured: generateStructuredIntake(symptoms),
    triage: generateTriageResult(symptoms),
    followUps: openAiResult?.followUps ?? generateFollowUpQuestions(symptoms),
    llmRequest: symptoms,
    llmResponse: openAiResult?.raw,
  });
}
