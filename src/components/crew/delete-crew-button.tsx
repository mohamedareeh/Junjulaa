"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteCrewMember } from "@/app/(dashboard)/crew/actions";

interface DeleteCrewButtonProps {
  id: number;
  name: string;
}

export function DeleteCrewButton({ id, name }: DeleteCrewButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm(`Are you sure you want to delete ${name}?`)) {
      return;
    }
    startTransition(async () => {
      try {
        await deleteCrewMember(id);
        router.push("/crew");
      } catch (error) {
        console.error("Failed to delete crew member:", error);
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
