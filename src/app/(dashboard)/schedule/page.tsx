import { db } from "@/db";
import { schedules, episodes, locations, scenes, sceneCast, castMembers } from "@/db/schema";
import { desc, asc, sql } from "drizzle-orm";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScheduleForm } from "@/components/schedule/schedule-form";
import { DeleteScheduleButton } from "@/components/schedule/delete-schedule-button";
import { Calendar, Clock, MapPin } from "lucide-react";

export default async function SchedulePage() {
  let scheduleRows: {
    id: number;
    episodeId: number;
    locationId: number | null;
    sceneId: number | null;
    date: string;
    callTime: string | null;
    wrapTime: string | null;
    notes: string | null;
    createdAt: Date;
    episodeNumber: number;
    episodeTitle: string;
    locationName: string | null;
    sceneNumber: number | null;
    sceneTitle: string | null;
  }[] = [];

  let allEpisodes: { id: number; number: number; title: string }[] = [];
  let allLocations: { id: number; name: string }[] = [];
  let allScenes: { id: number; episodeId: number; sceneNumber: number; title: string | null }[] = [];
  let sceneCastMap: Map<number, string[]> = new Map();

  try {
    allEpisodes = await db
      .select({ id: episodes.id, number: episodes.number, title: episodes.title })
      .from(episodes)
      .orderBy(episodes.number);

    allLocations = await db
      .select({ id: locations.id, name: locations.name })
      .from(locations)
      .orderBy(locations.name);

    allScenes = await db
      .select({
        id: scenes.id,
        episodeId: scenes.episodeId,
        sceneNumber: scenes.sceneNumber,
        title: scenes.title,
      })
      .from(scenes)
      .orderBy(scenes.episodeId, scenes.sceneNumber);

    const sceneCastRows = await db
      .select({
        sceneId: sceneCast.sceneId,
        castMemberName: castMembers.name,
      })
      .from(sceneCast)
      .innerJoin(castMembers, sql`${sceneCast.castMemberId} = ${castMembers.id}`);

    for (const row of sceneCastRows) {
      if (!sceneCastMap.has(row.sceneId)) {
        sceneCastMap.set(row.sceneId, []);
      }
      sceneCastMap.get(row.sceneId)!.push(row.castMemberName);
    }

    const rows = await db
      .select({
        id: schedules.id,
        episodeId: schedules.episodeId,
        locationId: schedules.locationId,
        sceneId: schedules.sceneId,
        date: schedules.date,
        callTime: schedules.callTime,
        wrapTime: schedules.wrapTime,
        notes: schedules.notes,
        createdAt: schedules.createdAt,
        episodeNumber: episodes.number,
        episodeTitle: episodes.title,
        locationName: locations.name,
        sceneNumber: scenes.sceneNumber,
        sceneTitle: scenes.title,
      })
      .from(schedules)
      .innerJoin(episodes, sql`${schedules.episodeId} = ${episodes.id}`)
      .leftJoin(locations, sql`${schedules.locationId} = ${locations.id}`)
      .leftJoin(scenes, sql`${schedules.sceneId} = ${scenes.id}`)
      .orderBy(asc(schedules.date), asc(schedules.callTime));

    scheduleRows = rows;
  } catch {
    // DB not connected
  }

  // Group by date
  const grouped = new Map<string, typeof scheduleRows>();
  for (const row of scheduleRows) {
    const key = row.date;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(row);
  }

  // Mini-calendar
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const scheduledDates = new Set(scheduleRows.map((r) => r.date));
  const startDayOfWeek = getDay(monthStart);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Schedule</h1>
          <p className="mt-1 text-sm text-gray-500">
            Production shooting schedule
          </p>
        </div>
        <ScheduleForm
          episodes={allEpisodes}
          locations={allLocations}
          scenes={allScenes}
          trigger={<Button className="rounded-xl bg-gray-900 hover:bg-gray-800">Add Schedule</Button>}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Schedule List */}
        <div className="space-y-6">
          {grouped.size === 0 ? (
            <div className="card-shadow rounded-2xl bg-white">
              <div className="flex flex-col items-center justify-center py-16">
                <Calendar className="h-10 w-10 text-gray-300 mb-3" />
                <p className="text-sm text-gray-400">
                  No schedule entries found. Add your first entry to get started.
                </p>
              </div>
            </div>
          ) : (
            Array.from(grouped.entries()).map(([date, entries]) => (
              <div key={date}>
                <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-gray-400">
                  {format(parseISO(date), "EEEE, MMMM d, yyyy")}
                </h3>
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <div key={entry.id} className="card-shadow flex items-center gap-4 rounded-2xl bg-white px-5 py-4">
                      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-gray-900 text-white">
                        <span className="text-[9px] font-medium uppercase tracking-wider opacity-70">EP</span>
                        <span className="text-lg font-bold leading-none">{entry.episodeNumber}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-gray-900 truncate">
                          {entry.episodeTitle}
                        </p>
                        {entry.sceneId && entry.sceneNumber != null && (
                          <p className="text-[12px] text-gray-500 truncate">
                            Scene {entry.sceneNumber}{entry.sceneTitle ? ` — ${entry.sceneTitle}` : ""}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-3 text-[11px] text-gray-400">
                          {entry.locationName && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {entry.locationName}
                            </span>
                          )}
                          {entry.callTime && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {entry.callTime.slice(0, 5)}
                              {entry.wrapTime && ` - ${entry.wrapTime.slice(0, 5)}`}
                            </span>
                          )}
                        </div>
                        {entry.sceneId && sceneCastMap.has(entry.sceneId) && (
                          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                            {sceneCastMap.get(entry.sceneId)!.map((name) => (
                              <Badge key={name} variant="outline" className="rounded-lg border-gray-200 text-[10px] text-gray-500">
                                {name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <DeleteScheduleButton id={entry.id} />
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Mini Calendar */}
        <div className="card-shadow h-fit rounded-2xl bg-white p-5">
          <h3 className="mb-3 text-[13px] font-semibold text-gray-900">
            {format(now, "MMMM yyyy")}
          </h3>
          <div className="grid grid-cols-7 gap-1 text-center">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d} className="py-1 text-[10px] font-semibold text-gray-400">
                {d}
              </div>
            ))}
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {calendarDays.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const hasShoot = scheduledDates.has(dateStr);
              const today = isToday(day);
              return (
                <div
                  key={dateStr}
                  className={`relative flex flex-col items-center justify-center rounded-lg py-1.5 text-[11px] font-medium ${
                    today
                      ? "bg-gray-900 text-white"
                      : hasShoot
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600"
                  }`}
                >
                  {format(day, "d")}
                  {hasShoot && !today && (
                    <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-gray-900" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
