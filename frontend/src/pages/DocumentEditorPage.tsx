import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import Placeholder from "@tiptap/extension-placeholder";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight, common } from "lowlight";
import { useQuery, useMutation } from "@tanstack/react-query";
import { HiOutlineArrowDownTray, HiOutlineStar, HiOutlineBookmark, HiOutlineLockClosed } from "react-icons/hi2";
import { api } from "@/api/client";
import { useYjsSocket } from "@/hooks/useYjsSocket";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import EditorToolbar from "@/components/editor/EditorToolbar";
import PresenceStack from "@/components/editor/PresenceStack";
import CommentsPanel from "@/components/editor/CommentsPanel";

const lowlight = createLowlight(common);

interface DocumentDetail {
  _id: string;
  title: string;
  content: unknown;
  isPinnedBy: string[];
  isFavoritedBy: string[];
  isLocked: boolean;
  wordCount: number;
}

export default function DocumentEditorPage() {
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState("");

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
        LinkExtension.configure({ openOnClick: false }),
        ImageExtension,
        Table.configure({ resizable: true }),
        TableRow,
        TableCell,
        TableHeader,
        CodeBlockLowlight.configure({ lowlight }),
      ],
      editorProps: {
        attributes: { class: "prose prose-invert max-w-none px-1 py-4" },
      },
    },
    [ydoc]
  );

  const saveContent = useMutation({
    mutationFn: (content: unknown) => api.patch(`/documents/${id}`, { content }),
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

  const togglePin = useMutation({ mutationFn: () => api.post(`/documents/${id}/pin`) });
  const toggleFavorite = useMutation({ mutationFn: () => api.post(`/documents/${id}/favorite`) });

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
            <button onClick={() => togglePin.mutate()} className="p-2 rounded-lg hover:bg-white/[0.08]" title="Pin">
              <HiOutlineBookmark className={doc.isPinnedBy?.length ? "text-brand-violet" : "text-ink-500"} />
            </button>
            <button onClick={() => toggleFavorite.mutate()} className="p-2 rounded-lg hover:bg-white/[0.08]" title="Favorite">
              <HiOutlineStar className={doc.isFavoritedBy?.length ? "text-accent-warning" : "text-ink-500"} />
            </button>
            <a href={`/api/documents/${id}/export/pdf`} target="_blank" rel="noreferrer" className="btn-ghost text-sm px-3 py-2 flex items-center gap-1.5">
              <HiOutlineArrowDownTray /> Export
            </a>
          </div>
        </div>

        {doc.isLocked && (
          <div className="flex items-center gap-2 text-xs text-accent-warning bg-accent-warning/10 border border-accent-warning/30 rounded-lg px-3 py-2">
            <HiOutlineLockClosed /> This document is read-only.
          </div>
        )}

        <EditorToolbar editor={editor} />

        <div className="glass-panel p-6 min-h-[500px]">
          <EditorContent editor={editor} />
        </div>
      </div>

      {id && <CommentsPanel documentId={id} />}
    </div>
  );
}
