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
    const fortify = getSkillLevel(this, "bumperFortify");
    const nextMaxHp = fortify > 0 ? Math.max(ownedHp, skillParam("bumperFortify", fortify, "hp", ownedHp)) : ownedHp;
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
    const recover = getSkillLevel(this, "bumperRecover");
    if (recover > 0) return skillParam("bumperRecover", recover, "seconds", 1);
    const levelTime = 10 * Math.pow(0.9, Math.max(0, this.level - 1));
    return Math.max(1, levelTime);
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
    const pulse = this.broken ? 0.5 + Math.sin(now / 120) * 0.5 : 0;
    const margin = 12;
    const railW = Math.max(0, this.width - margin * 2);
    const railH = 12;
    const railY = -7;
    const hpRatio = this.maxHp > 0 ? clamp(this.hp / this.maxHp, 0, 1) : 0;
    const liveColor = "#67d8ff";
    const accentColor = "#7cf5b2";
    const dangerColor = "#ff5f88";

    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.globalAlpha = this.broken ? 0.22 + pulse * 0.08 : 0.2 + hit * 0.18 + revive * 0.18;
    ctx.fillStyle = this.broken ? "rgba(255,95,136,0.42)" : "rgba(103,216,255,0.32)";
    roundedRect(ctx, margin - 6, railY - 7, railW + 12, railH + 14, 11);
    ctx.fill();

    ctx.globalAlpha = this.broken ? 0.58 : 0.95;
    ctx.shadowBlur = this.broken ? 10 + pulse * 8 : 12 + hit * 8 + revive * 10;
    ctx.shadowColor = this.broken ? "rgba(255,95,136,0.42)" : "rgba(103,216,255,0.34)";
    const shell = ctx.createLinearGradient(0, railY, 0, railY + railH);
    if (this.broken) {
      shell.addColorStop(0, "#3a1b2a");
      shell.addColorStop(0.52, "#211421");
      shell.addColorStop(1, "#110c15");
    } else {
      shell.addColorStop(0, "#31364d");
      shell.addColorStop(0.48, "#171b2d");
      shell.addColorStop(1, "#090b14");
    }
    ctx.fillStyle = shell;
    roundedRect(ctx, margin, railY, railW, railH, 6);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.globalAlpha = this.broken ? 0.44 : 0.82;
    ctx.lineWidth = 1;
    ctx.strokeStyle = this.broken ? "rgba(255,122,141,0.42)" : "rgba(246,251,255,0.18)";
    roundedRect(ctx, margin + 0.5, railY + 0.5, railW - 1, railH - 1, 5.5);
    ctx.stroke();

    const inset = 4;
    const coreX = margin + inset;
    const coreY = railY + inset;
    const coreW = Math.max(0, railW - inset * 2);
    const coreH = railH - inset * 2;

    ctx.save();
    roundedRect(ctx, coreX, coreY, coreW, coreH, 3);
    ctx.clip();
    ctx.globalAlpha = this.broken ? 0.28 + pulse * 0.2 : 0.92;
    ctx.fillStyle = this.broken ? "rgba(255,95,136,0.32)" : "rgba(103,216,255,0.16)";
    ctx.fillRect(coreX, coreY, coreW, coreH);

    if (!this.broken) {
      const hpW = Math.max(2, coreW * hpRatio);
      const hp = ctx.createLinearGradient(coreX, 0, coreX + coreW, 0);
      hp.addColorStop(0, "rgba(103,216,255,0.78)");
      hp.addColorStop(0.52, "rgba(246,251,255,0.94)");
      hp.addColorStop(1, "rgba(124,245,178,0.82)");
      ctx.fillStyle = hp;
      ctx.fillRect(coreX, coreY, hpW, coreH);
      if (hpRatio < 0.995) {
        ctx.fillStyle = "rgba(4,6,16,0.52)";
        ctx.fillRect(coreX + hpW, coreY, coreW - hpW, coreH);
      }
    } else {
      ctx.fillStyle = "rgba(255,95,136,0.32)";
      for (let x = coreX - 20 + ((now / 55) % 40); x < coreX + coreW; x += 40) {
        ctx.fillRect(x, coreY, 18, coreH);
      }
    }
    ctx.restore();

    if (!this.broken) {
      const segmentCount = Math.max(1, this.maxHp);
      const gap = 2;
      const segmentW = Math.max(4, (coreW - gap * (segmentCount - 1)) / segmentCount);
      for (let i = 0; i < segmentCount; i += 1) {
        const active = i < this.hp;
        ctx.globalAlpha = active ? 0.82 : 0.18;
        ctx.fillStyle = active ? (i % 2 ? accentColor : liveColor) : "rgba(246,251,255,0.38)";
        roundedRect(ctx, coreX + i * (segmentW + gap), railY - 3, Math.max(2, segmentW), 1.8, 1);
        ctx.fill();
      }
    }

    if (!this.broken) {
      const sweep = coreX + ((now / 14) % Math.max(1, coreW + 42)) - 21;
      ctx.globalAlpha = 0.22 + hit * 0.36 + revive * 0.32;
      const beam = ctx.createLinearGradient(sweep - 18, 0, sweep + 18, 0);
      beam.addColorStop(0, "rgba(246,251,255,0)");
      beam.addColorStop(0.5, "rgba(246,251,255,0.9)");
      beam.addColorStop(1, "rgba(246,251,255,0)");
      ctx.fillStyle = beam;
      roundedRect(ctx, sweep - 18, railY + 1.5, 36, railH - 3, 4);
      ctx.fill();
    }

    ctx.globalAlpha = this.broken ? 0.34 : 0.52;
    ctx.fillStyle = this.broken ? "rgba(255,95,136,0.66)" : "rgba(246,251,255,0.62)";
    roundedRect(ctx, margin + 8, railY + 2, 34, 1.4, 1);
    ctx.fill();
    roundedRect(ctx, margin + railW - 42, railY + railH - 3.4, 34, 1.4, 1);
    ctx.fill();

    if (this.broken) {
      ctx.globalAlpha = 1;
      ctx.font = "700 11px 'Space Mono', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(4, 8, 14, 0.92)";
      ctx.fillStyle = dangerColor;
      const text = `BUMPER ${Math.ceil(this.reviveTimer)}s`;
      ctx.strokeText(text, this.width / 2, railY - 4);
      ctx.fillText(text, this.width / 2, railY - 4);
    }
    ctx.restore();
  }
}
