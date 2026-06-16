const TOKEN_FX_LIMITS = {
  soft: 20,
  busy: 30,
  max: 38
};

class Token {
  constructor(x, y, amount = 1, targetX = 0, targetY = 0, scale = 1, quality = 1) {
    this.amount = Math.max(1, Math.floor(amount));
    this.scale = clamp(scale, 0.82, 1.4);
    this.quality = clamp(quality, 0.35, 1);
    this.x = x + rand(-3, 3) * this.scale;
    this.y = y + rand(-2, 2) * this.scale;
    this.originX = this.x;
    this.originY = this.y;
    this.vx = rand(-0.95, 0.95) * this.scale;
    this.vy = rand(-1.55, -0.55) * this.scale;
    this.targetX = targetX;
    this.targetY = targetY;
    this.size = clamp((5 + Math.log2(this.amount + 1) * 0.72) * this.scale, 5.2, 9.8);
    this.age = 0;
    this.collectDelay = rand(0.05, 0.13);
    this.maxLife = rand(0.82, 1.05);
    this.done = false;
    this.arrived = false;
    this.rotation = rand(0, Math.PI * 2);
    this.spin = rand(0.08, 0.16) * (Math.random() < 0.5 ? -1 : 1);
    this.orbit = rand(-1, 1);
    this.trail = this.quality <= 0.5 ? [] : [{ x: this.x, y: this.y, life: 1 }];
    this.trailTimer = 0;
    this.trailInterval = this.quality < 0.7 ? 0.038 : 0.018;
    this.trailLimit = this.quality <= 0.5 ? 0 : (this.quality < 0.7 ? 5 : 12);
  }

  setTarget(x, y) {
    if (Number.isFinite(x)) this.targetX = x;
    if (Number.isFinite(y)) this.targetY = y;
  }

  getTravel() {
    const duration = Math.max(0.001, this.maxLife - this.collectDelay);
    return clamp((this.age - this.collectDelay) / duration, 0, 1);
  }

  update(dt) {
    const frame = dt * 60;
    this.age += dt;
    const travel = this.getTravel();
    const dist = distance(this.x, this.y, this.targetX, this.targetY);
    const angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);

    if (this.age >= this.collectDelay) {
      const ease = 1 - Math.pow(1 - travel, 2.35);
      const nearBoost = 1 - clamp(dist / 620, 0, 1);
      const pull = clamp(0.16 + ease * 0.58 + nearBoost * 0.18, 0.16, 0.88);
      const swirl = (1 - travel) * 0.055 * this.orbit * frame;
      this.vx += (Math.cos(angle) * pull - Math.sin(angle) * swirl) * frame;
      this.vy += (Math.sin(angle) * pull + Math.cos(angle) * swirl) * frame;
    } else {
      this.vy -= 0.035 * frame;
    }

