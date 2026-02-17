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

    // ✅ Pixi v8 async init
    this.app = new Application()
    await this.app.init({
      resizeTo: window,
      backgroundColor: 0x0b6623
    })

    // ✅ Add canvas correctly
    document.body.appendChild(this.app.canvas)

    // ✅ Start your Pixi card game UI
    this.gameController = new GameController(this.app)
    this.gameController.init()

    // ✅ Keep Redux logic
    this.unsubscribe = store.subscribe(() => {
      const state = store.getState()
      this.update(state)
    })
  }

  update(state) {
    console.log("Current Turn:", state.game.currentTurn)
  }

  onCardClicked(card) {
    playCard(card)
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe()
    }

    if (this.app) {
      this.app.destroy(true)
    }
  }
}
