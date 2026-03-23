"use client";
import { DeleteButton } from "@/components/delete-button";
import { deleteLocation } from "@/app/(dashboard)/locations/actions";

export function DeleteLocationButton({ id }: { id: number }) {
  return <DeleteButton action={async () => { await deleteLocation(id); }} />;
}
