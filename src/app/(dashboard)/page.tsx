import { db } from "@/db";
import {
  episodes,
  expenses,
  budgets,
  schedules,
  locations,
} from "@/db/schema";
import { eq, desc, sql, count, sum, gte } from "drizzle-orm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";

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

export default async function DashboardPage() {
  let allEpisodes: (typeof episodes.$inferSelect)[] = [];
  let completedCount = 0;
  let totalBudget = "0";
  let totalSpent = "0";
  let recentExpenses: {
    id: number;
    description: string;
    category: string;
    amount: string;
    paymentStatus: string;
    date: string;
    episodeNumber: number | null;
  }[] = [];
  let upcomingShoots: {
    id: number;
    date: string;
    callTime: string | null;
    wrapTime: string | null;
    notes: string | null;
    episodeTitle: string;
    episodeNumber: number;
    locationName: string | null;
  }[] = [];

  try {
    allEpisodes = await db.select().from(episodes).orderBy(episodes.number);

    const [completedResult] = await db
      .select({ value: count() })
      .from(episodes)
      .where(eq(episodes.status, "completed"));
    completedCount = completedResult?.value ?? 0;

    const [budgetResult] = await db
      .select({ value: sum(budgets.allocatedAmount) })
      .from(budgets);
    totalBudget = budgetResult?.value ?? "0";

    const [spentResult] = await db
      .select({ value: sum(expenses.amount) })
      .from(expenses);
    totalSpent = spentResult?.value ?? "0";

    recentExpenses = await db
      .select({
        id: expenses.id,
        description: expenses.description,
        category: expenses.category,
        amount: expenses.amount,
        paymentStatus: expenses.paymentStatus,
        date: expenses.date,
        episodeNumber: episodes.number,
      })
      .from(expenses)
      .leftJoin(episodes, eq(expenses.episodeId, episodes.id))
      .orderBy(desc(expenses.date))
      .limit(5);

    const today = new Date().toISOString().split("T")[0];
    const shootRows = await db
      .select({
        id: schedules.id,
        date: schedules.date,
        callTime: schedules.callTime,
        wrapTime: schedules.wrapTime,
        notes: schedules.notes,
        episodeTitle: episodes.title,
        episodeNumber: episodes.number,
        locationName: locations.name,
      })
      .from(schedules)
      .innerJoin(episodes, eq(schedules.episodeId, episodes.id))
      .leftJoin(locations, eq(schedules.locationId, locations.id))
      .where(gte(schedules.date, today))
      .orderBy(schedules.date)
      .limit(5);
    upcomingShoots = shootRows;
  } catch {
    // DB not connected — show empty state
  }

  const totalEpisodes = allEpisodes.length || 10;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Film Series Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Overview of your production progress
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Episodes</CardDescription>
            <CardTitle className="text-3xl">{totalEpisodes}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Episodes Completed</CardDescription>
            <CardTitle className="text-3xl">{completedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Budget</CardDescription>
            <CardTitle className="text-3xl">
              {formatCurrency(totalBudget)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Spent</CardDescription>
            <CardTitle className="text-3xl">
              {formatCurrency(totalSpent)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Episode Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Episode Progress</CardTitle>
          <CardDescription>Status of all episodes in the series</CardDescription>
        </CardHeader>
        <CardContent>
          {allEpisodes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No episodes found. Add episodes to get started.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {allEpisodes.map((ep) => (
                <div
                  key={ep.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      Ep {ep.number}: {ep.title}
                    </p>
                  </div>
                  <Badge
                    className={`ml-2 shrink-0 ${statusColors[ep.status] ?? ""}`}
                  >
                    {statusLabels[ep.status] ?? ep.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Expenses */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
            <CardDescription>Last 5 recorded expenses</CardDescription>
          </CardHeader>
          <CardContent>
            {recentExpenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No expenses recorded yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Episode</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentExpenses.map((exp) => (
                    <TableRow key={exp.id}>
                      <TableCell className="font-medium truncate max-w-[180px]">
                        {exp.description}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {exp.episodeNumber ? `Ep ${exp.episodeNumber}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {exp.category.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            exp.paymentStatus === "paid"
                              ? "bg-green-100 text-green-800"
                              : exp.paymentStatus === "overdue"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {exp.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(exp.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Shoots */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Shoots</CardTitle>
            <CardDescription>Next 5 scheduled shoot dates</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingShoots.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No upcoming shoots scheduled.
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingShoots.map((shoot) => (
                  <div
                    key={shoot.id}
                    className="flex items-start justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        Ep {shoot.episodeNumber}: {shoot.episodeTitle}
                      </p>
                      {shoot.locationName && (
                        <p className="text-xs text-muted-foreground">
                          {shoot.locationName}
                        </p>
                      )}
                      {(shoot.callTime || shoot.wrapTime) && (
                        <p className="text-xs text-muted-foreground">
                          {shoot.callTime && `Call: ${shoot.callTime}`}
                          {shoot.callTime && shoot.wrapTime && " — "}
                          {shoot.wrapTime && `Wrap: ${shoot.wrapTime}`}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline">{shoot.date}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
