import { PatientShell } from "@/components/patient/patient-shell";
import { TriagePanel } from "@/components/patient/triage-panel";
import { Card, CardContent } from "@/components/ui/card";

export default function TriagePage() {
  return (
    <PatientShell>
      <div className="space-y-6">
        <Card className="glass">
          <CardContent className="space-y-2 p-6">
            <h1 className="text-2xl font-semibold">Triage Analysis</h1>
            <p className="text-sm text-muted-foreground">
              AI-powered urgency scoring, department routing, and wait time
              predictions.
            </p>
          </CardContent>
        </Card>
        <TriagePanel />
      </div>
    </PatientShell>
  );
}
