"use server";

import { db } from "@/db";
import { crewMembers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createCrewMember(formData: FormData) {
  const name = formData.get("name") as string;
  const email = (formData.get("email") as string) || null;
  const phone = (formData.get("phone") as string) || null;
  const department = formData.get("department") as string;
  const roleTitle = formData.get("roleTitle") as string;
  const dayRate = (formData.get("dayRate") as string) || null;
  const paymentType = (formData.get("paymentType") as "one_time" | "per_episode") || "one_time";

  await db.insert(crewMembers).values({
    name,
    email,
    phone,
    department,
    roleTitle,
    dayRate,
    paymentType,
  });

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
    .set({
      name,
      email,
      phone,
      department,
      roleTitle,
      dayRate,
      paymentType,
    })
    .where(eq(crewMembers.id, id));

  revalidatePath("/crew");
  revalidatePath(`/crew/${id}`);
}

export async function deleteCrewMember(id: number) {
  await db.delete(crewMembers).where(eq(crewMembers.id, id));

  revalidatePath("/crew");
}
