// Lightweight player seat model for local rendering (position + hand).
export class Player {
  /**
   * @param {number} id local seat id (1-4)
   * @param {number} x base hand X position
   * @param {number} y base hand Y position
   */
  constructor(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.hand = [];
  }

  /**
   * Adds one card object to this seat's rendered hand data.
   */
  receiveCard(card) {
    // Append dealt/drawn card.
    this.hand.push(card);
  }

  /**
   * Clears all cards for round reset/re-sync.
   */
  reset() {
    // Clear hand between rounds or when re-syncing from server state.
    this.hand = [];
  }
}
