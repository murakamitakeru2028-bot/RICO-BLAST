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
let resizeFrame = null;

function shouldRunGameLoop() {
  return currentState !== STATE.TITLE && currentState !== STATE.GAME_OVER;
}

function startGameLoop() {
  if (!animationId) {
    animationId = requestAnimationFrame(gameLoop);
  }
}

function stopGameLoop() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

function setState(newState) {
  currentState = newState;
  UI.updateScreens(newState);
  if (Game) Game.lastTime = 0;
  if (shouldRunGameLoop()) startGameLoop();
  else stopGameLoop();
}

function gameLoop(timestamp) {
  animationId = null;
  if (currentState === STATE.PLAYING) {
    Game.update(timestamp);
    Game.render();
  } else if (currentState !== STATE.TITLE && Game.ctx) {
    Game.updatePaused(timestamp);
    Game.render();
  }
  if (shouldRunGameLoop()) startGameLoop();
}

function init() {
  stopGameLoop();
  UI.initTitle();
  AudioSystem.bindUiSounds();
  setState(STATE.TITLE);
}

window.addEventListener("load", init);
window.addEventListener("resize", () => {
  if (resizeFrame) return;
  resizeFrame = requestAnimationFrame(() => {
    resizeFrame = null;
    if (currentState !== STATE.TITLE && Game.canvas) {
      Game.setupCanvas();
      Game.render();
    }
  });
});
