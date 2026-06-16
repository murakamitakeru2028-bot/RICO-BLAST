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
    this.gridSpanRows = Math.max(1, this.definition.gridSpanRows || 1);
    this.gridSpanCols = Math.max(1, this.definition.gridSpanCols || 1);
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
    this.extraY = 0;
    this.diveRemaining = 0;
    this.diveMax = 0;
    this.diveTrail = [];
    this.regenTimer = 0.5;
    this.spawnTimer = 10;
    this.hasSpawnedBlock = false;
    this.armorFlashTimer = 0;
    this.healFlashTimer = 0;
    this.spawnFlashTimer = 0;
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
    this.updateTimers(dt);
    this.updateDive(game, dt);
    this.updateRegen(game, dt);
    this.updateSpawner(game, dt);
    this.updatePoison(game, dt);
  }

  updateTimers(dt) {
    this.armorFlashTimer = Math.max(0, this.armorFlashTimer - dt);
    this.healFlashTimer = Math.max(0, this.healFlashTimer - dt);
    this.spawnFlashTimer = Math.max(0, this.spawnFlashTimer - dt);
    if (this.diveRemaining <= 0 && this.diveTrail.length > 0) this.diveTrail.pop();
  }

  updateDive(game, dt) {
    if (this.diveRemaining <= 0) return;
    const frame = dt * 60;
    const rowPitch = game && game.getBlockRowPitch ? game.getBlockRowPitch() : Math.max(1, this.height);
    const divingForever = !Number.isFinite(this.diveRemaining);
    const amount = divingForever
      ? (this.descendSpeed || 0.09) * 3 * frame
      : Math.min(this.diveRemaining, (this.descendSpeed || 0.09) * 3 * frame);
    if (amount <= 0) return;

    this.diveTrail.unshift({
      x: this.displayX,
      y: this.y,
      width: this.width,
      height: this.height
    });
    if (this.diveTrail.length > 2) this.diveTrail.pop();

    this.extraY += amount;
    if (!divingForever) this.diveRemaining -= amount;

    while (this.extraY >= rowPitch) {
      this.gridRow += 1;
      this.extraY -= rowPitch;
    }

    if (game && game.getBlockTopY) {
      this.y = game.getBlockTopY(this.gridRow, this.gridSpanRows) + this.extraY;
    } else {
      this.y += amount;
    }

    if (!divingForever && this.diveRemaining <= 0.001) {
      this.diveRemaining = 0;
      this.diveMax = 0;
    }
  }

  startDive(distance, rowPitch) {
    if (this.effect !== "dive" || this.diveRemaining > 0 || this.hp <= 0) return false;
    this.diveRemaining = Number.isFinite(distance)
      ? Math.max(rowPitch || this.height || 1, distance || 0)
      : Infinity;
    this.diveMax = this.diveRemaining;
    this.diveTrail = [];
    return true;
  }

  updateRegen(game, dt) {
    if (this.effect !== "regen" || this.hp <= 0 || this.hp >= this.maxHp) return;
    this.regenTimer -= dt;
    if (this.regenTimer > 0) return;
    this.regenTimer += 0.5;
    const healed = this.heal(this.maxHp * 0.02);
    if (healed > 0 && game && typeof Effects !== "undefined" && Effects.spawnBlockRegen) {
      Effects.spawnBlockRegen(this.cx, this.cy);
    }
  }

  updateSpawner(game, dt) {
    if (this.effect !== "spawner" || this.hasSpawnedBlock || this.hp <= 0) return;
    this.spawnTimer = Math.max(0, this.spawnTimer - dt);
    if (this.spawnTimer > 0) return;
    this.hasSpawnedBlock = true;
    if (game && game.spawnNormalBlockNear) game.spawnNormalBlockNear(this);
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
        poison.timer = skillParam("poison", poison.level, "interval", 0.5);
        const damage = poison.sourceBall && poison.sourceBall.getSkillDamage
          ? skillDamageByMaxHp(this, "poison", poison.level)
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
      existing.remaining = skillParam("poison", existing.level, "duration", 4);
      return;
    }
    this.poisons.push({
      level,
      sourceBall,
      remaining: skillParam("poison", level, "duration", 4),
      timer: skillParam("poison", level, "interval", 0.5)
    });
  }

  takeDamage(amount) {
    this.hp -= amount;
    return this.hp <= 0;
  }

  heal(amount) {
    const recovery = Math.max(0, Number(amount) || 0);
    if (recovery <= 0 || this.hp <= 0) return 0;
    const before = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + recovery);
    const healed = this.hp - before;
    if (healed > 0) this.healFlashTimer = 0.2;
    return healed;
  }

  isDestroyed() {
    return this.hp <= 0;
  }

  getTokenDropAmount(sourceBall, bonusAmount = 0) {
    const baseAmount = Math.ceil(this.maxHp / 10);
    return Math.max(1, Math.ceil(baseAmount * (this.definition.tokenMultiplier || 1)) + Math.floor(bonusAmount));
  }

  draw(ctx) {
    let x = this.displayX;
    let y = this.y;
    let w = this.width;
    let h = this.height;
    const colors = this.colorSet;
    const ratio = clamp(this.hp / this.maxHp, 0, 1);
    const r = 3;

    ctx.save();
    if (this.spawnFlashTimer > 0) {
      const progress = 1 - clamp(this.spawnFlashTimer / 0.3, 0, 1);
      const scale = clamp(progress, 0.05, 1);
      const cx = x + w / 2;
      const cy = y + h / 2;
      w *= scale;
      h *= scale;
      x = cx - w / 2;
      y = cy - h / 2;
    }

    this.drawSpecialAura(ctx, x, y, w, h, r);
    roundedRect(ctx, x, y, w, h, r);
    ctx.fillStyle = colors.empty;
    ctx.fill();

    ctx.save();
    roundedRect(ctx, x, y, w, h, r);
    ctx.clip();
    ctx.fillStyle = colors.body;
    const fillHeight = h * ratio;
    ctx.fillRect(x, y + h - fillHeight, w, Math.max(1, fillHeight));
    if (ratio < 0.995) {
      ctx.fillStyle = "rgba(4,6,16,0.22)";
      ctx.fillRect(x, y, w, h - fillHeight);
    }
    ctx.restore();

    this.drawHpBar(ctx, x, y, w, h, ratio);

    if (this.effect === "dive" && this.diveRemaining > 0) {
      ctx.globalAlpha = 0.055;
      ctx.fillStyle = "rgba(246,251,255,0.75)";
      roundedRect(ctx, x + 1, y + 1, w - 2, h - 2, r);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (this.armorFlashTimer > 0) {
      ctx.globalAlpha = clamp(this.armorFlashTimer / 0.1, 0, 1) * 0.58;
      ctx.fillStyle = "#ff4a4a";
      roundedRect(ctx, x + 1, y + 1, w - 2, h - 2, r);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (this.healFlashTimer > 0) {
      ctx.globalAlpha = clamp(this.healFlashTimer / 0.2, 0, 1) * 0.42;
      ctx.fillStyle = "#4aff88";
      roundedRect(ctx, x + 1, y + 1, w - 2, h - 2, r);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (this.isSpecial) this.drawEffectMark(ctx, x, y, w, h);

    const borderColor = colors.body;
    const borderWidth = 2;

    ctx.strokeStyle = borderColor;
    ctx.globalAlpha = 0.96;
    ctx.lineWidth = borderWidth;
    roundedRect(ctx, x + 0.6, y + 0.6, w - 1.2, h - 1.2, r);
    ctx.stroke();
    ctx.restore();
  }

  drawHpBar(ctx, x, y, w, h, ratio) {
    const barHeight = this.definition.hpBarHeight || 0;
    if (barHeight <= 0) return;
    const barY = y + h - barHeight;
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "rgba(6,8,16,0.62)";
    ctx.fillRect(x + 2, barY - 1, w - 4, barHeight);
    ctx.fillStyle = this.definition.hpBarColor || this.definition.borderColor || "#f6fbff";
    ctx.fillRect(x + 2, barY - 1, Math.max(1, (w - 4) * ratio), barHeight);
    ctx.restore();
  }

  drawSpecialAura(ctx, x, y, w, h, r) {
    const minimal = typeof Game !== "undefined" && Game.isMinimalModeEnabled && Game.isMinimalModeEnabled();
    const pulse = 0.5 + Math.sin(this.age * Math.PI) * 0.5;
    if (this.effect === "regen") {
      ctx.save();
      ctx.globalAlpha = 0.4 + pulse * 0.6;
      if (!minimal) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#4aff88";
      }
      ctx.strokeStyle = "rgba(74,255,136,0.42)";
      ctx.lineWidth = 1;
      roundedRect(ctx, x - 2, y - 2, w + 4, h + 4, r + 2);
      ctx.stroke();
      ctx.restore();
      return;
    }

    if (this.effect === "healBurst") {
      ctx.save();
      ctx.globalAlpha = 0.62;
      if (!minimal) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#ff8844";
      }
      ctx.strokeStyle = "rgba(255,136,68,0.38)";
      ctx.lineWidth = 1;
      roundedRect(ctx, x - 2, y - 2, w + 4, h + 4, r + 2);
      ctx.stroke();
      ctx.restore();
      return;
    }

    if (this.effect === "spawner") {
      ctx.save();
      const spread = 4 + pulse * 10;
      ctx.globalAlpha = 0.22 + pulse * 0.18;
      if (!minimal) {
        ctx.shadowBlur = 6 + pulse * 8;
        ctx.shadowColor = "#aa66ff";
      }
      ctx.strokeStyle = "rgba(170,102,255,0.46)";
      ctx.lineWidth = 1;
      roundedRect(ctx, x - spread, y - spread, w + spread * 2, h + spread * 2, r + spread);
      ctx.stroke();
      ctx.restore();
      return;
    }

    if (this.effect === "dive" && this.diveRemaining > 0) {
      ctx.save();
      ctx.strokeStyle = "rgba(246,251,255,0.38)";
      ctx.lineWidth = 1;
      for (let i = this.diveTrail.length - 1; i >= 0; i -= 1) {
        const trail = this.diveTrail[i];
        ctx.globalAlpha = 0.085 * (1 - i * 0.34);
        roundedRect(ctx, trail.x + 6, trail.y + 3, trail.width - 12, trail.height - 6, r);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  drawEffectMark(ctx, x, y, w, h) {
    const cx = x + w * 0.5;
    const cy = y + h * 0.5;
    const icon = Math.min(10, h * 0.34);
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (this.effect === "heavy") {
      const barWidth = clamp(Math.min(w, h) * 0.12, 3, 7);
      const barHeight = Math.min(h * 0.56, 44);
      ctx.fillStyle = "rgba(255,255,255,0.58)";
      ctx.fillRect(cx - barWidth * 1.35, cy - barHeight / 2, barWidth, barHeight);
      ctx.fillRect(cx + barWidth * 0.35, cy - barHeight / 2, barWidth, barHeight);
    } else if (this.effect === "armor") {
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.beginPath();
      ctx.moveTo(cx, cy - icon * 1.05);
      ctx.lineTo(cx + icon * 0.95, cy + icon * 0.75);
      ctx.lineTo(cx - icon * 0.95, cy + icon * 0.75);
      ctx.closePath();
      ctx.stroke();
    } else if (this.effect === "dive") {
      ctx.globalAlpha = this.diveRemaining > 0 ? 0.62 : 0.36;
      ctx.beginPath();
      ctx.moveTo(cx, y + h - icon * 0.45);
      ctx.lineTo(cx + icon * 0.75, y + h - icon * 1.3);
      ctx.lineTo(cx - icon * 0.75, y + h - icon * 1.3);
      ctx.closePath();
      ctx.fill();
    } else if (this.effect === "regen") {
      ctx.strokeStyle = "#4aff88";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(cx - icon * 0.65, cy);
      ctx.lineTo(cx + icon * 0.65, cy);
      ctx.moveTo(cx, cy - icon * 0.65);
      ctx.lineTo(cx, cy + icon * 0.65);
      ctx.stroke();
    } else if (this.effect === "healBurst") {
      ctx.fillStyle = "#ff8844";
      ctx.font = `900 ${Math.max(12, Math.min(18, h * 0.52))}px 'Space Mono', monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("!", cx, cy + 0.5);
    } else if (this.effect === "spawner") {
      const seconds = Math.max(0, Math.ceil(this.spawnTimer));
      const urgent = !this.hasSpawnedBlock && seconds <= 3;
      if (urgent) ctx.globalAlpha = 0.35 + Math.sin(this.age * Math.PI * 8) * 0.25 + 0.4;
      ctx.fillStyle = urgent ? "#ff4a4a" : "#aa66ff";
      ctx.font = `800 ${Math.max(9, Math.min(11, h * 0.36))}px 'Space Mono', monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.hasSpawnedBlock ? "+" : String(seconds), cx, cy);
    } else if (this.effect === "burst") {
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
      body: "#34344a",
      empty: "#1d1d2e",
      accent: "#34344a"
    }
  },
  heavyS: {
    effect: "heavy",
    hpMultiplier: 4,
    tokenMultiplier: 1,
    gridSpanRows: 2,
    gridSpanCols: 1,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.4)",
    colors: {
      body: "#34344a",
      empty: "#1d1d2e",
      accent: "#f6fbff"
    }
  },
  heavyM: {
    effect: "heavy",
    hpMultiplier: 9,
    tokenMultiplier: 1,
    gridSpanRows: 3,
    gridSpanCols: 1,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.4)",
    colors: {
      body: "#34344a",
      empty: "#1d1d2e",
      accent: "#f6fbff"
    }
  },
  heavyL: {
    effect: "heavy",
    hpMultiplier: 16,
    tokenMultiplier: 1,
    gridSpanRows: 2,
    gridSpanCols: 2,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.4)",
    colors: {
      body: "#34344a",
      empty: "#1d1d2e",
      accent: "#f6fbff"
    }
  },
  armor: {
    effect: "armor",
    hpMultiplier: 1,
    tokenMultiplier: 1,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
    colors: {
      body: "#1e2a3a",
      empty: "#101722",
      accent: "#f6fbff"
    }
  },
  dive: {
    effect: "dive",
    hpMultiplier: 1,
    tokenMultiplier: 1,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    colors: {
      body: "#34344a",
      empty: "#1d1d2e",
      accent: "#f6fbff"
    }
  },
  regen: {
    effect: "regen",
    hpMultiplier: 1,
    tokenMultiplier: 1,
    borderWidth: 2,
    borderColor: "#ff4a4a",
    colors: {
      body: "#1a2a1a",
      empty: "#0f1a10",
      accent: "#7cf5b2"
    }
  },
  exploder: {
    effect: "healBurst",
    hpMultiplier: 1,
    tokenMultiplier: 1,
    borderWidth: 2,
    borderColor: "#ff4a4a",
    colors: {
      body: "#2a1a0a",
      empty: "#171008",
      accent: "#ff8844"
    }
  },
  spawner: {
    effect: "spawner",
    hpMultiplier: 1,
    tokenMultiplier: 1,
    borderWidth: 2,
    borderColor: "#ff4a4a",
    colors: {
      body: "#1a0a2a",
      empty: "#100719",
      accent: "#aa66ff"
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

Block.specialTypes = ["heavyS", "heavyM", "heavyL", "armor", "dive", "regen", "exploder", "spawner"];
Block.heavyTypes = ["heavyS", "heavyM", "heavyL"];
Block.coloredTypes = ["row", "chain", "tokens", "burst", "column", "aqua"];
