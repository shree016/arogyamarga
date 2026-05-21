import { PatientShell } from "@/components/patient/patient-shell";
import { QRPassport } from "@/components/patient/qr-passport";
import { Card, CardContent } from "@/components/ui/card";

export default function QRPage() {
  return (
    <PatientShell>
      <div className="space-y-6">
        <Card className="glass">
          <CardContent className="space-y-2 p-6">
            <h1 className="text-2xl font-semibold">QR Passport</h1>
            <p className="text-sm text-muted-foreground">
              Show this QR at the reception desk for instant check-in.
            </p>
          </CardContent>
        </Card>
        <QRPassport />
      </div>
    </PatientShell>
  );
}
