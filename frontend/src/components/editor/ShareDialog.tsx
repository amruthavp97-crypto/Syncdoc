import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HiOutlineXMark } from "react-icons/hi2";
import { api } from "@/api/client";

type Permission = "editor" | "commenter" | "viewer";

export default function ShareDialog({ documentId, onClose }: { documentId: string; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<Permission>("editor");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const queryClient = useQueryClient();

  const share = useMutation({
    mutationFn: () => api.post(`/documents/${documentId}/share`, { email, permission }),
    onSuccess: () => {
      setFeedback({ type: "success", message: `Shared with ${email}.` });
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["document", documentId] });
    },
    onError: (err: any) => {
      setFeedback({ type: "error", message: err?.response?.data?.error || "Couldn't share the document." });
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold">Share document</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/[0.06] text-ink-500">
            <HiOutlineXMark />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setFeedback(null);
            if (email.trim()) share.mutate();
          }}
          className="space-y-3"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="input-field text-sm"
          />
          <select
            value={permission}
            onChange={(e) => setPermission(e.target.value as Permission)}
            className="input-field text-sm"
          >
            <option value="editor">Can edit</option>
            <option value="commenter">Can comment</option>
            <option value="viewer">Can view</option>
          </select>

          {feedback && (
            <p className={`text-xs ${feedback.type === "success" ? "text-accent-success" : "text-accent-danger"}`}>
              {feedback.message}
            </p>
          )}

          <button type="submit" disabled={share.isPending} className="btn-gradient w-full text-sm">
            {share.isPending ? "Sharing…" : "Share"}
          </button>
        </form>

        <p className="text-xs text-ink-700 mt-4">
          The person must already have a SyncDoc account under this email address.
        </p>
      </div>
    </div>
  );
}
