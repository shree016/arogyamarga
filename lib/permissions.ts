import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  HeartPulse,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

export const roleList = [
  "Patient",
  "Doctor",
  "Receptionist",
  "Super Admin",
] as const;

export type UserRole = (typeof roleList)[number];

export type RoleMeta = {
  title: UserRole;
  description: string;
  icon: LucideIcon;
  landing: string;
  tone: "cyan" | "blue" | "orange" | "indigo";
};

export const roleMeta: Record<UserRole, RoleMeta> = {
  Patient: {
    title: "Patient",
    description: "Start AI intake, view triage, and track your live queue.",
    icon: HeartPulse,
    landing: "/patient/intake",
    tone: "cyan",
  },
  Doctor: {
    title: "Doctor",
    description: "Review intake, generate SOAP notes, and close visits.",
    icon: Stethoscope,
    landing: "/doctor",
    tone: "blue",
  },
  Receptionist: {
    title: "Receptionist",
    description: "Manage queue flow, emergency overrides, and call next.",
    icon: ClipboardList,
    landing: "/receptionist",
    tone: "orange",
  },
  "Super Admin": {
    title: "Super Admin",
    description: "Full system control, staff management, and analytics.",
    icon: ShieldCheck,
    landing: "/admin",
    tone: "indigo",
  },
};

export const roleRoutes: Record<UserRole, string> = {
  Patient: "/patient/intake",
  Doctor: "/doctor",
  Receptionist: "/receptionist",
  "Super Admin": "/admin",
};

export const permissionsByRole: Record<UserRole, string[]> = {
  Patient: [
    "Submit symptom intake",
    "View AI triage score",
    "Select doctor or telemedicine",
    "Access QR passport",
    "Track live queue status",
  ],
  Doctor: [
    "Review intake summaries",
    "Generate SOAP notes",
    "View medical history",
    "Flag clinical risks",
    "Close patient visit",
  ],
  Receptionist: [
    "Manage live queue",
    "Prioritize emergencies",
    "Reorder patient tokens",
    "Call next patient",
    "Monitor wait analytics",
  ],
  "Super Admin": [
    "Manage staff roles",
    "Override queue settings",
    "Review audit logs",
    "Access system analytics",
    "Configure AI policies",
  ],
};
