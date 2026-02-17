import { socket } from "./socket"
import { store } from "../store/store"

import {
  setGameState,
  resetGame,
} from "../store/gameSlice/gameSlice"

import {
  setPlayer,
  setHand,
  setConnectionStatus,
} from "../store/playerSlice/playerSlice"

import { setLoading, setError } from "../store/uiSlice/uiSlice"

export const registerSocketEvents = () => {
  // ✅ Connected
  socket.on("connect", () => {
    console.log("Connected:", socket.id)
    store.dispatch(setConnectionStatus(true))
  })

  // ❌ Disconnected
  socket.on("disconnect", () => {
    console.log("Disconnected")
    store.dispatch(setConnectionStatus(false))
  })

  // 🎮 Full Game State Sync
  socket.on("gameState", (data) => {
    store.dispatch(setGameState(data.game))
    store.dispatch(setHand(data.hand))
  })

  // 👤 Player Joined
  socket.on("playerJoined", (data) => {
    store.dispatch(setGameState(data.game))
  })

  // 🃏 Card Played
  socket.on("cardPlayed", (data) => {
    store.dispatch(setGameState(data.game))
  })

  // 🏆 Round Finished
  socket.on("roundResult", (data) => {
    store.dispatch(setGameState(data.game))
  })

  // ❗ Error
  socket.on("errorMessage", (message) => {
    store.dispatch(setError(message))
  })

  // 🔁 Game Reset
  socket.on("gameReset", () => {
    store.dispatch(resetGame())
  })
}
