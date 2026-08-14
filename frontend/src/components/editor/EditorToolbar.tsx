import { Editor } from "@tiptap/react";
import {
  HiBold,
  HiItalic,
  HiOutlineCodeBracket,
  HiOutlineListBullet,
  HiOutlineNumberedList,
  HiOutlineChatBubbleLeftRight,
  HiH1,
  HiH2,
} from "react-icons/hi2";
import { HiOutlineTable } from "react-icons/hi";

function ToolbarButton({
  onClick,
  active,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`p-2 rounded-lg text-sm transition-colors ${
        active ? "bg-brand-gradient text-white" : "text-ink-300 hover:bg-white/[0.08]"
      }`}
    >
      {children}
    </button>
  );
}

export default function EditorToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  return (
    <div className="flex items-center gap-1 flex-wrap glass-panel px-2 py-1.5 sticky top-[73px] z-20">
      <ToolbarButton title="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
        <HiH1 />
      </ToolbarButton>
      <ToolbarButton title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <HiH2 />
      </ToolbarButton>
      <div className="w-px h-5 bg-white/[0.1] mx-1" />
      <ToolbarButton title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <HiBold />
      </ToolbarButton>
      <ToolbarButton title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <HiItalic />
      </ToolbarButton>
      <ToolbarButton title="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
        <HiOutlineCodeBracket />
      </ToolbarButton>
      <div className="w-px h-5 bg-white/[0.1] mx-1" />
      <ToolbarButton title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <HiOutlineListBullet />
      </ToolbarButton>
      <ToolbarButton title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <HiOutlineNumberedList />
      </ToolbarButton>
      <ToolbarButton
        title="Insert table"
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      >
        <HiOutlineTable />
      </ToolbarButton>
      <div className="w-px h-5 bg-white/[0.1] mx-1" />
      <ToolbarButton title="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <HiOutlineChatBubbleLeftRight />
      </ToolbarButton>
    </div>
  );
}
