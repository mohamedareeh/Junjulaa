import { db } from "@/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  castMembers,
  crewMembers,
  sceneCast,
  episodeCrew,
  scenes,
  episodes,
} from "@/db/schema";
import { eq, and, isNotNull, inArray, sql } from "drizzle-orm";
import { FileText, Download, Film } from "lucide-react";

interface ScriptItem {
  sceneId: number;
  sceneNumber: number;
  sceneTitle: string | null;
  scriptUrl: string;
  episodeId: number;
  episodeNumber: number;
  episodeTitle: string;
}

export default async function MyScriptsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const userId = parseInt(session.user.id as string, 10);
  let scriptItems: ScriptItem[] = [];

  try {
    // Find cast members linked to this user
    const userCastMembers = await db
      .select({ id: castMembers.id })
      .from(castMembers)
      .where(eq(castMembers.userId, userId));

    // Find crew members linked to this user
    const userCrewMembers = await db
      .select({ id: crewMembers.id })
      .from(crewMembers)
      .where(eq(crewMembers.userId, userId));

    const sceneIds = new Set<number>();

    // Cast: get scenes they're assigned to
    if (userCastMembers.length > 0) {
      const castMemberIds = userCastMembers.map((c) => c.id);
      const castScenes = await db
        .select({ sceneId: sceneCast.sceneId })
        .from(sceneCast)
        .where(inArray(sceneCast.castMemberId, castMemberIds));

      for (const cs of castScenes) {
        sceneIds.add(cs.sceneId);
      }
    }

    // Crew: get all scenes in episodes they're assigned to
    if (userCrewMembers.length > 0) {
      const crewMemberIds = userCrewMembers.map((c) => c.id);
      const crewEpisodes = await db
        .select({ episodeId: episodeCrew.episodeId })
        .from(episodeCrew)
        .where(inArray(episodeCrew.crewMemberId, crewMemberIds));

      if (crewEpisodes.length > 0) {
        const episodeIds = crewEpisodes.map((e) => e.episodeId);
        const epScenes = await db
          .select({ id: scenes.id })
          .from(scenes)
          .where(and(
            inArray(scenes.episodeId, episodeIds),
            isNotNull(scenes.scriptUrl)
          ));

        for (const s of epScenes) {
          sceneIds.add(s.id);
        }
      }
    }

    // Fetch full scene + episode data for all collected scene IDs
    if (sceneIds.size > 0) {
      const rows = await db
        .select({
          sceneId: scenes.id,
          sceneNumber: scenes.sceneNumber,
          sceneTitle: scenes.title,
          scriptUrl: scenes.scriptUrl,
          episodeId: episodes.id,
          episodeNumber: episodes.number,
          episodeTitle: episodes.title,
        })
        .from(scenes)
        .innerJoin(episodes, eq(scenes.episodeId, episodes.id))
        .where(and(
          inArray(scenes.id, Array.from(sceneIds)),
          isNotNull(scenes.scriptUrl)
        ))
        .orderBy(episodes.number, scenes.sceneNumber);

      scriptItems = rows.filter((r) => r.scriptUrl !== null) as ScriptItem[];
    }
  } catch {
    // DB not connected
  }

  // Group by episode
  const grouped = new Map<number, { episodeNumber: number; episodeTitle: string; scripts: ScriptItem[] }>();
  for (const item of scriptItems) {
    if (!grouped.has(item.episodeId)) {
      grouped.set(item.episodeId, {
        episodeNumber: item.episodeNumber,
        episodeTitle: item.episodeTitle,
        scripts: [],
      });
    }
    grouped.get(item.episodeId)!.scripts.push(item);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">My Scripts</h1>
        <p className="mt-1 text-sm text-gray-500">
          Scripts for scenes you're assigned to
        </p>
      </div>

      {scriptItems.length === 0 ? (
        <div className="card-shadow rounded-2xl bg-white">
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <FileText className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-400 text-center">
              No scripts available yet. Scripts will appear here when they are uploaded for scenes you're assigned to.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.values()).map((group) => (
            <div key={group.episodeNumber}>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-900 text-white">
                  <Film className="h-3.5 w-3.5" />
                </div>
                <h2 className="text-[14px] font-semibold text-gray-900">
                  Episode {group.episodeNumber} — {group.episodeTitle}
                </h2>
              </div>
              <div className="space-y-2">
                {group.scripts.map((script) => (
                  <a
                    key={script.sceneId}
                    href={script.scriptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card-shadow flex items-center gap-4 rounded-2xl bg-white p-4 sm:p-5 transition-all hover:shadow-md active:scale-[0.99]"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-gray-900">
                        Scene {script.sceneNumber}
                        {script.sceneTitle ? ` — ${script.sceneTitle}` : ""}
                      </p>
                      <p className="text-[12px] text-gray-400 mt-0.5">
                        Tap to view script
                      </p>
                    </div>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                      <Download className="h-4 w-4 text-gray-500" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
