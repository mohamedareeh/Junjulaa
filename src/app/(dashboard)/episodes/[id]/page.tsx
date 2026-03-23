import { db } from "@/db";
import {
  episodes,
  locations,
  castMembers,
  scenes,
  sceneCast,
  schedules,
  type Episode,
  type CastMember,
  type CrewMember,
  type Expense,
  type Schedule,
  type Document,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { EpisodeForm } from "@/components/episodes/episode-form";
import { SceneForm } from "@/components/scenes/scene-form";
import { DeleteSceneButton } from "@/components/scenes/delete-scene-button";
import { formatCurrency } from "@/lib/format";
import Link from "next/link";

type EpisodeWithRelations = Episode & {
  cast: Array<{
    id: number;
    roleName: string;
    scenes: string | null;
    notes: string | null;
    castMember: CastMember;
  }>;
  crew: Array<{
    id: number;
    notes: string | null;
    crewMember: CrewMember;
  }>;
  expenses: Expense[];
  schedules: Schedule[];
  documents: Document[];
  scenes: Array<{
    id: number;
    sceneNumber: number;
    title: string | null;
    description: string | null;
    locationId: number | null;
    props: string | null;
    timeOfDay: string | null;
    duration: string | null;
    continuitySceneId: number | null;
    cast: Array<{
      id: number;
      castMember: CastMember;
    }>;
  }>;
};

const statusColors: Record<string, string> = {
  pre_production: "bg-yellow-100 text-yellow-800",
  filming: "bg-blue-100 text-blue-800",
  post_production: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
};

const timeOfDayColors: Record<string, string> = {
  morning: "bg-yellow-100 text-yellow-800",
  afternoon: "bg-orange-100 text-orange-800",
  evening: "bg-purple-100 text-purple-800",
  night: "bg-blue-100 text-blue-800",
};

const timeOfDayLabels: Record<string, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  night: "Night",
};

const statusLabels: Record<string, string> = {
  pre_production: "Pre-Production",
  filming: "Filming",
  post_production: "Post-Production",
  completed: "Completed",
};

