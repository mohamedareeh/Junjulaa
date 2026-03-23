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
  createLocation,
  updateLocation,
} from "@/app/(dashboard)/locations/actions";
import type { Location } from "@/db/schema";

interface LocationFormProps {
  location?: Location;
  trigger: React.ReactNode;
}

export function LocationForm({ location, trigger }: LocationFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        if (location) {
          await updateLocation(location.id, formData);
        } else {
          await createLocation(formData);
        }
        setOpen(false);
      } catch (error) {
        console.error("Failed to save location:", error);
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
            {location ? "Edit Location" : "Add Location"}
          </DialogTitle>
          <DialogDescription>
            {location
              ? "Update the location details below."
              : "Fill in the details for the new location."}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={location?.name ?? ""}
              placeholder="Location name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              defaultValue={location?.address ?? ""}
              placeholder="Full address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="permitInfo">Permit Information</Label>
            <Textarea
              id="permitInfo"
              name="permitInfo"
              defaultValue={location?.permitInfo ?? ""}
              placeholder="Permit details, requirements..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="costPerDay">Cost Per Day ($)</Label>
            <Input
              id="costPerDay"
              name="costPerDay"
              type="number"
              step="0.01"
              min="0"
              defaultValue={location?.costPerDay ?? ""}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={location?.notes ?? ""}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Saving..."
                : location
                  ? "Update Location"
                  : "Create Location"}
            </Button>
          </DialogFooter>
        </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
