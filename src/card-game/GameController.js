// Core multiplayer scene controller: lobby flow, seat mapping, and card rendering.
import { Container, Graphics, Text, Sprite } from "pixi.js";
import { GameUI } from "./GameUI";
import { gameEvents } from "../events/gameEvents";
import { passCards as passCardsSocketEvent, startGame as startGameSocketEvent } from "../socket/socketActions";
import { Player } from "./Player";
import { CardSprite } from "./CardSprite";
import { CARD_HEIGHT } from "./CardAssets";
import greenBgImage from "../../assets/green_bg.jpg";

export class GameController {
  /**
   * Main scene controller for Hearts table rendering.
   *
   * Responsibilities:
   * - manage lobby -> game transition based on socket events
   * - map backend player order to local seat order (self always bottom)
   * - render table, seat labels, hand zones, and card sprites
   * - run initial shuffle/deal animations
   * - keep visuals in sync with backend-authoritative state
   */
  constructor(app) {
    this.app = app;
    this.maxPlayers = 4;
    // `players`: raw player list from server events.
    this.players = [];
    // `seatedPlayers`: local table order (you at bottom, others rotated around table).
    this.seatedPlayers = [];
    // Current local seat index whose cards should be face-up.
    this.currentPlayerIndex = 0;
    this.cardLayer = new Container();
    this.tableLayer = new Container();
    this.handZoneLayer = new Container();
    this.playerNameLayer = new Container();

    // Layer order matters: table at back, cards above table, player labels on top.
    this.app.stage.addChild(this.tableLayer);
    this.app.stage.addChild(this.handZoneLayer);
    this.app.stage.addChild(this.cardLayer);
    this.app.stage.addChild(this.playerNameLayer);

    this.mySocketId = null;
    this.hasEnteredName = false;
    this.isGameReady = false;
    this.hasRenderedInitialHands = false;
    this.currentPhase = "waiting";
    this.isWaitingForPass = false;
    this.selectedCardKeys = new Set();
    this.selfCardEntries = [];
    this.lastServerPlayers = [];
  }

  /**
   * Initializes UI and subscribes to app-level game events.
   * Called once after Pixi app has been created and mounted.
   */
  init() {
    this.ui = new GameUI(this.app, this);
    // Ask player name first, then trigger start on backend.
    this.ui.showNameEntry((name) => this.submitPlayerName(name));

    // Attach app-level event listeners coming from socketHandlers.
    this.registerEvents();
  }

  /**
   * Handles local player name submission from lobby input.
   * This triggers backend start/join flow and shows waiting state.
   */
  submitPlayerName(name) {
    this.hasEnteredName = true;
    // This emits to backend; backend decides room state and broadcasts updates.
    startGameSocketEvent(name);
    this.ui.showLobby([], this.maxPlayers);
  }

  /**
   * Registers event-bus listeners that are emitted by socketHandlers.
   * - GAME_CREATED: lobby/room-level player updates
   * - GAME_STATE: full gameplay snapshot updates
   */
  registerEvents() {
    // Lobby/room updates (players joining, game created).
    gameEvents.on("GAME_CREATED", (data) => {
      this.onGameCreated(data);
    });
    // Authoritative game snapshots (hand, turn, etc.) from backend.
    gameEvents.on("GAME_STATE", (data) => {
      this.onGameStateUpdate(data);
    });
    gameEvents.on("PASSING_COMPLETE", (data) => {
      this.onPassingComplete(data);
    });
  }

  /**
   * Handles room creation/player list updates.
   *
   * Flow:
   * 1) normalize player identity/name fields
   * 2) keep waiting lobby visible until 4 players
   * 3) when ready, create local seats and render base game UI
   */
  onGameCreated(data) {
    this.players = (data.players || []).map((player, index) => ({
      socketId: player.socketId || player.id || player.playerId || `unknown-${index}`,
      name: player.name || player.playerName || `Player ${index + 1}`,
    }));

    this.mySocketId = data.mySocketId;

    if (!this.hasEnteredName) {
      return;
    }

    if (this.players.length < this.maxPlayers) {
      // Not enough players yet: keep lobby visible.
      this.ui.showLobby(this.players, this.maxPlayers);
      return;
    }

    // 4 players are ready: build table seats and enter in-game UI.
    this.createPlayers();
    this.ui.hideLobby();
    this.ui.showControls();
    this.isGameReady = true;

    this.renderTable();
    this.renderPlayers();
    this.updatePhaseUI();
  }

