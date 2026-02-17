// Outbound socket actions used by UI/controllers to talk to backend.
import { connectSocket, disconnectSocket, socket } from "./socket"

export const connectToServer = () => {
  // Opens socket connection.
  connectSocket()
}

export const disconnectFromServer = () => {
  // Closes socket connection.
  disconnectSocket()
}

export const joinRoom = (roomId, playerName) => {
  // Join a specific multiplayer room.
  socket.emit("joinRoom", { roomId, playerName })
}

export const playCard = (card) => {
  // Send selected card to server for turn validation.
  socket.emit("playCard", { card })
}

export const passCards = (cards) => {
  // Send pass phase selection.
  socket.emit("passCards", { cards })
}

export const startGame = (name) => {
  // Register player identity / request game start flow.
  console.log(name)
  socket.emit("startGame", { name })
}
