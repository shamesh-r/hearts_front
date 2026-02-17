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
      state.players = action.payload
    },

    setCurrentTurn: (state, action) => {
      state.currentTurn = action.payload
    },

    setCurrentTrick: (state, action) => {
      state.currentTrick = action.payload
    },

    setHeartsBroken: (state, action) => {
      state.heartsBroken = action.payload
    },

    setScores: (state, action) => {
      state.scores = action.payload
    },

    setPhase: (state, action) => {
      state.phase = action.payload
    },

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
