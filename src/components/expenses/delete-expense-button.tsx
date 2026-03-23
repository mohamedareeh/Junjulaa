"use client";
import { DeleteButton } from "@/components/delete-button";
import { deleteExpense } from "@/app/(dashboard)/expenses/actions";

export function DeleteExpenseButton({ id }: { id: number }) {
  return <DeleteButton action={async () => { await deleteExpense(id); }} />;
}
