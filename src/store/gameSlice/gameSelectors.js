// Read-only helpers for selecting game slice fields.
// Returns entire game subtree.
export const selectGame = (state) => state.game
// Returns players array from latest game snapshot.
export const selectPlayers = (state) => state.game.players
// Returns socket id/player id whose turn is active.
export const selectCurrentTurn = (state) => state.game.currentTurn
// Returns cards currently played in active trick.
export const selectCurrentTrick = (state) => state.game.currentTrick
// Returns cumulative points per player.
export const selectScores = (state) => state.game.scores
// Returns game phase (waiting/passing/playing/etc.).
export const selectPhase = (state) => state.game.phase
// Returns whether hearts have been broken in current round.
export const selectHeartsBroken = (state) => state.game.heartsBroken
