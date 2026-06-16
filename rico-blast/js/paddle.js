class Paddle {
  constructor() {
    this.isPaddle = true;
    this.x = 0;
    this.y = 0;
    this.baseWidth = 80;
    this.height = 12;
    this.targetX = 0;
    this.skills = [];
    this.bounceTimer = 0;
    this.maxHp = 20;
    this.hp = 20;
    this.damageFlashTimer = 0;
    this.healFlashTimer = 0;
  }

  getWidth() {
    const level = getSkillLevel(this, "paddleWidth");
    return level > 0 ? skillParam("paddleWidth", level, "width", this.baseWidth) : this.baseWidth;
  }

  getY(canvasHeight) {
    return canvasHeight - 28 - this.height * 4;
  }

  setPosition(canvasWidth, canvasHeight) {
    const width = this.getWidth();
    this.y = this.getY(canvasHeight);
    this.x = canvasWidth / 2 - width / 2;
    this.targetX = canvasWidth / 2;
  }

  setMaxHp(maxHp) {
    this.maxHp = Math.max(1, Math.ceil(maxHp));
    this.hp = this.maxHp;
    this.damageFlashTimer = 0;
    this.healFlashTimer = 0;
  }

  heal(amount) {
    const recovery = Math.max(0, Math.floor(amount));
    if (recovery <= 0 || this.hp >= this.maxHp) return 0;
    const before = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + recovery);
    const healed = this.hp - before;
    if (healed > 0) this.healFlashTimer = 0.2;
    return healed;
  }

  takeDamage(amount) {
    const damage = Math.max(0, Math.ceil(amount));
    if (damage <= 0) return false;
    this.hp = Math.max(0, this.hp - damage);
    this.damageFlashTimer = 0.28;
    return this.hp <= 0;
  }

  update(game, dt) {
    const frame = dt * 60;
    const width = this.getWidth();
    const desiredX = clamp(this.targetX - width / 2, 0, Math.max(0, game.width - width));
    const delta = desiredX - this.x;
    const maxMove = 8 * frame;
    this.x += clamp(delta, -maxMove, maxMove);
    this.y = this.getY(game.height);
    this.bounceTimer = Math.max(0, this.bounceTimer - dt);
    this.damageFlashTimer = Math.max(0, this.damageFlashTimer - dt);
    this.healFlashTimer = Math.max(0, this.healFlashTimer - dt);
  }

  draw(ctx) {
    const minimal = typeof Game !== "undefined" && Game.isMinimalModeEnabled && Game.isMinimalModeEnabled();
    const width = this.getWidth();
    const scaleY = this.bounceTimer > 0 ? 0.7 + (1 - this.bounceTimer / 0.1) * 0.3 : 1;
    ctx.save();
    ctx.translate(this.x + width / 2, this.y + this.height / 2);
    ctx.scale(1, scaleY);
    roundedRect(ctx, -width / 2, -this.height / 2, width, this.height, 6);
    if (minimal) {
      ctx.fillStyle = "#f6fbff";
    } else {
      const body = ctx.createLinearGradient(-width / 2, -this.height / 2, width / 2, this.height / 2);
      body.addColorStop(0, "#ffffff");
      body.addColorStop(0.5, "#f6fbff");
      body.addColorStop(1, "#dbe7f0");
      ctx.fillStyle = body;
    }
    if (!minimal) {
      ctx.shadowBlur = 12;
      ctx.shadowColor = "rgba(246,251,255,0.42)";
    }
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    roundedRect(ctx, -width / 2 + 5, -this.height / 2 + 2, width - 10, 3, 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.42)";
    ctx.lineWidth = 1;
    roundedRect(ctx, -width / 2 + 0.5, -this.height / 2 + 0.5, width - 1, this.height - 1, 5.5);
    ctx.stroke();
    if (this.damageFlashTimer > 0) {
      ctx.globalAlpha = clamp(this.damageFlashTimer / 0.28, 0, 1);
      ctx.fillStyle = "#ff4a4a";
      roundedRect(ctx, -width / 2, -this.height / 2 - 2, width, this.height + 4, 5);
      ctx.fill();
    }
    if (this.healFlashTimer > 0) {
      ctx.globalAlpha = clamp(this.healFlashTimer / 0.2, 0, 1);
      ctx.fillStyle = "#4aff88";
      if (!minimal) {
        ctx.shadowBlur = 18;
        ctx.shadowColor = "rgba(74, 255, 136, 0.82)";
      }
      roundedRect(ctx, -width / 2 - 2, -this.height / 2 - 3, width + 4, this.height + 6, 6);
      ctx.fill();
    }
    ctx.restore();
  }

  onTouch(x) {
    this.targetX = x;
  }

  bounce() {
    this.bounceTimer = 0.1;
  }
}
