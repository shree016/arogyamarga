import { detectEmergency, urgencyFromScore } from "@/lib/triage";
import type { StructuredIntake, TriageResult } from "@/lib/types";

const symptomMap = [
  { key: "knee", department: "Orthopedics", doctor: "Dr. Aarav Iyer" },
  { key: "joint", department: "Orthopedics", doctor: "Dr. Aarav Iyer" },
  { key: "back", department: "Spine & Ortho", doctor: "Dr. Aarav Iyer" },
  { key: "headache", department: "Neuro Care", doctor: "Dr. Anika Rao" },
  { key: "fever", department: "General Medicine", doctor: "Dr. Rohan Mehta" },
  { key: "breathing", department: "Respiratory", doctor: "Dr. Kavya Nair" },
  { key: "stomach", department: "Digestive Health", doctor: "Dr. Vihaan Das" },
  { key: "pain", department: "General Medicine", doctor: "Dr. Rohan Mehta" },
  { key: "general", department: "General Medicine", doctor: "Dr. Rohan Mehta" },
];

const followUpQuestions: Record<string, string[]> = {
  knee: [
    "Which knee is affected?",
    "Is there swelling or warmth around the joint?",
    "Did you have any recent injury or strain?",
  ],
  joint: [
    "Which joints are affected?",
    "Is the pain worse in the morning or after activity?",
    "Do you notice swelling or stiffness?",
  ],
  back: [
    "Where exactly is the back pain located?",
    "Does the pain radiate down the leg?",
    "Did this start after lifting or exertion?",
  ],
  headache: [
    "How long have you had the headache?",
    "Is the pain severe or throbbing?",
    "Do you have fever or nausea?",
  ],
  fever: [
    "When did the fever start?",
    "Have you taken any medication?",
    "Are you experiencing chills or body aches?",
  ],
  breathing: [
    "Are you short of breath at rest?",
    "Do you feel chest tightness?",
    "Is there any wheezing or cough?",
  ],
  stomach: [
    "Is the pain sharp or dull?",
    "Have you experienced nausea or vomiting?",
    "Did you eat anything unusual recently?",
  ],
  pain: [
    "Where is the pain located?",
    "How intense is the pain on a scale of 1-10?",
    "Did it start suddenly or gradually?",
  ],
  general: [
    "When did the symptoms begin?",
    "Have you taken any medication yet?",
    "Are you experiencing any fever or nausea?",
  ],
};

function detectPrimarySymptom(input: string) {
  const normalized = input.toLowerCase();
  const match = symptomMap.find((symptom) => normalized.includes(symptom.key));
  return match ?? symptomMap[symptomMap.length - 1];
}

export function generateStructuredIntake(input: string): StructuredIntake {
  const primary = detectPrimarySymptom(input).key;
  return {
    primarySymptom: primary,
    duration: "3 days",
    fever: /fever|temperature|chills/.test(input.toLowerCase()),
    severity: detectEmergency(input) ? "critical" : "moderate",
    nausea: /nausea|vomit/.test(input.toLowerCase()),
    notes: ["Patient alert", "Vitals stable", "Needs hydration"],
  };
}

export function generateFollowUpQuestions(input: string) {
  const primary = detectPrimarySymptom(input).key;
  return followUpQuestions[primary] ?? followUpQuestions.fever;
}

export function generateTriageResult(input: string): TriageResult {
  const emergency = detectEmergency(input);
  const primary = detectPrimarySymptom(input);
  const score = emergency
    ? 5
    : Math.max(2, Math.min(4, (input.length % 4) + 2));
  const urgency = urgencyFromScore(score);

  return {
    score,
    urgency,
    confidence: emergency ? 0.98 : 0.86,
    department: emergency ? "Emergency" : primary.department,
    recommendedDoctor: emergency ? "ER Team" : primary.doctor,
    waitMinutes: emergency ? 0 : 18 + (input.length % 15),
    tags: [primary.key, urgency, emergency ? "Priority" : "Routine"],
    severityBreakdown: [
      { label: "Pain", value: emergency ? 90 : 62, color: "#FF3B30" },
      { label: "Vitals", value: emergency ? 78 : 54, color: "#FF9500" },
      { label: "History", value: emergency ? 70 : 48, color: "#0066FF" },
    ],
  };
}
