export class Player {
  constructor(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.hand = [];
  }

  receiveCard(card) {
    this.hand.push(card);
  }

  reset() {
    this.hand = [];
  }
}
