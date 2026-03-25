import { db } from "@/db";
import { budgets, expenses, episodes } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BudgetForm } from "@/components/expenses/budget-form";
import { DeleteBudgetButton } from "@/components/expenses/delete-budget-button";
import { formatCurrency } from "@/lib/format";
import { PiggyBank, TrendingUp, TrendingDown, Wallet } from "lucide-react";

const categoryLabels: Record<string, string> = {
  equipment: "Equipment",
  location: "Location",
  catering: "Catering",
  transport: "Transport",
  costumes: "Costumes",
  props: "Props",
  post_production: "Post-Production",
  talent: "Talent",
  other: "Other",
};

function getStatusColor(percentage: number): string {
  if (percentage > 100) return "text-red-600";
  if (percentage >= 80) return "text-amber-600";
  return "text-emerald-600";
}

function getProgressColor(percentage: number): string {
  if (percentage > 100) return "[&_[data-slot=progress-indicator]]:bg-red-500";
  if (percentage >= 80) return "[&_[data-slot=progress-indicator]]:bg-amber-500";
  return "[&_[data-slot=progress-indicator]]:bg-emerald-500";
}

interface BudgetRow {
  id: number;
  category: string;
  allocated: number;
  spent: number;
  remaining: number;
  percentage: number;
}

interface EpisodeBudgetData {
  episodeId: number;
  episodeNumber: number;
  episodeTitle: string;
  rows: BudgetRow[];
  totalAllocated: number;
  totalSpent: number;
}