  /**
   * Creates local seat models from backend player order.
   *
   * Important:
   * - backend order is rotated so current socket player is always index 0
   * - index 0 seat is visually bottom; other players become left/top/right
   */
  createPlayers() {
    const w = this.app.screen.width;
    const h = this.app.screen.height;

    // Find your server index so local rendering can always place you at bottom.
    const myIndex = this.players.findIndex(
      (p) => p.socketId === this.mySocketId
    );

    // Rotate player order to put current socket at seat 0 (bottom).
    const rotated = myIndex >= 0
      ? [
          ...this.players.slice(myIndex),
          ...this.players.slice(0, myIndex),
        ]
      : this.players.slice(0, this.maxPlayers);

    // Table seat anchors: bottom, left, top, right.
    const positions = [
      { x: w / 2 - 300, y: h - 150 }, // Bottom (You)
      { x: 80, y: h / 2 - 100 }, // Left
      { x: w / 2 - 300, y: 100 }, // Top
      { x: w - 500, y: h / 2 - 100 }, // Right
    ];

    this.seatedPlayers = rotated.slice(0, this.maxPlayers).map((player, index) => {
      const seat = new Player(index + 1, positions[index].x, positions[index].y);
      seat.name = player.name;
      seat.socketId = player.socketId;
      seat.serverOrder = index;
      return seat;
    });

    this.currentPlayerIndex = 0;
  }

  /**
   * Applies backend-authoritative game updates to local render state.
   *
   * Behavior:
   * - updates self socket identity when provided
   * - refreshes player metadata
   * - transitions lobby to game if state arrives before GAME_CREATED
   * - derives local hand + hidden opponent hands and re-renders cards
   */
  onGameStateUpdate(data) {
    // Ensure local identity is available even when updates arrive before GAME_CREATED.
    if (data?.mySocketId) {
      this.mySocketId = data.mySocketId
    }

    // Refresh server player metadata if available in latest snapshot.
    const incomingPlayers = this.normalizePlayers(data?.game?.players || []);
    if (incomingPlayers.length) {
      this.players = incomingPlayers;
      this.lastServerPlayers = data?.game?.players || [];
    }

    if (data?.game?.phase) {
      this.currentPhase = data.game.phase;
      if (this.currentPhase !== "passing") {
        this.selectedCardKeys.clear();
        this.isWaitingForPass = false;
        this.ui.hideWaitingOverlay();
      }
    }

    // If game becomes ready from a state update, transition UI now.
    if (!this.isGameReady && this.players.length >= this.maxPlayers) {
      this.createPlayers();
      this.ui.hideLobby();
      this.ui.showControls();
      this.isGameReady = true;
      this.renderTable();
      this.renderPlayers();
    }

    if (!this.isGameReady || this.seatedPlayers.length !== this.maxPlayers) {
      return;
    }

    // My cards come from backend hand; opponents are rendered as hidden backs.
    const myHand = this.normalizeCards(
      data?.hand || data?.playerHand || data?.myHand || []
    );
    this.applyServerHands(myHand, data?.game?.players || []);
    this.renderHands(!this.hasRenderedInitialHands);
    this.hasRenderedInitialHands = true;
    this.updatePhaseUI();
  }

  /**
   * Handles backend completion of passing phase.
   */
  onPassingComplete(data) {
    if (data?.mySocketId) {
      this.mySocketId = data.mySocketId;
    }

    this.isWaitingForPass = false;
    this.selectedCardKeys.clear();
    this.currentPhase = data?.phase || "playing";

    const myHand = this.normalizeCards(data?.hand || []);
    this.applyServerHands(myHand, this.lastServerPlayers || []);
    this.renderHands(false);

    this.ui.hideWaitingOverlay();
    this.updatePhaseUI();
  }

  /**
   * Normalizes backend player structures to a predictable local shape.
   * Accepts common key variants used by different backend payloads.
   */
  normalizePlayers(players) {
    // Accepts multiple backend key variants to stay resilient to payload shape changes.
    return (players || []).map((player, index) => ({
      socketId: player.socketId || player.id || player.playerId || `unknown-${index}`,
      name: player.name || player.playerName || `Player ${index + 1}`,
      hand: player.hand || player.cards || [],
      handCount: player.handCount ?? player.cardsCount ?? player.cardCount,
    }));
  }

  /**
   * Normalizes an array of cards from backend into CardSprite-friendly format.
   */
  normalizeCards(cards) {
    return (cards || []).map((card) => this.normalizeCard(card));
  }

