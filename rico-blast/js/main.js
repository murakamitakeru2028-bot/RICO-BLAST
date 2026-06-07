const STATE = {
  TITLE: "title",
  PLAYING: "playing",
  REWARD_READY: "reward_ready",
  SKILL_SELECT: "skill_select",
  UPGRADE: "upgrade",
  GAME_OVER: "game_over"
};

let currentState = STATE.TITLE;
let animationId = null;

function setState(newState) {
  currentState = newState;
  UI.updateScreens(newState);
  if (Game) Game.lastTime = 0;
}

function gameLoop(timestamp) {
  if (currentState === STATE.PLAYING) {
    Game.update(timestamp);
    Game.render();
  } else if (currentState !== STATE.TITLE && Game.ctx) {
    Game.updatePaused(timestamp);
    Game.render();
  }
  animationId = requestAnimationFrame(gameLoop);
}

function init() {
  UI.initTitle();
  AudioSystem.bindUiSounds();
  setState(STATE.TITLE);
  if (animationId) cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(gameLoop);
}

window.addEventListener("load", init);
window.addEventListener("resize", () => {
  if (currentState !== STATE.TITLE && Game.canvas) {
    Game.setupCanvas();
    Game.render();
  }
});
