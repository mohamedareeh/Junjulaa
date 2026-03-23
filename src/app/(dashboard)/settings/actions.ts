"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function createUser(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const username = formData.get("username") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as "producer" | "director" | "crew";

    const passwordHash = await bcrypt.hash(password, 10);

    await db.insert(users).values({
      name,
      username,
      email,
      passwordHash,
      role,
    });

    revalidatePath("/settings");
  } catch (error) {
    console.error("Failed to create user:", error);
    throw new Error("Failed to create user");
  }
}

export async function updateUser(id: number, formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const username = formData.get("username") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as "producer" | "director" | "crew";

    const updateData: {
      name: string;
      username: string;
      email: string;
      role: "producer" | "director" | "crew";
      passwordHash?: string;
    } = {
      name,
      username,
      email,
      role,
    };

    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    await db.update(users).set(updateData).where(eq(users.id, id));

    revalidatePath("/settings");
  } catch (error) {
    console.error("Failed to update user:", error);
    throw new Error("Failed to update user");
  }
}

export async function deleteUser(id: number) {
  try {
    await db.delete(users).where(eq(users.id, id));

    revalidatePath("/settings");
  } catch (error) {
    console.error("Failed to delete user:", error);
    throw new Error("Failed to delete user");
  }
}
