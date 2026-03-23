"use server";

import { db } from "@/db";
import { scenes, sceneCast } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createScene(formData: FormData) {
  const episodeId = Number(formData.get("episodeId"));
  const sceneNumber = Number(formData.get("sceneNumber"));
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const locationId = formData.get("locationId")
    ? Number(formData.get("locationId"))
    : null;
  const castMemberIds = formData.getAll("castMemberIds").map(Number);

  const [scene] = await db
    .insert(scenes)
    .values({ episodeId, sceneNumber, title, description, locationId })
    .returning();

  if (castMemberIds.length > 0) {
    await db
      .insert(sceneCast)
      .values(castMemberIds.map((castMemberId) => ({ sceneId: scene.id, castMemberId })));
  }

  revalidatePath(`/episodes/${episodeId}`);
}

export async function updateScene(sceneId: number, formData: FormData) {
  const episodeId = Number(formData.get("episodeId"));
  const sceneNumber = Number(formData.get("sceneNumber"));
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const locationId = formData.get("locationId")
    ? Number(formData.get("locationId"))
    : null;
  const castMemberIds = formData.getAll("castMemberIds").map(Number);

  await db
    .update(scenes)
    .set({ sceneNumber, title, description, locationId })
    .where(eq(scenes.id, sceneId));

  // Replace cast assignments
  await db.delete(sceneCast).where(eq(sceneCast.sceneId, sceneId));
  if (castMemberIds.length > 0) {
    await db
      .insert(sceneCast)
      .values(castMemberIds.map((castMemberId) => ({ sceneId, castMemberId })));
  }

  revalidatePath(`/episodes/${episodeId}`);
}

export async function deleteScene(sceneId: number, episodeId: number) {
  await db.delete(scenes).where(eq(scenes.id, sceneId));
  revalidatePath(`/episodes/${episodeId}`);
}
