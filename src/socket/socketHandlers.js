import { socket } from "./socket"
import { store } from "../store/store"

import {
  setGameState,
  resetGame,
} from "../store/gameSlice/gameSlice"

import {
  setHand,
  setConnectionStatus,
} from "../store/playerSlice/playerSlice"

import { setError } from "../store/uiSlice/uiSlice"

const onConnect = () => {
  console.log("Connected:", socket.id)
  store.dispatch(setConnectionStatus(true))
}

const onDisconnect = () => {
  console.log("Disconnected")
  store.dispatch(setConnectionStatus(false))
}

const onGameState = (data) => {
  store.dispatch(setGameState(data.game))
  store.dispatch(setHand(data.hand))
}

const onPlayerJoined = (data) => {
  store.dispatch(setGameState(data.game))
}

const onCardPlayed = (data) => {
  store.dispatch(setGameState(data.game))
}

const onRoundResult = (data) => {
  store.dispatch(setGameState(data.game))
}

const onErrorMessage = (message) => {
  store.dispatch(setError(message))
}

const onGameReset = () => {
  store.dispatch(resetGame())
}

export const registerSocketEvents = () => {
  unregisterSocketEvents()

  socket.on("connect", onConnect)
  socket.on("disconnect", onDisconnect)
  socket.on("gameState", onGameState)
  socket.on("playerJoined", onPlayerJoined)
  socket.on("cardPlayed", onCardPlayed)
  socket.on("roundResult", onRoundResult)
  socket.on("errorMessage", onErrorMessage)
  socket.on("gameReset", onGameReset)
}

export const unregisterSocketEvents = () => {
  socket.off("connect", onConnect)
  socket.off("disconnect", onDisconnect)
  socket.off("gameState", onGameState)
  socket.off("playerJoined", onPlayerJoined)
  socket.off("cardPlayed", onCardPlayed)
  socket.off("roundResult", onRoundResult)
  socket.off("errorMessage", onErrorMessage)
  socket.off("gameReset", onGameReset)
}
