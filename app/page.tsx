import { LandingHero } from "@/components/patient/landing-hero";
import { PatientShell } from "@/components/patient/patient-shell";
import { Card, CardContent } from "@/components/ui/card";
import { RoleGuard } from "@/components/auth/role-guard";

export default function Home() {
  return (
    <RoleGuard allow={["Patient", "Super Admin"]}>
      <PatientShell>
        <div className="space-y-10">
          <LandingHero />
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Smart intake",
                description:
                  "AI-led symptom collection with dynamic follow-up questions.",
              },
              {
                title: "Real-time routing",
                description:
                  "Queue updates and doctor matching with emergency escalation.",
              },
              {
                title: "Clinical clarity",
                description:
                  "Structured triage, SOAP notes, and EMR-ready summaries.",
              },
            ].map((item) => (
              <Card key={item.title} className="glass">
                <CardContent className="space-y-2 p-5">
                  <p className="text-base font-semibold">{item.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </PatientShell>
    </RoleGuard>
  );
}
