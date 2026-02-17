import { connectSocket, disconnectSocket, socket } from "./socket"

export const connectToServer = () => {
  connectSocket()
}

export const disconnectFromServer = () => {
  disconnectSocket()
}

export const joinRoom = (roomId, playerName) => {
  socket.emit("joinRoom", { roomId, playerName })
}

export const playCard = (card) => {
  socket.emit("playCard", { card })
}

export const passCards = (cards) => {
  socket.emit("passCards", { cards })
}

export const startGame = (roomId) => {
  socket.emit("startGame", { roomId })
}
