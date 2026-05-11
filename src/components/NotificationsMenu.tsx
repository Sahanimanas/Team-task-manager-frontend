"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Notification } from "@/lib/types";
import { cn } from "@/lib/utils";

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

const TYPE_LABEL: Record<string, string> = {
  TASK_ASSIGNED: "Task assigned",
  TASK_STATUS_CHANGED: "Status changed",
  TASK_DUE_SOON: "Due soon",
  PROJECT_INVITED: "Added to project",
  TASK_COMMENT: "New comment",
};

export function NotificationsMenu() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);

  async function load() {
    if (!user) return;
    try {
      const data = await api<{ notifications: Notification[]; unreadCount: number }>("/api/notifications");
      setItems(data.notifications);
      setUnread(data.unreadCount);
    } catch {}
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function markAll() {
    await api("/api/notifications/read-all", { method: "POST" });
    load();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand ring-2 ring-background" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <div className="text-sm font-semibold">Notifications</div>
            <div className="text-xs text-muted-foreground">
              {unread > 0 ? `${unread} unread` : "All caught up"}
            </div>
          </div>
          {unread > 0 && (
            <button
              onClick={markAll}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
          )}
        </div>
        <div className="h-px bg-border" />
        <div className="max-h-[420px] overflow-y-auto scrollbar-thin">
          {items.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              No notifications yet.
            </div>
          )}
          {items.map((n) => (
            <div
              key={n.id}
              className={cn(
                "relative flex flex-col gap-1 px-4 py-3 text-sm transition-colors hover:bg-accent",
                !n.read && "bg-accent/40",
              )}
            >
              <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-muted-foreground">
                <span>{TYPE_LABEL[n.type] ?? n.type}</span>
                <span>{timeAgo(n.createdAt)} ago</span>
              </div>
              <div className="text-sm">{n.message}</div>
              {!n.read && (
                <span className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-brand" />
              )}
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
