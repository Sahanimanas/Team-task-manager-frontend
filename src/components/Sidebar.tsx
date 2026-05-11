"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  ShieldCheck,
  LogOut,
  Sparkles,
  Users,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { useAuth } from "@/lib/auth";
import { useSidebar } from "@/lib/sidebar";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  adminOnly?: boolean;
};

const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/teams", label: "Teams", icon: Users },
  { href: "/admin", label: "Admin", icon: ShieldCheck, adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { collapsed } = useSidebar();

  if (collapsed) return null;

  return (
    <aside
      className={cn(
        "fixed bottom-0 left-0 top-[68px] z-30 hidden w-72 flex-col border-r lg:flex",
        "border-white/60 dark:border-white/[0.06]",
        "bg-gradient-to-b from-brand/25 via-brand/15 to-brand/20",
        "dark:from-slate-950/85 dark:via-slate-900/80 dark:to-slate-950/85",
        "backdrop-blur-2xl backdrop-saturate-150 shadow-card",
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-white/80 via-white/30 to-transparent dark:from-white/15 dark:via-white/5 dark:to-transparent"
      />
      <div className="relative flex items-center gap-3 border-b border-white/40 px-6 py-5 dark:border-white/[0.06]">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-brand-foreground shadow-soft ring-1 ring-inset ring-white/40 dark:ring-white/15">
          <Sparkles className="h-4 w-4" strokeWidth={2} />
        </div>
        <span className="font-display text-[17px] font-semibold tracking-[-0.015em] text-foreground">
          Team Tasks
        </span>
      </div>
      <nav className="relative flex-1 space-y-1.5 p-4">
        {NAV.filter((n) => !n.adminOnly || user?.role === "ADMIN").map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3.5 py-3 text-[15px] font-medium transition-all",
                active
                  ? "bg-white/85 text-brand shadow-soft ring-1 ring-inset ring-white/70 backdrop-blur-sm dark:bg-white/[0.08] dark:text-white dark:ring-white/10 dark:shadow-none"
                  : "text-foreground/70 hover:bg-white/45 hover:text-foreground dark:hover:bg-white/[0.04]",
              )}
            >
              <Icon
                className={cn(
                  "h-[18px] w-[18px]",
                  active ? "text-brand dark:text-brand" : "text-foreground/55",
                )}
                strokeWidth={active ? 2 : 1.75}
              />
              <span className="tracking-[-0.005em]">{item.label}</span>
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand" />}
            </Link>
          );
        })}
      </nav>
      {user && (
        <div className="relative border-t border-white/40 p-4 dark:border-white/[0.06]">
          <div className="flex items-center gap-3 rounded-lg p-2">
            <Avatar name={user.name} email={user.email} size={36} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-semibold text-foreground">{user.name}</div>
              <div className="truncate text-[12px] text-foreground/60">{user.email}</div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-md p-2 text-foreground/60 transition-colors hover:bg-white/50 hover:text-foreground dark:hover:bg-white/[0.06]"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
