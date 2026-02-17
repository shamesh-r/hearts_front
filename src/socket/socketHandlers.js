// Inbound socket event handlers that sync Redux and publish app-level events.
import { socket } from "./socket"
import { store } from "../store/store"
import { gameEvents } from "../events/gameEvents"

import {
  setGameState,
  resetGame,
  setPhase,
} from "../store/gameSlice/gameSlice"

import {
  setHand,
  setConnectionStatus,
} from "../store/playerSlice/playerSlice"

import { setError } from "../store/uiSlice/uiSlice"

/**
 * Normalizes backend payloads into a stable shape used by frontend.
 * Supports:
 * - wrapped payload: { game, hand }
 * - direct payload: { roomId, players, ... }
 */
const normalizeStatePayload = (payload) => {
  // Supports both shapes:
  // 1) { game: {...}, hand: [...] }
  // 2) { roomId, players, currentTurn, ... } (direct game state)
  const gameState = payload?.game || payload || {}
  const players = Array.isArray(gameState.players) ? gameState.players : []

  const fallbackHand = players.find(
    (player) => (player.socketId || player.id) === socket.id
  )?.hand

  const hand = payload?.hand || payload?.playerHand || payload?.myHand || fallbackHand || []

  return {
    gameState,
    hand,
  }
}

/**
 * Runs when socket connects successfully.
 */
const onConnect = () => {
  // Update connection status when socket opens.
  console.log("Connected:", socket.id)
  store.dispatch(setConnectionStatus(true))
}

/**
 * Runs when socket disconnects.
 */
const onDisconnect = () => {
  // Update connection status when socket closes.
  console.log("Disconnected")
  store.dispatch(setConnectionStatus(false))
}

/**
 * Handles full game-state sync events from backend.
 */
const onGameState = (data) => {
  // Server-authoritative game snapshot.
  const { gameState, hand } = normalizeStatePayload(data)

  store.dispatch(setGameState(gameState))
  store.dispatch(setHand(hand))
  gameEvents.emit("GAME_STATE", {
    game: gameState,
    hand,
    mySocketId: socket.id,
  })
}

/**
 * Emits lobby-level player updates to the game controller.
 */
const emitLobbyUpdate = (data) => {
  // Normalize player list shape and fan out to game controller.
  const { gameState } = normalizeStatePayload(data)
  const players = gameState?.players || []
  if (!Array.isArray(players)) {
    return
  }

  gameEvents.emit("GAME_CREATED", {
    players,
    mySocketId: socket.id,
  })
}

/**
 * Handles player-joined events.
 */
const onPlayerJoined = (data) => {
  // Keep store in sync and refresh lobby list.
  const { gameState } = normalizeStatePayload(data)
  store.dispatch(setGameState(gameState))
  emitLobbyUpdate(data)
}

/**
 * Handles card-play updates and re-emits normalized state.
 */
const onCardPlayed = (data) => {
  // Re-render from latest state after a move.
  const { gameState, hand } = normalizeStatePayload(data)
  store.dispatch(setGameState(gameState))
  gameEvents.emit("GAME_STATE", {
    game: gameState,
    hand,
    mySocketId: socket.id,
  })
}

/**
 * Handles round/trick completion updates.
 */
const onRoundResult = (data) => {
  // Re-render after a trick/round resolves.
  const { gameState, hand } = normalizeStatePayload(data)
  store.dispatch(setGameState(gameState))
  gameEvents.emit("GAME_STATE", {
    game: gameState,
    hand,
    mySocketId: socket.id,
  })
}

/**
 * Handles server-side error messages.
 */
const onErrorMessage = (message) => {
  // Surface backend errors in UI state.
  store.dispatch(setError(message))
}

/**
 * Handles game reset events from backend.
 */
const onGameReset = () => {
  // Reset game slice on server reset event.
  store.dispatch(resetGame())
}

/**
 * Handles end of passing phase. Backend sends new hand + next phase.
 */
const onPassingComplete = (data) => {
  const hand = data?.hand || []
  if (Array.isArray(hand)) {
    store.dispatch(setHand(hand))
  }

  if (data?.phase) {
    store.dispatch(setPhase(data.phase))
  }

  gameEvents.emit("PASSING_COMPLETE", {
    hand,
    phase: data?.phase,
    mySocketId: socket.id,
  })
}

/**
 * Handles room/game creation events and bootstraps initial state when available.
 */
const onGameCreated = (data) =>{
    // Initial room/game event from backend.
    console.log("Game created:", data)
    emitLobbyUpdate(data)
    // Some backends send first state snapshot with gameCreated.
    const { gameState, hand } = normalizeStatePayload(data)
    if (Array.isArray(gameState?.players) && gameState.players.length > 0) {
      gameEvents.emit("GAME_STATE", {
        game: gameState,
        hand,
        mySocketId: socket.id,
      })
    }
}

/**
 * Registers all socket listeners used by the app.
 */
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
  socket.on("passingComplete", onPassingComplete)
  socket.on("gameCreated", onGameCreated)
}

/**
 * Unregisters all listeners to avoid duplicate handlers.
 */
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
  socket.off("passingComplete", onPassingComplete)
}
