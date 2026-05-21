"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { waitTimeSeries } from "@/lib/mock-data";

export function WaitChart() {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer>
        <LineChart data={waitTimeSeries} margin={{ left: -10, right: 10 }}>
          <XAxis dataKey="hour" tickLine={false} axisLine={false} />
          <YAxis hide domain={[0, 30]} />
          <Tooltip
            cursor={{ stroke: "#0066FF", strokeDasharray: "4 4" }}
            contentStyle={{
              background: "#0F172A",
              borderRadius: "12px",
              border: "1px solid #1E293B",
            }}
            labelStyle={{ color: "#E2E8F0" }}
            itemStyle={{ color: "#00D4FF" }}
          />
          <Line
            type="monotone"
            dataKey="wait"
            stroke="#0066FF"
            strokeWidth={3}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
