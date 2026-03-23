import { db } from "@/db";
import { crewMembers, episodeCrew, episodes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CrewForm } from "@/components/crew/crew-form";
import { DeleteCrewButton } from "@/components/crew/delete-crew-button";
import { formatCurrency } from "@/lib/format";
import Link from "next/link";
import type { CrewMember } from "@/db/schema";

export default async function CrewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const crewId = parseInt(id, 10);

  if (isNaN(crewId)) {
    notFound();
  }

  let member: CrewMember | undefined;
  let episodeAssignments: {
    id: number;
    notes: string | null;
    episodeNumber: number;
    episodeTitle: string;
    episodeId: number;
  }[] = [];

  try {
    const result = await db
      .select()
      .from(crewMembers)
      .where(eq(crewMembers.id, crewId))
      .limit(1);

    if (result.length === 0) {
      notFound();
    }

    member = result[0];

    episodeAssignments = await db
      .select({
        id: episodeCrew.id,
        notes: episodeCrew.notes,
        episodeNumber: episodes.number,
        episodeTitle: episodes.title,
        episodeId: episodes.id,
      })
      .from(episodeCrew)
      .innerJoin(episodes, eq(episodeCrew.episodeId, episodes.id))
      .where(eq(episodeCrew.crewMemberId, crewId))
      .orderBy(episodes.number);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link
              href="/crew"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Crew
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-medium">{member.name}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{member.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <CrewForm
            crewMember={member}
            trigger={<Button variant="outline">Edit</Button>}
          />
          <DeleteCrewButton id={member.id} name={member.name} />
        </div>
      </div>

      {/* Profile card */}
      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2 p-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Department
            </p>
            <Badge variant="secondary" className="mt-1">
              {member.department}
            </Badge>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Role Title
            </p>
            <p className="text-sm">{member.roleTitle}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p className="text-sm">{member.email ?? "Not provided"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Phone</p>
            <p className="text-sm">{member.phone ?? "Not provided"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Day Rate
            </p>
            <p className="text-sm">
              {member.dayRate
                ? `${formatCurrency(member.dayRate)}${member.paymentType === "per_episode" ? "/day (Per Episode)" : " (One-Time)"}`
                : "Not set"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Member Since
            </p>
            <p className="text-sm">
              {new Date(member.createdAt).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Episode assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Episode Assignments</CardTitle>
          <CardDescription>
            Episodes this crew member is assigned to
          </CardDescription>
        </CardHeader>
        <CardContent>
          {episodeAssignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Not assigned to any episodes yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Episode</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {episodeAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <Link
                        href={`/episodes/${assignment.episodeId}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        Ep. {assignment.episodeNumber} &mdash;{" "}
                        {assignment.episodeTitle}
                      </Link>
                    </TableCell>
                    <TableCell>{assignment.notes ?? "---"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
