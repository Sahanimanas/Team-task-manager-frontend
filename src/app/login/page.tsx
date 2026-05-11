"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/AuthLayout";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@demo.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message ?? "Failed to log in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to manage your team's work.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && (
          <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
        <Button type="submit" variant="brand" className="w-full" disabled={busy}>
          {busy ? "Logging in…" : (<>Log in <ArrowRight className="h-4 w-4" /></>)}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          New here? <Link href="/signup" className="font-medium text-foreground hover:underline">Create an account</Link>
        </p>
        <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          <div className="mb-1 font-medium text-foreground">Demo account</div>
          <code className="font-mono">admin@demo.com</code> · <code className="font-mono">password123</code>
        </div>
      </form>
    </AuthLayout>
  );
}
