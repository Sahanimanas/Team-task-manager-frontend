"use client";

import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "ttm.sidebar.collapsed";

type SidebarState = {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (c: boolean) => void;
};

const SidebarCtx = createContext<SidebarState>({
  collapsed: false,
  toggle: () => {},
  setCollapsed: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsedState] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "1") setCollapsedState(true);
    } catch {}
  }, []);

  const setCollapsed = (c: boolean) => {
    setCollapsedState(c);
    try {
      localStorage.setItem(STORAGE_KEY, c ? "1" : "0");
    } catch {}
  };

  const toggle = () => setCollapsed(!collapsed);

  return (
    <SidebarCtx.Provider value={{ collapsed, toggle, setCollapsed }}>
      {children}
    </SidebarCtx.Provider>
  );
}

export const useSidebar = () => useContext(SidebarCtx);
