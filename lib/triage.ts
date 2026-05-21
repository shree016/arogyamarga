const emergencyKeywords = [
  "chest pain",
  "breathing difficulty",
  "breathing issue",
  "unconscious",
  "heavy bleeding",
  "stroke",
  "severe chest",
  "shortness of breath",
];

export function detectEmergency(input: string) {
  const normalized = input.toLowerCase();
  return emergencyKeywords.some((keyword) => normalized.includes(keyword));
}

export function urgencyFromScore(score: number) {
  if (score >= 5) return "Emergency" as const;
  if (score >= 3) return "Moderate" as const;
  return "Safe" as const;
}
