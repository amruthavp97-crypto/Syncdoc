import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HiOutlineUserGroup, HiOutlinePlus, HiOutlineTrash, HiOutlineExclamationTriangle } from "react-icons/hi2";
import { api } from "@/api/client";
import { useWorkspacePresence } from "@/hooks/useWorkspacePresence";
import { useAppSelector } from "@/app/hooks";

interface WorkspaceSummary {
  _id: string;
  name: string;
  description?: string;
  owner: string;
  members: { user: { _id: string; name: string }; role: string }[];
}

export default function WorkspacesPage() {
  const queryClient = useQueryClient();
  const currentUser = useAppSelector((s) => s.auth.user);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [inviteEmail, setInviteEmail] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<WorkspaceSummary | null>(null);

  const { data: workspaces, isLoading } = useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => (await api.get<{ workspaces: WorkspaceSummary[] }>("/workspaces")).data.workspaces,
  });

  const onlineByWorkspace = useWorkspacePresence((workspaces ?? []).map((w) => w._id));

  const createWorkspace = useMutation({
    mutationFn: () => api.post("/workspaces", { name }),
    onSuccess: () => {
      setName("");
      setShowCreate(false);
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });

  const inviteMember = useMutation({
    mutationFn: ({ id, email }: { id: string; email: string }) =>
      api.post(`/workspaces/${id}/invite`, { email, role: "editor" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspaces"] }),
  });

  const deleteWorkspace = useMutation({
    mutationFn: (id: string) => api.delete(`/workspaces/${id}`),
    onSuccess: () => {
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display">Workspaces</h1>
        <button onClick={() => setShowCreate((v) => !v)} className="btn-gradient text-sm flex items-center gap-1.5">
          <HiOutlinePlus /> New workspace
        </button>
      </div>

      {showCreate && (
        <div className="glass-card p-4 flex gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Workspace name"
            className="input-field"
          />
          <button
            onClick={() => name.trim() && createWorkspace.mutate()}
            disabled={createWorkspace.isPending}
            className="btn-gradient shrink-0"
          >
            Create
          </button>
        </div>
      )}

      {isLoading ? (
        <p className="text-ink-500 text-sm">Loading…</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {workspaces?.map((ws) => {
            const onlineIds = new Set(onlineByWorkspace[ws._id] || []);
            const isOwner = ws.owner === currentUser?.id;
            return (
              <div key={ws._id} className="glass-card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-gradient grid place-items-center">
                    <HiOutlineUserGroup className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{ws.name}</div>
                    <div className="text-xs text-ink-700">{ws.members.length} members</div>
                  </div>
                  {onlineIds.size > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-accent-success font-mono shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-success animate-pulse" />
                      {onlineIds.size} online
                    </div>
                  )}
                  {isOwner && (
                    <button
                      onClick={() => setDeleteTarget(ws)}
                      className="p-1.5 rounded-lg text-ink-500 hover:text-accent-danger hover:bg-accent-danger/10 shrink-0"
                      title="Delete workspace"
                    >
                      <HiOutlineTrash />
                    </button>
                  )}
                </div>
                <div className="flex -space-x-2 mb-4">
                  {ws.members.slice(0, 6).map((m) => (
                    <div key={m.user._id} className="relative">
                      <div
                        title={m.user.name}
                        className="w-7 h-7 rounded-full bg-base-800 border-2 border-base-900 grid place-items-center text-[10px]"
                      >
                        {m.user.name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      {onlineIds.has(m.user._id) && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-accent-success border-2 border-base-900" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={inviteEmail[ws._id] || ""}
                    onChange={(e) => setInviteEmail((s) => ({ ...s, [ws._id]: e.target.value }))}
                    placeholder="Invite by email"
                    className="input-field text-sm py-2"
                  />
                  <button
                    onClick={() =>
                      inviteEmail[ws._id] && inviteMember.mutate({ id: ws._id, email: inviteEmail[ws._id] })
                    }
                    className="btn-ghost text-sm px-3"
                  >
                    Invite
                  </button>
                </div>
              </div>
            );
          })}
          {workspaces?.length === 0 && (
            <div className="glass-card p-12 text-center text-ink-500 md:col-span-2">
              No workspaces yet — create your first one above.
            </div>
          )}
        </div>
      )}

      {deleteTarget && (
        <DeleteWorkspaceDialog
          workspace={deleteTarget}
          isPending={deleteWorkspace.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteWorkspace.mutate(deleteTarget._id)}
        />
      )}
    </div>
  );
}

function DeleteWorkspaceDialog({
  workspace,
  isPending,
  onCancel,
  onConfirm,
}: {
  workspace: WorkspaceSummary;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [confirmText, setConfirmText] = useState("");
  const canConfirm = confirmText.trim() === workspace.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md glass-card p-6">
        <div className="flex items-center gap-2 text-accent-danger mb-3">
          <HiOutlineExclamationTriangle className="text-xl" />
          <h3 className="font-display font-semibold">Delete workspace</h3>
        </div>
        <p className="text-sm text-ink-300 mb-4">
          This permanently deletes <strong>{workspace.name}</strong> and every document and folder inside
          it, for every member. This can't be undone.
        </p>
        <label className="text-xs text-ink-500 mb-1.5 block">
          Type <strong>{workspace.name}</strong> to confirm
        </label>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="input-field text-sm mb-4"
          placeholder={workspace.name}
        />
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-ghost flex-1 text-sm">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm || isPending}
            className="flex-1 text-sm rounded-full px-5 py-2.5 bg-accent-danger text-white shadow-glow-violet disabled:opacity-50 transition-opacity"
          >
            {isPending ? "Deleting…" : "Delete permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}
