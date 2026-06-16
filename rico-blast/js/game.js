const PERFORMANCE_STORAGE_KEY = "ricoBlast_powerSave";
const MINIMAL_STORAGE_KEY = "ricoBlast_minimalMode";

const Game = {
  canvas: null,
  ctx: null,
  dpr: 1,
  baseWidth: 390,
  baseHeight: 507,
  width: 0,
  height: 0,
  difficultyLevel: 1,
  score: 0,
  tokens: 0,
  combo: 0,
  comboHudValue: 0,
  blocksPerSkill: 30,
  blocksTowardSkill: 0,
  totalBlocksDestroyed: 0,
  skillSelections: 0,
  skillRerollCount: 0,
  rewardPending: false,
  tokenGainAmount: 0,
  tokenGainTimeout: null,
  scoreGainAmount: 0,
  scoreGainTimeout: null,
  scoreGainBoosted: false,
  lastReadyLaunchAt: 0,
  lastTime: 0,
  playTime: 0,
  balls: [],
  blocks: [],
  paddle: new Paddle(),
  bumper: new Bumper(),
  projectiles: [],
  zones: [],
  inputReady: false,
  hudReady: false,
  hudNodes: null,
  hudState: null,
  slotUiTimer: 0,
  slotUiInterval: 0.1,
  paused: false,
  blockSpawnTimer: 0,
  blockRowsSpawned: 0,
  blockGridOffset: 0,
  phaseTimeout: null,
  resumeInvincibleTimer: 0,
  resumeInvincibleDuration: 2,
  awaitingStartClick: false,
  grantInvincibleOnStartClick: false,
  inputSettingsLoaded: false,
  inputSettings: {
    mode: "direct",
    sensitivity: 1
  },
  performanceSettingsLoaded: false,
  performanceSettings: {
    powerSave: false,
    minimal: false
  },
  resumeCountdown: 0,
  resumeCountdownDuration: 3,
  resumeCountdownLastValue: 0,
  inputDrag: {
    active: false,
    pointerId: null,
    startX: 0,
    startTargetX: 0
  },

  init() {
    clearTimeout(this.phaseTimeout);
    this.canvas = document.getElementById("game-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.cacheHudNodes();
    this.difficultyLevel = 1;
    this.score = 0;
    this.tokens = 0;
    this.combo = 0;
    this.comboHudValue = 0;
    this.blocksTowardSkill = 0;
    this.totalBlocksDestroyed = 0;
    this.skillSelections = 0;
    this.skillRerollCount = 0;
    this.rewardPending = false;
    this.tokenGainAmount = 0;
    this.scoreGainAmount = 0;
    this.scoreGainBoosted = false;
    this.lastReadyLaunchAt = 0;
    clearTimeout(this.tokenGainTimeout);
    this.tokenGainTimeout = null;
    clearTimeout(this.scoreGainTimeout);
    this.scoreGainTimeout = null;
    const nodes = this.hudNodes || {};
    const tokenGainNode = nodes.tokenGain;
    if (tokenGainNode) {
      tokenGainNode.textContent = "+0 トークン";
      tokenGainNode.classList.remove("active");
    }
    const scoreGainNode = nodes.scoreGain;
    if (scoreGainNode) {
      scoreGainNode.textContent = "+0";
      scoreGainNode.classList.remove("active", "boosted");
    }
    const hpTokenNode = nodes.hpToken;
    if (hpTokenNode) hpTokenNode.textContent = "0";
    const hpTokenDisplay = nodes.hpTokenDisplay;
    if (hpTokenDisplay) hpTokenDisplay.classList.remove("pulse");
    this.lastTime = 0;
    this.playTime = 0;
    this.slotUiTimer = 0;
    this.paused = false;
    this.awaitingStartClick = false;
    this.grantInvincibleOnStartClick = false;
    this.blocks = [];
    this.projectiles = [];
    this.zones = [];
    this.blockSpawnTimer = 0;
    this.blockRowsSpawned = 0;
    this.blockGridOffset = 0;
    this.resumeInvincibleTimer = 0;
    this.paddle = new Paddle();
    this.paddle.setMaxHp(this.getPaddleMaxHp());
    this.bumper = new Bumper();
    this.loadInputSettings();
    this.loadPerformanceSettings();
    this.setupCanvas();
    this.setupInput();
    this.setupHudControls();
    this.paddle.setPosition(this.width, this.height);
    this.bumper.reset(this.width, this.height);
    this.balls = [new Ball(this.width / 2, this.paddle.y - 12, "#ffffff")];
    this.syncBumperFromBalls(false);
    TokenManager.clear();
    Effects.clear();
    this.updateHud();
    UI.renderSlots(this.balls, this.paddle);
  },

  cacheHudNodes() {
    const scoreBlock = document.getElementById("hud-score-block");
    this.hudNodes = {
      score: document.getElementById("hud-score"),
      scoreBlock,
      scoreGain: document.getElementById("score-gain-text"),
      skillProgress: document.getElementById("hud-skill-progress"),
      hpToken: document.getElementById("hp-token-count"),
      hpTokenDisplay: document.getElementById("hp-token-display"),
      tokenGain: document.getElementById("token-gain-text"),
      pauseButton: document.getElementById("btn-pause"),
      timer: document.getElementById("hud-timer"),
      comboBanner: document.getElementById("combo-banner"),
      comboCount: document.getElementById("combo-count")
    };
    this.hudState = {};
  },

  setupCanvas() {
    if (!this.canvas) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, this.getDprCap());
    this.width = this.baseWidth;
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    const rect = this.canvas.getBoundingClientRect();
    this.height = rect.width > 0 && rect.height > 0
      ? Math.round(this.width * (rect.height / rect.width))
      : this.baseHeight;
    const bitmapWidth = Math.max(1, Math.round((rect.width || this.width) * this.dpr));
    const bitmapHeight = Math.max(1, Math.round((rect.height || this.height) * this.dpr));
    this.canvas.width = bitmapWidth;
    this.canvas.height = bitmapHeight;
    this.ctx.setTransform(bitmapWidth / this.width, 0, 0, bitmapHeight / this.height, 0, 0);
    if (this.paddle) {
      this.paddle.y = this.paddle.getY(this.height);
      this.paddle.targetX = clamp(this.paddle.targetX || this.width / 2, 0, this.width);
      this.paddle.x = clamp(this.paddle.x, 0, Math.max(0, this.width - this.paddle.getWidth()));
    }
    if (this.bumper) this.bumper.setPosition(this.width, this.height);
  },

  setupInput() {
    if (this.inputReady || !this.canvas) return;
    const toGameX = (clientX) => {
      const rect = this.canvas.getBoundingClientRect();
      return ((clientX - rect.left) / Math.max(1, rect.width)) * this.width;
    };
    const getSettings = () => this.getInputSettings();
    const updateDirect = (clientX) => {
      if (!this.paddle || this.isInputLocked()) return;
      this.paddle.onTouch(clamp(toGameX(clientX), 0, this.width));
    };
    const startDrag = (clientX, pointerId = null) => {
      if (!this.paddle || this.isInputLocked()) return;
      const settings = getSettings();
      if (settings.mode === "drag") {
        this.inputDrag.active = true;
        this.inputDrag.pointerId = pointerId;
        this.inputDrag.startX = toGameX(clientX);
        this.inputDrag.startTargetX = this.paddle.targetX || (this.paddle.x + this.paddle.getWidth() / 2);
        return;
      }
      updateDirect(clientX);
    };
    const updateInput = (clientX, pointerId = null) => {
      if (!this.paddle || this.isInputLocked()) return;
      const settings = getSettings();
      if (settings.mode !== "drag") {
        updateDirect(clientX);
        return;
      }
      if (!this.inputDrag.active) return;
      if (this.inputDrag.pointerId !== null && pointerId !== null && this.inputDrag.pointerId !== pointerId) return;
      const delta = (toGameX(clientX) - this.inputDrag.startX) * settings.sensitivity;
      this.paddle.onTouch(clamp(this.inputDrag.startTargetX + delta, 0, this.width));
    };
    const endDrag = (pointerId = null) => {
      if (this.inputDrag.pointerId !== null && pointerId !== null && this.inputDrag.pointerId !== pointerId) return;
      this.inputDrag.active = false;
      this.inputDrag.pointerId = null;
    };
    const bindInputZone = (zone, { launch = false, prevent = false } = {}) => {
      if (!zone) return;
      zone.addEventListener("pointerdown", (event) => {
        if (prevent) event.preventDefault();
        AudioSystem.unlock();
        startDrag(event.clientX, event.pointerId);
        if (event.currentTarget && event.currentTarget.setPointerCapture) {
          try {
            event.currentTarget.setPointerCapture(event.pointerId);
          } catch (error) {
            // Some browsers reject pointer capture on non-primary touches.
          }
        }
        if (launch) {
          if (!this.isInputLocked()) {
            this.releaseStartClickHold();
            this.launchNextReadyBall();
          }
        }
      });
      zone.addEventListener("pointermove", (event) => {
        if (prevent) event.preventDefault();
        updateInput(event.clientX, event.pointerId);
      });
      zone.addEventListener("pointerup", (event) => endDrag(event.pointerId));
      zone.addEventListener("pointercancel", (event) => endDrag(event.pointerId));
      if (typeof window !== "undefined" && !window.PointerEvent) {
        zone.addEventListener("touchstart", (event) => {
          if (prevent) event.preventDefault();
          AudioSystem.unlock();
          if (event.touches[0]) startDrag(event.touches[0].clientX);
          if (launch) {
            if (!this.isInputLocked()) {
              this.releaseStartClickHold();
              this.launchNextReadyBall();
            }
          }
        }, { passive: !prevent });
        zone.addEventListener("touchmove", (event) => {
          if (prevent) event.preventDefault();
          if (event.touches[0]) updateInput(event.touches[0].clientX);
        }, { passive: !prevent });
        zone.addEventListener("touchend", () => endDrag());
        zone.addEventListener("touchcancel", () => endDrag());
      }
    };

    bindInputZone(this.canvas, { launch: true, prevent: true });
    bindInputZone(document.getElementById("hud-bar"), { launch: true });
    bindInputZone(document.getElementById("paddle-hp"), { launch: true });
    bindInputZone(document.getElementById("slot-bar"), { launch: true });
    bindInputZone(document.getElementById("paddle-status"), { launch: true });
    window.addEventListener("pointerup", (event) => endDrag(event.pointerId));
    window.addEventListener("pointercancel", (event) => endDrag(event.pointerId));
    this.inputReady = true;
  },

  loadInputSettings() {
    if (this.inputSettingsLoaded) return this.inputSettings;
    const defaults = { mode: "direct", sensitivity: 1 };
    let mode = defaults.mode;
    let sensitivity = defaults.sensitivity;
    try {
      mode = localStorage.getItem("ricoBlast_inputMode") || defaults.mode;
      sensitivity = Number(localStorage.getItem("ricoBlast_inputSensitivity") || defaults.sensitivity);
    } catch (error) {
      mode = defaults.mode;
      sensitivity = defaults.sensitivity;
    }
    this.inputSettings = {
      mode: mode === "drag" ? "drag" : "direct",
      sensitivity: clamp(Number.isFinite(sensitivity) ? sensitivity : defaults.sensitivity, 0.6, 2.5)
    };
    this.inputSettingsLoaded = true;
    return this.inputSettings;
  },

  getInputSettings() {
    return this.loadInputSettings();
  },

  setInputSettings(nextSettings = {}) {
    const current = this.getInputSettings();
    this.inputSettings = {
      mode: nextSettings.mode === "drag" ? "drag" : (nextSettings.mode === "direct" ? "direct" : current.mode),
      sensitivity: clamp(Number.isFinite(Number(nextSettings.sensitivity)) ? Number(nextSettings.sensitivity) : current.sensitivity, 0.6, 2.5)
    };
    this.inputDrag.active = false;
    this.inputDrag.pointerId = null;
    try {
      localStorage.setItem("ricoBlast_inputMode", this.inputSettings.mode);
      localStorage.setItem("ricoBlast_inputSensitivity", String(this.inputSettings.sensitivity));
    } catch (error) {
      // Settings still apply for the current session when storage is blocked.
    }
    return this.inputSettings;
  },

  loadPerformanceSettings() {
    this.performanceSettings = { powerSave: true, minimal: true };
    this.performanceSettingsLoaded = true;
    return this.performanceSettings;
  },

  getPerformanceSettings() {
    return this.loadPerformanceSettings();
  },

  setPerformanceSettings() {
    const current = this.getPerformanceSettings();
    const powerSave = true;
    const minimal = true;
    const changed = powerSave !== current.powerSave || minimal !== current.minimal;
    this.performanceSettings = { powerSave, minimal };
    this.performanceSettingsLoaded = true;
    try {
      localStorage.setItem(PERFORMANCE_STORAGE_KEY, "1");
      localStorage.setItem(MINIMAL_STORAGE_KEY, "1");
    } catch (error) {
      // Performance settings still apply for the current session when storage is blocked.
    }
    if (changed) {
      this.lastTime = 0;
      this.slotUiTimer = 0;
      if (typeof Effects !== "undefined" && Effects.trimEffects) Effects.trimEffects();
      if (typeof TokenManager !== "undefined" && TokenManager.trimTokens) TokenManager.trimTokens();
      if (this.canvas && this.ctx) {
        this.setupCanvas();
        this.render();
      }
    }
    return this.performanceSettings;
  },

  isPowerSaveEnabled() {
    return true;
  },

  isMinimalModeEnabled() {
    return true;
  },

  isReducedVisualsEnabled() {
    return true;
  },

  getDprCap() {
    return 1;
  },

  getFrameInterval() {
    return 1000 / 30;
  },

  getSlotUiInterval() {
    return 0.33;
  },

  setupHudControls() {
    if (this.hudReady) return;
    const pauseButton = document.getElementById("btn-pause");
    if (pauseButton) {
      pauseButton.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        event.stopPropagation();
      });
      pauseButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.openPauseSettings();
      });
    }
    this.hudReady = true;
  },

  isResuming() {
    return this.resumeCountdown > 0;
  },

  isInputLocked() {
    return currentState !== STATE.PLAYING || this.paused || this.isResuming();
  },

  openPauseSettings() {
    if (currentState !== STATE.PLAYING || this.paused || this.isResuming()) return;
    AudioSystem.unlock();
    this.paused = true;
    this.resumeCountdown = 0;
    this.resumeCountdownLastValue = 0;
    this.inputDrag.active = false;
    this.inputDrag.pointerId = null;
    this.lastTime = 0;
    UI.showPauseSettings();
    this.updateHud();
  },

  beginResumeCountdown() {
    if (currentState !== STATE.PLAYING || !this.paused) return;
    this.paused = false;
    this.resumeCountdown = this.resumeCountdownDuration;
    this.resumeCountdownLastValue = Math.ceil(this.resumeCountdown);
    this.inputDrag.active = false;
    this.inputDrag.pointerId = null;
    this.lastTime = 0;
    UI.hidePauseSettings();
    UI.updateResumeCountdown(this.resumeCountdownLastValue, true);
    this.updateHud();
  },

  finishResumeCountdown() {
    this.resumeCountdown = 0;
    this.resumeCountdownLastValue = 0;
    this.lastTime = 0;
    UI.updateResumeCountdown(0, false);
    this.updateHud();
  },

  startRun() {
    clearTimeout(this.phaseTimeout);
    this.setupCanvas();
    this.combo = 0;
    this.lastTime = 0;
    this.paused = false;
    this.resumeCountdown = 0;
    this.resumeCountdownLastValue = 0;
    this.awaitingStartClick = false;
    this.grantInvincibleOnStartClick = false;
    this.rewardPending = false;
    this.projectiles = [];
    this.zones = [];
    const needsInitialBoard = this.blocks.length === 0 && this.blockRowsSpawned === 0;
    this.blockSpawnTimer = 0;
    TokenManager.clear();
    if (needsInitialBoard) this.createBlocks();
    else this.syncBlockGridPositions();
    this.paddle.setPosition(this.width, this.height);
    this.syncBumperFromBalls(false);
    this.bumper.reset(this.width, this.height);
    for (let i = 0; i < this.balls.length; i += 1) {
      const ball = this.balls[i];
      ball.color = BALL_COLORS[i] || "#ffffff";
      ball.launch(this.paddle.x + this.paddle.getWidth() / 2, this.paddle.y - 12);
    }
    this.grantResumeInvincibility();
    this.updateHud();
    UI.renderSlots(this.balls, this.paddle);
  },

  resumePlayAfterReward() {
    clearTimeout(this.phaseTimeout);
    this.setupCanvas();
    this.combo = 0;
    this.lastTime = 0;
    this.paused = false;
    this.resumeCountdown = 0;
    this.resumeCountdownLastValue = 0;
    this.awaitingStartClick = false;
    this.grantInvincibleOnStartClick = false;
    this.rewardPending = false;
    this.projectiles = [];
    this.zones = [];
    this.difficultyLevel += 1;
    this.blockSpawnTimer = 0;
    if (this.blocks.length === 0) this.createBlocks();
    else this.syncBlockGridPositions();
    this.paddle.setPosition(this.width, this.height);
    this.syncBumperFromBalls(false);
    this.bumper.reset(this.width, this.height);
    for (let i = 0; i < this.balls.length; i += 1) {
      const ball = this.balls[i];
      ball.color = BALL_COLORS[i] || "#ffffff";
      ball.readyOnPaddle(this);
    }
    this.holdUntilStartClick({ grantInvincible: true });
    this.updateHud();
    UI.renderSlots(this.balls, this.paddle);
  },

  grantResumeInvincibility(duration = this.resumeInvincibleDuration) {
    this.resumeInvincibleTimer = Math.max(this.resumeInvincibleTimer, duration);
  },

  isResumeInvincible() {
    return this.resumeInvincibleTimer > 0;
  },

  holdUntilStartClick({ grantInvincible = true } = {}) {
    this.awaitingStartClick = true;
    this.grantInvincibleOnStartClick = grantInvincible;
    this.lastTime = 0;
    this.positionWaitingLaunchBalls();
    this.updateHud();
    UI.renderSlots(this.balls, this.paddle);
  },

  releaseStartClickHold() {
    if (!this.awaitingStartClick) return false;
    this.awaitingStartClick = false;
    if (this.grantInvincibleOnStartClick) this.grantResumeInvincibility();
    this.grantInvincibleOnStartClick = false;
    this.lastTime = 0;
    this.updateHud();
    UI.renderSlots(this.balls, this.paddle);
    return true;
  },

  getAutoBumperLevel() {
    if (!this.bumper || !this.bumper.unlocked) return 0;
    return clamp(this.balls.length, 1, BALL_MAX - 1);
  },

  syncBumperFromBalls(playEffect = false) {
    if (!this.bumper) this.bumper = new Bumper();
    const previousLevel = this.bumper.level || 0;
    const nextLevel = this.getAutoBumperLevel();
    this.bumper.level = nextLevel;
    this.bumper.syncStats();

    if (nextLevel <= previousLevel) return false;
    this.bumper.hp = this.bumper.maxHp;
    this.bumper.broken = false;
    this.bumper.reviveTimer = 0;
    this.bumper.flashTimer = 0.3;
    this.bumper.hitFlashTimer = 0;

    if (playEffect && this.width > 0) {
      Effects.showBumperRevive(this.width / 2, this.bumper.y);
      AudioSystem.playBumperRevive();
    }
    return true;
  },

  updateResumeInvincibility(dt) {
    this.resumeInvincibleTimer = Math.max(0, this.resumeInvincibleTimer - dt);
  },

  createBlocks() {
    this.blocks = [];
    this.blockRowsSpawned = 0;
    this.blockGridOffset = 0;
    const layout = this.getBlockLayout();
    const startRow = -1;
    const rows = 5;
    const endRow = startRow + rows - 1;
    this.spawnBlockBand(startRow, endRow, layout);
  },

  getBlockLayout() {
    const cols = 5;
    const gap = 6;
    const targetPadding = 12;
    const available = this.width - targetPadding * 2 - gap * (cols - 1);
    const blockWidth = Math.floor(available / cols);
    const padding = Math.round((this.width - (blockWidth * cols + gap * (cols - 1))) / 2);
    return {
      cols,
      padding,
      gap,
      rowGap: 7,
      blockWidth,
      blockHeight: 28
    };
  },

  getBlockRowPitch(layout = this.getBlockLayout()) {
    return layout.blockHeight + layout.rowGap;
  },

  getBlockStartY() {
    return 6;
  },

  getBlockSpawnLeadRatio() {
    return 0.08;
  },

  getBlockY(rowIndex, layout = this.getBlockLayout()) {
    return this.getBlockStartY() + rowIndex * this.getBlockRowPitch(layout) + this.blockGridOffset;
  },

  getBlockHeightForSpan(spanRows = 1, layout = this.getBlockLayout()) {
    const span = Math.max(1, Math.floor(spanRows || 1));
    return layout.blockHeight + (span - 1) * this.getBlockRowPitch(layout);
  },

  getBlockWidthForSpan(spanCols = 1, layout = this.getBlockLayout()) {
    const span = Math.max(1, Math.floor(spanCols || 1));
    return layout.blockWidth * span + layout.gap * (span - 1);
  },

  getBlockTopY(rowIndex, spanRows = 1, layout = this.getBlockLayout()) {
    return this.getBlockY(rowIndex, layout) - (Math.max(1, spanRows || 1) - 1) * this.getBlockRowPitch(layout);
  },

  getBlockOccupiedRows(block) {
    const span = Math.max(1, block.gridSpanRows || 1);
    const bottomRow = Number.isFinite(block.gridRow) ? block.gridRow : 0;
    return {
      start: bottomRow - span + 1,
      end: bottomRow
    };
  },

  getBlockOccupiedCols(block) {
    const span = Math.max(1, block.gridSpanCols || 1);
    const startCol = Number.isFinite(block.gridCol) ? block.gridCol : 0;
    return {
      start: startCol,
      end: startCol + span - 1
    };
  },

  getBlockCellKey(rowIndex, col) {
    return rowIndex * 16 + col;
  },

  buildBlockOccupancy(exceptBlock = null) {
    const occupancy = {
      occupied: new Set(),
      heavyAdjacent: new Set()
    };
    for (const block of this.blocks) {
      if (block === exceptBlock) continue;
      this.markBlockInOccupancy(block, occupancy);
    }
    return occupancy;
  },

  markBlockInOccupancy(block, occupancy) {
    if (!block || !occupancy) return;
    const rows = this.getBlockOccupiedRows(block);
    const cols = this.getBlockOccupiedCols(block);
    for (let row = rows.start; row <= rows.end; row += 1) {
      for (let col = cols.start; col <= cols.end; col += 1) {
        occupancy.occupied.add(this.getBlockCellKey(row, col));
      }
    }
    if (block.effect !== "heavy") return;
    for (let row = rows.start - 1; row <= rows.end + 1; row += 1) {
      for (let col = cols.start - 1; col <= cols.end + 1; col += 1) {
        occupancy.heavyAdjacent.add(this.getBlockCellKey(row, col));
      }
    }
  },

  isBlockCellOccupied(rowIndex, col, exceptBlock = null, occupancy = null) {
    if (occupancy && !exceptBlock) return occupancy.occupied.has(this.getBlockCellKey(rowIndex, col));
    return this.blocks.some((block) => {
      if (block === exceptBlock) return false;
      const rows = this.getBlockOccupiedRows(block);
      const cols = this.getBlockOccupiedCols(block);
      return rowIndex >= rows.start && rowIndex <= rows.end && col >= cols.start && col <= cols.end;
    });
  },

  canPlaceBlockAt(rowIndex, col, type = "stone", layout = this.getBlockLayout(), bounds = {}, occupancy = null) {
    const definition = Block.types[type] || Block.types.stone;
    const span = Math.max(1, definition.gridSpanRows || 1);
    const spanCols = Math.max(1, definition.gridSpanCols || 1);
    const startRow = rowIndex - span + 1;
    if (Number.isFinite(bounds.minRow) && startRow < bounds.minRow) return false;
    if (Number.isFinite(bounds.maxRow) && rowIndex > bounds.maxRow) return false;
    if (col < 0 || col + spanCols > layout.cols) return false;
    for (let row = startRow; row <= rowIndex; row += 1) {
      for (let checkCol = col; checkCol < col + spanCols; checkCol += 1) {
        if (this.isBlockCellOccupied(row, checkCol, null, occupancy)) return false;
      }
    }
    if (this.isHeavyBlockType(type) && this.hasAdjacentHeavyBlock(rowIndex, col, type, occupancy)) return false;
    return true;
  },

  isHeavyBlockType(type) {
    const definition = Block.types[type] || null;
    return !!definition && definition.effect === "heavy";
  },

  hasAdjacentHeavyBlock(rowIndex, col, type = "heavyS", occupancy = null) {
    const definition = Block.types[type] || Block.types.heavyS;
    const spanRows = Math.max(1, definition.gridSpanRows || 1);
    const spanCols = Math.max(1, definition.gridSpanCols || 1);
    const rows = {
      start: rowIndex - spanRows + 1,
      end: rowIndex
    };
    const cols = {
      start: col,
      end: col + spanCols - 1
    };
    if (occupancy) {
      for (let row = rows.start; row <= rows.end; row += 1) {
        for (let checkCol = cols.start; checkCol <= cols.end; checkCol += 1) {
          if (occupancy.heavyAdjacent.has(this.getBlockCellKey(row, checkCol))) return true;
        }
      }
      return false;
    }
    return this.blocks.some((block) => {
      if (block.effect !== "heavy") return false;
      const otherRows = this.getBlockOccupiedRows(block);
      const otherCols = this.getBlockOccupiedCols(block);
      return otherRows.end >= rows.start - 1 &&
        otherRows.start <= rows.end + 1 &&
        otherCols.end >= cols.start - 1 &&
        otherCols.start <= cols.end + 1;
    });
  },

  getBlockSpawnBandRows() {
    const activeTypes = this.getBlockTypeWeights()
      .filter(([, weight]) => weight > 0)
      .map(([type]) => type);
    return activeTypes.reduce((maxRows, type) => {
      const definition = Block.types[type] || Block.types.stone;
      return Math.max(maxRows, Math.max(1, definition.gridSpanRows || 1));
    }, 1);
  },

  spawnBlockBand(startRow, endRow, layout = this.getBlockLayout()) {
    const bounds = { minRow: startRow, maxRow: endRow };
    const occupancy = this.buildBlockOccupancy();
    for (let row = endRow; row >= startRow; row -= 1) {
      this.spawnBlockRow(row, layout, bounds, occupancy);
    }
  },

  spawnBlockRow(rowIndex, layout = this.getBlockLayout(), bounds = {}, occupancy = null) {
    const hp = this.getBaseBlockHp(this.difficultyLevel);
    const speed = this.getBlockDescendSpeed();
    const rowOccupancy = occupancy || this.buildBlockOccupancy();
    for (let col = 0; col < layout.cols; col += 1) {
      if (this.isBlockCellOccupied(rowIndex, col, null, rowOccupancy)) continue;
      const x = layout.padding + col * (layout.blockWidth + layout.gap);
      const type = this.pickPlaceableBlockType(rowIndex, col, layout, bounds, rowOccupancy);
      const block = this.createBlockAt(rowIndex, col, type, hp, layout, speed, x);
      this.markBlockInOccupancy(block, rowOccupancy);
    }
    this.blockRowsSpawned += 1;
  },

  createBlockAt(rowIndex, col, type = "stone", hp = this.getBaseBlockHp(this.difficultyLevel), layout = this.getBlockLayout(), speed = this.getBlockDescendSpeed(), x = null) {
    const definition = Block.types[type] || Block.types.stone;
    const span = Math.max(1, definition.gridSpanRows || 1);
    const spanCols = Math.max(1, definition.gridSpanCols || 1);
    const pitch = this.getBlockRowPitch(layout);
    const blockX = Number.isFinite(x) ? x : layout.padding + col * (layout.blockWidth + layout.gap);
    const blockY = this.getBlockStartY() + rowIndex * pitch + this.blockGridOffset - (span - 1) * pitch;
    const blockHeight = layout.blockHeight + (span - 1) * pitch;
    const blockWidth = layout.blockWidth * spanCols + layout.gap * (spanCols - 1);
    const block = new Block(blockX, blockY, hp, type, blockWidth, blockHeight, speed);
    block.gridRow = rowIndex;
    block.gridCol = col;
    block.gridSpanRows = span;
    block.gridSpanCols = spanCols;
    this.blocks.push(block);
    return block;
  },

  spawnNormalBlockNear(sourceBlock) {
    if (!sourceBlock) return false;
    const layout = this.getBlockLayout();
    const occupancy = this.buildBlockOccupancy();
    const rows = this.getBlockOccupiedRows(sourceBlock);
    const cols = this.getBlockOccupiedCols(sourceBlock);
    const options = [];
    for (let row = rows.end; row >= rows.start; row -= 1) {
      options.push({ row, col: cols.start - 1 });
      options.push({ row, col: cols.end + 1 });
    }
    for (let col = cols.start; col <= cols.end; col += 1) {
      options.push({ row: rows.start - 1, col });
      options.push({ row: rows.end + 1, col });
    }
    const openOptions = options.filter((cell) =>
      cell.col >= 0 && cell.col < layout.cols && this.canPlaceBlockAt(cell.row, cell.col, "stone", layout, {}, occupancy)
    );
    if (openOptions.length === 0) return false;
    const cell = openOptions[0];
    const block = this.createBlockAt(cell.row, cell.col, "stone", this.getBaseBlockHp(this.difficultyLevel), layout);
    block.spawnFlashTimer = 0.3;
    if (Effects.spawnBlockSpawn) Effects.spawnBlockSpawn(block.cx, block.cy);
    else Effects.spawnImpactSpark(block.cx, block.cy, "#aa66ff");
    return true;
  },

  syncBlockGridPositions() {
    const layout = this.getBlockLayout();
    const pitch = this.getBlockRowPitch(layout);
    const baseY = this.getBlockStartY() + this.blockGridOffset;
    for (const block of this.blocks) {
      const col = Number.isFinite(block.gridCol) ? block.gridCol : 0;
      const row = Number.isFinite(block.gridRow) ? block.gridRow : 0;
      const span = Math.max(1, block.gridSpanRows || 1);
      const spanCols = Math.max(1, block.gridSpanCols || 1);
      block.width = layout.blockWidth * spanCols + layout.gap * (spanCols - 1);
      block.height = layout.blockHeight + (span - 1) * pitch;
      block.x = layout.padding + col * (layout.blockWidth + layout.gap);
      block.y = baseY + row * pitch - (span - 1) * pitch + (block.extraY || 0);
    }
  },

  pickPlaceableBlockType(rowIndex, col, layout = this.getBlockLayout(), bounds = {}, occupancy = null) {
    const options = this.getBlockTypeWeights();
    while (options.length > 0) {
      const type = this.pickWeightedBlockType(options);
      const index = options.findIndex(([candidate]) => candidate === type);
      if (index >= 0) options.splice(index, 1);
      if (type === "stone") return this.pickNormalBlockType();
      if (this.canPlaceBlockAt(rowIndex, col, type, layout, bounds, occupancy)) return type;
    }
    return this.pickNormalBlockType();
  },

  pickBlockType(rowIndex, col) {
    return this.pickPlaceableBlockType(rowIndex, col);
  },

  pickNormalBlockType() {
    if (Math.random() < 0.12) {
      const types = Block.coloredTypes || ["row", "chain", "tokens", "burst", "column", "aqua"];
      return types[randomInt(0, types.length - 1)];
    }
    return "stone";
  },

  getSpecialBlockRate() {
    const weights = this.getBlockTypeWeights();
    const total = weights.reduce((sum, [, weight]) => sum + weight, 0);
    const normal = weights.find(([type]) => type === "stone");
    return total > 0 ? clamp(1 - ((normal ? normal[1] : 0) / total), 0, 1) : 0;
  },

  pickNewSpecialBlockType() {
    const weighted = this.getBlockTypeWeights().filter(([type]) => type !== "stone");
    return this.pickWeightedBlockType(weighted) || "heavyS";
  },

  pickWeightedBlockType(weighted) {
    const total = weighted.reduce((sum, [, weight]) => sum + Math.max(0, weight), 0);
    if (total <= 0) return "stone";
    let roll = Math.random() * total;
    for (const [type, weight] of weighted) {
      roll -= Math.max(0, weight);
      if (roll <= 0) return type;
    }
    return weighted[0] ? weighted[0][0] : "stone";
  },

  getBlockTypeWeights() {
    const wave = Math.max(1, this.difficultyLevel || 1);
    let weights;
    if (wave < 5) {
      weights = [
        ["stone", 85],
        ["heavyS", 15]
      ];
    } else if (wave < 10) {
      weights = [
        ["stone", 72],
        ["heavyS", 12],
        ["armor", 8],
        ["dive", 8]
      ];
    } else if (wave < 15) {
      weights = [
        ["stone", 60],
        ["heavyS", 10],
        ["heavyM", 10],
        ["armor", 8],
        ["dive", 10],
        ["regen", 2]
      ];
    } else if (wave < 20) {
      weights = [
        ["stone", 50],
        ["heavyS", 8],
        ["heavyM", 8],
        ["armor", 8],
        ["dive", 12],
        ["regen", 5],
        ["exploder", 5],
        ["spawner", 4]
      ];
    } else {
      weights = [
        ["stone", 40],
        ["heavyS", 6],
        ["heavyM", 8],
        ["heavyL", 6],
        ["armor", 8],
        ["dive", 12],
        ["regen", 8],
        ["exploder", 6],
        ["spawner", 6]
      ];
      const diveBonus = clamp((wave - 20) * 0.8, 0, 8);
      weights = weights.map(([type, weight]) => {
        if (type === "stone") return [type, Math.max(0, weight - diveBonus)];
        if (type === "dive") return [type, weight + diveBonus];
        return [type, weight];
      });
    }
    return weights.map(([type, weight]) => [type, Math.max(0, weight)]);
  },

  pickColoredBlockType() {
    const types = Block.coloredTypes || ["row", "chain", "tokens", "burst", "column", "aqua"];
    return types[randomInt(0, types.length - 1)];
  },

  update(timestamp) {
    const dt = this.getDelta(timestamp);
    if (dt === 0) return;
    if (this.paused) {
      TokenManager.update(this, dt);
      Effects.update(dt);
      this.updateHud();
      return;
    }
    if (this.isResuming()) {
      this.resumeCountdown = Math.max(0, this.resumeCountdown - dt);
      const value = Math.max(1, Math.ceil(this.resumeCountdown));
      if (value !== this.resumeCountdownLastValue) {
        this.resumeCountdownLastValue = value;
        UI.updateResumeCountdown(value, this.resumeCountdown > 0);
      }
      if (this.resumeCountdown <= 0) {
        this.finishResumeCountdown();
      } else {
        Effects.update(dt);
        this.updateHud();
      }
      return;
    }
    if (this.awaitingStartClick) {
      this.paddle.update(this, dt);
      this.positionWaitingLaunchBalls();
      Effects.update(dt);
      this.updateHud();
      this.refreshSlotUi(dt);
      return;
    }
    this.playTime += dt;
    this.updateResumeInvincibility(dt);
    this.paddle.update(this, dt);
    this.bumper.update(this, dt);
    this.updateBlockGrid(dt);
    for (const block of [...this.blocks]) block.update(this, dt);
    this.updateProjectiles(dt);
    this.updateZones(dt);
    this.positionWaitingLaunchBalls();
    for (const ball of this.balls) ball.update(this, dt);
    this.positionWaitingLaunchBalls();
    TokenManager.update(this, dt);
    Effects.update(dt);

    this.resolvePaddleBlockContacts();
    if (this.paddle.hp <= 0) {
      this.gameOver();
      return;
    }
    this.removeEscapedBlocks();
    this.updateBlockSpawning(dt);

    this.updateHud();
    this.refreshSlotUi(dt);
  },

  refreshSlotUi(dt = 0, force = false) {
    this.slotUiTimer -= Math.max(0, dt || 0);
    if (!force && this.slotUiTimer > 0) return;
    this.slotUiTimer = this.getSlotUiInterval();
    UI.renderSlots(this.balls, this.paddle);
  },

  getWaitingLaunchBalls() {
    return this.balls.filter((ball) => ball.waitingLaunch);
  },

  positionWaitingLaunchBalls() {
    const waiting = this.getWaitingLaunchBalls();
    for (let i = 0; i < waiting.length; i += 1) {
      waiting[i].followPaddleLaunchPosition(this, i, waiting.length);
    }
  },

  launchNextReadyBall() {
    const ball = this.balls.find((candidate) => candidate.waitingLaunch);
    return this.launchReadyBall(ball);
  },

  launchReadyBall(ball) {
    if (currentState !== STATE.PLAYING || this.paused || !ball) return false;
    const releasedHold = this.releaseStartClickHold();
    if (!ball.waitingLaunch) return false;
    const now = performance.now();
    if (!releasedHold && now - this.lastReadyLaunchAt < 160) return false;
    this.positionWaitingLaunchBalls();
    if (!ball || !ball.launchFromPaddle(this)) return false;
    this.lastReadyLaunchAt = now;
    AudioSystem.playPaddle();
    Effects.shakeScreen(0.8, 0.05);
    this.positionWaitingLaunchBalls();
    UI.renderSlots(this.balls, this.paddle);
    return true;
  },

  getBlockDescendSpeed() {
    const wave = Math.max(1, this.difficultyLevel || 1);
    const earlyRamp = Math.max(0, wave - 2) * 0.001;
    const lateRamp = Math.max(0, wave - 12) * 0.00045;
    const ramp = Math.min(0.02, earlyRamp + lateRamp);
    return 0.09 + ramp;
  },

  updateBlockGrid(dt) {
    const frame = dt * 60;
    this.blockGridOffset += this.getBlockDescendSpeed() * frame;
    this.syncBlockGridPositions();
  },

  getBlockSpawnCooldown() {
    return 0.14;
  },

  updateBlockSpawning(dt = 0) {
    const layout = this.getBlockLayout();
    const pitch = this.getBlockRowPitch(layout);
    this.blockSpawnTimer = Math.max(0, this.blockSpawnTimer - Math.max(0, dt || 0));
    if (this.blocks.length < this.getMaxActiveBlocks() && this.blockSpawnTimer <= 0) {
      const topRow = this.getTopmostBlockRow();
      if (topRow === null) {
        this.createBlocks();
      } else {
        const topY = this.getBlockY(topRow, layout);
        if (topY >= this.getBlockStartY() + pitch * this.getBlockSpawnLeadRatio()) {
          const endRow = topRow - 1;
          const startRow = endRow - this.getBlockSpawnBandRows() + 1;
          this.spawnBlockBand(startRow, endRow, layout);
          this.blockSpawnTimer = this.getBlockSpawnCooldown();
        }
      }
    }
    this.syncBlockGridPositions();
  },

  getTopmostBlockY() {
    if (this.blocks.length === 0) return null;
    return this.blocks.reduce((top, block) => Math.min(top, block.y), Infinity);
  },

  getTopmostBlockRow() {
    if (this.blocks.length === 0) return null;
    return this.blocks.reduce((top, block) => {
      const row = Number.isFinite(block.gridRow) ? block.gridRow : 0;
      const span = Math.max(1, block.gridSpanRows || 1);
      return Math.min(top, row - span + 1);
    }, Infinity);
  },

  getMaxActiveBlocks() {
    return 60;
  },

  getBaseBlockHp(level = 1) {
    const step = Math.max(0, level - 1);
    const wave = Math.max(1, level);
    const earlyWaveRamp = Math.max(0, wave - 5) * 0.006;
    const midWaveRamp = Math.max(0, wave - 10) * 0.012;
    const lateWaveRamp = Math.max(0, wave - 20) * 0.016;
    return Math.floor(100 * Math.pow(1.21, step) * (1 + earlyWaveRamp + midWaveRamp + lateWaveRamp));
  },

  getPaddleMaxHp() {
    return this.getBaseBlockHp(1) * 2;
  },

  isBlockTouchingPaddle(block) {
    const blockRect = block.collisionRect;
    const paddleRect = {
      x: this.paddle.x,
      y: this.paddle.y,
      width: this.paddle.getWidth(),
      height: this.paddle.height
    };
    return blockRect.x < paddleRect.x + paddleRect.width &&
      blockRect.x + blockRect.width > paddleRect.x &&
      blockRect.y < paddleRect.y + paddleRect.height &&
      blockRect.y + blockRect.height > paddleRect.y;
  },

  resolvePaddleBlockContacts() {
    const touching = this.blocks.filter((block) => this.isBlockTouchingPaddle(block));
    for (const block of touching) {
      if (!this.blocks.includes(block)) continue;
      const damage = Math.max(1, Math.ceil(block.hp));
      this.blocks.splice(this.blocks.indexOf(block), 1);
      this.triggerDiveBlocksAbove(block);
      Effects.spawnBlockBreak(block.cx, block.cy, block.colorSet ? block.colorSet.body : "#ff4a4a", {
        special: block.isSpecial,
        combo: this.combo,
        effect: block.effect
      });
      this.damagePaddle(damage, block);
      if (this.paddle.hp <= 0) break;
    }
  },

  damagePaddle(amount, block) {
    if (this.isResumeInvincible()) {
      Effects.shakeScreen(0.7, 0.05);
      Effects.showBumperHit(block ? block.cx : this.paddle.x + this.paddle.getWidth() / 2, this.paddle.y, this.paddle.getWidth());
      AudioSystem.playBumperHit();
      UI.updatePaddleHp(this.paddle);
      return false;
    }
    const gameOver = this.paddle.takeDamage(amount);
    Effects.shakeScreen(gameOver ? 5 : 2.2, gameOver ? 0.26 : 0.12);
    Effects.showPaddleDamage(block ? block.cx : this.paddle.x + this.paddle.getWidth() / 2, this.paddle.y, amount);
    AudioSystem.playPaddleDamage(gameOver);
    this.combo = 0;
    UI.updatePaddleHp(this.paddle);
  },

  healPaddle(amount, x = null, y = null) {
    const healed = this.paddle.heal(amount);
    if (healed <= 0) return 0;
    const fx = x ?? (this.paddle.x + this.paddle.getWidth() / 2);
    const fy = y ?? this.paddle.y;
    if (Effects.showPaddleHeal) Effects.showPaddleHeal(fx, fy, healed);
    AudioSystem.playHeal(healed);
    UI.updatePaddleHp(this.paddle);
    return healed;
  },

  removeEscapedBlocks() {
    this.blocks = this.blocks.filter((block) => block.y < this.height + block.height);
  },

  updatePaused(timestamp) {
    const dt = this.getDelta(timestamp);
    if (dt > 0) {
      TokenManager.update(this, dt);
      Effects.update(dt);
    }
  },

  getDelta(timestamp) {
    if (!this.lastTime) {
      this.lastTime = timestamp;
      return 0;
    }
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.033);
    this.lastTime = timestamp;
    return dt;
  },

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    this.drawBackground(ctx);
    this.drawZones(ctx);
    TokenManager.draw(ctx);
    for (const block of this.blocks) {
      if (block.y + block.height < -48 || block.y > this.height + 48) continue;
      block.draw(ctx);
    }
    this.drawProjectiles(ctx);
    this.paddle.draw(ctx);
    this.drawResumeShield(ctx);
    this.bumper.draw(ctx);
    for (const ball of this.balls) ball.draw(ctx);
    Effects.draw(ctx);
    this.updateComboHud();
  },

  drawBackground(ctx) {
    ctx.save();
    ctx.fillStyle = "#080812";
    ctx.fillRect(0, 0, this.width, this.height);
    if (this.isMinimalModeEnabled()) {
      ctx.restore();
      return;
    }
    ctx.strokeStyle = "rgba(255,255,255,0.028)";
    ctx.lineWidth = 1;
    for (let y = 64; y < this.height; y += 64) {
      ctx.beginPath();
      ctx.moveTo(16, y);
      ctx.lineTo(this.width - 16, y);
      ctx.stroke();
    }
    ctx.restore();
  },

  drawResumeShield(ctx) {
    if (!this.isResumeInvincible() || !this.paddle) return;
    const ratio = clamp(this.resumeInvincibleTimer / this.resumeInvincibleDuration, 0, 1);
    const width = this.paddle.getWidth();
    const pulse = 0.5 + Math.sin(performance.now() / 70) * 0.5;
    const x = this.paddle.x - 9;
    const y = this.paddle.y - 7;
    const w = width + 18;
    const h = this.paddle.height + 14;
    ctx.save();
    ctx.globalAlpha = 0.18 + ratio * 0.16;
    ctx.fillStyle = "rgba(103,216,255,0.2)";
    roundedRect(ctx, x, y, w, h, 11);
    ctx.fill();
    ctx.globalAlpha = 0.42 + pulse * 0.22;
    ctx.strokeStyle = "rgba(232,248,255,0.82)";
    ctx.lineWidth = 1.4;
    roundedRect(ctx, x + 0.7, y + 0.7, w - 1.4, h - 1.4, 10);
    ctx.stroke();
    ctx.globalAlpha = ratio * 0.2;
    ctx.strokeStyle = "rgba(124,245,178,0.78)";
    ctx.lineWidth = 3;
    roundedRect(ctx, x - 2, y - 2, w + 4, h + 4, 13);
    ctx.stroke();
    ctx.restore();
  },

  drawCombo(ctx) {
    const combo = this.getPaddlelessComboCount();
    if (combo < 2) return;
    const multiplier = this.getPaddlelessScoreMultiplier({ paddlelessHits: combo });
    const x = this.width - 15;
    const y = 12;
    const w = 86;
    const h = 32;
    ctx.save();
    ctx.translate(x - w, y);
    ctx.globalAlpha = 0.94;
    roundedRect(ctx, 0, 0, w, h, 6);
    ctx.fillStyle = "rgba(18,18,42,0.74)";
    ctx.fill();
    ctx.strokeStyle = combo >= 10 ? "rgba(255,230,107,0.64)" : "rgba(124,245,178,0.48)";
    ctx.lineWidth = 1;
    roundedRect(ctx, 0.5, 0.5, w - 1, h - 1, 5.5);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "700 7px 'Space Mono', monospace";
    ctx.fillStyle = "rgba(246,251,255,0.58)";
    ctx.fillText("コンボ", w / 2, 7);
    ctx.font = `800 ${combo >= 10 ? 17 : 16}px 'Space Mono', monospace`;
    ctx.fillStyle = combo >= 10 ? "#ffe66b" : "#7cf5b2";
    ctx.shadowBlur = 10;
    ctx.shadowColor = ctx.fillStyle;
    ctx.fillText(`${combo} HIT`, w / 2 - 11, 22);
    ctx.shadowBlur = 0;
    ctx.font = "700 9px 'Space Mono', monospace";
    ctx.fillStyle = "#fff7c7";
    ctx.fillText(`x${multiplier.toFixed(2)}`, w - 18, 23);
    ctx.restore();
  },

  getPaddlelessComboCount() {
    return this.balls.reduce((best, ball) => Math.max(best, ball.paddlelessHits || 0), 0);
  },

  registerHit(ball, block) {
    this.combo += 1;
    if (ball) ball.paddlelessHits = Math.min(99, (ball.paddlelessHits || 0) + 1);
    AudioSystem.playBlockHit(this.combo, ball ? ball.paddlelessHits : 0);
    Effects.shakeScreen(0.8, 0.05);
    return ball ? ball.paddlelessHits : 0;
  },

  getBlockDamageAmount(block, amount, source = "hit", options = {}) {
    let damage = Math.max(0, Number(amount) || 0);
    if (block && block.effect === "armor") {
      if (!this.isArmorTopHit(source, options)) damage *= 0.3;
    }
    return damage;
  },

  isArmorTopHit(source = "hit", options = {}) {
    return source === "ball" && options.collision && options.collision.normalY < 0;
  },

  damageBlock(block, amount, sourceBall, source = "hit", depth = 0, options = {}) {
    if (!this.blocks.includes(block) || block.hp <= 0) return false;
    if (block.effect === "armor" && !this.isArmorTopHit(source, options)) {
      block.armorFlashTimer = 0.1;
      if (Effects.showArmorDeflect) Effects.showArmorDeflect(block.cx, block.cy);
    }
    const appliedDamage = this.getBlockDamageAmount(block, amount, source, options);
    const displayedDamage = Math.max(0, appliedDamage);
    if (displayedDamage > 0) {
      Effects.showDamageNumber(
        block.cx,
        Math.max(14, block.y + block.height * 0.18),
        displayedDamage,
        this.getDamageNumberColor(sourceBall, source),
        source
      );
    }
    const destroyed = block.takeDamage(appliedDamage);
    if (destroyed) {
      this.destroyBlock(block, sourceBall, source, depth);
      return true;
    }
    return false;
  },

  getDamageNumberColor(sourceBall, source) {
    if (sourceBall && sourceBall.getPrimaryColor) return sourceBall.getPrimaryColor();
    const colors = {
      poison: "#7cf5b2",
      splash: "#ffe66b",
      chain: "#ffe66b",
      sniper: "#ff5f88",
      shatter: "#ff5f88",
      lightning: "#67d8ff",
      detonator: "#ffb15c",
      projectile: "#f6fbff",
      area: "#ffe66b",
      line: "#ffb15c",
      double: "#ffe66b",
      burst: "#ffe66b",
      column: "#ff5f88",
      row: "#67d8ff",
      tokens: "#7cf5b2",
      blockChain: "#c69aff",
      aqua: "#3ad5d5"
    };
    return colors[source] || "#f6fbff";
  },

  destroyBlock(block, sourceBall, source, depth = 0) {
    const index = this.blocks.indexOf(block);
    if (index < 0) return;
    this.blocks.splice(index, 1);
    this.triggerDiveBlocksAbove(block);
    const color = block.colorSet ? block.colorSet.body : (block.isSpecial ? "#ffcc4a" : "#4a9eff");
    Effects.spawnBlockBreak(block.cx, block.cy, color, {
      special: block.isSpecial,
      combo: this.combo,
      effect: block.effect,
      source
    });
    AudioSystem.playBlockBreak(block.isSpecial, this.combo, block.effect);
    if (block.isSpecial) Effects.shakeScreen(3, 0.2);
    const lastHit = sourceBall ? getSkillLevel(sourceBall, "lastHit") : 0;
    const lastHitBonus = lastHit > 0
      ? skillParam("lastHit", lastHit, "fixedBonus", 0) + Math.floor(block.maxHp / skillParam("lastHit", lastHit, "hpDivisor", 10))
      : 0;
    const tokenAmount = block.getTokenDropAmount(sourceBall, lastHitBonus);
    this.addTokens(tokenAmount);
    if (!this.isMinimalModeEnabled()) {
      TokenManager.spawn(block.cx, block.cy, tokenAmount, this);
      Effects.spawnTokenCollect(block.cx, block.cy, Math.min(5, Math.max(1, Math.ceil(tokenAmount / 10))));
    }

    const vampire = sourceBall ? getSkillLevel(sourceBall, "vampire") : 0;
    if (vampire > 0) {
      const recovery = Math.max(1, Math.floor(block.maxHp * skillParam("vampire", vampire, "percent", 0)));
      this.healPaddle(recovery, this.paddle.x + this.paddle.getWidth() / 2, this.paddle.y);
    }

    const scoreMultiplier = source === "ball" ? this.getPaddlelessScoreMultiplier(sourceBall) : 1;
    const points = this.getBlockScore(block, sourceBall, source);
    this.addScore(points, block.cx, block.cy, scoreMultiplier);
    this.triggerBlockEffect(block, sourceBall, source, depth);
    if (sourceBall) this.triggerDestroySkills(block, sourceBall, depth);
    this.recordBlockDestroyed();
  },

  triggerDiveBlocksAbove(destroyedBlock) {
    if (!destroyedBlock) return;
    const destroyedRows = this.getBlockOccupiedRows(destroyedBlock);
    const destroyedCols = this.getBlockOccupiedCols(destroyedBlock);
    const rowPitch = this.getBlockRowPitch();
    for (const block of this.blocks) {
      if (block.effect !== "dive") continue;
      const rows = this.getBlockOccupiedRows(block);
      const cols = this.getBlockOccupiedCols(block);
      const overlapsColumn = cols.start <= destroyedCols.end && cols.end >= destroyedCols.start;
      if (!overlapsColumn) continue;
      if (rows.end !== destroyedRows.start - 1) continue;
      if (block.startDive(Infinity, rowPitch)) {
        Effects.spawnImpactSpark(block.cx, block.cy, "#f6fbff");
      }
    }
  },

  recordBlockDestroyed() {
    this.totalBlocksDestroyed += 1;
    this.blocksTowardSkill += 1;
    if (this.blocksTowardSkill >= this.blocksPerSkill && currentState === STATE.PLAYING && !this.rewardPending) {
      this.triggerSkillReward();
    }
  },

  triggerSkillReward() {
    this.rewardPending = true;
    this.blocksTowardSkill = 0;
    this.skillSelections += 1;
    Effects.showRewardReady();
    AudioSystem.playRewardReady();
    this.updateHud();
    setState(STATE.REWARD_READY);
    this.phaseTimeout = setTimeout(() => {
      setState(STATE.SKILL_SELECT);
      UI.showSkillSelect(this.balls, (choice, target) => this.handleSkillChoice(choice, target));
    }, 650);
  },

  triggerBlockEffect(block, sourceBall, source, depth = 0) {
    if (!block || !block.effect || depth > 2) return;
    const color = block.colorSet ? block.colorSet.accent : "#f6fbff";
    const damage = Math.max(4, Math.ceil(block.maxHp * 0.42));

    if (block.effect === "burst") {
      this.addZone({
        kind: "blockBurst",
        x: block.cx,
        y: block.cy,
        radius: 54,
        life: 0.22,
        maxLife: 0.22,
        color,
        sourceBall
      });
      Effects.shakeScreen(1.7, 0.1);
      this.applyAreaDamage(block.cx, block.cy, 54, damage, sourceBall, block, "burst", depth + 1);
      return;
    }

    if (block.effect === "column") {
      this.addZone({
        kind: "column",
        x: block.cx,
        y: 0,
        width: Math.max(18, block.width * 0.78),
        height: this.height,
        life: 0.24,
        maxLife: 0.24,
        color,
        sourceBall
      });
      this.applyColumnDamage(block.cx, block.width * 0.92, damage, sourceBall, "column", depth + 1);
      return;
    }

    if (block.effect === "row") {
      this.addZone({
        kind: "blast",
        x: 0,
        y: block.cy,
        width: this.width,
        height: Math.max(14, block.height * 0.85),
        life: 0.24,
        maxLife: 0.24,
        color,
        sourceBall,
        spent: true
      });
      this.applyLineDamage(block.cy, block.height * 1.05, damage, sourceBall, "row", depth + 1);
      return;
    }

    if (block.effect === "tokens") {
      if (!this.isMinimalModeEnabled()) Effects.spawnTokenCollect(block.cx, block.cy, 3);
      return;
    }

    if (block.effect === "healBurst") {
      this.addZone({
        kind: "healBurst",
        x: block.cx,
        y: block.cy,
        radius: 100,
        life: 0.4,
        maxLife: 0.4,
        color: "#7cf5b2",
        sourceBall
      });
      for (const target of this.blocks) {
        if (distance(block.cx, block.cy, target.cx, target.cy) > 100) continue;
        const healed = target.heal(target.maxHp * 0.3);
        if (healed > 0 && Effects.spawnBlockRegen) Effects.spawnBlockRegen(target.cx, target.cy);
      }
      return;
    }

    if (block.effect === "chain") {
      const targets = this.getNearestBlocks(block.cx, block.cy, 3)
        .filter((target) => distance(block.cx, block.cy, target.cx, target.cy) < 135);
      for (const target of targets) this.damageBlock(target, damage, sourceBall, "blockChain", depth + 1);
      return;
    }

    if (block.effect === "aqua") {
      const targets = this.getNearestBlocks(block.cx, block.cy, 2)
        .filter((target) => distance(block.cx, block.cy, target.cx, target.cy) < 120);
      for (const target of targets) this.damageBlock(target, Math.ceil(damage * 0.8), sourceBall, "aqua", depth + 1);
    }
  },

  getBlockScore(block, sourceBall, source = "hit") {
    const comboMultiplier = Math.min(5, Math.floor(this.combo / 10) + 1);
    const paddlelessMultiplier = source === "ball" ? this.getPaddlelessScoreMultiplier(sourceBall) : 1;
    let points = block.maxHp * this.difficultyLevel * comboMultiplier;
    points *= paddlelessMultiplier;
    const scoreBoost = sourceBall ? getSkillLevel(sourceBall, "scoreBoost") : 0;
    if (scoreBoost > 0) points *= skillParam("scoreBoost", scoreBoost, "multiplier", 1);
    return points;
  },

  getPaddlelessScoreMultiplier(sourceBall) {
    const streak = sourceBall ? Math.max(0, sourceBall.paddlelessHits || 0) : 0;
    if (streak <= 1) return 1;
    return 1 + Math.min(1.5, (streak - 1) * 0.08);
  },

  triggerDestroySkills(block, ball, depth = 0) {
    if (depth > 2) return;
    const cycleSplash = ball.cycleEffect === "splash" ? 1 : 0;
    const splash = Math.max(getSkillLevel(ball, "splash"), cycleSplash);
    if (splash > 0) {
      const cycle = getSkillLevel(ball, "cycle");
      const damage = cycleSplash
        ? (target) => skillDamageByMaxHp(target, "cycle", cycle, "splashDamage")
        : (target) => skillDamageByMaxHp(target, "splash", splash);
      this.applyAreaDamage(block.cx, block.cy, skillParam("splash", splash, "radius", 30), damage, ball, block, "splash", depth + 1);
    }

    const chain = getSkillLevel(ball, "chain");
    if (chain > 0) {
      let origin = block;
      const visited = new Set([block.id]);
      for (let i = 0; i < skillParam("chain", chain, "count", chain); i += 1) {
        const target = this.findNearestBlock(origin.cx, origin.cy, visited);
        if (!target) break;
        visited.add(target.id);
        this.damageBlock(target, skillDamageByMaxHp(target, "chain", chain), ball, "chain", depth + 1);
        origin = target;
      }
    }

    const sniper = getSkillLevel(ball, "sniper");
    if (sniper > 0) {
      const sameColumn = [...this.blocks]
        .filter((target) => Math.abs(target.cx - block.cx) < block.width * 0.65)
        .sort((a, b) => b.cy - a.cy);
      const columnTargets = sniper <= 2
        ? sameColumn.filter((target) => target.cy < block.cy).slice(0, skillParam("sniper", sniper, "limit", 3))
        : sameColumn;
      const targets = new Set(columnTargets);
      if (skillParam("sniper", sniper, "cross", false)) {
        for (const target of this.blocks) {
          if (Math.abs(target.cy - block.cy) < block.height * 1.2) targets.add(target);
        }
      }
      for (const target of targets) this.damageBlock(target, skillDamageByMaxHp(target, "sniper", sniper), ball, "sniper", depth + 1);
    }

    const crossfire = getSkillLevel(ball, "crossfire");
    if (crossfire > 0) {
      const count = skillParam("crossfire", crossfire, "countPerSide", 1);
      const pierce = skillParam("crossfire", crossfire, "pierce", 2);
      const damage = (target) => skillDamageByMaxHp(target, "crossfire", crossfire);
      for (let i = 0; i < count; i += 1) {
        const spread = count === 1 ? 0 : (i - 0.5) * 0.16;
        this.spawnProjectile(block.cx, block.cy, -1, spread, 7, damage, ball, SKILLS.crossfire.color, pierce, true);
        this.spawnProjectile(block.cx, block.cy, 1, spread, 7, damage, ball, SKILLS.crossfire.color, pierce, true);
      }
    }

    const fragment = getSkillLevel(ball, "fragment");
    if (fragment > 0) {
      const damage = (target) => skillDamageByMaxHp(target, "fragment", fragment);
      for (let i = 0; i < skillParam("fragment", fragment, "count", 3); i += 1) {
        const angle = rand(0, Math.PI * 2);
        this.spawnProjectile(block.cx, block.cy, Math.cos(angle), Math.sin(angle), 5.5, damage, ball, SKILLS.fragment.color, 0, true);
      }
    }

    const shatter = getSkillLevel(ball, "shatter");
    if (shatter > 0) {
      const radius = skillParam("shatter", shatter, "radius", 80);
      const threshold = skillParam("shatter", shatter, "threshold", 0.15);
      const damage = (target) => skillDamageByMaxHp(target, "shatter", shatter);
      const targets = this.blocks
        .filter((target) => target.hp / Math.max(1, target.maxHp) <= threshold)
        .filter((target) => distance(block.cx, block.cy, target.cx, target.cy) <= radius)
        .sort((a, b) => distance(block.cx, block.cy, a.cx, a.cy) - distance(block.cx, block.cy, b.cx, b.cy));
      for (const target of targets) this.damageBlock(target, damage, ball, "shatter", depth + 1);
    }

    const lightning = Math.max(getSkillLevel(ball, "lightning"), ball.cycleEffect === "lightning" ? 1 : 0);
    if (lightning > 0) {
      const cycleLightning = ball.cycleEffect === "lightning" ? 1 : 0;
      const cycle = getSkillLevel(ball, "cycle");
      const targets = this.getNearestBlocks(block.cx, block.cy, skillParam("lightning", lightning, "count", lightning)).filter((target) =>
        distance(block.cx, block.cy, target.cx, target.cy) < skillParam("lightning", lightning, "radius", 100)
      );
      for (const target of targets) {
        const damage = cycleLightning
          ? skillDamageByMaxHp(target, "cycle", cycle, "lightningDamage")
          : skillDamageByMaxHp(target, "lightning", lightning);
        this.damageBlock(target, damage, ball, "lightning", depth + 1);
      }
    }

    const afterburn = getSkillLevel(ball, "afterburn");
    if (afterburn > 0) {
      this.addZone({
        kind: "afterburn",
        x: block.cx,
        y: block.cy,
        radius: skillParam("afterburn", afterburn, "radius", 25),
        life: skillParam("afterburn", afterburn, "duration", 3),
        maxLife: skillParam("afterburn", afterburn, "duration", 3),
        damage: (target) => skillDamageByMaxHp(target, "afterburn", afterburn),
        tick: 0.5,
        tickTimer: 0,
        color: SKILLS.afterburn.color,
        sourceBall: ball
      });
    }

    const blast = getSkillLevel(ball, "blast");
    if (blast > 0) {
      const height = skillParam("blast", blast, "height", 6);
      const damage = (target) => skillDamageByMaxHp(target, "blast", blast);
      this.addZone({
        kind: "blast",
        x: 0,
        y: block.cy,
        width: this.width,
        height,
        life: 0.3,
        maxLife: 0.3,
        damage,
        color: SKILLS.blast.color,
        sourceBall: ball,
        spent: false
      });
      this.applyLineDamage(block.cy, height, damage, ball, "blast", depth + 1);
    }
  },

  applyAreaDamage(x, y, radius, damage, sourceBall, excludedBlock, source = "area", depth = 0) {
    let hitCount = 0;
    for (const block of [...this.blocks]) {
      if (excludedBlock && block.id === excludedBlock.id) continue;
      const reach = radius + Math.max(block.width, block.height) * 0.5;
      if (distance(x, y, block.cx, block.cy) <= reach) {
        const amount = typeof damage === "function" ? damage(block) : damage;
        const hpBefore = block.hp;
        const destroyed = this.damageBlock(block, amount, sourceBall, source, depth);
        if (destroyed || block.hp < hpBefore) hitCount += 1;
      }
    }
    return hitCount;
  },

  applyLineDamage(y, height, damage, sourceBall, source = "line", depth = 0) {
    for (const block of [...this.blocks]) {
      if (Math.abs(block.cy - y) <= height / 2 + block.height / 2) {
        const amount = typeof damage === "function" ? damage(block) : damage;
        this.damageBlock(block, amount, sourceBall, source, depth);
      }
    }
  },

  applyColumnDamage(x, width, damage, sourceBall, source = "column", depth = 0) {
    for (const block of [...this.blocks]) {
      if (Math.abs(block.cx - x) <= width / 2 + block.width / 2) {
        const amount = typeof damage === "function" ? damage(block) : damage;
        this.damageBlock(block, amount, sourceBall, source, depth);
      }
    }
  },

  spawnProjectile(x, y, targetX, targetY, speed, damage, sourceBall, color, pierce = 0, isDirection = false, options = {}) {
    let dx;
    let dy;
    if (isDirection) {
      dx = targetX;
      dy = targetY;
    } else {
      dx = targetX - x;
      dy = targetY - y;
    }
    const length = Math.hypot(dx, dy) || 1;
    const life = Number.isFinite(options.life) ? Math.max(0.05, options.life) : 3;
    this.projectiles.push({
      x,
      y,
      vx: (dx / length) * speed,
      vy: (dy / length) * speed,
      radius: Math.max(1, options.radius || 3),
      damage,
      damageLeft: 0,
      sourceBall,
      color,
      coreColor: options.coreColor || color,
      alpha: Number.isFinite(options.alpha) ? options.alpha : 0.85,
      kind: options.kind || "projectile",
      pierce,
      life,
      maxLife: life,
      maxHits: Number.isFinite(options.maxHits) ? Math.max(1, Math.floor(options.maxHits)) : Infinity,
      hits: 0,
      bounceWalls: Boolean(options.bounceWalls),
      bounceBlocks: Boolean(options.bounceBlocks),
      hitSource: options.hitSource || "projectile",
      hitIds: new Set()
    });
  },

  updateProjectiles(dt) {
    const frame = dt * 60;
    for (const projectile of [...this.projectiles]) {
      projectile.life -= dt;
      const prevX = projectile.x;
      const prevY = projectile.y;
      projectile.x += projectile.vx * frame;
      projectile.y += projectile.vy * frame;
      if (projectile.bounceWalls) this.resolveProjectileWallBounce(projectile);
      const escaped = projectile.bounceWalls
        ? projectile.y - projectile.radius > this.height + 20
        : projectile.x < -20 || projectile.x > this.width + 20 || projectile.y < -20 || projectile.y > this.height + 20;
      if (projectile.life <= 0 || escaped) {
        this.removeProjectile(projectile);
        continue;
      }
      for (const block of [...this.blocks]) {
        if (projectile.hitIds.has(block.id)) continue;
        const collision = projectile.bounceBlocks
          ? getCircleRectCollision(prevX, prevY, projectile.x, projectile.y, projectile.radius, block.collisionRect)
          : (circleRectHit(projectile.x, projectile.y, projectile.radius, block.collisionRect) ? { normalX: 0, normalY: 0 } : null);
        if (!collision) continue;
        projectile.hitIds.add(block.id);
        const damage = projectile.damageLeft > 0
          ? projectile.damageLeft
          : (typeof projectile.damage === "function" ? projectile.damage(block) : projectile.damage);
        const hpBefore = Math.max(0, block.hp);
        const hitSource = projectile.hitSource || "projectile";
        const damageOptions = { collision };
        const appliedDamage = this.getBlockDamageAmount(block, damage, hitSource, damageOptions);
        const destroyed = this.damageBlock(block, damage, projectile.sourceBall, hitSource, 1, damageOptions);
        const overflowDamage = destroyed ? Math.max(0, appliedDamage - hpBefore) : 0;
        Effects.spawnImpactSpark(projectile.x, projectile.y, projectile.color);
        AudioSystem.playBlockHit(this.combo);
        projectile.hits += 1;
        if (projectile.bounceBlocks) {
          if (projectile.hits >= projectile.maxHits) {
            this.removeProjectile(projectile);
          } else {
            this.reflectProjectileFromBlock(projectile, block, collision);
            projectile.damageLeft = 0;
          }
        } else if (projectile.pierce > 0 && overflowDamage > 0) {
          projectile.pierce -= 1;
          projectile.damageLeft = overflowDamage;
        } else {
          this.removeProjectile(projectile);
        }
        break;
      }
    }
  },

  resolveProjectileWallBounce(projectile) {
    const radius = projectile.radius || 1;
    if (projectile.x - radius <= 0) {
      projectile.x = radius;
      projectile.vx = Math.abs(projectile.vx || 1);
    } else if (projectile.x + radius >= this.width) {
      projectile.x = this.width - radius;
      projectile.vx = -Math.abs(projectile.vx || 1);
    }
    if (projectile.y - radius <= 0) {
      projectile.y = radius;
      projectile.vy = Math.abs(projectile.vy || 1);
    }
  },

  reflectProjectileFromBlock(projectile, block, collision = null) {
    let normalX = collision ? collision.normalX : 0;
    let normalY = collision ? collision.normalY : 0;
    if (!normalX && !normalY) {
      const dx = projectile.x - block.cx;
      const dy = projectile.y - block.cy;
      const nx = Math.abs(dx / Math.max(1, block.width / 2));
      const ny = Math.abs(dy / Math.max(1, block.height / 2));
      if (nx > ny) normalX = dx < 0 ? -1 : 1;
      else normalY = dy < 0 ? -1 : 1;
    }

    const radius = projectile.radius || 1;
    const hasContact = collision &&
      Number.isFinite(collision.contactX) &&
      Number.isFinite(collision.contactY);
    if (hasContact) {
      const skin = 0.6;
      projectile.x = collision.contactX + normalX * skin;
      projectile.y = collision.contactY + normalY * skin;
    } else {
      const rect = block.collisionRect;
      if (normalX < 0) projectile.x = rect.x - radius - 0.5;
      else if (normalX > 0) projectile.x = rect.x + rect.width + radius + 0.5;
      if (normalY < 0) projectile.y = rect.y - radius - 0.5;
      else if (normalY > 0) projectile.y = rect.y + rect.height + radius + 0.5;
    }

    const speed = Math.hypot(projectile.vx, projectile.vy) || 1;
    const dot = projectile.vx * normalX + projectile.vy * normalY;
    if (dot < 0) {
      projectile.vx -= 2 * dot * normalX;
      projectile.vy -= 2 * dot * normalY;
    } else if (normalX !== 0) {
      projectile.vx = normalX < 0 ? -Math.abs(projectile.vx || 1) : Math.abs(projectile.vx || 1);
    } else {
      projectile.vy = normalY < 0 ? -Math.abs(projectile.vy || 1) : Math.abs(projectile.vy || 1);
    }
    const nextSpeed = Math.hypot(projectile.vx, projectile.vy) || 1;
    projectile.vx = (projectile.vx / nextSpeed) * speed;
    projectile.vy = (projectile.vy / nextSpeed) * speed;
  },

  drawProjectiles(ctx) {
    for (const projectile of this.projectiles) {
      ctx.save();
      if (projectile.kind === "mirror") {
        this.drawMirrorProjectile(ctx, projectile);
      } else {
        ctx.strokeStyle = projectile.color;
        ctx.fillStyle = projectile.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = projectile.alpha;
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  },

  drawMirrorProjectile(ctx, projectile) {
    const radius = projectile.radius;
    const lifeRatio = clamp(projectile.life / Math.max(0.01, projectile.maxLife || projectile.life || 1), 0, 1);
    const alpha = clamp(projectile.alpha || 0.32, 0.08, 0.5) * (0.28 + lifeRatio * 0.72);
    const mirrorColor = projectile.color || "#aa66ff";
    const coreColor = projectile.coreColor || mirrorColor;

    ctx.globalCompositeOperation = "lighter";

    const gradient = ctx.createRadialGradient(projectile.x, projectile.y, 0, projectile.x, projectile.y, radius * 1.2);
    gradient.addColorStop(0, coreColor);
    gradient.addColorStop(0.58, mirrorColor);
    gradient.addColorStop(1, "rgba(255,255,255,0)");

    ctx.globalAlpha = alpha * 0.55;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, radius * 1.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = alpha * 0.95;
    ctx.strokeStyle = mirrorColor;
    ctx.lineWidth = 1.35;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = alpha * 0.65;
    ctx.strokeStyle = "rgba(246,251,255,0.92)";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, radius * 0.52, -0.75, Math.PI * 0.75);
    ctx.stroke();
  },

  removeProjectile(projectile) {
    const index = this.projectiles.indexOf(projectile);
    if (index >= 0) this.projectiles.splice(index, 1);
  },

  addZone(zone) {
    this.zones.push(zone);
  },

  updateZones(dt) {
    for (const zone of [...this.zones]) {
      zone.life -= dt;
      if (zone.kind === "afterburn" || zone.kind === "echo") {
        if (zone.kind === "echo") zone.visibleTimer = Math.max(0, (zone.visibleTimer || 0) - dt);
        zone.tickTimer -= dt;
        if (zone.tickTimer <= 0) {
          zone.tickTimer = zone.tick;
          const hitCount = this.applyAreaDamage(zone.x, zone.y, zone.radius, zone.damage, zone.sourceBall, null, zone.kind, 1);
          if (zone.kind === "echo") zone.visibleTimer = hitCount > 0 ? zone.tick + 0.04 : 0;
        }
      }
      if (zone.kind === "afterburn") {
        for (const ball of this.balls) {
          if (ball.alive && distance(ball.x, ball.y, zone.x, zone.y) < zone.radius + ball.radius) {
            ball.damageBoostTimer = 1.2;
            ball.damageBoostMultiplier = skillParam("afterburn", getSkillLevel(zone.sourceBall, "afterburn"), "projectileBuff", 1);
          }
        }
      }
      if (zone.life <= 0) this.removeZone(zone);
    }
  },

  drawZones(ctx) {
    for (const zone of this.zones) {
      const alpha = clamp(zone.life / zone.maxLife, 0, 1);
      ctx.save();
      if (zone.kind === "echo") {
        if ((zone.visibleTimer || 0) <= 0) {
          ctx.restore();
          continue;
        }
        this.drawEchoHitZone(ctx, zone, alpha);
      } else if (zone.kind === "auraPulse") {
        this.drawAuraPulseZone(ctx, zone, alpha);
      } else {
        ctx.globalAlpha = alpha * 0.35;
        ctx.fillStyle = zone.color;
        ctx.strokeStyle = zone.color;
        if (zone.kind === "blast") {
          ctx.fillRect(0, zone.y - zone.height / 2, zone.width, zone.height);
        } else if (zone.kind === "column") {
          ctx.fillRect(zone.x - zone.width / 2, 0, zone.width, zone.height);
        } else if (zone.kind === "healBurst") {
          const progress = 1 - alpha;
          ctx.globalAlpha = alpha * 0.85;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(zone.x, zone.y, zone.radius * progress, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }
  },

  drawEchoHitZone(ctx, zone, alpha) {
    const visibleAlpha = clamp((zone.visibleTimer || 0) / Math.max(0.01, (zone.tick || 0.2) + 0.04), 0, 1);
    const fade = Math.pow(alpha * visibleAlpha, 1.2);
    const progress = 1 - visibleAlpha;
    const ringRadius = zone.radius * (0.62 + progress * 0.28);
    const edgeColor = "#9ffbf2";
    const coreColor = "#ffffff";

    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = zone.color;
    ctx.globalAlpha = fade * 0.055;
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = edgeColor;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = fade * 0.34;
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = coreColor;
    ctx.lineWidth = 0.9;
    ctx.globalAlpha = fade * 0.22;
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, ringRadius * 0.68, 0, Math.PI * 2);
    ctx.stroke();
  },

  drawAuraPulseZone(ctx, zone, alpha) {
    const fade = Math.pow(alpha, 1.35);
    const progress = 1 - alpha;
    const intensity = clamp(0.75 + (zone.hitCount || 1) * 0.08, 0.75, 1.15);
    const pulseRadius = zone.radius * (0.58 + progress * 0.36);
    const edgeColor = "#9ffbf2";
    const coreColor = "#ffffff";

    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = zone.color;
    ctx.globalAlpha = fade * 0.035 * intensity;
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = edgeColor;
    ctx.lineWidth = 1.8;
    ctx.globalAlpha = fade * 0.34 * intensity;
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, pulseRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = coreColor;
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = fade * 0.22 * intensity;
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, pulseRadius * 0.72, -0.35, Math.PI * 0.85);
    ctx.stroke();
  },

  removeZone(zone) {
    const index = this.zones.indexOf(zone);
    if (index >= 0) this.zones.splice(index, 1);
  },

  findNearestBlock(x, y, excluded = new Set()) {
    let best = null;
    let bestDistance = Infinity;
    for (const block of this.blocks) {
      if (excluded.has(block.id)) continue;
      const d = distance(x, y, block.cx, block.cy);
      if (d < bestDistance) {
        best = block;
        bestDistance = d;
      }
    }
    return best;
  },

  getNearestBlocks(x, y, count) {
    return [...this.blocks]
      .sort((a, b) => distance(x, y, a.cx, a.cy) - distance(x, y, b.cx, b.cy))
      .slice(0, count);
  },

  findHighestHpBlock() {
    return this.blocks.reduce((best, block) => (!best || block.hp > best.hp ? block : best), null);
  },

  getTeleporterMaxY() {
    const paddleLimit = this.paddle ? this.paddle.y - 150 : this.height - 190;
    const stageLimit = this.height * 0.58;
    return clamp(Math.min(stageLimit, paddleLimit), 96, Math.max(96, this.height - 150));
  },

  findDenseBlockAnchor(maxY = Infinity) {
    const candidates = this.blocks.filter((block) => block.y <= maxY);
    if (candidates.length === 0) return null;
    let best = candidates[0];
    let bestScore = -1;
    for (const block of candidates) {
      const nearby = this.blocks.filter((other) => distance(block.cx, block.cy, other.cx, other.cy) < 90).length;
      if (nearby > bestScore) {
        best = block;
        bestScore = nearby;
      }
    }
    return { x: best.cx, y: best.y };
  },

  addScore(points, x = null, y = null, multiplier = 1) {
    const gained = Math.max(0, Math.floor(points));
    this.score += gained;
    if (gained > 0) this.showScoreGain(gained, multiplier);
    const hud = this.hudNodes?.score || document.getElementById("hud-score");
    if (hud) {
      hud.textContent = formatNumber(this.score);
      if (!this.isMinimalModeEnabled()) {
        hud.classList.remove("token-bump");
        void hud.offsetWidth;
        hud.classList.add("token-bump");
        const stat = hud.closest(".score-stat");
        if (stat) {
          stat.classList.remove("score-pop");
          void stat.offsetWidth;
          stat.classList.add("score-pop");
        }
      }
    }
  },

  getScoreGainNode() {
    const root = this.hudNodes?.scoreBlock || document.getElementById("hud-score-block");
    if (!root) return null;
    let node = this.hudNodes?.scoreGain || document.getElementById("score-gain-text");
    if (!node) {
      node = document.createElement("span");
      node.id = "score-gain-text";
      node.setAttribute("aria-hidden", "true");
      root.appendChild(node);
      if (this.hudNodes) this.hudNodes.scoreGain = node;
    }
    return node;
  },

  showScoreGain(amount, multiplier = 1) {
    if (this.isMinimalModeEnabled()) return;
    this.scoreGainAmount += Math.max(0, Math.floor(amount));
    this.scoreGainBoosted = this.scoreGainBoosted || (multiplier || 1) > 1.001;
    const node = this.getScoreGainNode();
    if (!node) return;
    node.textContent = `+${formatNumber(this.scoreGainAmount)}`;
    node.classList.toggle("boosted", this.scoreGainBoosted);
    node.classList.remove("active");
    void node.offsetWidth;
    node.classList.add("active");
    clearTimeout(this.scoreGainTimeout);
    this.scoreGainTimeout = setTimeout(() => {
      this.scoreGainAmount = 0;
      this.scoreGainBoosted = false;
      const currentNode = this.hudNodes?.scoreGain || document.getElementById("score-gain-text");
      if (currentNode) currentNode.classList.remove("active", "boosted");
    }, 720);
  },

  addTokens(amount) {
    const gained = Math.max(0, Math.floor(amount));
    this.tokens += gained;
    const hpToken = this.hudNodes?.hpToken || document.getElementById("hp-token-count");
    if (hpToken) hpToken.textContent = formatNumber(this.tokens);
    if (!this.isMinimalModeEnabled()) {
      const hpTokenDisplay = this.hudNodes?.hpTokenDisplay || document.getElementById("hp-token-display");
      if (hpTokenDisplay) {
        hpTokenDisplay.classList.remove("pulse");
        void hpTokenDisplay.offsetWidth;
        hpTokenDisplay.classList.add("pulse");
      }
      this.showTokenGain(gained);
    }
  },

  showTokenGain(amount) {
    if (this.isMinimalModeEnabled()) return;
    if (amount <= 0) return;
    this.tokenGainAmount += amount;
    const node = this.hudNodes?.tokenGain || document.getElementById("token-gain-text");
    if (!node) return;
    node.textContent = `+${formatNumber(this.tokenGainAmount)} トークン`;
    node.classList.remove("active");
    void node.offsetWidth;
    node.classList.add("active");
    clearTimeout(this.tokenGainTimeout);
    this.tokenGainTimeout = setTimeout(() => {
      this.tokenGainAmount = 0;
      const currentNode = this.hudNodes?.tokenGain || document.getElementById("token-gain-text");
      if (currentNode) currentNode.classList.remove("active");
    }, 720);
  },

  buyUpgrade(ballIndex, key) {
    const ball = this.balls[ballIndex];
    const definition = UPGRADE_DEFS[key];
    if (!ball || !definition) return false;
    const level = ball.upgrades[key];
    if (level >= definition.max) return false;
    const cost = getUpgradeCost(level, key);
    if (this.tokens < cost) return false;
    this.tokens -= cost;
    ball.upgrades[key] += 1;
    this.updateHud();
    UI.renderSlots(this.balls, this.paddle);
    return true;
  },

  carveBall(index) {
    const ball = this.balls[index];
    if (!ball || !ball.carveSkills()) return false;
    UI.showToast(`ボール${index + 1}に刻印しました`);
    UI.renderSlots(this.balls, this.paddle);
    return true;
  },

  addBall() {
    if (this.balls.length >= BALL_MAX) return false;
    const index = this.balls.length;
    const ball = new Ball(this.paddle.x + this.paddle.getWidth() / 2, this.paddle.y - 12, BALL_COLORS[index]);
    this.balls.push(ball);
    ball.readyOnPaddle(this);
    this.positionWaitingLaunchBalls();
    this.syncBumperFromBalls(true);
    Effects.showBallRevive(ball.x, ball.y, ball.color);
    UI.renderSlots(this.balls, this.paddle);
    return true;
  },

  buyNextBallWithTokens() {
    const nextBallNumber = this.balls.length + 1;
    const cost = getBallPurchaseCost(nextBallNumber);
    if (!Number.isFinite(cost) || this.balls.length >= BALL_MAX) {
      UI.showToast("ボール枠がいっぱいです");
      return false;
    }
    if (this.tokens < cost) {
      UI.showToast(`トークンが${formatNumber(cost)}必要です`);
      return false;
    }
    this.tokens -= cost;
    if (!this.addBall()) {
      this.tokens += cost;
      return false;
    }
    AudioSystem.playToken();
    this.updateHud();
    UI.updateSkillRerollStatus();
    if (currentState === STATE.UPGRADE) {
      this.showUpgradeScreen();
      if (UI.flashUpgradeList) UI.flashUpgradeList("upgrade-success");
    }
    return true;
  },

  buyBumperLevelWithTokens() {
    if (!this.bumper) this.bumper = new Bumper();
    if (this.bumper.unlocked) {
      UI.showToast("バンパーは解放済みです");
      return false;
    }
    const cost = BUMPER_UNLOCK_COST;
    if (this.tokens < cost) {
      UI.showToast(`トークンが${formatNumber(cost)}必要です`);
      return false;
    }
    this.tokens -= cost;
    this.bumper.unlocked = true;
    this.syncBumperFromBalls(true);
    AudioSystem.playToken();
    this.updateHud();
    UI.updateSkillRerollStatus();
    UI.renderSlots(this.balls, this.paddle);
    if (currentState === STATE.UPGRADE) {
      this.showUpgradeScreen();
      if (UI.flashUpgradeList) UI.flashUpgradeList("upgrade-success");
    }
    return true;
  },

  showUpgradeScreen() {
    UI.showUpgrade(
      this.balls,
      this.tokens,
      (ballIndex, key) => this.buyUpgrade(ballIndex, key),
      () => {
        setState(STATE.PLAYING);
        this.resumePlayAfterReward();
      }
    );
  },

  handleSkillChoice(choice, target) {
    if (choice.type === "addBall") {
      if (!this.addBall()) {
        UI.showToast("ボール枠がいっぱいです");
        return;
      }
    } else if (!addOrLevelSkill(target, choice.id)) {
      UI.showToast("このスキルはこれ以上装備できません");
      return;
    }
    if (target && target.isBumper && target.syncStats) target.syncStats();
    this.rewardPending = false;
    this.updateHud();
    UI.renderSlots(this.balls, this.paddle);
    setState(STATE.UPGRADE);
    this.showUpgradeScreen();
  },

  getRunSkillSnapshot() {
    const readSkills = (entity) => {
      if (!entity || !Array.isArray(entity.skills)) return [];
      return entity.skills.map((skill) => ({
        id: skill.id || "",
        name: skill.name || skill.id || "スキル",
        level: Number(skill.level || 1)
      }));
    };
    return {
      balls: this.balls.map((ball, index) => ({
        label: `ボール${index + 1}`,
        color: ball.color || "#ffffff",
        skills: readSkills(ball)
      })),
      paddle: {
        label: "パドル",
        skills: readSkills(this.paddle)
      },
      bumper: this.bumper && this.bumper.unlocked
        ? {
          label: "バンパー",
          skills: readSkills(this.bumper)
        }
        : null
    };
  },

  gameOver() {
    if (currentState !== STATE.PLAYING) return;
    Effects.shakeScreen(5, 0.3);
    AudioSystem.playGameOver();
    const highScore = Math.max(Number(localStorage.getItem("ricoBlast_highScore") || 0), this.score);
    const bestBlocks = Math.max(Number(localStorage.getItem("ricoBlast_bestBlocks") || 0), this.totalBlocksDestroyed);
    localStorage.setItem("ricoBlast_highScore", String(highScore));
    localStorage.setItem("ricoBlast_bestBlocks", String(bestBlocks));
    if (typeof AccountManager !== "undefined") {
      AccountManager.recordRun({
        score: this.score,
        blocksDestroyed: this.totalBlocksDestroyed,
        date: new Date().toISOString(),
        skills: this.getRunSkillSnapshot()
      });
    }
    setState(STATE.REWARD_READY);
    this.phaseTimeout = setTimeout(() => {
      UI.showGameOver(this.score, this.totalBlocksDestroyed, highScore, bestBlocks);
      setState(STATE.GAME_OVER);
    }, 500);
  },

  updateHud() {
    const nodes = this.hudNodes || {};
    const state = this.hudState || (this.hudState = {});
    const scoreNode = nodes.score || document.getElementById("hud-score");
    if (scoreNode) {
      const scoreText = formatNumber(this.score);
      if (state.score !== scoreText) {
        scoreNode.textContent = scoreText;
        state.score = scoreText;
      }
    }
    const skillProgress = nodes.skillProgress || document.getElementById("hud-skill-progress");
    if (skillProgress) {
      const goal = Math.max(1, Math.floor(this.blocksPerSkill || 1));
      const current = this.rewardPending ? goal : clamp(Math.floor(this.blocksTowardSkill || 0), 0, goal);
      const percent = clamp((current / goal) * 100, 0, 100);
      const fill = `${percent}%`;
      const ready = current >= goal || this.rewardPending;
      const label = `スキル ${current} / ${goal}`;
      if (state.skillFill !== fill) {
        skillProgress.style.setProperty("--skill-progress-fill", fill);
        state.skillFill = fill;
      }
      if (state.skillReady !== ready) {
        skillProgress.classList.toggle("ready", ready);
        state.skillReady = ready;
      }
      if (state.skillLabel !== label) {
        skillProgress.setAttribute("aria-label", label);
        state.skillLabel = label;
      }
    }
    const hpToken = nodes.hpToken || document.getElementById("hp-token-count");
    if (hpToken) {
      const tokenText = formatNumber(this.tokens);
      if (state.tokens !== tokenText) {
        hpToken.textContent = tokenText;
        state.tokens = tokenText;
      }
    }
    const pauseButton = nodes.pauseButton || document.getElementById("btn-pause");
    if (pauseButton) {
      const resuming = this.isResuming();
      const pauseText = resuming ? "準備中" : (this.paused ? "停止中" : "停止");
      const pauseDisabled = this.paused || resuming;
      if (state.pauseText !== pauseText) {
        pauseButton.textContent = "";
        pauseButton.setAttribute("aria-label", pauseText);
        pauseButton.title = pauseText;
        state.pauseText = pauseText;
      }
      if (state.pauseDisabled !== pauseDisabled) {
        pauseButton.disabled = pauseDisabled;
        pauseButton.classList.toggle("active", pauseDisabled);
        state.pauseDisabled = pauseDisabled;
      }
    }
    const timerNode = nodes.timer || document.getElementById("hud-timer");
    if (timerNode) {
      const totalSecs = Math.floor(this.playTime || 0);
      const minutes = Math.floor(totalSecs / 60);
      const secs = totalSecs % 60;
      const timerText = `${minutes}:${String(secs).padStart(2, "0")}`;
      if (state.timer !== timerText) {
        timerNode.textContent = timerText;
        state.timer = timerText;
      }
    }
    this.updateComboHud();
  },

  updateComboHud() {
    const nodes = this.hudNodes || {};
    const banner = nodes.comboBanner || document.getElementById("combo-banner");
    const countNode = nodes.comboCount || document.getElementById("combo-count");
    if (!banner || !countNode) return;
    const combo = Math.max(0, this.combo || 0);
    const visible = currentState === STATE.PLAYING && combo >= 2;
    banner.classList.toggle("active", visible);
    if (!visible) {
      this.comboHudValue = 0;
      return;
    }
    if (combo !== this.comboHudValue) {
      this.comboHudValue = combo;
      countNode.textContent = String(combo);
      if (!this.isMinimalModeEnabled()) {
        banner.classList.remove("combo-pop");
        void banner.offsetWidth;
        banner.classList.add("combo-pop");
      }
    }
  }
};
