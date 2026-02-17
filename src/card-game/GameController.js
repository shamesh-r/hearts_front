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
    this.currentPlayerIndex = 0; // Player 0 is the human player
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

    // Display all cards at once
    this.renderHands();
  }

  renderHands() {
    this.players.forEach((player, playerIndex) => {
      player.hand.forEach((card, index) => {
        // Only show face-up cards for current player (player 0)
        const isCurrentPlayer = playerIndex === this.currentPlayerIndex;
        
        const sprite = new CardSprite(card);
        sprite.x = player.x + index * 25;
        sprite.y = player.y;
        
        // If not current player, keep card face down
        if (!isCurrentPlayer) {
          sprite.isFlipped = true;
          sprite.drawCard();
        }
        
        // Add animation for all cards appearing
        sprite.scale.set(0);
        sprite.alpha = 0;
        
        this.cardLayer.addChild(sprite);

        // Animate card appearing (all at same time)
        let startTime = Date.now();
        const duration = 400;

        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);

          sprite.scale.set(progress);
          sprite.alpha = progress;

          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };

        animate();
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
