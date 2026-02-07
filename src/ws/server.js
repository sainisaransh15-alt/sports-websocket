import WebSocket, { WebSocketServer } from "ws";
import { wsArcjet } from "../arcjet.js";

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
function broadcast(wss, payload) {
  const msg = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue;
    client.send(msg);
  }
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

    sendJson(socket, { type: "welcome" });

    socket.on("error", (err) => {
      console.error("WebSocket error:", err);
    });
  });

  function broadcastMatchCreated(match) {
    broadcast(wss, { type: "matchCreated", match });
  }

  return { broadcastMatchCreated };
}
