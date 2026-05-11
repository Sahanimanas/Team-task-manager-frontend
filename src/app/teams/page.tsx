"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Plus, Search, Users } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";
import type { Team } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function CreateTeamDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/api/teams", { method: "POST", body: JSON.stringify({ name, description }) });
      setName("");
      setDescription("");
      setOpen(false);
      onCreated();
    } catch (err: any) {
      setError(err.message ?? "Failed to create team");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="brand">
          <Plus className="h-4 w-4" />New team
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a team</DialogTitle>
          <DialogDescription>
            You'll be added as the team admin automatically.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onCreate} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Team name</Label>
            <Input
              id="name"
              required
              autoFocus
              placeholder="e.g. Frontend"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What does this team do?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
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
            <Button type="submit" variant="brand" disabled={busy}>
              {busy ? "Creating…" : "Create team"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TeamCard({ team }: { team: Team }) {
  return (
    <Link href={`/teams/${team.id}`} className="group block">
      <Card className="relative h-full overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand/15 to-brand/5 text-brand ring-1 ring-inset ring-brand/15">
              <Users className="h-5 w-5" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
          </div>
          <div className="mt-4 space-y-1">
            <div className="font-medium tracking-tight">{team.name}</div>
            <p className="line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
              {team.description || "No description yet."}
            </p>
          </div>
          <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="tabular-nums">{team._count?.members ?? 0} members</span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span className="tabular-nums">{team._count?.projects ?? 0} projects</span>
            </div>
            <Badge variant="outline">{team.owner?.name?.split(" ")[0] ?? "—"}</Badge>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function TeamsInner() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [query, setQuery] = useState("");

  async function load() {
    const data = await api<{ teams: Team[] }>("/api/teams");
    setTeams(data.teams);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!teams) return null;
    if (!query.trim()) return teams;
    const q = query.toLowerCase();
    return teams.filter(
      (t) => t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q),
    );
  }, [teams, query]);

  return (
    <AppShell
      title="Teams"
      description="Groups of people you can reuse across projects."
      breadcrumbs={[{ label: "Teams" }]}
      actions={<CreateTeamDialog onCreated={load} />}
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search teams…"
            className="pl-9"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {filtered?.length ?? 0} {filtered?.length === 1 ? "team" : "teams"}
        </span>
      </div>

      {!filtered && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      )}

      {filtered && filtered.length === 0 && (
        <Card className="p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-base font-semibold">
            {query ? "No teams match your search" : "No teams yet"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {query
              ? "Try a different search term."
              : "Create a team to group people you collaborate with regularly."}
          </p>
        </Card>
      )}

      {filtered && filtered.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <TeamCard key={t.id} team={t} />
          ))}
        </div>
      )}
    </AppShell>
  );
}

export default function TeamsPage() {
  return (
    <ProtectedRoute>
      <TeamsInner />
    </ProtectedRoute>
  );
}
