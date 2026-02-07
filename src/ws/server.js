import { WebSocketServer, WebSocket } from "ws";

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
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue;
    client.send(JSON.stringify(payload));
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
    maxPayload: 1024 * 1024 * 1, // 1MB
  });

  wss.on("connection", (socket) => {
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
