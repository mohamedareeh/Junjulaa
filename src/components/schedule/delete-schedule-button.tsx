"use client";
import { DeleteButton } from "@/components/delete-button";
import { deleteSchedule } from "@/app/(dashboard)/schedule/actions";

export function DeleteScheduleButton({ id }: { id: number }) {
  return <DeleteButton action={async () => { await deleteSchedule(id); }} />;
}
