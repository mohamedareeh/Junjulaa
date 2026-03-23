"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteCastMember } from "@/app/(dashboard)/cast/actions";

interface DeleteCastButtonProps {
  id: number;
  name: string;
}

export function DeleteCastButton({ id, name }: DeleteCastButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm(`Are you sure you want to delete ${name}?`)) {
      return;
    }
    startTransition(async () => {
      try {
        await deleteCastMember(id);
        router.push("/cast");
      } catch (error) {
        console.error("Failed to delete cast member:", error);
      }
    });
  }

  return (
    <Button
      variant="destructive"
      onClick={handleDelete}
      disabled={isPending}
    >
      {isPending ? "Deleting..." : "Delete"}
    </Button>
  );
}
