"use client";

import Link from "next/link";
import {
  Activity,
  ChevronRight,
  HeartPulse,
  MessageSquare,
  QrCode,
  Stethoscope,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PatientShell } from "@/components/patient/patient-shell";
import { cn } from "@/lib/utils";

type PatientProfile = {
  patient_type: string | null;
  age: number | null;
  gender: string | null;
  blood_group: string | null;
  medical_history: string[] | null;
  allergies: string[] | null;
} | null;

type ActiveQueue = {
  id: string;
  token: string;
  status: string;
  department: string;
  wait_minutes: number | null;
  is_emergency: boolean;
  triage_urgency: string | null;
} | null;

const PATIENT_TYPE_COLORS: Record<string, string> = {
  OPD: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
  IPD: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800",
  Emergency:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",
  Referral:
    "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800",
  Telemedicine:
    "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800",
};

export function PatientHome({
  userName,
  patientProfile,
  activeQueue,
}: {
  userName: string;
  patientProfile: PatientProfile;
  activeQueue: ActiveQueue;
}) {
  const patientType = patientProfile?.patient_type ?? "OPD";
  const typeColor = PATIENT_TYPE_COLORS[patientType] ?? "";

  const actions = [
    {
      href: "/patient/intake",
      icon: MessageSquare,
      label: "Start AI Intake",
      desc: "Describe your symptoms and let AI guide you.",
      primary: true,
    },
    {
      href: "/patient/triage",
      icon: Activity,
      label: "View Triage",
      desc: "See your AI urgency score and department routing.",
    },
    {
      href: "/patient/doctors",
      icon: Stethoscope,
      label: "Select Doctor",
      desc: "Browse available doctors and confirm your visit.",
    },
    {
      href: "/patient/queue",
      icon: HeartPulse,
      label: "Track Queue",
      desc: "Live status of your position in the queue.",
    },
    {
      href: "/patient/qr",
      icon: QrCode,
      label: "QR Passport",
      desc: "Your digital patient ID for quick check-in.",
    },
  ];

  return (
    <PatientShell>
      <div className="space-y-8">
        {/* Welcome header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Good day,</p>
            <h1 className="text-3xl font-bold">{userName}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-block rounded-full border px-3 py-1 text-xs font-semibold",
                  typeColor,
                )}
              >
                {patientType}
              </span>
              {patientProfile?.gender && (
                <Badge variant="outline" className="text-xs">
                  {patientProfile.gender}
                </Badge>
              )}
              {patientProfile?.age && (
                <Badge variant="outline" className="text-xs">
                  Age {patientProfile.age}
                </Badge>
              )}
              {patientProfile?.blood_group && (
                <Badge variant="outline" className="text-xs">
                  {patientProfile.blood_group}
                </Badge>
              )}
            </div>
          </div>

          {/* Active queue badge */}
          {activeQueue && (
            <div
              className={cn(
                "rounded-2xl border p-4",
                activeQueue.is_emergency
                  ? "border-danger/30 bg-danger/10"
                  : "border-accent/30 bg-accent/10",
              )}
            >
              <p className="text-xs font-semibold text-muted-foreground">
                Active Queue Token
              </p>
              <p
                className={cn(
                  "text-2xl font-bold",
                  activeQueue.is_emergency ? "text-danger" : "text-accent",
                )}
              >
                {activeQueue.token}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {activeQueue.department} · {activeQueue.status}
              </p>
              {(activeQueue.wait_minutes ?? 0) > 0 && (
                <p className="text-xs text-muted-foreground">
                  ~{activeQueue.wait_minutes} min wait
                </p>
              )}
              <Button asChild size="sm" className="mt-3 w-full" variant="secondary">
                <Link href="/patient/queue">
                  Track
                  <ChevronRight size={14} />
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Medical info */}
        {(patientProfile?.medical_history?.length ||
          patientProfile?.allergies?.length) && (
          <div className="grid gap-3 sm:grid-cols-2">
            {patientProfile.medical_history && patientProfile.medical_history.length > 0 && (
              <Card className="glass">
                <CardContent className="p-4">
                  <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                    Medical History
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {patientProfile.medical_history.map((h) => (
                      <Badge key={h} variant="outline" className="text-xs">
                        {h}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            {patientProfile?.allergies && patientProfile.allergies.length > 0 && (
              <Card className="border-warning/30 bg-warning/5">
                <CardContent className="p-4">
                  <p className="mb-2 text-xs font-semibold uppercase text-warning">
                    Allergies
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {patientProfile.allergies.map((a) => (
                      <Badge
                        key={a}
                        variant="outline"
                        className="border-warning/40 text-xs text-warning"
                      >
                        {a}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Feature cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <Card
                  className={cn(
                    "group h-full transition-all hover:shadow-md",
                    action.primary ? "border-accent/30 bg-accent/5 hover:bg-accent/10" : "",
                  )}
                >
                  <CardContent className="flex h-full flex-col gap-3 p-5">
                    <div
                      className={cn(
                        "w-fit rounded-xl p-2",
                        action.primary
                          ? "bg-accent/15 text-accent"
                          : "bg-muted text-muted-foreground group-hover:bg-accent/10 group-hover:text-accent",
                      )}
                    >
                      <Icon size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{action.label}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {action.desc}
                      </p>
                    </div>
                    <ChevronRight
                      size={16}
                      className="self-end text-muted-foreground transition-transform group-hover:translate-x-1"
                    />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Patient type info */}
        <Card className="glass">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "rounded-xl border px-3 py-1.5 text-sm font-semibold",
                  typeColor,
                )}
              >
                {patientType}
              </div>
              <div>
                <p className="font-semibold">{patientType} Patient</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {patientType === "OPD" &&
                    "Outpatient consultation. You will be seen on the same day and discharged after your appointment."}
                  {patientType === "IPD" &&
                    "Inpatient care. You are admitted for overnight or extended treatment under continuous monitoring."}
                  {patientType === "Emergency" &&
                    "Emergency case. You have priority routing and will be seen immediately by the attending physician."}
                  {patientType === "Referral" &&
                    "Referred patient. Your file has been forwarded from another doctor or hospital for specialist consultation."}
                  {patientType === "Telemedicine" &&
                    "Online consultation. Your appointment will be conducted via video call with a verified physician."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PatientShell>
  );
}
