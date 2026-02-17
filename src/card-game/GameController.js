import { Container } from "pixi.js";
import { Deck } from "./Deck";
import { Player } from "./Player";
import { CardSprite } from "./CardSprite";
import { GameUI } from "./GameUI";

export class GameController {
  constructor(app) {
    this.app = app;
    this.players = [];
    this.deck = null;
    this.cardLayer = new Container();
    this.app.stage.addChild(this.cardLayer);
  }

  init() {
    this.createPlayers(4);
    this.ui = new GameUI(this.app, this);
  }

  createPlayers() {
    const w = this.app.screen.width;
    const h = this.app.screen.height;

    this.players = [
      new Player(1, w/2 - 300, h - 150),
      new Player(2, 80, h/2 - 100),
      new Player(3, w/2 - 300, 100),
      new Player(4, w - 500, h/2 - 100),
    ];
  }

  startGame() {
    this.deck = new Deck();
    alert("Deck created");
  }

  shuffleDeck() {
    if (!this.deck) return;
    this.deck.shuffle();
    alert("Deck shuffled");
  }

  dealCards() {
    if (!this.deck) return;
    this.clearCards();

    for (let i = 0; i < 13; i++) {
      this.players.forEach(player => {
        const card = this.deck.deal();
        player.receiveCard(card);
      });
    }

    this.renderHands();
  }

  renderHands() {
    this.players.forEach(player => {
      player.hand.forEach((card, index) => {
        const sprite = new CardSprite(card);
        sprite.x = player.x + index * 25;
        sprite.y = player.y;
        this.cardLayer.addChild(sprite);
      });
    });
  }

  resetGame() {
    this.players.forEach(p => p.reset());
    this.clearCards();
    alert("Game reset");
  }

  clearCards() {
    this.cardLayer.removeChildren();
  }
}
