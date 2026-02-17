import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  id: null,
  name: "",
  seatIndex: null,
  hand: [],
  connected: false,
}

const playerSlice = createSlice({
  name: "player",
  initialState,
  reducers: {
    setPlayer: (state, action) => {
      state.id = action.payload.id
      state.name = action.payload.name
      state.seatIndex = action.payload.seatIndex
    },

    setHand: (state, action) => {
      state.hand = action.payload
    },

    removeCardFromHand: (state, action) => {
      state.hand = state.hand.filter(
        (card) => card.id !== action.payload.id
      )
    },

    setConnectionStatus: (state, action) => {
      state.connected = action.payload
    },

    resetPlayer: () => initialState,
  },
})

export const {
  setPlayer,
  setHand,
  removeCardFromHand,
  setConnectionStatus,
  resetPlayer,
} = playerSlice.actions

export default playerSlice.reducer
