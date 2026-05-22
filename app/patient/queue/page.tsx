import { PatientShell } from "@/components/patient/patient-shell";
import { Card, CardContent } from "@/components/ui/card";
import { QueueTrackerLive } from "@/components/patient/queue-tracker-live";
import { supabaseAdmin } from "@/lib/supabase";
import { createClient } from "@/lib/server";

export const dynamic = "force-dynamic";

export default async function QueuePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let myEntry = null;

  if (user) {
    const { data } = await supabaseAdmin
      .from("queue_entries")
      .select("id, token, status, department, wait_minutes, is_emergency, triage_urgency, doctor_id, notes")
      .eq("patient_id", user.id)
      .not("status", "in", '("Completed","Cancelled")')
      .order("checked_in_at", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      // Fetch doctor name + specialty + room if assigned
      let doctorName: string | null = null;
      let doctorSpecialty: string | null = null;
      let doctorRoom: string | null = null;

      if (data.doctor_id) {
        const { data: dp } = await supabaseAdmin
          .from("doctor_profiles")
          .select("specialty, room_number, profiles!inner(full_name)")
          .eq("id", data.doctor_id)
          .single() as {
            data: {
              specialty: string;
              room_number: string | null;
              profiles: { full_name: string } | { full_name: string }[] | null;
            } | null;
          };

        if (dp) {
          const prof = Array.isArray(dp.profiles) ? dp.profiles[0] : dp.profiles;
          doctorName = prof?.full_name ?? null;
          doctorSpecialty = dp.specialty ?? null;
          doctorRoom = dp.room_number ?? null;
        }
      }

      myEntry = { ...data, doctorName, doctorSpecialty, doctorRoom };
    }
  }

  const deptQueue = myEntry
    ? (
        await supabaseAdmin
          .from("queue_entries")
          .select(
            "id, token, status, wait_minutes, is_emergency, profiles!queue_entries_patient_id_fkey(full_name)",
          )
          .eq("department", myEntry.department)
          .not("status", "in", '("Completed","Cancelled")')
          .order("is_emergency", { ascending: false })
          .order("checked_in_at", { ascending: true })
      ).data ?? []
    : [];

  return (
    <PatientShell>
      <div className="space-y-6">
        <Card className="glass">
          <CardContent className="space-y-2 p-6">
            <h1 className="text-2xl font-semibold">Queue Status</h1>
            <p className="text-sm text-muted-foreground">
              Live position and status updates for your hospital visit.
            </p>
          </CardContent>
        </Card>
        <QueueTrackerLive myEntry={myEntry} deptQueue={deptQueue} />
      </div>
    </PatientShell>
  );
}
