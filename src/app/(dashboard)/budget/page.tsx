import { db } from "@/db";
import { budgets, expenses, episodes } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { BudgetForm } from "@/components/expenses/budget-form";
import { DeleteBudgetButton } from "@/components/expenses/delete-budget-button";
import { formatCurrency } from "@/lib/format";

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
  if (percentage >= 80) return "text-yellow-600";
  return "text-green-600";
}

function getProgressColor(percentage: number): string {
  if (percentage > 100) return "[&_[data-slot=progress-indicator]]:bg-red-500";
  if (percentage >= 80)
    return "[&_[data-slot=progress-indicator]]:bg-yellow-500";
  return "[&_[data-slot=progress-indicator]]:bg-green-500";
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
      .select({
        id: episodes.id,
        number: episodes.number,
        title: episodes.title,
      })
      .from(episodes)
      .orderBy(episodes.number);

    // Fetch all budgets
    const allBudgets = await db.select().from(budgets);

    // Fetch spending by episode + category
    const spendingRows = await db
      .select({
        episodeId: expenses.episodeId,
        category: expenses.category,
        total: sql<string>`coalesce(sum(${expenses.amount}), 0)`,
      })
      .from(expenses)
      .groupBy(expenses.episodeId, expenses.category);

    // Build a spending lookup: "episodeId:category" -> amount
    const spendingMap = new Map<string, number>();
    for (const row of spendingRows) {
      const key = `${row.episodeId ?? "null"}:${row.category}`;
      spendingMap.set(key, parseFloat(row.total));
    }

    // Series-level budgets (episodeId is null)
    const seriesLevelBudgets = allBudgets.filter((b) => b.episodeId === null);
    // Total spending across all episodes per category (for series overview)
    const totalSpendingByCategory = new Map<string, number>();
    for (const [key, val] of spendingMap) {
      const cat = key.split(":")[1];
      totalSpendingByCategory.set(
        cat,
        (totalSpendingByCategory.get(cat) ?? 0) + val
      );
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

    // Per-episode budgets
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
        return {
          id: b.id,
          category: b.category,
          allocated,
          spent,
          remaining,
          percentage,
        };
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

    // If no series-level budgets, still compute grand totals from episode-level
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
  const grandPercentage =
    grandTotalAllocated > 0
      ? (grandTotalSpent / grandTotalAllocated) * 100
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budget</h1>
          <p className="text-muted-foreground mt-1">
            Track budget allocation and spending across the series
          </p>
        </div>
        <BudgetForm
          episodes={allEpisodes}
          trigger={<Button>Set Budget</Button>}
        />
      </div>

      {/* Overall Series Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Series Budget Overview</CardTitle>
          <CardDescription>
            Overall budget allocation vs actual spending
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Total Allocated</p>
              <p className="text-2xl font-bold">
                {formatCurrency(grandTotalAllocated)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className={`text-2xl font-bold ${getStatusColor(grandPercentage)}`}>
                {formatCurrency(grandTotalSpent)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p
                className={`text-2xl font-bold ${grandRemaining < 0 ? "text-red-600" : "text-green-600"}`}
              >
                {formatCurrency(grandRemaining)}
              </p>
            </div>
          </div>
          <Progress
            value={Math.min(grandPercentage, 100)}
            className={getProgressColor(grandPercentage)}
          />
        </CardContent>
      </Card>

      {/* Series-Level Budget Table */}
      {seriesBudgets.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Series Budget by Category</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <BudgetTable rows={seriesBudgets} />
          </CardContent>
        </Card>
      )}

      {/* Per-Episode Budget Breakdown */}
      {episodeBudgets.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Per-Episode Budgets</h2>
          {episodeBudgets.map((eb) => {
            const epPercentage =
              eb.totalAllocated > 0
                ? (eb.totalSpent / eb.totalAllocated) * 100
                : 0;
            return (
              <Card key={eb.episodeId}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>
                        Episode {eb.episodeNumber} - {eb.episodeTitle}
                      </CardTitle>
                      <CardDescription>
                        {formatCurrency(eb.totalSpent)} of{" "}
                        {formatCurrency(eb.totalAllocated)} spent (
                        {epPercentage.toFixed(1)}%)
                      </CardDescription>
                    </div>
                  </div>
                  <Progress
                    value={Math.min(epPercentage, 100)}
                    className={getProgressColor(epPercentage)}
                  />
                </CardHeader>
                <CardContent className="p-0">
                  <BudgetTable rows={eb.rows} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {seriesBudgets.length === 0 && episodeBudgets.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              No budgets set yet. Allocate your first budget to start tracking
              spending.
            </p>
            <BudgetForm
              episodes={allEpisodes}
              trigger={<Button>Set Budget</Button>}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function BudgetTable({ rows }: { rows: BudgetRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Allocated</TableHead>
          <TableHead className="text-right">Spent</TableHead>
          <TableHead className="text-right">Remaining</TableHead>
          <TableHead className="text-right">% Used</TableHead>
          <TableHead className="w-[50px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.category}>
            <TableCell>{categoryLabels[row.category] ?? row.category}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatCurrency(row.allocated)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatCurrency(row.spent)}
            </TableCell>
            <TableCell
              className={`text-right tabular-nums ${row.remaining < 0 ? "text-red-600" : ""}`}
            >
              {formatCurrency(row.remaining)}
            </TableCell>
            <TableCell
              className={`text-right tabular-nums font-medium ${getStatusColor(row.percentage)}`}
            >
              {row.percentage.toFixed(1)}%
            </TableCell>
            <TableCell>
              <DeleteBudgetButton id={row.id} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
