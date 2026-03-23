"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { removeCastFromEpisode, removeCrewFromEpisode } from "./episode-actions";

export function RemoveCastButton({ id, episodeId }: { id: number; episodeId: number }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-gray-400 hover:text-red-500"
      disabled={isPending}
      onClick={() => startTransition(() => removeCastFromEpisode(id, episodeId))}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}

export function RemoveCrewButton({ id, episodeId }: { id: number; episodeId: number }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-gray-400 hover:text-red-500"
      disabled={isPending}
      onClick={() => startTransition(() => removeCrewFromEpisode(id, episodeId))}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
