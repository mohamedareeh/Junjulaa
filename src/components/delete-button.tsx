"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface DeleteButtonProps {
  action: () => Promise<void>;
  label?: string;
  size?: "default" | "sm" | "icon";
}

export function DeleteButton({ action, label, size = "icon" }: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Are you sure you want to delete this? This cannot be undone.")) return;
    startTransition(async () => {
      await action();
    });
  }

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleDelete}
      disabled={isPending}
      className="text-red-500 hover:text-red-700 hover:bg-red-50"
    >
      <Trash2 className="h-4 w-4" />
      {label && <span className="ml-1">{label}</span>}
    </Button>
  );
}
