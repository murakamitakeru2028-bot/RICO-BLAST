class Block {
  constructor(x, y, hp, blockType, width, height, descendSpeed) {
    this.id = Block.nextId;
    Block.nextId += 1;
    this.x = Math.round(x);
    this.y = Math.round(y);
    this.width = Math.round(width || 48);
    this.height = Math.round(height || 22);
    this.type = typeof blockType === "string" ? blockType : (blockType ? "burst" : "stone");
    this.definition = Block.types[this.type] || Block.types.stone;
    this.maxHp = Math.max(1, Math.ceil(hp * this.definition.hpMultiplier));
    this.hp = this.maxHp;
    this.isSpecial = this.type !== "stone";
    this.effect = this.definition.effect;
    this.descendSpeed = descendSpeed || 0.4;
    this.gridRow = 0;
    this.gridCol = 0;
    this.sway = 0;
    this.age = 0;
    this.poisons = [];
    this.colorSet = this.definition.colors;
  }

  get displayX() {
    return this.x;
  }

  get cx() {
    return this.displayX + this.width / 2;
  }

  get cy() {
    return this.y + this.height / 2;
  }

  get bottom() {
    return this.y + this.height;
  }

  get collisionRect() {
    return {
      x: this.displayX,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }

  update(game, dt) {
    this.age += dt;
    this.sway = 0;
    this.updatePoison(game, dt);
  }

  updatePoison(game, dt) {
    if (this.poisons.length === 0 || this.hp <= 0) return;
    for (const poison of [...this.poisons]) {
      poison.remaining -= dt;
      poison.timer -= dt;
      if (poison.remaining <= 0) {
        this.poisons.splice(this.poisons.indexOf(poison), 1);
        continue;
      }
      if (poison.timer <= 0) {
        poison.timer = 0.5;
        const damage = poison.sourceBall && poison.sourceBall.getSkillDamage
          ? poison.sourceBall.getSkillDamage(game, poison.level, "dot")
          : poison.level * 2;
        const destroyed = game.damageBlock(this, damage, poison.sourceBall, "poison");
        if (destroyed) break;
      }
    }
  }

  addPoison(level, sourceBall) {
    const existing = this.poisons.find((poison) => poison.sourceBall === sourceBall);
    if (existing) {
      existing.level = Math.max(existing.level, level);
      existing.remaining = 5 + level;
      return;
    }
    this.poisons.push({
      level,
      sourceBall,
      remaining: 5 + level,
      timer: 0.5
    });
  }

  takeDamage(amount) {
    this.hp -= amount;
    return this.hp <= 0;
  }

  isDestroyed() {
    return this.hp <= 0;
  }

  getTokenDropAmount(sourceBall, bonusAmount = 0) {
    const baseAmount = Math.ceil(this.maxHp / 10);
    return Math.max(1, Math.ceil(baseAmount * (this.definition.tokenMultiplier || 1)) + Math.floor(bonusAmount));
  }

  draw(ctx) {
    const x = this.displayX;
    const y = this.y;
    const w = this.width;
    const h = this.height;
    const colors = this.colorSet;
    const ratio = clamp(this.hp / this.maxHp, 0, 1);
    const r = 3;

    ctx.save();
    roundedRect(ctx, x, y, w, h, r);
    ctx.fillStyle = colors.empty;
    ctx.fill();

    ctx.save();
    roundedRect(ctx, x, y, w, h, r);
    ctx.clip();
    ctx.fillStyle = colors.body;
    ctx.fillRect(x, y, Math.max(1, w * ratio), h);
    if (ratio < 0.995) {
      ctx.fillStyle = "rgba(4,6,16,0.22)";
      ctx.fillRect(x + w * ratio, y, w * (1 - ratio), h);
    }
    ctx.restore();

    if (this.isSpecial) this.drawEffectMark(ctx, x, y, w, h);

    const borderColor = Block.mixColor(colors.accent || colors.body, "#ffffff", this.type === "stone" ? 0.46 : 0.34);

    ctx.globalAlpha = 0.68;
    ctx.strokeStyle = "rgba(0,0,0,0.72)";
    ctx.lineWidth = 3.1;
    roundedRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, r);
    ctx.stroke();

    ctx.strokeStyle = borderColor;
    ctx.globalAlpha = 0.98;
    ctx.lineWidth = 2;
    roundedRect(ctx, x + 0.6, y + 0.6, w - 1.2, h - 1.2, r);
    ctx.stroke();
    ctx.restore();
  }

  drawEffectMark(ctx, x, y, w, h) {
    const cx = x + w * 0.5;
    const cy = y + h * 0.5;
    const icon = Math.min(8, h * 0.32);
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (this.effect === "burst") {
      ctx.beginPath();
      ctx.arc(cx, cy, icon * 0.28, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy - icon);
      ctx.lineTo(cx, cy - icon * 0.52);
      ctx.moveTo(cx, cy + icon * 0.52);
      ctx.lineTo(cx, cy + icon);
      ctx.moveTo(cx - icon, cy);
      ctx.lineTo(cx - icon * 0.52, cy);
      ctx.moveTo(cx + icon * 0.52, cy);
      ctx.lineTo(cx + icon, cy);
      ctx.stroke();
    } else if (this.effect === "column") {
      ctx.fillRect(cx - 1.5, cy - icon, 3, icon * 2);
    } else if (this.effect === "row") {
      ctx.fillRect(cx - icon, cy - 1.5, icon * 2, 3);
    } else if (this.effect === "tokens") {
      ctx.beginPath();
      ctx.moveTo(cx, cy - icon);
      ctx.lineTo(cx + icon * 0.72, cy);
      ctx.lineTo(cx, cy + icon);
      ctx.lineTo(cx - icon * 0.72, cy);
      ctx.closePath();
      ctx.fill();
    } else if (this.effect === "chain") {
      ctx.beginPath();
      ctx.moveTo(cx - icon * 0.45, cy - icon * 0.9);
      ctx.lineTo(cx + icon * 0.28, cy - icon * 0.1);
      ctx.lineTo(cx - icon * 0.08, cy - icon * 0.1);
      ctx.lineTo(cx + icon * 0.45, cy + icon * 0.9);
      ctx.stroke();
    } else if (this.effect === "aqua") {
      ctx.beginPath();
      ctx.arc(cx - icon * 0.42, cy, icon * 0.36, 0, Math.PI * 2);
      ctx.arc(cx + icon * 0.42, cy, icon * 0.36, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  static mixColor(from, to, amount = 0.25) {
    const parse = (hex) => {
      const value = String(hex || "#ffffff").replace("#", "");
      if (value.length !== 6) return [255, 255, 255];
      return [
        parseInt(value.slice(0, 2), 16),
        parseInt(value.slice(2, 4), 16),
        parseInt(value.slice(4, 6), 16)
      ];
    };
    const a = parse(from);
    const b = parse(to);
    const t = clamp(amount, 0, 1);
    const mixed = a.map((channel, index) => Math.round(channel + (b[index] - channel) * t));
    return `rgb(${mixed[0]},${mixed[1]},${mixed[2]})`;
  }
}

Block.nextId = 1;
Block.types = {
  stone: {
    effect: null,
    hpMultiplier: 1,
    tokenMultiplier: 1,
    colors: {
      body: "#2a2a3e",
      empty: "#151523",
      accent: "#2a2a3e"
    }
  },
  burst: {
    effect: "burst",
    hpMultiplier: 1.35,
    tokenMultiplier: 1,
    colors: {
      body: "#d5a83a",
      empty: "#3b301d",
      accent: "#d5a83a"
    }
  },
  column: {
    effect: "column",
    hpMultiplier: 1.3,
    tokenMultiplier: 1,
    colors: {
      body: "#d53a6a",
      empty: "#3b1d2b",
      accent: "#d53a6a"
    }
  },
  row: {
    effect: "row",
    hpMultiplier: 1.3,
    tokenMultiplier: 1,
    colors: {
      body: "#3a7bd5",
      empty: "#1b2b48",
      accent: "#3a7bd5"
    }
  },
  tokens: {
    effect: "tokens",
    hpMultiplier: 1.2,
    tokenMultiplier: 4,
    colors: {
      body: "#3ad57a",
      empty: "#1d3b2b",
      accent: "#3ad57a"
    }
  },
  chain: {
    effect: "chain",
    hpMultiplier: 1.4,
    tokenMultiplier: 1,
    colors: {
      body: "#8a3ad5",
      empty: "#2c1d42",
      accent: "#8a3ad5"
    }
  },
  aqua: {
    effect: "aqua",
    hpMultiplier: 1.25,
    tokenMultiplier: 1,
    colors: {
      body: "#3ad5d5",
      empty: "#1a3a40",
      accent: "#3ad5d5"
    }
  }
};

Block.coloredTypes = ["row", "chain", "tokens", "burst", "column", "aqua"];
