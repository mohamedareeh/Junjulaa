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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setBudget } from "@/app/(dashboard)/budget/actions";

const categoryLabels: Record<string, string> = {
  equipment: "Equipment",
  location: "Location",
  catering: "Catering",
  transport: "Transport",
  costumes: "Costumes",
  props: "Props",
  post_production: "Post-Production",
  talent: "Talent",
  other: "Other",
};

interface BudgetFormProps {
  episodes: { id: number; number: number; title: string }[];
  trigger: React.ReactNode;
}

export function BudgetForm({ episodes, trigger }: BudgetFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [category, setCategory] = useState("equipment");
  const [episodeId, setEpisodeId] = useState("");

  async function handleSubmit(formData: FormData) {
    formData.set("category", category);
    formData.set("episodeId", episodeId);
    startTransition(async () => {
      try {
        await setBudget(formData);
        setOpen(false);
      } catch (error) {
        console.error("Failed to set budget:", error);
      }
    });
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Budget</DialogTitle>
          <DialogDescription>
            Allocate a budget for a specific episode and category.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="episodeId">Episode</Label>
            <Select
              value={episodeId}
              onValueChange={(val) => setEpisodeId(val ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Series Overall" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overall">Series Overall</SelectItem>
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
            <Select
              value={category}
              onValueChange={(val) => {
                if (val) setCategory(val);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="allocatedAmount">Allocated Amount</Label>
            <Input
              id="allocatedAmount"
              name="allocatedAmount"
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="0.00"
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Set Budget"}
            </Button>
          </DialogFooter>
        </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
