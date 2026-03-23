"use client";

import { useTransition, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createDocument,
  updateDocument,
} from "@/app/(dashboard)/documents/actions";
import type { Document } from "@/db/schema";

const documentTypeLabels: Record<string, string> = {
  script: "Script",
  contract: "Contract",
  permit: "Permit",
  release: "Release",
  other: "Other",
};

interface DocumentFormProps {
  document?: Document;
  episodes: { id: number; number: number; title: string }[];
  trigger: React.ReactNode;
}

export function DocumentForm({
  document: doc,
  episodes,
  trigger,
}: DocumentFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState(doc?.type ?? "other");
  const [episodeId, setEpisodeId] = useState(
    doc?.episodeId ? String(doc.episodeId) : ""
  );

  async function handleSubmit(formData: FormData) {
    formData.set("type", type);
    formData.set("episodeId", episodeId);
    startTransition(async () => {
      try {
        if (doc) {
          await updateDocument(doc.id, formData);
        } else {
          await createDocument(formData);
        }
        setOpen(false);
      } catch (error) {
        console.error("Failed to save document:", error);
      }
    });
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {doc ? "Edit Document" : "Upload Document"}
          </DialogTitle>
          <DialogDescription>
            {doc
              ? "Update the document details below."
              : "Fill in the details for the new document."}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Document Name</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={doc?.name ?? ""}
              placeholder="Document name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={type}
                onValueChange={(val) => {
                  if (val) setType(val);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(documentTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="episodeId">Episode</Label>
              <Select
                value={episodeId}
                onValueChange={(val) => setEpisodeId(val ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select episode" />
                </SelectTrigger>
                <SelectContent>
                  {episodes.map((ep) => (
                    <SelectItem key={ep.id} value={String(ep.id)}>
                      Ep {ep.number} - {ep.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fileUrl">File URL</Label>
            <Input
              id="fileUrl"
              name="fileUrl"
              required
              defaultValue={doc?.fileUrl ?? ""}
              placeholder="https://... (file upload handled separately)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="version">Version</Label>
            <Input
              id="version"
              name="version"
              type="number"
              min="1"
              required
              defaultValue={doc?.version ?? 1}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Saving..."
                : doc
                  ? "Update Document"
                  : "Upload Document"}
            </Button>
          </DialogFooter>
        </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
