import { IntakeChat } from "@/components/patient/intake-chat";
import { PatientShell } from "@/components/patient/patient-shell";
import { Card, CardContent } from "@/components/ui/card";
import { supabaseAdmin } from "@/lib/supabase";
import { createClient } from "@/lib/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function IntakePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let patientAge = "";
  let patientGender = "";

  if (user) {
    // Redirect to queue if patient already has an active entry
    const { data: active } = await supabaseAdmin
      .from("queue_entries")
      .select("id")
      .eq("patient_id", user.id)
      .not("status", "in", '("Completed","Cancelled")')
      .limit(1)
      .single();

    if (active) redirect("/patient/queue");

    const { data: pp } = await supabaseAdmin
      .from("patient_profiles")
      .select("age, gender")
      .eq("id", user.id)
      .single();
    patientAge = pp?.age != null ? String(pp.age) : "";
    patientGender = pp?.gender ?? "";
  }

  return (
    <PatientShell>
      <div className="space-y-6">
        <Card className="glass">
          <CardContent className="space-y-3 p-6">
            <h1 className="text-2xl font-semibold">AI Chat Intake</h1>
            <p className="text-sm text-muted-foreground">
              Describe your symptoms in your own words. Our AI will ask smart
              follow-up questions and prepare your triage packet.
            </p>
          </CardContent>
        </Card>
        <IntakeChat patientAge={patientAge} patientGender={patientGender} />
      </div>
    </PatientShell>
  );
}
