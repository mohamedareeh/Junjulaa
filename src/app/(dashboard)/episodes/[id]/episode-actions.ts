"use server";

import { db } from "@/db";
import { episodeCast, episodeCrew } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function addCastToEpisode(formData: FormData) {
  const episodeId = Number(formData.get("episodeId"));
  const castMemberId = Number(formData.get("castMemberId"));
  const roleName = formData.get("roleName") as string;

  await db.insert(episodeCast).values({ episodeId, castMemberId, roleName });
  revalidatePath(`/episodes/${episodeId}`);
}

export async function removeCastFromEpisode(id: number, episodeId: number) {
  await db.delete(episodeCast).where(eq(episodeCast.id, id));
  revalidatePath(`/episodes/${episodeId}`);
}

export async function addCrewToEpisode(formData: FormData) {
  const episodeId = Number(formData.get("episodeId"));
  const crewMemberId = Number(formData.get("crewMemberId"));
  const notes = (formData.get("notes") as string) || null;

  await db.insert(episodeCrew).values({ episodeId, crewMemberId, notes });
  revalidatePath(`/episodes/${episodeId}`);
}

export async function removeCrewFromEpisode(id: number, episodeId: number) {
  await db.delete(episodeCrew).where(eq(episodeCrew.id, id));
  revalidatePath(`/episodes/${episodeId}`);
}
