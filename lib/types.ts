export type Language = "English" | "Hindi" | "Kannada" | "Tamil";

export type ChatRole = "user" | "ai" | "system";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
};

export type StructuredIntake = {
  primarySymptom: string;
  duration: string;
  fever: boolean;
  severity: "low" | "moderate" | "high" | "critical";
  nausea: boolean;
  notes: string[];
};

export type TriageResult = {
  score: number;
  urgency: "Safe" | "Moderate" | "Emergency";
  confidence: number;
  department: string;
  recommendedDoctor: string;
  waitMinutes: number;
  tags: string[];
  severityBreakdown: { label: string; value: number; color: string }[];
};

export type DoctorProfile = {
  id: string;
  name: string;
  specialty: string;
  department: string;
  rating: number;
  distanceKm: number;
  waitMinutes: number;
  image: string;
  highlight?: string;
};

export type QueueStatus =
  | "Registered"
  | "Waiting"
  | "File With Doctor"
  | "Your Turn";

export type QueuePatient = {
  id: string;
  name: string;
  token: string;
  department: string;
  status: QueueStatus;
  waitMinutes: number;
  emergency: boolean;
};

export type IntakeActionState = {
  status: "idle" | "success" | "error";
  aiMessage?: string;
  followUps?: string[];
  structured?: StructuredIntake;
  triage?: TriageResult;
  emergency?: boolean;
  error?: string;
  llmRequest?: string;
  llmResponse?: string;
};
