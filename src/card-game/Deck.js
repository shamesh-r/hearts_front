// Utility for creating, shuffling, and dealing a standard 52-card deck.
export class Deck {
  /**
   * Initializes deck metadata and populates the initial card list.
   */
  constructor() {
    this.suits = ["♠", "♥", "♦", "♣"];
    this.ranks = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
    this.cards = [];
    this.createDeck();
  }

  /**
   * Recreates a full 52-card deck in suit/rank order.
   */
  createDeck() {
    // Build all suit/rank combinations.
    this.cards = [];
    for (let suit of this.suits) {
      for (let rank of this.ranks) {
        this.cards.push({ suit, rank });
      }
    }
  }

  /**
   * In-place Fisher-Yates shuffle.
   */
  shuffle() {
    // Fisher-Yates shuffle.
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  /**
   * Returns one card from the top of deck (or undefined when empty).
   */
  deal() {
    // Remove card from top/end of deck.
    return this.cards.pop();
  }
}
