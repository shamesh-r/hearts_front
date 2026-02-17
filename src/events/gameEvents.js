// Small event bus to decouple socket layer from Pixi/game controller.
import mitt from "mitt"

export const gameEvents = mitt()
