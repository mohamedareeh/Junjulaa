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
  createSchedule,
  updateSchedule,
} from "@/app/(dashboard)/schedule/actions";
import type { Schedule } from "@/db/schema";

interface ScheduleFormProps {
  schedule?: Schedule;
  episodes: { id: number; number: number; title: string }[];
  locations: { id: number; name: string }[];
  trigger: React.ReactNode;
}

export function ScheduleForm({
  schedule,
  episodes,
  locations,
  trigger,
}: ScheduleFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [episodeId, setEpisodeId] = useState(
    schedule?.episodeId ? String(schedule.episodeId) : ""
  );
  const [locationId, setLocationId] = useState(
    schedule?.locationId ? String(schedule.locationId) : ""
  );

  async function handleSubmit(formData: FormData) {
    formData.set("episodeId", episodeId);
    formData.set("locationId", locationId);
    startTransition(async () => {
      try {
        if (schedule) {
          await updateSchedule(schedule.id, formData);
        } else {
          await createSchedule(formData);
        }
        setOpen(false);
      } catch (error) {
        console.error("Failed to save schedule:", error);
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
            {schedule ? "Edit Schedule" : "Add Schedule"}
          </DialogTitle>
          <DialogDescription>
            {schedule
              ? "Update the schedule entry below."
              : "Fill in the details for the new schedule entry."}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="episodeId">Episode</Label>
              <Select
                value={episodeId}
                onValueChange={(val) => setEpisodeId(val ?? "")}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select episode" />
                </SelectTrigger>
                <SelectContent>
                  {episodes.map((ep) => (
                    <SelectItem key={ep.id} value={String(ep.id)}>
                      Ep {ep.number} - {ep.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationId">Location</Label>
              <Select
                value={locationId}
                onValueChange={(val) => setLocationId(val ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={String(loc.id)}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              name="date"
              type="date"
              required
              defaultValue={schedule?.date ?? ""}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="callTime">Call Time</Label>
              <Input
                id="callTime"
                name="callTime"
                type="time"
                defaultValue={schedule?.callTime ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wrapTime">Wrap Time</Label>
              <Input
                id="wrapTime"
                name="wrapTime"
                type="time"
                defaultValue={schedule?.wrapTime ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={schedule?.notes ?? ""}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Saving..."
                : schedule
                  ? "Update Schedule"
                  : "Create Schedule"}
            </Button>
          </DialogFooter>
        </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
