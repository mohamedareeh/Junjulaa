"use client";

import { useTransition, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import {
  createExpense,
  updateExpense,
  addCategory,
} from "@/app/(dashboard)/expenses/actions";
import type { Expense } from "@/db/schema";

const paymentStatusLabels: Record<string, string> = {
  paid: "Paid",
  pending: "Pending",
  overdue: "Overdue",
};

interface ExpenseFormProps {
  expense?: Expense;
  episodes: { id: number; number: number; title: string }[];
  categories: { id: number; name: string }[];
  trigger: React.ReactNode;
}

export function ExpenseForm({ expense, episodes, categories: initialCategories, trigger }: ExpenseFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [category, setCategory] = useState(expense?.category ?? "");
  const [paymentStatus, setPaymentStatus] = useState(
    expense?.paymentStatus ?? "pending"
  );
  const [episodeId, setEpisodeId] = useState(
    expense?.episodeId ? String(expense.episodeId) : ""
  );
  const [paymentType, setPaymentType] = useState(
    expense?.paymentType ?? "one_time"
  );
  const [categories, setCategories] = useState(initialCategories);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  async function handleAddCategory() {
    if (!newCategoryName.trim()) return;
    startTransition(async () => {
      try {
        const result = await addCategory(newCategoryName.trim());
        if (result) {
          setCategories((prev) => [...prev, result]);
          setCategory(result.name);
          setNewCategoryName("");
          setShowNewCategory(false);
        }
      } catch (error) {
        console.error("Failed to add category:", error);
      }
    });
  }

  async function handleSubmit(formData: FormData) {
    formData.set("category", category);
    formData.set("paymentStatus", paymentStatus);
    formData.set("episodeId", episodeId);
    formData.set("paymentType", paymentType);
    startTransition(async () => {
      try {
        if (expense) {
          await updateExpense(expense.id, formData);
        } else {
          await createExpense(formData);
        }
        setOpen(false);
      } catch (error) {
        console.error("Failed to save expense:", error);
      }
    });
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {expense ? "Edit Expense" : "Add Expense"}
          </DialogTitle>
          <DialogDescription>
            {expense
              ? "Update the expense details below."
              : "Fill in the details for the new expense."}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="episodeId">Episode</Label>
              <Select
                value={episodeId}
                onValueChange={(val) => setEpisodeId(val === "general" ? "" : val ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select episode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General (No Episode)</SelectItem>
                  {episodes.map((ep) => (
                    <SelectItem key={ep.id} value={String(ep.id)}>
                      Ep {ep.number} - {ep.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              {showNewCategory ? (
                <div className="flex gap-1">
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="New category..."
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCategory();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddCategory}
                    disabled={isPending}
                  >
                    Add
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowNewCategory(false)}
                  >
                    ×
                  </Button>
                </div>
              ) : (
                <div className="flex gap-1">
                  <Select
                    value={category}
                    onValueChange={(val) => {
                      if (val) setCategory(val);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => setShowNewCategory(true)}
                    title="Add new category"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              required
              defaultValue={expense?.description ?? ""}
              placeholder="Expense description..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={expense?.amount ?? ""}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date (optional)</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={expense?.date ?? ""}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentType">Payment Type</Label>
              <Select
                value={paymentType}
                onValueChange={(val) => {
                  if (val) setPaymentType(val);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_time">One-Time</SelectItem>
                  <SelectItem value="per_episode">Per Episode</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentStatus">Payment Status</Label>
            <Select
              value={paymentStatus}
              onValueChange={(val) => {
                if (val) setPaymentStatus(val);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(paymentStatusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Saving..."
                : expense
                  ? "Update Expense"
                  : "Create Expense"}
            </Button>
          </DialogFooter>
        </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
