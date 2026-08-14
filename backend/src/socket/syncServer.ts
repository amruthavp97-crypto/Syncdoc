import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import * as Y from "yjs";
import * as awarenessProtocol from "y-protocols/awareness";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { SyncDocument } from "../models/Document.model";
import { AccessTokenPayload } from "../services/token.service";

const SNAPSHOT_INTERVAL_MS = 4000;

interface Room {
  doc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
  socketIds: Set<string>;
  dirty: boolean;
  flushTimer: NodeJS.Timeout;
}

const rooms = new Map<string, Room>();

async function persistRoom(documentId: string, room: Room) {
  // Only the raw CRDT update log is persisted here. The queryable JSON
  // snapshot (Document.content, used by dashboard/export/search) is
  // saved separately via a debounced REST PATCH from the client's
  // TipTap instance - reconstructing ProseMirror JSON from the Y.XmlFragment
  // requires the client's schema, which this server intentionally doesn't
  // duplicate. This keeps "live wire format" and "queryable snapshot" as
  // two clearly separated concerns instead of one fragile shared path.
  const update = Y.encodeStateAsUpdate(room.doc);
  await SyncDocument.findByIdAndUpdate(documentId, { ydocState: Buffer.from(update) });
}

async function loadRoom(documentId: string): Promise<Room> {
  const existing = rooms.get(documentId);
  if (existing) return existing;

  const doc = new Y.Doc();
  const dbDoc = await SyncDocument.findById(documentId).select("+ydocState");
  if (dbDoc?.ydocState) {
    Y.applyUpdate(doc, new Uint8Array(dbDoc.ydocState));
  }

  const awareness = new awarenessProtocol.Awareness(doc);
  const room: Room = {
    doc,
    awareness,
    socketIds: new Set(),
    dirty: false,
    flushTimer: setInterval(() => {
      if (room.dirty) {
        room.dirty = false;
        persistRoom(documentId, room).catch((err) =>
          console.error(`[socket] snapshot flush failed for ${documentId}:`, err)
        );
      }
    }, SNAPSHOT_INTERVAL_MS),
  };
  doc.on("update", () => {
    room.dirty = true;
  });
  rooms.set(documentId, room);
  return room;
}

async function teardownRoomIfEmpty(documentId: string) {
  const room = rooms.get(documentId);
  if (!room || room.socketIds.size > 0) return;
  clearInterval(room.flushTimer);
  try {
    await persistRoom(documentId, room);
  } catch (err) {
    console.error(`[socket] final flush failed for ${documentId}:`, err);
  }
  room.doc.destroy();
  rooms.delete(documentId);
}

function authenticateSocket(socket: Socket): { userId: string } | null {
  try {
    const token =
      (socket.handshake.auth?.token as string | undefined) ||
      (socket.handshake.headers.authorization?.toString().replace("Bearer ", "") ?? "");
    if (!token) return null;
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
    return { userId: payload.sub };
  } catch {
    return null;
  }
}

export function attachSocketServer(httpServer: HttpServer): SocketIOServer {
  const LOCALHOST_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (origin === env.CLIENT_URL) return callback(null, true);
        if (!env.isProd && LOCALHOST_ORIGIN.test(origin)) return callback(null, true);
        callback(new Error(`Socket.io CORS: origin ${origin} not allowed`));
      },
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const auth = authenticateSocket(socket);
    if (!auth) return next(new Error("Unauthorized socket connection"));
    socket.data.userId = auth.userId;
    next();
  });

  io.on("connection", (socket: Socket) => {
    let joinedDocumentId: string | null = null;
    let clientId: number | null = null;

    socket.on("document:join", async ({ documentId, user }: { documentId: string; user: { name: string; color: string } }) => {
      joinedDocumentId = documentId;
      socket.join(documentId);
      const room = await loadRoom(documentId);
      room.socketIds.add(socket.id);

      clientId = Math.floor(Math.random() * 1e9);

      socket.emit("document:sync", {
        update: Array.from(Y.encodeStateAsUpdate(room.doc)),
        awareness: Array.from(
          awarenessProtocol.encodeAwarenessUpdate(room.awareness, Array.from(room.awareness.getStates().keys()))
        ),
        clientId,
      });

      socket.data.presence = { userId: socket.data.userId, name: user?.name, color: user?.color, clientId };
      socket.to(documentId).emit("presence:join", socket.data.presence);
    });

    socket.on("document:update", ({ documentId, update }: { documentId: string; update: number[] }) => {
      const room = rooms.get(documentId);
      if (!room) return;
      Y.applyUpdate(room.doc, new Uint8Array(update), socket.id);
      socket.to(documentId).emit("document:update", { update });
    });

    socket.on("awareness:update", ({ documentId, update }: { documentId: string; update: number[] }) => {
      const room = rooms.get(documentId);
      if (!room) return;
      awarenessProtocol.applyAwarenessUpdate(room.awareness, new Uint8Array(update), socket.id);
      socket.to(documentId).emit("awareness:update", { update });
    });

    // Typing indicator - lightweight, ephemeral, not part of CRDT/awareness
    // state so it doesn't get persisted or replayed to late joiners.
    socket.on("typing:start", ({ documentId, blockId }: { documentId: string; blockId: string }) => {
      socket.to(documentId).emit("typing:start", { userId: socket.data.userId, blockId });
    });
    socket.on("typing:stop", ({ documentId, blockId }: { documentId: string; blockId: string }) => {
      socket.to(documentId).emit("typing:stop", { userId: socket.data.userId, blockId });
    });

    socket.on("cursor:move", ({ documentId, position }: { documentId: string; position: unknown }) => {
      socket.to(documentId).emit("cursor:move", { userId: socket.data.userId, position });
    });

    socket.on("disconnect", async () => {
      if (!joinedDocumentId) return;
      const room = rooms.get(joinedDocumentId);
      if (!room) return;
      room.socketIds.delete(socket.id);
      if (clientId !== null) {
        awarenessProtocol.removeAwarenessStates(room.awareness, [clientId], "disconnect");
      }
      socket.to(joinedDocumentId).emit("presence:leave", { userId: socket.data.userId, clientId });
      await teardownRoomIfEmpty(joinedDocumentId);
    });
  });

  return io;
}
