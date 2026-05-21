"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  startTransition,
} from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, Send } from "lucide-react";
import { submitIntake } from "@/app/actions/ai";
import type { ChatMessage, IntakeActionState } from "@/lib/types";
import { intakeSchema } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useIntakeStore } from "@/store/intake-store";
import { useQueueStore } from "@/store/queue-store";
import { useAuthStore } from "@/store/auth-store";
import { createQueueToken } from "@/lib/queue";
import { cn } from "@/lib/utils";

const suggestions = [
  "Fever since morning",
  "Knee pain",
  "Chest tightness",
  "Stomach pain",
  "Breathing issue",
];

const initialState: IntakeActionState = { status: "idle" };

export function IntakeChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      role: "ai",
      content:
        "Hi, I am Arogya AI. Tell me how you feel today, and I will guide you.",
      timestamp: new Date().toISOString(),
    },
  ]);

  const [state, action, isPending] = useActionState(submitIntake, initialState);
  const [followQueue, setFollowQueue] = useState<string[]>([]);
  const [currentFollowIndex, setCurrentFollowIndex] = useState(0);
  const [followAnswers, setFollowAnswers] = useState<Record<string, string>>(
    {},
  );
  const [followInput, setFollowInput] = useState("");
  const [initialSymptoms, setInitialSymptoms] = useState("");
  const [finalDecision, setFinalDecision] = useState("");
  const { setStructured, setTriage, setEmergency, setRouting, setToken } =
    useIntakeStore();
  const {
    name: patientName,
    age: patientAge,
    gender: patientGender,
  } = useAuthStore();
  const { addPatient, prioritizeEmergency } = useQueueStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ symptoms: string }>({
    resolver: zodResolver(intakeSchema),
  });

  useEffect(() => {
    // Append AI message and follow-ups whenever the action succeeds
    if (state.status !== "success" || !state.aiMessage) {
      return;
    }

    setMessages((prev) => {
      // avoid duplicating identical AI messages
      const last = prev[prev.length - 1];
      if (last?.role === "ai" && last?.content === state.aiMessage) return prev;
      return [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: "ai",
          content: state.aiMessage,
          timestamp: new Date().toISOString(),
        },
      ];
    });

    if (state.followUps?.length) {
      setFinalDecision("");
      setFollowQueue(state.followUps);
      setCurrentFollowIndex(0);
      setFollowAnswers({});
      setFollowInput("");

      const firstQuestion = state.followUps[0];
      if (firstQuestion) {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "ai" && last?.content === firstQuestion) {
            return prev;
          }

          return [
            ...prev,
            {
              id: `follow-${Date.now()}`,
              role: "ai",
              content: firstQuestion,
              timestamp: new Date().toISOString(),
            },
          ];
        });
      }
    }

    if (state.structured) {
      setStructured(state.structured);
    }

    if (state.triage) {
      setTriage(state.triage);
      setRouting(state.triage.department, state.triage.recommendedDoctor);
    }

    const emergency = Boolean(state.emergency);
    setEmergency(emergency);

    const token = createQueueToken(emergency);
    setToken(token);
    const patientEntry = {
      id: `queue-${token}`,
      name: "You",
      token,
      department: emergency ? "Emergency" : state.triage.department,
      status: emergency ? "Your Turn" : "Registered",
      waitMinutes: emergency ? 0 : state.triage.waitMinutes,
      emergency,
    };

    if (emergency) {
      prioritizeEmergency(patientEntry);
    } else {
      addPatient(patientEntry);
    }
  }, [
    addPatient,
    prioritizeEmergency,
    setEmergency,
    setRouting,
    setStructured,
    setTriage,
    setToken,
    state,
  ]);

  const onSubmit = handleSubmit((values) => {
    const formData = new FormData();
    formData.set("symptoms", values.symptoms);
    formData.set("patientName", patientName ?? "");
    formData.set("patientAge", patientAge ?? "");
    formData.set("patientGender", patientGender ?? "");
    setInitialSymptoms(values.symptoms);

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: values.symptoms,
        timestamp: new Date().toISOString(),
      },
    ]);

    startTransition(() => {
      action(formData);
    });
    reset();
  });

  const sendSuggestion = (suggestion: string) => {
    const formData = new FormData();
    formData.set("symptoms", suggestion);
    formData.set("patientName", patientName ?? "");
    formData.set("patientAge", patientAge ?? "");
    formData.set("patientGender", patientGender ?? "");
    setInitialSymptoms(suggestion);

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: suggestion,
        timestamp: new Date().toISOString(),
      },
    ]);

    startTransition(() => {
      action(formData);
    });
  };

  // Helpers for follow-up Q&A flow
  const currentQuestion = followQueue[currentFollowIndex];
  const followProgress =
    currentQuestion && followQueue.length > 0
      ? ((currentFollowIndex + 1) / followQueue.length) * 100
      : 0;

  function detectOptions(question: string | undefined) {
    if (!question) return null;
    // simple parse: look for parentheses with comma or slash separated options
    const m = question.match(/\(([^)]+)\)/);
    if (m) {
      const inside = m[1];
      if (
        inside.includes("/") ||
        inside.includes(",") ||
        inside.includes(" or ")
      ) {
        return inside
          .split(/[,/]| or /i)
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }
    // also try inline 'yes/no'
    if (/yes\/?no|yes or no/i.test(question)) return ["Yes", "No"];
    return null;
  }

  async function submitFollowAnswer(answer: string) {
    if (!currentQuestion) return;
    // record user answer as a message
    setMessages((prev) => [
      ...prev,
      {
        id: `user-follow-${Date.now()}`,
        role: "user",
        content: answer,
        timestamp: new Date().toISOString(),
      },
    ]);

    setFollowAnswers((prev) => ({ ...prev, [currentQuestion]: answer }));

    const updatedAnswers = { ...followAnswers, [currentQuestion]: answer };
    const next = currentFollowIndex + 1;

    if (next < followQueue.length) {
      const nextQuestion = followQueue[next];
      setFollowAnswers(updatedAnswers);
      setCurrentFollowIndex(next);
      setFollowInput("");

      if (nextQuestion) {
        setMessages((prev) => [
          ...prev,
          {
            id: `follow-${Date.now()}`,
            role: "ai",
            content: nextQuestion,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
      return;
    }

    // all answers collected — compile final prompt and fetch decision
    const payload = {
      symptoms: initialSymptoms,
      answers: updatedAnswers,
      patientName,
      patientAge,
      patientGender,
    };

    try {
      const res = await fetch("/api/ai/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data?.decision) {
        setFinalDecision(data.decision);
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-decision-${Date.now()}`,
            role: "ai",
            content: data.decision,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      setFinalDecision("Unable to fetch decision at the moment.");
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-decision-error-${Date.now()}`,
          role: "ai",
          content: "Unable to fetch decision at the moment.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      // clear follow flow
      setFollowQueue([]);
      setCurrentFollowIndex(0);
      setFollowAnswers({});
      setFollowInput("");
    }
  }

  const emergencyBanner = useMemo(() => state.emergency, [state.emergency]);

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {emergencyBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-3xl border border-danger/40 bg-danger/15 px-5 py-4 text-sm font-semibold text-danger"
          >
            Emergency detected. You are being escalated to priority care.
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-3xl px-4 py-3 text-sm shadow-sm",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground",
              )}
            >
              {message.content}
            </div>
          </div>
        ))}

        {isPending && (
          <div className="flex justify-start">
            <div className="rounded-3xl bg-card px-4 py-3">
              <TypingIndicator />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => sendSuggestion(suggestion)}
            className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {currentQuestion && (
        <div className="rounded-3xl border border-border bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground">
            AI follow-up
          </p>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>
                Question {currentFollowIndex + 1} of {followQueue.length}
              </span>
              <span>{Math.round(followProgress)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted/60">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={false}
                animate={{ width: `${followProgress}%` }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              />
            </div>
          </div>
          <div className="mt-2 flex justify-start">
            <div className="max-w-[80%] rounded-3xl bg-card px-4 py-3 text-sm shadow-sm">
              {currentQuestion}
            </div>
          </div>

          <div className="mt-3">
            {(() => {
              const opts = detectOptions(currentQuestion);
              if (opts && opts.length) {
                return (
                  <div className="flex flex-wrap gap-2">
                    {opts.map((opt) => (
                      <Button
                        key={opt}
                        type="button"
                        onClick={() => submitFollowAnswer(opt)}
                        size="sm"
                        variant="outline"
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
                    className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none"
                    placeholder="Type your answer..."
                  />
                  <Button
                    type="button"
                    onClick={() => submitFollowAnswer(followInput || "-")}
                  >
                    Next
                  </Button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {finalDecision && !currentQuestion && (
        <div className="rounded-3xl border border-primary/20 bg-linear-to-br from-primary/10 via-card to-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Final recommendation
              </p>
              <h3 className="mt-1 text-lg font-semibold text-foreground">
                Doctor guidance summary
              </h3>
            </div>
            <Badge variant="outline">LLM Result</Badge>
          </div>

          <div className="mt-4 rounded-2xl border border-border/70 bg-background/80 p-4">
            {finalDecision
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean)
              .map((line, index) =>
                index === 0 ? (
                  <p
                    key={line}
                    className="text-base font-semibold text-foreground"
                  >
                    {line}
                  </p>
                ) : (
                  <p
                    key={line}
                    className="mt-2 text-sm leading-6 text-muted-foreground"
                  >
                    {line}
                  </p>
                ),
              )}
          </div>
        </div>
      )}

      <div className="relative">
        <form onSubmit={onSubmit} className="sticky bottom-4">
          <Textarea
            placeholder="Type your symptoms..."
            className="min-h-24 pr-28"
            {...register("symptoms")}
          />
          <div className="absolute right-3 top-3 flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" aria-label="Voice">
              <Mic size={16} />
            </Button>
            <Button type="submit" size="sm" aria-label="Send">
              <Send size={16} />
            </Button>
          </div>

          {errors.symptoms && (
            <p className="mt-2 text-xs text-danger">
              {errors.symptoms.message}
            </p>
          )}
          {state.status === "error" && state.error && (
            <p className="mt-2 text-xs text-danger">{state.error}</p>
          )}
        </form>
      </div>

      {state.structured && (
        <div className="rounded-3xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Structured intake</p>
            <Badge variant="outline">JSON</Badge>
          </div>
          <pre className="mt-3 whitespace-pre-wrap text-xs text-muted-foreground">
            {JSON.stringify(state.structured, null, 2)}
          </pre>
        </div>
      )}

      {(state.llmRequest || state.llmResponse) && (
        <div className="rounded-3xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">LLM Transcript</p>
            <Badge variant="outline">Demo</Badge>
          </div>

          {state.llmRequest && (
            <div className="mt-3">
              <p className="text-xs font-medium text-muted-foreground">
                Request
              </p>
              <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap text-sm">
                {state.llmRequest}
              </pre>
            </div>
          )}

          {state.llmResponse && (
            <div className="mt-3">
              <p className="text-xs font-medium text-muted-foreground">
                Raw response
              </p>
              <pre className="mt-1 max-h-60 overflow-auto whitespace-pre-wrap text-sm">
                {state.llmResponse}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="h-2 w-2 rounded-full bg-muted-foreground/60"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: index * 0.2 }}
        />
      ))}
      <span className="text-xs font-semibold">AI is typing</span>
    </div>
  );
}
