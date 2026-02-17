export class Deck {
  constructor() {
    this.suits = ["♠", "♥", "♦", "♣"];
    this.ranks = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
    this.cards = [];
    this.createDeck();
  }

  createDeck() {
    this.cards = [];
    for (let suit of this.suits) {
      for (let rank of this.ranks) {
        this.cards.push({ suit, rank });
      }
    }
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  deal() {
    return this.cards.pop();
  }
}