  /**
   * Normalizes a single card value.
   *
   * Supported formats:
   * - string: "QS", "10H", etc.
   * - object: { rank, suit } or { value, symbol }
   *
   * Output is always: { rank, suitSymbol }.
   */
  normalizeCard(card) {
    // Fallback card prevents renderer crash on malformed payload.
    if (!card) {
      return { rank: "A", suit: "\u2660" };
    }

    // Supports compact string formats such as "QS", "10H", etc.
    if (typeof card === "string") {
      const raw = card.trim().toUpperCase();
      if (raw.length >= 2) {
        const suitCode = raw.slice(-1);
        const rank = raw.slice(0, -1);
        return {
          rank,
          suit: this.normalizeSuit(suitCode),
        };
      }
    }

    const rank = String(card.rank || card.value || "A").toUpperCase();
    const suit = this.normalizeSuit(card.suit || card.symbol || "S");
    return { rank, suit };
  }

  /**
   * Converts suit codes/words to suit symbols used by card rendering.
   * Examples:
   * - "S", "SPADES", "♠" => "♠"
   * - "H", "HEARTS", "♥" => "♥"
   */
  normalizeSuit(suit) {
    // Canonicalize suit values to symbols used by CardSprite.
    const source = String(suit || "").trim().toUpperCase();
    if (source === "S" || source === "SPADE" || source === "SPADES" || source === "\u2660") {
      return "\u2660";
    }
    if (source === "H" || source === "HEART" || source === "HEARTS" || source === "\u2665") {
      return "\u2665";
    }
    if (source === "D" || source === "DIAMOND" || source === "DIAMONDS" || source === "\u2666") {
      return "\u2666";
    }
    if (source === "C" || source === "CLUB" || source === "CLUBS" || source === "\u2663") {
      return "\u2663";
    }

    return "\u2660";
  }

  /**
   * Returns how many cards a seat should display.
   *
   * Current rule:
   * - self: use real current hand length
   * - opponents: force 13 (face-down visuals only)
   */
  getPlayerCardCount(serverPlayer, isSelf, myHand) {
    if (isSelf) {
      return myHand.length;
    }

    // Always show 13 face-down cards for opponents.
    return 13;
  }

  /**
   * Applies server hand data to local seat models.
   *
   * Rendering strategy:
   * - local player receives real cards from backend hand
   * - opponents receive placeholder cards (same count) to render as backs
   */
  applyServerHands(myHand, serverPlayersRaw) {
    const serverPlayers = this.normalizePlayers(serverPlayersRaw);

    this.seatedPlayers.forEach((seat) => {
      seat.reset();

      const serverPlayer = serverPlayers.find((player) => player.socketId === seat.socketId);
      const isSelf = seat.socketId === this.mySocketId;
      const cardCount = this.getPlayerCardCount(serverPlayer, isSelf, myHand);

      if (isSelf) {
        // Only current user gets real card faces from backend hand.
        myHand.forEach((card) => seat.receiveCard(card));
        return;
      }

      // Opponents get placeholder cards; they are rendered face-down.
      for (let i = 0; i < cardCount; i++) {
        seat.receiveCard({ rank: "A", suit: "\u2660" });
      }
    });
  }

  /**
   * Draws static table/felt background.
   * Re-created on each call to keep the layer deterministic.
   */
  renderTable() {
    this.tableLayer.removeChildren();

    // Table background image from assets folder.
    const bg = Sprite.from(greenBgImage);
    bg.x = 0;
    bg.y = 0;
    bg.width = this.app.screen.width;
    bg.height = this.app.screen.height;
    this.tableLayer.addChild(bg);

    // Soft overlay to keep cards readable on top of the image.
    const overlay = new Graphics();
    overlay.beginFill(0x000000, 0.12);
    overlay.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
    overlay.endFill();
    this.tableLayer.addChild(overlay);
  }

  /**
   * Renders player name labels and hand zones for all seats.
   */
  renderPlayers() {
    this.playerNameLayer.removeChildren();
    this.renderHandZones();
    this.seatedPlayers.forEach((player, index) => {
      const label = player.socketId === this.mySocketId
        ? `${player.name} (You)`
        : player.name;

      const nameText = new Text({
        text: label,
        style: {
          fill: "white",
          fontSize: 22,
          fontWeight: "bold",
        },
      });

      nameText.anchor.set(0.5);
      nameText.x = player.x + 120;
      nameText.y = player.y - 40;

      this.playerNameLayer.addChild(nameText);
    });
  }

