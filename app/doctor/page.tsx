import { Clipboard, ClipboardList, Clock, ShieldAlert, Users } from "lucide-react";
import { RoleGuard } from "@/components/auth/role-guard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabaseAdmin } from "@/lib/supabase";
import { createClient } from "@/lib/server";
import { DoctorQueueActions } from "@/components/doctor/doctor-queue-actions";

export const dynamic = "force-dynamic";

async function getDoctorQueue(doctorId: string) {
  const { data } = await supabaseAdmin
    .from("queue_entries")
    .select(
      `
      id, token, department, status, patient_type, is_emergency,
      symptoms, triage_score, triage_urgency, wait_minutes, checked_in_at,
      profiles!queue_entries_patient_id_fkey(id, full_name, phone),
      patient_profiles!inner(age, gender, blood_group, medical_history, allergies)
    `,
    )
    .eq("doctor_id", doctorId)
    .not("status", "in", '("Completed","Cancelled")')
    .order("is_emergency", { ascending: false })
    .order("checked_in_at", { ascending: true });
  return data ?? [];
}

async function getRecentAppointments(doctorId: string) {
  const { data } = await supabaseAdmin
    .from("appointments")
    .select(
      `
      id, status, scheduled_at, chief_complaint, soap_notes,
      profiles!appointments_patient_id_fkey(full_name)
    `,
    )
    .eq("doctor_id", doctorId)
    .order("scheduled_at", { ascending: false })
    .limit(5);
  return data ?? [];
}

function urgencyVariant(urgency?: string) {
  if (urgency === "Emergency") return "danger";
  if (urgency === "Moderate") return "warning";
  return "success";
}

