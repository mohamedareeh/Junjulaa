"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function changePassword(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "All fields are required" };
  }

  if (newPassword.length < 6) {
    return { error: "New password must be at least 6 characters" };
  }

  if (newPassword !== confirmPassword) {
    return { error: "New passwords do not match" };
  }

  const userId = parseInt(session.user.id, 10);
  const [user] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return { error: "User not found" };
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    return { error: "Current password is incorrect" };
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await db
    .update(users)
    .set({ passwordHash: newHash })
    .where(eq(users.id, userId));

  return { success: true };
}
