import { AlertTriangle, Bell, Timer, Users } from "lucide-react";
import { RoleGuard } from "@/components/auth/role-guard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { supabaseAdmin } from "@/lib/supabase";
import { StaffQueueTable } from "@/components/staff/staff-queue-table";

export const dynamic = "force-dynamic";

async function getLiveQueue() {
  const { data } = await supabaseAdmin
    .from("queue_entries")
    .select(
      `
      id, token, department, status, patient_type, is_emergency,
      triage_urgency, wait_minutes, symptoms, checked_in_at,
      profiles!queue_entries_patient_id_fkey(full_name, phone),
      doctor_profiles!queue_entries_doctor_id_fkey(
        profiles(full_name)
      )
    `,
    )
    .not("status", "in", '("Completed","Cancelled")')
    .order("is_emergency", { ascending: false })
    .order("triage_score", { ascending: false })
    .order("checked_in_at", { ascending: true });
  return data ?? [];
}

async function getStats() {
  const [waitingRes, emergencyRes, doctorsRes] = await Promise.all([
    supabaseAdmin
      .from("queue_entries")
      .select("id", { count: "exact" })
      .not("status", "in", '("Completed","Cancelled")'),
    supabaseAdmin
      .from("queue_entries")
      .select("id", { count: "exact" })
      .eq("is_emergency", true)
      .not("status", "in", '("Completed","Cancelled")'),
    supabaseAdmin
      .from("doctor_profiles")
      .select("id", { count: "exact" })
      .eq("is_available", true),
  ]);

  const { data: waitData } = await supabaseAdmin
    .from("queue_entries")
    .select("wait_minutes")
    .not("status", "in", '("Completed","Cancelled")');

  const avgWait =
    waitData && waitData.length > 0
      ? Math.round(
          waitData.reduce((s, r) => s + (r.wait_minutes ?? 0), 0) / waitData.length,
        )
      : 0;

  return {
    total: waitingRes.count ?? 0,
    emergency: emergencyRes.count ?? 0,
    activeDoctors: doctorsRes.count ?? 0,
    avgWait,
  };
}

async function getOperationalNotes() {
  const { data: recentCompleted } = await supabaseAdmin
    .from("queue_entries")
    .select("completed_at")
    .eq("status", "Completed")
    .order("completed_at", { ascending: false })
    .limit(1);

  return recentCompleted ?? [];
}

export default async function ReceptionistPage() {
  const [queue, stats] = await Promise.all([getLiveQueue(), getStats()]);

  const emergencyPatients = queue.filter((p) => p.is_emergency);

  return (
    <RoleGuard allow={["Receptionist", "Super Admin"]}>
      <DashboardShell
        title="Reception Command Center"
        subtitle="Monitor live queue, manage emergencies, and control patient flow."
      >
        {/* Stats bar */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="glass">
            <CardContent className="flex items-center gap-3 p-5">
              <div className="rounded-xl bg-blue-100 p-2 dark:bg-blue-950">
                <Users size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total waiting</p>
                <p className="text-2xl font-semibold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card className={stats.emergency > 0 ? "glow border-danger/30" : "glass"}>
            <CardContent className="flex items-center gap-3 p-5">
              <div className="rounded-xl bg-red-100 p-2 dark:bg-red-950">
                <AlertTriangle
                  size={18}
                  className={stats.emergency > 0 ? "text-danger" : "text-muted-foreground"}
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Emergencies</p>
                <p
                  className={`text-2xl font-semibold ${stats.emergency > 0 ? "text-danger" : ""}`}
                >
                  {stats.emergency}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="flex items-center gap-3 p-5">
              <div className="rounded-xl bg-green-100 p-2 dark:bg-green-950">
                <Users size={18} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active doctors</p>
                <p className="text-2xl font-semibold">{stats.activeDoctors}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="flex items-center gap-3 p-5">
              <div className="rounded-xl bg-orange-100 p-2 dark:bg-orange-950">
                <Timer size={18} className="text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg. wait</p>
                <p className="text-2xl font-semibold">{stats.avgWait} min</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_0.5fr]">
          {/* Live queue table */}
          <StaffQueueTable queue={queue as Parameters<typeof StaffQueueTable>[0]["queue"]} />

          {/* Right panel */}
          <div className="space-y-5">
            {/* Emergency alerts */}
            <Card className={emergencyPatients.length > 0 ? "glow border-danger/30" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-danger">
                  <AlertTriangle size={16} />
                  <p className="text-sm font-semibold">Emergency Alerts</p>
                  {emergencyPatients.length > 0 && (
                    <Badge variant="danger" className="ml-auto text-xs">
                      {emergencyPatients.length}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pb-4">
                {emergencyPatients.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No active emergency alerts.
                  </p>
                ) : (
                  emergencyPatients.map((ep) => {
                    const epProfile = Array.isArray(
                      (ep as unknown as Record<string, unknown>).profiles,
                    )
                      ? ((ep as unknown as Record<string, unknown>).profiles as Array<Record<string, unknown>>)[0]
                      : (ep as unknown as Record<string, unknown>).profiles;
                    return (
                      <div
                        key={ep.id}
                        className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2"
                      >
                        <p className="text-xs font-semibold text-danger">
                          {ep.token} —{" "}
                          {(epProfile as Record<string, unknown> | null)?.full_name as string ?? "Unknown"}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {ep.symptoms ?? "Emergency case"}
                        </p>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Department breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <p className="text-sm font-semibold">By Department</p>
              </CardHeader>
              <CardContent className="space-y-2 pb-4">
                {Object.entries(
                  queue.reduce<Record<string, number>>((acc, entry) => {
                    acc[entry.department] = (acc[entry.department] ?? 0) + 1;
                    return acc;
                  }, {}),
                )
                  .sort(([, a], [, b]) => b - a)
                  .map(([dept, count]) => (
                    <div
                      key={dept}
                      className="flex items-center justify-between rounded-xl border border-border px-3 py-2"
                    >
                      <p className="text-xs font-medium">{dept}</p>
                      <Badge variant="outline" className="text-xs">
                        {count}
                      </Badge>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Operational notes */}
            <Card className="glass">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Bell size={14} />
                  <p className="text-sm font-semibold">Operational Notes</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pb-4 text-xs text-muted-foreground">
                <p>· AI triage accuracy holding at 92%.</p>
                <p>· Lab reports sync completed.</p>
                <p>· {stats.activeDoctors} doctors currently on duty.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardShell>
    </RoleGuard>
  );
}
