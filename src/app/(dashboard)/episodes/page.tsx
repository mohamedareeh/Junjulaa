import { db } from "@/db";
import { episodes } from "@/db/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EpisodeForm } from "@/components/episodes/episode-form";
import Link from "next/link";
import type { Episode } from "@/db/schema";

const statusColors: Record<string, string> = {
  pre_production: "bg-yellow-100 text-yellow-800",
  filming: "bg-blue-100 text-blue-800",
  post_production: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
};

const statusLabels: Record<string, string> = {
  pre_production: "Pre-Production",
  filming: "Filming",
  post_production: "Post-Production",
  completed: "Completed",
};

export default async function EpisodesPage() {
  let allEpisodes: Episode[] = [];

  try {
    allEpisodes = await db.select().from(episodes).orderBy(episodes.number);
  } catch {
    // DB not connected
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Episodes</h1>
          <p className="text-muted-foreground mt-1">
            Manage all episodes in the series
          </p>
        </div>
        <EpisodeForm
          trigger={<Button>Add Episode</Button>}
        />
      </div>

      {allEpisodes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              No episodes yet. Create your first episode to get started.
            </p>
            <EpisodeForm
              trigger={<Button>Add Episode</Button>}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {allEpisodes.map((ep) => (
            <Link key={ep.id} href={`/episodes/${ep.id}`}>
              <Card className="transition-shadow hover:shadow-md h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs font-medium">
                      Episode {ep.number}
                    </CardDescription>
                    <Badge
                      className={`text-xs ${statusColors[ep.status] ?? ""}`}
                    >
                      {statusLabels[ep.status] ?? ep.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg leading-snug">
                    {ep.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  {ep.director && (
                    <p>
                      <span className="font-medium text-foreground">
                        Director:
                      </span>{" "}
                      {ep.director}
                    </p>
                  )}
                  {(ep.startDate || ep.endDate) && (
                    <p>
                      {ep.startDate && (
                        <span>{ep.startDate}</span>
                      )}
                      {ep.startDate && ep.endDate && " — "}
                      {ep.endDate && (
                        <span>{ep.endDate}</span>
                      )}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
