import { db } from "@/db";
import { castMembers } from "@/db/schema";
import { like, desc } from "drizzle-orm";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CastForm } from "@/components/cast/cast-form";
import { CastSearch } from "@/components/cast/cast-search";
import { formatCurrency } from "@/lib/format";
import Link from "next/link";
import { Suspense } from "react";
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cast</h1>
          <p className="text-muted-foreground mt-1">
            Manage cast members for the series
          </p>
        </div>
        <CastForm trigger={<Button>Add Cast Member</Button>} />
      </div>

      <Suspense fallback={null}>
        <CastSearch />
      </Suspense>

      {allCast.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              {q
                ? "No cast members match your search."
                : "No cast members yet. Add your first cast member to get started."}
            </p>
            {!q && (
              <CastForm trigger={<Button>Add Cast Member</Button>} />
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {allCast.map((member) => (
            <Link key={member.id} href={`/cast/${member.id}`}>
              <Card className="transition-shadow hover:shadow-md h-full">
                <CardContent className="flex items-center gap-4 p-5">
                  <Avatar size="lg">
                    {member.headshotUrl && (
                      <AvatarImage src={member.headshotUrl} alt={member.name} />
                    )}
                    <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{member.name}</p>
                    {member.dayRate && (
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(member.dayRate)}
                        {member.paymentType === "per_episode" ? "/day (Per Episode)" : " (One-Time)"}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
