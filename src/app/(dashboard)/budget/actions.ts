"use server";

import { db } from "@/db";
import { budgets } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function setBudget(formData: FormData) {
  try {
    const episodeId = formData.get("episodeId") as string;
    const category = formData.get("category") as
      | "equipment"
      | "location"
      | "catering"
      | "transport"
      | "costumes"
      | "props"
      | "post_production"
      | "talent"
      | "other";
    const allocatedAmount = formData.get("allocatedAmount") as string;

    const episodeIdNum = episodeId ? parseInt(episodeId, 10) : null;

    // Check for existing budget with same episode + category
    const conditions = [eq(budgets.category, category)];
    if (episodeIdNum !== null) {
      conditions.push(eq(budgets.episodeId, episodeIdNum));
    }

    const existing = await db
      .select()
      .from(budgets)
      .where(and(...conditions));

    // Filter for exact episodeId match (including null)
    const match = existing.find((b) => b.episodeId === episodeIdNum);

    if (match) {
      await db
        .update(budgets)
        .set({ allocatedAmount })
        .where(eq(budgets.id, match.id));
    } else {
      await db.insert(budgets).values({
        episodeId: episodeIdNum,
        category,
        allocatedAmount,
      });
    }

    revalidatePath("/budget");
  } catch (error) {
    console.error("Failed to set budget:", error);
    throw new Error("Failed to set budget");
  }
}

export async function deleteBudget(id: number) {
  try {
    await db.delete(budgets).where(eq(budgets.id, id));

    revalidatePath("/budget");
  } catch (error) {
    console.error("Failed to delete budget:", error);
    throw new Error("Failed to delete budget");
  }
}
