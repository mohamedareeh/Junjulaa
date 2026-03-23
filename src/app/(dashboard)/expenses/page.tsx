import { db } from "@/db";
import { expenses, episodes, expenseCategories } from "@/db/schema";
import { desc, eq, sql, and } from "drizzle-orm";
import {
  Card,
  CardContent,
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
import { ExpenseForm } from "@/components/expenses/expense-form";
import { ExpenseFilters } from "@/components/expenses/expense-filters";
import { DeleteExpenseButton } from "@/components/expenses/delete-expense-button";
import { formatCurrency } from "@/lib/format";

const statusColors: Record<string, string> = {
  paid: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  overdue: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  paid: "Paid",
  pending: "Pending",
  overdue: "Overdue",
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

    // Build filter conditions
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

    // Calculate totals from filtered results
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage production expenses
          </p>
        </div>
        <ExpenseForm
          episodes={allEpisodes}
          categories={allCategories}
          trigger={<Button>Add Expense</Button>}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totals.total)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(totals.paid)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">
              {formatCurrency(totals.pending)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(totals.overdue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <ExpenseFilters episodes={allEpisodes} categories={allCategories} />

      {/* Expenses Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Episode</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenseRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground py-8"
                  >
                    No expenses found. Add your first expense to get started.
                  </TableCell>
                </TableRow>
              ) : (
                expenseRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap">
                      {row.date}
                    </TableCell>
                    <TableCell>
                      {row.episodeNumber != null
                        ? `Ep ${row.episodeNumber}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {row.category}
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {row.description}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(row.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-xs"
                      >
                        {row.paymentType === "per_episode" ? "Per Episode" : "One-Time"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-xs ${statusColors[row.paymentStatus] ?? ""}`}
                      >
                        {statusLabels[row.paymentStatus] ?? row.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DeleteExpenseButton id={row.id} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
