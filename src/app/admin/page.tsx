"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ShieldCheck } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/Avatar";
import type { GlobalRole } from "@/lib/types";

type Row = { id: string; email: string; name: string; globalRole: GlobalRole };

function AdminInner() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<Row[] | null>(null);

  useEffect(() => {
    if (user && user.role !== "ADMIN") router.replace("/");
  }, [user, router]);

  async function load() {
    const data = await api<{ users: Row[] }>("/api/users");
    setUsers(data.users);
  }

  useEffect(() => {
    load();
  }, []);

  async function setRole(id: string, role: GlobalRole) {
    await api(`/api/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) });
    load();
  }

  if (!user || user.role !== "ADMIN") return null;

  const adminCount = users?.filter((u) => u.globalRole === "ADMIN").length ?? 0;

  return (
    <>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Total users</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{users?.length ?? "—"}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Admins</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{adminCount}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Members</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">
            {users ? users.length - adminCount : "—"}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <div className="text-sm font-semibold">Users</div>
            <div className="text-xs text-muted-foreground">Manage global roles across the workspace.</div>
          </div>
        </div>
        <div className="divide-y divide-border">
          {!users &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          {users?.map((u) => {
            const isAdmin = u.globalRole === "ADMIN";
            return (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-accent/40">
                <Avatar name={u.name} email={u.email} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{u.name}</span>
                    {u.id === user.id && <Badge variant="muted">You</Badge>}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                </div>
                <Badge variant={isAdmin ? "brand" : "muted"}>
                  {isAdmin ? <ShieldCheck className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                  {u.globalRole}
                </Badge>
                {u.id !== user.id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRole(u.id, isAdmin ? "MEMBER" : "ADMIN")}
                  >
                    Make {isAdmin ? "Member" : "Admin"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AppShell
        title="Admin"
        description="Manage users and workspace roles."
        breadcrumbs={[{ label: "Admin" }]}
      >
        <AdminInner />
      </AppShell>
    </ProtectedRoute>
  );
}
