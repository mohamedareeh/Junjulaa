import { db } from "@/db";
import { documents, episodes } from "@/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import { format } from "date-fns";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DocumentForm } from "@/components/documents/document-form";
import { DeleteDocumentButton } from "@/components/documents/delete-document-button";
import { FileTextIcon } from "lucide-react";

const typeColors: Record<string, string> = {
  script: "bg-blue-100 text-blue-800",
  contract: "bg-purple-100 text-purple-800",
  permit: "bg-green-100 text-green-800",
  release: "bg-orange-100 text-orange-800",
  other: "bg-gray-100 text-gray-800",
};

const typeLabels: Record<string, string> = {
  script: "Script",
  contract: "Contract",
  permit: "Permit",
  release: "Release",
  other: "Other",
};

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; episode?: string }>;
}) {
  const params = await searchParams;

  let allEpisodes: { id: number; number: number; title: string }[] = [];
  let documentRows: {
    id: number;
    episodeId: number | null;
    name: string;
    type: string;
    fileUrl: string;
    version: number;
    uploadedBy: number | null;
    createdAt: Date;
    episodeNumber: number | null;
  }[] = [];

  try {
    allEpisodes = await db
      .select({
        id: episodes.id,
        number: episodes.number,
        title: episodes.title,
      })
      .from(episodes)
      .orderBy(episodes.number);

    const conditions = [];
    if (params.type) {
      conditions.push(
        eq(
          documents.type,
          params.type as "script" | "contract" | "permit" | "release" | "other"
        )
      );
    }
    if (params.episode) {
      conditions.push(
        eq(documents.episodeId, parseInt(params.episode, 10))
      );
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        id: documents.id,
        episodeId: documents.episodeId,
        name: documents.name,
        type: documents.type,
        fileUrl: documents.fileUrl,
        version: documents.version,
        uploadedBy: documents.uploadedBy,
        createdAt: documents.createdAt,
        episodeNumber: episodes.number,
      })
      .from(documents)
      .leftJoin(episodes, eq(documents.episodeId, episodes.id))
      .where(whereClause)
      .orderBy(desc(documents.createdAt));

    documentRows = rows;
  } catch {
    // DB not connected
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground mt-1">
            Manage production documents and files
          </p>
        </div>
        <DocumentForm
          episodes={allEpisodes}
          trigger={<Button>Upload Document</Button>}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <a
          href="/documents"
          className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            !params.type && !params.episode
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          All
        </a>
        {Object.entries(typeLabels).map(([value, label]) => (
          <a
            key={value}
            href={`/documents?type=${value}${params.episode ? `&episode=${params.episode}` : ""}`}
            className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              params.type === value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {label}
          </a>
        ))}
        {allEpisodes.length > 0 && (
          <>
            <span className="text-muted-foreground mx-1">|</span>
            {allEpisodes.map((ep) => (
              <a
                key={ep.id}
                href={`/documents?episode=${ep.id}${params.type ? `&type=${params.type}` : ""}`}
                className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  params.episode === String(ep.id)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Ep {ep.number}
              </a>
            ))}
          </>
        )}
      </div>

      {/* Documents Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Episode</TableHead>
                <TableHead className="text-center">Version</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {documentRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <FileTextIcon className="size-8 text-muted-foreground" />
                      No documents found. Upload your first document to get
                      started.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                documentRows.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {doc.name}
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-xs ${typeColors[doc.type] ?? ""}`}
                      >
                        {typeLabels[doc.type] ?? doc.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {doc.episodeNumber != null
                        ? `Ep ${doc.episodeNumber}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      v{doc.version}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {format(doc.createdAt, "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <DeleteDocumentButton id={doc.id} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
