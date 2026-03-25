"use client";

import { useTransition, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createCastMember,
  updateCastMember,
} from "@/app/(dashboard)/cast/actions";
import type { CastMember } from "@/db/schema";

interface CastFormProps {
  castMember?: CastMember & { username?: string | null };
  trigger: React.ReactNode;
}

export function CastForm({ castMember, trigger }: CastFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [paymentType, setPaymentType] = useState(
    castMember?.paymentType ?? "one_time"
  );

  async function handleSubmit(formData: FormData) {
    formData.set("paymentType", paymentType);
    startTransition(async () => {
      try {
        if (castMember) {
          await updateCastMember(castMember.id, formData);
        } else {
          await createCastMember(formData);
        }
        setOpen(false);
      } catch (error) {
        console.error("Failed to save cast member:", error);
      }
    });
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {castMember ? "Edit Cast Member" : "Add Cast Member"}
          </DialogTitle>
          <DialogDescription>
            {castMember
              ? "Update the cast member details below."
              : "Fill in the details for the new cast member. You can add the real name later."}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="characterName">Character Name</Label>
              <Input
                id="characterName"
                name="characterName"
                defaultValue={castMember?.characterName ?? ""}
                placeholder="e.g. Detective Karim"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Real Name</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={castMember?.name ?? ""}
                placeholder="Full name (can add later)"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={castMember?.email ?? ""}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={castMember?.phone ?? ""}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          {/* Username field — only show when editing and user account exists */}
          {castMember?.username && (
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                defaultValue={castMember.username}
                placeholder="username"
              />
              <p className="text-[11px] text-gray-400">
                This is the login username for this cast member
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              defaultValue={castMember?.bio ?? ""}
              placeholder="Brief biography..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dayRate">Day Rate (MVR)</Label>
              <Input
                id="dayRate"
                name="dayRate"
                type="number"
                step="0.01"
                min="0"
                defaultValue={castMember?.dayRate ?? ""}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentType">Payment Type</Label>
              <Select
                value={paymentType}
                onValueChange={(v) => {
                  if (v) setPaymentType(v);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_time">One-Time</SelectItem>
                  <SelectItem value="per_episode">Per Episode</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Saving..."
                : castMember
                  ? "Update Cast Member"
                  : "Add Cast Member"}
            </Button>
          </DialogFooter>
        </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
