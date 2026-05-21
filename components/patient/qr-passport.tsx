"use client";

import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useIntakeStore } from "@/store/intake-store";

export function QRPassport() {
  const { token, department, doctor, triage } = useIntakeStore();
  const payload = {
    token: token ?? "AM-021",
    department: department ?? "General Medicine",
    doctor: doctor ?? "Dr. Rohan Mehta",
    triage: triage?.urgency ?? "Moderate",
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="grid gap-6 p-6 md:grid-cols-[0.9fr_1.1fr]">
        <div className="flex items-center justify-center rounded-3xl bg-muted p-6">
          <QRCode value={JSON.stringify(payload)} size={160} />
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant="outline">Token</Badge>
            <span className="text-lg font-semibold">{payload.token}</span>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Assigned doctor</p>
            <p className="text-base font-semibold">{payload.doctor}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Department</p>
            <p className="text-base font-semibold">{payload.department}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Triage level</p>
            <Badge
              variant={
                payload.triage === "Emergency"
                  ? "danger"
                  : payload.triage === "Moderate"
                    ? "warning"
                    : "success"
              }
            >
              {payload.triage}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary">Share to WhatsApp</Button>
            <Button variant="outline">Save</Button>
            <Button variant="ghost">Download PDF</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
