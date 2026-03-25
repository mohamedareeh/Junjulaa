import { db } from "@/db";
import {
  episodes,
  locations,
  castMembers,
  crewMembers,
  scenes,
  sceneCast,
  schedules,
  type Episode,
  type CastMember,
  type CrewMember,
  type Expense,
  type Schedule,
  type Document,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EpisodeForm } from "@/components/episodes/episode-form";
import { SceneForm } from "@/components/scenes/scene-form";
import { DeleteSceneButton } from "@/components/scenes/delete-scene-button";
import { formatCurrency } from "@/lib/format";
import Link from "next/link";
import {
  ArrowLeft,
  Film,
  Users,
  HardHat,
  Calendar,
  FileText,
  DollarSign,
  Clock,
  MapPin,
  Clapperboard,
} from "lucide-react";
import { ExpandableSection } from "./expandable-section";
import { AddCastForm, AddCrewForm } from "./episode-forms";
import { RemoveCastButton, RemoveCrewButton } from "./remove-buttons";

type EpisodeWithRelations = Episode & {
  cast: Array<{
    id: number;
    roleName: string;
    scenes: string | null;
    notes: string | null;
    castMember: CastMember;
  }>;
  crew: Array<{
    id: number;
    notes: string | null;
    crewMember: CrewMember;
  }>;
  expenses: Expense[];
  schedules: Schedule[];
  documents: Document[];
  scenes: Array<{
    id: number;
    sceneNumber: number;
    title: string | null;
    description: string | null;
    locationId: number | null;
    props: string | null;
    timeOfDay: string | null;
    duration: string | null;
    continuitySceneId: number | null;
    scriptUrl: string | null;
    cast: Array<{
      id: number;
      castMember: CastMember;
    }>;
  }>;
};

const statusColors: Record<string, string> = {
  pre_production: "border-amber-200 bg-amber-50 text-amber-700",
  filming: "border-blue-200 bg-blue-50 text-blue-700",
  post_production: "border-violet-200 bg-violet-50 text-violet-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const timeOfDayColors: Record<string, string> = {
  morning: "border-amber-200 bg-amber-50 text-amber-700",
  afternoon: "border-orange-200 bg-orange-50 text-orange-700",
  evening: "border-violet-200 bg-violet-50 text-violet-700",
  night: "border-blue-200 bg-blue-50 text-blue-700",
};

const timeOfDayLabels: Record<string, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  night: "Night",
};

const statusLabels: Record<string, string> = {
  pre_production: "Pre-Production",
  filming: "Filming",
  post_production: "Post-Production",
  completed: "Completed",
};

