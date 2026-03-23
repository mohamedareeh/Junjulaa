"use server";

import { db } from "@/db";
import { schedules } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createSchedule(formData: FormData) {
  try {
    const episodeId = formData.get("episodeId") as string;
    const locationId = formData.get("locationId") as string;
    const date = formData.get("date") as string;
    const callTime = formData.get("callTime") as string;
    const wrapTime = formData.get("wrapTime") as string;
    const notes = formData.get("notes") as string;

    await db.insert(schedules).values({
      episodeId: parseInt(episodeId, 10),
      locationId: locationId ? parseInt(locationId, 10) : null,
      date,
      callTime: callTime || null,
      wrapTime: wrapTime || null,
      notes: notes || null,
    });

    revalidatePath("/schedule");
  } catch (error) {
    console.error("Failed to create schedule:", error);
    throw new Error("Failed to create schedule");
  }
}

export async function updateSchedule(id: number, formData: FormData) {
  try {
    const episodeId = formData.get("episodeId") as string;
    const locationId = formData.get("locationId") as string;
    const date = formData.get("date") as string;
    const callTime = formData.get("callTime") as string;
    const wrapTime = formData.get("wrapTime") as string;
    const notes = formData.get("notes") as string;

    await db
      .update(schedules)
      .set({
        episodeId: parseInt(episodeId, 10),
        locationId: locationId ? parseInt(locationId, 10) : null,
        date,
        callTime: callTime || null,
        wrapTime: wrapTime || null,
        notes: notes || null,
      })
      .where(eq(schedules.id, id));

    revalidatePath("/schedule");
  } catch (error) {
    console.error("Failed to update schedule:", error);
    throw new Error("Failed to update schedule");
  }
}

export async function deleteSchedule(id: number) {
  try {
    await db.delete(schedules).where(eq(schedules.id, id));

    revalidatePath("/schedule");
  } catch (error) {
    console.error("Failed to delete schedule:", error);
    throw new Error("Failed to delete schedule");
  }
}
