"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachSocketServer = attachSocketServer;
const socket_io_1 = require("socket.io");
const Y = __importStar(require("yjs"));
const awarenessProtocol = __importStar(require("y-protocols/awareness"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const Document_model_1 = require("../models/Document.model");
const SNAPSHOT_INTERVAL_MS = 4000;
const rooms = new Map();
async function persistRoom(documentId, room) {
    // Only the raw CRDT update log is persisted here. The queryable JSON
    // snapshot (Document.content, used by dashboard/export/search) is
    // saved separately via a debounced REST PATCH from the client's
    // TipTap instance - reconstructing ProseMirror JSON from the Y.XmlFragment
    // requires the client's schema, which this server intentionally doesn't
    // duplicate. This keeps "live wire format" and "queryable snapshot" as
    // two clearly separated concerns instead of one fragile shared path.
    const update = Y.encodeStateAsUpdate(room.doc);
    await Document_model_1.SyncDocument.findByIdAndUpdate(documentId, { ydocState: Buffer.from(update) });
}
async function loadRoom(documentId) {
    const existing = rooms.get(documentId);
    if (existing)
        return existing;
    const doc = new Y.Doc();
    const dbDoc = await Document_model_1.SyncDocument.findById(documentId).select("+ydocState");
    if (dbDoc?.ydocState) {
        Y.applyUpdate(doc, new Uint8Array(dbDoc.ydocState));
    }
    const awareness = new awarenessProtocol.Awareness(doc);
    const room = {
        doc,
        awareness,
        socketIds: new Set(),
        dirty: false,
        flushTimer: setInterval(() => {
            if (room.dirty) {
                room.dirty = false;
                persistRoom(documentId, room).catch((err) => console.error(`[socket] snapshot flush failed for ${documentId}:`, err));
            }
        }, SNAPSHOT_INTERVAL_MS),
    };
    doc.on("update", () => {
        room.dirty = true;
    });
    rooms.set(documentId, room);
    return room;
}
async function teardownRoomIfEmpty(documentId) {
    const room = rooms.get(documentId);
    if (!room || room.socketIds.size > 0)
        return;
    clearInterval(room.flushTimer);
    try {
        await persistRoom(documentId, room);
    }
    catch (err) {
        console.error(`[socket] final flush failed for ${documentId}:`, err);
    }
    room.doc.destroy();
    rooms.delete(documentId);
}
function authenticateSocket(socket) {
    try {
        const token = socket.handshake.auth?.token ||
            (socket.handshake.headers.authorization?.toString().replace("Bearer ", "") ?? "");
        if (!token)
            return null;
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_SECRET);
        return { userId: payload.sub };
    }
    catch {
        return null;
    }
}
function attachSocketServer(httpServer) {
    const LOCALHOST_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: (origin, callback) => {
                if (!origin)
                    return callback(null, true);
                if (origin === env_1.env.CLIENT_URL)
                    return callback(null, true);
                if (!env_1.env.isProd && LOCALHOST_ORIGIN.test(origin))
                    return callback(null, true);
                callback(new Error(`Socket.io CORS: origin ${origin} not allowed`));
            },
            credentials: true,
        },
    });
    io.use((socket, next) => {
        const auth = authenticateSocket(socket);
        if (!auth)
            return next(new Error("Unauthorized socket connection"));
        socket.data.userId = auth.userId;
        next();
    });
    io.on("connection", (socket) => {
        let joinedDocumentId = null;
        let clientId = null;
        socket.on("document:join", async ({ documentId, user }) => {
            joinedDocumentId = documentId;
            socket.join(documentId);
            const room = await loadRoom(documentId);
            room.socketIds.add(socket.id);
            clientId = Math.floor(Math.random() * 1e9);
            socket.emit("document:sync", {
                update: Array.from(Y.encodeStateAsUpdate(room.doc)),
                awareness: Array.from(awarenessProtocol.encodeAwarenessUpdate(room.awareness, Array.from(room.awareness.getStates().keys()))),
                clientId,
            });
            socket.data.presence = { userId: socket.data.userId, name: user?.name, color: user?.color, clientId };
            socket.to(documentId).emit("presence:join", socket.data.presence);
        });
        socket.on("document:update", ({ documentId, update }) => {
            const room = rooms.get(documentId);
            if (!room)
                return;
            Y.applyUpdate(room.doc, new Uint8Array(update), socket.id);
            socket.to(documentId).emit("document:update", { update });
        });
        socket.on("awareness:update", ({ documentId, update }) => {
            const room = rooms.get(documentId);
            if (!room)
                return;
            awarenessProtocol.applyAwarenessUpdate(room.awareness, new Uint8Array(update), socket.id);
            socket.to(documentId).emit("awareness:update", { update });
        });
        // Typing indicator - lightweight, ephemeral, not part of CRDT/awareness
        // state so it doesn't get persisted or replayed to late joiners.
        socket.on("typing:start", ({ documentId, blockId }) => {
            socket.to(documentId).emit("typing:start", { userId: socket.data.userId, blockId });
        });
        socket.on("typing:stop", ({ documentId, blockId }) => {
            socket.to(documentId).emit("typing:stop", { userId: socket.data.userId, blockId });
        });
        socket.on("cursor:move", ({ documentId, position }) => {
            socket.to(documentId).emit("cursor:move", { userId: socket.data.userId, position });
        });
        socket.on("disconnect", async () => {
            if (!joinedDocumentId)
                return;
            const room = rooms.get(joinedDocumentId);
            if (!room)
                return;
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
//# sourceMappingURL=syncServer.js.map