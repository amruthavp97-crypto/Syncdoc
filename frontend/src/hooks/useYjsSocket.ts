import { useEffect, useMemo, useRef, useState } from "react";
import * as Y from "yjs";
import * as awarenessProtocol from "y-protocols/awareness";
import { io, Socket } from "socket.io-client";
import { useAppSelector } from "@/app/hooks";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "/";

const PRESENCE_COLORS = ["#7c5cff", "#3e7bfa", "#4fd0e8", "#3ddc97", "#f7b955", "#ff6b6b"];
function colorFor(userId: string) {
  let hash = 0;
  for (const ch of userId) hash = (hash * 31 + ch.charCodeAt(0)) % PRESENCE_COLORS.length;
  return PRESENCE_COLORS[hash];
}

export interface PeerPresence {
  clientId: number;
  userId: string;
  name: string;
  color: string;
}

export function useYjsSocket(documentId: string | undefined) {
  const user = useAppSelector((s) => s.auth.user);
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const ydoc = useMemo(() => new Y.Doc(), [documentId]);
  const awareness = useMemo(() => new awarenessProtocol.Awareness(ydoc), [ydoc]);
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [peers, setPeers] = useState<PeerPresence[]>([]);

  useEffect(() => {
    if (!documentId || !user || !accessToken) return undefined;

    const socket = io(SOCKET_URL, {
      path: "/socket.io",
      auth: { token: accessToken },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    const localColor = colorFor(user.id);
    awareness.setLocalStateField("user", { name: user.name, color: localColor });

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("document:join", { documentId, user: { name: user.name, color: localColor } });
    });
    socket.on("disconnect", () => setConnected(false));

    socket.on("document:sync", ({ update, awareness: awState }: { update: number[]; awareness: number[] }) => {
      Y.applyUpdate(ydoc, new Uint8Array(update), "remote-init");
      if (awState?.length) {
        awarenessProtocol.applyAwarenessUpdate(awareness, new Uint8Array(awState), "remote-init");
      }
    });

    socket.on("document:update", ({ update }: { update: number[] }) => {
      Y.applyUpdate(ydoc, new Uint8Array(update), "remote");
    });

    socket.on("awareness:update", ({ update }: { update: number[] }) => {
      awarenessProtocol.applyAwarenessUpdate(awareness, new Uint8Array(update), "remote");
    });

    const onDocUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === "remote" || origin === "remote-init") return; // don't echo back
      socket.emit("document:update", { documentId, update: Array.from(update) });
    };
    ydoc.on("update", onDocUpdate);

    const onAwarenessUpdate = (
      { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
      origin: unknown
    ) => {
      if (origin === "remote" || origin === "remote-init") return;
      const changed = added.concat(updated, removed);
      const update = awarenessProtocol.encodeAwarenessUpdate(awareness, changed);
      socket.emit("awareness:update", { documentId, update: Array.from(update) });
    };
    awareness.on("update", onAwarenessUpdate);

    const syncPeers = () => {
      const states: PeerPresence[] = [];
      awareness.getStates().forEach((state, clientId) => {
        if (state.user && clientId !== awareness.clientID) {
          states.push({ clientId, userId: String(clientId), name: state.user.name, color: state.user.color });
        }
      });
      setPeers(states);
    };
    awareness.on("change", syncPeers);

    return () => {
      ydoc.off("update", onDocUpdate);
      awareness.off("update", onAwarenessUpdate);
      awareness.off("change", syncPeers);
      awarenessProtocol.removeAwarenessStates(awareness, [awareness.clientID], "unmount");
      socket.disconnect();
      ydoc.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, user?.id, accessToken]);

  return { ydoc, awareness, connected, peers, socket: socketRef.current, currentUser: user };
}
