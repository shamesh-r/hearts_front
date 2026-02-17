// import { store } from "./store/store"
// import { playCard } from "./socket/socketActions"

// export default class Game {

//   constructor() {
//     this.unsubscribe = null
//   }

//   start() {
//     console.log("Game Started")

//     // Subscribe to Redux changes
//     this.unsubscribe = store.subscribe(() => {
//       const state = store.getState()
//       this.update(state)
//     })
//   }

//   update(state) {
//     // Update UI based on Redux state
//     console.log("Current Turn:", state.game.currentTurn)
//   }

//   onCardClicked(card) {
//     playCard(card)
//   }

//   destroy() {
//     if (this.unsubscribe) {
//       this.unsubscribe()
//     }
//   }
// }

// Alternative game bootstrap class that combines Pixi rendering with Redux subscription.
import { store } from "./store/store"
import { playCard } from "./socket/socketActions"
import { Application } from "pixi.js"
import { GameController } from "./card-game/GameController"

export default class Game {

  constructor() {
    this.unsubscribe = null
    this.app = null
    this.gameController = null
  }

  async start() {
    console.log("Game Started")

    // Initialize Pixi renderer.
    this.app = new Application()
    await this.app.init({
      resizeTo: window,
      backgroundColor: 0x0b6623
    })

    // Mount Pixi canvas.
    document.body.appendChild(this.app.canvas)

    // Start game scene/controller.
    this.gameController = new GameController(this.app)
    this.gameController.init()

    // Track Redux updates for reactive UI/game-state hooks.
    this.unsubscribe = store.subscribe(() => {
      const state = store.getState()
      this.update(state)
    })
  }

  update(state) {
    console.log("Current Turn:", state.game.currentTurn)
  }

  onCardClicked(card) {
    // Forward played card to backend.
    playCard(card)
  }

  destroy() {
    // Cleanup Redux subscription and Pixi resources.
    if (this.unsubscribe) {
      this.unsubscribe()
    }

    if (this.app) {
      this.app.destroy(true)
    }
  }
}
