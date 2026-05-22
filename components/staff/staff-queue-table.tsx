"use client";

import { useState, useTransition } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type QueueEntry = {
  id: string;
  token: string;
  department: string;
  status: string;
  patient_type: string;
  is_emergency: boolean;
  triage_urgency: string | null;
  wait_minutes: number | null;
  symptoms: string | null;
  profiles: { full_name: string; phone?: string } | { full_name: string; phone?: string }[] | null;
};

const STATUS_FLOW: Record<string, string> = {
  Registered: "Waiting",
  Waiting: "File With Doctor",
  "File With Doctor": "Your Turn",
  "Your Turn": "Completed",
};

const PATIENT_TYPE_COLORS: Record<string, string> = {
  OPD: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400",
  IPD: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400",
  Emergency: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400",
  Referral: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400",
  Telemedicine: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400",
};

export function StaffQueueTable({ queue }: { queue: QueueEntry[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const advance = async (entry: QueueEntry) => {
    const next = STATUS_FLOW[entry.status];
    if (!next) return;
    setLoadingId(entry.id);
    const supabase = createClient();
    const update: Record<string, string> = { status: next };
    if (next === "Completed") update.completed_at = new Date().toISOString();
    await supabase.from("queue_entries").update(update).eq("id", entry.id);
    setLoadingId(null);
    startTransition(() => router.refresh());
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Live Queue</p>
          <Badge variant="outline">{queue.length} active</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Token</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Wait</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queue.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-6 text-center text-xs text-muted-foreground"
                >
                  Queue is empty.
                </TableCell>
              </TableRow>
            )}
            {queue.map((entry) => {
              const patient = Array.isArray(entry.profiles)
                ? entry.profiles[0]
                : entry.profiles;
              const isLoading = loadingId === entry.id;
              const nextStatus = STATUS_FLOW[entry.status];
              return (
                <TableRow
                  key={entry.id}
                  className={cn(entry.is_emergency && "bg-danger/5")}
                >
                  <TableCell className="font-semibold">
                    {entry.token}
                    {entry.is_emergency && (
                      <span className="ml-1 text-danger">●</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">
                        {patient?.full_name ?? "—"}
                      </p>
                      {patient?.phone && (
                        <p className="text-[10px] text-muted-foreground">
                          {patient.phone}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                        PATIENT_TYPE_COLORS[entry.patient_type] ??
                          "border-border bg-muted/40 text-muted-foreground",
                      )}
                    >
                      {entry.patient_type}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs">{entry.department}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        entry.status === "Your Turn"
                          ? "success"
                          : entry.is_emergency
                            ? "danger"
                            : "outline"
                      }
                      className="text-xs"
                    >
                      {entry.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {entry.wait_minutes ?? "—"}m
                  </TableCell>
                  <TableCell>
                    {nextStatus ? (
                      <Button
                        size="sm"
                        variant={entry.is_emergency ? "destructive" : "secondary"}
                        onClick={() => advance(entry)}
                        disabled={isLoading}
                        className="text-xs"
                      >
                        {isLoading ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <ChevronRight size={12} />
                        )}
                        {nextStatus === "Completed" ? "Complete" : "Advance"}
                      </Button>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">Done</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
