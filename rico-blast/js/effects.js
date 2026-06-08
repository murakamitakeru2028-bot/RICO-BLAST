const Effects = {
  particles: [],
  bursts: [],
  popups: [],
  damageNumbers: [],
  rings: [],
  shakeAmount: 0,
  shakeDuration: 0,
  shakeElapsed: 0,
  rewardFlash: null,

  spawnBlockBreak(x, y, color, options = {}) {
    const special = !!options.special;
    const combo = Math.max(0, options.combo || 0);
    const intensity = clamp(1 + Math.min(combo, 40) / 80 + (special ? 0.42 : 0), 1, 1.85);
    const accent = special ? "#ffe66b" : (options.accent || "#f6fbff");
    const count = Math.round(randomInt(22, 31) * intensity);

    this.bursts.push({
      x,
      y,
      color,
      accent,
      radius: 4,
      maxRadius: 30 + 12 * intensity,
      life: 0.2 + 0.04 * intensity,
      maxLife: 0.2 + 0.04 * intensity,
      opacity: special ? 0.95 : 0.72
    });
    this.rings.push({
      x,
      y,
      color: accent,
      radius: 4,
      maxRadius: 16 + 8 * intensity,
      lineWidth: special ? 3 : 2.4,
      life: 0.14,
      maxLife: 0.14
    });
    this.rings.push({
      x,
      y,
      color,
      radius: 0,
      maxRadius: 32 + 11 * intensity,
      lineWidth: 2.2,
      life: 0.28 + 0.06 * intensity,
      maxLife: 0.28 + 0.06 * intensity
    });

    const sparkCount = Math.round(randomInt(9, 14) * intensity);
    for (let i = 0; i < sparkCount; i += 1) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(5.8, 10.5) * intensity;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: rand(8, 15) * intensity,
        rotation: angle,
        spin: 0,
        shape: "spark",
        color: Math.random() < 0.38 ? accent : color,
        glow: true,
        blend: true,
        drag: 0.82,
        gravity: 0.02,
        life: rand(0.16, 0.28),
        maxLife: 0.28
      });
    }

    for (let i = 0; i < count; i += 1) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(2.9, 8.8) * intensity;
      this.particles.push({
        x: x + rand(-2, 2),
        y: y + rand(-2, 2),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: rand(2.2, 5.6) * (special ? 1.08 : 1),
        rotation: rand(0, Math.PI * 2),
        spin: rand(-0.42, 0.42),
        shape: Math.random() < 0.55 ? "diamond" : "square",
        color: Math.random() < 0.22 ? accent : color,
        glow: Math.random() < 0.58,
        blend: Math.random() < 0.28,
        drag: rand(0.88, 0.94),
        gravity: rand(0.05, 0.12),
        life: rand(0.38, 0.62),
        maxLife: 0.62
      });
    }

    if (special) {
      for (let i = 0; i < 8; i += 1) {
        const angle = (Math.PI * 2 * i) / 8 + rand(-0.08, 0.08);
        const speed = rand(7.5, 11);
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: rand(10, 18),
          rotation: angle,
          spin: 0,
          shape: "spark",
          color: accent,
          glow: true,
          blend: true,
          drag: 0.84,
          gravity: 0.01,
          life: 0.34,
          maxLife: 0.34
        });
      }
    }

    this.shakeScreen(special ? 1.8 : 0.72, special ? 0.12 : 0.055);
    this.trimEffects();
  },

  spawnImpactSpark(x, y, color) {
    this.rings.push({
      x,
      y,
      color,
      radius: 0,
      maxRadius: 12,
      lineWidth: 1.4,
      life: 0.12,
      maxLife: 0.12
    });
    for (let i = 0; i < 5; i += 1) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(2.2, 5.2);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: rand(5, 9),
        rotation: angle,
        shape: "spark",
        color,
        glow: true,
        blend: true,
        drag: 0.85,
        gravity: 0.02,
        life: 0.16,
        maxLife: 0.16
      });
    }
    this.trimEffects();
  },

  showArmorDeflect(x, y) {
    this.rings.push({
      x,
      y,
      color: "#ff4a4a",
      radius: 2,
      maxRadius: 16,
      lineWidth: 1.6,
      life: 0.1,
      maxLife: 0.1
    });
    for (let i = 0; i < 6; i += 1) {
      const angle = rand(Math.PI * 0.85, Math.PI * 2.15);
      const speed = rand(2.2, 5.8);
      this.particles.push({
        x: x + rand(-5, 5),
        y: y + rand(-5, 5),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: rand(3, 6),
        rotation: angle,
        spin: rand(-0.28, 0.28),
        shape: "spark",
        color: "#ff4a4a",
        glow: true,
        blend: true,
        drag: 0.82,
        gravity: 0.02,
        life: 0.14,
        maxLife: 0.14
      });
    }
    this.trimEffects();
  },

  spawnBlockRegen(x, y) {
    for (let i = 0; i < 5; i += 1) {
      this.particles.push({
        x: x + rand(-11, 11),
        y: y + rand(-4, 5),
        vx: rand(-0.7, 0.7),
        vy: rand(-1.8, -0.7),
        size: rand(1.8, 3.4),
        rotation: rand(0, Math.PI * 2),
        spin: rand(-0.18, 0.18),
        shape: "diamond",
        color: "#4aff88",
        glow: true,
        blend: true,
        drag: 0.88,
        gravity: -0.01,
        life: rand(0.26, 0.4),
        maxLife: 0.4
      });
    }
    this.trimEffects();
  },

  spawnBlockSpawn(x, y) {
    this.rings.push({
      x,
      y,
      color: "#aa66ff",
      radius: 0,
      maxRadius: 24,
      lineWidth: 1.4,
      life: 0.3,
      maxLife: 0.3
    });
    for (let i = 0; i < 10; i += 1) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(1.4, 4.8);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: rand(2, 4.2),
        rotation: angle,
        spin: rand(-0.22, 0.22),
        shape: Math.random() < 0.65 ? "diamond" : "square",
        color: "#aa66ff",
        glow: true,
        blend: true,
        drag: 0.86,
        gravity: 0.02,
        life: rand(0.24, 0.38),
        maxLife: 0.38
      });
    }
    this.trimEffects();
  },

  spawnTokenCollect(x, y, amount = 1) {
    this.showTokenCollect(x, y, amount);
  },

  showTokenCollect(x, y, amount = 1) {
    const strength = clamp(amount, 1, 5);
    this.rings.push({
      x,
      y,
      color: "#f0c040",
      radius: 0,
      maxRadius: 18 + strength * 2,
      lineWidth: 1.4,
      life: 0.24,
      maxLife: 0.24
    });
    this.rings.push({
      x,
      y,
      color: "#fff3b0",
      radius: 4,
      maxRadius: 8 + strength,
      lineWidth: 2,
      life: 0.12,
      maxLife: 0.12
    });
    for (let i = 0; i < 7 + strength; i += 1) {
      const angle = -Math.PI / 2 + rand(-0.9, 0.9);
      const speed = rand(1.8, 4.8);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: rand(1.7, 3.4),
        rotation: rand(0, Math.PI * 2),
        spin: rand(-0.32, 0.32),
        shape: "diamond",
        color: Math.random() < 0.35 ? "#fff3b0" : "#ffe66b",
        glow: true,
        life: rand(0.34, 0.5),
        maxLife: 0.5
      });
    }
  },

  shakeScreen(amplitude, duration) {
    this.shakeAmount = Math.max(this.shakeAmount, amplitude);
    this.shakeDuration = Math.max(this.shakeDuration, duration);
    this.shakeElapsed = 0;
  },

  showPopup() {
    // Text popups are intentionally disabled; feedback is carried by sound and particles.
  },

  showDamageNumber(x, y, amount, color = "#f6fbff", source = "hit") {
    const value = Math.max(1, Math.round(amount));
    const heavy = value >= 25 || source === "ball";
    this.damageNumbers.push({
      text: `-${value}`,
      x: x + rand(-8, 8),
      y: y + rand(-3, 3),
      vx: rand(-0.28, 0.28),
      vy: heavy ? rand(-1.65, -1.25) : rand(-1.35, -0.95),
      color,
      size: clamp(12 + Math.sqrt(value) * 1.4, 14, heavy ? 22 : 18),
      life: heavy ? 0.62 : 0.5,
      maxLife: heavy ? 0.62 : 0.5,
      pop: 1.28
    });
    if (this.damageNumbers.length > 80) this.damageNumbers.splice(0, this.damageNumbers.length - 80);
  },

  showScoreNumber(x, y, amount, multiplier = 1) {
    const value = Math.max(1, Math.round(amount));
    const label = typeof formatNumber === "function" ? formatNumber(value) : String(value);
    const bonus = Math.max(1, multiplier || 1);
    this.damageNumbers.push({
      text: `+${label}`,
      x: x + rand(-5, 5),
      y: y - 13 + rand(-2, 2),
      vx: rand(-0.16, 0.16),
      vy: rand(-1.95, -1.45),
      color: bonus > 1.001 ? "#ffe66b" : "#fff7c7",
      size: clamp(14 + Math.sqrt(value) * 1.15, 17, bonus > 1.001 ? 27 : 23),
      life: bonus > 1.001 ? 0.76 : 0.62,
      maxLife: bonus > 1.001 ? 0.76 : 0.62,
      pop: bonus > 1.001 ? 1.42 : 1.28
    });
    if (bonus > 1.001) {
      this.damageNumbers.push({
        text: `x${bonus.toFixed(2)}`,
        x: x + rand(-4, 4),
        y: y + 7 + rand(-2, 2),
        vx: rand(-0.1, 0.1),
        vy: rand(-1.35, -1.05),
        color: "#7cf5b2",
        size: 12,
        life: 0.62,
        maxLife: 0.62,
        pop: 1.22
      });
    }
    if (this.damageNumbers.length > 90) this.damageNumbers.splice(0, this.damageNumbers.length - 90);
  },

  showRewardReady() {
    this.rewardFlash = {
      life: 0.65,
      maxLife: 0.65
    };
  },

  showBallRevive(x, y, color) {
    this.rings.push({
      x,
      y,
      color,
      radius: 0,
      maxRadius: 40,
      lineWidth: 2,
      life: 0.4,
      maxLife: 0.4
    });
  },

  showBumperHit(x, y, width) {
    this.rings.push({
      x,
      y,
      color: "#67d8ff",
      radius: 0,
      maxRadius: 16,
      lineWidth: 1.2,
      life: 0.16,
      maxLife: 0.16
    });
    for (let i = 0; i < 7; i += 1) {
      const direction = Math.random() < 0.5 ? -1 : 1;
      this.particles.push({
        x: clamp(x + rand(-22, 22), 0, width),
        y,
        vx: direction * rand(0.9, 3.4),
        vy: rand(-1.4, -0.35),
        size: rand(1.3, 2.7),
        rotation: rand(0, Math.PI * 2),
        spin: rand(-0.32, 0.32),
        shape: "diamond",
        color: Math.random() < 0.5 ? "#67d8ff" : "#7cf5b2",
        glow: true,
        life: rand(0.22, 0.34),
        maxLife: 0.34
      });
    }
  },

  showBumperRevive(x, y) {
    this.rings.push({
      x,
      y,
      color: "#7cf5b2",
      radius: 0,
      maxRadius: 42,
      lineWidth: 1.4,
      life: 0.28,
      maxLife: 0.28
    });
  },

  showBumperBroken(x, y, width) {
    this.popups.push({
      text: "BUMPER BROKEN!",
      x: width / 2,
      y: y - 18,
      color: "#ff5f88",
      size: 17,
      life: 0.9,
      maxLife: 0.9
    });
    for (let i = 0; i < 34; i += 1) {
      const angle = rand(Math.PI * 1.05, Math.PI * 1.95);
      const speed = rand(1.4, 6.8);
      this.particles.push({
        x: clamp(x + rand(-90, 90), 0, width),
        y: y + rand(-2, 3),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: rand(2, 4.2),
        rotation: rand(0, Math.PI * 2),
        spin: rand(-0.4, 0.4),
        shape: Math.random() < 0.7 ? "diamond" : "square",
        color: Math.random() < 0.45 ? "#ff5f88" : "#67d8ff",
        glow: Math.random() < 0.5,
        life: rand(0.38, 0.62),
        maxLife: 0.62
      });
    }
  },

  showPaddleDamage(x, y, amount) {
    this.damageNumbers.push({
      text: `-${Math.max(1, Math.ceil(amount))}`,
      x: x + rand(-8, 8),
      y: y - 14,
      vx: rand(-0.18, 0.18),
      vy: rand(-1.35, -0.95),
      color: "#ff4a4a",
      size: 18,
      life: 0.62,
      maxLife: 0.62,
      pop: 1.3
    });
    for (let i = 0; i < 12; i += 1) {
      this.particles.push({
        x: x + rand(-26, 26),
        y: y + rand(-2, 4),
        vx: rand(-3.2, 3.2),
        vy: rand(-2.6, -0.4),
        size: rand(2, 4),
        rotation: rand(0, Math.PI * 2),
        spin: rand(-0.36, 0.36),
        shape: Math.random() < 0.5 ? "diamond" : "square",
        color: "#ff4a4a",
        glow: true,
        life: rand(0.28, 0.44),
        maxLife: 0.44
      });
    }
  },

  showPaddleHeal(x, y) {
    for (let i = 0; i < 10; i += 1) {
      this.particles.push({
        x: x + rand(-30, 30),
        y: y + rand(-4, 4),
        vx: rand(-1.5, 1.5),
        vy: rand(-2.2, -0.7),
        size: rand(2, 3.8),
        rotation: rand(0, Math.PI * 2),
        spin: rand(-0.24, 0.24),
        shape: Math.random() < 0.7 ? "diamond" : "square",
        color: "#4aff88",
        glow: true,
        life: rand(0.24, 0.38),
        maxLife: 0.38
      });
    }
  },

  trimEffects() {
    if (this.particles.length > 260) this.particles.splice(0, this.particles.length - 260);
    if (this.rings.length > 54) this.rings.splice(0, this.rings.length - 54);
    if (this.bursts.length > 24) this.bursts.splice(0, this.bursts.length - 24);
  },

  update(dt) {
    const frame = dt * 60;
    for (const particle of [...this.particles]) {
      particle.life -= dt;
      particle.x += particle.vx * frame;
      particle.y += particle.vy * frame;
      particle.rotation += (particle.spin || 0) * frame;
      const drag = particle.drag || 0.92;
      const gravity = Number.isFinite(particle.gravity) ? particle.gravity : 0.1;
      particle.vx *= Math.pow(drag, frame);
      particle.vy = particle.vy * Math.pow(drag, frame) + gravity * frame;
      if (particle.life <= 0) this.remove(this.particles, particle);
    }

    for (const burst of [...this.bursts]) {
      burst.life -= dt;
      const progress = 1 - burst.life / burst.maxLife;
      burst.radius = progress * (burst.maxRadius || 36);
      if (burst.life <= 0) this.remove(this.bursts, burst);
    }

    for (const popup of [...this.popups]) {
      popup.life -= dt;
      popup.y -= 30 * dt / popup.maxLife;
      if (popup.life <= 0) this.remove(this.popups, popup);
    }

    for (const number of [...this.damageNumbers]) {
      number.life -= dt;
      number.x += number.vx * frame;
      number.y += number.vy * frame;
      number.vx *= Math.pow(0.9, frame);
      number.vy += 0.045 * frame;
      number.pop = 1 + Math.max(0, number.pop - 1) * Math.pow(0.72, frame);
      if (number.life <= 0) this.remove(this.damageNumbers, number);
    }

    for (const ring of [...this.rings]) {
      ring.life -= dt;
      const progress = 1 - ring.life / ring.maxLife;
      ring.radius = progress * (ring.maxRadius || 40);
      if (ring.life <= 0) this.remove(this.rings, ring);
    }

    if (this.rewardFlash) {
      this.rewardFlash.life -= dt;
      if (this.rewardFlash.life <= 0) this.rewardFlash = null;
    }

    this.updateShake(dt);
  },

  updateShake(dt) {
    if (this.shakeDuration <= 0) {
      this.applyCanvasTransform(0, 0);
      return;
    }
    this.shakeElapsed += dt;
    const progress = clamp(this.shakeElapsed / this.shakeDuration, 0, 1);
    const amount = this.shakeAmount * Math.pow(1 - progress, 2);
    const rx = rand(-amount, amount);
    const ry = rand(-amount, amount);
    this.applyCanvasTransform(rx, ry);
    if (progress >= 1) {
      this.shakeDuration = 0;
      this.shakeAmount = 0;
      this.shakeElapsed = 0;
      this.applyCanvasTransform(0, 0);
    }
  },

  applyCanvasTransform(x, y) {
    if (typeof Game === "undefined" || !Game.canvas) return;
    Game.canvas.style.transform = x || y ? `translate(${x}px, ${y}px)` : "";
  },

  draw(ctx) {
    for (const burst of this.bursts) {
      const progress = 1 - burst.life / burst.maxLife;
      const alpha = clamp(burst.life / burst.maxLife, 0, 1);
      const radius = Math.max(2, burst.radius || burst.maxRadius * progress);
      const gradient = ctx.createRadialGradient(burst.x, burst.y, 0, burst.x, burst.y, radius);
      gradient.addColorStop(0, burst.accent || "#ffffff");
      gradient.addColorStop(0.22, burst.color);
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = Math.min(1, alpha * (burst.opacity || 0.72) * (1.2 - progress * 0.35));
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(burst.x, burst.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const particle of this.particles) {
      const alpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.save();
      if (particle.blend) ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = Math.min(1, alpha * (particle.alphaBoost || 1));
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation || 0);
      if (particle.glow) {
        ctx.shadowBlur = particle.shape === "spark" ? 12 : 8;
        ctx.shadowColor = particle.color;
      }
      ctx.fillStyle = particle.color;
      if (particle.shape === "spark") {
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = Math.max(1.2, particle.size * 0.18);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-particle.size * 0.45, 0);
        ctx.lineTo(particle.size * 0.75, 0);
        ctx.stroke();
      } else if (particle.shape === "diamond") {
        const s = particle.size;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.82, 0);
        ctx.lineTo(0, s);
        ctx.lineTo(-s * 0.82, 0);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
      }
      ctx.restore();
    }

    for (const ring of this.rings) {
      const alpha = clamp(ring.life / ring.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = ring.lineWidth || 2;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    for (const number of this.damageNumbers) {
      const progress = 1 - number.life / number.maxLife;
      const alpha = clamp(number.life / number.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = Math.min(1, alpha * 1.4);
      ctx.translate(number.x, number.y);
      ctx.scale(number.pop, number.pop);
      ctx.font = `800 ${number.size}px 'Space Mono', monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(12, 10, 8, 0.92)";
      ctx.shadowBlur = 10 * (1 - progress);
      ctx.shadowColor = number.color;
      ctx.strokeText(number.text, 0, 0);
      ctx.fillStyle = number.color;
      ctx.fillText(number.text, 0, 0);
      ctx.restore();
    }

    for (const popup of this.popups) {
      const progress = 1 - popup.life / popup.maxLife;
      const alpha = clamp(popup.life / popup.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = Math.min(1, alpha * 1.5);
      ctx.font = `800 ${popup.size || 16}px 'Space Mono', monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 5;
      ctx.strokeStyle = "rgba(4, 8, 14, 0.94)";
      ctx.shadowBlur = 14 * (1 - progress);
      ctx.shadowColor = popup.color;
      ctx.strokeText(popup.text, popup.x, popup.y);
      ctx.fillStyle = popup.color;
      ctx.fillText(popup.text, popup.x, popup.y);
      ctx.restore();
    }

    if (this.rewardFlash) this.drawRewardFlash(ctx);
  },

  drawRewardFlash(ctx) {
    const progress = 1 - this.rewardFlash.life / this.rewardFlash.maxLife;
    ctx.save();
    if (progress < 0.3) {
      ctx.globalAlpha = 0.45 * (1 - progress / 0.3);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, Game.width, Game.height);
    }
    ctx.restore();
  },

  clear() {
    this.particles = [];
    this.bursts = [];
    this.popups = [];
    this.damageNumbers = [];
    this.rings = [];
    this.rewardFlash = null;
    this.shakeAmount = 0;
    this.shakeDuration = 0;
    this.shakeElapsed = 0;
    this.applyCanvasTransform(0, 0);
  },

  remove(list, item) {
    const index = list.indexOf(item);
    if (index >= 0) list.splice(index, 1);
  }
};
