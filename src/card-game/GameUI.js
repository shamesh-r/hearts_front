// UI helper for lobby/name-entry overlays and in-game status labels.
import { Graphics, Text } from "pixi.js";

export class GameUI {
  /**
   * @param {import("pixi.js").Application} app
   * @param {import("./GameController").GameController} controller
   */
  constructor(app, controller) {
    this.app = app;
    this.controller = controller;
    this.titleText = null;
    this.passButton = null;
    this.passButtonEnabled = false;
    this.passButtonHandler = null;
    this.statusText = null;
    this.playerListText = null;
    this.nameOverlay = null;
    this.waitingOverlay = null;
    this.waitingText = null;
  }

  /**
   * Opens HTML modal overlay to capture player name before joining game.
   * @param {(name: string) => void} onSubmit callback invoked with validated name
   */
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

  /**
   * Renders waiting lobby text + connected player list on Pixi stage.
   */
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

  /**
   * Removes lobby text nodes from stage.
   */
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

  /**
   * Shows minimal in-game header.
   */
  showControls() {
    if (!this.titleText) {
      this.titleText = new Text({
        text: "Hearts - Game Started",
        style: {
          fill: 0xffffff,
          fontSize: 24,
          fontWeight: "bold",
        },
      });
      this.titleText.x = 20;
      this.titleText.y = 18;
      this.app.stage.addChild(this.titleText);
    }
  }

  /**
   * Removes current header/control display nodes.
   */
  hideControls() {
    if (this.titleText) {
      this.app.stage.removeChild(this.titleText);
      this.titleText.destroy();
      this.titleText = null;
    }

    this.hidePassButton();
  }

  /**
   * Updates top title to reflect current game phase.
   */
  updatePhase(phase) {
    if (!this.titleText) {
      this.showControls();
    }

    if (!this.titleText) {
      return;
    }

    const label = phase === "passing" ? "Hearts - Passing Phase" : "Hearts - Playing Phase";
    this.titleText.text = label;
  }

  /**
   * Creates/updates pass button. Click works only when button is enabled.
   */
  showPassButton(onClick) {
    this.passButtonHandler = onClick;

    if (!this.passButton) {
      this.passButton = new Text({
        text: "Pass Cards",
        style: {
          fill: 0x8f8f8f,
          fontSize: 22,
          fontWeight: "bold",
        },
      });
      this.passButton.x = 20;
      this.passButton.y = 56;
      this.passButton.interactive = true;
      this.passButton.buttonMode = true;
      this.passButton.on("pointerdown", () => {
        if (this.passButtonEnabled && this.passButtonHandler) {
          this.passButtonHandler();
        }
      });
      this.app.stage.addChild(this.passButton);
    }
  }

  /**
   * Enables/disables pass button visual + click behavior.
   */
  setPassButtonEnabled(enabled) {
    this.passButtonEnabled = enabled;
    if (!this.passButton) {
      return;
    }

    this.passButton.alpha = enabled ? 1 : 0.6;
    this.passButton.style.fill = enabled ? 0xffffff : 0x8f8f8f;
  }

  /**
   * Removes pass button from stage.
   */
  hidePassButton() {
    if (this.passButton) {
      this.app.stage.removeChild(this.passButton);
      this.passButton.destroy();
      this.passButton = null;
    }
    this.passButtonEnabled = false;
    this.passButtonHandler = null;
  }

  /**
   * Blocks interactions and shows wait message while pass exchange is pending.
   */
  showWaitingOverlay(message) {
    this.hideWaitingOverlay();

    this.waitingOverlay = new Graphics();
    this.waitingOverlay.beginFill(0x000000, 0.45);
    this.waitingOverlay.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
    this.waitingOverlay.endFill();
    this.app.stage.addChild(this.waitingOverlay);

    this.waitingText = new Text({
      text: message,
      style: {
        fill: 0xffffff,
        fontSize: 28,
        fontWeight: "bold",
      },
    });
    this.waitingText.anchor.set(0.5);
    this.waitingText.x = this.app.screen.width / 2;
    this.waitingText.y = this.app.screen.height / 2;
    this.app.stage.addChild(this.waitingText);
  }

  /**
   * Hides waiting overlay and restores visible table.
   */
  hideWaitingOverlay() {
    if (this.waitingOverlay) {
      this.app.stage.removeChild(this.waitingOverlay);
      this.waitingOverlay.destroy();
      this.waitingOverlay = null;
    }

    if (this.waitingText) {
      this.app.stage.removeChild(this.waitingText);
      this.waitingText.destroy();
      this.waitingText = null;
    }
  }
}
