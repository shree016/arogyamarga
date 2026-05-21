"use client";

import { AlertTriangle, Bell, Timer } from "lucide-react";
import { RoleGuard } from "@/components/auth/role-guard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { WaitChart } from "@/components/dashboard/wait-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQueueStore } from "@/store/queue-store";

export default function ReceptionistPage() {
  const { patients, updateStatus } = useQueueStore();

  const emergencyCount = patients.filter((patient) => patient.emergency).length;

  return (
    <RoleGuard allow={["Receptionist", "Super Admin"]}>
      <DashboardShell
        title="Receptionist Command Center"
        subtitle="Monitor live queue, emergencies, and operational flow."
      >
        <div className="grid gap-4 lg:grid-cols-4">
          <Card className="glass">
            <CardContent className="space-y-2 p-5">
              <p className="text-xs text-muted-foreground">Total waiting</p>
              <p className="text-2xl font-semibold">{patients.length}</p>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="space-y-2 p-5">
              <p className="text-xs text-muted-foreground">Emergency cases</p>
              <p className="text-2xl font-semibold text-danger">
                {emergencyCount}
              </p>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="space-y-2 p-5">
              <p className="text-xs text-muted-foreground">Active doctors</p>
              <p className="text-2xl font-semibold">8</p>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="space-y-2 p-5">
              <p className="text-xs text-muted-foreground">Average wait</p>
              <p className="text-2xl font-semibold">18 min</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Live queue table</p>
                <Button size="sm">Call next patient</Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Wait</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-semibold">
                        {patient.token}
                      </TableCell>
                      <TableCell>{patient.name}</TableCell>
                      <TableCell>{patient.department}</TableCell>
                      <TableCell>
                        <Badge
                          variant={patient.emergency ? "danger" : "outline"}
                        >
                          {patient.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{patient.waitMinutes}m</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => updateStatus(patient.id)}
                        >
                          Advance
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="glow">
              <CardContent className="space-y-3 p-6">
                <div className="flex items-center gap-2 text-danger">
                  <AlertTriangle size={18} />
                  <p className="text-sm font-semibold">Emergency alerts</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {emergencyCount > 0
                    ? "Emergency patient waiting in priority lane."
                    : "No active emergency alerts."}
                </p>
                <Button variant="destructive" size="sm">
                  Emergency override
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center gap-2">
                  <Timer size={16} />
                  <p className="text-sm font-semibold">Average wait trend</p>
                </div>
                <WaitChart />
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="space-y-3 p-6">
                <div className="flex items-center gap-2">
                  <Bell size={16} />
                  <p className="text-sm font-semibold">Operational notes</p>
                </div>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li>Doctor Kavya Nair running 10 min late.</li>
                  <li>Lab reports sync completed 2 minutes ago.</li>
                  <li>AI triage accuracy holding at 92%.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardShell>
    </RoleGuard>
  );
}
