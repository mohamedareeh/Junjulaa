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
  schedule?: Schedule & { sceneId?: number | null };
  episodes: { id: number; number: number; title: string }[];
  locations: { id: number; name: string }[];
  scenes: { id: number; episodeId: number; sceneNumber: number; title: string | null }[];
  trigger: React.ReactNode;
}

export function ScheduleForm({
  schedule,
  episodes,
  locations,
  scenes,
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
  const [sceneId, setSceneId] = useState(
    schedule?.sceneId ? String(schedule.sceneId) : ""
  );

  const filteredScenes = episodeId
    ? scenes.filter((s) => s.episodeId === Number(episodeId))
    : [];

  async function handleSubmit(formData: FormData) {
    formData.set("episodeId", episodeId);
    formData.set("locationId", locationId);
    formData.set("sceneId", sceneId);
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
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {schedule ? "Edit Schedule" : "Schedule Scene"}
          </DialogTitle>
          <DialogDescription>
            {schedule
              ? "Update the schedule entry below."
              : "Assign a scene to a specific date and time slot."}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          {/* Episode Selection */}
          <div className="space-y-2">
            <Label htmlFor="episodeId">Episode</Label>
            <Select
              value={episodeId}
              onValueChange={(val) => { setEpisodeId(val ?? ""); setSceneId(""); }}
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

          {/* Scene Selection (shown when episode is picked) */}
          {episodeId && (
            <div className="space-y-2">
              <Label htmlFor="sceneId">Scene</Label>
              <Select
                value={sceneId}
                onValueChange={(val) => setSceneId(val ?? "")}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select scene" />
                </SelectTrigger>
                <SelectContent>
                  {filteredScenes.length === 0 ? (
                    <SelectItem value="__empty" disabled>
                      No scenes for this episode
                    </SelectItem>
                  ) : (
                    filteredScenes.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        Scene {s.sceneNumber}{s.title ? ` — ${s.title}` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              name="date"
              type="date"
              required
              defaultValue={schedule?.date ?? ""}
              className="w-full"
            />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="callTime">Start Time</Label>
              <Input
                id="callTime"
                name="callTime"
                type="time"
                required
                defaultValue={schedule?.callTime ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wrapTime">End Time</Label>
              <Input
                id="wrapTime"
                name="wrapTime"
                type="time"
                required
                defaultValue={schedule?.wrapTime ?? ""}
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="locationId">Location</Label>
            <Select
              value={locationId}
              onValueChange={(val) => setLocationId(val === "none" ? "" : val ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select location (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={String(loc.id)}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
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
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto rounded-xl bg-gray-900 hover:bg-gray-800">
              {isPending
                ? "Saving..."
                : schedule
                  ? "Update Schedule"
                  : "Schedule Scene"}
            </Button>
          </DialogFooter>
        </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
