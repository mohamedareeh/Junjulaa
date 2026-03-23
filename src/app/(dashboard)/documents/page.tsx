import { db } from "@/db";
import { documents, episodes } from "@/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DocumentForm } from "@/components/documents/document-form";
import { DeleteDocumentButton } from "@/components/documents/delete-document-button";
import { FileText, ExternalLink } from "lucide-react";

const typeColors: Record<string, string> = {
  script: "border-blue-200 bg-blue-50 text-blue-700",
  contract: "border-violet-200 bg-violet-50 text-violet-700",
  permit: "border-emerald-200 bg-emerald-50 text-emerald-700",
  release: "border-amber-200 bg-amber-50 text-amber-700",
  other: "border-gray-200 bg-gray-50 text-gray-700",
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
      .select({ id: episodes.id, number: episodes.number, title: episodes.title })
      .from(episodes)
      .orderBy(episodes.number);

    const conditions = [];
    if (params.type) {
      conditions.push(
        eq(documents.type, params.type as "script" | "contract" | "permit" | "release" | "other")
      );
    }
    if (params.episode) {
      conditions.push(eq(documents.episodeId, parseInt(params.episode, 10)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

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
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Documents</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage production documents and files
          </p>
        </div>
        <DocumentForm
          episodes={allEpisodes}
          trigger={<Button className="rounded-xl bg-gray-900 hover:bg-gray-800">Upload Document</Button>}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <a
          href="/documents"
          className={`inline-flex items-center rounded-xl px-3 py-1.5 text-[12px] font-medium transition-colors ${
            !params.type && !params.episode
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
        >
          All
        </a>
        {Object.entries(typeLabels).map(([value, label]) => (
          <a
            key={value}
            href={`/documents?type=${value}${params.episode ? `&episode=${params.episode}` : ""}`}
            className={`inline-flex items-center rounded-xl px-3 py-1.5 text-[12px] font-medium transition-colors ${
              params.type === value
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {label}
          </a>
        ))}
        {allEpisodes.length > 0 && (
          <>
            <span className="text-gray-300 mx-1">|</span>
            {allEpisodes.map((ep) => (
              <a
                key={ep.id}
                href={`/documents?episode=${ep.id}${params.type ? `&type=${params.type}` : ""}`}
                className={`inline-flex items-center rounded-xl px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  params.episode === String(ep.id)
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                Ep {ep.number}
              </a>
            ))}
          </>
        )}
      </div>

      {/* Documents List */}
      <div className="card-shadow rounded-2xl bg-white">
        {documentRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <FileText className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-400">
              No documents found. Upload your first document to get started.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {documentRows.map((doc) => (
              <div key={doc.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                  <FileText className="h-4 w-4 text-gray-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[13px] font-medium text-gray-900 hover:underline"
                  >
                    {doc.name}
                    <ExternalLink className="h-3 w-3 text-gray-400" />
                  </a>
                  <div className="mt-0.5 flex items-center gap-3 text-[11px] text-gray-400">
                    {doc.episodeNumber != null && <span>Ep {doc.episodeNumber}</span>}
                    <span>v{doc.version}</span>
                    <span>{format(doc.createdAt, "MMM d, yyyy")}</span>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`shrink-0 text-[10px] font-medium border ${typeColors[doc.type] ?? ""}`}
                >
                  {typeLabels[doc.type] ?? doc.type}
                </Badge>
                <DeleteDocumentButton id={doc.id} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
