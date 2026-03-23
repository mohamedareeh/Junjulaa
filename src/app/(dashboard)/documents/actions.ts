"use server";

import { db } from "@/db";
import { documents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createDocument(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const type = formData.get("type") as
      | "script"
      | "contract"
      | "permit"
      | "release"
      | "other";
    const episodeId = formData.get("episodeId") as string;
    const fileUrl = formData.get("fileUrl") as string;
    const version = formData.get("version") as string;

    await db.insert(documents).values({
      name,
      type,
      episodeId: episodeId ? parseInt(episodeId, 10) : null,
      fileUrl,
      version: version ? parseInt(version, 10) : 1,
    });

    revalidatePath("/documents");
  } catch (error) {
    console.error("Failed to create document:", error);
    throw new Error("Failed to create document");
  }
}

export async function updateDocument(id: number, formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const type = formData.get("type") as
      | "script"
      | "contract"
      | "permit"
      | "release"
      | "other";
    const episodeId = formData.get("episodeId") as string;
    const fileUrl = formData.get("fileUrl") as string;
    const version = formData.get("version") as string;

    await db
      .update(documents)
      .set({
        name,
        type,
        episodeId: episodeId ? parseInt(episodeId, 10) : null,
        fileUrl,
        version: version ? parseInt(version, 10) : 1,
      })
      .where(eq(documents.id, id));

    revalidatePath("/documents");
  } catch (error) {
    console.error("Failed to update document:", error);
    throw new Error("Failed to update document");
  }
}

export async function deleteDocument(id: number) {
  try {
    await db.delete(documents).where(eq(documents.id, id));

    revalidatePath("/documents");
  } catch (error) {
    console.error("Failed to delete document:", error);
    throw new Error("Failed to delete document");
  }
}
