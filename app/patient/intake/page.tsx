import { IntakeChat } from "@/components/patient/intake-chat";
import { PatientShell } from "@/components/patient/patient-shell";
import { Card, CardContent } from "@/components/ui/card";

export default function IntakePage() {
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
        <IntakeChat />
      </div>
    </PatientShell>
  );
}
