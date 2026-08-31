import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  HiOutlineDocumentPlus,
  HiOutlineSquares2X2,
  HiOutlineUserGroup,
  HiOutlineCog6Tooth,
  HiOutlineDocumentText,
  HiOutlineMagnifyingGlass,
} from "react-icons/hi2";
import { api } from "@/api/client";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { setCommandPaletteOpen } from "@/features/dashboard/uiSlice";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";

interface SearchResult {
  documents: { _id: string; title: string }[];
  users: { _id: string; name: string }[];
  workspaces: { _id: string; name: string }[];
}

interface PaletteItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

export default function CommandPalette() {
  const open = useAppSelector((s) => s.ui.commandPaletteOpen);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const debounceSetQuery = useDebouncedCallback(setDebouncedQuery, 250);

  // Global Cmd/Ctrl+K listener - works from anywhere in the authenticated app.
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        dispatch(setCommandPaletteOpen(true));
      }
      if (e.key === "Escape") dispatch(setCommandPaletteOpen(false));
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dispatch]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setDebouncedQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  const { data: results } = useQuery({
    queryKey: ["command-search", debouncedQuery],
    queryFn: async () => (await api.get<SearchResult>("/search", { params: { q: debouncedQuery } })).data,
    enabled: open && debouncedQuery.length > 1,
  });

  const createDocument = useMutation({
    mutationFn: async () => {
      const workspaces = (await api.get("/workspaces")).data.workspaces;
      const workspaceId = workspaces?.[0]?._id;
      if (!workspaceId) throw new Error("Create a workspace first");
      return api.post("/documents", { title: "Untitled", workspace: workspaceId });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      close();
      navigate(`/documents/${res.data.document._id}`);
    },
  });

  function close() {
    dispatch(setCommandPaletteOpen(false));
  }

  const quickActions: PaletteItem[] = [
    { id: "new-doc", label: "New document", icon: HiOutlineDocumentPlus, action: () => createDocument.mutate() },
    { id: "dashboard", label: "Go to Dashboard", icon: HiOutlineSquares2X2, action: () => go("/dashboard") },
    { id: "documents", label: "Go to Documents", icon: HiOutlineDocumentText, action: () => go("/documents") },
    { id: "workspaces", label: "Go to Workspaces", icon: HiOutlineUserGroup, action: () => go("/workspaces") },
    { id: "settings", label: "Go to Settings", icon: HiOutlineCog6Tooth, action: () => go("/settings") },
  ];

  function go(path: string) {
    close();
    navigate(path);
  }

  const searchItems: PaletteItem[] = useMemo(() => {
    if (!results) return [];
    const docItems = results.documents.map((d) => ({
      id: `doc-${d._id}`,
      label: d.title || "Untitled",
      sublabel: "Document",
      icon: HiOutlineDocumentText,
      action: () => go(`/documents/${d._id}`),
    }));
    const wsItems = results.workspaces.map((w) => ({
      id: `ws-${w._id}`,
      label: w.name,
      sublabel: "Workspace",
      icon: HiOutlineUserGroup,
      action: () => go("/workspaces"),
    }));
    return [...docItems, ...wsItems];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results]);

  const items = debouncedQuery.length > 1 ? searchItems : quickActions;

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      items[activeIndex]?.action();
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />
      <div className="relative w-full max-w-xl glass-card border border-black/[0.1] overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-black/[0.08]">
          <HiOutlineMagnifyingGlass className="text-ink-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
              debounceSetQuery(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search documents, workspaces, or jump to a page…"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-ink-700"
          />
          <kbd className="text-[10px] text-ink-700 border border-black/[0.1] rounded px-1.5 py-0.5">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto py-2">
          {items.length === 0 && (
            <p className="text-center text-sm text-ink-700 py-8">No results.</p>
          )}
          {items.map((item, i) => (
            <button
              key={item.id}
              onClick={item.action}
              onMouseEnter={() => setActiveIndex(i)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                i === activeIndex ? "bg-brand-gradient/15 text-ink-100 font-medium" : "text-ink-300"
              }`}
            >
              <item.icon className="text-ink-500 shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {item.sublabel && <span className="text-xs text-ink-700 shrink-0">{item.sublabel}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
