"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Calendar,
  ChevronDown,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";
import Link from "next/link";
import type {
  Member,
  Project,
  Task,
  TaskPriority,
  TaskStatus,
  Team,
  UserSummary,
} from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar } from "@/components/Avatar";
import { cn } from "@/lib/utils";

const STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

const STATUS_META: Record<
  TaskStatus,
  { label: string; dot: string; text: string; column: string }
> = {
  TODO: {
    label: "To do",
    dot: "bg-slate-400",
    text: "text-slate-600 dark:text-slate-300",
    column: "border-slate-200/80 dark:border-slate-700/60",
  },
  IN_PROGRESS: {
    label: "In progress",
    dot: "bg-brand",
    text: "text-brand",
    column: "border-brand/25",
  },
  DONE: {
    label: "Done",
    dot: "bg-success",
    text: "text-success",
    column: "border-success/25",
  },
};

const PRIORITY_META: Record<TaskPriority, { label: string; dot: string }> = {
  HIGH: { label: "High", dot: "bg-destructive" },
  MEDIUM: { label: "Medium", dot: "bg-warning" },
  LOW: { label: "Low", dot: "bg-muted-foreground/60" },
};

function isOverdue(t: Task) {
  return t.dueDate && t.status !== "DONE" && new Date(t.dueDate) < new Date();
}

function formatDueDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function ProjectInner() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const { user } = useAuth();

  const [project, setProject] = useState<
    (Project & { members: Member[]; team?: (Team & { members?: Member[] }) | null }) | null
  >(null);
  const [myRole, setMyRole] = useState<"ADMIN" | "MEMBER" | null>(null);
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [allUsers, setAllUsers] = useState<UserSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadProject = useCallback(async () => {
    const data = await api<{
      project: Project & { members: Member[]; team?: (Team & { members?: Member[] }) | null };
      myRole: "ADMIN" | "MEMBER";
    }>(`/api/projects/${projectId}`);
    setProject(data.project);
    setMyRole(data.myRole);
  }, [projectId]);

  const loadTasks = useCallback(async () => {
    const data = await api<{ tasks: Task[] }>(`/api/projects/${projectId}/tasks`);
    setTasks(data.tasks);
  }, [projectId]);

  const loadUsers = useCallback(async () => {
    const data = await api<{ users: UserSummary[] }>("/api/users");
    setAllUsers(data.users);
  }, []);

  useEffect(() => {
    loadProject().catch((e) => setError(e.message));
    loadTasks().catch(() => {});
    loadUsers().catch(() => {});
  }, [loadProject, loadTasks, loadUsers]);

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-72" />
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const isAdmin = myRole === "ADMIN";
  const memberIds = new Set(project.members.map((m) => m.userId));
  const nonMembers = allUsers.filter((u) => !memberIds.has(u.id));

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6 border-b border-border/70 pb-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge
              variant={isAdmin ? "brand" : "muted"}
              className="font-medium uppercase tracking-wider"
            >
              {myRole}
            </Badge>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-muted-foreground">
              <span className="font-medium tabular-nums text-foreground">{project.members.length}</span>
              members
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-muted-foreground">
              <span className="font-medium tabular-nums text-foreground">{tasks?.length ?? 0}</span>
              tasks
            </span>
            {project.team && (
              <Link
                href={`/teams/${project.team.id}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/5 px-2.5 py-0.5 font-medium text-brand transition-colors hover:bg-brand/10"
              >
                <Users className="h-3 w-3" />{project.team.name}
              </Link>
            )}
          </div>
          <div>
            <h1 className="font-display text-4xl font-bold tracking-[-0.04em] text-foreground sm:text-5xl">
              {project.name}
            </h1>
            {project.description && (
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
                {project.description}
              </p>
            )}
          </div>
          {isAdmin && (
            <ProjectTeamPicker
              projectId={projectId}
              currentTeamId={project.teamId ?? null}
              onChanged={loadProject}
            />
          )}
        </div>
        <NewTaskDialog projectId={projectId} members={project.members} onCreated={loadTasks} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-5 md:grid-cols-3">
          {STATUSES.map((status) => {
            const list = (tasks ?? []).filter((t) => t.status === status);
            const meta = STATUS_META[status];
            return (
              <div
                key={status}
                className={cn(
                  "flex flex-col rounded-xl border bg-card/40 p-3.5",
                  meta.column,
                )}
              >
                <div className="mb-4 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
                    <span
                      className={cn(
                        "text-[11px] font-semibold uppercase tracking-[0.08em]",
                        meta.text,
                      )}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-secondary px-1.5 text-[11px] font-medium tabular-nums text-foreground/70">
                    {list.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2.5">
                  {!tasks &&
                    Array.from({ length: 2 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full rounded-lg" />
                    ))}
                  {tasks && list.length === 0 && (
                    <div className="rounded-lg border border-dashed border-border/70 bg-background/50 px-3 py-8 text-center text-xs text-muted-foreground">
                      No tasks
                    </div>
                  )}
                  {list.map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      members={project.members}
                      currentUserId={user!.id}
                      myRole={myRole!}
                      onUpdated={loadTasks}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <Card className="h-fit border-border/70 lg:sticky lg:top-20">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-brand" strokeWidth={1.75} />
              <CardTitle className="font-display text-[15px]">Members</CardTitle>
            </div>
            {isAdmin && nonMembers.length > 0 && (
              <AddMemberDialog projectId={projectId} candidates={nonMembers} onAdded={loadProject} />
            )}
          </CardHeader>
          <CardContent className="space-y-1 pt-3">
            {project.members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent/60">
                <Avatar name={m.user.name} email={m.user.email} size={30} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{m.user.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{m.user.email}</div>
                </div>
                <Badge variant={m.role === "ADMIN" ? "brand" : "muted"}>{m.role}</Badge>
                {isAdmin && m.userId !== project.ownerId && (
                  <button
                    onClick={async () => {
                      await api(`/api/projects/${projectId}/members/${m.userId}`, { method: "DELETE" });
                      loadProject();
                    }}
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
    </>
  );
}

function TaskCard({
  task,
  members,
  currentUserId,
  myRole,
  onUpdated,
}: {
  task: Task;
  members: Member[];
  currentUserId: string;
  myRole: "ADMIN" | "MEMBER";
  onUpdated: () => void;
}) {
  const canEdit =
    myRole === "ADMIN" || task.assigneeId === currentUserId || task.createdById === currentUserId;
  const canDelete = myRole === "ADMIN" || task.createdById === currentUserId;
  const overdue = isOverdue(task);
  const [editOpen, setEditOpen] = useState(false);

  async function changeStatus(status: TaskStatus) {
    await api(`/api/tasks/${task.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    onUpdated();
  }

  async function deleteTask() {
    if (!confirm("Delete this task?")) return;
    await api(`/api/tasks/${task.id}`, { method: "DELETE" });
    onUpdated();
  }

  return (
    <div
      className={cn(
        "group relative rounded-lg border border-border/70 bg-card p-3.5 text-sm shadow-soft transition-all duration-150 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-elevated",
        overdue && "border-destructive/30",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          <span className={cn("h-1.5 w-1.5 rounded-full", PRIORITY_META[task.priority].dot)} />
          {PRIORITY_META[task.priority].label}
        </div>
        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100"
                aria-label="Task actions"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
              </DropdownMenuItem>
              {STATUSES.filter((s) => s !== task.status).map((s) => (
                <DropdownMenuItem key={s} onClick={() => changeStatus(s)}>
                  <span className={cn("mr-2 h-2 w-2 rounded-full", STATUS_META[s].dot)} />
                  Move to {STATUS_META[s].label}
                </DropdownMenuItem>
              ))}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={deleteTask} className="text-destructive">
                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div className="mt-2 font-display text-[14px] font-medium leading-snug tracking-[-0.005em] text-foreground">
        {task.title}
      </div>
      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {task.description}
        </p>
      )}
      <div className="mt-3.5 flex items-center justify-between border-t border-border/50 pt-2.5">
        <div className="flex items-center gap-2">
          {task.assignee ? (
            <Avatar name={task.assignee.name} email={task.assignee.email} size={22} />
          ) : (
            <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full border border-dashed border-border text-[10px] text-muted-foreground">
              -
            </div>
          )}
          <span className="truncate text-xs text-muted-foreground">
            {task.assignee?.name ?? "Unassigned"}
          </span>
        </div>
        {task.dueDate && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs tabular-nums",
              overdue ? "font-semibold text-destructive" : "text-muted-foreground",
            )}
          >
            <Calendar className="h-3 w-3" strokeWidth={2} />
            {formatDueDate(task.dueDate)}
          </div>
        )}
      </div>
      {canEdit && (
        <EditTaskDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          task={task}
          members={members}
          canReassign={myRole === "ADMIN" || task.createdById === currentUserId}
          onSaved={onUpdated}
        />
      )}
    </div>
  );
}

