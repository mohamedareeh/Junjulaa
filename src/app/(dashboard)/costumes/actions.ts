"use server";

import { db } from "@/db";
import { costumes, costumeScenes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createCostume(formData: FormData) {
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const photoUrl = (formData.get("photoUrl") as string) || null;
  const castMemberId = formData.get("castMemberId")
    ? Number(formData.get("castMemberId"))
    : null;
  const episodeId = formData.get("episodeId")
    ? Number(formData.get("episodeId"))
    : null;
  const notes = (formData.get("notes") as string) || null;
  const sceneIds = formData.getAll("sceneIds").map(Number);

  const [costume] = await db
    .insert(costumes)
    .values({
      name,
      description,
      photoUrl,
      castMemberId,
      episodeId,
      notes,
    })
    .returning();

  if (sceneIds.length > 0) {
    await db.insert(costumeScenes).values(
      sceneIds.map((sceneId) => ({
        costumeId: costume.id,
        sceneId,
      }))
    );
  }

  revalidatePath("/costumes");
}

export async function updateCostume(id: number, formData: FormData) {
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const photoUrl = (formData.get("photoUrl") as string) || null;
  const castMemberId = formData.get("castMemberId")
    ? Number(formData.get("castMemberId"))
    : null;
  const episodeId = formData.get("episodeId")
    ? Number(formData.get("episodeId"))
    : null;
  const notes = (formData.get("notes") as string) || null;
  const sceneIds = formData.getAll("sceneIds").map(Number);

  await db
    .update(costumes)
    .set({
      name,
      description,
      photoUrl,
      castMemberId,
      episodeId,
      notes,
    })
    .where(eq(costumes.id, id));

  // Delete old scene associations and insert new ones
  await db.delete(costumeScenes).where(eq(costumeScenes.costumeId, id));

  if (sceneIds.length > 0) {
    await db.insert(costumeScenes).values(
      sceneIds.map((sceneId) => ({
        costumeId: id,
        sceneId,
      }))
    );
  }

  revalidatePath("/costumes");
}

export async function deleteCostume(id: number) {
  await db.delete(costumes).where(eq(costumes.id, id));

  revalidatePath("/costumes");
}
