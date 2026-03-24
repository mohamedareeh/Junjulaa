import { db } from "@/db";
import { expenses, episodes, expenseCategories } from "@/db/schema";
import { desc, eq, sql, and } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { ExpenseFilters } from "@/components/expenses/expense-filters";
import { DeleteExpenseButton } from "@/components/expenses/delete-expense-button";
import { formatCurrency } from "@/lib/format";
import { Wallet, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

const statusColors: Record<string, string> = {
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  overdue: "border-red-200 bg-red-50 text-red-700",
};

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ episode?: string; category?: string }>;
}) {
  const params = await searchParams;

  let allEpisodes: { id: number; number: number; title: string }[] = [];
  let allCategories: { id: number; name: string }[] = [];
  let expenseRows: {
    id: number;
    episodeId: number | null;
    category: string;
    description: string;
    amount: string;
    date: string;
    paymentStatus: string;
    paymentType: string | null;
    episodeNumber: number | null;
  }[] = [];
  let totals = { total: 0, paid: 0, pending: 0, overdue: 0 };

  try {
    allEpisodes = await db
      .select({
        id: episodes.id,
        number: episodes.number,
        title: episodes.title,
      })
      .from(episodes)
      .orderBy(episodes.number);

    allCategories = await db
      .select({ id: expenseCategories.id, name: expenseCategories.name })
      .from(expenseCategories)
      .orderBy(expenseCategories.name);

    const conditions = [];
    if (params.episode) {
      conditions.push(eq(expenses.episodeId, parseInt(params.episode, 10)));
    }
    if (params.category) {
      conditions.push(eq(expenses.category, params.category));
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        id: expenses.id,
        episodeId: expenses.episodeId,
        category: expenses.category,
        description: expenses.description,
        amount: expenses.amount,
        date: expenses.date,
        paymentStatus: expenses.paymentStatus,
        paymentType: expenses.paymentType,
        episodeNumber: episodes.number,
      })
      .from(expenses)
      .leftJoin(episodes, eq(expenses.episodeId, episodes.id))
      .where(whereClause)
      .orderBy(desc(expenses.date));

    expenseRows = rows;

    for (const row of rows) {
      const amt = parseFloat(row.amount);
      totals.total += amt;
      if (row.paymentStatus === "paid") totals.paid += amt;
      else if (row.paymentStatus === "pending") totals.pending += amt;
      else if (row.paymentStatus === "overdue") totals.overdue += amt;
    }
  } catch {
    // DB not connected
  }

  const statCards = [
    { label: "Total Expenses", value: formatCurrency(totals.total), icon: Wallet, color: "bg-gray-900 text-white" },
    { label: "Paid", value: formatCurrency(totals.paid), icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
    { label: "Pending", value: formatCurrency(totals.pending), icon: Clock, color: "bg-amber-50 text-amber-600" },
    { label: "Overdue", value: formatCurrency(totals.overdue), icon: AlertTriangle, color: "bg-red-50 text-red-600" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Expenses</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage production expenses
          </p>
        </div>
        <ExpenseForm
          episodes={allEpisodes}
          categories={allCategories}
          trigger={<Button className="rounded-xl bg-gray-900 hover:bg-gray-800">Add Expense</Button>}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
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

      {/* Filters */}
      <ExpenseFilters episodes={allEpisodes} categories={allCategories} />

      {/* Expenses List */}
      <div className="card-shadow rounded-2xl bg-white">
        {expenseRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Wallet className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-400">
              No expenses found. Add your first expense to get started.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {expenseRows.map((row) => (
              <div key={row.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-gray-900 truncate">{row.description}</p>
                  <div className="mt-0.5 flex items-center gap-3 text-[11px] text-gray-400">
                    <span>{row.date}</span>
                    <span>{row.episodeNumber != null ? `Ep ${row.episodeNumber}` : "General"}</span>
                    <span className="capitalize">{row.category.replace("_", " ")}</span>
                    <Badge variant="outline" className="text-[10px] border-gray-200">
                      {row.paymentType === "per_episode" ? "Per Episode" : "One-Time"}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-[13px] font-semibold text-gray-900 tabular-nums">
                      {formatCurrency(row.amount)}
                    </p>
                    <Badge
                      variant="outline"
                      className={`mt-0.5 text-[10px] border ${statusColors[row.paymentStatus] ?? ""}`}
                    >
                      {row.paymentStatus}
                    </Badge>
                  </div>
                  <DeleteExpenseButton id={row.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
