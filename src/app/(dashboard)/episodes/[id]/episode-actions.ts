"use server";

import { db } from "@/db";
import { episodeCast, episodeCrew, castMembers, crewMembers, expenses, episodes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function addCastToEpisode(formData: FormData) {
  const episodeId = Number(formData.get("episodeId"));
  const castMemberId = Number(formData.get("castMemberId"));
  const roleName = formData.get("roleName") as string;

  await db.insert(episodeCast).values({ episodeId, castMemberId, roleName });

  // Auto-create expense for cast payment if they have a day rate
  const [castMember] = await db
    .select({ name: castMembers.name, dayRate: castMembers.dayRate, paymentType: castMembers.paymentType, episodeCount: castMembers.episodeCount })
    .from(castMembers)
    .where(eq(castMembers.id, castMemberId))
    .limit(1);

  if (castMember?.dayRate && parseFloat(castMember.dayRate) > 0) {
    const today = new Date().toISOString().split("T")[0];
    await db.insert(expenses).values({
      episodeId,
      category: "talent",
      description: `Cast payment: ${castMember.name} (${roleName})`,
      amount: castMember.dayRate,
      date: today,
      paymentType: castMember.paymentType,
      episodeCount: castMember.paymentType === "per_episode" ? (castMember.episodeCount ?? 10) : null,
      paymentStatus: "pending",
    });
    revalidatePath("/expenses");
  }

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

  // Auto-create expense for crew payment if they have a day rate
  const [crewMember] = await db
    .select({ name: crewMembers.name, dayRate: crewMembers.dayRate, paymentType: crewMembers.paymentType, episodeCount: crewMembers.episodeCount, roleTitle: crewMembers.roleTitle })
    .from(crewMembers)
    .where(eq(crewMembers.id, crewMemberId))
    .limit(1);

  if (crewMember?.dayRate && parseFloat(crewMember.dayRate) > 0) {
    const today = new Date().toISOString().split("T")[0];
    await db.insert(expenses).values({
      episodeId,
      category: "talent",
      description: `Crew payment: ${crewMember.name} (${crewMember.roleTitle})`,
      amount: crewMember.dayRate,
      date: today,
      paymentType: crewMember.paymentType,
      episodeCount: crewMember.paymentType === "per_episode" ? (crewMember.episodeCount ?? 10) : null,
      paymentStatus: "pending",
    });
    revalidatePath("/expenses");
  }

  revalidatePath(`/episodes/${episodeId}`);
}

export async function removeCrewFromEpisode(id: number, episodeId: number) {
  await db.delete(episodeCrew).where(eq(episodeCrew.id, id));
  revalidatePath(`/episodes/${episodeId}`);
}
