"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  ShieldCheck,
  Menu,
  Users,
  PanelLeftOpen,
  PanelLeftClose,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { NotificationsMenu } from "@/components/NotificationsMenu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useSidebar } from "@/lib/sidebar";
import { cn } from "@/lib/utils";

function MobileNav({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const items = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/projects", label: "Projects", icon: FolderKanban },
    { href: "/teams", label: "Teams", icon: Users },
    ...(user?.role === "ADMIN"
      ? [{ href: "/admin", label: "Admin", icon: ShieldCheck }]
      : []),
  ];
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 w-72 border-r border-white/60 bg-gradient-to-b from-brand/25 via-brand/15 to-brand/20 p-5 shadow-elevated backdrop-blur-2xl backdrop-saturate-150 animate-in dark:border-white/[0.06] dark:from-slate-950/85 dark:via-slate-900/80 dark:to-slate-950/85">
        <div className="mb-5 font-display text-[17px] font-semibold tracking-[-0.015em] text-foreground">Team Tasks</div>
        <nav className="space-y-1.5">
          {items.map((it) => {
            const Icon = it.icon;
            const active = it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3.5 py-3 text-[15px] font-medium transition-colors",
                  active
                    ? "bg-white/85 text-brand shadow-soft ring-1 ring-inset ring-white/70 dark:bg-white/[0.08] dark:text-white dark:ring-white/10 dark:shadow-none"
                    : "text-foreground/70 hover:bg-white/45 hover:text-foreground dark:hover:bg-white/[0.04]",
                )}
              >
                <Icon className={cn("h-[18px] w-[18px]", active ? "text-brand dark:text-brand" : "text-foreground/55")} /> {it.label}
              </Link>
            );
          })}
        </nav>
        {user && (
          <button
            onClick={() => { onClose(); logout(); }}
            className="mt-5 w-full rounded-lg px-3.5 py-2.5 text-left text-[14px] font-medium text-foreground/70 hover:bg-white/45 hover:text-foreground dark:hover:bg-white/[0.06]"
          >
            Log out
          </button>
        )}
      </div>
    </div>
  );
}

export function AppShell({
  children,
  title,
  description,
  actions,
  breadcrumbs,
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}) {
  const { user } = useAuth();
  const { collapsed, setCollapsed } = useSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [user?.id]);

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[480px] bg-gradient-to-b from-brand/10 via-brand/[0.03] to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -top-32 left-1/2 -z-10 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-brand/10 blur-3xl"
      />
      <header
        className={cn(
          "sticky top-3 z-40 mx-3 mt-3 flex h-14 items-center gap-3 rounded-2xl border px-4 sm:px-6",
          "border-white/60 dark:border-white/[0.06]",
          "bg-gradient-to-r from-brand/20 via-brand/10 to-brand/15",
          "dark:from-slate-950/80 dark:via-slate-900/75 dark:to-slate-950/80",
          "backdrop-blur-2xl backdrop-saturate-150 shadow-card",
        )}
      >
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:inline-flex"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Show sidebar" : "Hide sidebar"}
            title={collapsed ? "Show sidebar" : "Hide sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <PanelLeftClose className="h-4 w-4" strokeWidth={1.75} />
            )}
          </Button>
          <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
            {breadcrumbs?.map((b, i) => (
              <span key={i} className="flex items-center gap-2 min-w-0">
                {i > 0 && <span className="text-muted-foreground/40">/</span>}
                {b.href ? (
                  <Link href={b.href} className="truncate text-muted-foreground hover:text-foreground">
                    {b.label}
                  </Link>
                ) : (
                  <span className="truncate font-medium">{b.label}</span>
                )}
              </span>
            ))}
          </div>
          <NotificationsMenu />
          <ThemeToggle />
          {user && <Avatar name={user.name} email={user.email} size={28} />}
        </header>

      <Sidebar />
      {mobileOpen && <MobileNav onClose={() => setMobileOpen(false)} />}

      <div className={cn("relative transition-[padding] duration-200", !collapsed && "lg:pl-72")}>
        <main className="w-full px-4 py-8 sm:px-6 lg:px-10">
          {(title || description || actions) && (
            <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
              <div>
                {title && (
                  <h1 className="font-display text-4xl font-bold tracking-[-0.035em] text-foreground sm:text-5xl">
                    {title}
                  </h1>
                )}
                {description && (
                  <p className="mt-2.5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                )}
              </div>
              {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
