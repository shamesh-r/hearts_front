// Shared Socket.IO client instance for the frontend app.
import { io } from "socket.io-client";

// Can be overridden from Vite env (e.g. .env -> VITE_SOCKET_URL=...).
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const socket = io(SOCKET_URL, {
  // Start disconnected so listeners can be attached first.
  autoConnect: false,
  // Prefer websocket, but allow polling fallback.
  transports: ["websocket", "polling"],
});

export const connectSocket = () => {
  // Idempotent connect helper.
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  // Idempotent disconnect helper.
  if (socket.connected) {
    socket.disconnect();
  }
};
