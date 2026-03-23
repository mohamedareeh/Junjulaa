import { db } from "@/db";
import { desc } from "drizzle-orm";
import { costumes, castMembers, episodes, scenes } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shirt } from "lucide-react";
import { CostumeForm } from "@/components/costumes/costume-form";
import { DeleteCostumeButton } from "@/components/costumes/delete-costume-button";

export default async function CostumesPage() {
  let allCostumes: Awaited<ReturnType<typeof fetchCostumes>> = [];
  let allCastMembers: { id: number; name: string }[] = [];
  let allEpisodes: { id: number; number: number; title: string }[] = [];
  let allScenes: { id: number; episodeId: number; sceneNumber: number }[] = [];

  try {
    [allCostumes, allCastMembers, allEpisodes, allScenes] = await Promise.all([
      fetchCostumes(),
      db
        .select({ id: castMembers.id, name: castMembers.name })
        .from(castMembers)
        .orderBy(castMembers.name),
      db
        .select({
          id: episodes.id,
          number: episodes.number,
          title: episodes.title,
        })
        .from(episodes)
        .orderBy(episodes.number),
      db
        .select({
          id: scenes.id,
          episodeId: scenes.episodeId,
          sceneNumber: scenes.sceneNumber,
        })
        .from(scenes)
        .orderBy(scenes.sceneNumber),
    ]);
  } catch {
    // DB not connected
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Costumes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage costumes for the series
          </p>
        </div>
        <CostumeForm
          episodes={allEpisodes}
          castMembers={allCastMembers}
          scenes={allScenes}
          trigger={<Button className="rounded-xl bg-gray-900 hover:bg-gray-800">Add Costume</Button>}
        />
      </div>

      {allCostumes.length === 0 ? (
        <div className="card-shadow rounded-2xl bg-white">
          <div className="flex flex-col items-center justify-center py-16">
            <Shirt className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-400 mb-4">
              No costumes yet. Add your first costume to get started.
            </p>
            <CostumeForm
              episodes={allEpisodes}
              castMembers={allCastMembers}
              scenes={allScenes}
              trigger={<Button className="rounded-xl bg-gray-900 hover:bg-gray-800">Add Costume</Button>}
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {allCostumes.map((costume) => (
            <div
              key={costume.id}
              className="card-shadow group rounded-2xl bg-white overflow-hidden transition-all hover:shadow-md"
            >
              {/* Photo */}
              <div className="aspect-square w-full overflow-hidden bg-gray-50 flex items-center justify-center">
                {costume.photoUrl ? (
                  <img
                    src={costume.photoUrl}
                    alt={costume.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Shirt className="h-12 w-12 text-gray-300" />
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between">
                  <h3 className="text-[13px] font-semibold text-gray-900 truncate">
                    {costume.name}
                  </h3>
                  <DeleteCostumeButton id={costume.id} />
                </div>
                <div className="mt-2 space-y-1">
                  {costume.castMember && (
                    <p className="text-[12px] text-gray-500">Worn by {costume.castMember.name}</p>
                  )}
                  {costume.episode && (
                    <p className="text-[12px] text-gray-400">
                      Ep {costume.episode.number} — {costume.episode.title}
                    </p>
                  )}
                  <Badge variant="outline" className="mt-1 rounded-lg border-gray-200 text-[10px] text-gray-500">
                    {costume.scenes.length}{" "}
                    {costume.scenes.length === 1 ? "scene" : "scenes"}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

async function fetchCostumes() {
  return db.query.costumes.findMany({
    with: {
      castMember: true,
      episode: true,
      scenes: {
        with: {
          scene: true,
        },
      },
    },
    orderBy: [desc(costumes.createdAt)],
  });
}
