import { Server } from "socket.io";
import type { Server as HttpServer } from "node:http";
import { type Quest } from "./quest.js";
import { teamStatePayload } from "./routes.team.js";

export function makeSockets(httpServer: HttpServer, quest: Quest): Server {
  // Same-origin only (Caddy serves the frontend and proxies the API together).
  const io = new Server(httpServer, { cors: { origin: false } });

  io.on("connection", (socket) => {
    socket.emit("team:state", teamStatePayload(quest));
  });

  return io;
}
