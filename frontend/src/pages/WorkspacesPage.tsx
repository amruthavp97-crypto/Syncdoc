import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HiOutlineUserGroup, HiOutlinePlus } from "react-icons/hi2";
import { api } from "@/api/client";

interface WorkspaceSummary {
  _id: string;
  name: string;
  description?: string;
  members: { user: { _id: string; name: string }; role: string }[];
}

export default function WorkspacesPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [inviteEmail, setInviteEmail] = useState<Record<string, string>>({});

  const { data: workspaces, isLoading } = useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => (await api.get<{ workspaces: WorkspaceSummary[] }>("/workspaces")).data.workspaces,
  });

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
          {workspaces?.map((ws) => (
            <div key={ws._id} className="glass-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-brand-gradient grid place-items-center">
                  <HiOutlineUserGroup className="text-white" />
                </div>
                <div>
                  <div className="font-semibold">{ws.name}</div>
                  <div className="text-xs text-ink-700">{ws.members.length} members</div>
                </div>
              </div>
              <div className="flex -space-x-2 mb-4">
                {ws.members.slice(0, 6).map((m) => (
                  <div
                    key={m.user._id}
                    title={m.user.name}
                    className="w-7 h-7 rounded-full bg-base-800 border-2 border-base-900 grid place-items-center text-[10px]"
                  >
                    {m.user.name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
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
          ))}
          {workspaces?.length === 0 && (
            <div className="glass-card p-12 text-center text-ink-500 md:col-span-2">
              No workspaces yet — create your first one above.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
