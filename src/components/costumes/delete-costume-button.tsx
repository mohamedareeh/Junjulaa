"use client";

import { DeleteButton } from "@/components/delete-button";
import { deleteCostume } from "@/app/(dashboard)/costumes/actions";

export function DeleteCostumeButton({ id }: { id: number }) {
  return (
    <DeleteButton
      action={async () => {
        await deleteCostume(id);
      }}
    />
  );
}
