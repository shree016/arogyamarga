import { PatientShell } from "@/components/patient/patient-shell";
import { QueueTracker } from "@/components/patient/queue-tracker";
import { Card, CardContent } from "@/components/ui/card";

export default function QueuePage() {
  return (
    <PatientShell>
      <div className="space-y-6">
        <Card className="glass">
          <CardContent className="space-y-2 p-6">
            <h1 className="text-2xl font-semibold">Live Queue Tracker</h1>
            <p className="text-sm text-muted-foreground">
              Real-time updates as your token moves through the care journey.
            </p>
          </CardContent>
        </Card>
        <QueueTracker />
      </div>
    </PatientShell>
  );
}
