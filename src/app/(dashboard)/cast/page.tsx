import { db } from "@/db";
import { castMembers } from "@/db/schema";
import { like, desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CastForm } from "@/components/cast/cast-form";
import { CastSearch } from "@/components/cast/cast-search";
import { formatCurrency } from "@/lib/format";
import Link from "next/link";
import { Suspense } from "react";
import { Users } from "lucide-react";
import type { CastMember } from "@/db/schema";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default async function CastPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  let allCast: CastMember[] = [];

  try {
    if (q) {
      allCast = await db
        .select()
        .from(castMembers)
        .where(like(castMembers.name, `%${q}%`))
        .orderBy(desc(castMembers.createdAt));
    } else {
      allCast = await db
        .select()
        .from(castMembers)
        .orderBy(desc(castMembers.createdAt));
    }
  } catch {
    // DB not connected
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Cast</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage cast members for the series
          </p>
        </div>
        <CastForm trigger={<Button className="rounded-xl bg-gray-900 hover:bg-gray-800">Add Cast Member</Button>} />
      </div>

      <Suspense fallback={null}>
        <CastSearch />
      </Suspense>

      {allCast.length === 0 ? (
        <div className="card-shadow rounded-2xl bg-white">
          <div className="flex flex-col items-center justify-center py-16">
            <Users className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-400 mb-4">
              {q
                ? "No cast members match your search."
                : "No cast members yet. Add your first cast member to get started."}
            </p>
            {!q && (
              <CastForm trigger={<Button className="rounded-xl bg-gray-900 hover:bg-gray-800">Add Cast Member</Button>} />
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {allCast.map((member) => (
            <Link key={member.id} href={`/cast/${member.id}`}>
              <div className="card-shadow flex items-center gap-4 rounded-2xl bg-white p-4 transition-all hover:shadow-md">
                <Avatar size="lg">
                  {member.headshotUrl && (
                    <AvatarImage src={member.headshotUrl} alt={member.name} />
                  )}
                  <AvatarFallback className="bg-gray-100 text-gray-600 text-sm font-semibold">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-gray-900 truncate">{member.name}</p>
                  {member.dayRate && (
                    <p className="text-[12px] text-gray-400">
                      {formatCurrency(member.dayRate)}
                      {member.paymentType === "per_episode" ? "/day" : " (One-Time)"}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
