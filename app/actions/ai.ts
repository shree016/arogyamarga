"use server";

import {
  generateFollowUpQuestions,
  generateStructuredIntake,
  generateTriageResult,
} from "@/lib/ai";
import { fetchOpenAIFollowUps } from "@/lib/openai";
import { detectEmergency } from "@/lib/triage";
import type { IntakeActionState } from "@/lib/types";

export async function submitIntake(
  _prevState: IntakeActionState,
  formData: FormData,
): Promise<IntakeActionState> {
  const symptoms = String(formData.get("symptoms") ?? "").trim();
  const patientName = String(formData.get("patientName") ?? "").trim();
  const patientAge = String(formData.get("patientAge") ?? "").trim();
  const patientGender = String(formData.get("patientGender") ?? "").trim();

  if (!symptoms) {
    return {
      status: "error",
      error: "Please describe your symptoms.",
    };
  }

  const emergency = detectEmergency(symptoms);
  const structured = generateStructuredIntake(symptoms);
  const triage = generateTriageResult(symptoms);
  const followUps = generateFollowUpQuestions(symptoms);
  const patientContext = [
    patientName ? `Name: ${patientName}` : null,
    patientAge ? `Age: ${patientAge}` : null,
    patientGender ? `Gender: ${patientGender}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const llmPrompt = [
    "Patient intake summary:",
    patientContext || "No patient profile provided.",
    `Main symptom: ${symptoms}`,
    "Ask 3 to 5 short follow-up questions.",
    "If a question can be answered with fixed choices, include them in parentheses like (Yes / No) or (Mild / Moderate / Severe).",
    "Return each question on a new line and do not add extra explanation.",
  ].join("\n");
  // Ask LLM for follow-up questions when API key available; fall back to deterministic generator
  const llmResult = await fetchOpenAIFollowUps(llmPrompt).catch(() => null);
  const followUpsFinal =
    llmResult && llmResult.followUps && llmResult.followUps.length
      ? llmResult.followUps
      : followUps;

  // Prefer LLM-provided text when available so the UI shows the real AI reply
  const defaultAiMessage = emergency
    ? "I have detected an emergency symptom. We are escalating you to priority care."
    : "Thanks for sharing. I will ask a few quick questions to refine your triage.";

  const aiMessage = llmResult?.raw
    ? String(llmResult.raw).trim().split("\n")[0]
    : defaultAiMessage;

  return {
    status: "success",
    aiMessage,
    followUps: followUpsFinal,
    structured,
    triage,
    emergency,
    llmRequest: llmPrompt,
    llmResponse: llmResult?.raw,
  };
}
