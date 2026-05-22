"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  startTransition,
} from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, Loader2, Send } from "lucide-react";
import { submitIntake } from "@/app/actions/ai";
import type { IntakeActionState } from "@/lib/types";
import { intakeSchema } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useIntakeStore } from "@/store/intake-store";
import { createClient } from "@/lib/client";
import { useAuthStore } from "@/store/auth-store";
import { createQueueToken } from "@/lib/queue";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SUGGESTIONS = [
  "Fever since morning",
  "Knee pain",
  "Chest tightness",
  "Stomach pain",
  "Breathing issue",
];

const initialState: IntakeActionState = { status: "idle" };

type DecisionResponse = {
  recommendation?: string;
  department?: string;
  doctorName?: string;
  doctorId?: string | null;
  urgency?: string;
  triageScore?: number;
  estimatedWaitMinutes?: number;
  error?: string;
};

export function IntakeChat({
  patientAge = "",
  patientGender = "",
}: {
  patientAge?: string;
  patientGender?: string;
}) {
  const router = useRouter();
  const { name: authName, userId } = useAuthStore();
  const patientName = authName ?? "";

  const {
    messages,
    initialSymptoms,
    followQueue,
    currentFollowIndex,
    followAnswers,
    chatPhase,
    token,
    doctor,
    department,
    addMessage,
    setInitialSymptoms,
    setFollowState,
    advanceFollow,
    setChatPhase,
    setStructured,
    setTriage,
    setEmergency,
    setRouting,
    setToken,
    reset,
  } = useIntakeStore();

  const [state, action, isPending] = useActionState(submitIntake, initialState);
  const [followInput, setFollowInput] = useState("");
  const [isDeciding, setIsDeciding] = useState(false);

  // Ref so the useEffect always sees the latest initialSymptoms without
  // being re-registered every time the store updates
  const initialSymptomsRef = useRef(initialSymptoms);
  useEffect(() => { initialSymptomsRef.current = initialSymptoms; }, [initialSymptoms]);

  const { register, handleSubmit, reset: resetForm, formState: { errors } } =
    useForm<{ symptoms: string }>({ resolver: zodResolver(intakeSchema) });

  // Process server-action result
  useEffect(() => {
    if (state.status !== "success" || !state.aiMessage) return;
    if (chatPhase === "complete") return;

    addMessage({
      id: `ai-${Date.now()}`,
      role: "ai",
      content: state.aiMessage,
      timestamp: new Date().toISOString(),
    });

    if (state.structured) setStructured(state.structured);
    if (state.triage) setTriage(state.triage);
    setEmergency(Boolean(state.emergency));

    if (state.emergency) {
      // Skip follow-ups for emergencies — decide immediately
      void callDecision(initialSymptomsRef.current, {}, true);
    } else if (state.followUps?.length) {
      setFollowState(state.followUps, 0, {});
      const first = state.followUps[0];
      if (first) {
        addMessage({
          id: `follow-0-${Date.now()}`,
          role: "ai",
          content: first,
          timestamp: new Date().toISOString(),
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // ── Submit initial symptoms ────────────────────────────────────────────────
  const onSubmit = handleSubmit((values) => {
    setInitialSymptoms(values.symptoms);
    addMessage({
      id: `user-${Date.now()}`,
      role: "user",
      content: values.symptoms,
      timestamp: new Date().toISOString(),
    });
    const fd = new FormData();
    fd.set("symptoms", values.symptoms);
    fd.set("patientName", patientName);
    fd.set("patientAge", patientAge);
    fd.set("patientGender", patientGender);
    startTransition(() => action(fd));
    resetForm();
  });

  const sendSuggestion = (suggestion: string) => {
    setInitialSymptoms(suggestion);
    addMessage({
      id: `user-${Date.now()}`,
      role: "user",
      content: suggestion,
      timestamp: new Date().toISOString(),
    });
    const fd = new FormData();
    fd.set("symptoms", suggestion);
    fd.set("patientName", patientName);
    fd.set("patientAge", patientAge);
    fd.set("patientGender", patientGender);
    startTransition(() => action(fd));
  };

  // ── Call decision API then create queue entry ──────────────────────────────
  async function callDecision(
    symptoms: string,
    answers: Record<string, string>,
    emergency: boolean,
  ) {
    setIsDeciding(true);
    try {
      const res = await fetch("/api/ai/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms, answers, patientName, patientAge, patientGender }),
      });

      let data: DecisionResponse = {};
      try { data = (await res.json()) as DecisionResponse; } catch { /* ignore */ }

      const dept = emergency ? "Emergency" : (data.department ?? "General Medicine");
      const docName = emergency ? "ER Team" : (data.doctorName ?? "");
      const urgency = emergency ? "Emergency" : (data.urgency ?? "Moderate");
      const score = emergency ? 5 : (data.triageScore ?? 3);
      const wait = emergency ? 0 : (data.estimatedWaitMinutes ?? 25);
      const recommendation = data.recommendation ?? "";

      setRouting(dept, docName, data.doctorId ?? undefined);
      const tok = createQueueToken(emergency);
      setToken(tok);

      if (recommendation) {
        addMessage({
          id: `ai-rec-${Date.now()}`,
          role: "ai",
          content: recommendation,
          timestamp: new Date().toISOString(),
        });
      }

      if (userId) {
        const supabase = createClient();
        const { error } = await supabase.from("queue_entries").insert({
          patient_id: userId,
          token: tok,
          department: dept,
          doctor_id: (!emergency && data.doctorId) ? data.doctorId : null,
          status: emergency ? "Your Turn" : "Registered",
          patient_type: "OPD",
          is_emergency: emergency,
          symptoms,
          triage_score: score,
          triage_urgency: urgency,
          wait_minutes: wait,
          notes: recommendation,
        });

        if (!error) {
          setChatPhase("complete");
          setTimeout(() => router.push("/patient/queue"), 2500);
        }
      }
    } finally {
      setIsDeciding(false);
    }
  }

  // ── Handle follow-up answer ────────────────────────────────────────────────
  async function handleFollowAnswer(answer: string) {
    const currentQuestion = followQueue[currentFollowIndex];
    if (!currentQuestion) return;

    // Capture before store mutation
    const updatedAnswers = { ...followAnswers, [currentQuestion]: answer };
    const next = currentFollowIndex + 1;

    addMessage({
      id: `user-${Date.now()}`,
      role: "user",
      content: answer,
      timestamp: new Date().toISOString(),
    });
    advanceFollow(currentQuestion, answer);
    setFollowInput("");

    if (next < followQueue.length) {
      const nextQ = followQueue[next];
      if (nextQ) {
        addMessage({
          id: `follow-${next}-${Date.now()}`,
          role: "ai",
          content: nextQ,
          timestamp: new Date().toISOString(),
        });
      }
      return;
    }

    // All answered → get decision
    await callDecision(initialSymptomsRef.current, updatedAnswers, false);
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const currentQuestion = followQueue[currentFollowIndex] as string | undefined;
  const followProgress =
    followQueue.length > 0 ? (currentFollowIndex / followQueue.length) * 100 : 0;

  function detectOptions(q: string | undefined) {
    if (!q) return null;
    const m = q.match(/\(([^)]+)\)/);
    if (m) {
      const inside = m[1];
      if (inside.includes("/") || inside.includes(",") || inside.includes(" or ")) {
        return inside.split(/[,/]| or /i).map((s) => s.trim()).filter(Boolean);
      }
    }
    if (/yes\/?no|yes or no/i.test(q)) return ["Yes", "No"];
    return null;
  }

  // ── "Already in queue" screen ──────────────────────────────────────────────
  if (chatPhase === "complete") {
    return (
      <div className="flex flex-col items-center gap-6 py-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
          <CheckCircle size={30} className="text-success" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">You&apos;re in the queue!</h2>
          {doctor && department && (
            <p className="text-sm text-muted-foreground">
              {doctor} &middot; {department}
            </p>
          )}
          {token && (
            <p className="mt-2 font-mono text-3xl font-bold tracking-widest text-accent">
              {token}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <Button asChild size="lg">
            <Link href="/patient/queue">View Queue Status</Link>
          </Button>
          <Button variant="outline" size="lg" onClick={reset}>
            Start New Visit
          </Button>
        </div>
      </div>
    );
  }

  // ── Main chat UI ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <AnimatePresence>
        {state.emergency && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-3xl border border-danger/40 bg-danger/15 px-5 py-4 text-sm font-semibold text-danger"
          >
            Emergency detected — escalating you to priority care.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-3xl px-4 py-3 text-sm shadow-sm",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground",
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {(isPending || isDeciding) && (
          <div className="flex justify-start">
            <div className="rounded-3xl bg-card px-4 py-3">
              <TypingIndicator />
            </div>
          </div>
        )}
      </div>

      {/* Suggestion chips — only before first submission */}
      {messages.length <= 1 && !isPending && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => sendSuggestion(s)}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Follow-up Q&A */}
      {currentQuestion && !isDeciding && (
        <div className="rounded-3xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground">Follow-up</p>
            <span className="text-xs text-muted-foreground">
              {currentFollowIndex + 1} / {followQueue.length}
            </span>
          </div>
          <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-muted/60">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={false}
              animate={{ width: `${followProgress}%` }}
              transition={{ duration: 0.25 }}
            />
          </div>

          {(() => {
            const opts = detectOptions(currentQuestion);
            if (opts?.length) {
              return (
                <div className="flex flex-wrap gap-2">
                  {opts.map((opt) => (
                    <Button
                      key={opt}
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleFollowAnswer(opt)}
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              );
            }
            return (
              <div className="flex gap-2">
                <input
                  value={followInput}
                  onChange={(e) => setFollowInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleFollowAnswer(followInput || "-");
                  }}
                  className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  placeholder="Type your answer…"
                />
                <Button type="button" onClick={() => void handleFollowAnswer(followInput || "-")}>
                  Next
                </Button>
              </div>
            );
          })()}
        </div>
      )}

      {/* Symptom input — hidden while follow-up is active or deciding */}
      {!currentQuestion && !isDeciding && (
        <form onSubmit={onSubmit} className="relative">
          <Textarea
            placeholder="Describe your symptoms…"
            className="min-h-24 pr-14"
            {...register("symptoms")}
          />
          <Button
            type="submit"
            size="sm"
            disabled={isPending}
            aria-label="Send"
            className="absolute right-3 top-3"
          >
            {isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          </Button>
          {errors.symptoms && (
            <p className="mt-2 text-xs text-danger">{errors.symptoms.message}</p>
          )}
          {state.status === "error" && state.error && (
            <p className="mt-2 text-xs text-danger">{state.error}</p>
          )}
        </form>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-muted-foreground/60"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
      <span className="text-xs font-semibold">AI is thinking…</span>
    </div>
  );
}
