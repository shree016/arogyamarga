"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import type { UserRole } from "@/lib/permissions";
import { roleMeta } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type RoleGuardProps = {
  allow: UserRole[];
  children: React.ReactNode;
  title?: string;
  description?: string;
};

export function RoleGuard({
  allow,
  children,
  title,
  description,
}: RoleGuardProps) {
  const { isAuthenticated, role, hasHydrated } = useAuthStore();

  if (!hasHydrated) {
    return (
      <Card className="mx-auto w-full max-w-3xl">
        <CardContent className="space-y-4 p-6">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </CardContent>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return (
      <AccessCard
        title={title ?? "Sign in required"}
        description={
          description ?? "Please sign in to access this experience."
        }
        allow={allow}
      />
    );
  }

  if (role && allow.includes(role)) {
    return children;
  }

  return (
    <AccessCard
      title="Access restricted"
      description={`Your current role (${role ?? "Unknown"}) does not have access.`}
      allow={allow}
    />
  );
}

function AccessCard({
  title,
  description,
  allow,
}: {
  title: string;
  description: string;
  allow: UserRole[];
}) {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <Card className="glass">
        <CardContent className="space-y-4 p-6">
          <div>
            <p className="text-lg font-semibold">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {allow.map((role) => (
              <Badge key={role} variant="outline">
                {roleMeta[role].title}
              </Badge>
            ))}
          </div>
          <Button asChild>
            <Link href="/login">Go to login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
