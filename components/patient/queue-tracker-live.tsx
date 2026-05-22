"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Stethoscope } from "lucide-react";

const STATUSES = ["Registered", "Waiting", "File With Doctor", "Your Turn"] as const;

type QueueEntry = {
  id: string;
  token: string;
  status: string;
  department: string;
  wait_minutes: number | null;
  is_emergency: boolean;
  triage_urgency: string | null;
  notes: string | null;
  doctorName: string | null;
  doctorSpecialty: string | null;
  doctorRoom: string | null;
} | null;

type DeptEntry = {
  id: string;
  token: string;
  status: string;
  wait_minutes: number | null;
  is_emergency: boolean;
  profiles: { full_name: string } | { full_name: string }[] | null;
};

export function QueueTrackerLive({
  myEntry,
  deptQueue,
}: {
  myEntry: QueueEntry;
  deptQueue: DeptEntry[];
}) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 30_000);
    return () => clearInterval(id);
  }, [router]);

  if (!myEntry) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            No active queue entry found.
          </p>
          <p className="text-xs text-muted-foreground">
            Complete your AI intake first to get a queue token.
          </p>
          <Button asChild>
            <Link href="/patient/intake">Start AI Intake</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const statusIndex = STATUSES.indexOf(myEntry.status as (typeof STATUSES)[number]);
  const urgencyVariant =
    myEntry.triage_urgency === "Emergency"
      ? "danger"
      : myEntry.triage_urgency === "Moderate"
        ? "warning"
        : "success";

  return (
    <div className="space-y-6">
      {/* Token + status card */}
      <Card className={cn("glow", myEntry.is_emergency && "border-danger/40")}>
        <CardContent className="space-y-5 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Your token</p>
              <p
                className={cn(
                  "text-4xl font-bold tracking-widest",
                  myEntry.is_emergency ? "text-danger" : "text-accent",
                )}
              >
                {myEntry.token}
              </p>
            </div>
            <div className="text-right">
              <Badge variant={urgencyVariant}>
                {myEntry.triage_urgency ?? "Standard"}
              </Badge>
              <p className="mt-1 text-xs text-muted-foreground">{myEntry.department}</p>
            </div>
          </div>

          {(myEntry.wait_minutes ?? 0) > 0 && (
            <div className="rounded-2xl border border-border bg-muted/30 px-4 py-2">
              <p className="text-xs text-muted-foreground">Estimated wait</p>
              <p className="text-xl font-semibold">{myEntry.wait_minutes} min</p>
            </div>
          )}

          {/* Journey steps */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Journey</p>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((status, i) => {
                const isDone = i < statusIndex;
                const isActive = i === statusIndex;
                return (
                  <div
                    key={status}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
                      isActive
                        ? "bg-accent text-white shadow-sm"
                        : isDone
                          ? "border border-success/40 bg-success/10 text-success"
                          : "border border-border bg-muted/30 text-muted-foreground",
                    )}
                  >
                    {isDone && <span>✓</span>}
                    {i + 1}. {status}
                  </div>
                );
              })}
            </div>
          </div>

          {myEntry.status === "Your Turn" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-success/40 bg-success/10 px-4 py-3 text-sm font-semibold text-success"
            >
              🎉 It&apos;s your turn! Please proceed to the doctor&apos;s room.
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Doctor assignment */}
      {myEntry.doctorName && (
        <Card>
          <CardContent className="flex items-start gap-4 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Stethoscope size={18} className="text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Assigned Doctor
              </p>
              <p className="mt-0.5 font-semibold">{myEntry.doctorName}</p>
              <p className="text-sm text-muted-foreground">
                {myEntry.doctorSpecialty}
                {myEntry.doctorRoom && (
                  <span className="ml-2 text-xs">· Room {myEntry.doctorRoom}</span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI recommendation */}
      {myEntry.notes && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary/70">
              AI Recommendation
            </p>
            <p className="text-sm leading-relaxed text-foreground">{myEntry.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Department queue */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
            <p className="text-sm font-semibold">{myEntry.department} Queue</p>
          </div>
          <span className="text-xs text-muted-foreground">
            {deptQueue.length} patients
          </span>
        </div>

        <AnimatePresence mode="popLayout">
          {deptQueue.map((entry) => {
            const profile = Array.isArray(entry.profiles)
              ? entry.profiles[0]
              : entry.profiles;
            const isMe = entry.id === myEntry.id;
            return (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "flex items-center justify-between rounded-2xl border px-4 py-3",
                  isMe
                    ? "border-accent/30 bg-accent/10"
                    : entry.is_emergency
                      ? "border-danger/30 bg-danger/5"
                      : "border-border bg-card",
                )}
              >
                <div>
                  <p className="text-sm font-semibold">
                    {isMe ? "You" : (profile?.full_name ?? entry.token)}
                    {isMe && (
                      <span className="ml-2 text-xs font-normal text-accent">(You)</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{entry.token}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {entry.status}
                  </p>
                  {(entry.wait_minutes ?? 0) > 0 && (
                    <p className="text-sm font-semibold">{entry.wait_minutes}m</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
