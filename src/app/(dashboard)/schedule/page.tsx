import { db } from "@/db";
import { schedules, episodes, locations, scenes, sceneCast, castMembers } from "@/db/schema";
import { asc, sql } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { ScheduleForm } from "@/components/schedule/schedule-form";
import { CalendarView } from "./calendar-view";
import { Calendar } from "lucide-react";

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
    episodeNumber: number;
    episodeTitle: string;
    locationName: string | null;
    sceneNumber: number | null;
    sceneTitle: string | null;
  }[] = [];

  let allEpisodes: { id: number; number: number; title: string }[] = [];
  let allLocations: { id: number; name: string }[] = [];
  let allScenes: { id: number; episodeId: number; sceneNumber: number; title: string | null }[] = [];
  let sceneCastMapObj: Record<number, string[]> = {};

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
      if (!sceneCastMapObj[row.sceneId]) {
        sceneCastMapObj[row.sceneId] = [];
      }
      sceneCastMapObj[row.sceneId].push(row.castMemberName);
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
          trigger={
            <Button className="rounded-xl bg-gray-900 hover:bg-gray-800">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Scene
            </Button>
          }
        />
      </div>

      <CalendarView
        scheduleRows={scheduleRows}
        sceneCastMap={sceneCastMapObj}
        episodes={allEpisodes}
        locations={allLocations}
        scenes={allScenes}
      />
    </div>
  );
}
