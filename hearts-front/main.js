import { GameController } from "./game/GameController.js";

const app = new PIXI.Application({
  resizeTo: window,
  backgroundColor: 0x0b6623
});

document.body.appendChild(app.view);

const game = new GameController(app);
game.init();