  /**
   * Draws stroked rectangular containers indicating each player's hand area.
   * These are visual guide zones only (no gameplay behavior).
   */
  renderHandZones() {
    this.handZoneLayer.removeChildren();

    this.seatedPlayers.forEach((player) => {
      const zone = new Graphics();
      zone.lineStyle(2, 0xe6f4ea, 0.75);
      zone.drawRoundedRect(
        player.x - 14,
        player.y - 10,
        13 * 25 + 90,
        CARD_HEIGHT + 20,
        12
      );
      this.handZoneLayer.addChild(zone);
    });
  }

  /**
   * Renders card sprites for all seats.
   *
   * First render:
   * - plays center shuffle burst
   * - deals cards from center to target slots with staggered timing
   *
   * Subsequent renders:
   * - redraws instantly without shuffle/deal intro
   */
  renderHands(animate) {
    this.clearCards();
    this.selfCardEntries = [];
    const centerX = this.app.screen.width / 2;
    const centerY = this.app.screen.height / 2;
    const playersCount = this.seatedPlayers.length || 1;
    const shuffleDuration = animate ? this.playShuffleBurst(centerX, centerY) : 0;

    this.seatedPlayers.forEach((player, playerIndex) => {
      player.hand.forEach((card, index) => {
        // Only local player's cards are shown face-up.
        const isCurrentPlayer = player.socketId === this.mySocketId;

        const sprite = new CardSprite(card);
        const targetX = player.x + index * 25;
        const targetY = player.y;
        const cardKey = this.getCardKey(card, index);

        if (!isCurrentPlayer) {
          sprite.isFlipped = true;
          sprite.drawCard();
        } else {
          sprite.isFlipped = false;
          sprite.drawCard();
        }

        if (animate) {
          sprite.x = centerX;
          sprite.y = centerY;
          sprite.scale.set(0.85);
          sprite.alpha = 0;
        } else {
          sprite.x = targetX;
          sprite.y = targetY;
        }

        this.cardLayer.addChild(sprite);

        if (isCurrentPlayer) {
          this.selfCardEntries.push({
            key: cardKey,
            card,
            sprite,
            baseY: targetY,
          });
        }

        // Animate only on first hand render for smoother updates afterward.
        if (animate) {
          const dealOrder = index * playersCount + playerIndex;
          const delay = shuffleDuration + (dealOrder * 35);
          this.animateCardDeal(sprite, {
            fromX: centerX,
            fromY: centerY,
            toX: targetX,
            toY: targetY,
            delay,
            duration: 280,
          });
        }
      });
    });

    this.refreshCardSelectionVisuals();
    this.refreshCardInteractivity();
  }

  /**
   * Generates stable local key for per-card selection state.
   */
  getCardKey(card, index) {
    const rank = card?.rank || "A";
    const suit = card?.suit || "\u2660";
    return `${rank}-${suit}-${index}`;
  }

  /**
   * Enables/disables self card click interactions based on current phase/wait state.
   */
  refreshCardInteractivity() {
    const selectable = this.currentPhase === "passing" && !this.isWaitingForPass;

    this.selfCardEntries.forEach((entry) => {
      entry.sprite.removeAllListeners("pointerdown");
      entry.sprite.interactive = selectable;
      entry.sprite.buttonMode = selectable;

      if (selectable) {
        entry.sprite.on("pointerdown", () => {
          this.toggleCardSelection(entry);
        });
      }
    });
  }

  /**
   * Handles local card select/unselect in passing phase.
   */
  toggleCardSelection(entry) {
    if (this.currentPhase !== "passing" || this.isWaitingForPass) {
      return;
    }

    const key = entry.key;
    if (this.selectedCardKeys.has(key)) {
      this.selectedCardKeys.delete(key);
    } else {
      if (this.selectedCardKeys.size >= 3) {
        return;
      }
      this.selectedCardKeys.add(key);
    }

    this.refreshCardSelectionVisuals();
    this.updatePhaseUI();
  }

  /**
   * Applies selected visual state (lift + slight brighten) to chosen cards.
   */
  refreshCardSelectionVisuals() {
    this.selfCardEntries.forEach((entry) => {
      const selected = this.selectedCardKeys.has(entry.key);
      entry.sprite.y = selected ? entry.baseY - 18 : entry.baseY;
      entry.sprite.alpha = selected ? 1 : 0.95;
    });
  }