    const maxSpeed = (9 + travel * 24) * this.scale;
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > maxSpeed) {
      const limit = maxSpeed / speed;
      this.vx *= limit;
      this.vy *= limit;
    }

    this.x += this.vx * frame;
    this.y += this.vy * frame;
    const damping = this.age < this.collectDelay ? 0.94 : 0.885;
    this.vx *= Math.pow(damping, frame);
    this.vy *= Math.pow(damping, frame);

    if (travel > 0.68) {
      const lock = Math.pow((travel - 0.68) / 0.32, 1.35);
      this.x += (this.targetX - this.x) * 0.08 * lock * frame;
      this.y += (this.targetY - this.y) * 0.08 * lock * frame;
    }

    this.rotation += this.spin * (1 + travel * 1.4) * frame;
    if (this.trailLimit > 0) {
      this.trailTimer -= dt;
      if (this.trailTimer <= 0) {
        this.trailTimer = this.trailInterval;
        this.trail.push({ x: this.x, y: this.y, life: 1 });
        if (this.trail.length > this.trailLimit) this.trail.shift();
      }
      for (let i = this.trail.length - 1; i >= 0; i -= 1) {
        const point = this.trail[i];
        point.life -= dt * 2.4;
        if (point.life <= 0) this.trail.splice(i, 1);
      }
    } else if (this.trail.length) {
      this.trail.length = 0;
    }

    const arriveRadius = Math.max(8, 9 * this.scale);
    if (dist < arriveRadius || travel >= 1) {
      this.x = this.targetX;
      this.y = this.targetY;
      this.done = true;
      this.arrived = true;
    }
  }

  draw(ctx, lite = false) {
    const travel = this.getTravel();
    const enter = clamp(this.age / 0.12, 0, 1);
    const exit = clamp((1 - travel) / 0.12, 0, 1);
    const alpha = enter * (travel > 0.88 ? exit : 1);
    if (alpha <= 0) return;

    ctx.save();
    if (!lite) ctx.globalCompositeOperation = "lighter";

    if (!lite && this.trail.length > 1) {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (let i = 1; i < this.trail.length; i += 1) {
        const from = this.trail[i - 1];
        const to = this.trail[i];
        const t = i / (this.trail.length - 1);
        const trailAlpha = alpha * clamp(to.life, 0, 1) * t * 0.48;
        ctx.globalAlpha = trailAlpha;
        ctx.strokeStyle = i % 2 === 0 ? "#ffe66b" : "#fff5b8";
        ctx.lineWidth = (0.8 + t * 2.1) * this.scale;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      }
    }

    const size = this.size;
    const pop = 0.82 + clamp(this.age / 0.16, 0, 1) * 0.18;

    ctx.globalAlpha = alpha * 0.22;
    ctx.fillStyle = "rgba(255,230,107,0.28)";
    ctx.beginPath();
    ctx.arc(this.x, this.y, size * 2.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.scale(pop, pop);
    if (!lite) {
      ctx.shadowBlur = this.amount >= 100 ? 12 : this.amount >= 20 ? 9 : 6;
      ctx.shadowColor = "rgba(255,230,107,0.58)";
    }

    ctx.fillStyle = "#ffe66b";
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.78, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(-size * 0.78, 0);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.globalAlpha = alpha * 0.84;
    ctx.strokeStyle = "rgba(255,255,255,0.58)";
    ctx.lineWidth = Math.max(1, this.scale);
    ctx.stroke();

    ctx.globalAlpha = alpha * 0.78;
    ctx.fillStyle = "#fff8c9";
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.48);
    ctx.lineTo(size * 0.3, 0);
    ctx.lineTo(0, size * 0.38);
    ctx.lineTo(-size * 0.3, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

const TokenManager = {
  tokens: [],
  overlayCanvas: null,
  overlayCtx: null,
  overlayRect: null,
  overlayDpr: 1,

  isPowerSaveMode() {
    if (typeof Game === "undefined") return false;
    if (Game.isReducedVisualsEnabled) return Game.isReducedVisualsEnabled();
    return Game.isPowerSaveEnabled && Game.isPowerSaveEnabled();
  },

  isMinimalMode() {
    return typeof Game !== "undefined" && Game.isMinimalModeEnabled && Game.isMinimalModeEnabled();
  },

  getLimits() {
    if (this.isMinimalMode()) return { soft: 4, busy: 6, max: 8 };
    return this.isPowerSaveMode()
      ? { soft: 10, busy: 16, max: 22 }
      : TOKEN_FX_LIMITS;
  },

  spawn(x, y, amount = 1, game = null) {
    if (this.tokens.length > 0) {
      this.clear();
    } else if (this.overlayCanvas && this.overlayCanvas.style.display !== "none") {
      this.hideOverlay();
    }
  },

  ensureOverlay(game = null) {
    if (typeof document === "undefined") return null;
    const root = document.getElementById("screen-game");
    if (!root) return null;

    if (!this.overlayCanvas) {
      const canvas = document.createElement("canvas");
      canvas.id = "token-fx-canvas";
      canvas.style.position = "absolute";
      canvas.style.inset = "0";
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.pointerEvents = "none";
      canvas.style.zIndex = "12";
      canvas.setAttribute("aria-hidden", "true");
      root.appendChild(canvas);
      this.overlayCanvas = canvas;
      this.overlayCtx = canvas.getContext("2d");
    }

    const rect = root.getBoundingClientRect();
    const dpr = clamp(window.devicePixelRatio || 1, 1, this.isMinimalMode() ? 1 : (this.isPowerSaveMode() ? 1.25 : 2));
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (this.overlayCanvas.width !== width || this.overlayCanvas.height !== height) {
      this.overlayCanvas.width = width;
      this.overlayCanvas.height = height;
    }
    this.overlayCanvas.style.display = game && game.canvas ? "block" : this.tokens.length ? "block" : "none";
    this.overlayCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.overlayDpr = dpr;
    this.overlayRect = rect;
    return rect;
  },

  gameToOverlay(game, x, y, screenRect = null) {
    screenRect = screenRect || this.ensureOverlay(game);
    if (!game || !game.canvas || !screenRect) return { x, y, scale: 1 };
    const canvasRect = game.canvas.getBoundingClientRect();
    if (canvasRect.width <= 0 || canvasRect.height <= 0 || game.width <= 0 || game.height <= 0) {
      return { x, y, scale: 1 };
    }
    const scaleX = canvasRect.width / game.width;
    const scaleY = canvasRect.height / game.height;
    return {
      x: canvasRect.left - screenRect.left + x * scaleX,
      y: canvasRect.top - screenRect.top + y * scaleY,
      scale: clamp((scaleX + scaleY) * 0.5, 0.82, 1.4)
    };
  },

  getCollectionTarget(game, fallbackX = 0, fallbackY = 0, screenRect = null) {
    if (typeof document === "undefined") return { x: fallbackX, y: fallbackY };
    screenRect = screenRect || this.ensureOverlay(game);
    const meter = document.getElementById("hp-token-display");
    const meterRect = meter ? meter.getBoundingClientRect() : null;
    if (!screenRect || !meterRect || meterRect.width <= 0 || meterRect.height <= 0) {
      return { x: fallbackX, y: fallbackY };
    }

    return {
      x: meterRect.left + meterRect.width * 0.5 - screenRect.left,
      y: meterRect.top + meterRect.height * 0.5 - screenRect.top
    };
  },

  clear() {
    this.tokens = [];
    this.clearOverlay();
    this.hideOverlay();
  },

  trimTokens() {
    const limits = this.getLimits();
    if (this.tokens.length > limits.max) this.tokens.splice(0, this.tokens.length - limits.max);
    if (this.isMinimalMode() || this.isPowerSaveMode()) {
      for (const token of this.tokens) {
        token.quality = Math.min(token.quality || 1, this.isMinimalMode() ? 0.35 : 0.45);
        token.trailLimit = 0;
        token.trail.length = 0;
      }
    }
  },

  getOverlaySize() {
    if (!this.overlayCanvas) return { width: 0, height: 0 };
    return {
      width: this.overlayCanvas.width / Math.max(1, this.overlayDpr || 1),
      height: this.overlayCanvas.height / Math.max(1, this.overlayDpr || 1)
    };
  },

  clearOverlay() {
    if (!this.overlayCanvas || !this.overlayCtx) return;
    const size = this.getOverlaySize();
    this.overlayCtx.clearRect(0, 0, size.width, size.height);
  },

  hideOverlay() {
    if (this.overlayCanvas) this.overlayCanvas.style.display = "none";
  },

  update(game, dt) {
    if (this.tokens.length > 0) {
      this.clear();
    } else if (this.overlayCanvas && this.overlayCanvas.style.display !== "none") {
      this.hideOverlay();
    }
  },

  draw() {
  },

  pulseMeter() {
    if (typeof document === "undefined") return;
    const meter = document.getElementById("hp-token-display");
    if (!meter) return;
    meter.classList.remove("pulse");
    void meter.offsetWidth;
    meter.classList.add("pulse");
  },

  remove(token) {
    const index = this.tokens.indexOf(token);
    if (index >= 0) this.tokens.splice(index, 1);
  }
};
