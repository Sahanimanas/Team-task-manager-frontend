"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FolderKanban, Pencil, Trash2, UserPlus, Users } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppShell } from "@/components/AppShell";
import { api, ApiError } from "@/lib/api";
import type { Team, TeamMember, TeamRole } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar } from "@/components/Avatar";

type TeamDetail = Team & {
  members: TeamMember[];
  projects: { id: string; name: string; _count?: { tasks: number } }[];
};

function TeamInner() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const teamId = params.id;

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [myRole, setMyRole] = useState<TeamRole | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const load = useCallback(async () => {
    const data = await api<{ team: TeamDetail; myRole: TeamRole }>(`/api/teams/${teamId}`);
    setTeam(data.team);
    setMyRole(data.myRole);
  }, [teamId]);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!team) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-72" />
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const isAdmin = myRole === "ADMIN";

  async function removeMember(userId: string) {
    if (!confirm("Remove this member from the team?")) return;
    try {
      await api(`/api/teams/${teamId}/members/${userId}`, { method: "DELETE" });
      load();
    } catch (e) {
      if (e instanceof ApiError) alert(e.message);
    }
  }

  async function changeRole(userId: string, role: TeamRole) {
    await api(`/api/teams/${teamId}/members/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
    load();
  }

  async function deleteTeam() {
    if (!confirm("Delete this team? Linked projects will be unlinked but not deleted.")) return;
    await api(`/api/teams/${teamId}`, { method: "DELETE" });
    router.replace("/teams");
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant={isAdmin ? "brand" : "muted"}>{myRole}</Badge>
            <span>·</span>
            <span>{team.members.length} members</span>
            <span>·</span>
            <span>{team.projects.length} projects</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{team.name}</h1>
          {team.description && (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{team.description}</p>
          )}
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5" />Edit
            </Button>
            <Button variant="outline" size="sm" onClick={deleteTeam} className="text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />Delete
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
              <CardTitle>Projects</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {team.projects.length === 0 && (
              <div className="rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                No projects linked to this team yet.
                <div className="mt-1 text-xs">
                  Link a team when creating or editing a project.
                </div>
              </div>
            )}
            {team.projects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-accent/60"
              >
                <span className="font-medium">{p.name}</span>
                <span className="text-xs text-muted-foreground">
                  {p._count?.tasks ?? 0} tasks
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="h-fit lg:sticky lg:top-20">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <CardTitle>Members</CardTitle>
            </div>
            {isAdmin && <AddMemberDialog teamId={teamId} onAdded={load} />}
          </CardHeader>
          <CardContent className="space-y-1.5">
            {team.members.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-accent/60"
              >
                <Avatar name={m.user.name} email={m.user.email} size={28} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{m.user.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{m.user.email}</div>
                </div>
                {isAdmin && m.userId !== team.ownerId ? (
                  <Select
                    value={m.role}
                    onValueChange={(v) => changeRole(m.userId, v as TeamRole)}
                  >
                    <SelectTrigger className="h-7 w-[88px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MEMBER">Member</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant={m.role === "ADMIN" ? "brand" : "muted"}>{m.role}</Badge>
                )}
                {isAdmin && m.userId !== team.ownerId && (
                  <button
                    onClick={() => removeMember(m.userId)}
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Remove member"
                    title="Remove member"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <EditTeamDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        team={team}
        onSaved={load}
      />
    </>
  );
}

function AddMemberDialog({
  teamId,
  onAdded,
}: {
  teamId: string;
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("MEMBER");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/api/teams/${teamId}/members`, {
        method: "POST",
        body: JSON.stringify({ email, role }),
      });
      setEmail("");
      setRole("MEMBER");
      setOpen(false);
      onAdded();
    } catch (err: any) {
      setError(err?.message ?? "Failed to add member");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <UserPlus className="h-3.5 w-3.5" />Add
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a team member</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">User email</Label>
            <Input
              id="email"
              type="email"
              required
              autoFocus
              placeholder="someone@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as TeamRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" variant="brand" disabled={busy || !email}>
              {busy ? "Adding…" : "Add member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditTeamDialog({
  open,
  onOpenChange,
  team,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  team: Team;
  onSaved: () => void;
}) {
  const [name, setName] = useState(team.name);
  const [description, setDescription] = useState(team.description ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setName(team.name);
      setDescription(team.description ?? "");
    }
  }, [open, team]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api(`/api/teams/${team.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name, description: description || null }),
      });
      onOpenChange(false);
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit team</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" variant="brand" disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function TeamPage() {
  return (
    <ProtectedRoute>
      <AppShell
        breadcrumbs={[{ label: "Teams", href: "/teams" }, { label: "Team" }]}
      >
        <TeamInner />
      </AppShell>
    </ProtectedRoute>
  );
}
