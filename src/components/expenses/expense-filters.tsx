"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExpenseFiltersProps {
  episodes: { id: number; number: number; title: string }[];
  categories: { id: number; name: string }[];
}

export function ExpenseFilters({ episodes, categories }: ExpenseFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/expenses?${params.toString()}`);
  }

  const currentEpisode = searchParams.get("episode") ?? "all";
  const currentCategory = searchParams.get("category") ?? "all";

  return (
    <div className="flex items-center gap-3">
      <Select
        value={currentEpisode}
        onValueChange={(val) => updateFilter("episode", val)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Episodes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Episodes</SelectItem>
          {episodes.map((ep) => (
            <SelectItem key={ep.id} value={String(ep.id)}>
              Ep {ep.number} - {ep.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={currentCategory}
        onValueChange={(val) => updateFilter("category", val)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.name}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
