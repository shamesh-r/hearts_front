// // import { connectToServer } from "./socket/socketActions"
// import { registerSocketEvents } from "./socket/socketHandlers"
// import Game from "./Game"

// window.addEventListener("DOMContentLoaded", () => {

//   // 1️⃣ Register socket listeners
//   registerSocketEvents()

//   // 2️⃣ Connect to server
//   // connectToServer()

//   // 3️⃣ Start Pixi / Game engine
//   const game = new Game()
//   game.start()

// })

import { Application } from "pixi.js";
import { GameController } from "./card-game/GameController";

export default class Game {
  constructor() {
    this.app = null;
    this.controller = null;
  }

  start() {
    // Create Pixi App
    this.app = new Application({
      resizeTo: window,
      backgroundColor: 0x0b6623
    });

    document.body.appendChild(this.app.view);

    // Start card game engine
    this.controller = new GameController(this.app);
    this.controller.init();
  }
}
