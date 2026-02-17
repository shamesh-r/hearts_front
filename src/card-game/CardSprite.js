import { Container, Graphics, Text } from "pixi.js";

export class CardSprite extends Container {
  constructor(card) {
    super();
    this.card = card;

    const bg = new Graphics();
    bg.beginFill(0xffffff);
    bg.drawRoundedRect(0, 0, 60, 90, 8);
    bg.endFill();
    this.addChild(bg);

    const text = new Text(`${card.rank}${card.suit}`, {
      fontSize: 18,
      fill: 0x000000
    });

    text.x = 8;
    text.y = 8;
    this.addChild(text);
  }
}
