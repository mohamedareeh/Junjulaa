"use client";
import { DeleteButton } from "@/components/delete-button";
import { deleteScene } from "@/app/(dashboard)/episodes/[id]/scene-actions";

export function DeleteSceneButton({ sceneId, episodeId }: { sceneId: number; episodeId: number }) {
  return <DeleteButton action={async () => { await deleteScene(sceneId, episodeId); }} />;
}
