import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HiOutlineClock, HiOutlineArrowUturnLeft } from "react-icons/hi2";
import { api } from "@/api/client";
import { formatDistanceToNow } from "@/lib/formatDate";

interface VersionItem {
  _id: string;
  createdAt: string;
  editedBy: { _id: string; name: string; avatarUrl?: string } | null;
  label?: string;
}

export default function VersionHistoryPanel({
  documentId,
  onClose,
  onRestored,
}: {
  documentId: string;
  onClose: () => void;
  onRestored: (content: unknown) => void;
}) {
  const queryClient = useQueryClient();
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const { data: versions, isLoading } = useQuery({
    queryKey: ["versions", documentId],
    queryFn: async () =>
      (await api.get<{ versions: VersionItem[] }>(`/documents/${documentId}/versions`)).data.versions,
  });

  const restoreVersion = useMutation({
    mutationFn: (versionId: string) =>
      api.post<{ document: { content: unknown } }>(`/documents/${documentId}/versions/${versionId}/restore`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["document", documentId] });
      queryClient.invalidateQueries({ queryKey: ["versions", documentId] });
      setRestoringId(null);
      onRestored(res.data.document.content);
    },
    onError: () => setRestoringId(null),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm h-screen glass-panel border-l border-black/[0.07] overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold flex items-center gap-2">
            <HiOutlineClock /> Version history
          </h3>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-100 text-sm">
            Close
          </button>
        </div>

        {isLoading && <p className="text-sm text-ink-500">Loading…</p>}
        {!isLoading && (versions?.length ?? 0) === 0 && (
          <p className="text-sm text-ink-700">
            No saved versions yet — a version is recorded every time you make a discrete save.
          </p>
        )}

        <div className="space-y-2">
          {versions?.map((v) => (
            <div key={v._id} className="glass-card p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">
                  {v.label || `Edit by ${v.editedBy?.name || "someone"}`}
                </div>
                <div className="text-xs text-ink-700">{formatDistanceToNow(v.createdAt)}</div>
              </div>
              <button
                onClick={() => {
                  if (confirm("Restore this version? Your current content will be saved as a version too, so nothing is lost.")) {
                    setRestoringId(v._id);
                    restoreVersion.mutate(v._id);
                  }
                }}
                disabled={restoringId === v._id}
                className="p-2 rounded-lg hover:bg-black/[0.06] text-ink-500 hover:text-ink-100 shrink-0 disabled:opacity-50"
                title="Restore this version"
              >
                <HiOutlineArrowUturnLeft />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