  /**
   * Sends selected cards to backend for passing phase.
   */
  submitPassCards() {
    if (this.selectedCardKeys.size !== 3 || this.isWaitingForPass) {
      return;
    }

    const selectedCards = this.selfCardEntries
      .filter((entry) => this.selectedCardKeys.has(entry.key))
      .map((entry) => entry.card);

    passCardsSocketEvent(selectedCards);
    this.isWaitingForPass = true;
    this.refreshCardInteractivity();
    this.ui.showWaitingOverlay("Waiting for other players...");
    this.updatePhaseUI();
  }

  /**
   * Synchronizes phase-related UI: title, pass button, and enabled state.
   */
  updatePhaseUI() {
    this.ui.updatePhase(this.currentPhase);

    if (this.currentPhase === "passing") {
      this.ui.showPassButton(() => this.submitPassCards());
      this.ui.setPassButtonEnabled(
        !this.isWaitingForPass && this.selectedCardKeys.size === 3
      );
      return;
    }

    this.ui.hidePassButton();
  }

  /**
   * Plays a short visual shuffle burst at table center.
   * Returns total lead-in time so deal animation can start afterward.
   */
  playShuffleBurst(centerX, centerY) {
    const burstCount = 10;
    const burstDuration = 260;
    const spread = 26;

    for (let i = 0; i < burstCount; i++) {
      const burstCard = new CardSprite({ rank: "A", suit: "\u2660" });
      burstCard.isFlipped = true;
      burstCard.drawCard();
      burstCard.x = centerX;
      burstCard.y = centerY;
      burstCard.alpha = 0.9;
      burstCard.rotation = ((i - burstCount / 2) * Math.PI) / 48;
      this.cardLayer.addChild(burstCard);

      const angle = (Math.PI * 2 * i) / burstCount;
      const targetX = centerX + Math.cos(angle) * spread;
      const targetY = centerY + Math.sin(angle) * spread;

      this.animateTempCardBurst(burstCard, {
        fromX: centerX,
        fromY: centerY,
        toX: targetX,
        toY: targetY,
        duration: burstDuration,
      });
    }

    return burstDuration + 80;
  }

  /**
   * Animates temporary burst cards (shuffle effect) and destroys them at end.
   */
  animateTempCardBurst(sprite, config) {
    const {
      fromX,
      fromY,
      toX,
      toY,
      duration = 260,
    } = config;

    const startedAt = performance.now();

    const run = (now) => {
      const elapsed = now - startedAt;
      const t = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - t, 3);

      sprite.x = fromX + (toX - fromX) * easeOut;
      sprite.y = fromY + (toY - fromY) * easeOut;
      sprite.alpha = 0.9 * (1 - t);
      sprite.scale.set(0.95 - 0.25 * t);

      if (t < 1) {
        requestAnimationFrame(run);
      } else {
        this.cardLayer.removeChild(sprite);
        sprite.destroy({ children: true });
      }
    };

    requestAnimationFrame(run);
  }

  /**
   * Animates a dealt card from center deck position to final seat slot.
   * Uses cubic ease-out with optional start delay for round-robin dealing.
   */
  animateCardDeal(sprite, config) {
    const {
      fromX,
      fromY,
      toX,
      toY,
      delay = 0,
      duration = 300,
    } = config;

    const startedAt = performance.now() + delay;

    const run = (now) => {
      if (now < startedAt) {
        requestAnimationFrame(run);
        return;
      }

      const elapsed = now - startedAt;
      const t = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - t, 3);

      sprite.x = fromX + (toX - fromX) * easeOut;
      sprite.y = fromY + (toY - fromY) * easeOut;
      sprite.scale.set(0.85 + 0.15 * easeOut);
      sprite.alpha = easeOut;

      if (t < 1) {
        requestAnimationFrame(run);
      }
    };

    requestAnimationFrame(run);
  }

  /**
   * Clears local seat hands and card layer for a fresh round/sync.
   */
  resetGame() {
    this.seatedPlayers.forEach((player) => player.reset());
    this.hasRenderedInitialHands = false;
    this.clearCards();
  }

  /**
   * Removes all currently rendered card sprites.
   */
  clearCards() {
    // Removes existing card sprites before a full hand redraw.
    this.cardLayer.removeChildren();
  }

  /**
   * Final cleanup when scene/controller is disposed.
   */
  destroy() {
    this.ui.hideWaitingOverlay();
    this.ui.hideLobby();
    this.ui.hideControls();
    this.app.stage.removeChildren();
  }
}
