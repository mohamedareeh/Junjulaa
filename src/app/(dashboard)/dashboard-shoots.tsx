"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Clock,
  ChevronRight,
  ChevronDown,
  Film,
  Users,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Shoot {
  id: number;
  date: string;
  callTime: string | null;
  wrapTime: string | null;
  notes: string | null;
  episodeId: number;
  episodeTitle: string;
  episodeNumber: number;
  locationName: string | null;
  sceneNumber: number | null;
  sceneTitle: string | null;
}

export function DashboardShoots({ shoots }: { shoots: Shoot[] }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (shoots.length === 0) {
    return (
      <p className="text-sm text-gray-400">No upcoming shoots scheduled.</p>
    );
  }

  return (
    <div className="space-y-2">
      {shoots.map((shoot) => {
        const isExpanded = expandedId === shoot.id;
        return (
          <div key={shoot.id} className="rounded-xl bg-gray-50/80 overflow-hidden transition-all">
            {/* Clickable row */}
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : shoot.id)}
              className="flex items-center gap-4 px-4 py-3 w-full text-left transition-colors hover:bg-gray-100/80"
            >
              <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-gray-900 text-white">
                <span className="text-[8px] uppercase opacity-70">
                  {new Date(shoot.date + "T00:00").toLocaleDateString("en", { month: "short" })}
                </span>
                <span className="text-sm font-bold leading-none">
                  {new Date(shoot.date + "T00:00").getDate()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-gray-900">
                  Ep {shoot.episodeNumber}: {shoot.episodeTitle}
                </p>
                {shoot.sceneNumber != null && (
                  <p className="text-[11px] text-gray-500">
                    Scene {shoot.sceneNumber}
                    {shoot.sceneTitle ? ` — ${shoot.sceneTitle}` : ""}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant="outline"
                  className="border-gray-200 text-[11px] text-gray-600 hidden sm:inline-flex"
                >
                  {shoot.date}
                </Badge>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-gray-400 transition-transform duration-200",
                    isExpanded && "rotate-180"
                  )}
                />
              </div>
            </button>

            {/* Expanded details */}
            {isExpanded && (
              <div className="border-t border-gray-200/50 px-4 py-3 space-y-2.5 bg-white/50">
                {/* Time */}
                {shoot.callTime && (
                  <div className="flex items-center gap-2 text-[12px] text-gray-600">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    <span className="tabular-nums">
                      {shoot.callTime.slice(0, 5)}
                      {shoot.wrapTime && ` — ${shoot.wrapTime.slice(0, 5)}`}
                    </span>
                  </div>
                )}

                {/* Location */}
                {shoot.locationName && (
                  <div className="flex items-center gap-2 text-[12px] text-gray-600">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                    <span>{shoot.locationName}</span>
                  </div>
                )}

                {/* Episode */}
                <div className="flex items-center gap-2 text-[12px] text-gray-600">
                  <Film className="h-3.5 w-3.5 text-gray-400" />
                  <span>
                    Episode {shoot.episodeNumber} — {shoot.episodeTitle}
                  </span>
                </div>

                {/* Notes */}
                {shoot.notes && (
                  <p className="text-[12px] text-gray-500 italic pl-5">{shoot.notes}</p>
                )}

                {/* Link to episode */}
                <Link
                  href={`/episodes/${shoot.episodeId}`}
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-500 hover:text-gray-900 transition-colors pt-1"
                >
                  View episode details
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
