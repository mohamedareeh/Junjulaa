import { db } from "@/db";
import { crewMembers } from "@/db/schema";
import { like, desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { CrewForm } from "@/components/crew/crew-form";
import { CrewSearch } from "@/components/crew/crew-search";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Suspense } from "react";
import { HardHat } from "lucide-react";
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
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Crew</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage crew members for the series
          </p>
        </div>
        <CrewForm trigger={<Button className="rounded-xl bg-gray-900 hover:bg-gray-800">Add Crew Member</Button>} />
      </div>

      <Suspense fallback={null}>
        <CrewSearch />
      </Suspense>

      {allCrew.length === 0 ? (
        <div className="card-shadow rounded-2xl bg-white">
          <div className="flex flex-col items-center justify-center py-16">
            <HardHat className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-400 mb-4">
              {q
                ? "No crew members match your search."
                : "No crew members yet. Add your first crew member to get started."}
            </p>
            {!q && (
              <CrewForm trigger={<Button className="rounded-xl bg-gray-900 hover:bg-gray-800">Add Crew Member</Button>} />
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedDepartments.map((dept) => (
            <div key={dept}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-base font-semibold text-gray-900">{dept}</h2>
                <Badge variant="outline" className="rounded-lg border-gray-200 text-[11px] text-gray-500">
                  {departments[dept].length}
                </Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {departments[dept].map((member) => (
                  <Link key={member.id} href={`/crew/${member.id}`}>
                    <div className="card-shadow rounded-2xl bg-white p-4 transition-all hover:shadow-md">
                      <p className="text-[13px] font-semibold text-gray-900 truncate">
                        {member.name}
                      </p>
                      <p className="text-[12px] text-gray-500 mt-0.5">{member.roleTitle}</p>
                      {member.dayRate && (
                        <p className="text-[12px] text-gray-400 mt-1">
                          {formatCurrency(member.dayRate)}
                          {member.paymentType === "per_episode" ? "/day" : " (One-Time)"}
                        </p>
                      )}
                    </div>
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
