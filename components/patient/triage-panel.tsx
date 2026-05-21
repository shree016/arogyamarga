"use client";

import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useIntakeStore } from "@/store/intake-store";
import type { TriageResult } from "@/lib/types";

const fallback: TriageResult = {
  score: 3,
  urgency: "Moderate",
  confidence: 0.84,
  department: "General Medicine",
  recommendedDoctor: "Dr. Rohan Mehta",
  waitMinutes: 22,
  tags: ["fever", "moderate", "routine"],
  severityBreakdown: [
    { label: "Pain", value: 52, color: "#FF9500" },
    { label: "Vitals", value: 44, color: "#0066FF" },
    { label: "History", value: 36, color: "#00D4FF" },
  ],
};

export function TriagePanel() {
  const { triage, emergency } = useIntakeStore();
  const data = triage ?? fallback;
  const isEmpty = !triage;

  const ringColor =
    data.urgency === "Emergency"
      ? "#FF3B30"
      : data.urgency === "Moderate"
        ? "#FF9500"
        : "#34C759";

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      {isEmpty && (
        <Card className="lg:col-span-2">
          <CardContent className="grid gap-4 p-6 md:grid-cols-[0.6fr_1.4fr]">
            <div className="space-y-3">
              <p className="text-sm font-semibold">No triage yet</p>
              <p className="text-sm text-muted-foreground">
                Complete AI intake to generate a personalized triage summary.
              </p>
            </div>
            <div className="grid gap-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-5 w-1/2" />
            </div>
          </CardContent>
        </Card>
      )}
      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 p-6 md:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col items-center justify-center">
            <div className="h-48 w-48">
              <ResponsiveContainer>
                <RadialBarChart
                  innerRadius="70%"
                  outerRadius="100%"
                  data={[{ value: data.score * 20 }]}
                  startAngle={90}
                  endAngle={-270}
                >
                  <PolarAngleAxis
                    type="number"
                    domain={[0, 100]}
                    tick={false}
                  />
                  <RadialBar
                    dataKey="value"
                    cornerRadius={14}
                    fill={ringColor}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="-mt-24 flex flex-col items-center">
              <span className="text-4xl font-bold">{data.score}</span>
              <span className="text-xs uppercase text-muted-foreground">
                Triage Score
              </span>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Badge
                variant={
                  data.urgency === "Emergency"
                    ? "danger"
                    : data.urgency === "Moderate"
                      ? "warning"
                      : "success"
                }
              >
                {data.urgency}
              </Badge>
              {emergency && <Badge variant="danger">Priority</Badge>}
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-3xl border border-border bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground">AI Confidence</p>
              <p className="text-2xl font-semibold">
                {(data.confidence * 100).toFixed(0)}%
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground">Department</p>
              <p className="text-lg font-semibold">{data.department}</p>
              <p className="text-sm text-muted-foreground">
                Recommended: {data.recommendedDoctor}
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground">Estimated wait</p>
              <p className="text-lg font-semibold">{data.waitMinutes} min</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Severity breakdown</p>
              <span className="text-xs text-muted-foreground">
                AI triage insights
              </span>
            </div>
            {data.severityBreakdown.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground">
                    {item.label}
                  </span>
                  <span className="font-semibold text-foreground">
                    {item.value}%
                  </span>
                </div>
                <Progress value={item.value} color={item.color} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glow">
          <CardContent className="space-y-3 p-6">
            <p className="text-sm font-semibold">AI recommendation</p>
            <p className="text-sm text-muted-foreground">
              Continue to doctor selection to finalize your queue token and
              telemedicine option.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
