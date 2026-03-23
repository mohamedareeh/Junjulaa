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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createCrewMember,
  updateCrewMember,
} from "@/app/(dashboard)/crew/actions";
import type { CrewMember } from "@/db/schema";

interface CrewFormProps {
  crewMember?: CrewMember;
  trigger: React.ReactNode;
}

export function CrewForm({ crewMember, trigger }: CrewFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [paymentType, setPaymentType] = useState(
    crewMember?.paymentType ?? "one_time"
  );

  async function handleSubmit(formData: FormData) {
    formData.set("paymentType", paymentType);
    startTransition(async () => {
      try {
        if (crewMember) {
          await updateCrewMember(crewMember.id, formData);
        } else {
          await createCrewMember(formData);
        }
        setOpen(false);
      } catch (error) {
        console.error("Failed to save crew member:", error);
      }
    });
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {crewMember ? "Edit Crew Member" : "Add Crew Member"}
          </DialogTitle>
          <DialogDescription>
            {crewMember
              ? "Update the crew member details below."
              : "Fill in the details for the new crew member."}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={crewMember?.name ?? ""}
              placeholder="Full name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={crewMember?.email ?? ""}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={crewMember?.phone ?? ""}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                name="department"
                required
                defaultValue={crewMember?.department ?? ""}
                placeholder="e.g. Camera, Sound, Art"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roleTitle">Role Title</Label>
              <Input
                id="roleTitle"
                name="roleTitle"
                required
                defaultValue={crewMember?.roleTitle ?? ""}
                placeholder="e.g. Director of Photography"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dayRate">Day Rate ($)</Label>
              <Input
                id="dayRate"
                name="dayRate"
                type="number"
                step="0.01"
                min="0"
                defaultValue={crewMember?.dayRate ?? ""}
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
                : crewMember
                  ? "Update Crew Member"
                  : "Add Crew Member"}
            </Button>
          </DialogFooter>
        </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
