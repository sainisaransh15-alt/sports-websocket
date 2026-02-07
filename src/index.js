import "dotenv/config";
import express from "express";
import http from "http";

import { matchrouter } from "./routes/matches.js";
import { attachwebsocket } from "./ws/server.js";

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

const app = express();
app.use(express.json());

const server = http.createServer(app);

// health check
app.get("/", (req, res) => {
  res.send("Hello World");
});

// routes
app.use("/matches", matchrouter);

// websocket
const { broadcastMatchCreated } = attachwebsocket(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;

server.listen(PORT, HOST, () => {
  const baseUrl =
    HOST === "0.0.0.0" ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;

  console.log(`Server is running at ${baseUrl}`);
  console.log(`WebSocket endpoint: ws://${HOST}:${PORT}/ws`);
});
