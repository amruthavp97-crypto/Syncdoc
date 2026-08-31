import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { formatDistanceToNow } from "@/lib/formatDate";

interface CommentAuthor {
  _id: string;
  name: string;
}
interface CommentItem {
  _id: string;
  text: string;
  author: CommentAuthor;
  resolved: boolean;
  createdAt: string;
}

export default function CommentsPanel({ documentId }: { documentId: string }) {
  const [text, setText] = useState("");
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["comments", documentId],
    queryFn: async () => (await api.get<{ comments: CommentItem[] }>(`/documents/${documentId}/comments`)).data
      .comments,
  });

  const addComment = useMutation({
    mutationFn: (text: string) => api.post(`/documents/${documentId}/comments`, { text }),
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({ queryKey: ["comments", documentId] });
    },
  });

  const resolveComment = useMutation({
    mutationFn: (commentId: string) => api.patch(`/documents/${documentId}/comments/${commentId}/resolve`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comments", documentId] }),
  });

  return (
    <div className="w-80 shrink-0 glass-panel p-4 h-fit sticky top-[130px]">
      <h3 className="font-display font-semibold mb-4">Comments</h3>
      <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
        {(data || []).length === 0 && <p className="text-sm text-ink-700">No comments yet.</p>}
        {data?.map((c) => (
          <div key={c._id} className={`p-3 rounded-lg bg-black/[0.025] ${c.resolved ? "opacity-50" : ""}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium">{c.author?.name || "Unknown"}</span>
              <span className="text-[10px] text-ink-700">{formatDistanceToNow(c.createdAt)}</span>
            </div>
            <p className="text-sm text-ink-300">{c.text}</p>
            <button
              onClick={() => resolveComment.mutate(c._id)}
              className="text-[10px] text-brand-blue hover:underline mt-1"
            >
              {c.resolved ? "Reopen" : "Resolve"}
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment…"
          className="input-field text-sm py-2"
          onKeyDown={(e) => {
            if (e.key === "Enter" && text.trim()) addComment.mutate(text.trim());
          }}
        />
        <button
          onClick={() => text.trim() && addComment.mutate(text.trim())}
          className="btn-gradient text-sm px-3"
        >
          Post
        </button>
      </div>
    </div>
  );
}
