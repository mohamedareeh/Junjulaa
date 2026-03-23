import { db } from "@/db";
import { episodes } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EpisodeForm } from "@/components/episodes/episode-form";
import Link from "next/link";
import { DeleteEpisodeButton } from "@/components/episodes/delete-episode-button";
import { Film, ArrowUpRight } from "lucide-react";
import type { Episode } from "@/db/schema";

const statusColors: Record<string, string> = {
  pre_production: "border-amber-200 bg-amber-50 text-amber-700",
  filming: "border-blue-200 bg-blue-50 text-blue-700",
  post_production: "border-violet-200 bg-violet-50 text-violet-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
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
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Episodes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage all episodes in the series
          </p>
        </div>
        <EpisodeForm
          trigger={<Button className="rounded-xl bg-gray-900 hover:bg-gray-800">Add Episode</Button>}
        />
      </div>

      {allEpisodes.length === 0 ? (
        <div className="card-shadow rounded-2xl bg-white">
          <div className="flex flex-col items-center justify-center py-16">
            <Film className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-400 mb-4">
              No episodes yet. Create your first episode to get started.
            </p>
            <EpisodeForm
              trigger={<Button className="rounded-xl bg-gray-900 hover:bg-gray-800">Add Episode</Button>}
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {allEpisodes.map((ep) => (
            <div key={ep.id} className="card-shadow group relative rounded-2xl bg-white p-5 transition-all hover:shadow-md">
              <Link href={`/episodes/${ep.id}`} className="block">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Episode {ep.number}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-medium border ${statusColors[ep.status] ?? ""}`}
                  >
                    {statusLabels[ep.status] ?? ep.status}
                  </Badge>
                </div>
                <h3 className="text-[15px] font-semibold text-gray-900 leading-snug">
                  {ep.title}
                </h3>
                <div className="mt-2 space-y-1">
                  {ep.director && (
                    <p className="text-[12px] text-gray-500">
                      Dir. {ep.director}
                    </p>
                  )}
                  {(ep.startDate || ep.endDate) && (
                    <p className="text-[12px] text-gray-400">
                      {ep.startDate && <span>{ep.startDate}</span>}
                      {ep.startDate && ep.endDate && " — "}
                      {ep.endDate && <span>{ep.endDate}</span>}
                    </p>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-gray-400">
                  View details <ArrowUpRight className="h-3 w-3" />
                </div>
              </Link>
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <DeleteEpisodeButton id={ep.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
