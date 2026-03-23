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
import { addCastToEpisode, addCrewToEpisode } from "./episode-actions";

interface AddCastFormProps {
  episodeId: number;
  castMembers: { id: number; name: string }[];
  trigger: React.ReactNode;
}

export function AddCastForm({ episodeId, castMembers, trigger }: AddCastFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [castMemberId, setCastMemberId] = useState("");

  async function handleSubmit(formData: FormData) {
    formData.set("episodeId", String(episodeId));
    formData.set("castMemberId", castMemberId);
    startTransition(async () => {
      try {
        await addCastToEpisode(formData);
        setOpen(false);
        setCastMemberId("");
      } catch (error) {
        console.error("Failed to add cast:", error);
      }
    });
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Cast to Episode</DialogTitle>
            <DialogDescription>
              Select a cast member and their role in this episode.
            </DialogDescription>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Cast Member</Label>
              <Select value={castMemberId} onValueChange={(val) => setCastMemberId(val ?? "")} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select cast member" />
                </SelectTrigger>
                <SelectContent>
                  {castMembers.map((cm) => (
                    <SelectItem key={cm.id} value={String(cm.id)}>
                      {cm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="roleName">Role Name</Label>
              <Input
                id="roleName"
                name="roleName"
                required
                placeholder="e.g. Lead Detective, Suspect"
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isPending} className="w-full sm:w-auto rounded-xl bg-gray-900 hover:bg-gray-800">
                {isPending ? "Adding..." : "Add Cast"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface AddCrewFormProps {
  episodeId: number;
  crewMembers: { id: number; name: string; department: string }[];
  trigger: React.ReactNode;
}

export function AddCrewForm({ episodeId, crewMembers, trigger }: AddCrewFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [crewMemberId, setCrewMemberId] = useState("");

  async function handleSubmit(formData: FormData) {
    formData.set("episodeId", String(episodeId));
    formData.set("crewMemberId", crewMemberId);
    startTransition(async () => {
      try {
        await addCrewToEpisode(formData);
        setOpen(false);
        setCrewMemberId("");
      } catch (error) {
        console.error("Failed to add crew:", error);
      }
    });
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Crew to Episode</DialogTitle>
            <DialogDescription>
              Select a crew member to assign to this episode.
            </DialogDescription>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Crew Member</Label>
              <Select value={crewMemberId} onValueChange={(val) => setCrewMemberId(val ?? "")} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select crew member" />
                </SelectTrigger>
                <SelectContent>
                  {crewMembers.map((cm) => (
                    <SelectItem key={cm.id} value={String(cm.id)}>
                      {cm.name} — {cm.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Optional notes..."
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isPending} className="w-full sm:w-auto rounded-xl bg-gray-900 hover:bg-gray-800">
                {isPending ? "Adding..." : "Add Crew"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
