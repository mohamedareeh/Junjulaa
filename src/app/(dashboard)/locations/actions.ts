"use server";

import { db } from "@/db";
import { locations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createLocation(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const address = formData.get("address") as string;
    const permitInfo = formData.get("permitInfo") as string;
    const costPerDay = formData.get("costPerDay") as string;
    const notes = formData.get("notes") as string;

    await db.insert(locations).values({
      name,
      address: address || null,
      permitInfo: permitInfo || null,
      costPerDay: costPerDay || null,
      notes: notes || null,
    });

    revalidatePath("/locations");
  } catch (error) {
    console.error("Failed to create location:", error);
    throw new Error("Failed to create location");
  }
}

export async function updateLocation(id: number, formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const address = formData.get("address") as string;
    const permitInfo = formData.get("permitInfo") as string;
    const costPerDay = formData.get("costPerDay") as string;
    const notes = formData.get("notes") as string;

    await db
      .update(locations)
      .set({
        name,
        address: address || null,
        permitInfo: permitInfo || null,
        costPerDay: costPerDay || null,
        notes: notes || null,
      })
      .where(eq(locations.id, id));

    revalidatePath("/locations");
  } catch (error) {
    console.error("Failed to update location:", error);
    throw new Error("Failed to update location");
  }
}

export async function deleteLocation(id: number) {
  try {
    await db.delete(locations).where(eq(locations.id, id));

    revalidatePath("/locations");
  } catch (error) {
    console.error("Failed to delete location:", error);
    throw new Error("Failed to delete location");
  }
}
