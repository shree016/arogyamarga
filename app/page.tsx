import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/server";
import { supabaseAdmin } from "@/lib/supabase";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { PatientHome } from "@/components/patient/patient-home";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single();

    if (profile?.role === "Doctor") redirect("/doctor");
    if (profile?.role === "Receptionist") redirect("/receptionist");
    if (profile?.role === "Super Admin") redirect("/admin");

    // Patient — render their home dashboard
    const { data: patientProfile } = await supabaseAdmin
      .from("patient_profiles")
      .select("patient_type, age, gender, blood_group, medical_history, allergies")
      .eq("id", user.id)
      .single();

    const { data: activeQueue } = await supabaseAdmin
      .from("queue_entries")
      .select("id, token, status, department, wait_minutes, is_emergency, triage_urgency")
      .eq("patient_id", user.id)
      .not("status", "in", '("Completed","Cancelled")')
      .order("checked_in_at", { ascending: false })
      .limit(1)
      .single();

    return (
      <PatientHome
        userName={profile?.full_name ?? ""}
        patientProfile={patientProfile}
        activeQueue={activeQueue}
      />
    );
  }

  // ── Unauthenticated: landing page ──
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 pb-4 pt-6">
        <BrandMark />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-8 px-6 pb-24 pt-16 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          AI-Powered Patient Intake
        </div>

        {/* Headline */}
        <div className="space-y-3">
          <h1 className="text-5xl font-bold leading-tight tracking-tight md:text-6xl">
            Smarter healthcare
            <br />
            <span className="text-accent">starts here</span>
          </h1>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground">
            ArogyaMaarga automates patient registration, AI-driven triage, and
            intelligent routing — so doctors can focus on care, not paperwork.
          </p>
        </div>

        {/* Feature bullets */}
        <div className="flex flex-col items-start gap-2.5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-8">
          {[
            "AI-led symptom intake",
            "Real-time queue management",
            "SOAP notes & EMR summaries",
          ].map((f) => (
            <div key={f} className="flex items-center gap-2">
              <span className="text-success font-bold">✓</span>
              <span>{f}</span>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="min-w-44">
            <Link href="/login">Register as Patient</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="min-w-44">
            <Link href="/login">Staff / Doctor Login</Link>
          </Button>
        </div>

        {/* Stats row */}
        <div className="mt-4 flex flex-wrap justify-center gap-10 border-t border-border/50 pt-8">
          {[
            { value: "< 2 min", label: "Average intake time" },
            { value: "4 roles", label: "Admin, Doctor, Staff, Patient" },
            { value: "Real-time", label: "Live queue tracking" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
