import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight, common } from "lowlight";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HiOutlineArrowDownTray, HiOutlineStar, HiOutlineBookmark, HiOutlineLockClosed, HiOutlineTrash, HiOutlineClock, HiOutlineShare, HiOutlineArchiveBox, HiOutlineArchiveBoxXMark } from "react-icons/hi2";
import { api } from "@/api/client";
import { useYjsSocket } from "@/hooks/useYjsSocket";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import EditorToolbar from "@/components/editor/EditorToolbar";
import PresenceStack from "@/components/editor/PresenceStack";
import CommentsPanel from "@/components/editor/CommentsPanel";
import VersionHistoryPanel from "@/components/editor/VersionHistoryPanel";
import ShareDialog from "@/components/editor/ShareDialog";

const lowlight = createLowlight(common);

interface DocumentDetail {
  _id: string;
  title: string;
  content: unknown;
  isPinnedBy: string[];
  isFavoritedBy: string[];
  isLocked: boolean;
  isArchived: boolean;
  wordCount: number;
}

export default function DocumentEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [showVersions, setShowVersions] = useState(false);

  const { data: doc, isLoading } = useQuery({
    queryKey: ["document", id],
    queryFn: async () => (await api.get<{ document: DocumentDetail }>(`/documents/${id}`)).data.document,
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (doc) setTitle(doc.title);
  }, [doc]);

  const { ydoc, awareness, connected, peers } = useYjsSocket(id);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ history: false }), // Yjs owns undo history via the CRDT
        Collaboration.configure({ document: ydoc }),
        CollaborationCursor.configure({ provider: { awareness } as any }),
        Placeholder.configure({ placeholder: "Start writing, or press '/' for commands…" }),
        CharacterCount,
        LinkExtension.configure({ openOnClick: false }),
        ImageExtension,
        Table.configure({ resizable: true }),
        TableRow,
        TableCell,
        TableHeader,
        CodeBlockLowlight.configure({ lowlight }),
      ],
      editorProps: {
        attributes: { class: "prose max-w-none px-1 py-4" },
      },
    },
    [ydoc]
  );

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveContent = useMutation({
    mutationFn: (content: unknown) => api.patch(`/documents/${id}`, { content }),
    onMutate: () => setSaveStatus("saving"),
    onSuccess: () => setSaveStatus("saved"),
    onError: () => setSaveStatus("idle"),
  });
  const debouncedSave = useDebouncedCallback((content: unknown) => saveContent.mutate(content), 2000);

  useEffect(() => {
    if (!editor) return undefined;
    const handler = () => debouncedSave(editor.getJSON());
    editor.on("update", handler);
    return () => {
      editor.off("update", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  const saveTitle = useDebouncedCallback((next: string) => {
    api.patch(`/documents/${id}`, { title: next });
  }, 800);

  const queryClient = useQueryClient();
  const invalidateDoc = () => queryClient.invalidateQueries({ queryKey: ["document", id] });

  // Bug fix: these previously had no onSuccess handler at all, so the
  // toggle succeeded on the backend but the star/pin icon color (driven by
  // `doc.isFavoritedBy`/`doc.isPinnedBy` from the cached query) never
  // updated - clicking it appeared to do nothing.
  const togglePin = useMutation({ mutationFn: () => api.post(`/documents/${id}/pin`), onSuccess: invalidateDoc });
  const toggleFavorite = useMutation({
    mutationFn: () => api.post(`/documents/${id}/favorite`),
    onSuccess: invalidateDoc,
  });
  const toggleArchive = useMutation({
    mutationFn: () => api.post(`/documents/${id}/archive`),
    onSuccess: invalidateDoc,
  });
  const [showShare, setShowShare] = useState(false);
  const moveToTrash = useMutation({
    mutationFn: () => api.delete(`/documents/${id}`),
    onSuccess: () => navigate("/documents"),
  });

  if (isLoading) {
    return <div className="text-ink-500 p-6">Loading document…</div>;
  }
  if (!doc) {
    return <div className="text-ink-500 p-6">Document not found.</div>;
  }

  return (
    <div className="flex gap-6 items-start">
      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              saveTitle(e.target.value);
            }}
            className="text-2xl font-bold font-display bg-transparent outline-none flex-1 min-w-0"
            placeholder="Untitled"
          />
          <div className="flex items-center gap-2 shrink-0">
            <PresenceStack peers={peers} connected={connected} />
            <button onClick={() => togglePin.mutate()} className="p-2 rounded-lg hover:bg-black/[0.06]" title="Pin">
              <HiOutlineBookmark className={doc.isPinnedBy?.length ? "text-brand-violet" : "text-ink-500"} />
            </button>
            <button onClick={() => toggleFavorite.mutate()} className="p-2 rounded-lg hover:bg-black/[0.06]" title="Favorite">
              <HiOutlineStar className={doc.isFavoritedBy?.length ? "text-accent-warning" : "text-ink-500"} />
            </button>
            <button
              onClick={() => toggleArchive.mutate()}
              className="p-2 rounded-lg hover:bg-black/[0.06] text-ink-500 hover:text-ink-100"
              title={doc.isArchived ? "Unarchive" : "Archive"}
            >
              {doc.isArchived ? <HiOutlineArchiveBoxXMark /> : <HiOutlineArchiveBox />}
            </button>
            <button onClick={() => setShowShare(true)} className="p-2 rounded-lg hover:bg-black/[0.06] text-ink-500 hover:text-ink-100" title="Share">
              <HiOutlineShare />
            </button>
            <a href={`/api/documents/${id}/export/pdf`} target="_blank" rel="noreferrer" className="btn-ghost text-sm px-3 py-2 flex items-center gap-1.5">
              <HiOutlineArrowDownTray /> Export
            </a>
            <button onClick={() => setShowVersions(true)} className="p-2 rounded-lg hover:bg-black/[0.06] text-ink-500 hover:text-ink-100" title="Version history">
              <HiOutlineClock />
            </button>
            <button
              onClick={() => {
                if (confirm(`Move "${title || "this document"}" to trash?`)) moveToTrash.mutate();
              }}
              className="p-2 rounded-lg hover:bg-accent-danger/10 text-ink-500 hover:text-accent-danger transition-colors"
              title="Move to trash"
            >
              <HiOutlineTrash />
            </button>
          </div>
        </div>

        {doc.isLocked && (
          <div className="flex items-center gap-2 text-xs text-accent-warning bg-accent-warning/10 border border-accent-warning/30 rounded-lg px-3 py-2">
            <HiOutlineLockClosed /> This document is read-only.
          </div>
        )}
        {doc.isArchived && (
          <div className="flex items-center gap-2 text-xs text-ink-500 bg-black/[0.03] rounded-lg px-3 py-2">
            <HiOutlineArchiveBox /> This document is archived.
          </div>
        )}

        <div className="flex items-center justify-between">
          <EditorToolbar editor={editor} />
        </div>
        <p className="text-xs text-ink-700 -mt-2 px-1">
          {saveStatus === "saving" && "Saving…"}
          {saveStatus === "saved" && "All changes saved"}
          {saveStatus === "idle" && "\u00A0"}
        </p>

        <div className="glass-panel p-6 min-h-[500px]">
          <EditorContent editor={editor} />
        </div>
      </div>

      {id && <CommentsPanel documentId={id} />}

      {id && showShare && <ShareDialog documentId={id} onClose={() => setShowShare(false)} />}

      {id && showVersions && (
        <VersionHistoryPanel
          documentId={id}
          onClose={() => setShowVersions(false)}
          onRestored={(content) => {
            // Apply through the editor's own commands (not by swapping the
            // Y.Doc directly) so this generates a real Yjs update that
            // syncs to every other connected collaborator and persists to
            // the CRDT on the next flush - a REST-only restore would leave
            // the live session untouched and silently overwritten again
            // on the next autosave.
            editor?.commands.setContent(content as any, true);
            setShowVersions(false);
          }}
        />
      )}
    </div>
  );
}
