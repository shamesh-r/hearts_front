// Lightweight player seat model for local rendering (position + hand).
export class Player {
  constructor(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.hand = [];
  }

  receiveCard(card) {
    // Append dealt/drawn card.
    this.hand.push(card);
  }

  reset() {
    // Clear hand between rounds or when re-syncing from server state.
    this.hand = [];
  }
}
