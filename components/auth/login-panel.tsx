"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  ClipboardList,
  Eye,
  EyeOff,
  HeartPulse,
  Loader2,
  ShieldCheck,
  Stethoscope,
  User,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/client";
import { roleRoutes, type UserRole } from "@/lib/permissions";
import { useAuthStore } from "@/store/auth-store";

type Tab = "Patient" | "Doctor" | "Receptionist" | "Super Admin";
type PatientView = "choice" | "new" | "returning" | "confirm";

type RoleCard = {
  role: Tab;
  label: string;
  icon: React.ElementType;
  color: string;
  idLabel?: string;
  idPlaceholder?: string;
  demoId?: string;
  demoPass?: string;
};

const ROLE_CARDS: RoleCard[] = [
  {
    role: "Patient",
    label: "Patient",
    icon: HeartPulse,
    color:
      "text-cyan-600 bg-cyan-50 border-cyan-200 dark:bg-cyan-950/40 dark:border-cyan-800",
  },
  {
    role: "Doctor",
    label: "Doctor",
    icon: Stethoscope,
    color:
      "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800",
    idLabel: "Doctor ID",
    idPlaceholder: "e.g. DT101",
    demoId: "DT101",
    demoPass: "Doctor@123",
  },
  {
    role: "Receptionist",
    label: "Staff",
    icon: ClipboardList,
    color:
      "text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:border-orange-800",
    idLabel: "Staff ID",
    idPlaceholder: "e.g. ST101",
    demoId: "ST101",
    demoPass: "Staff@123",
  },
  {
    role: "Super Admin",
    label: "Admin",
    icon: ShieldCheck,
    color:
      "text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-800",
    idLabel: "Admin ID",
    idPlaceholder: "e.g. ADM001",
    demoId: "ADM001",
    demoPass: "Admin@123",
  },
];

function derivePatientCredentials(patientId: string) {
  // PT-0006 → email: pt0006@guest.arogyamaarga.in, password: Patient@0006
  const num = patientId.replace("PT-", "").toLowerCase();
  return {
    email: `pt${num}@guest.arogyamaarga.in`,
    password: `Patient@${num}`,
  };
}

