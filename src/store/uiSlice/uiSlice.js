// Redux slice for transient UI-only state.
import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  loading: false,
  error: null,
  showScoreBoard: false,
}

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setLoading: (state, action) => {
      // Toggles global loading state.
      state.loading = action.payload
    },

    setError: (state, action) => {
      // Stores latest user-visible error text.
      state.error = action.payload
    },

    toggleScoreBoard: (state) => {
      // Opens/closes scoreboard overlay.
      state.showScoreBoard = !state.showScoreBoard
    },

    // Restores UI flags to defaults.
    resetUI: () => initialState,
  },
})

export const {
  setLoading,
  setError,
  toggleScoreBoard,
  resetUI,
} = uiSlice.actions

export default uiSlice.reducer
