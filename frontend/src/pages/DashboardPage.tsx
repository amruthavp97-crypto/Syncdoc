import { useQuery } from "@tanstack/react-query";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";
import { HiOutlineDocumentText, HiOutlineUserGroup, HiOutlineCircleStack } from "react-icons/hi2";
import { api } from "@/api/client";
import StatCard from "@/components/ui/StatCard";
import DocumentCard, { DocSummary } from "@/components/ui/DocumentCard";
import { Link } from "react-router-dom";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

interface DashboardSummary {
  cards: { documents: number; workspaces: number; storageUsedBytes: number };
  pinned: DocSummary[];
  favorites: DocSummary[];
  recent: DocSummary[];
}
interface AnalyticsResponse {
  documentsCreatedByDay: { date: string; count: number }[];
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => (await api.get<DashboardSummary>("/dashboard/summary")).data,
  });
  const { data: analytics } = useQuery({
    queryKey: ["dashboard-analytics"],
    queryFn: async () => (await api.get<AnalyticsResponse>("/dashboard/analytics")).data,
  });

  const chartData = {
    labels: analytics?.documentsCreatedByDay.map((d) => d.date.slice(5)) || [],
    datasets: [
      {
        label: "Documents created",
        data: analytics?.documentsCreatedByDay.map((d) => d.count) || [],
        borderColor: "#7c5cff",
        backgroundColor: "rgba(124,92,255,0.15)",
        fill: true,
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Dashboard</h1>
          <p className="text-ink-500 text-sm mt-1">Welcome back — here's what's happening.</p>
        </div>
        <Link to="/documents/new" className="btn-gradient text-sm">
          + New document
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Documents" value={data?.cards.documents ?? "—"} icon={HiOutlineDocumentText} />
        <StatCard label="Workspaces" value={data?.cards.workspaces ?? "—"} icon={HiOutlineUserGroup} />
        <StatCard
          label="Storage used"
          value={data ? formatBytes(data.cards.storageUsedBytes) : "—"}
          icon={HiOutlineCircleStack}
        />
      </div>

      <div className="glass-card p-6">
        <h2 className="font-display font-semibold mb-4">Documents created (last 30 days)</h2>
        <div className="h-56">
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { display: false }, ticks: { color: "#8b90ae" } },
                y: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#8b90ae" } },
              },
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-ink-500 text-sm">Loading your documents…</div>
      ) : (
        <>
          {data && data.pinned.length > 0 && (
            <Section title="Pinned documents" docs={data.pinned} />
          )}
          {data && data.favorites.length > 0 && (
            <Section title="Favorites" docs={data.favorites} />
          )}
          <Section title="Recent documents" docs={data?.recent || []} />
        </>
      )}
    </div>
  );
}

function Section({ title, docs }: { title: string; docs: DocSummary[] }) {
  return (
    <div>
      <h2 className="font-display font-semibold mb-3">{title}</h2>
      {docs.length === 0 ? (
        <div className="text-ink-700 text-sm glass-card p-6 text-center">Nothing here yet.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {docs.map((doc) => (
            <DocumentCard key={doc._id} doc={doc} />
          ))}
        </div>
      )}
    </div>
  );
}
