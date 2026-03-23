import { db } from "@/db";
import { crewMembers } from "@/db/schema";
import { like, desc } from "drizzle-orm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CrewForm } from "@/components/crew/crew-form";
import { CrewSearch } from "@/components/crew/crew-search";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Suspense } from "react";
import type { CrewMember } from "@/db/schema";

export default async function CrewPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  let allCrew: CrewMember[] = [];

  try {
    if (q) {
      allCrew = await db
        .select()
        .from(crewMembers)
        .where(like(crewMembers.name, `%${q}%`))
        .orderBy(desc(crewMembers.createdAt));
    } else {
      allCrew = await db
        .select()
        .from(crewMembers)
        .orderBy(desc(crewMembers.createdAt));
    }
  } catch {
    // DB not connected
  }

  // Group crew by department
  const departments = allCrew.reduce<Record<string, CrewMember[]>>(
    (acc, member) => {
      const dept = member.department;
      if (!acc[dept]) {
        acc[dept] = [];
      }
      acc[dept].push(member);
      return acc;
    },
    {}
  );

  const sortedDepartments = Object.keys(departments).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Crew</h1>
          <p className="text-muted-foreground mt-1">
            Manage crew members for the series
          </p>
        </div>
        <CrewForm trigger={<Button>Add Crew Member</Button>} />
      </div>

      <Suspense fallback={null}>
        <CrewSearch />
      </Suspense>

      {allCrew.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              {q
                ? "No crew members match your search."
                : "No crew members yet. Add your first crew member to get started."}
            </p>
            {!q && (
              <CrewForm trigger={<Button>Add Crew Member</Button>} />
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {sortedDepartments.map((dept) => (
            <div key={dept}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-semibold">{dept}</h2>
                <Badge variant="secondary">
                  {departments[dept].length}
                </Badge>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {departments[dept].map((member) => (
                  <Link key={member.id} href={`/crew/${member.id}`}>
                    <Card className="transition-shadow hover:shadow-md h-full">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base truncate">
                          {member.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-1 text-sm text-muted-foreground">
                        <p>{member.roleTitle}</p>
                        {member.dayRate && (
                          <p>
                            {formatCurrency(member.dayRate)}
                            {member.paymentType === "per_episode" ? "/day (Per Episode)" : " (One-Time)"}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