export default async function EpisodeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const episodeId = parseInt(id, 10);

  if (isNaN(episodeId)) {
    notFound();
  }

  let episode: EpisodeWithRelations | null = null;
  let episodeSchedules: {
    id: number;
    date: string;
    callTime: string | null;
    wrapTime: string | null;
    notes: string | null;
    locationName: string | null;
  }[] = [];
  let allLocations: { id: number; name: string }[] = [];
  let allCastMembers: { id: number; name: string }[] = [];

  try {
    const result = await db.query.episodes.findFirst({
      where: eq(episodes.id, episodeId),
      with: {
        cast: {
          with: {
            castMember: true,
          },
        },
        crew: {
          with: {
            crewMember: true,
          },
        },
        expenses: true,
        schedules: true,
        documents: true,
        scenes: {
          with: {
            cast: {
              with: {
                castMember: true,
              },
            },
          },
          orderBy: (scenes, { asc }) => [asc(scenes.sceneNumber)],
        },
      },
    });

    if (!result) {
      notFound();
    }

    episode = result as EpisodeWithRelations;

    // Fetch schedules with location names
    const scheduleRows = await db
      .select({
        id: schedules.id,
        date: schedules.date,
        callTime: schedules.callTime,
        wrapTime: schedules.wrapTime,
        notes: schedules.notes,
        locationName: locations.name,
      })
      .from(schedules)
      .leftJoin(locations, eq(schedules.locationId, locations.id))
      .where(eq(schedules.episodeId, episodeId))
      .orderBy(schedules.date);
    episodeSchedules = scheduleRows;

    allLocations = await db
      .select({ id: locations.id, name: locations.name })
      .from(locations)
      .orderBy(locations.name);

    allCastMembers = await db
      .select({ id: castMembers.id, name: castMembers.name })
      .from(castMembers)
      .orderBy(castMembers.name);
  } catch (error) {
    console.error("Episode detail error:", error);
    notFound();
  }

  const totalExpenses = episode.expenses.reduce(
    (sum, exp) => sum + Number(exp.amount),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link
              href="/episodes"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Episodes
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-medium">
              Episode {episode.number}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {episode.title}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${statusColors[episode.status] ?? ""}`}>
            {statusLabels[episode.status] ?? episode.status}
          </Badge>
          <EpisodeForm
            episode={episode}
            trigger={<Button variant="outline">Edit Episode</Button>}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="scenes">Scenes</TabsTrigger>
          <TabsTrigger value="cast">Cast</TabsTrigger>
          <TabsTrigger value="crew">Crew</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Episode Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Title
                  </p>
                  <p className="text-sm">{episode.title}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Episode Number
                  </p>
                  <p className="text-sm">{episode.number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Status
                  </p>
                  <Badge className={`${statusColors[episode.status] ?? ""}`}>
                    {statusLabels[episode.status] ?? episode.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Director
                  </p>
                  <p className="text-sm">{episode.director ?? "Not assigned"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Start Date
                  </p>
                  <p className="text-sm">{episode.startDate ?? "Not set"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    End Date
                  </p>
                  <p className="text-sm">{episode.endDate ?? "Not set"}</p>
                </div>
              </div>
              {episode.synopsis && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Synopsis
                  </p>
                  <p className="text-sm mt-1">{episode.synopsis}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scenes Tab */}
        <TabsContent value="scenes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Scenes</CardTitle>
                <CardDescription>
                  Scenes and cast assignments for scheduling
                </CardDescription>
              </div>
              <SceneForm
                episodeId={episode.id}
                locations={allLocations}
                castMembers={allCastMembers}
                allScenes={episode.scenes.map((s) => ({
                  id: s.id,
                  sceneNumber: s.sceneNumber,
                  title: s.title,
                }))}
                trigger={<Button variant="outline" size="sm">Add Scene</Button>}
              />
            </CardHeader>
            <CardContent>
              {episode.scenes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No scenes added yet. Add scenes to plan cast scheduling.
                </p>
              ) : (
                <div className="space-y-4">
                  {episode.scenes.map((scene) => (
                    <div
                      key={scene.id}
                      className="rounded-lg border p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono">
                              Scene {scene.sceneNumber}
                            </Badge>
                            {scene.title && (
                              <span className="text-sm font-medium">
                                {scene.title}
                              </span>
                            )}
                          </div>
                          {scene.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {scene.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {scene.timeOfDay && (
                              <Badge
                                className={`text-xs ${timeOfDayColors[scene.timeOfDay] ?? ""}`}
                              >
                                {timeOfDayLabels[scene.timeOfDay] ?? scene.timeOfDay}
                              </Badge>
                            )}
                            {scene.duration && (
                              <span className="text-xs text-muted-foreground">
                                Duration: {scene.duration}
                              </span>
                            )}
                            {scene.continuitySceneId && (
                              <span className="text-xs text-muted-foreground">
                                Continues from Scene{" "}
                                {episode.scenes.find(
                                  (s) => s.id === scene.continuitySceneId
                                )?.sceneNumber ?? scene.continuitySceneId}
                              </span>
                            )}
                          </div>
                          {scene.props && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Props: {scene.props}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <SceneForm
                            episodeId={episode.id}
                            scene={{
                              id: scene.id,
                              sceneNumber: scene.sceneNumber,
                              title: scene.title,
                              description: scene.description,
                              locationId: scene.locationId,
                              castMemberIds: scene.cast.map((sc) => sc.castMember.id),
                              props: scene.props,
                              timeOfDay: scene.timeOfDay,
                              duration: scene.duration,
                              continuitySceneId: scene.continuitySceneId,
                            }}
                            locations={allLocations}
                            castMembers={allCastMembers}
                            allScenes={episode.scenes.map((s) => ({
                              id: s.id,
                              sceneNumber: s.sceneNumber,
                              title: s.title,
                            }))}
                            trigger={
                              <Button variant="ghost" size="sm">
                                Edit
                              </Button>
                            }
                          />
                          <DeleteSceneButton sceneId={scene.id} episodeId={episode.id} />
                        </div>
                      </div>
                      {scene.cast.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">Cast:</span>
                          {scene.cast.map((sc) => (
                            <Badge key={sc.id} variant="secondary" className="text-xs">
                              {sc.castMember.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cast Tab */}
        <TabsContent value="cast">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Cast</CardTitle>
                <CardDescription>
                  Cast members assigned to this episode
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                Add Cast
              </Button>
            </CardHeader>
            <CardContent>
              {episode.cast.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No cast members assigned yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {episode.cast.map((ec) => (
                      <TableRow key={ec.id}>
                        <TableCell className="font-medium">
                          {ec.castMember.name}
                        </TableCell>
                        <TableCell>{ec.roleName}</TableCell>
                        <TableCell>
                          {ec.castMember.email ?? "—"}
                        </TableCell>
                        <TableCell>
                          {ec.castMember.phone ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Crew Tab */}
        <TabsContent value="crew">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Crew</CardTitle>
                <CardDescription>
                  Crew members assigned to this episode
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                Add Crew
              </Button>
            </CardHeader>
            <CardContent>
              {episode.crew.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No crew members assigned yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {episode.crew.map((ec) => (
                      <TableRow key={ec.id}>
                        <TableCell className="font-medium">
                          {ec.crewMember.name}
                        </TableCell>
                        <TableCell>{ec.crewMember.department}</TableCell>
                        <TableCell>{ec.crewMember.roleTitle}</TableCell>
                        <TableCell>
                          {ec.crewMember.email ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Expenses</CardTitle>
                <CardDescription>
                  All expenses for this episode
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                Add Expense
              </Button>
            </CardHeader>
            <CardContent>
              {episode.expenses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No expenses recorded yet.
                </p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {episode.expenses.map((exp) => (
                        <TableRow key={exp.id}>
                          <TableCell className="font-medium">
                            {exp.description}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {exp.category.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>{exp.date}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                exp.paymentStatus === "paid"
                                  ? "default"
                                  : exp.paymentStatus === "overdue"
                                    ? "destructive"
                                    : "secondary"
                              }
                              className="capitalize"
                            >
                              {exp.paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(exp.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-4 flex justify-end border-t pt-4">
                    <p className="text-sm font-medium">
                      Total: {formatCurrency(totalExpenses)}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Shoot Schedule</CardTitle>
              <CardDescription>
                Scheduled shoot dates for this episode
              </CardDescription>
            </CardHeader>
            <CardContent>
              {episodeSchedules.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No shoots scheduled yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {episodeSchedules.map((sched) => (
                    <div
                      key={sched.id}
                      className="flex items-start justify-between rounded-lg border p-4"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{sched.date}</p>
                        {sched.locationName && (
                          <p className="text-sm text-muted-foreground">
                            Location: {sched.locationName}
                          </p>
                        )}
                        {sched.notes && (
                          <p className="text-sm text-muted-foreground">
                            {sched.notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {sched.callTime && <p>Call: {sched.callTime}</p>}
                        {sched.wrapTime && <p>Wrap: {sched.wrapTime}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Documents</CardTitle>
                <CardDescription>
                  Scripts, contracts, and other documents
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                Upload Document
              </Button>
            </CardHeader>
            <CardContent>
              {episode.documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No documents uploaded yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Uploaded</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {episode.documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {doc.name}
                          </a>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {doc.type}
                          </Badge>
                        </TableCell>
                        <TableCell>v{doc.version}</TableCell>
                        <TableCell>
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
