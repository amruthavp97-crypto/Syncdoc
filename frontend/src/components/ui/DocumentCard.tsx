import { Link } from "react-router-dom";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HiOutlineDocumentText, HiOutlineEllipsisVertical, HiOutlineTrash, HiOutlineArrowUturnLeft } from "react-icons/hi2";
import { formatDistanceToNow } from "@/lib/formatDate";
import { api } from "@/api/client";

export interface DocSummary {
  _id: string;
  title: string;
  updatedAt: string;
  tags?: string[];
  isTrashed?: boolean;
}

export default function DocumentCard({ doc }: { doc: DocSummary }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["documents"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
  };

  const moveToTrash = useMutation({
    mutationFn: () => api.delete(`/documents/${doc._id}`),
    onSuccess: invalidate,
  });
  const restore = useMutation({
    mutationFn: () => api.post(`/documents/${doc._id}/restore`),
    onSuccess: invalidate,
  });
  const deleteForever = useMutation({
    mutationFn: () => api.delete(`/documents/${doc._id}/permanent`),
    onSuccess: invalidate,
  });

  return (
    <div className="glass-card p-4 flex flex-col gap-3 hover:border-brand-violet/30 hover:-translate-y-0.5 transition-all duration-200 group relative">
      <div className="flex items-start justify-between">
        <Link to={`/documents/${doc._id}`} className="w-9 h-9 rounded-lg bg-black/[0.045] grid place-items-center group-hover:bg-brand-gradient/20 transition-colors">
          <HiOutlineDocumentText className="text-ink-300" />
        </Link>
        <div className="relative">
          <button
            onClick={(e) => {
              e.preventDefault();
              setMenuOpen((v) => !v);
            }}
            className="p-1.5 rounded-lg text-ink-700 hover:text-ink-100 hover:bg-black/[0.06] opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Document actions"
          >
            <HiOutlineEllipsisVertical />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-9 z-10 w-40 glass-panel border border-black/[0.1] py-1 text-sm"
              onMouseLeave={() => setMenuOpen(false)}
            >
              {doc.isTrashed ? (
                <>
                  <button
                    onClick={() => {
                      restore.mutate();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-black/[0.045] text-ink-300"
                  >
                    <HiOutlineArrowUturnLeft /> Restore
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Permanently delete "${doc.title}"? This can't be undone.`)) {
                        deleteForever.mutate();
                      }
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-black/[0.045] text-accent-danger"
                  >
                    <HiOutlineTrash /> Delete forever
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    moveToTrash.mutate();
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-black/[0.045] text-accent-danger"
                >
                  <HiOutlineTrash /> Move to trash
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <Link to={`/documents/${doc._id}`} className="min-w-0">
        <div className="font-medium text-sm truncate">{doc.title || "Untitled"}</div>
        <div className="text-xs text-ink-700 mt-1">Updated {formatDistanceToNow(doc.updatedAt)}</div>
      </Link>
    </div>
  );
}
