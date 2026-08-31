import { NavLink, useLocation } from "react-router-dom";
import {
  HiOutlineSquares2X2,
  HiOutlineDocumentText,
  HiOutlineUserGroup,
  HiOutlineStar,
  HiOutlineTrash,
  HiOutlineCog6Tooth,
  HiOutlineShieldCheck,
  HiOutlineUser,
} from "react-icons/hi2";
import { useAppSelector } from "@/app/hooks";

// Trash/Favorites are filtered views of the Documents page (via ?filter=),
// not separate pages - linking to a bare "/trash" path used to silently
// show the unfiltered "All" view instead, since nothing ever set the
// filter query param the Documents page actually reads.
const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: HiOutlineSquares2X2 },
  { to: "/documents", label: "Documents", icon: HiOutlineDocumentText },
  { to: "/workspaces", label: "Workspaces", icon: HiOutlineUserGroup },
  { to: "/documents?filter=favorite", label: "Favorites", icon: HiOutlineStar },
  { to: "/documents?filter=trash", label: "Trash", icon: HiOutlineTrash },
];

export default function Sidebar() {
  const user = useAppSelector((s) => s.auth.user);
  const location = useLocation();
  const currentFilter = new URLSearchParams(location.search).get("filter");

  function isNavActive(href: string): boolean {
    const [path, query] = href.split("?");
    if (location.pathname !== path) return false;
    const targetFilter = query ? new URLSearchParams(query).get("filter") : null;
    return targetFilter === currentFilter;
  }

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 flex flex-col glass-panel border-r border-black/[0.07] rounded-none px-4 py-6">
      <div className="flex items-center gap-2 font-display font-bold text-lg px-2 mb-8">
        <span className="w-8 h-8 rounded-lg bg-brand-gradient grid place-items-center text-sm">S</span>
        SyncDoc
      </div>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} className={`sidebar-link ${isNavActive(item.to) ? "active" : ""}`}>
            <item.icon className="text-lg" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-1 pt-4 border-t border-black/[0.07]">
        {user?.role === "admin" && (
          <NavLink to="/admin" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
            <HiOutlineShieldCheck className="text-lg" />
            Admin panel
          </NavLink>
        )}
        <NavLink to="/settings" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
          <HiOutlineCog6Tooth className="text-lg" />
          Settings
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
          <HiOutlineUser className="text-lg" />
          Profile
        </NavLink>
      </div>

      {user && (
        <div className="mt-4 flex items-center gap-3 px-2 py-3 rounded-xl bg-black/[0.025]">
          <div className="w-9 h-9 rounded-full bg-brand-gradient grid place-items-center text-xs font-semibold shrink-0">
            {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{user.name}</div>
            <div className="text-xs text-ink-700 truncate capitalize">{user.role}</div>
          </div>
        </div>
      )}
    </aside>
  );
}
