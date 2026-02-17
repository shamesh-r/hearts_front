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
    this.app = new Application()
    await this.app.init({
      resizeTo: window,
      backgroundColor: 0x0b6623,
    })

    document.body.appendChild(this.app.canvas)

    this.controller = new GameController(this.app)
    this.controller.init()
  }
}

const bootstrap = async () => {
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
    unregisterSocketEvents()
  })
}
