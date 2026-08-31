import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAppSelector } from "@/app/hooks";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "/";

/**
 * Tracks which members of a set of workspaces are currently online.
 * Joins a lightweight Socket.io room per workspace (no Yjs/CRDT involved -
 * this is just presence, not document content) and keeps a live map of
 * workspaceId -> online userIds as members connect/disconnect anywhere
 * in the app (editor, dashboard, workspace page all count).
 */
export function useWorkspacePresence(workspaceIds: string[]) {
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const socketRef = useRef<Socket | null>(null);
  const [onlineByWorkspace, setOnlineByWorkspace] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!accessToken || workspaceIds.length === 0) return undefined;

    const socket = io(SOCKET_URL, {
      path: "/socket.io",
      auth: { token: accessToken },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      workspaceIds.forEach((id) => socket.emit("workspace:join", { workspaceId: id }));
    });

    socket.on(
      "workspace:presence",
      ({ workspaceId, onlineUserIds }: { workspaceId: string; onlineUserIds: string[] }) => {
        setOnlineByWorkspace((prev) => ({ ...prev, [workspaceId]: onlineUserIds }));
      }
    );

    return () => {
      workspaceIds.forEach((id) => socket.emit("workspace:leave", { workspaceId: id }));
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, workspaceIds.join(",")]);

  return onlineByWorkspace;
}