export default async function DoctorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get doctor profile
  const { data: doctorProfile } = await supabaseAdmin
    .from("doctor_profiles")
    .select("*, profiles(full_name, email)")
    .eq("id", user?.id ?? "")
    .single();

  const queue = user?.id ? await getDoctorQueue(user.id) : [];
  const appointments = user?.id ? await getRecentAppointments(user.id) : [];

  const activePatient = queue[0] ?? null;
  const pp = activePatient
    ? Array.isArray((activePatient as unknown as Record<string, unknown>).patient_profiles)
      ? ((activePatient as unknown as Record<string, unknown>).patient_profiles as Array<Record<string, unknown>>)[0]
      : (activePatient as unknown as Record<string, unknown>).patient_profiles
    : null;
  const patientProfile = activePatient
    ? Array.isArray((activePatient as unknown as Record<string, unknown>).profiles)
      ? ((activePatient as unknown as Record<string, unknown>).profiles as Array<Record<string, unknown>>)[0]
      : (activePatient as unknown as Record<string, unknown>).profiles
    : null;

  const soapNotes = appointments[0]?.soap_notes as {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
  } | null;

  return (
    <RoleGuard allow={["Doctor", "Super Admin"]}>
      <DashboardShell
        title="Doctor Workspace"
        subtitle="Patient queue, AI-generated SOAP notes, and clinical risk flags."
      >
        {/* Doctor info bar */}
        {doctorProfile && (
          <div className="mb-6 flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950">
              <span className="text-sm font-bold">
                {(Array.isArray(doctorProfile.profiles)
                  ? doctorProfile.profiles[0]
                  : doctorProfile.profiles
                )?.full_name?.charAt(0) ?? "D"}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold">
                {(Array.isArray(doctorProfile.profiles)
                  ? doctorProfile.profiles[0]
                  : doctorProfile.profiles
                )?.full_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {doctorProfile.specialty} · {doctorProfile.department} ·{" "}
                Room {doctorProfile.room_number ?? "—"}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <Badge variant="outline" className="text-xs">
                ★ {doctorProfile.rating}
              </Badge>
              <Badge variant="success" className="text-xs">
                {doctorProfile.is_available ? "Available" : "Busy"}
              </Badge>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Today's queue</p>
                <p className="text-sm font-semibold">{queue.length} patients</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Left column */}
          <div className="space-y-6">
            {/* Current patient */}
            {activePatient ? (
              <Card>
                <CardHeader className="pb-2">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Current Patient
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl font-semibold">
                        {(patientProfile as Record<string, unknown> | null)?.full_name as string ?? "Unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(pp as Record<string, unknown> | null)?.gender as string} · Age{" "}
                        {(pp as Record<string, unknown> | null)?.age as number} ·{" "}
                        {(pp as Record<string, unknown> | null)?.blood_group as string}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={urgencyVariant(activePatient.triage_urgency)}
                      >
                        {activePatient.triage_urgency}
                      </Badge>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Token: {activePatient.token}
                      </p>
                    </div>
                  </div>

                  {activePatient.symptoms && (
                    <div className="rounded-2xl border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                      <p className="mb-1 text-xs font-semibold text-foreground">
                        Chief Complaint
                      </p>
                      {activePatient.symptoms}
                    </div>
                  )}

                  {Array.isArray((pp as Record<string, unknown> | null)?.medical_history) &&
                    ((pp as Record<string, unknown>).medical_history as string[]).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {((pp as Record<string, unknown>).medical_history as string[]).map((h) => (
                        <Badge key={h} variant="outline" className="text-xs">
                          {h}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {Array.isArray((pp as Record<string, unknown> | null)?.allergies) &&
                    ((pp as Record<string, unknown>).allergies as string[]).length > 0 && (
                    <div className="rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                      <span className="font-semibold">Allergies: </span>
                      {((pp as Record<string, unknown>).allergies as string[]).join(", ")}
                    </div>
                  )}

                  <DoctorQueueActions entryId={activePatient.id} />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center gap-3 p-6 text-muted-foreground">
                  <Users size={18} />
                  <p className="text-sm">No patients in queue right now.</p>
                </CardContent>
              </Card>
            )}

            {/* AI risk flags */}
            <Card>
              <CardContent className="space-y-3 p-6">
                <div className="flex items-center gap-2 text-danger">
                  <ShieldAlert size={16} />
                  <p className="text-sm font-semibold">AI Risk Flags</p>
                </div>
                {activePatient?.triage_urgency === "Emergency" ? (
                  <div className="space-y-1.5 text-xs font-medium text-danger">
                    <p>⚠ Emergency-level symptoms detected.</p>
                    <p>Immediate clinical attention required.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <p>No emergency symptoms detected.</p>
                    <p>Monitor for escalating pain or new neurological deficits.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Queue list */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <ClipboardList size={15} />
                  <p className="text-sm font-semibold">Today's Queue</p>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {queue.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {queue.length === 0 ? (
                  <p className="p-4 text-xs text-muted-foreground">Queue is empty.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Token</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Wait</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {queue.map((entry) => {
                        const entryProfile = Array.isArray((entry as unknown as Record<string, unknown>).profiles)
                          ? ((entry as unknown as Record<string, unknown>).profiles as Array<Record<string, unknown>>)[0]
                          : (entry as unknown as Record<string, unknown>).profiles;
                        return (
                          <TableRow key={entry.id}>
                            <TableCell className="font-semibold">
                              {entry.token}
                              {entry.is_emergency && (
                                <span className="ml-1 text-danger">●</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {(entryProfile as Record<string, unknown> | null)?.full_name as string ?? "—"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  entry.status === "Your Turn" ? "success" : "outline"
                                }
                                className="text-xs"
                              >
                                {entry.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {entry.wait_minutes}m
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column: SOAP Notes */}
          <Card>
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold">SOAP Notes</p>
                <div className="flex items-center gap-2">
                  {appointments[0] && (
                    <Badge variant="outline" className="text-xs">
                      {appointments[0].status}
                    </Badge>
                  )}
                  <Button size="sm" variant="secondary">
                    <Clipboard size={14} />
                    Copy to EMR
                  </Button>
                </div>
              </div>

              {soapNotes ? (
                <div className="space-y-4 text-sm text-muted-foreground">
                  <section>
                    <p className="text-xs font-semibold uppercase text-foreground">
                      Subjective
                    </p>
                    <p className="mt-1">{soapNotes.subjective}</p>
                  </section>
                  <Separator />
                  <section>
                    <p className="text-xs font-semibold uppercase text-foreground">
                      Objective
                    </p>
                    <p className="mt-1">{soapNotes.objective}</p>
                  </section>
                  <Separator />
                  <section>
                    <p className="text-xs font-semibold uppercase text-foreground">
                      Assessment
                    </p>
                    <p className="mt-1">{soapNotes.assessment}</p>
                  </section>
                  <Separator />
                  <section>
                    <p className="text-xs font-semibold uppercase text-foreground">
                      Plan
                    </p>
                    <p className="mt-1">{soapNotes.plan}</p>
                  </section>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ClipboardList size={32} className="mb-3 text-muted-foreground/40" />
                  <p className="text-sm font-medium text-muted-foreground">
                    No SOAP notes yet
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    SOAP notes are generated after completing a patient consultation.
                  </p>
                </div>
              )}

              {/* Recent appointments */}
              {appointments.length > 0 && (
                <div className="border-t border-border pt-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Clock size={14} className="text-muted-foreground" />
                    <p className="text-xs font-semibold">Recent Appointments</p>
                  </div>
                  <div className="space-y-2">
                    {appointments.slice(0, 4).map((appt) => {
                      const apptProfile = Array.isArray(
                        (appt as unknown as Record<string, unknown>).profiles,
                      )
                        ? ((appt as unknown as Record<string, unknown>).profiles as Array<Record<string, unknown>>)[0]
                        : (appt as unknown as Record<string, unknown>).profiles;
                      return (
                        <div
                          key={appt.id}
                          className="flex items-center justify-between rounded-xl border border-border px-3 py-2"
                        >
                          <div>
                            <p className="text-xs font-medium">
                              {(apptProfile as Record<string, unknown> | null)?.full_name as string ?? "—"}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {appt.chief_complaint}
                            </p>
                          </div>
                          <Badge
                            variant={
                              appt.status === "Completed"
                                ? "success"
                                : appt.status === "Cancelled"
                                  ? "danger"
                                  : "outline"
                            }
                            className="text-[10px]"
                          >
                            {appt.status}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardShell>
    </RoleGuard>
  );
}
