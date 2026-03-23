"use server";

import { db } from "@/db";
import { castMembers, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";

export async function createCastMember(formData: FormData) {
  const name = formData.get("name") as string;
  const email = (formData.get("email") as string) || null;
  const phone = (formData.get("phone") as string) || null;
  const bio = (formData.get("bio") as string) || null;
  const dayRate = (formData.get("dayRate") as string) || null;
  const paymentType = (formData.get("paymentType") as "one_time" | "per_episode") || "one_time";

  const [castMember] = await db.insert(castMembers).values({
    name,
    email,
    phone,
    bio,
    dayRate,
    paymentType,
  }).returning();

  // Auto-create user account if email is provided
  if (email) {
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      // Link cast member to existing user
      await db
        .update(castMembers)
        .set({ userId: existingUser.id })
        .where(eq(castMembers.id, castMember.id));
    } else {
      // Create new user account
      const passwordHash = await hash("password123", 10);
      const [newUser] = await db
        .insert(users)
        .values({
          name,
          email,
          passwordHash,
          role: "crew",
        })
        .returning();

      // Link cast member to new user
      await db
        .update(castMembers)
        .set({ userId: newUser.id })
        .where(eq(castMembers.id, castMember.id));
    }
  }

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