export default async function EpisodeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const episodeId = parseInt(id, 10);

  if (isNaN(episodeId)) {
    notFound();
  }

  let episode: EpisodeWithRelations | null = null;
  let episodeSchedules: {
    id: number;
    date: string;
    callTime: string | null;
    wrapTime: string | null;
    notes: string | null;
    locationName: string | null;
    sceneNumber: number | null;
    sceneTitle: string | null;
  }[] = [];
  let allLocations: { id: number; name: string }[] = [];
  let allCastMembers: { id: number; name: string }[] = [];
  let allCrewMembers: { id: number; name: string; department: string }[] = [];

  try {
    const result = await db.query.episodes.findFirst({
      where: eq(episodes.id, episodeId),
      with: {
        cast: { with: { castMember: true } },
        crew: { with: { crewMember: true } },
        expenses: true,
        schedules: true,
        documents: true,
        scenes: {
          with: { cast: { with: { castMember: true } } },
          orderBy: (scenes, { asc }) => [asc(scenes.sceneNumber)],
        },
      },
    });

    if (!result) notFound();
    episode = result as EpisodeWithRelations;

    const scheduleRows = await db
      .select({
        id: schedules.id,
        date: schedules.date,
        callTime: schedules.callTime,
        wrapTime: schedules.wrapTime,
        notes: schedules.notes,
        locationName: locations.name,
        sceneNumber: scenes.sceneNumber,
        sceneTitle: scenes.title,
      })
      .from(schedules)
      .leftJoin(locations, eq(schedules.locationId, locations.id))
      .leftJoin(scenes, eq(schedules.sceneId, scenes.id))
      .where(eq(schedules.episodeId, episodeId))
      .orderBy(schedules.date, schedules.callTime);
    episodeSchedules = scheduleRows;

    allLocations = await db
      .select({ id: locations.id, name: locations.name })
      .from(locations)
      .orderBy(locations.name);

    allCastMembers = await db
      .select({ id: castMembers.id, name: castMembers.name })
      .from(castMembers)
      .orderBy(castMembers.name);

    allCrewMembers = await db
      .select({ id: crewMembers.id, name: crewMembers.name, department: crewMembers.department })
      .from(crewMembers)
      .orderBy(crewMembers.name);
  } catch (error) {
    console.error("Episode detail error:", error);
    notFound();
  }

  const totalExpenses = episode.expenses.reduce(
    (sum, exp) => sum + Number(exp.amount),
    0
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/episodes"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-400 hover:text-gray-900 transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Episodes
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Episode {episode.number}
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {episode.title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`text-[10px] font-medium border ${statusColors[episode.status] ?? ""}`}
            >
              {statusLabels[episode.status] ?? episode.status}
            </Badge>
            <EpisodeForm
              episode={episode}
              trigger={<Button variant="outline" size="sm" className="rounded-xl">Edit</Button>}
            />
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card-shadow rounded-2xl bg-white p-4">
          <div className="flex items-center gap-2 text-[12px] text-gray-500 mb-1">
            <Clapperboard className="h-3.5 w-3.5" /> Scenes
          </div>
          <p className="text-xl font-bold text-gray-900">{episode.scenes.length}</p>
        </div>
        <div className="card-shadow rounded-2xl bg-white p-4">
          <div className="flex items-center gap-2 text-[12px] text-gray-500 mb-1">
            <Users className="h-3.5 w-3.5" /> Cast
          </div>
          <p className="text-xl font-bold text-gray-900">{episode.cast.length}</p>
        </div>
        <div className="card-shadow rounded-2xl bg-white p-4">
          <div className="flex items-center gap-2 text-[12px] text-gray-500 mb-1">
            <Calendar className="h-3.5 w-3.5" /> Shoots
          </div>
          <p className="text-xl font-bold text-gray-900">{episodeSchedules.length}</p>
        </div>
        <div className="card-shadow rounded-2xl bg-white p-4">
          <div className="flex items-center gap-2 text-[12px] text-gray-500 mb-1">
            <DollarSign className="h-3.5 w-3.5" /> Expenses
          </div>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
        </div>
      </div>

      {/* Synopsis */}
      {episode.synopsis && (
        <div className="card-shadow rounded-2xl bg-white p-5">
          <p className="text-[13px] font-medium text-gray-500 mb-1">Synopsis</p>
          <p className="text-[14px] text-gray-700 leading-relaxed">{episode.synopsis}</p>
        </div>
      )}

      {/* Scenes — Expandable */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">Scenes</h2>
          <SceneForm
            episodeId={episode.id}
            locations={allLocations}
            castMembers={allCastMembers}
            allScenes={episode.scenes.map((s) => ({
              id: s.id,
              sceneNumber: s.sceneNumber,
              title: s.title,
            }))}
            trigger={<Button size="sm" className="rounded-xl bg-gray-900 hover:bg-gray-800">Add Scene</Button>}
          />
        </div>
        {episode.scenes.length === 0 ? (
          <div className="card-shadow rounded-2xl bg-white p-8 text-center">
            <Clapperboard className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No scenes yet. Add scenes to plan your shoot.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {episode.scenes.map((scene) => (
              <ExpandableSection
                key={scene.id}
                header={
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-[12px] font-bold text-gray-600">
                      {scene.sceneNumber}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-gray-900 truncate">
                        {scene.title || `Scene ${scene.sceneNumber}`}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {scene.timeOfDay && (
                          <Badge variant="outline" className={`text-[9px] border ${timeOfDayColors[scene.timeOfDay] ?? ""}`}>
                            {timeOfDayLabels[scene.timeOfDay] ?? scene.timeOfDay}
                          </Badge>
                        )}
                        {scene.duration && (
                          <span className="text-[11px] text-gray-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {scene.duration}
                          </span>
                        )}
                        {scene.cast.length > 0 && (
                          <span className="text-[11px] text-gray-400">
                            {scene.cast.length} cast
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                }
              >
                <div className="space-y-3 pt-3">
                  {scene.description && (
                    <p className="text-[13px] text-gray-600">{scene.description}</p>
                  )}
                  {scene.props && (
                    <div>
                      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Props</p>
                      <p className="text-[13px] text-gray-600">{scene.props}</p>
                    </div>
                  )}
                  {scene.continuitySceneId && (
                    <p className="text-[12px] text-gray-400">
                      Continues from Scene{" "}
                      {episode.scenes.find((s) => s.id === scene.continuitySceneId)?.sceneNumber ?? scene.continuitySceneId}
                    </p>
                  )}
                  {scene.scriptUrl && (
                    <a
                      href={scene.scriptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[12px] font-medium text-blue-600 hover:underline"
                    >
                      <FileText className="h-3.5 w-3.5" /> View Script
                    </a>
                  )}
                  {scene.cast.length > 0 && (
                    <div>
                      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">Cast</p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {scene.cast.map((sc) => (
                          <Badge key={sc.id} variant="outline" className="rounded-lg border-gray-200 text-[11px] text-gray-600">
                            {sc.castMember.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-1 pt-1">
                    <SceneForm
                      episodeId={episode.id}
                      scene={{
                        id: scene.id,
                        sceneNumber: scene.sceneNumber,
                        title: scene.title,
                        description: scene.description,
                        locationId: scene.locationId,
                        castMemberIds: scene.cast.map((sc) => sc.castMember.id),
                        props: scene.props,
                        timeOfDay: scene.timeOfDay,
                        duration: scene.duration,
                        continuitySceneId: scene.continuitySceneId,
                        scriptUrl: scene.scriptUrl,
                      }}
                      locations={allLocations}
                      castMembers={allCastMembers}
                      allScenes={episode.scenes.map((s) => ({
                        id: s.id,
                        sceneNumber: s.sceneNumber,
                        title: s.title,
                      }))}
                      trigger={
                        <Button variant="ghost" size="sm" className="rounded-lg text-[12px] text-gray-400 hover:text-gray-900">
                          Edit
                        </Button>
                      }
                    />
                    <DeleteSceneButton sceneId={scene.id} episodeId={episode.id} />
                  </div>
                </div>
              </ExpandableSection>
            ))}
          </div>
        )}
      </div>

      {/* Cast */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">Cast</h2>
          <AddCastForm
            episodeId={episode.id}
            castMembers={allCastMembers}
            trigger={<Button size="sm" className="rounded-xl bg-gray-900 hover:bg-gray-800">Add Cast</Button>}
          />
        </div>
        {episode.cast.length === 0 ? (
          <div className="card-shadow rounded-2xl bg-white p-8 text-center">
            <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No cast assigned. Add cast members to this episode.</p>
          </div>
        ) : (
          <div className="card-shadow rounded-2xl bg-white divide-y divide-gray-50">
            {episode.cast.map((ec) => (
              <div key={ec.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[12px] font-semibold text-gray-600">
                  {ec.castMember.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-gray-900 truncate">{ec.castMember.name}</p>
                  <p className="text-[12px] text-gray-400">as {ec.roleName}</p>
                </div>
                <RemoveCastButton id={ec.id} episodeId={episode.id} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Crew */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">Crew</h2>
          <AddCrewForm
            episodeId={episode.id}
            crewMembers={allCrewMembers}
            trigger={<Button size="sm" className="rounded-xl bg-gray-900 hover:bg-gray-800">Add Crew</Button>}
          />
        </div>
        {episode.crew.length === 0 ? (
          <div className="card-shadow rounded-2xl bg-white p-8 text-center">
            <HardHat className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No crew assigned. Add crew members to this episode.</p>
          </div>
        ) : (
          <div className="card-shadow rounded-2xl bg-white divide-y divide-gray-50">
            {episode.crew.map((ec) => (
              <div key={ec.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[12px] font-semibold text-gray-600">
                  {ec.crewMember.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-gray-900 truncate">{ec.crewMember.name}</p>
                  <p className="text-[12px] text-gray-400">{ec.crewMember.department} — {ec.crewMember.roleTitle}</p>
                </div>
                <RemoveCrewButton id={ec.id} episodeId={episode.id} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">Schedule</h2>
        {episodeSchedules.length === 0 ? (
          <div className="card-shadow rounded-2xl bg-white p-8 text-center">
            <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No shoots scheduled for this episode.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {episodeSchedules.map((sched) => (
              <div key={sched.id} className="card-shadow flex items-center gap-4 rounded-2xl bg-white px-4 py-3 sm:px-5">
                <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-gray-900 text-white">
                  <span className="text-[9px] uppercase opacity-70">
                    {new Date(sched.date + "T00:00").toLocaleDateString("en", { month: "short" })}
                  </span>
                  <span className="text-sm font-bold leading-none">
                    {new Date(sched.date + "T00:00").getDate()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  {sched.sceneNumber != null && (
                    <p className="text-[13px] font-medium text-gray-900">
                      Scene {sched.sceneNumber}{sched.sceneTitle ? ` — ${sched.sceneTitle}` : ""}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-0.5">
                    {sched.callTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {sched.callTime.slice(0, 5)}
                        {sched.wrapTime && ` - ${sched.wrapTime.slice(0, 5)}`}
                      </span>
                    )}
                    {sched.locationName && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {sched.locationName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expenses */}
      {episode.expenses.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Expenses</h2>
          <div className="card-shadow rounded-2xl bg-white divide-y divide-gray-50">
            {episode.expenses.map((exp) => (
              <div key={exp.id} className="flex items-center justify-between px-4 py-3 sm:px-5">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-gray-900 truncate">{exp.description}</p>
                  <p className="text-[11px] text-gray-400 capitalize">{exp.category.replace("_", " ")}{exp.date ? ` — ${exp.date}` : ""}</p>
                </div>
                <p className="text-[13px] font-semibold text-gray-900 tabular-nums shrink-0 ml-3">
                  {formatCurrency(exp.amount)}
                </p>
              </div>
            ))}
            <div className="flex items-center justify-between px-4 py-3 sm:px-5 bg-gray-50/50">
              <p className="text-[13px] font-medium text-gray-500">Total</p>
              <p className="text-[14px] font-bold text-gray-900 tabular-nums">{formatCurrency(totalExpenses)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Documents */}
      {episode.documents.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Documents</h2>
          <div className="card-shadow rounded-2xl bg-white divide-y divide-gray-50">
            {episode.documents.map((doc) => (
              <a
                key={doc.id}
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 sm:px-5 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                  <FileText className="h-4 w-4 text-gray-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-gray-900 truncate">{doc.name}</p>
                  <p className="text-[11px] text-gray-400 capitalize">{doc.type} — v{doc.version}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
