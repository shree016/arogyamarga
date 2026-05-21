"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useQueueStore } from "@/store/queue-store";

const statuses = [
  "Registered",
  "Waiting",
  "File With Doctor",
  "Your Turn",
] as const;

export function QueueTracker() {
  const { patients, tickWait, updateStatus } = useQueueStore();

  useEffect(() => {
    const timer = setInterval(() => tickWait(), 60000);
    return () => clearInterval(timer);
  }, [tickWait]);

  useEffect(() => {
    const timer = setInterval(() => {
      const next = patients[0];
      if (next && next.status !== "Your Turn") {
        updateStatus(next.id);
      }
    }, 45000);
    return () => clearInterval(timer);
  }, [patients, updateStatus]);

  const current = patients[0];

  if (!current) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            No active queue yet. Complete intake to generate your token.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glow">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Your token</p>
              <p className="text-2xl font-semibold">{current.token}</p>
            </div>
            <Badge variant={current.emergency ? "danger" : "outline"}>
              {current.emergency ? "Emergency" : "Standard"}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{current.department}</span>
            <span>·</span>
            <span>{current.waitMinutes} min</span>
            <span>·</span>
            <span>{Math.max(0, patients.length - 1)} ahead</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {statuses.map((status, index) => {
              const active = status === current.status;
              return (
                <div
                  key={status}
                  className={
                    active
                      ? "rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white"
                      : "rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted-foreground"
                  }
                >
                  {index + 1}. {status}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
            <p className="text-sm font-semibold">Live queue</p>
          </div>
          <span className="text-xs text-muted-foreground">
            {patients.length} active patients
          </span>
        </div>
        <AnimatePresence mode="popLayout">
          {patients.map((patient) => (
            <motion.div
              key={patient.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between rounded-3xl border border-border bg-card px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold">{patient.name}</p>
                <p className="text-xs text-muted-foreground">
                  {patient.department} · {patient.token}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-muted-foreground">
                  {patient.status}
                </p>
                <p className="text-sm font-semibold">{patient.waitMinutes}m</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
