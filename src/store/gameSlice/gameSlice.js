// Redux slice for shared Hearts game state.
import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  roomId: null,
  players: [],
  currentTurn: null,
  currentTrick: [],
  heartsBroken: false,
  scores: {},
  phase: "waiting", // waiting | passing | playing | scoring | finished
}

const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    setGameState: (state, action) => {
      // Replace whole game snapshot from server.
      return action.payload
    },

    setPlayers: (state, action) => {
      // Updates player list only.
      state.players = action.payload
    },

    setCurrentTurn: (state, action) => {
      // Sets active turn owner.
      state.currentTurn = action.payload
    },

    setCurrentTrick: (state, action) => {
      // Stores cards currently in trick.
      state.currentTrick = action.payload
    },

    setHeartsBroken: (state, action) => {
      // Tracks hearts-break rule state.
      state.heartsBroken = action.payload
    },

    setScores: (state, action) => {
      // Replaces score board map.
      state.scores = action.payload
    },

    setPhase: (state, action) => {
      // Updates phase machine state.
      state.phase = action.payload
    },

    // Restores game slice to initial empty state.
    resetGame: () => initialState,
  },
})

export const {
  setGameState,
  setPlayers,
  setCurrentTurn,
  setCurrentTrick,
  setHeartsBroken,
  setScores,
  setPhase,
  resetGame,
} = gameSlice.actions

export default gameSlice.reducer
