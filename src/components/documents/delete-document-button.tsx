"use client";
import { DeleteButton } from "@/components/delete-button";
import { deleteDocument } from "@/app/(dashboard)/documents/actions";

export function DeleteDocumentButton({ id }: { id: number }) {
  return <DeleteButton action={async () => { await deleteDocument(id); }} />;
}
