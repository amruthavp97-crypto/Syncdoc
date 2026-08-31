import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HiOutlineUsers, HiOutlineDocumentText, HiOutlineShieldExclamation } from "react-icons/hi2";
import { api } from "@/api/client";
import StatCard from "@/components/ui/StatCard";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  isSuspended: boolean;
}

export default function AdminPage() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => (await api.get("/admin/stats")).data,
  });

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["admin-users", search],
    queryFn: async () =>
      (await api.get<{ users: AdminUser[] }>("/admin/users", { params: { q: search || undefined } })).data.users,
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => api.patch(`/admin/users/${id}/role`, { role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const toggleSuspend = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/users/${id}/suspend`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-display">Admin panel</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total users" value={stats?.totalUsers ?? "—"} icon={HiOutlineUsers} />
        <StatCard label="Active (30d)" value={stats?.activeUsers ?? "—"} icon={HiOutlineUsers} />
        <StatCard label="Total documents" value={stats?.totalDocuments ?? "—"} icon={HiOutlineDocumentText} />
        <StatCard label="Suspended" value={stats?.suspendedUsers ?? "—"} icon={HiOutlineShieldExclamation} />
      </div>

      <div className="glass-card p-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users by name or email…"
          className="input-field max-w-sm text-sm py-2"
        />
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink-500 border-b border-black/[0.07]">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-ink-500">
                  Loading…
                </td>
              </tr>
            )}
            {usersData?.map((u) => (
              <tr key={u._id} className="border-b border-black/[0.06] last:border-0">
                <td className="px-5 py-3">{u.name}</td>
                <td className="px-5 py-3 text-ink-500">{u.email}</td>
                <td className="px-5 py-3">
                  <select
                    value={u.role}
                    onChange={(e) => updateRole.mutate({ id: u._id, role: e.target.value })}
                    className="bg-black/[0.045] border border-black/[0.08] rounded-lg px-2 py-1 text-xs"
                  >
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      u.isSuspended ? "bg-accent-danger/20 text-accent-danger" : "bg-accent-success/20 text-accent-success"
                    }`}
                  >
                    {u.isSuspended ? "Suspended" : "Active"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => toggleSuspend.mutate(u._id)}
                    className="text-xs text-brand-blue hover:underline"
                  >
                    {u.isSuspended ? "Unsuspend" : "Suspend"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
