"use client";

import { useState, useTransition } from "react";
import { Shield, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { loginAction } from "@/lib/actions";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await loginAction(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      {/* Subtle radial gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black" />

      <div className="relative z-10 w-full max-w-md">
        {/* Badge-like golden border card */}
        <div className="rounded-xl border border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-transparent p-[1px]">
          <Card className="rounded-xl border-0 bg-slate-900/95 shadow-2xl shadow-amber-500/5">
            <CardHeader className="text-center pb-2">
              {/* Shield icon with golden accent */}
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-500/40 bg-slate-800">
                <Shield className="h-8 w-8 text-amber-500" />
              </div>

              {/* Stars decoration */}
              <div className="mx-auto mb-2 flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-500/60 text-amber-500/60" />
                <Star className="h-3 w-3 fill-amber-500/80 text-amber-500/80" />
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                <Star className="h-3 w-3 fill-amber-500/80 text-amber-500/80" />
                <Star className="h-3 w-3 fill-amber-500/60 text-amber-500/60" />
              </div>

              <CardTitle className="text-3xl font-extrabold tracking-tight text-white">
                Junjulaa
              </CardTitle>
              <CardDescription className="text-sm font-medium uppercase tracking-widest text-amber-500/80">
                Police Crime Series
              </CardDescription>
              <p className="mt-1 text-xs text-slate-400">
                Series Management System
              </p>
            </CardHeader>

            <CardContent className="pt-4">
              {/* Divider line */}
              <div className="mb-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  Authorized Access
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
              </div>

              <form action={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-300">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/50 focus:ring-amber-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-300">
                    Password
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    className="border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/50 focus:ring-amber-500/20"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-400">{error}</p>
                )}

                <Button
                  type="submit"
                  className="w-full bg-amber-600 font-semibold text-white hover:bg-amber-500 disabled:opacity-50"
                  disabled={isPending}
                >
                  {isPending ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Bottom badge text */}
        <p className="mt-4 text-center text-[10px] uppercase tracking-widest text-slate-600">
          Protect &amp; Serve &mdash; Production Division
        </p>
      </div>
    </div>
  );
}
