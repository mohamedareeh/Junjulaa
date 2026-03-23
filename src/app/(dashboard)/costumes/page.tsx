import { db } from "@/db";
import { desc } from "drizzle-orm";
import { costumes, castMembers, episodes, scenes } from "@/db/schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Costumes</h1>
          <p className="text-muted-foreground mt-1">
            Manage costumes for the series
          </p>
        </div>
        <CostumeForm
          episodes={allEpisodes}
          castMembers={allCastMembers}
          scenes={allScenes}
          trigger={<Button>Add Costume</Button>}
        />
      </div>

      {allCostumes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              No costumes yet. Add your first costume to get started.
            </p>
            <CostumeForm
              episodes={allEpisodes}
              castMembers={allCastMembers}
              scenes={allScenes}
              trigger={<Button>Add Costume</Button>}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {allCostumes.map((costume) => (
            <Card
              key={costume.id}
              className="transition-shadow hover:shadow-md h-full"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base truncate">
                    {costume.name}
                  </CardTitle>
                  <DeleteCostumeButton id={costume.id} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Photo or placeholder */}
                <div className="aspect-square w-full overflow-hidden rounded-md bg-slate-100 flex items-center justify-center">
                  {costume.photoUrl ? (
                    <img
                      src={costume.photoUrl}
                      alt={costume.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Shirt className="h-12 w-12 text-slate-400" />
                  )}
                </div>

                <div className="space-y-1 text-sm text-muted-foreground">
                  {costume.castMember && (
                    <p>Worn by: {costume.castMember.name}</p>
                  )}
                  {costume.episode && (
                    <p>
                      Ep {costume.episode.number} — {costume.episode.title}
                    </p>
                  )}
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary">
                      {costume.scenes.length}{" "}
                      {costume.scenes.length === 1 ? "scene" : "scenes"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
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
