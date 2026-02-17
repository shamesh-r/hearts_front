import { socket } from "./socket"

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
