// Read-only helpers for selecting game slice fields.
export const selectGame = (state) => state.game
export const selectPlayers = (state) => state.game.players
export const selectCurrentTurn = (state) => state.game.currentTurn
export const selectCurrentTrick = (state) => state.game.currentTrick
export const selectScores = (state) => state.game.scores
export const selectPhase = (state) => state.game.phase
export const selectHeartsBroken = (state) => state.game.heartsBroken
