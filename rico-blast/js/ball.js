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
    this.penetrationDamageLeft = 0;
    this.fallSaves = 0;
    this.sprintTimer = 0;
    this.berserkTimer = 0;
    this.reboundBonus = 0;
    this.firstHitAfterPaddle = true;
    this.damageBoostTimer = 0;
    this.damageBoostMultiplier = 1;
    this.auraTimer = 0;
    this.echoTimer = 0;
    this.mirrorTimer = 0;
    this.cycleTimer = 0;
    this.cycleEffect = null;
    this.cycleIndex = 0;
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
    this.penetrationLeft = getSkillLevel(this, "penetration");
    this.penetrationDamageLeft = 0;
    this.fallSaves = skillParam("immortality", getSkillLevel(this, "immortality"), "saves", 0);
    this.firstHitAfterPaddle = true;
    this.paddlelessHits = 0;
    this.cycleTimer = 0;
    this.cycleEffect = null;
    this.cycleIndex = 0;
    this.spreadUsed = false;
    this.path = [];
    this.normalizeSpeed(this.getTargetSpeed());
  }

  respawn(game) {
    this.readyOnPaddle(game);
    if (getSkillLevel(this, "phantom") >= skillParam("phantom", getSkillLevel(this, "phantom"), "reviveLevel", 3)) {
      this.spawnPhantomProjectiles(game, true);
    }
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
    this.penetrationDamageLeft = 0;
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
      this.berserkTimer = skillParam("berserker", berserker, "duration", 4);
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
    const stepSize = Math.max(3, this.radius * 0.35);
    const steps = clamp(Math.ceil(Math.max(Math.abs(moveX), Math.abs(moveY)) / stepSize), 1, 18);
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

    const aura = getSkillLevel(this, "aura");
    if (aura > 0) {
      this.auraTimer -= dt;
      if (this.auraTimer <= 0) {
        const auraRadius = skillParam("aura", aura, "radius", 50);
        this.auraTimer = skillParam("aura", aura, "interval", 0.1);
        const hitCount = game.applyAreaDamage(
          this.x,
          this.y,
          auraRadius,
          () => Math.max(1, Math.round(this.getBaseDamage(game) * skillParam("aura", aura, "damage", 0))),
          this,
          null,
          "aura"
        );
        if (hitCount > 0) {
          game.addZone({
            kind: "auraPulse",
            x: this.x,
            y: this.y,
            radius: auraRadius,
            life: 0.18,
            maxLife: 0.18,
            hitCount,
            color: SKILLS.aura.color,
            sourceBall: this
          });
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
          radius: skillParam("echo", echo, "radius", 15),
          life: skillParam("echo", echo, "duration", 3),
          maxLife: skillParam("echo", echo, "duration", 3),
          damage: (block) => skillDamageByMaxHp(block, "echo", echo),
          tick: 0.2,
          tickTimer: 0,
          color: SKILLS.echo.color,
          vx: this.vx,
          vy: this.vy,
          sourceBall: this
        });
      }
    }

    const cycle = getSkillLevel(this, "cycle");
    if (cycle > 0) {
      this.cycleTimer -= dt;
      if (this.cycleTimer <= 0) {
        const effects = ["splash", "lightning", "damage"];
        this.cycleEffect = effects[this.cycleIndex % effects.length];
        this.cycleIndex += 1;
        this.cycleTimer = skillParam("cycle", cycle, "interval", 3);
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
    if (bounced) {
      this.penetrationDamageLeft = 0;
      AudioSystem.playWallBounce();
    }
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
    this.penetrationLeft = getSkillLevel(this, "penetration");
    this.penetrationDamageLeft = 0;
    this.fallSaves = skillParam("immortality", getSkillLevel(this, "immortality"), "saves", 0);
    this.spreadUsed = false;

    const sprint = getSkillLevel(this, "sprint");
    if (sprint > 0) this.sprintTimer = skillParam("sprint", sprint, "duration", 1);

    const rebound = getSkillLevel(this, "rebound");
    if (rebound > 0) this.reboundBonus += skillParam("rebound", rebound, "multiplier", 1) - 1;

    const bounceHeal = getSkillLevel(paddle, "bounceHeal");
    if (bounceHeal > 0) game.healPaddle(Math.max(1, paddle.maxHp * skillParam("bounceHeal", bounceHeal, "percent", 0)), this.x, paddle.y);

    const superBounce = getSkillLevel(paddle, "superBounce");
    if (superBounce > 0 && Math.random() < skillParam("superBounce", superBounce, "chance", 0)) {
      this.damageBoostTimer = skillParam("superBounce", superBounce, "duration", 1);
      this.damageBoostMultiplier = skillParam("superBounce", superBounce, "damageMultiplier", 1);
      this.vy *= 1.08;
      Effects.showPopup("SUPER", this.x, this.y - 18, SKILLS.superBounce.color);
    }

    this.normalizeSpeed(this.getTargetSpeed());
    this.spawnMirrorPaddleClone(game, center, width);

    const teleporter = getSkillLevel(this, "teleporter");
    if (teleporter > 0 && Math.random() < skillParam("teleporter", teleporter, "chance", 0)) {
      const maxTeleportY = game.getTeleporterMaxY ? game.getTeleporterMaxY() : game.height * 0.58;
      const anchor = game.findDenseBlockAnchor(maxTeleportY - 36);
      if (anchor) {
        this.x = clamp(anchor.x, this.radius, game.width - this.radius);
        this.y = clamp(anchor.y + 36, this.radius, maxTeleportY);
        this.vy = -Math.abs(this.vy);
        Effects.showPopup("WARP", this.x, this.y - 18, SKILLS.teleporter.color);
      }
    }

    paddle.bounce();
    AudioSystem.playPaddle();
    Effects.shakeScreen(1.5, 0.08);
    this.normalizeSpeed(this.getTargetSpeed());
  }

  spawnMirrorPaddleClone(game, paddleCenter, paddleWidth) {
    const mirror = getSkillLevel(this, "mirror");
    if (mirror <= 0 || !game || !game.paddle) return;
    const mirroredOffset = -(this.x - paddleCenter);
    const mirrorX = clamp(paddleCenter + mirroredOffset, game.paddle.x + this.radius, game.paddle.x + paddleWidth - this.radius);
    const mirrorY = game.paddle.y - this.radius - 0.5;
    const speed = Math.max(4.2, this.getCurrentSpeed());
    const duration = skillParam("mirror", mirror, "duration", 0.9);
    const maxHits = skillParam("mirror", mirror, "hits", 3);
    game.spawnProjectile(
      mirrorX,
      mirrorY,
      -this.vx,
      this.vy,
      speed,
      (block) => skillDamageByMaxHp(block, "mirror", mirror),
      this,
      SKILLS.mirror.color,
      0,
      true,
      {
        kind: "mirror",
        radius: this.radius,
        alpha: 0.38,
        coreColor: this.getPrimaryColor(),
        life: duration,
        maxHits,
        bounceWalls: true,
        bounceBlocks: true,
        hitSource: "ball"
      }
    );
    Effects.spawnImpactSpark(mirrorX, mirrorY, SKILLS.mirror.color);
  }

  checkBumper(game, prevX = this.x, prevY = this.y) {
    if (!game.bumper || !game.bumper.hit(game, this, prevX, prevY)) return;
    this.paddlelessHits = 0;
    this.penetrationDamageLeft = 0;
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
      const passedThrough = this.hitBlock(game, block, collision);
      hits += 1;
      if (!passedThrough) break;
    }
  }

  hitBlock(game, block, collision = null) {
    this.hitCooldowns.set(block.id, 0.08);
    game.registerHit(this, block);
    const damage = this.penetrationDamageLeft > 0 ? this.penetrationDamageLeft : this.getDamage(game, block);
    const hpBefore = Math.max(0, block.hp);
    const damageOptions = { collision };
    const appliedDamage = game.getBlockDamageAmount ? game.getBlockDamageAmount(block, damage, "ball", damageOptions) : damage;
    const destroyed = game.damageBlock(block, damage, this, "ball", 0, damageOptions);

    const poison = getSkillLevel(this, "poison");
    if (poison > 0 && !destroyed) block.addPoison(poison, this);

    const detonator = getSkillLevel(this, "detonator");
    if (detonator > 0) {
      this.detCounter = (this.detCounter || 0) + 1;
      if (this.detCounter >= skillParam("detonator", detonator, "hits", 3)) {
        this.detCounter = 0;
        game.applyAreaDamage(
          block.cx,
          block.cy,
          skillParam("detonator", detonator, "radius", 40),
          (target) => skillDamageByMaxHp(target, "detonator", detonator),
          this,
          block,
          "detonator"
        );
        Effects.shakeScreen(2.5, 0.12);
      }
    }

    const doubleChance = getSkillLevel(this, "doubleChance");
    if (!destroyed && doubleChance > 0 && Math.random() < skillParam("doubleChance", doubleChance, "chance", 0)) {
      game.damageBlock(block, skillDamageByMaxHp(block, "doubleChance", doubleChance, "damageMultiplier"), this, "double");
      Effects.showPopup("DOUBLE", block.cx, block.cy, SKILLS.doubleChance.color);
    }

    const overflowDamage = destroyed ? Math.max(0, appliedDamage - hpBefore) : 0;
    if (this.consumePenetration(overflowDamage)) return true;

    this.penetrationDamageLeft = 0;
    this.reflectFromBlock(block, collision);
    return false;
  }

  getDamage(game, block) {
    let damage = this.getBaseDamage(game);
    damage *= this.damageBoostTimer > 0 ? this.damageBoostMultiplier : 1;

    if (this.berserkTimer > 0) {
      const level = getSkillLevel(this, "berserker");
      damage *= skillParam("berserker", level, "damageMultiplier", 1);
    }

    const impact = getSkillLevel(this, "impact");
    if (impact > 0 && this.firstHitAfterPaddle) {
      damage *= skillParam("impact", impact, "multiplier", 1);
      this.firstHitAfterPaddle = false;
      Effects.showPopup("IMPACT", block.cx, block.cy - 12, SKILLS.impact.color);
    }

    const crash = getSkillLevel(this, "crash");
    if (crash > 0) {
      const speedRatio = clamp(this.getCurrentSpeed() / Math.max(1, this.getBaseSpeed()), 0.8, 1.9);
      const normalMultiplier = skillParam("crash", crash, "normalMultiplier", 1);
      damage *= Math.min(skillParam("crash", crash, "cap", 1.8), 1 + (normalMultiplier - 1) * speedRatio);
    }

    const overload = getSkillLevel(this, "overload");
    if (overload > 0) {
      const count = (this.blockHitCounts.get(block.id) || 0) + 1;
      this.blockHitCounts.set(block.id, count);
      damage *= Math.min(skillParam("overload", overload, "cap", 5), 1 + count * skillParam("overload", overload, "step", 0.2));
    }

    const expert = getSkillLevel(this, "expert");
    if (expert > 0) damage *= getExpertMultiplier(expert, getAverageSkillLevel(this));

    if (this.reboundBonus > 0) {
      damage *= 1 + this.reboundBonus;
      this.reboundBonus = 0;
    }

    if (this.cycleEffect === "damage") damage *= skillParam("cycle", getSkillLevel(this, "cycle"), "damageMultiplier", 1.5);

    const critChance = Math.min(0.85, this.getUpgradeCurve(this.upgrades.critRate, 0.05, 0.006));
    if (Math.random() < critChance) {
      damage *= 2;
      Effects.showPopup("CRITICAL!", block.cx, block.cy - 14, "#ffffff");
    }

    return damage;
  }

  getBaseDamage(game = null) {
    let damage = 100 + this.baseDamageBonus + this.upgrades.damage * 50;
    const paddle = game && game.paddle ? game.paddle : (typeof Game !== "undefined" ? Game.paddle : null);
    const globalDamage = getSkillLevel(paddle, "globalDamage");
    if (globalDamage > 0) damage *= skillParam("globalDamage", globalDamage, "multiplier", 1);
    return damage;
  }

  getSkillDamage(game, level, profile = "projectile") {
    const curves = {
      aura: { base: 0.015, perLevel: 0.008 },
      dot: { base: 0.015, perLevel: 0.006 },
      echo: { base: 0.02, perLevel: 0.008 },
      shard: { base: 0.06, perLevel: 0.012 },
      phantom: { base: 0.10, perLevel: 0.04 },
      mirror: { base: 0.08, perLevel: 0.025 },
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

  consumePenetration(overflowDamage = 0) {
    const remainingDamage = Math.max(0, overflowDamage);
    if (this.penetrationLeft <= 0 || remainingDamage <= 0) {
      this.penetrationDamageLeft = 0;
      return false;
    }
    this.penetrationLeft -= 1;
    this.penetrationDamageLeft = remainingDamage;
    return true;
  }

  reflectFromBlock(block, collision = null) {
    this.penetrationDamageLeft = 0;
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

    const hasContact = collision &&
      Number.isFinite(collision.contactX) &&
      Number.isFinite(collision.contactY);
    if (hasContact) {
      const skin = 0.6;
      this.x = collision.contactX + normalX * skin;
      this.y = collision.contactY + normalY * skin;
    } else {
      const rect = block.collisionRect;
      if (normalX < 0) this.x = rect.x - this.radius - 0.5;
      else if (normalX > 0) this.x = rect.x + rect.width + this.radius + 0.5;
      if (normalY < 0) this.y = rect.y - this.radius - 0.5;
      else if (normalY > 0) this.y = rect.y + rect.height + this.radius + 0.5;
    }

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
    this.penetrationDamageLeft = 0;
    const immortality = getSkillLevel(this, "immortality");
    if (immortality > 0 && this.fallSaves > 0) {
      this.fallSaves -= 1;
      this.y = game.height - this.radius - 3;
      this.vy = -Math.abs(this.vy || 5);
      this.damageBoostTimer = skillParam("immortality", immortality, "boostDuration", 0.5);
      this.damageBoostMultiplier = skillParam("immortality", immortality, "boostMultiplier", 1);
      Effects.showPopup("REVOLT", this.x, this.y - 16, SKILLS.immortality.color);
      return;
    }

    const spread = getSkillLevel(this, "spread");
    if (spread > 0 && !this.spreadUsed) {
      this.spreadUsed = true;
      const count = skillParam("spread", spread, "count", 3);
      const damage = (block) => skillDamageByMaxHp(block, "spread", spread);
      for (let i = 0; i < count; i += 1) {
        const angle = Math.PI * (1.08 + (i / Math.max(1, count - 1)) * 0.84);
        game.spawnProjectile(this.x, game.height - 18, Math.cos(angle), Math.sin(angle), 6, damage, this, SKILLS.spread.color, 0, true);
      }
    }

    this.spawnPhantomProjectiles(game, false);

    this.alive = false;
    this.reviveTimer = this.getReviveTime(game);
    this.y = game.height + this.radius + 1;
    game.combo = 0;
    this.paddlelessHits = 0;
    this.penetrationDamageLeft = 0;
    this.blockHitCounts.clear();
  }

  spawnPhantomProjectiles(game, fromRevive = false) {
    const phantom = getSkillLevel(this, "phantom");
    if (phantom <= 0) return;

    const count = skillParam("phantom", phantom, "count", 2);
    const damage = (block) => skillDamageByMaxHp(block, "phantom", phantom);
    for (let i = 0; i < count; i += 1) {
      if (!fromRevive && this.path.length > 4) {
        const point = this.path[Math.max(0, this.path.length - 8 - i * 5)];
        game.spawnProjectile(point.x, point.y, -this.vx, -Math.abs(this.vy), 5.4, damage, this, SKILLS.phantom.color, 0, true);
        continue;
      }

      const spread = count <= 1 ? 0 : (i / (count - 1) - 0.5) * 0.95;
      game.spawnProjectile(this.x, this.y, spread, -1, 5.4, damage, this, SKILLS.phantom.color, 0, true);
    }
  }

  getReviveTime(game) {
    const localReduction = this.getUpgradeCurve(this.getUpgradeLevel("reviveSpeed"), 1.1, 0.045);
    const globalReduction = skillParam("reviveBoost", getSkillLevel(game.paddle, "reviveBoost"), "seconds", 0);
    const speedPenalty = this.getUpgradeCurve(this.getUpgradeLevel("speed"), 0.4, 0.035);
    const damagePenalty = this.getUpgradeCurve(this.upgrades.damage, 0.5, 0.045);
    return Math.max(2.5, this.baseReviveTime - localReduction - globalReduction + speedPenalty + damagePenalty);
  }

  getBaseSpeed() {
    return 5 + this.getUpgradeCurve(this.getUpgradeLevel("speed"), 0.45, 0.075);
  }

  getUpgradeLevel(key) {
    const level = Math.max(0, Math.floor(Number(this.upgrades[key]) || 0));
    const definition = typeof UPGRADE_DEFS !== "undefined" ? UPGRADE_DEFS[key] : null;
    return definition ? Math.min(level, definition.max) : level;
  }

  getUpgradeCurve(level, earlyStep, lateStep, earlyLevels = 5) {
    const safeLevel = Math.max(0, Math.floor(Number(level) || 0));
    const early = Math.min(safeLevel, earlyLevels);
    const late = Math.max(0, safeLevel - earlyLevels);
    return early * earlyStep + late * lateStep;
  }

  getTargetSpeed() {
    let speed = this.getBaseSpeed();
    const globalSpeed = getSkillLevel(Game.paddle, "globalSpeed");
    if (globalSpeed > 0) speed *= skillParam("globalSpeed", globalSpeed, "multiplier", 1);
    if (this.sprintTimer > 0) speed *= skillParam("sprint", getSkillLevel(this, "sprint"), "speedMultiplier", 1);
    if (this.berserkTimer > 0) speed *= skillParam("berserker", getSkillLevel(this, "berserker"), "speedMultiplier", 1);
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
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < length; i += 1) {
      const point = this.path[this.path.length - 1 - i];
      const alpha = (1 - i / length) * (0.045 + level * 0.014);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.getPrimaryColor();
      ctx.beginPath();
      ctx.arc(point.x, point.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = alpha * 1.35;
      ctx.strokeStyle = SKILLS.mirror.color;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  }
}

Ball.nextId = 1;
