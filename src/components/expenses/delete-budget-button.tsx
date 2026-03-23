"use client";
import { DeleteButton } from "@/components/delete-button";
import { deleteBudget } from "@/app/(dashboard)/budget/actions";

export function DeleteBudgetButton({ id }: { id: number }) {
  return <DeleteButton action={async () => { await deleteBudget(id); }} />;
}
