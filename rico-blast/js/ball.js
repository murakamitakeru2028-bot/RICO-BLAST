class Ball {
  constructor(x, y, color) {
    this.id = Ball.nextId;
    Ball.nextId += 1;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = 10;
    this.color = color || "#ffffff";
    this.skills = [];
    this.upgrades = {
      speed: 0,
      damage: 0,
      reviveSpeed: 0,
      critRate: 0
    };
    this.alive = true;
    this.waitingLaunch = false;
    this.reviveTimer = 0;
    this.baseReviveTime = 10;
    this.starCount = 0;
    this.baseDamageBonus = 0;
    this.hitCooldowns = new Map();
    this.blockHitCounts = new Map();
    this.paddlelessHits = 0;
    this.penetrationLeft = 0;
    this.fallSaves = 0;
    this.sprintTimer = 0;
    this.berserkTimer = 0;
    this.reboundBonus = 0;
    this.firstHitAfterPaddle = true;
    this.damageBoostTimer = 0;
    this.damageBoostMultiplier = 1;
    this.shatterTimer = 0;
    this.auraTimer = 0;
    this.echoTimer = 0;
    this.mirrorTimer = 0;
    this.cycleTimer = 0;
    this.cycleEffect = null;
    this.spreadUsed = false;
    this.path = [];
  }

  launch(x, y) {
    this.x = x;
    this.y = y;
    this.alive = true;
    this.waitingLaunch = false;
    this.reviveTimer = 0;
    this.vx = rand(-3, 3);
    if (Math.abs(this.vx) < 1) this.vx = this.vx < 0 ? -1.2 : 1.2;
    this.vy = -5;
    this.penetrationLeft = getSkillLevel(this, "penetration") + (getSkillLevel(this, "focus") >= 5 ? 1 : 0);
    this.fallSaves = Math.min(3, Math.ceil(getSkillLevel(this, "immortality") / 2));
    this.firstHitAfterPaddle = true;
    this.paddlelessHits = 0;
    this.spreadUsed = false;
    this.path = [];
    this.normalizeSpeed(this.getTargetSpeed());
  }

  respawn(game) {
    this.readyOnPaddle(game);
    Effects.showBallRevive(this.x, this.y, this.getPrimaryColor());
  }

  readyOnPaddle(game) {
    this.alive = false;
    this.waitingLaunch = true;
    this.reviveTimer = 0;
    this.vx = 0;
    this.vy = 0;
    this.hitCooldowns.clear();
    this.blockHitCounts.clear();
    this.firstHitAfterPaddle = true;
    this.paddlelessHits = 0;
    this.path = [];
    this.followPaddleLaunchPosition(game, 0, 1);
  }

  followPaddleLaunchPosition(game, index = 0, total = 1) {
    const width = game.paddle.getWidth();
    const spacing = Math.min(26, Math.max(18, width / Math.max(2, total + 1)));
    const center = game.paddle.x + width / 2;
    const x = center + (index - (total - 1) / 2) * spacing;
    this.x = clamp(x, this.radius, game.width - this.radius);
    this.y = game.paddle.y - this.radius - 2;
  }

  launchFromPaddle(game) {
    if (!this.waitingLaunch) return false;
    this.launch(this.x, this.y);
    const berserker = getSkillLevel(this, "berserker");
    if (berserker > 0) {
      this.berserkTimer = 10 + berserker * 2;
      Effects.showPopup("BERSERK", this.x, this.y - 16, SKILLS.berserker.color);
    }
    Effects.showBallRevive(this.x, this.y, this.getPrimaryColor());
    return true;
  }

  update(game, dt) {
    const frame = dt * 60;
    this.tickCooldowns(dt);

    if (this.waitingLaunch) return;

    if (!this.alive) {
      this.reviveTimer -= dt;
      if (this.reviveTimer <= 0) this.respawn(game);
      return;
    }

    this.sprintTimer = Math.max(0, this.sprintTimer - dt);
    this.berserkTimer = Math.max(0, this.berserkTimer - dt);
    this.damageBoostTimer = Math.max(0, this.damageBoostTimer - dt);
    if (this.damageBoostTimer <= 0) this.damageBoostMultiplier = 1;

    this.applyPassiveSkills(game, dt);
    const moveX = this.vx * frame;
    const moveY = this.vy * frame;
    const stepSize = Math.max(4, this.radius * 0.5);
    const steps = clamp(Math.ceil(Math.max(Math.abs(moveX), Math.abs(moveY)) / stepSize), 1, 10);
    const stepFrame = frame / steps;

    for (let i = 0; i < steps; i += 1) {
      if (!this.alive || this.waitingLaunch) break;
      const prevX = this.x;
      const prevY = this.y;
      this.x += this.vx * stepFrame;
      this.y += this.vy * stepFrame;
      this.checkWalls(game);
      this.checkPaddle(game, prevX, prevY);
      this.checkBumper(game, prevX, prevY);
      this.checkBlocks(game, prevX, prevY);
    }
    this.recordPath();
  }

  tickCooldowns(dt) {
    for (const [id, value] of this.hitCooldowns.entries()) {
      const next = value - dt;
      if (next <= 0) this.hitCooldowns.delete(id);
      else this.hitCooldowns.set(id, next);
    }
  }

  applyPassiveSkills(game, dt) {
    for (const equipped of this.skills) {
      const definition = SKILLS[equipped.id];
      if (definition && definition.applyEffect) definition.applyEffect(this, game, equipped.level);
    }

    const focus = getSkillLevel(this, "focus");
    if (focus > 0) {
      const target = game.findHighestHpBlock();
      if (target) steerBallToward(this, target.cx, target.cy, 0.006 * focus);
    }

    const aura = getSkillLevel(this, "aura");
    if (aura > 0) {
      this.auraTimer -= dt;
      if (this.auraTimer <= 0) {
        this.auraTimer = 0.1;
        game.applyAreaDamage(this.x, this.y, 40 + aura * 10, this.getSkillDamage(game, aura, "aura"), this, null, "aura");
      }
    }

    const shatter = getSkillLevel(this, "shatter");
    if (shatter > 0) {
      this.shatterTimer -= dt;
      if (this.shatterTimer <= 0) {
        this.shatterTimer = 0.5;
        const threshold = 0.12 + shatter * 0.04;
        const target = game.blocks.find((block) =>
          block.hp / block.maxHp <= threshold &&
          distance(this.x, this.y, block.cx, block.cy) < 86 + shatter * 18
        );
        if (target) {
          game.spawnProjectile(this.x, this.y, target.cx, target.cy, 7, this.getSkillDamage(game, shatter, "shard"), this, "#ff4a4a", 4);
        }
      }
    }

    const echo = getSkillLevel(this, "echo");
    if (echo > 0) {
      this.echoTimer -= dt;
      if (this.echoTimer <= 0) {
        this.echoTimer = 0.12;
        game.addZone({
          kind: "echo",
          x: this.x,
          y: this.y,
          radius: 8 + echo * 2,
          life: echo,
          maxLife: echo,
          damage: this.getSkillDamage(game, echo, "aura"),
          tick: 0.2,
          tickTimer: 0,
          color: SKILLS.echo.color,
          sourceBall: this
        });
      }
    }

    const mirror = getSkillLevel(this, "mirror");
    if (mirror > 0) {
      this.mirrorTimer -= dt;
      if (this.mirrorTimer <= 0) {
        this.mirrorTimer = Math.max(0.35, 1.1 - mirror * 0.12);
        game.spawnProjectile(this.x, this.y, -this.vx, this.vy, 4.2, this.getSkillDamage(game, mirror, "shard"), this, SKILLS.mirror.color, 0, true);
      }
    }

    const cycle = getSkillLevel(this, "cycle");
    if (cycle > 0) {
      this.cycleTimer -= dt;
      if (this.cycleTimer <= 0) {
        const effects = ["splash", "lightning", "damage"];
        this.cycleEffect = effects[randomInt(0, effects.length - 1)];
        this.cycleTimer = Math.max(1, 5 - cycle);
        Effects.showPopup("CYCLE", this.x, this.y - 16, SKILLS.cycle.color);
      }
    }

    this.normalizeSpeed(this.getTargetSpeed());
  }

  checkWalls(game) {
    let bounced = false;
    if (this.x - this.radius <= 0) {
      this.x = this.radius;
      this.vx = Math.abs(this.vx);
      bounced = true;
    }
    if (this.x + this.radius >= game.width) {
      this.x = game.width - this.radius;
      this.vx = -Math.abs(this.vx);
      bounced = true;
    }
    if (this.y - this.radius <= 0) {
      this.y = this.radius;
      this.vy = Math.abs(this.vy);
      bounced = true;
    }
    if (bounced) AudioSystem.playWallBounce();
    if (this.y - this.radius > game.height) this.onFall(game);
  }

  checkPaddle(game, prevX = this.x, prevY = this.y) {
    const paddle = game.paddle;
    const width = paddle.getWidth();
    if (this.vy <= 0) return;
    const rect = {
      x: paddle.x,
      y: paddle.y,
      width,
      height: paddle.height
    };
    const collision = getCircleRectCollision(prevX, prevY, this.x, this.y, this.radius, rect);
    if (!collision || collision.normalY > 0) return;
    const crossedTop = prevY + this.radius <= paddle.y + 1 || collision.normalY < 0;
    if (!crossedTop) return;

    const center = paddle.x + width / 2;
    const offset = clamp((this.x - center) / (width / 2), -1, 1);
    this.x = clamp(this.x, paddle.x + this.radius, paddle.x + width - this.radius);
    this.y = paddle.y - this.radius - 0.5;
    this.vx = offset * 5;
    this.vy = -Math.abs(this.vy || 5);
    this.firstHitAfterPaddle = true;
    this.paddlelessHits = 0;
    game.combo = 0;
    this.penetrationLeft = getSkillLevel(this, "penetration") + (getSkillLevel(this, "focus") >= 5 ? 1 : 0);
    this.fallSaves = Math.min(3, Math.ceil(getSkillLevel(this, "immortality") / 2));
    this.spreadUsed = false;

    const sprint = getSkillLevel(this, "sprint");
    if (sprint > 0) this.sprintTimer = 2;

    const rebound = getSkillLevel(this, "rebound");
    if (rebound > 0) this.reboundBonus += rebound * 0.2;

    const bounceHeal = getSkillLevel(paddle, "bounceHeal");
    if (bounceHeal > 0) game.healPaddle(bounceHeal, this.x, paddle.y);

    const superBounce = getSkillLevel(paddle, "superBounce");
    if (superBounce > 0 && Math.random() < 0.08 + superBounce * 0.07) {
      this.damageBoostTimer = 1.8;
      this.damageBoostMultiplier = 1.4 + superBounce * 0.15;
      this.vy *= 1.08;
      Effects.showPopup("SUPER", this.x, this.y - 18, SKILLS.superBounce.color);
    }

    const teleporter = getSkillLevel(this, "teleporter");
    if (teleporter > 0 && Math.random() < 0.1 + teleporter * 0.1) {
      const anchor = game.findDenseBlockAnchor();
      if (anchor) {
        this.x = clamp(anchor.x, this.radius, game.width - this.radius);
        this.y = clamp(anchor.y + 36, this.radius, game.height - 90);
        this.vy = -Math.abs(this.vy);
        Effects.showPopup("WARP", this.x, this.y - 18, SKILLS.teleporter.color);
      }
    }

    paddle.bounce();
    AudioSystem.playPaddle();
    Effects.shakeScreen(1.5, 0.08);
    this.normalizeSpeed(this.getTargetSpeed());
  }

  checkBumper(game, prevX = this.x, prevY = this.y) {
    if (!game.bumper || !game.bumper.hit(game, this, prevX, prevY)) return;
    this.paddlelessHits = 0;
    game.combo = 0;
    this.blockHitCounts.clear();
  }

  checkBlocks(game, prevX = this.x, prevY = this.y) {
    let hits = 0;
    const collisions = [];
    for (const block of game.blocks) {
      if (!this.alive || hits >= 3) break;
      if (this.hitCooldowns.has(block.id)) continue;
      const collision = getCircleRectCollision(prevX, prevY, this.x, this.y, this.radius, block.collisionRect);
      if (!collision) continue;
      collisions.push({ block, collision });
    }
    collisions.sort((a, b) => a.collision.t - b.collision.t);
    for (const { block, collision } of collisions) {
      if (!this.alive || hits >= 3) break;
      if (!game.blocks.includes(block) || this.hitCooldowns.has(block.id)) continue;
      this.hitBlock(game, block, collision);
      hits += 1;
    }
  }

  hitBlock(game, block, collision = null) {
    this.hitCooldowns.set(block.id, 0.08);
    game.registerHit(this, block);
    const damage = this.getDamage(game, block);
    const destroyed = game.damageBlock(block, damage, this, "ball");

    const poison = getSkillLevel(this, "poison");
    if (poison > 0 && !destroyed) block.addPoison(poison, this);

    const detonator = getSkillLevel(this, "detonator");
    if (detonator > 0) {
      this.detCounter = (this.detCounter || 0) + 1;
      if (this.detCounter >= 3) {
        this.detCounter = 0;
        game.applyAreaDamage(block.cx, block.cy, 46 + detonator * 7, this.getSkillDamage(game, detonator, "burst"), this, block, "detonator");
        Effects.shakeScreen(2.5, 0.12);
      }
    }

    const doubleChance = getSkillLevel(this, "doubleChance");
    if (!destroyed && doubleChance > 0 && Math.random() < doubleChance * 0.1) {
      game.damageBlock(block, damage * 0.75, this, "double");
      Effects.showPopup("DOUBLE", block.cx, block.cy, SKILLS.doubleChance.color);
    }

    if (this.shouldPenetrate()) {
      this.penetrationLeft -= 1;
    } else {
      this.reflectFromBlock(block, collision);
    }
  }

  getDamage(game, block) {
    let damage = this.getBaseDamage(game);
    damage *= this.damageBoostTimer > 0 ? this.damageBoostMultiplier : 1;

    if (this.berserkTimer > 0) {
      const level = getSkillLevel(this, "berserker");
      damage *= 1.5 + level * 0.2;
    }

    const impact = getSkillLevel(this, "impact");
    if (impact > 0 && this.firstHitAfterPaddle) {
      damage *= 2 + impact * 0.3;
      this.firstHitAfterPaddle = false;
      Effects.showPopup("IMPACT", block.cx, block.cy - 12, SKILLS.impact.color);
    }

    const crash = getSkillLevel(this, "crash");
    if (crash > 0) {
      const speedRatio = clamp(this.getCurrentSpeed() / Math.max(1, this.getBaseSpeed()), 0.8, 1.9);
      damage *= 1 + crash * 0.055 * speedRatio;
    }

    const overload = getSkillLevel(this, "overload");
    if (overload > 0) {
      const count = (this.blockHitCounts.get(block.id) || 0) + 1;
      this.blockHitCounts.set(block.id, count);
      damage *= 1 + count * 0.2 * overload;
    }

    const expert = getSkillLevel(this, "expert");
    if (expert > 0) damage *= 1 + getAverageSkillLevel(this) * 0.03 * expert;

    if (this.reboundBonus > 0) {
      damage *= 1 + this.reboundBonus;
      this.reboundBonus = 0;
    }

    if (this.cycleEffect === "damage") damage *= 1.25;

    const critChance = this.upgrades.critRate * 0.05;
    if (Math.random() < critChance) {
      damage *= 2;
      Effects.showPopup("CRITICAL!", block.cx, block.cy - 14, "#ffffff");
    }

    return damage;
  }

  getBaseDamage(game = null) {
    let damage = 100 + this.baseDamageBonus + this.upgrades.damage * 50;
    const paddle = game && game.paddle ? game.paddle : (typeof Game !== "undefined" ? Game.paddle : null);
    damage *= 1 + getSkillLevel(paddle, "globalDamage") * 0.12;
    return damage;
  }

  getSkillDamage(game, level, profile = "projectile") {
    const curves = {
      aura: { base: 0.007, perLevel: 0.003 },
      dot: { base: 0.016, perLevel: 0.006 },
      shard: { base: 0.045, perLevel: 0.017 },
      projectile: { base: 0.07, perLevel: 0.025 },
      chain: { base: 0.09, perLevel: 0.032 },
      line: { base: 0.1, perLevel: 0.035 },
      area: { base: 0.11, perLevel: 0.04 },
      sniper: { base: 0.14, perLevel: 0.045 },
      burst: { base: 0.16, perLevel: 0.05 }
    };
    const curve = curves[profile] || curves.projectile;
    const safeLevel = clamp(Math.floor(level || 1), 1, 5);
    const scale = curve.base + curve.perLevel * (safeLevel - 1);
    return Math.max(1, Math.round(this.getBaseDamage(game) * scale));
  }

  shouldPenetrate() {
    return this.penetrationLeft > 0;
  }

  reflectFromBlock(block, collision = null) {
    let normalX = collision ? collision.normalX : 0;
    let normalY = collision ? collision.normalY : 0;

    if (!normalX && !normalY) {
      const dx = this.x - block.cx;
      const dy = this.y - block.cy;
      const nx = Math.abs(dx / Math.max(1, block.width / 2));
      const ny = Math.abs(dy / Math.max(1, block.height / 2));
      if (nx > ny) normalX = dx < 0 ? -1 : 1;
      else normalY = dy < 0 ? -1 : 1;
    }

    const rect = block.collisionRect;
    if (normalX < 0) this.x = rect.x - this.radius - 0.5;
    else if (normalX > 0) this.x = rect.x + rect.width + this.radius + 0.5;
    if (normalY < 0) this.y = rect.y - this.radius - 0.5;
    else if (normalY > 0) this.y = rect.y + rect.height + this.radius + 0.5;

    const dot = this.vx * normalX + this.vy * normalY;
    if (dot < 0) {
      this.vx -= 2 * dot * normalX;
      this.vy -= 2 * dot * normalY;
    } else if (normalX !== 0) {
      this.vx = normalX < 0 ? -Math.abs(this.vx || 2) : Math.abs(this.vx || 2);
    } else {
      this.vy = normalY < 0 ? -Math.abs(this.vy || 5) : Math.abs(this.vy || 5);
    }
    this.normalizeSpeed(this.getTargetSpeed());
  }

  onFall(game) {
    const immortality = getSkillLevel(this, "immortality");
    if (immortality > 0 && this.fallSaves > 0) {
      this.fallSaves -= 1;
      this.y = game.height - this.radius - 3;
      this.vy = -Math.abs(this.vy || 5);
      if (immortality >= 3) this.damageBoostTimer = 1;
      if (immortality >= 3) this.damageBoostMultiplier = 1 + immortality * 0.12;
      Effects.showPopup("REVOLT", this.x, this.y - 16, SKILLS.immortality.color);
      return;
    }

    const spread = getSkillLevel(this, "spread");
    if (spread > 0 && !this.spreadUsed) {
      this.spreadUsed = true;
      const count = 3 + spread;
      const damage = this.getSkillDamage(game, spread, "projectile");
      for (let i = 0; i < count; i += 1) {
        const angle = Math.PI * (1.08 + (i / Math.max(1, count - 1)) * 0.84);
        game.spawnProjectile(this.x, game.height - 18, Math.cos(angle), Math.sin(angle), 6, damage, this, SKILLS.spread.color, 0, true);
      }
    }

    const phantom = getSkillLevel(this, "phantom");
    if (phantom > 0 && this.path.length > 4) {
      const repeats = 1 + Math.floor(phantom / 2);
      const damage = this.getSkillDamage(game, phantom, "projectile");
      for (let i = 0; i < repeats; i += 1) {
        const point = this.path[Math.max(0, this.path.length - 10 - i * 6)];
        game.spawnProjectile(point.x, point.y, -this.vx, -Math.abs(this.vy), 5, damage, this, SKILLS.phantom.color, 0, true);
      }
    }

    this.alive = false;
    this.reviveTimer = this.getReviveTime(game);
    this.y = game.height + this.radius + 1;
    game.combo = 0;
    this.paddlelessHits = 0;
    this.blockHitCounts.clear();
  }

  getReviveTime(game) {
    const localReduction = this.upgrades.reviveSpeed * 1.1;
    const globalReduction = getSkillLevel(game.paddle, "reviveBoost") * 0.8;
    const speedPenalty = this.upgrades.speed * 0.4;
    const damagePenalty = this.upgrades.damage * 0.5;
    return Math.max(2.5, this.baseReviveTime - localReduction - globalReduction + speedPenalty + damagePenalty);
  }

  getBaseSpeed() {
    return 5 + this.upgrades.speed * 0.45;
  }

  getTargetSpeed() {
    let speed = this.getBaseSpeed();
    speed *= 1 + getSkillLevel(Game.paddle, "globalSpeed") * 0.08;
    if (this.sprintTimer > 0) speed *= 1.5 + getSkillLevel(this, "sprint") * 0.1;
    if (this.berserkTimer > 0) speed *= 1.08 + getSkillLevel(this, "berserker") * 0.05;
    return speed;
  }

  getCurrentSpeed() {
    return Math.hypot(this.vx, this.vy);
  }

  normalizeSpeed(targetSpeed) {
    const current = this.getCurrentSpeed();
    if (current < 0.001) {
      this.vx = rand(-1, 1);
      this.vy = -targetSpeed;
      return;
    }
    this.vx = (this.vx / current) * targetSpeed;
    this.vy = (this.vy / current) * targetSpeed;
  }

  recordPath() {
    this.path.push({ x: this.x, y: this.y });
    if (this.path.length > 36) this.path.shift();
  }

  checkCarveCondition() {
    return getTotalStars(this) >= 10;
  }

  carveSkills() {
    const totalStars = getTotalStars(this);
    if (totalStars < 10) return false;
    this.baseDamageBonus += totalStars * 2;
    this.skills = [];
    this.color = "#ffffff";
    this.starCount = 0;
    return true;
  }

  getPrimaryColor() {
    if (this.skills.length === 0) return this.color || "#ffffff";
    return this.skills[0].color;
  }

  draw(ctx) {
    if (!this.alive && !this.waitingLaunch) return;
    const mirror = getSkillLevel(this, "mirror");
    if (!this.waitingLaunch && mirror > 0 && this.path.length > 2) this.drawMirror(ctx, mirror);

    ctx.save();
    if (this.skills.length === 0) {
      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur = 5;
      ctx.shadowColor = "rgba(255,255,255,0.6)";
    } else if (this.skills.length === 1) {
      ctx.fillStyle = this.skills[0].color;
      ctx.shadowBlur = 6;
      ctx.shadowColor = `${this.skills[0].color}66`;
    } else {
      const gradient = ctx.createLinearGradient(
        this.x - this.radius * 0.95,
        this.y - this.radius * 0.95,
        this.x + this.radius * 0.95,
        this.y + this.radius * 0.95
      );
      const colors = this.skills.map((skill) => skill.color);
      colors.forEach((color, index) => {
        gradient.addColorStop(index / Math.max(1, colors.length - 1), color);
      });
      ctx.fillStyle = gradient;
      ctx.shadowBlur = 6;
      ctx.shadowColor = `${colors[0]}66`;
    }
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,0.24)";
    ctx.lineWidth = 1.25;
    ctx.stroke();
    ctx.restore();

    if (this.waitingLaunch) this.drawLaunchReady(ctx);
  }

  drawLaunchReady(ctx) {
    const pulse = 0.5 + Math.sin(performance.now() / 130) * 0.18;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = this.getPrimaryColor();
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = pulse * 0.8;
    ctx.fillStyle = this.getPrimaryColor();
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - this.radius - 15);
    ctx.lineTo(this.x - 4, this.y - this.radius - 7);
    ctx.lineTo(this.x + 4, this.y - this.radius - 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawMirror(ctx, level) {
    const length = Math.min(this.path.length, 8 + level * 3);
    ctx.save();
    for (let i = 0; i < length; i += 1) {
      const point = this.path[this.path.length - 1 - i];
      const alpha = (1 - i / length) * (0.08 + level * 0.025);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = SKILLS.mirror.color;
      ctx.beginPath();
      ctx.arc(point.x - this.vx * 2, point.y + this.vy * 2, this.radius * 0.85, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

Ball.nextId = 1;
