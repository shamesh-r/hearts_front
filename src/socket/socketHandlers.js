// Inbound socket event handlers that sync Redux and publish app-level events.
import { socket } from "./socket"
import { store } from "../store/store"
import { gameEvents } from "../events/gameEvents"

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
  // Update connection status when socket opens.
  console.log("Connected:", socket.id)
  store.dispatch(setConnectionStatus(true))
}

const onDisconnect = () => {
  // Update connection status when socket closes.
  console.log("Disconnected")
  store.dispatch(setConnectionStatus(false))
}

const onGameState = (data) => {
  // Server-authoritative game snapshot.
  store.dispatch(setGameState(data.game))
  store.dispatch(setHand(data.hand))
  gameEvents.emit("GAME_STATE", data)
}

const emitLobbyUpdate = (data) => {
  // Normalize player list shape and fan out to game controller.
  const players = data?.players || data?.game?.players || []
  if (!Array.isArray(players)) {
    return
  }

  gameEvents.emit("GAME_CREATED", {
    players,
    mySocketId: socket.id,
  })
}

const onPlayerJoined = (data) => {
  // Keep store in sync and refresh lobby list.
  store.dispatch(setGameState(data.game))
  emitLobbyUpdate(data)
}

const onCardPlayed = (data) => {
  // Re-render from latest state after a move.
  store.dispatch(setGameState(data.game))
  gameEvents.emit("GAME_STATE", data)
}

const onRoundResult = (data) => {
  // Re-render after a trick/round resolves.
  store.dispatch(setGameState(data.game))
  gameEvents.emit("GAME_STATE", data)
}

const onErrorMessage = (message) => {
  // Surface backend errors in UI state.
  store.dispatch(setError(message))
}

const onGameReset = () => {
  // Reset game slice on server reset event.
  store.dispatch(resetGame())
}

const onGameCreated = (data) =>{
    // Initial room/game event from backend.
    console.log("Game created:", data)
    emitLobbyUpdate(data)
    if (data?.game || data?.hand || data?.playerHand || data?.myHand) {
      // Some backends send first state snapshot with gameCreated.
      gameEvents.emit("GAME_STATE", data)
    }
}

export const registerSocketEvents = () => {
  // Guard against duplicate listeners on re-init/HMR.
  unregisterSocketEvents()

  socket.on("connect", onConnect)
  socket.on("disconnect", onDisconnect)
  socket.on("gameState", onGameState)
  socket.on("playerJoined", onPlayerJoined)
  socket.on("cardPlayed", onCardPlayed)
  socket.on("roundResult", onRoundResult)
  socket.on("errorMessage", onErrorMessage)
  socket.on("gameReset", onGameReset)
  socket.on("gameCreated", onGameCreated)
}

export const unregisterSocketEvents = () => {
  // Remove all listeners registered in registerSocketEvents.
  socket.off("connect", onConnect)
  socket.off("gameCreated", onGameCreated)
  socket.off("disconnect", onDisconnect)
  socket.off("gameState", onGameState)
  socket.off("playerJoined", onPlayerJoined)
  socket.off("cardPlayed", onCardPlayed)
  socket.off("roundResult", onRoundResult)
  socket.off("errorMessage", onErrorMessage)
  socket.off("gameReset", onGameReset)
}
