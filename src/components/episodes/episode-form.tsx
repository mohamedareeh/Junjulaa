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
import { createEpisode, updateEpisode } from "@/app/(dashboard)/episodes/actions";
import type { Episode } from "@/db/schema";

interface EpisodeFormProps {
  episode?: Episode;
  trigger: React.ReactNode;
}

export function EpisodeForm({ episode, trigger }: EpisodeFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(episode?.status ?? "pre_production");

  async function handleSubmit(formData: FormData) {
    formData.set("status", status);
    startTransition(async () => {
      try {
        if (episode) {
          await updateEpisode(episode.id, formData);
        } else {
          await createEpisode(formData);
        }
        setOpen(false);
      } catch (error) {
        console.error("Failed to save episode:", error);
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
            {episode ? "Edit Episode" : "Add Episode"}
          </DialogTitle>
          <DialogDescription>
            {episode
              ? "Update the episode details below."
              : "Fill in the details for the new episode."}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="number">Episode Number</Label>
              <Input
                id="number"
                name="number"
                type="number"
                required
                min={1}
                defaultValue={episode?.number ?? ""}
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(val) => { if (val) setStatus(val); }}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pre_production">Pre-Production</SelectItem>
                  <SelectItem value="filming">Filming</SelectItem>
                  <SelectItem value="post_production">Post-Production</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              required
              defaultValue={episode?.title ?? ""}
              placeholder="Episode title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="synopsis">Synopsis</Label>
            <Textarea
              id="synopsis"
              name="synopsis"
              defaultValue={episode?.synopsis ?? ""}
              placeholder="Brief episode synopsis..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="director">Director</Label>
            <Input
              id="director"
              name="director"
              defaultValue={episode?.director ?? ""}
              placeholder="Director name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                defaultValue={episode?.startDate ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                defaultValue={episode?.endDate ?? ""}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Saving..."
                : episode
                  ? "Update Episode"
                  : "Create Episode"}
            </Button>
          </DialogFooter>
        </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
