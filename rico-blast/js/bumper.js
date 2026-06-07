class Bumper {
  constructor() {
    this.isBumper = true;
    this.skills = [];
    this.level = 0;
    this.maxLevel = 10;
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 4;
    this.maxHp = 0;
    this.hp = 0;
    this.broken = false;
    this.reviveTimer = 0;
    this.flashTimer = 0;
    this.hitFlashTimer = 0;
  }

  isOwned() {
    return this.level > 0;
  }

  setPosition(canvasWidth, canvasHeight) {
    this.x = 0;
    this.width = canvasWidth;
    this.y = canvasHeight - 8;
    this.syncStats();
  }

  syncStats() {
    const ownedHp = Math.max(0, this.level || 0);
    const nextMaxHp = ownedHp + getSkillLevel(this, "bumperFortify");
    const previousMaxHp = this.maxHp;
    const previousHp = this.hp;
    this.maxHp = nextMaxHp;

    if (this.maxHp <= 0) {
      this.hp = 0;
      this.broken = false;
      this.reviveTimer = 0;
      this.flashTimer = 0;
      this.hitFlashTimer = 0;
      return;
    }

    if (this.broken) {
      this.hp = 0;
      return;
    }

    if (previousMaxHp <= 0) {
      this.hp = this.maxHp;
      return;
    }

    this.hp = clamp(previousHp + (this.maxHp - previousMaxHp), 1, this.maxHp);
  }

  reset(canvasWidth, canvasHeight) {
    this.setPosition(canvasWidth, canvasHeight);
    if (this.maxHp <= 0) {
      this.hp = 0;
      this.broken = false;
      this.reviveTimer = 0;
      this.flashTimer = 0;
      this.hitFlashTimer = 0;
      return;
    }
    this.hp = this.maxHp;
    this.broken = false;
    this.reviveTimer = 0;
    this.flashTimer = 0.3;
    this.hitFlashTimer = 0;
  }

  getReviveTime() {
    if (this.level <= 0) return 0;
    const levelTime = 10 * Math.pow(0.9, Math.max(0, this.level - 1));
    const skillMultiplier = Math.pow(0.92, getSkillLevel(this, "bumperRecover"));
    return Math.max(1, levelTime * skillMultiplier);
  }

  update(game, dt) {
    this.setPosition(game.width, game.height);
    this.flashTimer = Math.max(0, this.flashTimer - dt);
    this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dt);
    if (this.maxHp <= 0 || !this.broken) return;
    this.reviveTimer = Math.max(0, this.reviveTimer - dt);
    if (this.reviveTimer <= 0) this.revive(game);
  }

  revive(game) {
    if (this.maxHp <= 0) return;
    this.broken = false;
    this.hp = this.maxHp;
    this.reviveTimer = 0;
    this.flashTimer = 0.3;
    Effects.showBumperRevive(game.width / 2, this.y);
    AudioSystem.playBumperRevive();
  }

  getCollisionRect() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }

  canHitBall(ball, prevX = ball.x, prevY = ball.y) {
    if (this.maxHp <= 0 || this.broken || !ball.alive || ball.vy <= 0) return false;
    const collision = getCircleRectCollision(prevX, prevY, ball.x, ball.y, ball.radius, this.getCollisionRect());
    return Boolean(collision && collision.normalY <= 0);
  }

  hit(game, ball, prevX = ball.x, prevY = ball.y) {
    if (!this.canHitBall(ball, prevX, prevY)) return false;
    ball.y = this.y - ball.radius - 0.5;
    ball.vy = -Math.abs(ball.vy || 5);
    ball.vx += rand(-0.35, 0.35);
    ball.firstHitAfterPaddle = true;
    ball.normalizeSpeed(ball.getTargetSpeed());

    this.hp = Math.max(0, this.hp - 1);
    this.hitFlashTimer = 0.18;
    Effects.shakeScreen(1.2, 0.08);
    Effects.showBumperHit(ball.x, this.y, this.width);
    AudioSystem.playBumperHit();

    if (this.hp <= 0) this.break(game, ball.x);
    return true;
  }

  break(game, x) {
    this.broken = true;
    this.reviveTimer = this.getReviveTime();
    this.hitFlashTimer = 0;
    Effects.shakeScreen(3, 0.16);
    Effects.showBumperBroken(clamp(x, 24, game.width - 24), this.y, this.width);
    AudioSystem.playBumperBreak();
  }

  draw(ctx) {
    if (this.maxHp <= 0) return;
    const hit = clamp(this.hitFlashTimer / 0.18, 0, 1);
    const revive = clamp(this.flashTimer / 0.3, 0, 1);
    const now = performance.now();
    const brokenPulse = this.broken ? 0.42 + Math.sin(now / 95) * 0.16 : 0;
    const railX = 8;
    const railW = Math.max(0, this.width - railX * 2);
    const railH = 7;
    const railY = -2;
    const coreY = railY + 2.5;
    const segment = 26;
    const gap = 5;

    ctx.save();
    ctx.translate(this.x, this.y);

    if (hit > 0 || revive > 0) {
      ctx.globalAlpha = Math.max(hit, revive) * 0.2;
      ctx.fillStyle = this.broken ? "rgba(255,74,74,0.52)" : "rgba(246,251,255,0.62)";
      roundedRect(ctx, 0, railY - 5, this.width, railH + 10, 7);
      ctx.fill();
    }

    ctx.globalAlpha = this.broken ? 0.62 + brokenPulse * 0.18 : 0.96;
    ctx.shadowBlur = this.broken ? 3 : 6 + hit * 5 + revive * 7;
    ctx.shadowColor = this.broken ? "rgba(255,74,74,0.34)" : "rgba(74,158,255,0.24)";
    const shell = ctx.createLinearGradient(0, railY, 0, railY + railH);
    shell.addColorStop(0, this.broken ? "#2a1624" : "#24263a");
    shell.addColorStop(0.5, this.broken ? "#4a1c2d" : "#17182a");
    shell.addColorStop(1, this.broken ? "#1b101a" : "#0c0d18");
    ctx.fillStyle = shell;
    roundedRect(ctx, railX, railY, railW, railH, 3);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.globalAlpha = this.broken ? 0.42 : 0.72;
    ctx.strokeStyle = this.broken ? "rgba(255,122,141,0.36)" : "rgba(255,255,255,0.14)";
    ctx.lineWidth = 1;
    roundedRect(ctx, railX + 0.5, railY + 0.5, railW - 1, railH - 1, 2.5);
    ctx.stroke();

    ctx.globalAlpha = this.broken ? 0.38 + brokenPulse * 0.24 : 0.84;
    const core = ctx.createLinearGradient(railX, 0, railX + railW, 0);
    if (!this.broken) {
      core.addColorStop(0, "rgba(74,158,255,0.02)");
      core.addColorStop(0.16, "rgba(74,158,255,0.62)");
      core.addColorStop(0.5, "rgba(246,251,255,0.86)");
      core.addColorStop(0.84, "rgba(124,245,178,0.54)");
      core.addColorStop(1, "rgba(74,158,255,0.02)");
    } else {
      core.addColorStop(0, "rgba(255,74,74,0)");
      core.addColorStop(0.5, "rgba(255,74,74,0.7)");
      core.addColorStop(1, "rgba(255,74,74,0)");
    }
    ctx.shadowBlur = this.broken ? 4 : 6 + hit * 8 + revive * 8;
    ctx.shadowColor = this.broken ? "rgba(255,74,74,0.42)" : "rgba(103,216,255,0.36)";
    ctx.fillStyle = core;
    roundedRect(ctx, railX + 5, coreY, railW - 10, 2, 1);
    ctx.fill();

    ctx.shadowBlur = 0;
    for (let x = railX + 12; x < railX + railW - 8; x += segment) {
      ctx.globalAlpha = this.broken ? 0.16 : 0.26;
      ctx.fillStyle = this.broken ? "rgba(255,122,141,0.58)" : "rgba(255,255,255,0.45)";
      ctx.fillRect(x, railY + 1.5, 1, railH - 3);
      if (!this.broken) {
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = "rgba(103,216,255,0.62)";
        roundedRect(ctx, x + 4, railY + 2, Math.max(4, segment - gap - 8), 1.5, 1);
        ctx.fill();
      }
    }

    if (this.broken) {
      for (let x = railX + 18; x < railX + railW; x += 42) {
        ctx.globalAlpha = 0.2 + Math.sin(now / 80 + x) * 0.08;
        ctx.fillStyle = "rgba(255,74,74,0.65)";
        roundedRect(ctx, x, railY + 2, 18, 2, 1);
        ctx.fill();
      }
    }

    if (!this.broken) {
      const cursor = railX + 8 + ((now / 18) % Math.max(1, railW - 16));
      ctx.globalAlpha = 0.32 + hit * 0.28 + revive * 0.24;
      ctx.fillStyle = "rgba(246,251,255,0.78)";
      roundedRect(ctx, cursor - 5, railY + 1, 10, railH - 2, 2);
      ctx.fill();
    }

    if (this.broken) {
      ctx.globalAlpha = 1;
      ctx.font = "700 11px 'Space Mono', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(4, 8, 14, 0.92)";
      ctx.fillStyle = "#ff7a8d";
      const text = `BUMPER ${Math.ceil(this.reviveTimer)}s`;
      ctx.strokeText(text, this.width / 2, -4);
      ctx.fillText(text, this.width / 2, -4);
    }
    ctx.restore();
  }
}
