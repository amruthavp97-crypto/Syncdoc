import { useQuery } from "@tanstack/react-query";
import { HiOutlineMagnifyingGlass, HiOutlineBell } from "react-icons/hi2";
import { api } from "@/api/client";
import { useLogout } from "@/features/auth/authQueries";
import { useAppDispatch } from "@/app/hooks";
import { setCommandPaletteOpen } from "@/features/dashboard/uiSlice";

export default function Topbar() {
  const logout = useLogout();
  const dispatch = useAppDispatch();

  const { data: notifData } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await api.get("/notifications")).data,
    refetchInterval: 20_000,
  });

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 px-6 py-4 backdrop-blur-xl bg-base-900/70 border-b border-black/[0.07]">
      <button
        onClick={() => dispatch(setCommandPaletteOpen(true))}
        className="relative flex-1 max-w-md flex items-center gap-2 input-field py-2 text-sm text-ink-700 hover:border-black/[0.14] transition-colors"
      >
        <HiOutlineMagnifyingGlass className="text-ink-700 shrink-0" />
        <span className="flex-1 text-left">Search documents, people, workspaces…</span>
        <kbd className="text-[10px] border border-black/[0.1] rounded px-1.5 py-0.5 shrink-0">⌘K</kbd>
      </button>
      <div className="flex-1" />
      <button className="relative p-2 rounded-xl hover:bg-black/[0.045] transition-colors">
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
