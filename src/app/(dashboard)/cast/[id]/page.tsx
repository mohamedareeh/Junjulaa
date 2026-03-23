import { db } from "@/db";
import { castMembers, episodeCast, episodes } from "@/db/schema";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CastForm } from "@/components/cast/cast-form";
import { DeleteCastButton } from "@/components/cast/delete-cast-button";
import { formatCurrency } from "@/lib/format";
import Link from "next/link";
import type { CastMember } from "@/db/schema";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default async function CastDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const castId = parseInt(id, 10);

  if (isNaN(castId)) {
    notFound();
  }

  let member: CastMember | undefined;
  let episodeAppearances: {
    id: number;
    roleName: string;
    scenes: string | null;
    notes: string | null;
    episodeNumber: number;
    episodeTitle: string;
    episodeId: number;
  }[] = [];

  try {
    const result = await db
      .select()
      .from(castMembers)
      .where(eq(castMembers.id, castId))
      .limit(1);

    if (result.length === 0) {
      notFound();
    }

    member = result[0];

    episodeAppearances = await db
      .select({
        id: episodeCast.id,
        roleName: episodeCast.roleName,
        scenes: episodeCast.scenes,
        notes: episodeCast.notes,
        episodeNumber: episodes.number,
        episodeTitle: episodes.title,
        episodeId: episodes.id,
      })
      .from(episodeCast)
      .innerJoin(episodes, eq(episodeCast.episodeId, episodes.id))
      .where(eq(episodeCast.castMemberId, castId))
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
              href="/cast"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Cast
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-medium">{member.name}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{member.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <CastForm
            castMember={member}
            trigger={<Button variant="outline">Edit</Button>}
          />
          <DeleteCastButton id={member.id} name={member.name} />
        </div>
      </div>

      {/* Profile card */}
      <Card>
        <CardContent className="flex flex-col sm:flex-row gap-6 p-6">
          <Avatar className="h-24 w-24 text-2xl shrink-0">
            {member.headshotUrl && (
              <AvatarImage src={member.headshotUrl} alt={member.name} />
            )}
            <AvatarFallback className="text-2xl">
              {getInitials(member.name)}
            </AvatarFallback>
          </Avatar>
          <div className="grid gap-4 sm:grid-cols-2 flex-1">
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
            {member.bio && (
              <div className="sm:col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Bio</p>
                <p className="text-sm mt-1">{member.bio}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Episode appearances */}
      <Card>
        <CardHeader>
          <CardTitle>Episode Appearances</CardTitle>
          <CardDescription>
            Episodes this cast member appears in
          </CardDescription>
        </CardHeader>
        <CardContent>
          {episodeAppearances.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Not assigned to any episodes yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Episode</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Scenes</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {episodeAppearances.map((appearance) => (
                  <TableRow key={appearance.id}>
                    <TableCell>
                      <Link
                        href={`/episodes/${appearance.episodeId}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        Ep. {appearance.episodeNumber} &mdash;{" "}
                        {appearance.episodeTitle}
                      </Link>
                    </TableCell>
                    <TableCell>{appearance.roleName}</TableCell>
                    <TableCell>{appearance.scenes ?? "---"}</TableCell>
                    <TableCell>{appearance.notes ?? "---"}</TableCell>
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
