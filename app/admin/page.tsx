import { ShieldCheck } from "lucide-react";
import { RoleGuard } from "@/components/auth/role-guard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
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
import { permissionsByRole, roleList, roleMeta } from "@/lib/permissions";
import { supabaseAdmin } from "@/lib/supabase";

export default async function AdminPage() {
  // Fetch recent AI demo logs (server-side)
  const logsRes = await supabaseAdmin
    .from("ai_demo_logs")
    .select("id, prompt, response, model, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const logs = logsRes?.data ?? [];

  return (
    <RoleGuard allow={["Super Admin"]}>
      <DashboardShell title="Admin Console" subtitle="Roles and access.">
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} />
              <p className="text-sm font-semibold">Roles & permissions</p>
            </div>
            <Button size="sm" variant="secondary">
              Manage roles
            </Button>
          </div>

          <Card>
            <CardContent className="p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roleList.map((role) => (
                    <TableRow key={role}>
                      <TableCell className="font-semibold">
                        {roleMeta[role].title}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {permissionsByRole[role].slice(0, 2).map((perm) => (
                            <Badge key={perm} variant="outline">
                              {perm}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{permissionsByRole[role].length}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </DashboardShell>
    </RoleGuard>
  );
}
