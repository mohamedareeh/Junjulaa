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
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import {
  createScene,
  updateScene,
} from "@/app/(dashboard)/episodes/[id]/scene-actions";

interface SceneFormProps {
  episodeId: number;
  scene?: {
    id: number;
    sceneNumber: number;
    title: string | null;
    description: string | null;
    locationId: number | null;
    castMemberIds: number[];
    props: string | null;
    timeOfDay: string | null;
    duration: string | null;
    continuitySceneId: number | null;
  };
  locations: { id: number; name: string }[];
  castMembers: { id: number; name: string }[];
  allScenes?: { id: number; sceneNumber: number; title: string | null }[];
  trigger: React.ReactNode;
}

export function SceneForm({
  episodeId,
  scene,
  locations,
  castMembers,
  allScenes,
  trigger,
}: SceneFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [locationId, setLocationId] = useState(
    scene?.locationId ? String(scene.locationId) : ""
  );
  const [selectedCast, setSelectedCast] = useState<number[]>(
    scene?.castMemberIds ?? []
  );
  const [timeOfDay, setTimeOfDay] = useState(scene?.timeOfDay ?? "");
  const [continuitySceneId, setContinuitySceneId] = useState(
    scene?.continuitySceneId ? String(scene.continuitySceneId) : ""
  );

  function toggleCast(id: number) {
    setSelectedCast((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  async function handleSubmit(formData: FormData) {
    formData.set("episodeId", String(episodeId));
    if (locationId) formData.set("locationId", locationId);
    if (timeOfDay) formData.set("timeOfDay", timeOfDay);
    if (continuitySceneId) formData.set("continuitySceneId", continuitySceneId);
    selectedCast.forEach((id) => formData.append("castMemberIds", String(id)));

    startTransition(async () => {
      try {
        if (scene) {
          await updateScene(scene.id, formData);
        } else {
          await createScene(formData);
        }
        setOpen(false);
      } catch (error) {
        console.error("Failed to save scene:", error);
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
              {scene ? "Edit Scene" : "Add Scene"}
            </DialogTitle>
            <DialogDescription>
              {scene
                ? "Update the scene details and cast assignments."
                : "Add a new scene with cast assignments."}
            </DialogDescription>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sceneNumber">Scene Number</Label>
                <Input
                  id="sceneNumber"
                  name="sceneNumber"
                  type="number"
                  required
                  min={1}
                  defaultValue={scene?.sceneNumber ?? ""}
                  placeholder="1"
                />
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
              <Label htmlFor="title">Scene Title</Label>
              <Input
                id="title"
                name="title"
                defaultValue={scene?.title ?? ""}
                placeholder="Scene title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={scene?.description ?? ""}
                placeholder="What happens in this scene..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeOfDay">Time of Day</Label>
                <Select
                  value={timeOfDay}
                  onValueChange={(val) => setTimeOfDay(val ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select time of day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                    <SelectItem value="night">Night</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  name="duration"
                  defaultValue={scene?.duration ?? ""}
                  placeholder="e.g., 2h 30m"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="props">Props</Label>
              <Textarea
                id="props"
                name="props"
                defaultValue={scene?.props ?? ""}
                placeholder="List of props needed for this scene..."
                rows={2}
              />
            </div>

            {allScenes && allScenes.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="continuitySceneId">Continuity</Label>
                <Select
                  value={continuitySceneId}
                  onValueChange={(val) =>
                    setContinuitySceneId(val === "none" ? "" : val ?? "")
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Continues from scene..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {allScenes
                      .filter((s) => !scene || s.id !== scene.id)
                      .map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          Scene {s.sceneNumber}
                          {s.title ? ` — ${s.title}` : ""}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Cast in this Scene</Label>
              <div className="flex flex-wrap gap-2 rounded-md border p-3 min-h-[44px]">
                {castMembers.map((cm) => {
                  const isSelected = selectedCast.includes(cm.id);
                  return (
                    <Badge
                      key={cm.id}
                      variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer select-none ${
                        isSelected
                          ? "bg-slate-900 text-white hover:bg-slate-800"
                          : "hover:bg-slate-100"
                      }`}
                      onClick={() => toggleCast(cm.id)}
                    >
                      {cm.name}
                      {isSelected && <X className="ml-1 h-3 w-3" />}
                    </Badge>
                  );
                })}
                {castMembers.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No cast members added to this episode yet.
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Saving..."
                  : scene
                    ? "Update Scene"
                    : "Create Scene"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
