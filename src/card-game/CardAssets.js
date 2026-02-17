// Shared card constants used by the card renderer and layout.
// Suit symbols used across rendering and payload normalization.
export const SUITS = {
  HEARTS: '♥',
  DIAMONDS: '♦',
  CLUBS: '♣',
  SPADES: '♠'
};

// Fill colors used for suit glyphs when cards are face-up.
export const SUIT_COLORS = {
  '♥': 0xFF0000, // Red
  '♦': 0xFF0000, // Red
  '♣': 0x000000, // Black
  '♠': 0x000000  // Black
};

// Canonical rank display labels.
export const RANK_NAMES = {
  'A': 'A',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '10': '10',
  'J': 'J',
  'Q': 'Q',
  'K': 'K'
};

// Base card geometry used by CardSprite and hand layout.
export const CARD_WIDTH = 80;
export const CARD_HEIGHT = 120;
export const CARD_CORNER_RADIUS = 8;
