// Core multiplayer scene controller: lobby flow, seat mapping, and card rendering.
import { Container, Graphics, Text } from "pixi.js";
import { GameUI } from "./GameUI";
import { gameEvents } from "../events/gameEvents";
import { startGame as startGameSocketEvent } from "../socket/socketActions";
import { Player } from "./Player";
import { CardSprite } from "./CardSprite";

export class GameController {
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
    this.playerNameLayer = new Container();

    // Layer order matters: table at back, cards above table, player labels on top.
    this.app.stage.addChild(this.tableLayer);
    this.app.stage.addChild(this.cardLayer);
    this.app.stage.addChild(this.playerNameLayer);

    this.mySocketId = null;
    this.hasEnteredName = false;
    this.isGameReady = false;
    this.hasRenderedInitialHands = false;
  }

  init() {
    this.ui = new GameUI(this.app, this);
    // Ask player name first, then trigger start on backend.
    this.ui.showNameEntry((name) => this.submitPlayerName(name));

    // Attach app-level event listeners coming from socketHandlers.
    this.registerEvents();
  }

  submitPlayerName(name) {
    this.hasEnteredName = true;
    // This emits to backend; backend decides room state and broadcasts updates.
    startGameSocketEvent(name);
    this.ui.showLobby([], this.maxPlayers);
  }

  registerEvents() {
    // Lobby/room updates (players joining, game created).
    gameEvents.on("GAME_CREATED", (data) => {
      this.onGameCreated(data);
    });
    // Authoritative game snapshots (hand, turn, etc.) from backend.
    gameEvents.on("GAME_STATE", (data) => {
      this.onGameStateUpdate(data);
    });
  }

  // Called when backend announces room/game creation or updated player list.
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
  }

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

  onGameStateUpdate(data) {
    // Refresh server player metadata if available in latest snapshot.
    const incomingPlayers = this.normalizePlayers(data?.game?.players || []);
    if (incomingPlayers.length) {
      this.players = incomingPlayers;
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
  }

  normalizePlayers(players) {
    // Accepts multiple backend key variants to stay resilient to payload shape changes.
    return (players || []).map((player, index) => ({
      socketId: player.socketId || player.id || player.playerId || `unknown-${index}`,
      name: player.name || player.playerName || `Player ${index + 1}`,
      hand: player.hand || player.cards || [],
      handCount: player.handCount ?? player.cardsCount ?? player.cardCount,
    }));
  }

  normalizeCards(cards) {
    return (cards || []).map((card) => this.normalizeCard(card));
  }

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

  getPlayerCardCount(serverPlayer, isSelf, myHand) {
    if (isSelf) {
      return myHand.length;
    }

    // Prefer explicit counts from server; fall back to arrays if present.
    if (Array.isArray(serverPlayer?.hand)) {
      return serverPlayer.hand.length;
    }
    if (Array.isArray(serverPlayer?.cards)) {
      return serverPlayer.cards.length;
    }
    if (typeof serverPlayer?.handCount === "number") {
      return serverPlayer.handCount;
    }
    if (typeof serverPlayer?.cardsCount === "number") {
      return serverPlayer.cardsCount;
    }
    if (typeof serverPlayer?.cardCount === "number") {
      return serverPlayer.cardCount;
    }

    return 13;
  }

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

  renderTable() {
    this.tableLayer.removeChildren();

    // Main felt/table region.
    const table = new Graphics();
    table.beginFill(0x004400);
    table.drawRoundedRect(
      this.app.screen.width * 0.1,
      this.app.screen.height * 0.1,
      this.app.screen.width * 0.8,
      this.app.screen.height * 0.8,
      20
    );
    table.endFill();

    this.tableLayer.addChild(table);
  }

  renderPlayers() {
    this.playerNameLayer.removeChildren();
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

  renderHands(animate) {
    this.clearCards();

    this.seatedPlayers.forEach((player, playerIndex) => {
      player.hand.forEach((card, index) => {
        // Seat 0 (you) is face-up. Other seats are face-down.
        const isCurrentPlayer = playerIndex === this.currentPlayerIndex;

        const sprite = new CardSprite(card);
        sprite.x = player.x + index * 25;
        sprite.y = player.y;

        if (!isCurrentPlayer) {
          sprite.isFlipped = true;
          sprite.drawCard();
        }else{
          sprite.drawCard();
        }

        this.cardLayer.addChild(sprite);

        // Animate only on first hand render for smoother updates afterward.
        if (animate) {
          sprite.scale.set(0);
          sprite.alpha = 0;

          const startTime = Date.now();
          const duration = 400;

          const run = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            sprite.scale.set(progress);
            sprite.alpha = progress;

            if (progress < 1) {
              requestAnimationFrame(run);
            }
          };

          run();
        }
      });
    });
  }

  resetGame() {
    this.seatedPlayers.forEach((player) => player.reset());
    this.hasRenderedInitialHands = false;
    this.clearCards();
  }

  clearCards() {
    // Removes existing card sprites before a full hand redraw.
    this.cardLayer.removeChildren();
  }

  // Cleanup stage layers and UI references when controller is destroyed.
  destroy() {
    this.ui.hideLobby();
    this.ui.hideControls();
    this.app.stage.removeChildren();
  }
}
