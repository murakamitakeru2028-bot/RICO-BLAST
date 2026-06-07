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
  blocksPerSkill: 30,
  blocksTowardSkill: 0,
  totalBlocksDestroyed: 0,
  skillSelections: 0,
  rewardPending: false,
  tokenGainAmount: 0,
  tokenGainTimeout: null,
  lastReadyLaunchAt: 0,
  lastTime: 0,
  balls: [],
  blocks: [],
  paddle: new Paddle(),
  bumper: new Bumper(),
  projectiles: [],
  zones: [],
  inputReady: false,
  hudReady: false,
  paused: false,
  blockSpawnTimer: 0,
  blockRowsSpawned: 0,
  blockGridOffset: 0,
  phaseTimeout: null,
  resumeInvincibleTimer: 0,
  resumeInvincibleDuration: 2,
  awaitingStartClick: false,
  grantInvincibleOnStartClick: false,

  init() {
    clearTimeout(this.phaseTimeout);
    this.canvas = document.getElementById("game-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.difficultyLevel = 1;
    this.score = 0;
    this.tokens = 0;
    this.combo = 0;
    this.blocksTowardSkill = 0;
    this.totalBlocksDestroyed = 0;
    this.skillSelections = 0;
    this.rewardPending = false;
    this.tokenGainAmount = 0;
    this.lastReadyLaunchAt = 0;
    clearTimeout(this.tokenGainTimeout);
    this.tokenGainTimeout = null;
    const tokenGainNode = document.getElementById("token-gain-text");
    if (tokenGainNode) {
      tokenGainNode.textContent = "+0 TOKEN";
      tokenGainNode.classList.remove("active");
    }
    const hpTokenNode = document.getElementById("hp-token-count");
    if (hpTokenNode) hpTokenNode.textContent = "0";
    const hpTokenDisplay = document.getElementById("hp-token-display");
    if (hpTokenDisplay) hpTokenDisplay.classList.remove("pulse");
    this.lastTime = 0;
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

  setupCanvas() {
    if (!this.canvas) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = this.baseWidth;
    this.height = this.baseHeight;
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (this.paddle) {
      this.paddle.y = this.height - 28;
      this.paddle.targetX = clamp(this.paddle.targetX || this.width / 2, 0, this.width);
      this.paddle.x = clamp(this.paddle.x, 0, Math.max(0, this.width - this.paddle.getWidth()));
    }
    if (this.bumper) this.bumper.setPosition(this.width, this.height);
  },

  setupInput() {
    if (this.inputReady || !this.canvas) return;
    const gameScreen = document.getElementById("screen-game");
    const toGameX = (clientX) => {
      const rect = (gameScreen || this.canvas).getBoundingClientRect();
      return ((clientX - rect.left) / Math.max(1, rect.width)) * this.width;
    };
    const update = (clientX) => {
      if (!this.paddle || currentState !== STATE.PLAYING || this.paused) return;
      this.paddle.onTouch(clamp(toGameX(clientX), 0, this.width));
    };
    const bindInputZone = (zone, { launch = false, prevent = false } = {}) => {
      if (!zone) return;
      zone.addEventListener("pointerdown", (event) => {
        if (prevent) event.preventDefault();
        AudioSystem.unlock();
        update(event.clientX);
        if (launch) {
          this.releaseStartClickHold();
          this.launchNextReadyBall();
        }
      });
      zone.addEventListener("pointermove", (event) => {
        if (prevent) event.preventDefault();
        update(event.clientX);
      });
      zone.addEventListener("touchstart", (event) => {
        if (prevent) event.preventDefault();
        AudioSystem.unlock();
        if (event.touches[0]) update(event.touches[0].clientX);
        if (launch) {
          this.releaseStartClickHold();
          this.launchNextReadyBall();
        }
      }, { passive: !prevent });
      zone.addEventListener("touchmove", (event) => {
        if (prevent) event.preventDefault();
        if (event.touches[0]) update(event.touches[0].clientX);
      }, { passive: !prevent });
    };

    bindInputZone(this.canvas, { launch: true, prevent: true });
    bindInputZone(document.getElementById("paddle-hp"));
    bindInputZone(document.getElementById("slot-bar"));
    bindInputZone(document.getElementById("paddle-status"));
    this.inputReady = true;
  },

  setupHudControls() {
    if (this.hudReady) return;
    const pauseButton = document.getElementById("btn-pause");
    if (pauseButton) {
      pauseButton.addEventListener("click", () => this.togglePause());
    }
    this.hudReady = true;
  },

  togglePause() {
    if (currentState !== STATE.PLAYING) return;
    AudioSystem.unlock();
    const wasPaused = this.paused;
    this.paused = !this.paused;
    if (wasPaused && !this.paused) this.holdUntilStartClick({ grantInvincible: true });
    this.lastTime = 0;
    this.updateHud();
  },

  startRun() {
    clearTimeout(this.phaseTimeout);
    this.setupCanvas();
    this.combo = 0;
    this.lastTime = 0;
    this.paused = false;
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
      ball.color = ball.skills.length > 0 ? (BALL_COLORS[i] || "#ffffff") : "#ffffff";
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
    this.awaitingStartClick = false;
    this.grantInvincibleOnStartClick = false;
    this.rewardPending = false;
    this.projectiles = [];
    this.zones = [];
    this.difficultyLevel += 1;
    if (this.blocks.length === 0) this.createBlocks();
    else this.syncBlockGridPositions();
    this.paddle.setPosition(this.width, this.height);
    this.syncBumperFromBalls(false);
    this.bumper.reset(this.width, this.height);
    for (let i = 0; i < this.balls.length; i += 1) {
      const ball = this.balls[i];
      ball.color = ball.skills.length > 0 ? (BALL_COLORS[i] || "#ffffff") : "#ffffff";
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
    return clamp(this.balls.length - 1, 0, BALL_MAX - 1);
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
    for (let row = startRow; row < startRow + rows; row += 1) {
      this.spawnBlockRow(row, layout);
    }
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
      blockHeight: 22
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

  spawnBlockRow(rowIndex, layout = this.getBlockLayout()) {
    const hp = this.getBaseBlockHp(this.difficultyLevel);
    const speed = this.getBlockDescendSpeed();
    const y = this.getBlockY(rowIndex, layout);
    for (let col = 0; col < layout.cols; col += 1) {
      const x = layout.padding + col * (layout.blockWidth + layout.gap);
      const block = new Block(x, y, hp, this.pickBlockType(rowIndex, col), layout.blockWidth, layout.blockHeight, speed);
      block.gridRow = rowIndex;
      block.gridCol = col;
      this.blocks.push(block);
    }
    this.blockRowsSpawned += 1;
  },

  syncBlockGridPositions() {
    const layout = this.getBlockLayout();
    for (const block of this.blocks) {
      const col = Number.isFinite(block.gridCol) ? block.gridCol : 0;
      const row = Number.isFinite(block.gridRow) ? block.gridRow : 0;
      block.width = layout.blockWidth;
      block.height = layout.blockHeight;
      block.x = layout.padding + col * (layout.blockWidth + layout.gap);
      block.y = this.getBlockY(row, layout);
    }
  },

  pickBlockType(rowIndex, col) {
    if (Math.random() < 0.8) return "stone";
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
    if (this.awaitingStartClick) {
      this.paddle.update(this, dt);
      this.positionWaitingLaunchBalls();
      Effects.update(dt);
      this.updateHud();
      UI.renderSlots(this.balls, this.paddle);
      return;
    }
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
    this.updateBlockSpawning();

    this.updateHud();
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
    return 0.08;
  },

  updateBlockGrid(dt) {
    const frame = dt * 60;
    this.blockGridOffset += this.getBlockDescendSpeed() * frame;
    this.syncBlockGridPositions();
  },

  updateBlockSpawning() {
    const layout = this.getBlockLayout();
    const pitch = this.getBlockRowPitch(layout);
    let guard = 0;
    while (this.blocks.length < this.getMaxActiveBlocks() && guard < 6) {
      const topRow = this.getTopmostBlockRow();
      if (topRow === null) {
        this.createBlocks();
        break;
      }
      const topY = this.getBlockY(topRow, layout);
      if (topY < this.getBlockStartY() + pitch * this.getBlockSpawnLeadRatio()) break;
      this.spawnBlockRow(topRow - 1, layout);
      guard += 1;
    }
    this.syncBlockGridPositions();
  },

  getTopmostBlockY() {
    if (this.blocks.length === 0) return null;
    return this.blocks.reduce((top, block) => Math.min(top, block.y), Infinity);
  },

  getTopmostBlockRow() {
    if (this.blocks.length === 0) return null;
    return this.blocks.reduce((top, block) => Math.min(top, block.gridRow), Infinity);
  },

  getMaxActiveBlocks() {
    return 60;
  },

  getBaseBlockHp(level = 1) {
    const step = Math.max(0, level - 1);
    return Math.floor(100 * Math.pow(1.18, step));
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
      Effects.spawnBlockBreak(block.cx, block.cy, block.colorSet ? block.colorSet.body : "#ff4a4a");
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
    for (const block of this.blocks) block.draw(ctx);
    this.drawProjectiles(ctx);
    this.paddle.draw(ctx);
    this.drawResumeShield(ctx);
    this.bumper.draw(ctx);
    for (const ball of this.balls) ball.draw(ctx);
    Effects.draw(ctx);
    this.drawCombo(ctx);
  },

  drawBackground(ctx) {
    ctx.save();
    ctx.fillStyle = "#0d0d1a";
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.strokeStyle = "rgba(255,255,255,0.035)";
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
    ctx.fillText("COMBO", w / 2, 7);
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

  damageBlock(block, amount, sourceBall, source = "hit", depth = 0) {
    if (!this.blocks.includes(block) || block.hp <= 0) return false;
    const appliedDamage = Math.min(block.hp, Math.max(0, amount));
    if (appliedDamage > 0) {
      Effects.showDamageNumber(
        block.cx,
        Math.max(14, block.y + block.height * 0.18),
        appliedDamage,
        this.getDamageNumberColor(sourceBall, source),
        source
      );
    }
    const destroyed = block.takeDamage(amount);
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
    const color = block.colorSet ? block.colorSet.body : (block.isSpecial ? "#ffcc4a" : "#4a9eff");
    Effects.spawnBlockBreak(block.cx, block.cy, color);
    AudioSystem.playBlockBreak(block.isSpecial, this.combo, block.effect);
    if (block.isSpecial) Effects.shakeScreen(3, 0.2);
    const lastHit = sourceBall ? getSkillLevel(sourceBall, "lastHit") : 0;
    const tokenAmount = block.getTokenDropAmount(sourceBall, lastHit > 0 ? lastHit * 5 : 0);
    this.addTokens(tokenAmount);
    TokenManager.spawn(block.cx, block.cy, tokenAmount, this);
    Effects.spawnTokenCollect(block.cx, block.cy, Math.min(5, Math.max(1, Math.ceil(tokenAmount / 10))));

    const vampire = sourceBall ? getSkillLevel(sourceBall, "vampire") : 0;
    if (vampire > 0) {
      const recovery = Math.max(1, Math.floor(block.maxHp * vampire / 100));
      this.healPaddle(recovery, this.paddle.x + this.paddle.getWidth() / 2, this.paddle.y);
    }

    const scoreMultiplier = source === "ball" ? this.getPaddlelessScoreMultiplier(sourceBall) : 1;
    const points = this.getBlockScore(block, sourceBall, source);
    this.addScore(points, block.cx, block.cy, scoreMultiplier);
    this.triggerBlockEffect(block, sourceBall, source, depth);
    if (sourceBall) this.triggerDestroySkills(block, sourceBall, depth);
    this.recordBlockDestroyed();
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
      Effects.spawnTokenCollect(block.cx, block.cy, 3);
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
    if (sourceBall) points *= 1 + getSkillLevel(sourceBall, "scoreBoost") * 0.15;
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
      this.applyAreaDamage(block.cx, block.cy, 30 + splash * 10, ball.getSkillDamage(this, splash, "area"), ball, block, "splash", depth + 1);
    }

    const chain = getSkillLevel(ball, "chain");
    if (chain > 0) {
      let origin = block;
      const visited = new Set([block.id]);
      for (let i = 0; i < chain; i += 1) {
        const target = this.findNearestBlock(origin.cx, origin.cy, visited);
        if (!target) break;
        visited.add(target.id);
        this.damageBlock(target, ball.getSkillDamage(this, chain, "chain"), ball, "chain", depth + 1);
        origin = target;
      }
    }

    const sniper = getSkillLevel(ball, "sniper");
    if (sniper > 0) {
      for (const target of [...this.blocks]) {
        const sameColumn = Math.abs(target.cx - block.cx) < block.width * 0.65;
        const sameRow = sniper >= 5 && Math.abs(target.cy - block.cy) < block.height * 1.2;
        if (sameColumn || sameRow) this.damageBlock(target, ball.getSkillDamage(this, sniper, "sniper"), ball, "sniper", depth + 1);
      }
    }

    const magnetism = getSkillLevel(ball, "magnetism");
    if (magnetism > 0) {
      const damage = ball.getSkillDamage(this, magnetism, "projectile");
      for (const target of this.getNearestBlocks(block.cx, block.cy, 2 + magnetism)) {
        this.spawnProjectile(block.cx, block.cy, target.cx, target.cy, 7, damage, ball, SKILLS.magnetism.color, 0);
      }
    }

    const crossfire = getSkillLevel(ball, "crossfire");
    if (crossfire > 0) {
      const damage = ball.getSkillDamage(this, crossfire, "projectile");
      this.spawnProjectile(block.cx, block.cy, -1, 0, 7, damage, ball, SKILLS.crossfire.color, 2 + crossfire, true);
      this.spawnProjectile(block.cx, block.cy, 1, 0, 7, damage, ball, SKILLS.crossfire.color, 2 + crossfire, true);
    }

    const fragment = getSkillLevel(ball, "fragment");
    if (fragment > 0) {
      const damage = ball.getSkillDamage(this, fragment, "shard");
      for (let i = 0; i < 3 + fragment; i += 1) {
        const angle = rand(0, Math.PI * 2);
        this.spawnProjectile(block.cx, block.cy, Math.cos(angle), Math.sin(angle), 5.5, damage, ball, SKILLS.fragment.color, 0, true);
      }
    }

    const lightning = Math.max(getSkillLevel(ball, "lightning"), ball.cycleEffect === "lightning" ? 1 : 0);
    if (lightning > 0) {
      const targets = this.getNearestBlocks(block.cx, block.cy, lightning).filter((target) =>
        distance(block.cx, block.cy, target.cx, target.cy) < 110 + lightning * 20
      );
      for (const target of targets) this.damageBlock(target, ball.getSkillDamage(this, lightning, "chain"), ball, "lightning", depth + 1);
    }

    const afterburn = getSkillLevel(ball, "afterburn");
    if (afterburn > 0) {
      this.addZone({
        kind: "afterburn",
        x: block.cx,
        y: block.cy,
        radius: 22 + afterburn * 4,
        life: 3 + afterburn,
        maxLife: 3 + afterburn,
        damage: ball.getSkillDamage(this, afterburn, "dot"),
        tick: 0.35,
        tickTimer: 0,
        color: SKILLS.afterburn.color,
        sourceBall: ball
      });
    }

    const blast = getSkillLevel(ball, "blast");
    if (blast > 0) {
      const damage = ball.getSkillDamage(this, blast, "line");
      this.addZone({
        kind: "blast",
        x: 0,
        y: block.cy,
        width: this.width,
        height: 8 + blast * 2,
        life: 0.3,
        maxLife: 0.3,
        damage,
        color: SKILLS.blast.color,
        sourceBall: ball,
        spent: false
      });
      this.applyLineDamage(block.cy, 8 + blast * 2, damage, ball, "blast", depth + 1);
    }
  },

  applyAreaDamage(x, y, radius, damage, sourceBall, excludedBlock, source = "area", depth = 0) {
    for (const block of [...this.blocks]) {
      if (excludedBlock && block.id === excludedBlock.id) continue;
      const reach = radius + Math.max(block.width, block.height) * 0.5;
      if (distance(x, y, block.cx, block.cy) <= reach) this.damageBlock(block, damage, sourceBall, source, depth);
    }
  },

  applyLineDamage(y, height, damage, sourceBall, source = "line", depth = 0) {
    for (const block of [...this.blocks]) {
      if (Math.abs(block.cy - y) <= height / 2 + block.height / 2) {
        this.damageBlock(block, damage, sourceBall, source, depth);
      }
    }
  },

  applyColumnDamage(x, width, damage, sourceBall, source = "column", depth = 0) {
    for (const block of [...this.blocks]) {
      if (Math.abs(block.cx - x) <= width / 2 + block.width / 2) {
        this.damageBlock(block, damage, sourceBall, source, depth);
      }
    }
  },

  spawnProjectile(x, y, targetX, targetY, speed, damage, sourceBall, color, pierce = 0, isDirection = false) {
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
    this.projectiles.push({
      x,
      y,
      vx: (dx / length) * speed,
      vy: (dy / length) * speed,
      radius: 3,
      damage,
      sourceBall,
      color,
      pierce,
      life: 3,
      hitIds: new Set()
    });
  },

  updateProjectiles(dt) {
    const frame = dt * 60;
    for (const projectile of [...this.projectiles]) {
      projectile.life -= dt;
      projectile.x += projectile.vx * frame;
      projectile.y += projectile.vy * frame;
      if (projectile.life <= 0 || projectile.x < -20 || projectile.x > this.width + 20 || projectile.y < -20 || projectile.y > this.height + 20) {
        this.removeProjectile(projectile);
        continue;
      }
      for (const block of [...this.blocks]) {
        if (projectile.hitIds.has(block.id)) continue;
        if (!circleRectHit(projectile.x, projectile.y, projectile.radius, block.collisionRect)) continue;
        projectile.hitIds.add(block.id);
        this.damageBlock(block, projectile.damage, projectile.sourceBall, "projectile", 1);
        Effects.spawnBlockBreak(projectile.x, projectile.y, projectile.color);
        AudioSystem.playBlockHit(this.combo);
        if (projectile.pierce > 0) {
          projectile.pierce -= 1;
        } else {
          this.removeProjectile(projectile);
        }
        break;
      }
    }
  },

  drawProjectiles(ctx) {
    for (const projectile of this.projectiles) {
      ctx.save();
      ctx.strokeStyle = projectile.color;
      ctx.fillStyle = projectile.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
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
        zone.tickTimer -= dt;
        if (zone.tickTimer <= 0) {
          zone.tickTimer = zone.tick;
          this.applyAreaDamage(zone.x, zone.y, zone.radius, zone.damage, zone.sourceBall, null, zone.kind, 1);
        }
      }
      if (zone.kind === "afterburn") {
        for (const ball of this.balls) {
          if (ball.alive && distance(ball.x, ball.y, zone.x, zone.y) < zone.radius + ball.radius) {
            ball.damageBoostTimer = 1.2;
            ball.damageBoostMultiplier = 1.15 + getSkillLevel(zone.sourceBall, "afterburn") * 0.08;
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
      ctx.globalAlpha = alpha * 0.35;
      ctx.fillStyle = zone.color;
      ctx.strokeStyle = zone.color;
      if (zone.kind === "blast") {
        ctx.fillRect(0, zone.y - zone.height / 2, zone.width, zone.height);
      } else if (zone.kind === "column") {
        ctx.fillRect(zone.x - zone.width / 2, 0, zone.width, zone.height);
      } else {
        ctx.beginPath();
        ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
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

  findDenseBlockAnchor() {
    if (this.blocks.length === 0) return null;
    let best = this.blocks[0];
    let bestScore = -1;
    for (const block of this.blocks) {
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
    if (gained > 0 && Number.isFinite(x) && Number.isFinite(y)) {
      Effects.showScoreNumber(x, y, gained, multiplier);
    }
    const hud = document.getElementById("hud-score");
    if (hud) {
      hud.textContent = formatNumber(this.score);
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
  },

  addTokens(amount) {
    const gained = Math.max(0, Math.floor(amount));
    this.tokens += gained;
    const hpToken = document.getElementById("hp-token-count");
    if (hpToken) hpToken.textContent = formatNumber(this.tokens);
    const hpTokenDisplay = document.getElementById("hp-token-display");
    if (hpTokenDisplay) {
      hpTokenDisplay.classList.remove("pulse");
      void hpTokenDisplay.offsetWidth;
      hpTokenDisplay.classList.add("pulse");
    }
    this.showTokenGain(gained);
  },

  showTokenGain(amount) {
    if (amount <= 0) return;
    this.tokenGainAmount += amount;
    const node = document.getElementById("token-gain-text");
    if (!node) return;
    node.textContent = `+${formatNumber(this.tokenGainAmount)} TOKEN`;
    node.classList.remove("active");
    void node.offsetWidth;
    node.classList.add("active");
    clearTimeout(this.tokenGainTimeout);
    this.tokenGainTimeout = setTimeout(() => {
      this.tokenGainAmount = 0;
      const currentNode = document.getElementById("token-gain-text");
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
    UI.showToast(`BALL ${index + 1} に刻印しました`);
    UI.renderSlots(this.balls, this.paddle);
    return true;
  },

  addBall() {
    if (this.balls.length >= BALL_MAX) return false;
    const index = this.balls.length;
    const ball = new Ball(this.paddle.x + this.paddle.getWidth() / 2, this.paddle.y - 12, BALL_COLORS[index]);
    ball.launch(ball.x, ball.y);
    this.balls.push(ball);
    this.syncBumperFromBalls(true);
    Effects.showBallRevive(ball.x, ball.y, ball.color);
    UI.renderSlots(this.balls, this.paddle);
    return true;
  },

  buyNextBallWithTokens() {
    const nextBallNumber = this.balls.length + 1;
    const cost = getBallPurchaseCost(nextBallNumber);
    if (!Number.isFinite(cost) || this.balls.length >= BALL_MAX) {
      UI.showToast("BALL SLOTS FULL");
      return false;
    }
    if (this.tokens < cost) {
      UI.showToast(`NEED ${formatNumber(cost)} TOKENS`);
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
    UI.showToast("BUMPER UNLOCKS WITH BALLS");
    return false;
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
        UI.showToast("BALL SLOTS FULL");
        return;
      }
    } else if (!addOrLevelSkill(target, choice.id)) {
      UI.showToast("このスキルはこれ以上装備できません");
      return;
    }
    if (target && target.isBumper && target.syncStats) target.syncStats();
    UI.renderSlots(this.balls, this.paddle);
    setState(STATE.UPGRADE);
    this.showUpgradeScreen();
  },

  gameOver() {
    if (currentState !== STATE.PLAYING) return;
    Effects.shakeScreen(5, 0.3);
    AudioSystem.playGameOver();
    const highScore = Math.max(Number(localStorage.getItem("ricoBlast_highScore") || 0), this.score);
    const bestBlocks = Math.max(Number(localStorage.getItem("ricoBlast_bestBlocks") || 0), this.totalBlocksDestroyed);
    localStorage.setItem("ricoBlast_highScore", String(highScore));
    localStorage.setItem("ricoBlast_bestBlocks", String(bestBlocks));
    setState(STATE.REWARD_READY);
    this.phaseTimeout = setTimeout(() => {
      UI.showGameOver(this.score, this.totalBlocksDestroyed, highScore, bestBlocks);
      setState(STATE.GAME_OVER);
    }, 500);
  },

  updateHud() {
    const progressText = document.getElementById("hud-progress-text");
    const progressFill = document.getElementById("hud-progress-fill");
    const scoreNode = document.getElementById("hud-score");
    const pauseButton = document.getElementById("btn-pause");
    if (!progressText || !progressFill || !scoreNode) return;
    const progress = clamp(this.blocksTowardSkill / this.blocksPerSkill, 0, 1);
    progressText.textContent = `${Math.min(this.blocksTowardSkill, this.blocksPerSkill)}/${this.blocksPerSkill}`;
    progressFill.style.width = `${progress * 100}%`;
    scoreNode.textContent = formatNumber(this.score);
    const hpToken = document.getElementById("hp-token-count");
    if (hpToken) hpToken.textContent = formatNumber(this.tokens);
    if (pauseButton) {
      pauseButton.textContent = this.paused ? "PLAY" : "STOP";
      pauseButton.classList.toggle("active", this.paused);
    }
  }
};
