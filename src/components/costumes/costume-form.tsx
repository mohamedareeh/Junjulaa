"use client";

import { useTransition, useState, useMemo } from "react";
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
  createCostume,
  updateCostume,
} from "@/app/(dashboard)/costumes/actions";

interface CostumeFormProps {
  episodes: { id: number; number: number; title: string }[];
  castMembers: { id: number; name: string }[];
  scenes: { id: number; episodeId: number; sceneNumber: number }[];
  costume?: {
    id: number;
    name: string;
    description: string | null;
    photoUrl: string | null;
    castMemberId: number | null;
    episodeId: number | null;
    notes: string | null;
    sceneIds: number[];
  };
  trigger: React.ReactNode;
}

export function CostumeForm({
  episodes,
  castMembers,
  scenes,
  costume,
  trigger,
}: CostumeFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [castMemberId, setCastMemberId] = useState(
    costume?.castMemberId ? String(costume.castMemberId) : ""
  );
  const [episodeId, setEpisodeId] = useState(
    costume?.episodeId ? String(costume.episodeId) : ""
  );
  const [selectedScenes, setSelectedScenes] = useState<number[]>(
    costume?.sceneIds ?? []
  );

  const filteredScenes = useMemo(() => {
    if (!episodeId) return [];
    return scenes.filter((s) => s.episodeId === Number(episodeId));
  }, [episodeId, scenes]);

  function handleEpisodeChange(val: string | null) {
    const newVal = !val || val === "none" ? "" : val;
    setEpisodeId(newVal);
    // Clear selected scenes when episode changes
    setSelectedScenes([]);
  }

  function toggleScene(id: number) {
    setSelectedScenes((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  async function handleSubmit(formData: FormData) {
    if (castMemberId) formData.set("castMemberId", castMemberId);
    if (episodeId) formData.set("episodeId", episodeId);
    selectedScenes.forEach((id) => formData.append("sceneIds", String(id)));

    startTransition(async () => {
      try {
        if (costume) {
          await updateCostume(costume.id, formData);
        } else {
          await createCostume(formData);
        }
        setOpen(false);
      } catch (error) {
        console.error("Failed to save costume:", error);
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
              {costume ? "Edit Costume" : "Add Costume"}
            </DialogTitle>
            <DialogDescription>
              {costume
                ? "Update the costume details below."
                : "Fill in the details for the new costume."}
            </DialogDescription>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={costume?.name ?? ""}
                placeholder="Costume name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={costume?.description ?? ""}
                placeholder="Describe the costume..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="photoUrl">Photo URL</Label>
              <Input
                id="photoUrl"
                name="photoUrl"
                defaultValue={costume?.photoUrl ?? ""}
                placeholder="https://... paste image URL"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="castMemberId">Cast Member</Label>
                <Select
                  value={castMemberId}
                  onValueChange={(val) =>
                    setCastMemberId(val === "none" ? "" : val ?? "")
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select cast member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {castMembers.map((cm) => (
                      <SelectItem key={cm.id} value={String(cm.id)}>
                        {cm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="episodeId">Episode</Label>
                <Select
                  value={episodeId}
                  onValueChange={handleEpisodeChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select episode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {episodes.map((ep) => (
                      <SelectItem key={ep.id} value={String(ep.id)}>
                        Ep {ep.number} — {ep.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {episodeId && (
              <div className="space-y-2">
                <Label>Scenes</Label>
                <div className="flex flex-wrap gap-2 rounded-md border p-3 min-h-[44px]">
                  {filteredScenes.map((scene) => {
                    const isSelected = selectedScenes.includes(scene.id);
                    return (
                      <Badge
                        key={scene.id}
                        variant={isSelected ? "default" : "outline"}
                        className={`cursor-pointer select-none ${
                          isSelected
                            ? "bg-slate-900 text-white hover:bg-slate-800"
                            : "hover:bg-slate-100"
                        }`}
                        onClick={() => toggleScene(scene.id)}
                      >
                        Scene {scene.sceneNumber}
                        {isSelected && <X className="ml-1 h-3 w-3" />}
                      </Badge>
                    );
                  })}
                  {filteredScenes.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No scenes found for this episode.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={costume?.notes ?? ""}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Saving..."
                  : costume
                    ? "Update Costume"
                    : "Create Costume"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
