import { PeerPresence } from "@/hooks/useYjsSocket";

export default function PresenceStack({ peers, connected }: { peers: PeerPresence[]; connected: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 text-xs text-ink-500 font-mono">
        <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-accent-success" : "bg-accent-danger"}`} />
        {connected ? "Live" : "Offline"}
      </div>
      <div className="flex -space-x-2">
        {peers.map((p) => (
          <div
            key={p.clientId}
            title={p.name}
            className="w-8 h-8 rounded-full grid place-items-center text-[10px] font-bold text-white border-2 border-base-900"
            style={{ backgroundColor: p.color }}
          >
            {p.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
        ))}
      </div>
    </div>
  );
}
