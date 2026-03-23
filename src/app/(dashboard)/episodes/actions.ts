"use server";

import { db } from "@/db";
import { episodes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createEpisode(formData: FormData) {
  const number = parseInt(formData.get("number") as string, 10);
  const title = formData.get("title") as string;
  const synopsis = (formData.get("synopsis") as string) || null;
  const status = formData.get("status") as
    | "pre_production"
    | "filming"
    | "post_production"
    | "completed";
  const director = (formData.get("director") as string) || null;
  const startDate = (formData.get("startDate") as string) || null;
  const endDate = (formData.get("endDate") as string) || null;

  await db.insert(episodes).values({
    number,
    title,
    synopsis,
    status,
    director,
    startDate,
    endDate,
  });

  revalidatePath("/episodes");
}

export async function updateEpisode(id: number, formData: FormData) {
  const number = parseInt(formData.get("number") as string, 10);
  const title = formData.get("title") as string;
  const synopsis = (formData.get("synopsis") as string) || null;
  const status = formData.get("status") as
    | "pre_production"
    | "filming"
    | "post_production"
    | "completed";
  const director = (formData.get("director") as string) || null;
  const startDate = (formData.get("startDate") as string) || null;
  const endDate = (formData.get("endDate") as string) || null;

  await db
    .update(episodes)
    .set({
      number,
      title,
      synopsis,
      status,
      director,
      startDate,
      endDate,
    })
    .where(eq(episodes.id, id));

  revalidatePath("/episodes");
  revalidatePath(`/episodes/${id}`);
}

export async function deleteEpisode(id: number) {
  await db.delete(episodes).where(eq(episodes.id, id));

  revalidatePath("/episodes");
}
