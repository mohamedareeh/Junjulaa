"use client";

import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isToday,
  isSameMonth,
  isSameDay,
  parseISO,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  MapPin,
  Clock,
  Film,
  Users,
  MoreHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScheduleForm } from "@/components/schedule/schedule-form";
import { DeleteScheduleButton } from "@/components/schedule/delete-schedule-button";
import { Button } from "@/components/ui/button";

type ViewMode = "month" | "week";

interface ScheduleEntry {
  id: number;
  episodeId: number;
  locationId: number | null;
  sceneId: number | null;
  date: string;
  callTime: string | null;
  wrapTime: string | null;
  notes: string | null;
  episodeNumber: number;
  episodeTitle: string;
  locationName: string | null;
  sceneNumber: number | null;
  sceneTitle: string | null;
}

interface CalendarViewProps {
  scheduleRows: ScheduleEntry[];
  sceneCastMap: Record<number, string[]>;
  episodes: { id: number; number: number; title: string }[];
  locations: { id: number; name: string }[];
  scenes: { id: number; episodeId: number; sceneNumber: number; title: string | null }[];
}

const EPISODE_COLORS = [
  { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", dot: "bg-blue-500" },
  { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700", dot: "bg-violet-500" },
  { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
  { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", dot: "bg-rose-500" },
  { bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-700", dot: "bg-cyan-500" },
  { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", dot: "bg-orange-500" },
  { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700", dot: "bg-indigo-500" },
  { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-700", dot: "bg-pink-500" },
  { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-700", dot: "bg-teal-500" },
];

function getEpisodeColor(episodeNumber: number) {
  return EPISODE_COLORS[(episodeNumber - 1) % EPISODE_COLORS.length];
}

export function CalendarView({
  scheduleRows,
  sceneCastMap,
  episodes,
  locations,
  scenes,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, ScheduleEntry[]>();
    for (const row of scheduleRows) {
      const key = row.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    }
    // Sort each day's events by call time
    for (const [, entries] of map) {
      entries.sort((a, b) => (a.callTime ?? "").localeCompare(b.callTime ?? ""));
    }
    return map;
  }, [scheduleRows]);

  // Calendar days
  const calendarDays = useMemo(() => {
    if (viewMode === "month") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
      const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
      return eachDayOfInterval({ start: calStart, end: calEnd });
    } else {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    }
  }, [currentDate, viewMode]);

  function navigate(dir: "prev" | "next") {
    if (viewMode === "month") {
      setCurrentDate(dir === "next" ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    } else {
      setCurrentDate(dir === "next" ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    }
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("prev")}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={() => navigate("next")}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 ml-1">
            {viewMode === "month"
              ? format(currentDate, "MMMM yyyy")
              : `${format(calendarDays[0], "MMM d")} — ${format(calendarDays[6], "MMM d, yyyy")}`}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Today
          </button>
          <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden">
            <button
              onClick={() => setViewMode("month")}
              className={`px-3 py-1.5 text-[12px] font-medium transition-colors ${
                viewMode === "month"
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1.5 text-[12px] font-medium transition-colors ${
                viewMode === "week"
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="card-shadow rounded-2xl bg-white overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-400"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className={`grid grid-cols-7 ${viewMode === "week" ? "" : "auto-rows-fr"}`}>
          {calendarDays.map((day, idx) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const dayEvents = eventsByDate.get(dateStr) ?? [];
            const today = isToday(day);
            const inMonth = isSameMonth(day, currentDate);
            const maxVisible = viewMode === "week" ? 10 : 3;
            const hiddenCount = Math.max(0, dayEvents.length - maxVisible);

            return (
              <div
                key={dateStr}
                className={`group relative border-b border-r border-gray-100 ${
                  viewMode === "week" ? "min-h-[300px]" : "min-h-[100px] sm:min-h-[120px]"
                } ${!inMonth && viewMode === "month" ? "bg-gray-50/50" : ""} ${
                  idx % 7 === 0 ? "border-l-0" : ""
                }`}
              >
                {/* Date number + add button */}
                <div className="flex items-center justify-between px-2 pt-1.5">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-medium ${
                      today
                        ? "bg-gray-900 text-white"
                        : !inMonth && viewMode === "month"
                          ? "text-gray-300"
                          : "text-gray-700"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                  <ScheduleForm
                    episodes={episodes}
                    locations={locations}
                    scenes={scenes}
                    defaultDate={dateStr}
                    trigger={
                      <button className="flex h-5 w-5 items-center justify-center rounded-md opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all">
                        <Plus className="h-3.5 w-3.5 text-gray-400" />
                      </button>
                    }
                  />
                </div>

                {/* Events */}
                <div className="mt-1 space-y-0.5 px-1 pb-1">
                  {dayEvents.slice(0, maxVisible).map((entry) => {
                    const color = getEpisodeColor(entry.episodeNumber);
                    const isExpanded = expandedEvent === entry.id;

                    return (
                      <div key={entry.id} className="relative">
                        <button
                          onClick={() => setExpandedEvent(isExpanded ? null : entry.id)}
                          className={`w-full text-left rounded-md px-1.5 py-0.5 ${color.bg} ${color.border} border transition-all hover:shadow-sm ${
                            isExpanded ? "shadow-sm" : ""
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <span className={`h-1.5 w-1.5 rounded-full ${color.dot} shrink-0`} />
                            <span className={`truncate text-[10px] font-medium ${color.text}`}>
                              {entry.callTime && (
                                <span className="tabular-nums">{entry.callTime.slice(0, 5)} </span>
                              )}
                              {entry.sceneNumber != null
                                ? `S${entry.sceneNumber}${entry.sceneTitle ? ` ${entry.sceneTitle}` : ""}`
                                : `Ep${entry.episodeNumber}`}
                            </span>
                          </div>
                        </button>

                        {/* Expanded event popover */}
                        {isExpanded && (
                          <div
                            className="absolute z-50 left-0 right-0 mt-1 rounded-xl bg-white border border-gray-200 shadow-lg p-3 min-w-[220px]"
                            style={{ width: "max(100%, 240px)" }}
                          >
                            <div className="space-y-2">
                              {/* Header */}
                              <div className="flex items-start gap-2">
                                <div className={`flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded-lg ${color.bg} ${color.text}`}>
                                  <span className="text-[7px] font-bold uppercase">EP</span>
                                  <span className="text-[11px] font-bold leading-none">{entry.episodeNumber}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] font-semibold text-gray-900 truncate">
                                    {entry.sceneNumber != null
                                      ? `Scene ${entry.sceneNumber}${entry.sceneTitle ? ` — ${entry.sceneTitle}` : ""}`
                                      : entry.episodeTitle}
                                  </p>
                                  {entry.sceneNumber != null && (
                                    <p className="text-[11px] text-gray-500">{entry.episodeTitle}</p>
                                  )}
                                </div>
                              </div>

                              {/* Details */}
                              <div className="space-y-1.5">
                                {entry.callTime && (
                                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                                    <Clock className="h-3 w-3 shrink-0" />
                                    <span className="tabular-nums">
                                      {entry.callTime.slice(0, 5)}
                                      {entry.wrapTime && ` — ${entry.wrapTime.slice(0, 5)}`}
                                    </span>
                                  </div>
                                )}
                                {entry.locationName && (
                                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                                    <MapPin className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{entry.locationName}</span>
                                  </div>
                                )}
                                {entry.sceneId && sceneCastMap[entry.sceneId] && (
                                  <div className="flex items-start gap-1.5 text-[11px] text-gray-500">
                                    <Users className="h-3 w-3 shrink-0 mt-0.5" />
                                    <div className="flex flex-wrap gap-1">
                                      {sceneCastMap[entry.sceneId].map((name) => (
                                        <span key={name} className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                                          {name}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {entry.notes && (
                                  <p className="text-[11px] text-gray-400 italic">{entry.notes}</p>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                                <ScheduleForm
                                  schedule={{
                                    id: entry.id,
                                    episodeId: entry.episodeId,
                                    locationId: entry.locationId,
                                    sceneId: entry.sceneId,
                                    date: entry.date,
                                    callTime: entry.callTime,
                                    wrapTime: entry.wrapTime,
                                    notes: entry.notes,
                                    createdAt: new Date(),
                                  }}
                                  episodes={episodes}
                                  locations={locations}
                                  scenes={scenes}
                                  trigger={
                                    <span className="text-[11px] font-medium text-gray-600 hover:text-gray-900 cursor-pointer transition-colors">
                                      Edit
                                    </span>
                                  }
                                />
                                <DeleteScheduleButton id={entry.id} />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {hiddenCount > 0 && (
                    <button className="w-full text-left rounded-md px-1.5 py-0.5 text-[10px] font-medium text-gray-500 hover:bg-gray-100 transition-colors">
                      +{hiddenCount} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 px-1">
        {episodes.map((ep) => {
          const color = getEpisodeColor(ep.number);
          return (
            <div key={ep.id} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${color.dot}`} />
              <span className="text-[11px] text-gray-500">Ep {ep.number}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
