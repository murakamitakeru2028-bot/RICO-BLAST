const AudioSystem = {
  ctx: null,
  master: null,
  compressor: null,
  limiter: null,
  unlocked: false,
  uiReady: false,
  lastHitAt: 0,
  lastWallAt: 0,
  hitRun: 0,
  breakIndex: 0,

  ensure() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    this.ctx = new AudioContextClass();

    this.master = this.ctx.createGain();
    this.master.gain.value = 0.48;

    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -20;
    this.compressor.knee.value = 14;
    this.compressor.ratio.value = 4.2;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.13;

    this.limiter = this.ctx.createDynamicsCompressor();
    this.limiter.threshold.value = -6;
    this.limiter.knee.value = 4;
    this.limiter.ratio.value = 14;
    this.limiter.attack.value = 0.001;
    this.limiter.release.value = 0.075;

    this.master.connect(this.compressor);
    this.compressor.connect(this.limiter);
    this.limiter.connect(this.ctx.destination);
  },

  unlock() {
    this.ensure();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume();
    if (!this.unlocked) {
      this.unlocked = true;
      this.playSoftClick(0.055);
    }
  },

  now() {
    return this.ctx ? this.ctx.currentTime : 0;
  },

  limit(value, min, max) {
    return Math.min(max, Math.max(min, value));
  },

  randomPan(spread = 0.16) {
    return (Math.random() * 2 - 1) * spread;
  },

  cents(amount = 8) {
    return (Math.random() * 2 - 1) * amount;
  },

  note(base, semitones) {
    return base * Math.pow(2, semitones / 12);
  },

  connectOutput(node, pan = 0) {
    if (this.ctx.createStereoPanner && Math.abs(pan) > 0.001) {
      const panner = this.ctx.createStereoPanner();
      panner.pan.value = this.limit(pan, -1, 1);
      node.connect(panner);
      panner.connect(this.master);
      return panner;
    }
    node.connect(this.master);
    return this.master;
  },

  makeGain(startTime, peak, attack, release, pan = 0) {
    const gain = this.ctx.createGain();
    const a = Math.max(0.001, attack);
    const r = Math.max(0.004, release);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), startTime + a);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + a + r);
    this.connectOutput(gain, pan);
    return gain;
  },

  tone(type, frequency, peak, attack, release, detune = 0, delay = 0, pan = 0) {
    if (!this.unlocked || !this.ctx) return;
    const t = this.now() + delay;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, frequency), t);
    osc.detune.setValueAtTime(detune, t);
    const gain = this.makeGain(t, peak, attack, release, pan);
    osc.connect(gain);
    osc.start(t);
    osc.stop(t + attack + release + 0.04);
  },

  filteredTone(type, frequency, peak, attack, release, filterFrequency, delay = 0, pan = 0, detune = 0, filterType = "lowpass", q = 0.9) {
    if (!this.unlocked || !this.ctx) return;
    const t = this.now() + delay;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, frequency), t);
    osc.detune.setValueAtTime(detune, t);
    filter.type = filterType;
    filter.frequency.setValueAtTime(Math.max(40, filterFrequency), t);
    filter.Q.value = q;
    const gain = this.makeGain(t, peak, attack, release, pan);
    osc.connect(filter);
    filter.connect(gain);
    osc.start(t);
    osc.stop(t + attack + release + 0.04);
  },

  sweep(type, from, to, peak, attack, release, delay = 0, pan = 0, detune = 0) {
    if (!this.unlocked || !this.ctx) return;
    const t = this.now() + delay;
    const end = t + attack + release;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, from), t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), end);
    osc.detune.setValueAtTime(detune, t);
    const gain = this.makeGain(t, peak, attack, release, pan);
    osc.connect(gain);
    osc.start(t);
    osc.stop(end + 0.04);
  },

  noise(peak, duration, filterFrequency, delay = 0, filterType = "bandpass", q = 2, pan = 0) {
    if (!this.unlocked || !this.ctx) return;
    const t = this.now() + delay;
    const length = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    const decay = filterType === "highpass" ? 2.4 : 1.6;
    for (let i = 0; i < length; i += 1) {
      const fade = Math.pow(1 - i / length, decay);
      data[i] = (Math.random() * 2 - 1) * fade;
    }
    const source = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = Math.max(40, filterFrequency);
    filter.Q.value = q;
    const gain = this.makeGain(t, peak, 0.001, duration, pan);
    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gain);
    source.start(t);
    source.stop(t + duration + 0.02);
  },

  click(frequency = 5200, peak = 0.02, delay = 0, pan = 0) {
    this.noise(peak, 0.018, frequency, delay, "highpass", 0.65, pan);
    this.tone("sine", frequency * 0.42, peak * 0.32, 0.001, 0.017, 0, delay, pan);
  },

  pluck(frequency, peak = 0.05, release = 0.06, delay = 0, pan = 0, type = "triangle", filterFrequency = null) {
    this.filteredTone(
      type,
      frequency,
      peak,
      0.001,
      release,
      filterFrequency || frequency * 5,
      delay,
      pan,
      this.cents(7),
      "lowpass",
      0.85
    );
  },

  playSoftClick(volume = 0.055) {
    if (!this.ctx) return;
    this.click(5200, volume * 0.28);
    this.pluck(760, volume, 0.045, 0.004, 0, "triangle", 2800);
    this.tone("sine", 1380, volume * 0.35, 0.002, 0.038, 0, 0.018);
  },

  playUiClick(kind = "tap") {
    this.unlock();
    const pan = this.randomPan(0.08);
    if (kind === "disabled") {
      this.click(2600, 0.013, 0, pan);
      this.sweep("sine", 310, 210, 0.036, 0.002, 0.08, 0.006, pan);
      return;
    }
    if (kind === "cancel") {
      this.click(4100, 0.018, 0, pan);
      this.sweep("triangle", 560, 360, 0.04, 0.002, 0.06, 0.004, pan);
      return;
    }
    if (kind === "confirm") {
      this.click(6200, 0.022, 0, pan);
      this.pluck(880, 0.052, 0.052, 0.002, pan);
      this.pluck(1320, 0.038, 0.06, 0.036, pan);
      return;
    }
    if (kind === "select") {
      this.click(5600, 0.018, 0, pan);
      this.pluck(740, 0.044, 0.05, 0.002, pan);
      this.pluck(1110, 0.024, 0.045, 0.025, pan);
      return;
    }
    this.click(5000, 0.016, 0, pan);
    this.pluck(kind === "nav" ? 620 : 690, 0.038, 0.044, 0.002, pan);
  },

  playUiSuccess() {
    this.unlock();
    const pan = this.randomPan(0.06);
    this.click(6600, 0.024, 0, pan);
    this.pluck(780, 0.046, 0.07, 0.004, pan);
    this.pluck(1170, 0.038, 0.07, 0.048, pan);
    this.pluck(1560, 0.028, 0.075, 0.088, pan);
  },

  playUiOpen() {
    this.unlock();
    const pan = this.randomPan(0.05);
    this.noise(0.018, 0.06, 2800, 0, "highpass", 0.7, pan);
    this.sweep("sine", 460, 980, 0.052, 0.006, 0.13, 0, pan);
    this.pluck(1470, 0.028, 0.08, 0.072, pan);
  },

  bindUiSounds() {
    if (this.uiReady || typeof document === "undefined") return;
    document.addEventListener("pointerdown", (event) => {
      const target = event.target;
      const interactive = target && target.closest ? target.closest("button, .slot, .skill-card") : null;
      if (!interactive) return;
      if (interactive.disabled || interactive.getAttribute("aria-disabled") === "true") {
        this.playUiClick("disabled");
        return;
      }
      if (interactive.classList.contains("btn-confirm-ok") || interactive.classList.contains("btn-start")) {
        this.playUiClick("confirm");
      } else if (interactive.classList.contains("btn-confirm-cancel") || interactive.id === "btn-back") {
        this.playUiClick("cancel");
      } else if (interactive.classList.contains("skill-card") || interactive.classList.contains("slot")) {
        this.playUiClick("select");
      } else {
        this.playUiClick("tap");
      }
    }, true);
    this.uiReady = true;
  },

  playWallBounce() {
    this.unlock();
    const t = this.now();
    if (this.lastWallAt && t - this.lastWallAt < 0.035) return;
    this.lastWallAt = t;
    const pan = this.randomPan(0.2);
    this.click(4300, 0.014, 0, pan);
    this.pluck(720, 0.026, 0.032, 0.003, pan, "triangle", 2600);
  },

  playPaddle() {
    this.unlock();
    this.hitRun = 0;
    const pan = this.randomPan(0.1);
    this.click(4600, 0.025, 0, pan);
    this.sweep("triangle", 320, 760, 0.082, 0.002, 0.086, 0, pan);
    this.filteredTone("square", 180, 0.032, 0.002, 0.07, 900, 0, pan, 0, "lowpass", 0.7);
    this.tone("sine", 1180, 0.034, 0.001, 0.062, 0, 0.026, pan);
  },

  playPaddleDamage(heavy = false) {
    this.unlock();
    const pan = this.randomPan(0.12);
    this.click(2400, heavy ? 0.026 : 0.018, 0, pan);
    this.sweep("sawtooth", heavy ? 210 : 330, heavy ? 58 : 125, heavy ? 0.13 : 0.088, 0.003, heavy ? 0.26 : 0.16, 0, pan);
    this.noise(heavy ? 0.12 : 0.075, heavy ? 0.18 : 0.105, heavy ? 390 : 720, 0.006, "bandpass", 1.6, pan);
    if (heavy) this.sweep("sine", 96, 42, 0.07, 0.006, 0.34, 0.02, pan);
  },

  playHeal(amount = 1) {
    this.unlock();
    const pan = this.randomPan(0.08);
    const lift = Math.min(5, Math.max(0, Math.floor(amount / 3)));
    this.noise(0.016, 0.04, 2400, 0, "highpass", 0.7, pan);
    this.pluck(this.note(660, lift), 0.035, 0.065, 0.002, pan);
    this.pluck(this.note(990, lift), 0.028, 0.075, 0.048, pan);
  },

  playBumperHit() {
    this.unlock();
    this.hitRun = 0;
    const pan = this.randomPan(0.18);
    this.click(7200, 0.023, 0, pan);
    this.sweep("triangle", 680, 1420, 0.07, 0.002, 0.09, 0, pan);
    this.tone("sine", 2120, 0.034, 0.001, 0.07, 0, 0.015, pan);
    this.noise(0.024, 0.055, 5200, 0.008, "highpass", 0.8, pan);
  },

  playBumperBreak() {
    this.unlock();
    const pan = this.randomPan(0.12);
    this.click(2700, 0.032, 0, pan);
    this.sweep("sawtooth", 250, 72, 0.1, 0.004, 0.23, 0, pan);
    this.sweep("triangle", 860, 260, 0.048, 0.003, 0.19, 0.018, pan);
    this.noise(0.12, 0.16, 560, 0, "bandpass", 1.7, pan);
    this.noise(0.046, 0.12, 3600, 0.026, "highpass", 0.7, pan);
  },

  playBumperRevive() {
    this.unlock();
    const pan = this.randomPan(0.08);
    this.noise(0.018, 0.07, 4000, 0, "highpass", 0.7, pan);
    this.sweep("sine", 420, 1380, 0.065, 0.016, 0.17, 0, pan);
    this.pluck(1860, 0.032, 0.09, 0.09, pan);
  },

  playBlockHit(combo = 0, paddlelessStreak = 0) {
    this.unlock();
    const t = this.now();
    if (this.lastHitAt && t - this.lastHitAt < 0.014) return;
    this.hitRun = !this.lastHitAt || t - this.lastHitAt > 0.46 ? 1 : Math.min(32, this.hitRun + 1);
    this.lastHitAt = t;

    const scale = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28, 31];
    const streak = Math.max(0, paddlelessStreak || 0);
    const streakLift = Math.max(0, Math.floor((streak - 1) * 1.35));
    const step = Math.max(0, this.hitRun - 1 + Math.floor((combo || 0) * 0.12) + streakLift);
    const semitone = scale[step % scale.length] + Math.floor(step / scale.length) * 12;
    const pitch = Math.min(2300, this.note(370, semitone));
    const pan = this.randomPan(0.14);
    const peak = 0.042 + Math.min(0.033, this.hitRun * 0.0024) + Math.min(0.018, streak * 0.0014);

    this.click(6200, 0.013 + Math.min(0.015, this.hitRun * 0.001), 0, pan);
    this.filteredTone("square", pitch, peak, 0.001, 0.045, pitch * 4.2, 0, pan, this.cents(5), "lowpass", 0.9);
    this.tone("sine", pitch * 2.01, 0.017 + Math.min(0.012, streak * 0.0009), 0.001, 0.04, 0, 0.006, pan);
    if (this.hitRun >= 5 || streak >= 4) this.tone("triangle", Math.min(3600, pitch * 2.8), 0.013 + Math.min(0.01, streak * 0.0007), 0.001, 0.036, 0, 0.014, pan);
    if (this.hitRun % 8 === 0 || streak >= 8 && streak % 4 === 0) {
      this.sweep("sine", pitch * 1.35, Math.min(4200, pitch * 2.35), 0.028, 0.002, 0.07, 0.01, pan);
    }
  },

  getSpecialRoot(effect) {
    const roots = {
      burst: 246.94,
      column: 293.66,
      row: 392,
      tokens: 523.25,
      chain: 329.63,
      aqua: 466.16
    };
    return roots[effect] || 440;
  },

  playBlockBreak(isSpecial = false, combo = 0, effect = null) {
    this.unlock();
    this.breakIndex = (this.breakIndex + 1) % 8;
    const comboLift = Math.min(18, Math.floor((combo || 0) / 3));
    const base = isSpecial ? this.getSpecialRoot(effect) : 440;
    const pitch = Math.min(1280, this.note(base, comboLift * 0.45) * (1 + this.breakIndex * 0.012));
    const pan = this.randomPan(0.2);

    this.click(isSpecial ? 7600 : 6500, isSpecial ? 0.036 : 0.026, 0, pan);
    this.noise(isSpecial ? 0.074 : 0.05, isSpecial ? 0.075 : 0.055, isSpecial ? 3600 : 4400, 0, "highpass", 0.7, pan);
    this.sweep("triangle", pitch * 0.82, pitch * 1.78, isSpecial ? 0.112 : 0.078, 0.002, isSpecial ? 0.15 : 0.105, 0, pan);
    this.filteredTone("square", pitch * 0.48, isSpecial ? 0.034 : 0.022, 0.002, 0.08, 900, 0.004, pan, 0, "lowpass", 0.7);
    this.tone("sine", pitch * 2.02, isSpecial ? 0.05 : 0.032, 0.001, 0.08, 0, 0.018, pan);

    if (isSpecial) this.playSpecialBreak(effect, pitch, pan);
  },

  playSpecialBreak(effect, pitch, pan = 0) {
    if (effect === "burst") {
      this.sweep("sawtooth", 140, 48, 0.068, 0.004, 0.22, 0.004, pan);
      this.noise(0.088, 0.13, 820, 0.015, "bandpass", 1.1, pan);
      this.sweep("sine", pitch * 2.1, pitch * 3.4, 0.032, 0.002, 0.1, 0.035, pan);
      return;
    }
    if (effect === "column") {
      this.sweep("sine", pitch * 2.8, pitch * 0.85, 0.05, 0.002, 0.16, 0.02, pan);
      this.noise(0.042, 0.08, 2200, 0.024, "bandpass", 3, pan);
      return;
    }
    if (effect === "row") {
      this.sweep("sine", pitch * 0.92, pitch * 3.1, 0.054, 0.002, 0.13, 0.018, pan);
      this.tone("triangle", pitch * 2.4, 0.026, 0.001, 0.07, 0, 0.055, pan);
      return;
    }
    if (effect === "tokens") {
      this.pluck(pitch * 1.22, 0.04, 0.075, 0.02, pan);
      this.pluck(pitch * 1.58, 0.034, 0.08, 0.064, pan);
      this.pluck(pitch * 2.05, 0.028, 0.085, 0.108, pan);
      return;
    }
    if (effect === "chain") {
      this.sweep("sawtooth", pitch * 3.2, pitch * 1.1, 0.042, 0.001, 0.12, 0.012, pan);
      this.noise(0.04, 0.07, 3200, 0.025, "bandpass", 4.5, pan);
      this.tone("square", pitch * 2.2, 0.022, 0.001, 0.05, -12, 0.072, pan);
      return;
    }
    if (effect === "aqua") {
      this.sweep("sine", pitch * 0.85, pitch * 1.7, 0.042, 0.006, 0.16, 0.012, pan);
      this.tone("sine", pitch * 2.2, 0.026, 0.004, 0.11, 0, 0.05, pan);
      this.noise(0.026, 0.09, 5200, 0.024, "highpass", 0.6, pan);
      return;
    }
    this.sweep("sine", pitch * 1.2, pitch * 2.4, 0.04, 0.002, 0.11, 0.02, pan);
  },

  playToken() {
    this.unlock();
    const pan = this.randomPan(0.1);
    this.click(7200, 0.02, 0, pan);
    this.pluck(1040, 0.04, 0.055, 0.002, pan);
    this.pluck(1560, 0.034, 0.068, 0.036, pan);
    this.pluck(2080, 0.024, 0.075, 0.072, pan);
  },

  playRewardReady() {
    this.unlock();
    const pan = this.randomPan(0.06);
    this.noise(0.024, 0.08, 4200, 0, "highpass", 0.7, pan);
    this.sweep("sine", 420, 1120, 0.072, 0.018, 0.22, 0, pan);
    this.pluck(1320, 0.052, 0.12, 0.08, pan);
    this.pluck(1760, 0.042, 0.13, 0.17, pan);
    this.pluck(2340, 0.032, 0.13, 0.27, pan);
  },

  playGameOver() {
    this.unlock();
    const pan = this.randomPan(0.06);
    this.click(1800, 0.02, 0, pan);
    this.sweep("sine", 330, 96, 0.09, 0.01, 0.34, 0, pan);
    this.sweep("sawtooth", 118, 42, 0.055, 0.01, 0.38, 0.04, pan);
    this.noise(0.065, 0.22, 320, 0.02, "bandpass", 1.4, pan);
  }
};
