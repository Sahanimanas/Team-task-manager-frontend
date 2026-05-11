"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FolderKanban,
  ListTodo,
  ArrowUpRight,
  CircleDot,
  BarChart3,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { DashboardData, Task, TaskPriority, TaskStatus } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/Avatar";
import { cn } from "@/lib/utils";

function StatusBadge({ status }: { status: TaskStatus }) {
  if (status === "DONE") return <Badge variant="success">Done</Badge>;
  if (status === "IN_PROGRESS") return <Badge variant="info">In progress</Badge>;
  return <Badge variant="muted">To do</Badge>;
}

function PriorityDot({ priority }: { priority: TaskPriority }) {
  const cls =
    priority === "HIGH"
      ? "text-destructive"
      : priority === "MEDIUM"
        ? "text-warning"
        : "text-muted-foreground";
  return <CircleDot className={cn("h-3 w-3", cls)} aria-label={priority} />;
}

type StatTone = "neutral" | "info" | "success" | "warning" | "destructive" | "brand";

const STAT_ICON_BG: Record<StatTone, string> = {
  neutral: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200/70 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700/60",
  info: "bg-info/10 text-info ring-1 ring-inset ring-info/20",
  success: "bg-success/10 text-success ring-1 ring-inset ring-success/20",
  warning: "bg-warning/10 text-warning ring-1 ring-inset ring-warning/20",
  destructive: "bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/20",
  brand: "bg-brand/10 text-brand ring-1 ring-inset ring-brand/20",
};

const STAT_TINT: Record<StatTone, string> = {
  neutral: "from-slate-100/70 via-card to-card dark:from-slate-800/40",
  info: "from-info/[0.07] via-card to-card",
  success: "from-success/[0.07] via-card to-card",
  warning: "from-warning/[0.08] via-card to-card",
  destructive: "from-destructive/[0.07] via-card to-card",
  brand: "from-brand/[0.07] via-card to-card",
};

const STAT_ACCENT: Record<StatTone, string> = {
  neutral: "bg-slate-300/70 dark:bg-slate-600/60",
  info: "bg-info/70",
  success: "bg-success/70",
  warning: "bg-warning/70",
  destructive: "bg-destructive/70",
  brand: "bg-brand/70",
};

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  tone = "neutral",
  footer,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  sub: string;
  tone?: StatTone;
  footer?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated",
        STAT_TINT[tone],
      )}
    >
      <span
        className={cn(
          "absolute inset-x-0 top-0 h-[3px] opacity-80",
          STAT_ACCENT[tone],
        )}
        aria-hidden
      />
      <div className="flex items-start gap-3">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", STAT_ICON_BG[tone])}>
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 pt-1">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            {label}
          </div>
          <div className="mt-1 font-display text-[1.875rem] font-bold leading-none tracking-[-0.03em] tabular-nums text-foreground">
            {value}
          </div>
        </div>
      </div>
      <div className="mt-3 text-xs text-muted-foreground">{sub}</div>
      {footer && (
        <div className="mt-4 flex items-center gap-1.5 border-t border-border/60 pt-3 text-xs">
          {footer}
        </div>
      )}
    </div>
  );
}

