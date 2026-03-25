"use server";

import { db } from "@/db";
import { expenses, expenseCategories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createExpense(formData: FormData) {
  const episodeId = formData.get("episodeId") as string;
  const category = formData.get("category") as string;
  const description = formData.get("description") as string;
  const amount = formData.get("amount") as string;
  const date = formData.get("date") as string;
  const paymentStatus = formData.get("paymentStatus") as "paid" | "pending" | "overdue";
  const paymentType = formData.get("paymentType") as "one_time" | "per_episode";
  const episodeCountStr = formData.get("episodeCount") as string;
  const episodeCount = paymentType === "per_episode" && episodeCountStr ? parseInt(episodeCountStr, 10) : null;

  await db.insert(expenses).values({
    episodeId: episodeId ? parseInt(episodeId, 10) : null,
    category,
    description,
    amount,
    date: date || null,
    paymentStatus,
    paymentType,
    episodeCount,
  });

  revalidatePath("/expenses");
  revalidatePath("/");
}

export async function updateExpense(id: number, formData: FormData) {
  const episodeId = formData.get("episodeId") as string;
  const category = formData.get("category") as string;
  const description = formData.get("description") as string;
  const amount = formData.get("amount") as string;
  const date = formData.get("date") as string;
  const paymentStatus = formData.get("paymentStatus") as "paid" | "pending" | "overdue";
  const paymentType = formData.get("paymentType") as "one_time" | "per_episode";
  const episodeCountStr = formData.get("episodeCount") as string;
  const episodeCount = paymentType === "per_episode" && episodeCountStr ? parseInt(episodeCountStr, 10) : null;

  await db
    .update(expenses)
    .set({
      episodeId: episodeId ? parseInt(episodeId, 10) : null,
      category,
      description,
      amount,
      date: date || null,
      paymentStatus,
      paymentType,
      episodeCount,
    })
    .where(eq(expenses.id, id));

  revalidatePath("/expenses");
  revalidatePath("/");
}

export async function deleteExpense(id: number) {
  await db.delete(expenses).where(eq(expenses.id, id));
  revalidatePath("/expenses");
}

export async function addCategory(name: string) {
  const [result] = await db
    .insert(expenseCategories)
    .values({ name })
    .returning();
  revalidatePath("/expenses");
  return result;
}

export async function deleteCategory(id: number) {
  await db.delete(expenseCategories).where(eq(expenseCategories.id, id));
  revalidatePath("/expenses");
}
