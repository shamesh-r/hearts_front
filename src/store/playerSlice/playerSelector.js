// Read-only helpers for selecting local player fields.
// Returns entire local player slice.
export const selectPlayer = (state) => state.player
// Returns local player's hand cards.
export const selectHand = (state) => state.player.hand
// Returns local seat index (if assigned by backend).
export const selectSeatIndex = (state) => state.player.seatIndex
// Returns socket connection state flag.
export const selectConnectionStatus = (state) => state.player.connected
