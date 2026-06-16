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
let lastLoopFrameAt = 0;

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
  lastLoopFrameAt = 0;
  if (shouldRunGameLoop()) startGameLoop();
  else stopGameLoop();
}

function shouldProcessFrame(timestamp) {
  const frameInterval = Game && Game.getFrameInterval ? Game.getFrameInterval() : 0;
  if (frameInterval <= 0) {
    lastLoopFrameAt = timestamp;
    return true;
  }
  if (!lastLoopFrameAt) {
    lastLoopFrameAt = timestamp;
    return true;
  }
  const elapsed = timestamp - lastLoopFrameAt;
  if (elapsed < frameInterval) return false;
  lastLoopFrameAt = elapsed > frameInterval * 4
    ? timestamp
    : lastLoopFrameAt + frameInterval;
  return true;
}

function gameLoop(timestamp) {
  animationId = null;
  if (!shouldProcessFrame(timestamp)) {
    if (shouldRunGameLoop()) startGameLoop();
    return;
  }
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
