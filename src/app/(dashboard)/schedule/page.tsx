import { db } from "@/db";
import { schedules, episodes, locations } from "@/db/schema";
import { desc, asc, sql } from "drizzle-orm";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, parseISO } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScheduleForm } from "@/components/schedule/schedule-form";
import { DeleteScheduleButton } from "@/components/schedule/delete-schedule-button";
import { CalendarIcon, ClockIcon } from "lucide-react";

export default async function SchedulePage() {
  let scheduleRows: {
    id: number;
    episodeId: number;
    locationId: number | null;
    date: string;
    callTime: string | null;
    wrapTime: string | null;
    notes: string | null;
    createdAt: Date;
    episodeNumber: number;
    episodeTitle: string;
    locationName: string | null;
  }[] = [];

  let allEpisodes: { id: number; number: number; title: string }[] = [];
  let allLocations: { id: number; name: string }[] = [];

  try {
    allEpisodes = await db
      .select({
        id: episodes.id,
        number: episodes.number,
        title: episodes.title,
      })
      .from(episodes)
      .orderBy(episodes.number);

    allLocations = await db
      .select({
        id: locations.id,
        name: locations.name,
      })
      .from(locations)
      .orderBy(locations.name);

    const rows = await db
      .select({
        id: schedules.id,
        episodeId: schedules.episodeId,
        locationId: schedules.locationId,
        date: schedules.date,
        callTime: schedules.callTime,
        wrapTime: schedules.wrapTime,
        notes: schedules.notes,
        createdAt: schedules.createdAt,
        episodeNumber: episodes.number,
        episodeTitle: episodes.title,
        locationName: locations.name,
      })
      .from(schedules)
      .innerJoin(episodes, sql`${schedules.episodeId} = ${episodes.id}`)
      .leftJoin(locations, sql`${schedules.locationId} = ${locations.id}`)
      .orderBy(asc(schedules.date), asc(schedules.callTime));

    scheduleRows = rows;
  } catch {
    // DB not connected
  }

  // Group schedule entries by date
  const grouped = new Map<string, typeof scheduleRows>();
  for (const row of scheduleRows) {
    const key = row.date;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(row);
  }

  // Mini-calendar data
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const scheduledDates = new Set(scheduleRows.map((r) => r.date));

  // Pad the start of the calendar to align with the correct day of week
  const startDayOfWeek = getDay(monthStart);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
          <p className="text-muted-foreground mt-1">
            Production shooting schedule
          </p>
        </div>
        <ScheduleForm
          episodes={allEpisodes}
          locations={allLocations}
          trigger={<Button>Add Schedule</Button>}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Schedule List */}
        <div className="space-y-4">
          {grouped.size === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CalendarIcon className="size-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No schedule entries found. Add your first entry to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            Array.from(grouped.entries()).map(([date, entries]) => (
              <div key={date} className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {format(parseISO(date), "EEEE, MMMM d, yyyy")}
                </h3>
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <Card key={entry.id}>
                      <CardContent className="flex items-center gap-4 py-4">
                        <div className="flex flex-col items-center justify-center rounded-lg bg-muted px-3 py-2 min-w-[60px]">
                          <span className="text-xs font-medium text-muted-foreground">
                            EP
                          </span>
                          <span className="text-lg font-bold">
                            {entry.episodeNumber}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {entry.episodeTitle}
                          </p>
                          {entry.locationName && (
                            <p className="text-sm text-muted-foreground truncate">
                              {entry.locationName}
                            </p>
                          )}
                          {entry.notes && (
                            <p className="text-sm text-muted-foreground mt-1 truncate">
                              {entry.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground shrink-0">
                          {entry.callTime && (
                            <div className="flex items-center gap-1">
                              <ClockIcon className="size-3.5" />
                              <span>{entry.callTime.slice(0, 5)}</span>
                            </div>
                          )}
                          {entry.callTime && entry.wrapTime && (
                            <span className="text-muted-foreground/50">-</span>
                          )}
                          {entry.wrapTime && (
                            <span>{entry.wrapTime.slice(0, 5)}</span>
                          )}
                          <DeleteScheduleButton id={entry.id} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Mini Calendar */}
        <Card className="h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {format(now, "MMMM yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <div
                  key={d}
                  className="text-xs font-medium text-muted-foreground py-1"
                >
                  {d}
                </div>
              ))}
              {/* Empty cells for padding */}
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
                    className={`relative flex flex-col items-center justify-center rounded-md py-1.5 text-xs ${
                      today
                        ? "bg-primary text-primary-foreground font-bold"
                        : "text-foreground"
                    }`}
                  >
                    {format(day, "d")}
                    {hasShoot && (
                      <span className="absolute bottom-0.5 size-1.5 rounded-full bg-blue-500" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
