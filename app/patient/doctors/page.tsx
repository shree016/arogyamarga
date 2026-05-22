import { PatientShell } from "@/components/patient/patient-shell";
import { Card, CardContent } from "@/components/ui/card";
import { DoctorGridLive } from "@/components/patient/doctor-grid-live";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function DoctorsPage() {
  const { data: doctors } = await supabaseAdmin
    .from("doctor_profiles")
    .select(
      `
      id, specialty, department, qualification,
      experience_years, rating, is_available,
      consultation_fee, room_number,
      profiles(full_name, phone)
    `,
    )
    .eq("is_available", true)
    .order("rating", { ascending: false });

  // Queue counts per doctor
  const { data: queueCounts } = await supabaseAdmin
    .from("queue_entries")
    .select("doctor_id")
    .not("status", "in", '("Completed","Cancelled")');

  const countMap: Record<string, number> = {};
  for (const entry of queueCounts ?? []) {
    if (entry.doctor_id) {
      countMap[entry.doctor_id] = (countMap[entry.doctor_id] ?? 0) + 1;
    }
  }

  const enriched = (doctors ?? []).map((doc) => ({
    ...doc,
    waitMinutes: Math.max(10, (countMap[doc.id] ?? 0) * 8),
    currentQueue: countMap[doc.id] ?? 0,
  }));

  return (
    <PatientShell>
      <div className="space-y-6">
        <Card className="glass">
          <CardContent className="space-y-2 p-6">
            <h1 className="text-2xl font-semibold">Select a Doctor</h1>
            <p className="text-sm text-muted-foreground">
              Browse available doctors matched to your triage profile.
            </p>
          </CardContent>
        </Card>
        <DoctorGridLive doctors={enriched} />
      </div>
    </PatientShell>
  );
}
