"use client";

import { useState, useTransition } from "react";
import { Shield } from "lucide-react";
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo and title */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-900 shadow-lg">
            <Shield className="h-8 w-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Junjulaa
          </h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">
            Police Crime Series
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Sign in to manage your production
          </p>
        </div>

        {/* Login card */}
        <div className="card-shadow-lg rounded-2xl bg-white p-6">
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-[13px] font-medium text-gray-700">
                Username
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Enter your username"
                required
                autoComplete="username"
                className="h-11 rounded-xl border-gray-200 bg-gray-50 text-sm placeholder:text-gray-400 focus:border-gray-400 focus:ring-gray-400/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[13px] font-medium text-gray-700">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="h-11 rounded-xl border-gray-200 bg-gray-50 text-sm placeholder:text-gray-400 focus:border-gray-400 focus:ring-gray-400/20"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="h-11 w-full rounded-xl bg-gray-900 text-[13px] font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
              disabled={isPending}
            >
              {isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-[11px] text-gray-400">
          Authorized access only &mdash; Production Division
        </p>
      </div>
    </div>
  );
}
