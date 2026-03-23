"use client";
import { DeleteButton } from "@/components/delete-button";
import { deleteEpisode } from "@/app/(dashboard)/episodes/actions";

export function DeleteEpisodeButton({ id }: { id: number }) {
  return <DeleteButton action={async () => { await deleteEpisode(id); }} />;
}
