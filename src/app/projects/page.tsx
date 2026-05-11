"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, FolderKanban, Plus, Search, Users } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";
import type { Project, Team } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function CreateProjectDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [teamId, setTeamId] = useState<string>("none");
  const [teams, setTeams] = useState<Team[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    api<{ teams: Team[] }>("/api/teams")
      .then((d) => setTeams(d.teams))
      .catch(() => {});
  }, [open]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/api/projects", {
        method: "POST",
        body: JSON.stringify({
          name,
          description,
          teamId: teamId === "none" ? null : teamId,
        }),
      });
      setName("");
      setDescription("");
      setTeamId("none");
      setOpen(false);
      onCreated();
    } catch (err: any) {
      setError(err.message ?? "Failed to create project");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="brand"><Plus className="h-4 w-4" />New project</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a project</DialogTitle>
          <DialogDescription>You'll be added as the project admin automatically.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onCreate} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Project name</Label>
            <Input id="name" required autoFocus placeholder="e.g. Q3 Launch" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="What's this project about?" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Team (optional)</Label>
            <Select value={teamId} onValueChange={setTeamId}>
              <SelectTrigger>
                <SelectValue placeholder="No team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No team</SelectItem>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Linking a team gives all team members access to this project.
            </p>
          </div>
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" variant="brand" disabled={busy}>{busy ? "Creating…" : "Create project"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.id}`} className="group block">
      <Card className="relative h-full overflow-hidden border-border/70 bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-elevated">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-brand/60 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/8 text-brand ring-1 ring-inset ring-brand/15">
              <FolderKanban className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground/70 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand" />
          </div>
          <div className="mt-5 space-y-1.5">
            <div className="font-display text-[17px] font-semibold leading-tight tracking-[-0.015em] text-foreground">
              {project.name}
            </div>
            <p className="line-clamp-2 min-h-[2.5rem] text-[13.5px] leading-relaxed text-muted-foreground">
              {project.description || "No description yet."}
            </p>
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4 text-xs">
            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="font-medium tabular-nums text-foreground/80">
                {project._count?.tasks ?? 0}
              </span>
              <span>tasks</span>
              <span className="h-3 w-px bg-border" />
              <span className="font-medium tabular-nums text-foreground/80">
                {project._count?.members ?? 0}
              </span>
              <span>members</span>
            </div>
            {project.team ? (
              <Badge
                variant="outline"
                className="gap-1 border-brand/20 bg-brand/5 font-medium text-brand"
              >
                <Users className="h-3 w-3" />{project.team.name}
              </Badge>
            ) : (
              <Badge variant="outline" className="font-medium text-muted-foreground">
                {project.owner?.name?.split(" ")[0] ?? "—"}
              </Badge>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

function ProjectsInner() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [query, setQuery] = useState("");

  async function load() {
    const data = await api<{ projects: Project[] }>("/api/projects");
    setProjects(data.projects);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!projects) return null;
    if (!query.trim()) return projects;
    const q = query.toLowerCase();
    return projects.filter(
      (p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q),
    );
  }, [projects, query]);

  return (
    <AppShell
      breadcrumbs={[{ label: "Projects" }]}
    >
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-3xl">
          <h1 className="font-display text-5xl font-bold tracking-[-0.04em] text-foreground sm:text-[3.5rem]">
            Projects
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Every project you own or collaborate on, organised in one place.
          </p>
        </div>
        <CreateProjectDialog onCreated={load} />
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-5">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects"
            className="h-10 pl-9"
          />
        </div>
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {filtered?.length ?? 0} {filtered?.length === 1 ? "project" : "projects"}
        </span>
      </div>

      {!filtered && (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      )}

      {filtered && filtered.length === 0 && (
        <Card className="border-dashed bg-card/50 p-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand/8 ring-1 ring-inset ring-brand/15">
            <FolderKanban className="h-6 w-6 text-brand" strokeWidth={1.75} />
          </div>
          <h3 className="mt-5 font-display text-lg font-semibold tracking-tight">
            {query ? "No projects match your search" : "No projects yet"}
          </h3>
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {query
              ? "Try a different search term or clear the filter."
              : "Create your first project to start tracking work across your team."}
          </p>
        </Card>
      )}

      {filtered && filtered.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </AppShell>
  );
}

export default function ProjectsPage() {
  return (
    <ProtectedRoute>
      <ProjectsInner />
    </ProtectedRoute>
  );
}
