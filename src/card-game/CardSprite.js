// Pixi display object for a playing card (front and back rendering).
import { Container, Graphics, Text } from "pixi.js";
import { SUITS, SUIT_COLORS, RANK_NAMES, CARD_WIDTH, CARD_HEIGHT, CARD_CORNER_RADIUS } from "./CardAssets";

export class CardSprite extends Container {
  constructor(card) {
    super();
    this.card = card;
    this.isFlipped = false;
    
    // Create the card background
    this.bg = new Graphics();
    this.addChild(this.bg);
    
    // Create a container for card content
    this.contentContainer = new Container();
    this.addChild(this.contentContainer);
    
    this.drawCard();
  }

  drawCard() {
    // Redraw from scratch whenever card state (face-up/face-down) changes.
    this.bg.clear();
    this.contentContainer.removeChildren();
    
    if (this.isFlipped) {
      this.drawCardBack();
    } else {
      this.drawCardFront();
    }
  }

  drawCardBack() {
    // Card back design
    this.bg.beginFill(0x1a4d2e);
    this.bg.drawRoundedRect(0, 0, CARD_WIDTH, CARD_HEIGHT, CARD_CORNER_RADIUS);
    this.bg.endFill();
    
    // Border
    this.bg.lineStyle(2, 0xffd700, 1);
    this.bg.drawRoundedRect(0, 0, CARD_WIDTH, CARD_HEIGHT, CARD_CORNER_RADIUS);
    
    // Back pattern
    const patternGraphics = new Graphics();
    patternGraphics.beginFill(0xffd700);
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 6; j++) {
        patternGraphics.drawRect(5 + i * 18, 5 + j * 18, 12, 12);
      }
    }
    patternGraphics.endFill();
    this.contentContainer.addChild(patternGraphics);
  }

  drawCardFront() {
    const suitSymbol = this.card.suit;
    const suitColor = SUIT_COLORS[suitSymbol];
    
    // Card background (white)
    this.bg.beginFill(0xffffff);
    this.bg.drawRoundedRect(0, 0, CARD_WIDTH, CARD_HEIGHT, CARD_CORNER_RADIUS);
    this.bg.endFill();
    
    // Border
    this.bg.lineStyle(2, 0x333333, 1);
    this.bg.drawRoundedRect(0, 0, CARD_WIDTH, CARD_HEIGHT, CARD_CORNER_RADIUS);
    
    // Top-left rank and suit
    const topRankText = new Text(this.card.rank, {
      fontSize: 16,
      fontWeight: 'bold',
      fill: suitColor,
      fontFamily: 'Arial'
    });
    topRankText.x = 5;
    topRankText.y = 5;
    this.contentContainer.addChild(topRankText);
    
    const topSuitText = new Text(suitSymbol, {
      fontSize: 14,
      fill: suitColor,
      fontFamily: 'Arial'
    });
    topSuitText.x = 5;
    topSuitText.y = 20;
    this.contentContainer.addChild(topSuitText);
    
    // Center large suit symbol
    const centerSuit = new Text(suitSymbol, {
      fontSize: 40,
      fill: suitColor,
      fontFamily: 'Arial'
    });
    centerSuit.anchor.set(0.5);
    centerSuit.x = CARD_WIDTH / 2;
    centerSuit.y = CARD_HEIGHT / 2;
    this.contentContainer.addChild(centerSuit);
    
    // Bottom-right rank and suit (upside down)
    const bottomRankText = new Text(this.card.rank, {
      fontSize: 16,
      fontWeight: 'bold',
      fill: suitColor,
      rotation: Math.PI,
      fontFamily: 'Arial'
    });
    bottomRankText.x = CARD_WIDTH - 5;
    bottomRankText.y = CARD_HEIGHT - 5;
    bottomRankText.anchor.set(1, 1);
    this.contentContainer.addChild(bottomRankText);
    
    const bottomSuitText = new Text(suitSymbol, {
      fontSize: 14,
      fill: suitColor,
      rotation: Math.PI,
      fontFamily: 'Arial'
    });
    bottomSuitText.x = CARD_WIDTH - 5;
    bottomSuitText.y = CARD_HEIGHT - 20;
    bottomSuitText.anchor.set(1, 1);
    this.contentContainer.addChild(bottomSuitText);
  }

  flip() {
    // Toggle card face visibility.
    this.isFlipped = !this.isFlipped;
    this.drawCard();
  }

  reveal() {
    // Convenience helper for one-way reveal.
    if (this.isFlipped) {
      this.flip();
    }
  }
}
