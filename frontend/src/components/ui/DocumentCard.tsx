import { Link } from "react-router-dom";
import { HiOutlineDocumentText } from "react-icons/hi2";
import { formatDistanceToNow } from "@/lib/formatDate";

export interface DocSummary {
  _id: string;
  title: string;
  updatedAt: string;
  tags?: string[];
}

export default function DocumentCard({ doc }: { doc: DocSummary }) {
  return (
    <Link
      to={`/documents/${doc._id}`}
      className="glass-card p-4 flex flex-col gap-3 hover:border-brand-violet/30 hover:-translate-y-0.5 transition-all duration-200 group"
    >
      <div className="w-9 h-9 rounded-lg bg-white/[0.06] grid place-items-center group-hover:bg-brand-gradient/20 transition-colors">
        <HiOutlineDocumentText className="text-ink-300" />
      </div>
      <div className="min-w-0">
        <div className="font-medium text-sm truncate">{doc.title || "Untitled"}</div>
        <div className="text-xs text-ink-700 mt-1">Updated {formatDistanceToNow(doc.updatedAt)}</div>
      </div>
    </Link>
  );
}
