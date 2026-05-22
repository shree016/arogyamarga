import {
  Activity,
  ClipboardList,
  HeartPulse,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";
import { RoleGuard } from "@/components/auth/role-guard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { permissionsByRole, roleList, roleMeta } from "@/lib/permissions";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function getStats() {
  const [patientsRes, doctorsRes, staffRes, queueRes] = await Promise.all([
    supabaseAdmin.from("profiles").select("id", { count: "exact" }).eq("role", "Patient"),
    supabaseAdmin.from("profiles").select("id", { count: "exact" }).eq("role", "Doctor"),
    supabaseAdmin.from("profiles").select("id", { count: "exact" }).eq("role", "Receptionist"),
    supabaseAdmin
      .from("queue_entries")
      .select("id", { count: "exact" })
      .in("status", ["Registered", "Waiting", "File With Doctor", "Your Turn"]),
  ]);

  return {
    patientCount: patientsRes.count ?? 0,
    doctorCount: doctorsRes.count ?? 0,
    staffCount: staffRes.count ?? 0,
    activeQueue: queueRes.count ?? 0,
  };
}

async function getStaffList() {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email, role, phone, is_active, created_at")
    .in("role", ["Doctor", "Receptionist", "Super Admin"])
    .order("role");
  return data ?? [];
}

async function getRecentPatients() {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select(
      `
      id, full_name, email, phone, created_at,
      patient_profiles(patient_type, gender, age, blood_group)
    `,
    )
    .eq("role", "Patient")
    .order("created_at", { ascending: false })
    .limit(10);
  return data ?? [];
}

async function getQueueSummary() {
  const { data } = await supabaseAdmin
    .from("queue_entries")
    .select(
      `
      id, token, department, status, patient_type, is_emergency,
      triage_urgency, wait_minutes, checked_in_at,
      profiles(full_name)
    `,
    )
    .order("is_emergency", { ascending: false })
    .order("checked_in_at", { ascending: true })
    .limit(20);
  return data ?? [];
}

const roleIconMap = {
  Patient: HeartPulse,
  Doctor: Stethoscope,
  Receptionist: ClipboardList,
  "Super Admin": ShieldCheck,
};

export default async function AdminPage() {
  const [stats, staffList, recentPatients, queueSummary] = await Promise.all([
    getStats(),
    getStaffList(),
    getRecentPatients(),
    getQueueSummary(),
  ]);

  const statCards = [
    { label: "Total Patients", value: stats.patientCount, icon: HeartPulse, color: "text-cyan-600" },
    { label: "Doctors", value: stats.doctorCount, icon: Stethoscope, color: "text-blue-600" },
    { label: "Staff", value: stats.staffCount, icon: ClipboardList, color: "text-orange-600" },
    { label: "Active Queue", value: stats.activeQueue, icon: Activity, color: "text-green-600" },
  ];

  return (
    <RoleGuard allow={["Super Admin"]}>
      <DashboardShell
        title="Admin Console"
        subtitle="System overview, user management, and access control."
      >
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.label} className="glass">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={`rounded-2xl bg-current/10 p-2 ${card.color}`}>
                    <Icon size={20} className={card.color} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                    <p className="text-2xl font-semibold">{card.value}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          {/* Staff & Doctors table */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users size={16} />
              <h2 className="text-sm font-semibold">Staff & Doctors</h2>
              <Badge variant="outline">{staffList.length}</Badge>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffList.map((member) => {
                      const Icon = roleIconMap[member.role as keyof typeof roleIconMap] ?? ShieldCheck;
                      return (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Icon size={14} className="shrink-0 text-muted-foreground" />
                              {member.full_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {member.role === "Super Admin" ? "Admin" : member.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {member.email}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {member.phone ?? "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={member.is_active ? "success" : "outline"}
                              className="text-xs"
                            >
                              {member.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Recent patients */}
            <div className="mt-4 flex items-center gap-2">
              <HeartPulse size={16} />
              <h2 className="text-sm font-semibold">Registered Patients</h2>
              <Badge variant="outline">{recentPatients.length}</Badge>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Blood Group</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPatients.map((p) => {
                      const pp = Array.isArray(p.patient_profiles)
                        ? p.patient_profiles[0]
                        : p.patient_profiles;
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.full_name}</TableCell>
                          <TableCell>
                            <PatientTypeBadge type={pp?.patient_type} />
                          </TableCell>
                          <TableCell>{pp?.age ?? "—"}</TableCell>
                          <TableCell>{pp?.gender ?? "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {pp?.blood_group ?? "—"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Roles & permissions */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} />
                  <p className="text-sm font-semibold">Roles & Permissions</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pb-5">
                {roleList.map((role) => {
                  const meta = roleMeta[role];
                  const Icon = meta.icon;
                  return (
                    <div key={role} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Icon size={14} className="text-muted-foreground" />
                        <p className="text-xs font-semibold">{meta.title}</p>
                        <Badge variant="outline" className="ml-auto text-xs">
                          {permissionsByRole[role].length}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {permissionsByRole[role].slice(0, 3).map((perm) => (
                          <span
                            key={perm}
                            className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground"
                          >
                            {perm}
                          </span>
                        ))}
                        {permissionsByRole[role].length > 3 && (
                          <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">
                            +{permissionsByRole[role].length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Live queue preview */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Activity size={16} />
                  <p className="text-sm font-semibold">Live Queue</p>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {queueSummary.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pb-4">
                {queueSummary.length === 0 && (
                  <p className="text-xs text-muted-foreground">No active queue.</p>
                )}
                {queueSummary.slice(0, 6).map((entry) => {
                  const patient = Array.isArray(entry.profiles)
                    ? entry.profiles[0]
                    : entry.profiles;
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-3 py-2"
                    >
                      <div>
                        <p className="text-xs font-semibold">
                          {entry.token}
                          {entry.is_emergency && (
                            <span className="ml-1.5 text-danger">●</span>
                          )}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {(patient as { full_name?: string } | null)?.full_name ?? "Unknown"} · {entry.department}
                        </p>
                      </div>
                      <Badge
                        variant={entry.is_emergency ? "danger" : "outline"}
                        className="text-[10px]"
                      >
                        {entry.status}
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardShell>
    </RoleGuard>
  );
}

function PatientTypeBadge({ type }: { type?: string }) {
  const variants: Record<string, string> = {
    OPD: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400",
    IPD: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400",
    Emergency: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400",
    Referral: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400",
    Telemedicine: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400",
  };
  const cls = variants[type ?? ""] ?? "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
      {type ?? "—"}
    </span>
  );
}
