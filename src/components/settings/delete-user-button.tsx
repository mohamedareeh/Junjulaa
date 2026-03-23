"use client";
import { DeleteButton } from "@/components/delete-button";
import { deleteUser } from "@/app/(dashboard)/settings/actions";

export function DeleteUserButton({ id }: { id: number }) {
  return <DeleteButton action={async () => { await deleteUser(id); }} />;
}
