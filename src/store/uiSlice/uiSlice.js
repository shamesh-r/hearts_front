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
      state.loading = action.payload
    },

    setError: (state, action) => {
      state.error = action.payload
    },

    toggleScoreBoard: (state) => {
      state.showScoreBoard = !state.showScoreBoard
    },

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
