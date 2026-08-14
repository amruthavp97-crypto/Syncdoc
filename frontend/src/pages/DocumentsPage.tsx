import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/api/client";
import DocumentCard, { DocSummary } from "@/components/ui/DocumentCard";

const FILTERS = [
  { key: "", label: "All" },
  { key: "pinned", label: "Pinned" },
  { key: "favorite", label: "Favorites" },
  { key: "archived", label: "Archived" },
  { key: "trash", label: "Trash" },
];

export default function DocumentsPage() {
  const [params, setParams] = useSearchParams();
  const filter = params.get("filter") || "";
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: workspaces } = useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => (await api.get("/workspaces")).data.workspaces,
  });

  const { data: docs, isLoading } = useQuery({
    queryKey: ["documents", filter, search],
    queryFn: async () =>
      (
        await api.get<{ documents: DocSummary[] }>("/documents", {
          params: { filter: filter || undefined, q: search || undefined },
        })
      ).data.documents,
  });

  const createDocument = useMutation({
    mutationFn: async () => {
      const workspaceId = workspaces?.[0]?._id;
      if (!workspaceId) throw new Error("Create a workspace first");
      return api.post("/documents", { title: "Untitled", workspace: workspaceId });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      navigate(`/documents/${res.data.document._id}`);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold font-display">Documents</h1>
        <button onClick={() => createDocument.mutate()} className="btn-gradient text-sm">
          + New document
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setParams(f.key ? { filter: f.key } : {})}
            className={`px-4 py-2 rounded-xl text-sm transition-colors ${
              filter === f.key ? "bg-brand-gradient text-white" : "glass-card text-ink-500 hover:text-ink-100"
            }`}
          >
            {f.label}
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title…"
          className="input-field ml-auto max-w-xs text-sm py-2"
        />
      </div>

      {isLoading ? (
        <p className="text-ink-500 text-sm">Loading…</p>
      ) : docs && docs.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {docs.map((doc) => (
            <DocumentCard key={doc._id} doc={doc} />
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center text-ink-500">No documents found.</div>
      )}
    </div>
  );
}
