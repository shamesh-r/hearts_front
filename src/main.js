import { connectToServer } from "./socket/socketActions"
import { registerSocketEvents } from "./socket/socketHandlers"
import Game from "./Game"

window.addEventListener("DOMContentLoaded", () => {

  // 1️⃣ Register socket listeners
  registerSocketEvents()

  // 2️⃣ Connect to server
  connectToServer()

  // 3️⃣ Start Pixi / Game engine
  const game = new Game()
  game.start()

})