export default async function BudgetPage() {
  let allEpisodes: { id: number; number: number; title: string }[] = [];
  let seriesBudgets: BudgetRow[] = [];
  let episodeBudgets: EpisodeBudgetData[] = [];
  let grandTotalAllocated = 0;
  let grandTotalSpent = 0;

  try {
    allEpisodes = await db
      .select({ id: episodes.id, number: episodes.number, title: episodes.title })
      .from(episodes)
      .orderBy(episodes.number);

    const allBudgets = await db.select().from(budgets);

    const spendingRows = await db
      .select({
        episodeId: expenses.episodeId,
        category: expenses.category,
        total: sql<string>`coalesce(sum(case when ${expenses.paymentType} = 'per_episode' then ${expenses.amount} * 10 else ${expenses.amount} end), 0)`,
      })
      .from(expenses)
      .groupBy(expenses.episodeId, expenses.category);

    const spendingMap = new Map<string, number>();
    for (const row of spendingRows) {
      const key = `${row.episodeId ?? "null"}:${row.category}`;
      spendingMap.set(key, parseFloat(row.total));
    }

    const seriesLevelBudgets = allBudgets.filter((b) => b.episodeId === null);
    const totalSpendingByCategory = new Map<string, number>();
    for (const [key, val] of spendingMap) {
      const cat = key.split(":")[1];
      totalSpendingByCategory.set(cat, (totalSpendingByCategory.get(cat) ?? 0) + val);
    }

    seriesBudgets = seriesLevelBudgets.map((b) => {
      const allocated = parseFloat(b.allocatedAmount);
      const spent = totalSpendingByCategory.get(b.category) ?? 0;
      const remaining = allocated - spent;
      const percentage = allocated > 0 ? (spent / allocated) * 100 : 0;
      grandTotalAllocated += allocated;
      grandTotalSpent += spent;
      return { id: b.id, category: b.category, allocated, spent, remaining, percentage };
    });

    for (const ep of allEpisodes) {
      const epBudgets = allBudgets.filter((b) => b.episodeId === ep.id);
      if (epBudgets.length === 0) continue;

      let totalAllocated = 0;
      let totalSpent = 0;

      const rows: BudgetRow[] = epBudgets.map((b) => {
        const allocated = parseFloat(b.allocatedAmount);
        const spent = spendingMap.get(`${ep.id}:${b.category}`) ?? 0;
        const remaining = allocated - spent;
        const percentage = allocated > 0 ? (spent / allocated) * 100 : 0;
        totalAllocated += allocated;
        totalSpent += spent;
        return { id: b.id, category: b.category, allocated, spent, remaining, percentage };
      });

      episodeBudgets.push({
        episodeId: ep.id,
        episodeNumber: ep.number,
        episodeTitle: ep.title,
        rows,
        totalAllocated,
        totalSpent,
      });
    }

    if (seriesBudgets.length === 0) {
      for (const eb of episodeBudgets) {
        grandTotalAllocated += eb.totalAllocated;
        grandTotalSpent += eb.totalSpent;
      }
    }
  } catch {
    // DB not connected
  }

  const grandRemaining = grandTotalAllocated - grandTotalSpent;
  const grandPercentage = grandTotalAllocated > 0 ? (grandTotalSpent / grandTotalAllocated) * 100 : 0;

  const overviewCards = [
    { label: "Total Allocated", value: formatCurrency(grandTotalAllocated), icon: Wallet, color: "bg-gray-900 text-white" },
    { label: "Total Spent", value: formatCurrency(grandTotalSpent), icon: TrendingUp, color: "bg-blue-50 text-blue-600" },
    { label: "Remaining", value: formatCurrency(grandRemaining), icon: TrendingDown, color: grandRemaining >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Budget</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track budget allocation and spending
          </p>
        </div>
        <BudgetForm
          episodes={allEpisodes}
          trigger={<Button className="rounded-xl bg-gray-900 hover:bg-gray-800">Set Budget</Button>}
        />
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {overviewCards.map((stat) => (
          <div key={stat.label} className="card-shadow rounded-2xl bg-white p-5">
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

      {/* Progress Bar */}
      <div className="card-shadow rounded-2xl bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-medium text-gray-500">Overall Budget Usage</p>
          <span className={`text-[13px] font-semibold ${getStatusColor(grandPercentage)}`}>
            {grandPercentage.toFixed(1)}%
          </span>
        </div>
        <Progress
          value={Math.min(grandPercentage, 100)}
          className={`h-2 ${getProgressColor(grandPercentage)}`}
        />
      </div>

      {/* Series-Level Budget */}
      {seriesBudgets.length > 0 && (
        <div className="card-shadow rounded-2xl bg-white p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Series Budget by Category</h2>
          <BudgetGrid rows={seriesBudgets} />
        </div>
      )}

      {/* Per-Episode Budgets */}
      {episodeBudgets.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Per-Episode Budgets</h2>
          {episodeBudgets.map((eb) => {
            const epPercentage = eb.totalAllocated > 0 ? (eb.totalSpent / eb.totalAllocated) * 100 : 0;
            return (
              <div key={eb.episodeId} className="card-shadow rounded-2xl bg-white p-6">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-[14px] font-semibold text-gray-900">
                    Episode {eb.episodeNumber} — {eb.episodeTitle}
                  </h3>
                  <span className={`text-[13px] font-semibold ${getStatusColor(epPercentage)}`}>
                    {epPercentage.toFixed(1)}%
                  </span>
                </div>
                <p className="text-[12px] text-gray-500 mb-3">
                  {formatCurrency(eb.totalSpent)} of {formatCurrency(eb.totalAllocated)} spent
                </p>
                <Progress
                  value={Math.min(epPercentage, 100)}
                  className={`h-1.5 mb-4 ${getProgressColor(epPercentage)}`}
                />
                <BudgetGrid rows={eb.rows} />
              </div>
            );
          })}
        </div>
      )}

      {seriesBudgets.length === 0 && episodeBudgets.length === 0 && (
        <div className="card-shadow rounded-2xl bg-white">
          <div className="flex flex-col items-center justify-center py-16">
            <PiggyBank className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-400 mb-4">
              No budgets set yet. Allocate your first budget to start tracking.
            </p>
            <BudgetForm
              episodes={allEpisodes}
              trigger={<Button className="rounded-xl bg-gray-900 hover:bg-gray-800">Set Budget</Button>}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function BudgetGrid({ rows }: { rows: BudgetRow[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((row) => (
        <div key={row.category} className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium text-gray-700">
              {categoryLabels[row.category] ?? row.category}
            </span>
            <DeleteBudgetButton id={row.id} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-gray-900 tabular-nums">
              {formatCurrency(row.spent)}
            </span>
            <span className="text-[12px] text-gray-400">
              of {formatCurrency(row.allocated)}
            </span>
          </div>
          <Progress
            value={Math.min(row.percentage, 100)}
            className={`mt-2 h-1.5 ${getProgressColor(row.percentage)}`}
          />
          <div className="mt-1.5 flex items-center justify-between text-[11px]">
            <span className={`font-medium ${row.remaining < 0 ? "text-red-600" : "text-gray-400"}`}>
              {formatCurrency(row.remaining)} left
            </span>
            <span className={`font-semibold ${getStatusColor(row.percentage)}`}>
              {row.percentage.toFixed(0)}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
