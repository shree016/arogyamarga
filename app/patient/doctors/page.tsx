import { DoctorGrid } from "@/components/patient/doctor-grid";
import { PatientShell } from "@/components/patient/patient-shell";
import { Card, CardContent } from "@/components/ui/card";

export default function DoctorsPage() {
  return (
    <PatientShell>
      <div className="space-y-6">
        <Card className="glass">
          <CardContent className="space-y-2 p-6">
            <h1 className="text-2xl font-semibold">Doctor Routing</h1>
            <p className="text-sm text-muted-foreground">
              Personalized matches based on your triage profile and queue load.
            </p>
          </CardContent>
        </Card>
        <DoctorGrid />
      </div>
    </PatientShell>
  );
}
