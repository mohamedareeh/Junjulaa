"use server";

import { db } from "@/db";
import { castMembers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createCastMember(formData: FormData) {
  const name = formData.get("name") as string;
  const email = (formData.get("email") as string) || null;
  const phone = (formData.get("phone") as string) || null;
  const bio = (formData.get("bio") as string) || null;
  const dayRate = (formData.get("dayRate") as string) || null;
  const paymentType = (formData.get("paymentType") as "one_time" | "per_episode") || "one_time";

  await db.insert(castMembers).values({
    name,
    email,
    phone,
    bio,
    dayRate,
    paymentType,
  });

  revalidatePath("/cast");
}

export async function updateCastMember(id: number, formData: FormData) {
  const name = formData.get("name") as string;
  const email = (formData.get("email") as string) || null;
  const phone = (formData.get("phone") as string) || null;
  const bio = (formData.get("bio") as string) || null;
  const dayRate = (formData.get("dayRate") as string) || null;
  const paymentType = (formData.get("paymentType") as "one_time" | "per_episode") || "one_time";

  await db
    .update(castMembers)
    .set({
      name,
      email,
      phone,
      bio,
      dayRate,
      paymentType,
    })
    .where(eq(castMembers.id, id));

  revalidatePath("/cast");
  revalidatePath(`/cast/${id}`);
}

export async function deleteCastMember(id: number) {
  await db.delete(castMembers).where(eq(castMembers.id, id));

  revalidatePath("/cast");
}
