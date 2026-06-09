import { io } from "socket.io-client";

// Same-origin connection — Caddy proxies /socket.io to the app in production,
// and Vite proxies it in dev.
export const socket = io({ autoConnect: true });
