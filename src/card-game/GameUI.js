// UI helper for lobby/name-entry overlays and in-game status labels.
import { Text } from "pixi.js";

export class GameUI {
  constructor(app, controller) {
    this.app = app;
    this.controller = controller;
    this.buttons = [];
    this.statusText = null;
    this.playerListText = null;
    this.nameOverlay = null;
  }

  showNameEntry(onSubmit) {
    if (this.nameOverlay) {
      return;
    }

    // HTML overlay is used for easier text input than pure canvas widgets.
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.background = "rgba(0,0,0,0.35)";
    overlay.style.zIndex = "10";

    const panel = document.createElement("div");
    panel.style.background = "#102a12";
    panel.style.border = "2px solid #d7e8d0";
    panel.style.borderRadius = "10px";
    panel.style.padding = "20px";
    panel.style.minWidth = "320px";
    panel.style.display = "flex";
    panel.style.flexDirection = "column";
    panel.style.gap = "10px";

    const title = document.createElement("h3");
    title.textContent = "Enter your name";
    title.style.margin = "0";
    title.style.color = "#fff";

    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 20;
    input.placeholder = "Player name";
    input.style.padding = "10px";
    input.style.fontSize = "16px";

    const button = document.createElement("button");
    button.textContent = "Join Game";
    button.style.padding = "10px";
    button.style.fontSize = "16px";
    button.style.cursor = "pointer";

    const errorText = document.createElement("div");
    errorText.style.color = "#ffb3b3";
    errorText.style.minHeight = "18px";

    const submit = () => {
      const name = input.value.trim();
      if (!name) {
        errorText.textContent = "Please enter a valid name.";
        return;
      }

      errorText.textContent = "";
      onSubmit(name);
      overlay.remove();
      this.nameOverlay = null;
    };

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        submit();
      }
    });
    button.addEventListener("click", submit);

    panel.appendChild(title);
    panel.appendChild(input);
    panel.appendChild(button);
    panel.appendChild(errorText);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    this.nameOverlay = overlay;
    input.focus();
  }

  showLobby(players, maxPlayers) {
    // Lobby replaces in-game controls until enough players join.
    this.hideControls();

    const currentCount = players.length;
    const status = currentCount < maxPlayers
      ? `Waiting for players... ${currentCount}/${maxPlayers}`
      : "All players connected. Starting game...";

    if (!this.statusText) {
      this.statusText = new Text({
        text: status,
        style: {
          fill: 0xffffff,
          fontSize: 32,
          fontWeight: "bold",
        },
      });
      this.statusText.anchor.set(0.5);
      this.statusText.x = this.app.screen.width / 2;
      this.statusText.y = this.app.screen.height / 2 - 40;
      this.app.stage.addChild(this.statusText);
    } else {
      this.statusText.text = status;
    }

    const names = players.length
      ? players.map((player, index) => `${index + 1}. ${player.name}`).join("\n")
      : "No players joined yet";

    if (!this.playerListText) {
      this.playerListText = new Text({
        text: names,
        style: {
          fill: 0xe0ffe0,
          fontSize: 24,
        },
      });
      this.playerListText.anchor.set(0.5, 0);
      this.playerListText.x = this.app.screen.width / 2;
      this.playerListText.y = this.app.screen.height / 2 + 10;
      this.app.stage.addChild(this.playerListText);
    } else {
      this.playerListText.text = names;
    }
  }

  hideLobby() {
    // Destroy lobby Pixi text nodes when game starts.
    if (this.statusText) {
      this.app.stage.removeChild(this.statusText);
      this.statusText.destroy();
      this.statusText = null;
    }

    if (this.playerListText) {
      this.app.stage.removeChild(this.playerListText);
      this.playerListText.destroy();
      this.playerListText = null;
    }
  }

  showControls() {
    if (this.buttons.length > 0) {
      return;
    }

    // Minimal in-game heading; action buttons can be added later.
    const title = new Text({
      text: "Hearts - Game Started",
      style: {
        fill: 0xffffff,
        fontSize: 24,
        fontWeight: "bold",
      },
    });

    title.x = 20;
    title.y = 18;
    this.app.stage.addChild(title);
    this.buttons.push(title);
  }

  hideControls() {
    // Cleanup all currently rendered control labels.
    this.buttons.forEach((btn) => {
      this.app.stage.removeChild(btn);
      btn.destroy();
    });
    this.buttons = [];
  }
}
