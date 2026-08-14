import { useState } from "react";
import { HiOutlineMagnifyingGlass, HiOutlineBell } from "react-icons/hi2";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useLogout } from "@/features/auth/authQueries";

export default function Topbar() {
  const [query, setQuery] = useState("");
  const logout = useLogout();

  const { data: notifData } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await api.get("/notifications")).data,
    refetchInterval: 20_000,
  });

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 px-6 py-4 backdrop-blur-xl bg-base-900/70 border-b border-white/[0.06]">
      <div className="relative flex-1 max-w-md">
        <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-700" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search documents, people, workspaces…"
          className="input-field pl-10 py-2 text-sm"
        />
      </div>
      <div className="flex-1" />
      <button className="relative p-2 rounded-xl hover:bg-white/[0.06] transition-colors">
        <HiOutlineBell className="text-lg text-ink-300" />
        {notifData?.unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent-danger" />
        )}
      </button>
      <button onClick={() => logout.mutate()} className="btn-ghost text-sm px-4 py-2">
        Log out
      </button>
    </header>
  );
}
