import { configureStore } from "@reduxjs/toolkit"
import gameReducer from "./gameSlice/gameSlice"
import playerReducer from "./playerSlice/playerSlice"
import uiReducer from "./uiSlice/uiSlice"

export const store = configureStore({
  reducer: {
    game: gameReducer,
    player: playerReducer,
    ui: uiReducer,
  },
  devTools: true,
})