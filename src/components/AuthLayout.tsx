"use client";

import Link from "next/link";
import { CheckCircle2, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      <div className="relative hidden overflow-hidden border-r border-border bg-gradient-to-br from-foreground via-foreground to-foreground/90 lg:flex lg:flex-col lg:justify-between lg:p-10 dark:from-zinc-900 dark:via-zinc-950 dark:to-black">
        <div className="absolute inset-0 grid-pattern opacity-[0.06]" />
        <div className="absolute -right-32 -top-32 h-72 w-72 rounded-full bg-brand/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-12 h-72 w-72 rounded-full bg-info/20 blur-3xl" />
        <Link href="/" className="relative flex items-center gap-2 text-background">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-background/10 ring-1 ring-background/20">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Team Tasks</span>
        </Link>
        <div className="relative space-y-6 text-background">
          <p className="text-2xl font-medium leading-snug">
            Plan projects, assign work, and ship without the chaos.
          </p>
          <ul className="space-y-3 text-sm text-background/80">
            {[
              "Role-based projects and team membership",
              "Kanban tasks with priority, due dates, and ownership",
              "Live in-app notifications when work moves",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-brand" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative text-xs text-background/50">
          © {new Date().getFullYear()} Team Tasks
        </div>
      </div>
      <div className="flex min-h-screen flex-col">
        <div className="flex h-14 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight lg:hidden">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-background">
              <Sparkles className="h-3 w-3" />
            </div>
            Team Tasks
          </Link>
          <span className="ml-auto"><ThemeToggle /></span>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm space-y-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
