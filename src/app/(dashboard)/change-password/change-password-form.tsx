"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { changePassword } from "./actions";

export function ChangePasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await changePassword(formData);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "Password changed successfully!" });
        // Reset the form
        const form = document.getElementById("change-password-form") as HTMLFormElement;
        form?.reset();
      }
    });
  }

  return (
    <form id="change-password-form" action={handleSubmit} className="space-y-5">
      {message && (
        <div
          className={`flex items-center gap-2 rounded-xl px-4 py-3 text-[13px] font-medium ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current Password</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          placeholder="Enter your current password"
          className="rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={6}
          placeholder="At least 6 characters"
          className="rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={6}
          placeholder="Re-enter new password"
          className="rounded-xl"
        />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-gray-900 hover:bg-gray-800"
      >
        {isPending ? "Changing..." : "Change Password"}
      </Button>
    </form>
  );
}