function Donut({
  todo,
  inProgress,
  done,
  size = 168,
  thickness = 16,
}: {
  todo: number;
  inProgress: number;
  done: number;
  size?: number;
  thickness?: number;
}) {
  const total = Math.max(todo + inProgress + done, 1);
  const radius = (size - thickness) / 2;
  const circ = 2 * Math.PI * radius;
  const segments = [
    { value: done, color: "hsl(var(--success))" },
    { value: inProgress, color: "hsl(var(--brand))" },
    { value: todo, color: "hsl(var(--muted-foreground) / 0.4)" },
  ];
  let offset = 0;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--border))"
          strokeWidth={thickness}
          fill="none"
          opacity={0.5}
        />
        {segments.map((s, i) => {
          const len = (s.value / total) * circ;
          const dash = `${len} ${circ - len}`;
          const dashoffset = -offset;
          offset += len;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={s.color}
              strokeWidth={thickness}
              fill="none"
              strokeDasharray={dash}
              strokeDashoffset={dashoffset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display text-3xl font-bold tracking-[-0.03em] tabular-nums text-foreground">
          {done + inProgress + todo}
        </div>
        <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Total tasks
        </div>
      </div>
    </div>
  );
}

function TaskRow({ task, highlight }: { task: Task; highlight?: "overdue" | "default" }) {
  const overdue = highlight === "overdue";
  return (
    <Link
      href={`/projects/${task.projectId}`}
      className={cn(
        "group flex items-center gap-3 rounded-md border border-transparent px-3 py-2.5 text-sm transition-colors hover:border-border hover:bg-accent/60",
        overdue && "border-destructive/20 bg-destructive/[0.04]",
      )}
    >
      <PriorityDot priority={task.priority} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{task.title}</div>
        <div className="truncate text-xs text-muted-foreground">{task.project?.name}</div>
      </div>
      {task.assignee && (
        <Avatar name={task.assignee.name} email={task.assignee.email} size={22} />
      )}
      {task.dueDate && (
        <div className={cn("text-xs tabular-nums", overdue ? "text-destructive font-medium" : "text-muted-foreground")}>
          {new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </div>
      )}
      <StatusBadge status={task.status} />
      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/0 transition-opacity group-hover:text-muted-foreground group-hover:opacity-100" />
    </Link>
  );
}

function CaughtUpIllustration() {
  return (
    <svg
      viewBox="0 0 160 130"
      className="h-28 w-auto"
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="cu-page" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="hsl(var(--brand) / 0.10)" />
          <stop offset="1" stopColor="hsl(var(--brand) / 0.02)" />
        </linearGradient>
      </defs>
      <rect
        x="42"
        y="12"
        width="76"
        height="100"
        rx="10"
        fill="url(#cu-page)"
        stroke="hsl(var(--brand) / 0.35)"
        strokeWidth="1.5"
      />
      <rect
        x="62"
        y="6"
        width="36"
        height="14"
        rx="4"
        fill="hsl(var(--card))"
        stroke="hsl(var(--brand) / 0.45)"
        strokeWidth="1.5"
      />
      <g stroke="hsl(var(--brand))" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M55 38 L62 45 L74 33" />
        <path d="M55 60 L62 67 L74 55" />
        <path d="M55 82 L62 89 L74 77" />
      </g>
      <line x1="82" y1="40" x2="106" y2="40" stroke="hsl(var(--brand) / 0.35)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="82" y1="62" x2="106" y2="62" stroke="hsl(var(--brand) / 0.35)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="82" y1="84" x2="100" y2="84" stroke="hsl(var(--brand) / 0.35)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="130" cy="30" r="14" fill="hsl(var(--success) / 0.12)" stroke="hsl(var(--success) / 0.35)" strokeWidth="1.5" />
      <path d="M124 30 L128 34 L136 26" stroke="hsl(var(--success))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function DashboardInner() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const firstName = user?.name?.split(" ")[0] ?? "there";

  useEffect(() => {
    api<DashboardData>("/api/dashboard")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  const header = (
    <div className="mb-10 max-w-3xl">
      <h1 className="font-display text-5xl font-bold tracking-[-0.04em] text-foreground sm:text-[3.5rem]">
        Dashboard
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
        Welcome back, <span className="font-medium text-foreground">{firstName}</span>.
        Here's what's happening with your team today.
      </p>
    </div>
  );

  if (error) {
    return (
      <>
        {header}
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          {error}
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        {header}
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-xl" />
            ))}
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            <Skeleton className="h-72 rounded-xl lg:col-span-2" />
            <Skeleton className="h-72 rounded-xl" />
          </div>
        </div>
      </>
    );
  }

  const { stats } = data;
  const totalTasks = stats.todo + stats.inProgress + stats.done;
  const pct = (n: number) =>
    totalTasks > 0 ? `${((n / totalTasks) * 100).toFixed(1)}%` : "0.0%";

  return (
    <>
      {header}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat
          icon={FolderKanban}
          label="Projects"
          value={stats.projects}
          sub="Total projects"
          tone="brand"
          footer={
            <span className="font-medium text-muted-foreground">
              {stats.projects > 0 ? "Active workspaces" : "Create one to start"}
            </span>
          }
        />
        <Stat
          icon={ListTodo}
          label="To do"
          value={stats.todo}
          sub="Tasks to do"
          tone="neutral"
          footer={
            <span className="font-medium text-muted-foreground">
              {stats.todo > 0 ? `${stats.todo} waiting to start` : "Nothing pending"}
            </span>
          }
        />
        <Stat
          icon={Clock}
          label="In progress"
          value={stats.inProgress}
          sub="Tasks in progress"
          tone="info"
          footer={
            <span className="font-medium text-info">
              {stats.inProgress > 0 ? "Currently active" : "Nothing in flight"}
            </span>
          }
        />
        <Stat
          icon={CheckCircle2}
          label="Done"
          value={stats.done}
          sub="Tasks completed"
          tone="success"
          footer={
            <span className="font-medium text-success">
              {totalTasks > 0 ? `${Math.round((stats.done / totalTasks) * 100)}% completion rate` : "No data yet"}
            </span>
          }
        />
        <Stat
          icon={AlertTriangle}
          label="Overdue"
          value={stats.overdueCount}
          sub="Tasks overdue"
          tone={stats.overdueCount > 0 ? "destructive" : "neutral"}
          footer={
            <span className={cn("font-medium", stats.overdueCount > 0 ? "text-destructive" : "text-success")}>
              {stats.overdueCount > 0 ? "Needs attention" : "All on track"}
            </span>
          }
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_minmax(0,420px)]">
        <Card className="border-border/70 shadow-card">
          <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-border/60 pb-4">
            <div>
              <CardTitle className="font-display text-lg tracking-[-0.015em]">
                My open tasks
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Assigned to you across all projects.
              </p>
            </div>
            <Badge variant="outline" className="font-semibold tabular-nums">
              {data.myTasks.length}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-1 pt-3">
            {data.myTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-card/40 px-6 py-10 text-center">
                <CaughtUpIllustration />
                <h3 className="mt-4 font-display text-xl font-semibold tracking-tight">
                  All caught up
                </h3>
                <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  You don't have any tasks assigned right now.
                </p>
                <Button asChild variant="brand" size="sm" className="mt-5">
                  <Link href="/projects">View all tasks</Link>
                </Button>
              </div>
            ) : (
              data.myTasks.map((t) => <TaskRow key={t.id} task={t} />)
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-card">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="font-display text-lg tracking-[-0.015em]">
              Status breakdown
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Across projects you're in.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6 pb-6 pt-5">
            <Donut todo={stats.todo} inProgress={stats.inProgress} done={stats.done} />
            <div className="w-full space-y-2.5">
              {[
                { label: "Done", val: stats.done, color: "bg-success" },
                { label: "In progress", val: stats.inProgress, color: "bg-brand" },
                { label: "To do", val: stats.todo, color: "bg-muted-foreground/40" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2.5">
                    <span className={cn("h-2 w-2 rounded-full", row.color)} />
                    <span className="text-muted-foreground">{row.label}</span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="font-semibold tabular-nums text-foreground">{row.val}</span>
                    <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">
                      {pct(row.val)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Button asChild variant="outline" size="sm" className="mt-1">
              <Link href="/projects">
                <BarChart3 className="h-3.5 w-3.5" />View report
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-border/70 shadow-card">
        <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-border/60 pb-4">
          <div>
            <CardTitle className="font-display text-lg tracking-[-0.015em]">Overdue</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Tasks past their due date that aren't done yet.
            </p>
          </div>
          {data.overdue.length > 0 && (
            <Badge variant="destructive" className="font-semibold tabular-nums">
              {data.overdue.length}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-1 pt-3">
          {data.overdue.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-card/40 px-6 py-10 text-center text-sm text-muted-foreground">
              Nothing overdue.
            </div>
          ) : (
            data.overdue.map((t) => <TaskRow key={t.id} task={t} highlight="overdue" />)
          )}
        </CardContent>
      </Card>

      <Card className="mt-6 border-border/70 shadow-card">
        <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-border/60 pb-4">
          <div>
            <CardTitle className="font-display text-lg tracking-[-0.015em]">
              Recent activity
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Last updated tasks across your projects.
            </p>
          </div>
          {data.recent.length > 0 && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/projects">View projects</Link>
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-1 pt-3">
          {data.recent.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-card/40 px-6 py-10 text-center text-sm text-muted-foreground">
              No activity yet.
            </div>
          ) : (
            data.recent.map((t) => <TaskRow key={t.id} task={t} />)
          )}
        </CardContent>
      </Card>
    </>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <AppShell breadcrumbs={[{ label: "Dashboard" }]}>
        <DashboardInner />
      </AppShell>
    </ProtectedRoute>
  );
}