function NewTaskDialog({
  projectId,
  members,
  onCreated,
}: {
  projectId: string;
  members: Member[];
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [assigneeId, setAssigneeId] = useState<string>("unassigned");
  const [dueDate, setDueDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        body: JSON.stringify({
          title,
          description: description || undefined,
          priority,
          assigneeId: assigneeId === "unassigned" ? null : assigneeId,
          dueDate: dueDate || undefined,
        }),
      });
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setAssigneeId("unassigned");
      setDueDate("");
      setOpen(false);
      onCreated();
    } catch (err: any) {
      setError(err.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="brand"><Plus className="h-4 w-4" />New task</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" required autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short, action-oriented title" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add more context (optional)" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="due">Due date</Label>
              <Input id="due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Assignee</Label>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.userId} value={m.userId}>{m.user.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" variant="brand" disabled={busy}>{busy ? "Creating…" : "Create task"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditTaskDialog({
  open,
  onOpenChange,
  task,
  members,
  canReassign,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  task: Task;
  members: Member[];
  canReassign: boolean;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [assigneeId, setAssigneeId] = useState<string>(task.assigneeId ?? "unassigned");
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.slice(0, 10) : "");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const body: any = {
        title,
        description: description || null,
        priority,
        dueDate: dueDate || null,
      };
      if (canReassign) body.assigneeId = assigneeId === "unassigned" ? null : assigneeId;
      await api(`/api/tasks/${task.id}`, { method: "PATCH", body: JSON.stringify(body) });
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
          <DialogTitle>Edit task</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Due date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          {canReassign && (
            <div className="space-y-1.5">
              <Label>Assignee</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.userId} value={m.userId}>{m.user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" variant="brand" disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddMemberDialog({
  projectId,
  candidates,
  onAdded,
}: {
  projectId: string;
  candidates: UserSummary[];
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState(candidates[0]?.id ?? "");
  const [role, setRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setBusy(true);
    try {
      await api(`/api/projects/${projectId}/members`, {
        method: "POST",
        body: JSON.stringify({ userId, role }),
      });
      setOpen(false);
      onAdded();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><UserPlus className="h-3.5 w-3.5" />Add</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a member</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>User</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger><SelectValue placeholder="Select a user" /></SelectTrigger>
              <SelectContent>
                {candidates.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name} · {u.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" variant="brand" disabled={busy || !userId}>{busy ? "Adding…" : "Add member"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProjectTeamPicker({
  projectId,
  currentTeamId,
  onChanged,
}: {
  projectId: string;
  currentTeamId: string | null;
  onChanged: () => void;
}) {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ teams: Team[] }>("/api/teams")
      .then((d) => setTeams(d.teams))
      .catch(() => setTeams([]));
  }, []);

  async function update(value: string) {
    setBusy(true);
    try {
      await api(`/api/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify({ teamId: value === "none" ? null : value }),
      });
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  if (!teams) return null;

  return (
    <div className="flex items-center gap-2">
      <Users className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">Team:</span>
      <Select
        value={currentTeamId ?? "none"}
        onValueChange={update}
        disabled={busy}
      >
        <SelectTrigger className="h-7 w-[200px] text-xs">
          <SelectValue placeholder="No team" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No team</SelectItem>
          {teams.map((t) => (
            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function ProjectPage() {
  return (
    <ProtectedRoute>
      <AppShell breadcrumbs={[{ label: "Projects", href: "/projects" }, { label: "Project" }]}>
        <ProjectInner />
      </AppShell>
    </ProtectedRoute>
  );
}
