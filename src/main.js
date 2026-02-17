// Entry point: bootstraps socket listeners and starts the Pixi game app.
import { Application } from "pixi.js"
import { GameController } from "./card-game/GameController"
import { connectToServer } from "./socket/socketActions"
import {
  registerSocketEvents,
  unregisterSocketEvents,
} from "./socket/socketHandlers"

class Game {
  constructor() {
    this.app = null
    this.controller = null
  }

  async start() {
    // Pixi v8 initialization is async.
    this.app = new Application()
    await this.app.init({
      resizeTo: window,
      backgroundColor: 0x0b6623,
    })

    // Attach renderer canvas to the page.
    document.body.appendChild(this.app.canvas)

    // Hand over control to the Hearts game controller.
    this.controller = new GameController(this.app)
    this.controller.init()
  }
}

const bootstrap = async () => {
  // Register socket listeners before connecting to avoid missing early events.
  registerSocketEvents()
  connectToServer()

  const game = new Game()
  await game.start()
}

window.addEventListener("DOMContentLoaded", () => {
  void bootstrap()
})

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    // Prevent duplicate listeners during Vite hot reload.
    unregisterSocketEvents()
  })
}
