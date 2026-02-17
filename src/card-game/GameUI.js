import { Text } from "pixi.js";

export class GameUI {
  constructor(app, controller) {
    this.app = app;
    this.controller = controller;
    this.createButtons();
  }

  createButtons() {
    const buttons = [
      { label: "Start", x: 50, action: () => this.controller.startGame() },
      { label: "Shuffle", x: 150, action: () => this.controller.shuffleDeck() },
      { label: "Deal", x: 270, action: () => this.controller.dealCards() },
      { label: "Reset", x: 370, action: () => this.controller.resetGame() },
    ];

    buttons.forEach(btn => {
      const b = new Text(btn.label, {
        fill: 0xffffff,
        fontSize: 18
      });

      b.interactive = true;
      b.buttonMode = true;
      b.x = btn.x;
      b.y = 20;
      b.on("pointerdown", btn.action);

      this.app.stage.addChild(b);
    });
  }
}
