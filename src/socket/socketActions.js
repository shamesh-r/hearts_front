// Outbound socket actions used by UI/controllers to talk to backend.
import { connectSocket, disconnectSocket, socket } from "./socket"

/**
 * Opens socket connection if not connected already.
 */
export const connectToServer = () => {
  // Opens socket connection.
  connectSocket()
}

/**
 * Closes active socket connection.
 */
export const disconnectFromServer = () => {
  // Closes socket connection.
  disconnectSocket()
}

/**
 * Emits join-room request.
 */
export const joinRoom = (roomId, playerName) => {
  // Join a specific multiplayer room.
  socket.emit("joinRoom", { roomId, playerName })
}

/**
 * Emits card play action.
 */
export const playCard = (card) => {
  // Send selected card to server for turn validation.
  socket.emit("playCard", { card })
}

/**
 * Emits pass-cards action for passing phase.
 */
export const passCards = (cards) => {
  // Send pass phase selection.
  socket.emit("passCards", { cards })
}

/**
 * Emits start-game/join request with player display name.
 */
export const startGame = (name) => {
  // Register player identity / request game start flow.
  console.log(name)
  socket.emit("startGame", { name })
}
