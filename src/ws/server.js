import WebSocket, { WebSocketServer } from "ws";
import { wsArcjet } from "../arcjet.js";

const matchSubscriber = new Map(); // matchId -> Set of WebSocket clients

function subscribeToMatch(matchId, socket) {
  if (!matchSubscriber.has(matchId)) {
    matchSubscriber.set(matchId, new Set());
  }
  matchSubscriber.get(matchId).add(socket);
}

function unsubscribeFromMatch(matchId, socket) {
  const subscribers = matchSubscriber.get(matchId);
  if (!subscribers) return;

  subscribers.delete(socket);
  if (subscribers.size === 0) {
    matchSubscriber.delete(matchId);
  }
}

function cleanupSubscriptions(socket) {
  for (const matchId of socket.subscriptions) {
    unsubscribeFromMatch(matchId, socket);
  }
}

function broadcastToMatch(matchId, payload) {
  const subscribers = matchSubscriber.get(matchId);
  if (!subscribers || subscribers.size === 0) return;

  const msg = JSON.stringify(payload);
  for (const client of subscribers) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
}

/**
 * Safely send JSON payload to a single websocket client.
 */
function sendJson(socket, payload) {
  if (socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(payload));
}

/**
 * Broadcast JSON payload to all connected websocket clients.
 */
function broadcasttoall(wss, payload) {
  const msg = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue;
    client.send(msg);
  }
}

function handleMessage(socket, data) {
  let msg;
  try {
    msg = JSON.parse(data.toString());
  } catch (err) {
    sendJson(socket, { type: "error", message: "Invalid JSON" });
    return;
  }

  // ✅ Support both message types
  if (
    (msg?.type === "subscribeMatch" || msg?.type === "subscribe") &&
    Number.isInteger(msg.matchId)
  ) {
    subscribeToMatch(msg.matchId, socket);
    socket.subscriptions.add(msg.matchId);
    sendJson(socket, { type: "subscribed", matchId: msg.matchId });
    return;
  }

  if (
    (msg?.type === "unsubscribeMatch" || msg?.type === "unsubscribe") &&
    Number.isInteger(msg.matchId)
  ) {
    unsubscribeFromMatch(msg.matchId, socket);
    socket.subscriptions.delete(msg.matchId);
    sendJson(socket, { type: "unsubscribed", matchId: msg.matchId });
    return;
  }

  sendJson(socket, { type: "error", error: "Unknown message type" });
}

/**
 * Attach websocket server to an existing HTTP server.
 * Returns broadcaster functions you can call from routes.
 */
export function attachwebsocket(server) {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 1024 * 1024, // 1MB
  });

  wss.on("connection", async (socket, req) => {
    // Arcjet protection for WS handshake
    if (wsArcjet) {
      try {
        const decision = await wsArcjet.protect(req);

        if (decision.blocked) {
          const isRateLimit = decision.reason?.isRateLimit?.();
          const code = isRateLimit ? 1013 : 1008;
          const reason = isRateLimit ? "Rate limit exceeded" : "Forbidden";
          socket.close(code, reason);
          return;
        }
      } catch (error) {
        console.error("Arcjet WS error:", error);
        socket.close(1011, "Service unavailable");
        return;
      }
    }

    socket.subscriptions = new Set();
    socket.on("message", (data) => handleMessage(socket, data));
    socket.on("close", () => cleanupSubscriptions(socket));
    sendJson(socket, { type: "welcome" });

    socket.on("error", () => {
      socket.terminate();
    });
  });

  function broadcastMatchCreated(match) {
    // ✅ FIX: broadcast() was not defined
    broadcasttoall(wss, { type: "matchCreated", match });
  }

  function broadcastCommentary(matchId, comment) {
    broadcastToMatch(matchId, { type: "commentary", data: { comment } });
  }

  return { broadcastMatchCreated, broadcastCommentary };
}