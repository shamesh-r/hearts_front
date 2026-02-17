import { store } from "./store/store"
import { playCard } from "./socket/socketActions"

export default class Game {

  constructor() {
    this.unsubscribe = null
  }

  start() {
    console.log("Game Started")

    // Subscribe to Redux changes
    this.unsubscribe = store.subscribe(() => {
      const state = store.getState()
      this.update(state)
    })
  }

  update(state) {
    // Update UI based on Redux state
    console.log("Current Turn:", state.game.currentTurn)
  }

  onCardClicked(card) {
    playCard(card)
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe()
    }
  }
}