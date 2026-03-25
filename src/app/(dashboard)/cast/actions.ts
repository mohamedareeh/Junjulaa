"use server";

import { db } from "@/db";
import { castMembers, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";

function generateUsername(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ".").replace(/[^a-z0-9.]/g, "");
}

async function getUniqueUsername(base: string): Promise<string> {
  const [existing] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.username, base));

  if (existing.count === 0) return base;

  // Append a number
  for (let i = 2; i <= 100; i++) {
    const candidate = `${base}${i}`;
    const [check] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.username, candidate));
    if (check.count === 0) return candidate;
  }
  return `${base}${Date.now()}`;
}

async function ensureUserAccount(name: string, email: string, castMemberId: number) {
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    await db
      .update(castMembers)
      .set({ userId: existingUser.id })
      .where(eq(castMembers.id, castMemberId));
  } else {
    const username = await getUniqueUsername(generateUsername(name));
    const passwordHash = await hash("password123", 10);
    const [newUser] = await db
      .insert(users)
      .values({ name, username, email, passwordHash, role: "crew" })
      .returning();

    await db
      .update(castMembers)
      .set({ userId: newUser.id })
      .where(eq(castMembers.id, castMemberId));
  }
}

export async function createCastMember(formData: FormData) {
  const name = formData.get("name") as string;
  const characterName = (formData.get("characterName") as string) || null;
  const email = (formData.get("email") as string) || null;
  const phone = (formData.get("phone") as string) || null;
  const bio = (formData.get("bio") as string) || null;
  const dayRate = (formData.get("dayRate") as string) || null;
  const paymentType = (formData.get("paymentType") as "one_time" | "per_episode") || "one_time";

  const [castMember] = await db.insert(castMembers).values({
    name, characterName, email, phone, bio, dayRate, paymentType,
  }).returning();

  if (email) {
    await ensureUserAccount(name, email, castMember.id);
  }

  revalidatePath("/cast");
}

export async function updateCastMember(id: number, formData: FormData) {
  const name = formData.get("name") as string;
  const characterName = (formData.get("characterName") as string) || null;
  const email = (formData.get("email") as string) || null;
  const phone = (formData.get("phone") as string) || null;
  const bio = (formData.get("bio") as string) || null;
  const dayRate = (formData.get("dayRate") as string) || null;
  const paymentType = (formData.get("paymentType") as "one_time" | "per_episode") || "one_time";
  const username = (formData.get("username") as string) || null;

  await db
    .update(castMembers)
    .set({ name, characterName, email, phone, bio, dayRate, paymentType })
    .where(eq(castMembers.id, id));

  // Handle username update if provided
  if (username) {
    const [member] = await db
      .select({ userId: castMembers.userId })
      .from(castMembers)
      .where(eq(castMembers.id, id))
      .limit(1);

    if (member?.userId) {
      // Check username is unique (excluding current user)
      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (!existing || existing.id === member.userId) {
        await db
          .update(users)
          .set({ username, name })
          .where(eq(users.id, member.userId));
      }
    }
  }

  // Create user account if email provided and no account yet
  if (email) {
    const [member] = await db
      .select({ userId: castMembers.userId })
      .from(castMembers)
      .where(eq(castMembers.id, id))
      .limit(1);

    if (!member?.userId) {
      await ensureUserAccount(name, email, id);
    }
  }

  revalidatePath("/cast");
  revalidatePath(`/cast/${id}`);
}

export async function deleteCastMember(id: number) {
  await db.delete(castMembers).where(eq(castMembers.id, id));
  revalidatePath("/cast");
}
