import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { HiOutlineFolder, HiOutlineFolderPlus, HiOutlineXMark } from "react-icons/hi2";
import { api } from "@/api/client";
import DocumentCard, { DocSummary } from "@/components/ui/DocumentCard";

const FILTERS = [
  { key: "", label: "All" },
  { key: "pinned", label: "Pinned" },
  { key: "favorite", label: "Favorites" },
  { key: "archived", label: "Archived" },
  { key: "trash", label: "Trash" },
];

interface FolderItem {
  _id: string;
  name: string;
}

export default function DocumentsPage() {
  const [params, setParams] = useSearchParams();
  const filter = params.get("filter") || "";
  const folderId = params.get("folder") || "";
  const [search, setSearch] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: workspaces } = useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => (await api.get("/workspaces")).data.workspaces,
  });
  const activeWorkspaceId = workspaces?.[0]?._id;

  const { data: folders } = useQuery({
    queryKey: ["folders", activeWorkspaceId],
    queryFn: async () =>
      (await api.get<{ folders: FolderItem[] }>("/folders", { params: { workspace: activeWorkspaceId } })).data
        .folders,
    enabled: Boolean(activeWorkspaceId),
  });

  const { data: docs, isLoading } = useQuery({
    queryKey: ["documents", filter, search, folderId],
    queryFn: async () =>
      (
        await api.get<{ documents: DocSummary[] }>("/documents", {
          params: { filter: filter || undefined, q: search || undefined, folder: folderId || undefined },
        })
      ).data.documents,
  });

  const createDocument = useMutation({
    mutationFn: async () => {
      if (!activeWorkspaceId) throw new Error("Create a workspace first");
      return api.post("/documents", {
        title: "Untitled",
        workspace: activeWorkspaceId,
        folder: folderId || undefined,
      });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      navigate(`/documents/${res.data.document._id}`);
    },
  });

  const createFolder = useMutation({
    mutationFn: () => api.post("/folders", { name: newFolderName, workspace: activeWorkspaceId }),
    onSuccess: () => {
      setNewFolderName("");
      setShowNewFolder(false);
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });

  function setFolder(id: string) {
    const next = new URLSearchParams(params);
    if (id) next.set("folder", id);
    else next.delete("folder");
    setParams(next);
  }

  const activeFolder = folders?.find((f) => f._id === folderId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold font-display">
          Documents{activeFolder ? ` / ${activeFolder.name}` : ""}
        </h1>
        <button onClick={() => createDocument.mutate()} className="btn-gradient text-sm">
          + New document
        </button>
      </div>

      {/* Folders row */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFolder("")}
          className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors ${
            !folderId ? "bg-brand-gradient text-white" : "glass-card text-ink-500 hover:text-ink-100"
          }`}
        >
          <HiOutlineFolder /> Unfiled
        </button>
        {folders?.map((f) => (
          <button
            key={f._id}
            onClick={() => setFolder(f._id)}
            className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors ${
              folderId === f._id ? "bg-brand-gradient text-white" : "glass-card text-ink-500 hover:text-ink-100"
            }`}
          >
            <HiOutlineFolder /> {f.name}
          </button>
        ))}
        {showNewFolder ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newFolderName.trim()) createFolder.mutate();
                if (e.key === "Escape") setShowNewFolder(false);
              }}
              placeholder="Folder name"
              className="input-field text-xs py-1.5 w-32"
            />
            <button onClick={() => setShowNewFolder(false)} className="p-1.5 text-ink-500 hover:text-ink-100">
              <HiOutlineXMark className="text-sm" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewFolder(true)}
            className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 text-ink-500 hover:text-ink-100 border border-dashed border-black/[0.15]"
          >
            <HiOutlineFolderPlus /> New folder
          </button>
        )}
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
