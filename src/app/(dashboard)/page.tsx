import { db } from "@/db";
import {
  episodes,
  expenses,
  budgets,
  schedules,
  locations,
  scenes,
} from "@/db/schema";
import { eq, desc, sql, count, sum, gte } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import Link from "next/link";
import {
  Film,
  CheckCircle2,
  Wallet,
  TrendingDown,
  ArrowUpRight,
  Calendar,
  MapPin,
  Clock,
  ChevronRight,
} from "lucide-react";
import { DashboardShoots } from "./dashboard-shoots";

const statusColors: Record<string, string> = {
  pre_production: "bg-amber-50 text-amber-700 border-amber-200",
  filming: "bg-blue-50 text-blue-700 border-blue-200",
  post_production: "bg-violet-50 text-violet-700 border-violet-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
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
    date: string | null;
    episodeNumber: number | null;
  }[] = [];
  let upcomingShoots: {
    id: number;
    date: string;
    callTime: string | null;
    wrapTime: string | null;
    notes: string | null;
    episodeId: number;
    episodeTitle: string;
    episodeNumber: number;
    locationName: string | null;
    sceneNumber: number | null;
    sceneTitle: string | null;
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
        episodeId: episodes.id,
        episodeTitle: episodes.title,
        episodeNumber: episodes.number,
        locationName: locations.name,
        sceneNumber: scenes.sceneNumber,
        sceneTitle: scenes.title,
      })
      .from(schedules)
      .innerJoin(episodes, eq(schedules.episodeId, episodes.id))
      .leftJoin(locations, eq(schedules.locationId, locations.id))
      .leftJoin(scenes, eq(schedules.sceneId, scenes.id))
      .where(gte(schedules.date, today))
      .orderBy(schedules.date)
      .limit(5);
    upcomingShoots = shootRows;
  } catch {
    // DB not connected — show empty state
  }

  const totalEpisodes = allEpisodes.length || 10;
  const budgetNum = parseFloat(totalBudget) || 0;
  const spentNum = parseFloat(totalSpent) || 0;
  const remaining = budgetNum - spentNum;

  const statCards = [
    {
      label: "Total Episodes",
      value: totalEpisodes.toString(),
      icon: Film,
      color: "bg-gray-900 text-white",
      iconColor: "text-white",
    },
    {
      label: "Completed",
      value: completedCount.toString(),
      icon: CheckCircle2,
      color: "bg-emerald-50 text-emerald-600",
      iconColor: "text-emerald-500",
    },
    {
      label: "Total Budget",
      value: formatCurrency(totalBudget),
      icon: Wallet,
      color: "bg-blue-50 text-blue-600",
      iconColor: "text-blue-500",
    },
    {
      label: "Remaining",
      value: formatCurrency(remaining.toString()),
      icon: TrendingDown,
      color: remaining >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600",
      iconColor: remaining >= 0 ? "text-emerald-500" : "text-red-500",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your production progress
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="card-shadow rounded-2xl bg-white p-5 transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium text-gray-500">{stat.label}</p>
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Episode Progress */}
      <div className="card-shadow rounded-2xl bg-white p-6">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-gray-900">Episode Progress</h2>
          <p className="text-sm text-gray-500">Status of all episodes in the series</p>
        </div>
        {allEpisodes.length === 0 ? (
          <p className="text-sm text-gray-400">
            No episodes found. Add episodes to get started.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {allEpisodes.map((ep) => (
              <Link
                key={ep.id}
                href={`/episodes/${ep.id}`}
                className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 p-3.5 transition-colors hover:bg-gray-100/80 hover:border-gray-200"
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-gray-900 truncate">
                    Ep {ep.number}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">{ep.title}</p>
                </div>
                <Badge
                  variant="outline"
                  className={`ml-2 shrink-0 border text-[10px] font-medium ${statusColors[ep.status] ?? ""}`}
                >
                  {statusLabels[ep.status] ?? ep.status}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Expenses */}
        <div className="card-shadow rounded-2xl bg-white p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Recent Expenses</h2>
              <p className="text-sm text-gray-500">Last 5 recorded</p>
            </div>
            <a href="/expenses" className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors">
              See all <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
          {recentExpenses.length === 0 ? (
            <p className="text-sm text-gray-400">
              No expenses recorded yet.
            </p>
          ) : (
            <div className="space-y-3">
              {recentExpenses.map((exp) => (
                <Link key={exp.id} href="/expenses" className="flex items-center justify-between rounded-xl bg-gray-50/80 px-4 py-3 transition-colors hover:bg-gray-100/80">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-gray-900 truncate">{exp.description}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="text-[11px] text-gray-400 capitalize">{exp.category.replace("_", " ")}</span>
                      <span className="text-[11px] text-gray-400">{exp.episodeNumber ? `Ep ${exp.episodeNumber}` : "General"}</span>
                    </div>
                  </div>
                  <div className="text-right ml-3">
                    <p className="text-[13px] font-semibold text-gray-900">{formatCurrency(exp.amount)}</p>
                    <Badge
                      variant="outline"
                      className={`mt-0.5 text-[10px] border ${
                        exp.paymentStatus === "paid"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : exp.paymentStatus === "overdue"
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                      }`}
                    >
                      {exp.paymentStatus}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Shoots */}
        <div className="card-shadow rounded-2xl bg-white p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Upcoming Shoots</h2>
              <p className="text-sm text-gray-500">Next scheduled dates</p>
            </div>
            <a href="/schedule" className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors">
              See all <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
          <DashboardShoots shoots={upcomingShoots} />
        </div>
      </div>
    </div>
  );
}
