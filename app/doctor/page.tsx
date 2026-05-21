import { Clipboard, ShieldAlert } from "lucide-react";
import { RoleGuard } from "@/components/auth/role-guard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { soapNotes } from "@/lib/mock-data";

export default function DoctorPage() {
  return (
    <RoleGuard allow={["Doctor", "Super Admin"]}>
      <DashboardShell
        title="Doctor Workspace"
        subtitle="AI-generated SOAP notes, risk flags, and longitudinal history."
      >
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Patient</p>
                    <p className="text-xl font-semibold">Anaya Kulkarni</p>
                  </div>
                  <Badge variant="warning">Moderate</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Headache</Badge>
                  <Badge variant="outline">Light sensitivity</Badge>
                  <Badge variant="outline">No fever</Badge>
                </div>
                <div className="rounded-3xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
                  AI highlights: low neuro risk, dehydration likely. Consider
                  sinus screening if symptoms persist.
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3 p-6">
                <div className="flex items-center gap-2 text-danger">
                  <ShieldAlert size={16} />
                  <p className="text-sm font-semibold">AI risk flags</p>
                </div>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>No emergency symptoms detected.</p>
                  <p>Monitor for escalating pain or new neurological deficits.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="space-y-3 p-6">
                <p className="text-sm font-semibold">Medical history</p>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li>2024-12: Migraine consult, resolved.</li>
                  <li>2025-07: Seasonal sinus infection.</li>
                  <li>2026-02: Routine check-up, normal labs.</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold">SOAP Notes</p>
                <Button size="sm" variant="secondary">
                  <Clipboard size={14} />
                  Copy to EMR
                </Button>
              </div>
              <div className="space-y-4 text-sm text-muted-foreground">
                <section>
                  <p className="text-xs font-semibold uppercase text-foreground">
                    Subjective
                  </p>
                  <p className="mt-1">{soapNotes.subjective}</p>
                </section>
                <Separator />
                <section>
                  <p className="text-xs font-semibold uppercase text-foreground">
                    Objective
                  </p>
                  <p className="mt-1">{soapNotes.objective}</p>
                </section>
                <Separator />
                <section>
                  <p className="text-xs font-semibold uppercase text-foreground">
                    Assessment
                  </p>
                  <p className="mt-1">{soapNotes.assessment}</p>
                </section>
                <Separator />
                <section>
                  <p className="text-xs font-semibold uppercase text-foreground">
                    Plan
                  </p>
                  <p className="mt-1">{soapNotes.plan}</p>
                </section>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardShell>
    </RoleGuard>
  );
}
