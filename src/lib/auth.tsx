"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, tokens } from "./api";
import type { User } from "./types";

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshMe = useCallback(async () => {
    try {
      const { access } = tokens.read();
      if (!access) {
        setUser(null);
        return;
      }
      const data = await api<{ user: User }>("/api/users/me");
      setUser({
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: (data.user as any).globalRole ?? data.user.role,
      });
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshMe().finally(() => setLoading(false));
  }, [refreshMe]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api<{ user: User; accessToken: string; refreshToken: string }>(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
        auth: false,
      },
    );
    tokens.write(data.accessToken, data.refreshToken);
    setUser(data.user);
    router.push("/");
  }, [router]);

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      const data = await api<{ user: User; accessToken: string; refreshToken: string }>(
        "/api/auth/signup",
        {
          method: "POST",
          body: JSON.stringify({ name, email, password }),
          auth: false,
        },
      );
      tokens.write(data.accessToken, data.refreshToken);
      setUser(data.user);
      router.push("/");
    },
    [router],
  );

  const logout = useCallback(async () => {
    const { refresh } = tokens.read();
    if (refresh) {
      try {
        await api("/api/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken: refresh }),
          auth: false,
        });
      } catch {
        // ignore
      }
    }
    tokens.clear();
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