export function LoginPanel() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<Tab>("Patient");
  const [patientView, setPatientView] = useState<PatientView>("choice");

  // Staff / Doctor / Admin fields
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // New patient fields
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("");

  // Returning patient field
  const [returnPatientId, setReturnPatientId] = useState("");

  // Confirmed patient ID after registration
  const [confirmedPatientId, setConfirmedPatientId] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const activeCard = ROLE_CARDS.find((c) => c.role === selectedRole)!;

  const handleRoleChange = (role: Tab) => {
    setSelectedRole(role);
    setPatientView("choice");
    setStaffId("");
    setPassword("");
    setPatientName("");
    setPatientAge("");
    setPatientGender("");
    setReturnPatientId("");
    setConfirmedPatientId("");
    setError("");
  };

  // ── New patient registration ──
  const handleNewPatientSubmit = async () => {
    if (!patientName.trim()) { setError("Please enter your name."); return; }
    const ageNum = Number(patientAge);
    if (!patientAge.trim() || isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      setError("Please enter a valid age.");
      return;
    }
    if (!patientGender) { setError("Please select your gender."); return; }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/patient/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: patientName.trim(), age: patientAge.trim(), gender: patientGender }),
      });

      let data: { patientId?: string; error?: string } = {};
      try {
        data = await res.json();
      } catch {
        setError(`Server error ${res.status}: unexpected response`);
        return;
      }

      if (!res.ok || !data.patientId) {
        setError(data.error ?? "Registration failed. Please try again.");
        return;
      }

      // Sign in automatically
      const supabase = createClient();
      const { email, password: pw } = derivePatientCredentials(data.patientId);
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password: pw });

      if (authError || !authData.user) {
        setError("Account created but sign-in failed. Try 'Returning Patient' with your new ID.");
        return;
      }

      setUser({
        userId: authData.user.id,
        role: "Patient",
        name: patientName.trim(),
        email,
        patientType: "OPD",
        patientId: data.patientId,
      });

      setConfirmedPatientId(data.patientId);
      setPatientView("confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Returning patient login ──
  const handleReturningPatientLogin = async () => {
    const pid = returnPatientId.trim().toUpperCase();
    if (!/^PT-\d{4}$/.test(pid)) {
      setError("Please enter a valid Patient ID (e.g. PT-0001).");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { email, password: pw } = derivePatientCredentials(pid);
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password: pw });

      if (authError || !data.user) {
        setError("Patient ID not found. Please check your ID or register as a new patient.");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", data.user.id)
        .single();

      const { data: pp } = await supabase
        .from("patient_profiles")
        .select("patient_type, patient_id")
        .eq("id", data.user.id)
        .single();

      setUser({
        userId: data.user.id,
        role: "Patient",
        name: profile?.full_name ?? "",
        email: profile?.email ?? email,
        patientType: pp?.patient_type ?? "OPD",
        patientId: pp?.patient_id ?? pid,
      });

      router.push(roleRoutes["Patient"]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Staff / Doctor / Admin login ──
  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffId.trim() || !password.trim()) {
      setError("Please enter your ID and password.");
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const email = `${staffId.trim().toLowerCase()}@arogyamaarga.in`;
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError || !data.user) {
        setError(authError?.message ?? "Sign-in failed — no user returned.");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, full_name, email")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profile) {
        setError("Account not found. Please contact support.");
        await supabase.auth.signOut();
        return;
      }

      setUser({
        userId: data.user.id,
        role: profile.role as UserRole,
        name: profile.full_name,
        email: profile.email,
        patientType: null,
      });

      router.push(roleRoutes[profile.role as UserRole]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = () => {
    if (activeCard.demoId) setStaffId(activeCard.demoId);
    if (activeCard.demoPass) setPassword(activeCard.demoPass);
    setError("");
  };

  return (
    <div className="mx-auto w-full max-w-lg">
      {/* Role tabs */}
      <div className="mb-6 grid grid-cols-4 gap-3">
        {ROLE_CARDS.map((card) => {
          const Icon = card.icon;
          const isSelected = selectedRole === card.role;
          return (
            <button
              key={card.role}
              type="button"
              onClick={() => handleRoleChange(card.role)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-center transition-all",
                isSelected
                  ? card.color + " shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground",
              )}
            >
              <Icon size={20} />
              <span className="text-xs font-semibold">{card.label}</span>
            </button>
          );
        })}
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-7">
          {selectedRole === "Patient" ? (
            <>
              {/* ── Patient: choice ── */}
              {patientView === "choice" && (
                <div>
                  <div className="mb-6 space-y-1">
                    <h2 className="text-xl font-semibold">Patient Portal</h2>
                    <p className="text-sm text-muted-foreground">
                      Are you visiting for the first time or returning?
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => { setPatientView("new"); setError(""); }}
                      className="flex flex-col items-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-5 text-cyan-700 transition hover:bg-cyan-100 dark:border-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-400"
                    >
                      <UserPlus size={22} />
                      <span className="text-sm font-semibold">New Patient</span>
                      <span className="text-xs text-cyan-600/80 dark:text-cyan-500/80">First visit today</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPatientView("returning"); setError(""); }}
                      className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-4 py-5 text-muted-foreground transition hover:border-cyan-300 hover:text-foreground"
                    >
                      <User size={22} />
                      <span className="text-sm font-semibold">Returning Patient</span>
                      <span className="text-xs">I have a Patient ID</span>
                    </button>
                  </div>
                  <div className="mt-5 rounded-2xl border border-dashed border-border bg-muted/30 p-4">
                    <p className="mb-1 text-xs font-semibold text-muted-foreground">Demo patient</p>
                    <p className="text-xs text-muted-foreground">
                      ID:{" "}
                      <span className="font-mono font-semibold text-foreground">PT-0001</span>
                      {"  "}
                      (Anaya Kulkarni)
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => {
                        setReturnPatientId("PT-0001");
                        setPatientView("returning");
                        setError("");
                      }}
                    >
                      Use demo patient
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Patient: new registration ── */}
              {patientView === "new" && (
                <div>
                  <button
                    type="button"
                    onClick={() => { setPatientView("choice"); setError(""); }}
                    className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft size={13} /> Back
                  </button>
                  <div className="mb-5 space-y-1">
                    <h2 className="text-xl font-semibold">New Patient</h2>
                    <p className="text-sm text-muted-foreground">
                      Just your name, age, and gender to get started.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Full Name
                      </label>
                      <div className="relative">
                        <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Your full name"
                          value={patientName}
                          onChange={(e) => setPatientName(e.target.value)}
                          className="pl-9"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Age
                      </label>
                      <div className="relative">
                        <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder="Your age"
                          value={patientAge}
                          onChange={(e) => setPatientAge(e.target.value)}
                          min={1}
                          max={120}
                          className="pl-9"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Gender
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {["Male", "Female", "Other"].map((g) => (
                          <button
                            key={g}
                            type="button"
                            disabled={isLoading}
                            onClick={() => setPatientGender(g)}
                            className={cn(
                              "rounded-xl border px-3 py-2 text-sm font-medium transition-all",
                              patientGender === g
                                ? "border-cyan-500 bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400"
                                : "border-border bg-card text-muted-foreground hover:border-cyan-300 hover:text-foreground",
                            )}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>
                    {error && (
                      <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-xs font-medium text-danger">
                        {error}
                      </div>
                    )}
                    <Button
                      type="button"
                      size="lg"
                      className="w-full"
                      onClick={handleNewPatientSubmit}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <><Loader2 size={16} className="animate-spin" /> Registering…</>
                      ) : (
                        "Register & Start Visit"
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Patient: returning ── */}
              {patientView === "returning" && (
                <div>
                  <button
                    type="button"
                    onClick={() => { setPatientView("choice"); setError(""); }}
                    className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft size={13} /> Back
                  </button>
                  <div className="mb-5 space-y-1">
                    <h2 className="text-xl font-semibold">Welcome Back</h2>
                    <p className="text-sm text-muted-foreground">
                      Enter your Patient ID from a previous visit.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Patient ID
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g. PT-0001"
                        value={returnPatientId}
                        onChange={(e) => setReturnPatientId(e.target.value.toUpperCase())}
                        className="font-mono"
                        disabled={isLoading}
                      />
                    </div>
                    {error && (
                      <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-xs font-medium text-danger">
                        {error}
                      </div>
                    )}
                    <Button
                      type="button"
                      size="lg"
                      className="w-full"
                      onClick={handleReturningPatientLogin}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <><Loader2 size={16} className="animate-spin" /> Signing in…</>
                      ) : (
                        "Continue My Visit"
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Patient: confirmation ── */}
              {patientView === "confirm" && (
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-950/50">
                    <HeartPulse size={26} className="text-cyan-600" />
                  </div>
                  <h2 className="text-xl font-semibold">You&apos;re registered!</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Save your Patient ID for future visits.
                  </p>
                  <div className="my-5 rounded-2xl border border-cyan-200 bg-cyan-50 px-6 py-4 dark:border-cyan-800 dark:bg-cyan-950/30">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Your Patient ID
                    </p>
                    <p className="mt-1 font-mono text-3xl font-bold tracking-widest text-cyan-700 dark:text-cyan-400">
                      {confirmedPatientId}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Use this ID every time you return to the hospital.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="lg"
                    className="w-full"
                    onClick={() => router.push(roleRoutes["Patient"])}
                  >
                    Start My Visit
                  </Button>
                </div>
              )}
            </>
          ) : (
            /* ── Staff / Doctor / Admin login ── */
            <div>
              <div className="mb-6 space-y-1">
                <h2 className="text-xl font-semibold">
                  Sign in as {activeCard.label}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Enter your hospital ID and password to continue.
                </p>
              </div>

              <form onSubmit={handleStaffLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {activeCard.idLabel}
                  </label>
                  <Input
                    type="text"
                    placeholder={activeCard.idPlaceholder}
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value.toUpperCase())}
                    autoComplete="username"
                    disabled={isLoading}
                    className="font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      className="pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-xs font-medium text-danger">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <><Loader2 size={16} className="animate-spin" /> Signing in…</>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>

              {/* Demo credentials */}
              <div className="mt-5 rounded-2xl border border-dashed border-border bg-muted/30 p-4">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">
                  Demo credentials for {activeCard.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  ID:{" "}
                  <span className="font-mono font-semibold text-foreground">
                    {activeCard.demoId}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Password:{" "}
                  <span className="font-mono font-semibold text-foreground">
                    {activeCard.demoPass}
                  </span>
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={fillDemo}
                >
                  Use demo credentials
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
