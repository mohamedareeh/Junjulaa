"use server";

import { db } from "@/db";
import { crewMembers, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";

async function ensureUserAccount(name: string, email: string, crewMemberId: number) {
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    await db
      .update(crewMembers)
      .set({ userId: existingUser.id })
      .where(eq(crewMembers.id, crewMemberId));
  } else {
    const passwordHash = await hash("password123", 10);
    const [newUser] = await db
      .insert(users)
      .values({ name, email, passwordHash, role: "crew" })
      .returning();

    await db
      .update(crewMembers)
      .set({ userId: newUser.id })
      .where(eq(crewMembers.id, crewMemberId));
  }
}

export async function createCrewMember(formData: FormData) {
  const name = formData.get("name") as string;
  const email = (formData.get("email") as string) || null;
  const phone = (formData.get("phone") as string) || null;
  const department = formData.get("department") as string;
  const roleTitle = formData.get("roleTitle") as string;
  const dayRate = (formData.get("dayRate") as string) || null;
  const paymentType = (formData.get("paymentType") as "one_time" | "per_episode") || "one_time";

  const [crewMember] = await db.insert(crewMembers).values({
    name, email, phone, department, roleTitle, dayRate, paymentType,
  }).returning();

  if (email) {
    await ensureUserAccount(name, email, crewMember.id);
  }

  revalidatePath("/crew");
}

export async function updateCrewMember(id: number, formData: FormData) {
  const name = formData.get("name") as string;
  const email = (formData.get("email") as string) || null;
  const phone = (formData.get("phone") as string) || null;
  const department = formData.get("department") as string;
  const roleTitle = formData.get("roleTitle") as string;
  const dayRate = (formData.get("dayRate") as string) || null;
  const paymentType = (formData.get("paymentType") as "one_time" | "per_episode") || "one_time";

  await db
    .update(crewMembers)
    .set({ name, email, phone, department, roleTitle, dayRate, paymentType })
    .where(eq(crewMembers.id, id));

  // Auto-create user account if email is provided and no userId linked
  if (email) {
    const [member] = await db
      .select({ userId: crewMembers.userId })
      .from(crewMembers)
      .where(eq(crewMembers.id, id))
      .limit(1);

    if (!member?.userId) {
      await ensureUserAccount(name, email, id);
    }
  }

  revalidatePath("/crew");
  revalidatePath(`/crew/${id}`);
}

export async function deleteCrewMember(id: number) {
  await db.delete(crewMembers).where(eq(crewMembers.id, id));
  revalidatePath("/crew");
}
