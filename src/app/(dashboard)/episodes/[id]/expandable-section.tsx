"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpandableSectionProps {
  header: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function ExpandableSection({ header, children, defaultOpen = false }: ExpandableSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="card-shadow rounded-2xl bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4 sm:p-5 text-left transition-colors hover:bg-gray-50/50"
      >
        <div className="flex-1 min-w-0">{header}</div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ml-3",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="border-t border-gray-50 px-4 pb-4 sm:px-5 sm:pb-5">
          {children}
        </div>
      )}
    </div>
  );
}
