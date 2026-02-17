// Small event bus to decouple socket layer from Pixi/game controller.
import mitt from "mitt"

// Global pub/sub channel for app-level events (GAME_CREATED, GAME_STATE, etc.).
export const gameEvents = mitt()
