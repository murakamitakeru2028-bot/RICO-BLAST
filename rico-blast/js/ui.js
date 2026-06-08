const SLOT_SKILL_LABELS = {
  penetration: "PIERCE",
  immortality: "IMMORTAL",
  sprint: "SPRINT",
  teleporter: "WARP",
  splash: "SPLASH",
  spread: "SPREAD",
  chain: "CHAIN",
  sniper: "SNIPER",
  doubleChance: "DOUBLE",
  crossfire: "CROSS",
  overload: "OVERLOAD",
  fragment: "FRAG",
  detonator: "DETONATE",
  shatter: "SHATTER",
  poison: "POISON",
  afterburn: "BURN",
  lightning: "LIGHTNING",
  impact: "IMPACT",
  crash: "CRASH",
  blast: "BLAST",
  mirror: "MIRROR",
  rebound: "REBOUND",
  echo: "ECHO",
  phantom: "PHANTOM",
  aura: "AURA",
  berserker: "BERSERK",
  cycle: "CYCLE",
  expert: "EXPERT",
  lastHit: "LAST HIT",
  scoreBoost: "SCORE",
  vampire: "VAMPIRE",
  paddleWidth: "WIDTH",
  bounceHeal: "HEAL",
  reviveBoost: "REVIVE",
  superBounce: "BOUNCE",
  globalDamage: "DAMAGE",
  globalSpeed: "SPEED",
  bumperFortify: "BUMP HP",
  bumperRecover: "BUMP REC"
};

const SKILL_DETAIL_TEXT = {
  penetration: "発射ごとに★回ぶん反射せず貫通する。密集した列を削りながらコンボを伸ばしやすい。",
  immortality: "落下しても一定回数だけ復帰する。★3以上は復帰直後に短時間ダメージも上がる。",
  sprint: "パドルで打ち返した直後だけ加速する。★が高いほど速度が伸び、次のヒットへ早く届く。",
  teleporter: "パドル反射時にブロック密集地の手前へワープすることがある。★で発動率が上がる。",
  splash: "ブロック破壊時に周囲へ範囲ダメージ。★が高いほど爆風が広く、巻き込み火力も上がる。",
  spread: "落下直前に扇状の分裂弾を出す。★が高いほど弾数と追撃ダメージが増える。",
  chain: "破壊したブロックから近くのブロックへ連鎖ダメージ。★が高いほど連鎖回数が増える。",
  sniper: "破壊時に同じ縦列へ追加ダメージ。★5では横方向にも判定が広がりやすい。",
  doubleChance: "ヒット時に追加ダメージがもう一度入ることがある。★が高いほど発動率が上がる。",
  crossfire: "破壊時に左右へ貫通弾を放つ。横並びのブロックを削り、列崩しに強い。",
  overload: "同じブロックに連続ヒットするほど火力上昇。高HPブロックを一点突破しやすい。",
  fragment: "破壊時に複数の欠片弾を飛ばす。★が高いほど欠片の数とダメージが増える。",
  detonator: "3ヒットごとに小さな爆発を起こす。連続ヒットや貫通と合わせると発動しやすい。",
  poison: "壊しきれなかったブロックに毒を付与する。★が高いほど継続ダメージが強く長くなる。",
  afterburn: "破壊位置に炎のダメージゾーンを残す。通過弾の追撃と合わせて周囲を削る。",
  lightning: "破壊時に近くのブロックへ電撃が飛ぶ。★が高いほど連鎖数と届く範囲が伸びる。",
  impact: "パドル後の初撃が大きく強化される。狙った一発で高HPブロックを割りやすい。",
  crash: "ボール速度が高いほどダメージが増える。速度アップ系と組み合わせると伸びる。",
  blast: "破壊時に横長の衝撃波を出す。横列のHPをまとめて削り、穴を広げやすい。",
  mirror: "パドル反射時に対称方向へ短時間ミラーボールを飛ばす。★が高いほど長く残り、追撃が強くなる。",
  rebound: "パドルで打ち返すたび次のヒットが強化される。守りながら火力を溜められる。",
  echo: "移動軌道に残像ダメージを残す。★が高いほど残像が太く長く残り、通路を削る。",
  phantom: "落下時に直前の軌道から残像弾を撃つ。★が高いほど往復数と追撃火力が増える。",
  aura: "ボール周辺へ短い間隔で小ダメージ。接触しなくても近いブロックをじわじわ削る。",
  berserker: "復活直後に一定時間だけ速度とダメージが上がる。★が高いほど効果時間と火力が伸びる。",
  cycle: "一定間隔で追加効果を切り替える。スプラッシュ、電撃、ダメージ強化を周期的に得る。",
  expert: "装備スキルの平均レベルが高いほどダメージ上昇。育ったボールほど伸びる晩成型。",
  lastHit: "このボールがトドメを刺すとトークン量が増える。高HPブロックの最後を取るほどおいしい。",
  scoreBoost: "このボールの破壊スコアが増える。コンボと合わせるとスコアの伸びが大きい。",
  vampire: "このボールが破壊したブロックHPの★%をパドルHPへ吸収。最低1回復する。",
  paddleWidth: "パドル幅を広げて受けやすくする。★ごとに横幅が増え、事故を減らせる。",
  bounceHeal: "ボールがパドルに当たるたびHPを★分回復する。満タンを超えては回復しない。",
  reviveBoost: "全ボールの復活時間を短縮する。複数ボール運用で立て直しが早くなる。",
  superBounce: "パドル反射時に確率で強打する。発動中は短時間ダメージと速度が上がる。",
  globalDamage: "全ボールの基礎ダメージを底上げする。どのボールにも効く安定火力。",
  globalSpeed: "全ボールの移動速度を上げる。回転率が上がるぶん操作難度も少し上がる。",
  bumperFortify: "バンパーの壊れるまでの回数を+1する。買ったバンパーをより長く保てる。",
  bumperRecover: "バンパー破壊後の復活時間を短縮する。★が高いほど復帰待ちが短くなる。"
};

const UI = {
  selectedUpgradeTarget: null,
  selectedSkillTarget: null,
  upgradeContext: null,
  onSkillTargetChanged: null,

  handlePlayingUiLaunch(ball = null) {
    if (typeof Game === "undefined" || typeof currentState === "undefined" || currentState !== STATE.PLAYING) {
      return false;
    }
    if (ball && ball.waitingLaunch && Game.launchReadyBall(ball)) return true;
    Game.launchNextReadyBall();
    return true;
  },

  initTitle() {
    const title = document.getElementById("screen-title");
    const highScore = Number(localStorage.getItem("ricoBlast_highScore") || 0);
    const bestBlocks = Number(localStorage.getItem("ricoBlast_bestBlocks") || 0);
    title.innerHTML = `
      <div class="title-shell">
        <div class="title-topline">
          <span>RICO SYSTEM</span>
          <span>v0.1.0</span>
        </div>

        <div class="logo-card">
        <div class="title-mark" aria-hidden="true">
          <span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span>
        </div>
        <h1 class="logo-text">
          <span class="logo-rico">RICO</span>
          <span> </span>
          <span class="logo-blast">BLAST</span>
        </h1>
        <p class="logo-sub clean">BREAK / BUILD / ASCEND</p>
        <p class="logo-sub">BREAK · BUILD · ASCEND</p>
      </div>

      <div class="title-preview" aria-hidden="true">
        <div class="title-preview-score">
          <span>SCORE</span>
          <b>${formatNumber(highScore)}</b>
        </div>
        <div class="title-preview-grid">
          <span></span><span></span><span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span>
        </div>
        <div class="title-preview-ball ball-a"></div>
        <div class="title-preview-ball ball-b"></div>
        <div class="title-preview-ball ball-c"></div>
        <div class="title-preview-paddle"></div>
        <div class="title-preview-bumper"></div>
      </div>

      <div class="title-record-row">
        <span><b>${formatNumber(highScore)}</b><em>BEST SCORE</em></span>
        <span><b>${formatNumber(bestBlocks)}</b><em>BEST BLOCKS</em></span>
      </div>

      <div class="title-buttons">
        <button class="btn-start" id="btn-start">GAME START</button>
        <div class="title-secondary-buttons">
          <button class="btn-sub" id="btn-ranking">RANKING</button>
          <button class="btn-sub" id="btn-settings">SETTINGS</button>
          <button class="btn-sub btn-install" id="btn-install" hidden>INSTALL</button>
        </div>
      </div>
      </div>
    `;

    document.getElementById("btn-start").addEventListener("click", () => {
      AudioSystem.unlock();
      AudioSystem.playUiSuccess();
      Game.init();
      setState(STATE.PLAYING);
      Game.startRun();
    });
    document.getElementById("btn-ranking").addEventListener("click", () => this.showRanking());
    document.getElementById("btn-settings").addEventListener("click", () => this.showSettings());
    if (typeof PWAInstall !== "undefined") PWAInstall.bindInstallButton(document.getElementById("btn-install"));
  },

  updateScreens(state) {
    document.querySelectorAll(".screen").forEach((screen) => screen.classList.remove("active"));
    document.querySelectorAll(".game-panel").forEach((panel) => panel.classList.remove("active"));
    if (state === STATE.TITLE) {
      document.getElementById("screen-title").classList.add("active");
      return;
    }

    document.getElementById("screen-game").classList.add("active");
    if (state === STATE.SKILL_SELECT) document.getElementById("screen-skill").classList.add("active");
    if (state === STATE.UPGRADE) document.getElementById("screen-upgrade").classList.add("active");
    if (state === STATE.GAME_OVER) document.getElementById("screen-gameover").classList.add("active");
  },

  renderSlots(balls, paddle) {
    this.updatePaddleHp(paddle);
    const isUpgrade = typeof currentState !== "undefined" && currentState === STATE.UPGRADE;
    const isSkillSelect = typeof currentState !== "undefined" && currentState === STATE.SKILL_SELECT;
    const slotBar = document.getElementById("slot-bar");
    if (slotBar) slotBar.classList.toggle("skill-select-mode", isSkillSelect);
    for (let i = 0; i < BALL_MAX; i += 1) {
      const slot = document.getElementById(`slot-${i}`);
      const ball = balls[i];
      if (!ball) {
        const buyState = this.getBallPurchaseSlotState(i, balls);
        const isStoreSlot = this.canBuyBallInCurrentPhase();
        slot.className = `slot empty ${isStoreSlot ? "store-empty" : ""} ${buyState.buyable ? "buyable" : ""} ${buyState.locked ? "locked" : ""}`;
        slot.style.borderColor = "";
        slot.style.removeProperty("--selected-color");
        slot.style.removeProperty("--primary-skill-color");
        slot.style.removeProperty("--revive-fill");
        if (isStoreSlot) {
          const cost = Number.isFinite(buyState.cost) ? `${formatNumber(buyState.cost)}T` : "MAX";
          const state = buyState.buyable ? "BUY" : (buyState.locked ? "LOCKED" : "MAX");
          slot.innerHTML = `
            <div class="slot-buy-card">
              <div class="slot-buy-icon">+</div>
              <div class="slot-buy-copy">
                <div class="slot-tag">BALL ${i + 1}</div>
                <div class="slot-buy-price">${cost}</div>
              </div>
            </div>
            <div class="slot-buy-state">${state}</div>
            <div class="slot-buy-note">${buyState.shortDetail || ""}</div>
          `;
          slot.onclick = () => {
            if (this.handlePlayingUiLaunch()) return;
            this.handleEmptyBallSlotClick(i);
          };
          continue;
        }
        const emptyRows = `
          <div class="skill-row empty"><span class="skill-row-name">------</span></div>
          <div class="skill-row empty"><span class="skill-row-name">------</span></div>
          <div class="skill-row empty"><span class="skill-row-name">------</span></div>
        `;
        slot.innerHTML = `
          <div class="slot-top">
            <div class="slot-icon"></div>
            <div class="slot-tag">BALL ${i + 1}</div>
          </div>
          <div class="slot-skills-stack">${emptyRows}</div>
        `;
        slot.onclick = () => {
          if (this.handlePlayingUiLaunch()) return;
          this.handleEmptyBallSlotClick(i);
        };
        continue;
      }

      const selected = (isUpgrade && this.isUpgradeTargetSelected("ball", i)) ||
        (isSkillSelect && this.isSkillTargetSelected(i));
      const first = ball.skills[0];
      const color = first ? first.color : ball.color;
      const launchReady = ball.waitingLaunch;
      const reviveRemaining = Math.max(0, ball.reviveTimer || 0);
      const reviveTotal = Math.max(reviveRemaining, ball.getReviveTime ? ball.getReviveTime(Game) : reviveRemaining, 1);
      const reviveFill = clamp(1 - reviveRemaining / reviveTotal, 0, 1);

      // 3スキル行を生成（装備済み・リバイブ中・空スロット対応）
      const skillRowsHtml = (() => {
        if (!ball.alive) {
          return `
            <div class="skill-row revive"><span class="skill-row-name">${reviveRemaining.toFixed(1)}s</span></div>
            <div class="skill-row empty"><span class="skill-row-name">------</span></div>
            <div class="skill-row empty"><span class="skill-row-name">------</span></div>
          `;
        }
        return Array.from({ length: 3 }, (_, idx) => {
          const skill = ball.skills[idx];
          if (skill) {
            return `<div class="skill-row equipped" style="--skill-color:${skill.color}"><span class="skill-row-name">${this.skillDisplayName(skill)} ★${skill.level}</span></div>`;
          }
          return `<div class="skill-row empty"><span class="skill-row-name">------</span></div>`;
        }).join("");
      })();

      // ボール状態のタグ（READY表示）
      const ballTag = launchReady
        ? `BALL ${i + 1} ▶`
        : `BALL ${i + 1}`;

      slot.className = `slot owned ${ball.alive || launchReady ? "" : "fallen reviving"} ${ball.skills.length ? "has-skills" : "no-skills"} ${launchReady ? "launch-ready" : ""} ${selected ? (isSkillSelect ? "selected-skill" : "selected-upgrade") : ""}`;
      slot.style.borderColor = first ? first.color : ball.color;
      slot.style.setProperty("--selected-color", color || "#4a9eff");
      slot.style.setProperty("--primary-skill-color", color || "#4a9eff");
      slot.style.setProperty("--revive-fill", `${Math.round(reviveFill * 100)}%`);
      slot.innerHTML = `
        <div class="slot-top">
          <div class="slot-icon" style="${this.ballIconStyle(ball)}"></div>
          <div class="slot-tag">${ballTag}</div>
        </div>
        <div class="slot-skills-stack">${skillRowsHtml}</div>
      `;
      slot.onclick = () => {
        if (this.handlePlayingUiLaunch(ball)) return;
        if (isUpgrade) {
          this.selectUpgradeTarget("ball", i);
          return;
        }
        if (isSkillSelect) {
          this.selectSkillTarget(i);
          return;
        }
        this.showBallDetail(ball, i + 1);
      };
      if (color) slot.querySelector(".slot-icon").style.borderColor = color;
    }

    const paddleSlot = document.getElementById("slot-paddle");
    const firstPaddle = paddle.skills[0];
    const total = Math.min(5, getTotalStars(paddle));
    const paddleSelected = false;
    paddleSlot.className = `slot ${paddle.skills.length ? "has-skills" : "empty"} ${paddleSelected ? "selected-upgrade" : ""}`;
    paddleSlot.style.borderColor = "";
    paddleSlot.style.setProperty("--selected-color", firstPaddle ? firstPaddle.color : "#f6fbff");
    paddleSlot.innerHTML = `
      <div class="slot-paddle-icon"></div>
      <span class="slot-tag">PADDLE</span>
      <span class="slot-name">${firstPaddle ? this.skillDisplayName(firstPaddle) : "NO SKILL"}</span>
      <span class="slot-lv">★${total}</span>
    `;
    paddleSlot.onclick = () => {
      if (this.handlePlayingUiLaunch()) return;
      if (isUpgrade) {
        this.showPaddleDetail(paddle);
        return;
      }
      this.showPaddleDetail(paddle);
    };

    const bumperSlot = document.getElementById("slot-bumper");
    if (bumperSlot) {
      const bumper = typeof Game !== "undefined" ? Game.bumper : null;
      if (bumper && bumper.syncStats) bumper.syncStats();
      const firstBumper = bumper && bumper.skills ? bumper.skills[0] : null;
      const level = bumper ? (bumper.level || 0) : 0;
      const owned = bumper && bumper.isOwned ? bumper.isOwned() : level > 0;
      const maxHp = owned && bumper ? bumper.maxHp : 0;
      const hp = owned && bumper ? bumper.hp : 0;
      const broken = owned && bumper ? bumper.broken : false;
      const seconds = bumper && bumper.reviveTimer ? `${Math.ceil(bumper.reviveTimer)}s` : "READY";
      const bumperStars = Math.min(10, level);
      const skillLabel = firstBumper
        ? `${this.skillDisplayName(firstBumper)}${bumper.skills.length > 1 ? " +1" : ""}`
        : (owned ? "NO SKILL" : "LEVEL 0");
      const buyState = this.getBumperSlotState(bumper);
      const detailLabel = owned && firstBumper ? skillLabel : (buyState.detail || skillLabel);
      const dots = Array.from({ length: Math.max(1, maxHp) }, (_, index) => (
        `<span class="${owned && index < hp && !broken ? "on" : ""}"></span>`
      )).join("");
      const bumperSelected = false;
      bumperSlot.className = `slot ${owned ? "has-skills" : ""} ${broken ? "fallen" : ""} ${buyState.buyable ? "buyable" : ""} ${buyState.locked ? "locked" : ""} ${bumperSelected ? "selected-upgrade" : ""}`;
      bumperSlot.style.borderColor = "";
      bumperSlot.style.setProperty("--selected-color", firstBumper ? firstBumper.color : "#67d8ff");
      if (!owned) {
        // ロック中: シンプルな表示
        bumperSlot.innerHTML = `
          <div class="slot-bumper-icon empty"></div>
          <span class="slot-tag">BUMPER</span>
          <span class="slot-name">${buyState.label}</span>
          <span class="slot-lv">${buyState.detail}</span>
        `;
      } else {
        const compactDots = Array.from({ length: Math.max(1, maxHp) }, (_, index) => (
          `<span class="${index < hp && !broken ? "on" : ""}"></span>`
        )).join("");
        // 所有済み: アイコン + BUMPER + HPドット + スキル名
        bumperSlot.innerHTML = `
          <div class="slot-bumper-icon"></div>
          <span class="slot-tag">BUMPER</span>
          <div class="bumper-dots-compact">${compactDots}</div>
          <span class="slot-name">${broken ? `${seconds} REVIVING` : skillLabel}</span>
        `;
      }
      bumperSlot.onclick = () => {
        if (this.handlePlayingUiLaunch()) return;
        if (isUpgrade) {
          this.handleBumperSlotClick(bumper);
          return;
        }
        this.handleBumperSlotClick(bumper);
      };
    }
  },

  canBuyBallInCurrentPhase() {
    return typeof currentState !== "undefined" &&
      (currentState === STATE.SKILL_SELECT || currentState === STATE.UPGRADE);
  },

  getBallPurchaseSlotState(slotIndex, balls) {
    const ballNumber = slotIndex + 1;
    const nextBallNumber = balls.length + 1;
    const cost = getBallPurchaseCost(ballNumber);
    const price = Number.isFinite(cost) ? `PRICE ${formatNumber(cost)}T` : "MAX";
    const bumperUnlocked = typeof Game !== "undefined" && Game.bumper && Game.bumper.unlocked;
    const bumperBonus = ballNumber >= 2
      ? `<span class="slot-lock">${bumperUnlocked ? `+ BUMPER LV ${Math.min(ballNumber, BALL_MAX - 1)}` : `BUMPER ${formatNumber(BUMPER_UNLOCK_COST)}T`}</span>`
      : "";
    if (!this.canBuyBallInCurrentPhase()) {
      return { label: "EMPTY", detail: "NO SKILL", shortDetail: "NO SKILL", buyable: false, locked: false, cost };
    }
    if (ballNumber !== nextBallNumber) {
      return {
        label: "LOCKED",
        detail: `<span class="slot-price">${price}</span><span class="slot-lock">BALL ${nextBallNumber} FIRST</span>${bumperBonus}`,
        shortDetail: `BALL ${nextBallNumber} FIRST`,
        buyable: false,
        locked: true,
        cost
      };
    }
    return {
      label: `BUY ${formatNumber(cost)}T`,
      detail: `<span class="slot-price">${price}</span><span class="slot-lock">BALL ${ballNumber}</span>${bumperBonus}`,
      shortDetail: "AVAILABLE",
      buyable: Number.isFinite(cost),
      locked: false,
      cost
    };
  },

  handleEmptyBallSlotClick(slotIndex) {
    if (!this.canBuyBallInCurrentPhase()) {
      this.showToast("EMPTY BALL SLOT");
      return;
    }
    const nextBallNumber = Game.balls.length + 1;
    const ballNumber = slotIndex + 1;
    if (ballNumber !== nextBallNumber) {
      this.showToast(`BUY BALL ${nextBallNumber} FIRST`);
      return;
    }
    const cost = getBallPurchaseCost(ballNumber);
    if (Game.tokens < cost) {
      this.showToast(`NEED ${formatNumber(cost)} TOKENS`);
      return;
    }
    this.showConfirm({
      title: `BUY BALL ${ballNumber}`,
      message: `Use ${formatNumber(cost)} tokens?`,
      confirmLabel: "BUY",
      onConfirm: () => Game.buyNextBallWithTokens()
    });
  },

  canBuyBumperInCurrentPhase() {
    return typeof currentState !== "undefined" &&
      (currentState === STATE.SKILL_SELECT || currentState === STATE.UPGRADE);
  },

  getBumperSlotState(bumper) {
    const level = bumper ? (bumper.level || 0) : 0;
    const unlocked = bumper && bumper.unlocked;
    const autoMax = BALL_MAX - 1;
    if (!unlocked) {
      const canBuy = this.canBuyBumperInCurrentPhase();
      const price = formatNumber(BUMPER_UNLOCK_COST);
      return {
        label: canBuy ? `BUY ${price}T` : "LOCKED",
        detail: `<span class="slot-price">PRICE ${price}T</span>`,
        buyable: canBuy,
        locked: !canBuy
      };
    }
    return {
      label: `Lv ${level}`,
      detail: level >= autoMax ? "AUTO MAX" : `NEXT: BALL ${level + 2}`,
      buyable: false,
      locked: false
    };
  },

  handleBumperSlotClick(bumper) {
    if (!bumper) return;
    if (!bumper.unlocked) {
      if (this.canBuyBumperInCurrentPhase()) this.confirmBumperPurchase(bumper);
      else this.showBumperDetail(bumper);
      return;
    }
    this.showBumperDetail(bumper);
  },

  confirmBumperPurchase(bumper) {
    if (!bumper || bumper.unlocked) {
      this.showToast("BUMPER ALREADY UNLOCKED");
      return;
    }
    if (Game.tokens < BUMPER_UNLOCK_COST) {
      this.showToast(`NEED ${formatNumber(BUMPER_UNLOCK_COST)} TOKENS`);
      return;
    }
    const cost = formatNumber(BUMPER_UNLOCK_COST);
    this.showConfirm({
      title: "UNLOCK BUMPER",
      message: `Use ${cost} tokens?`,
      confirmLabel: "UNLOCK",
      onConfirm: () => Game.buyBumperLevelWithTokens()
    });
  },

  slotSkillChip(skill, index = 0) {
    const name = this.skillFullName(skill);
    return `
      <span class="slot-skill-chip ${index === 0 ? "primary" : ""}" style="--skill-color:${skill.color || "var(--accent-blue)"}">
        <span class="slot-skill-dot"></span>
        <span class="slot-skill-text">${name}</span>
        <span class="slot-skill-level">LV ${skill.level}</span>
      </span>
    `;
  },

  skillFullName(skill) {
    if (!skill) return "SKILL";
    return skill.name || SLOT_SKILL_LABELS[skill.id] || skill.shortName || skill.id || "SKILL";
  },

  skillDisplayName(skill) {
    if (!skill) return "SKILL";
    return SLOT_SKILL_LABELS[skill.id] || skill.shortName || skill.name || skill.id || "SKILL";
  },

  skillDescription(choice) {
    if (!choice) return "";
    return SKILL_DETAIL_TEXT[choice.id] || choice.description || "";
  },

  skillLevelText(choice, level = 1) {
    if (!choice) return "";
    const id = choice.id;
    const p = (value) => `${Math.round((value || 0) * 100)}%`;
    const n = (value, suffix = "") => {
      if (value === Infinity) return `全体${suffix}`;
      return `${Number.isInteger(value) ? value : Number(value).toFixed(1).replace(/\.0$/, "")}${suffix}`;
    };
    const v = (key, fallback = 0) => skillParam(id, level, key, fallback);
    if (id === "expert") return `AVG1 ${n(v("avgLv1"))}x / AVG3 ${n(v("avgLv3"))}x / AVG5 ${n(v("avgLv5"))}x`;
    if (id === "shatter") return `HP<=${p(v("threshold"))} / R${v("radius")} / HP${p(v("damage"))}`;
    switch (id) {
      case "penetration": return `${level}枚まで貫通`;
      case "splash": return `半径${v("radius")} / HP${p(v("damage"))}`;
      case "spread": return `${v("count")}発 / 各HP${p(v("damage"))}`;
      case "chain": return `${v("count")}連鎖 / 各HP${p(v("damage"))}`;
      case "sniper": return `${v("limit", 3) === Infinity ? "縦列全体" : `上${v("limit", 3)}個`} / HP${p(v("damage"))}`;
      case "doubleChance": return `${p(v("chance"))}発動 / 追加${p(v("damageMultiplier"))}`;
      case "crossfire": return `左右${v("countPerSide")}発 / 貫通${v("pierce")} / HP${p(v("damage"))}`;
      case "overload": return `1+n×${n(v("step"))}倍 / 上限${n(v("cap"))}倍`;
      case "fragment": return `${v("count")}発 / 各HP${p(v("damage"))}`;
      case "detonator": return `${v("hits")}ヒット毎 / 半径${v("radius")} / HP${p(v("damage"))}`;
      case "poison": return `${v("duration")}秒 / 0.5秒毎HP${p(v("damage"))}`;
      case "afterburn": return `半径${v("radius")} / ${v("duration")}秒 / HP${p(v("damage"))}`;
      case "lightning": return `${v("count")}体 / 半径${v("radius")} / HP${p(v("damage"))}`;
      case "blast": return `高さ${v("height")} / HP${p(v("damage"))}`;
      case "impact": return `初撃${n(v("multiplier"))}倍`;
      case "crash": return `速度火力${n(v("normalMultiplier"))}倍 / 上限${n(v("cap"))}倍`;
      case "sprint": return `${n(v("duration"), "秒")} / 速度${n(v("speedMultiplier"))}倍`;
      case "teleporter": return `${p(v("chance"))}でワープ`;
      case "immortality": return `${v("saves")}回復帰 / ${n(v("boostMultiplier"))}倍${n(v("boostDuration"), "秒")}`;
      case "mirror": return `BOUNCE ${n(v("duration"), "s")} / HP${p(v("damage"))}`;
      case "rebound": return `打ち返し後${n(v("multiplier"))}倍`;
      case "phantom": return `${v("count")}発 / HP${p(v("damage"))}`;
      case "aura": return `半径${v("radius")} / 0.1秒毎攻撃力${p(v("damage"))}`;
      case "berserker": return `${v("duration")}秒 / 速度${n(v("speedMultiplier"))}倍 / 火力${n(v("damageMultiplier"))}倍`;
      case "cycle": return `${v("interval")}秒ごと / 最大火力${n(v("damageMultiplier"))}倍`;
      case "echo": return `半径${v("radius")} / ${v("duration")}秒 / HP${p(v("damage"))}`;
      case "lastHit": return `撃破+${v("fixedBonus")} + HP/${v("hpDivisor")}`;
      case "scoreBoost": return `撃破スコア${n(v("multiplier"))}倍`;
      case "vampire": return `撃破時HP${p(v("percent"))}吸収`;
      case "paddleWidth": return `パドル幅${v("width")}`;
      case "bounceHeal": return `反射ごとHP${p(v("percent"))}回復`;
      case "reviveBoost": return `復活${n(v("seconds"), "秒")}短縮`;
      case "superBounce": return `${p(v("chance"))} / ${n(v("duration"), "秒")} / ${n(v("damageMultiplier"))}倍`;
      case "globalDamage": return `全ボール火力${n(v("multiplier"))}倍`;
      case "globalSpeed": return `全ボール速度${n(v("multiplier"))}倍`;
      case "bumperFortify": return `バンパーHP${v("hp")}`;
      case "bumperRecover": return `復活${n(v("seconds"), "秒")}`;
      default: return choice.description || "";
    }
  },

  updatePaddleHp(paddle) {
    const root = document.getElementById("paddle-hp");
    const fill = document.getElementById("paddle-hp-fill");
    const text = document.getElementById("paddle-hp-text");
    if (!root || !fill || !text || !paddle) return;
    const maxHp = Math.max(1, paddle.maxHp || 1);
    const hp = clamp(paddle.hp || 0, 0, maxHp);
    const ratio = hp / maxHp;
    fill.style.width = `${ratio * 100}%`;
    text.textContent = `${Math.ceil(hp)} / ${Math.ceil(maxHp)}`;
    root.classList.toggle("low", ratio <= 0.5 && ratio > 0.2);
    root.classList.toggle("danger", ratio <= 0.2);
    root.classList.toggle("hit", paddle.damageFlashTimer > 0);
    root.classList.toggle("heal", paddle.healFlashTimer > 0);
  },

  ballIconStyle(ball) {
    if (ball.skills.length === 0) {
      return `background:${ball.color};box-shadow:none`;
    }
    if (ball.skills.length === 1) {
      return `background:${ball.skills[0].color};box-shadow:none`;
    }
    const colors = ball.skills.map((skill) => skill.color).join(",");
    return `background:linear-gradient(135deg,${colors});box-shadow:none`;
  },

  showSkillSelect(balls, onSelect) {
    const cards = document.getElementById("skill-cards");
    const picker = document.getElementById("ball-picker");
    const rerollRow = document.getElementById("skill-reroll-row");
    let lastChoiceKey = "";
    let currentChoices = [];
    this.prepareSkillTarget(balls);
    this.renderSlots(balls, Game.paddle);
    this.clearSlotTargets();
    this.renderSkillTargetSelector(balls);

    const makeChoiceKey = (choices) => choices.map((choice) => choice.id).sort().join("|");
    const rollChoices = () => {
      const selectedBall = this.getSelectedSkillBall(balls);
      let choices = generateSkillChoices(balls, Game.paddle, Game.bumper, selectedBall ? selectedBall.ball : null);
      for (let attempt = 0; attempt < 8 && lastChoiceKey; attempt += 1) {
        if (makeChoiceKey(choices) !== lastChoiceKey) break;
        choices = generateSkillChoices(balls, Game.paddle, Game.bumper, selectedBall ? selectedBall.ball : null);
      }
      lastChoiceKey = makeChoiceKey(choices);
      return choices;
    };

    const renderChoices = (animate = false) => {
      this.clearSlotTargets();
      this.renderSlots(balls, Game.paddle);
      this.renderSkillTargetSelector(balls);
      const cost = getSkillRerollCost();
      const choices = currentChoices;
      if (rerollRow) {
        const disabled = Game.tokens < cost;
        rerollRow.innerHTML = `
          <div class="skill-reroll-status"><span>TOKENS</span><b>${formatNumber(Game.tokens)}</b></div>
          <button id="btn-skill-reroll" class="btn-reroll" type="button" ${disabled ? "disabled" : ""}>
            REROLL <span>${formatNumber(cost)}</span>
          </button>
        `;
        this.updateSkillRerollStatus();
      }
      cards.innerHTML = choices.map((choice) => this.skillCardHtml(choice)).join("");
      if (animate) {
        cards.classList.remove("rerolled");
        void cards.offsetWidth;
        cards.classList.add("rerolled");
        setTimeout(() => cards.classList.remove("rerolled"), 320);
      }

      [...cards.querySelectorAll(".skill-card")].forEach((card, index) => {
        const choice = choices[index];
        card.addEventListener("click", () => {
          [...cards.querySelectorAll(".skill-card")].forEach((node) => node.classList.remove("selected"));
          card.classList.add("selected");
          card.style.borderColor = choice.color;
          if (choice.type === "addBall") {
            AudioSystem.playUiSuccess();
            onSelect(choice, null);
            return;
          }
          if (choice.type === "paddle") {
            AudioSystem.playUiSuccess();
            onSelect(choice, Game.paddle);
            return;
          }
          if (choice.type === "bumper") {
            AudioSystem.playUiSuccess();
            onSelect(choice, Game.bumper);
            return;
          }
          const selectedBall = this.getSelectedSkillBall(balls);
          if (selectedBall && canEquipSkill(selectedBall.ball, choice.id)) {
            AudioSystem.playUiSuccess();
            onSelect(choice, selectedBall.ball, selectedBall.index);
            return;
          }
          if (selectedBall) this.showToast("SELECTED BALL IS FULL");
          AudioSystem.playUiOpen();
          this.showBallPicker(choice, balls, onSelect);
        });
      });

      const rerollButton = document.getElementById("btn-skill-reroll");
      if (rerollButton) {
        rerollButton.addEventListener("click", () => {
          const cost = getSkillRerollCost();
          if (Game.tokens < cost) {
            this.showToast("NOT ENOUGH TOKENS");
            return;
          }
          Game.tokens -= cost;
          Game.skillRerollCount = Math.max(0, Math.floor(Game.skillRerollCount || 0)) + 1;
          Game.updateHud();
          AudioSystem.playUiOpen();
          currentChoices = rollChoices();
          renderChoices(true);
        });
      }
    };

    this.onSkillTargetChanged = () => {
      renderChoices(false);
    };
    currentChoices = rollChoices();
    renderChoices(true);
  },

  updateSkillRerollStatus() {
    const rerollButton = document.getElementById("btn-skill-reroll");
    const tokenValue = document.querySelector(".skill-reroll-status b");
    if (!rerollButton || !tokenValue || typeof Game === "undefined") return;
    const cost = getSkillRerollCost();
    const costValue = rerollButton.querySelector("span");
    tokenValue.textContent = formatNumber(Game.tokens);
    if (costValue) costValue.textContent = formatNumber(cost);
    rerollButton.disabled = Game.tokens < cost;
  },

  skillStarLevelHtml(level, max = 5) {
    const safeMax = Math.max(1, Math.floor(max || 5));
    const current = clamp(Math.floor(level || 0), 0, safeMax);
    const stars = Array.from({ length: safeMax }, (_, index) => {
      const filled = index < current;
      return `<span class="skill-star ${filled ? "filled" : "empty"}">${filled ? "★" : "☆"}</span>`;
    }).join("");
    return `<span class="skill-stars" aria-label="LEVEL ${current} OF ${safeMax}">${stars}</span>`;
  },

  skillCardHtml(choice) {
    const isAdd = choice.type === "addBall";
    const description = this.skillDescription(choice);
    const level = clamp(choice.level || 1, 1, 5);
    const category = isAdd ? "NEW BALL" : choice.category.toUpperCase();
    const levelBadge = isAdd ? `<span class="skill-stars skill-stars-empty">NEW</span>` : this.skillStarLevelHtml(level);
    return `
      <button class="skill-card ${isAdd ? "add-ball" : ""}" style="--skill-color:${choice.color}" type="button">
        <span class="skill-card-head">
          <span class="skill-icon" style="background:${choice.color};box-shadow:none"></span>
          <span class="skill-badge">${category}</span>
        </span>
        <span class="skill-copy">
          <span class="skill-name-row">
            <span class="skill-name">${choice.name}</span>
            ${levelBadge}
          </span>
          <span class="skill-description">${description}</span>
        </span>
      </button>
    `;
  },

  showBallPicker(choice, balls, onSelect) {
    this.clearSlotTargets();
    this.renderSkillTargetSelector(balls, choice, onSelect);
    balls.forEach((ball, index) => {
      const slot = document.getElementById(`slot-${index}`);
      if (!slot) return;
      const canEquip = canEquipSkill(ball, choice.id);
      slot.style.setProperty("--target-color", choice.color || "#ffe66b");
      slot.classList.add(canEquip ? "targetable" : "disabled-target");
      if (this.isSkillTargetSelected(index)) slot.classList.add("selected-skill");
      slot.onclick = () => {
        if (!canEquip) {
          this.showToast("THIS BALL IS FULL");
          return;
        }
        onSelect(choice, ball, index);
      };
    });
  },

  renderSkillTargetSelector(balls, choice = null, onSelect = null) {
    const picker = document.getElementById("ball-picker");
    if (!picker) return;
    picker.innerHTML = "";
  },

  skillTargetPickerHtml(choice, balls) {
    const target = this.getSelectedSkillBall(balls);
    const targetBall = target ? target.ball : balls[0];
    const targetIndex = target ? target.index : 0;
    const targetColor = choice ? (choice.color || "#ffffff") : (targetBall ? ((targetBall.skills[0] ? targetBall.skills[0].color : targetBall.color) || "#ffffff") : "#ffffff");
    const title = choice ? choice.name : "SELECT TARGET";
    const modeLabel = choice ? "APPLY SKILL TO" : "CURRENT TARGET";
    const selectedSkills = targetBall ? this.targetSkillListHtml(targetBall) : `<span class="target-skill-empty">EMPTY</span>`;
    const options = balls.map((ball, index) => {
      const canEquip = choice ? canEquipSkill(ball, choice.id) : true;
      const first = ball.skills[0];
      const color = first ? first.color : ball.color;
      const skills = this.targetSkillListHtml(ball);
      const slotCount = `${ball.skills.length}/3`;
      const selected = index === targetIndex;
      return `
        <button class="ball-target ${selected ? "selected" : ""} ${canEquip ? "" : "disabled"}" type="button" data-ball="${index}" style="--ball-color:${color || "#ffffff"};--target-color:${targetColor}" ${canEquip ? "" : "disabled"}>
          <span class="ball-target-head">
            <span class="ball-target-icon" style="${this.ballIconStyle(ball)}"></span>
            <span class="ball-target-copy">
              <span class="ball-target-label">BALL ${index + 1}</span>
              <span class="ball-target-name">${slotCount} SLOTS</span>
            </span>
          </span>
          <span class="ball-target-skills">${skills}</span>
          <span class="ball-target-state">${selected ? "SELECTED" : (canEquip ? (choice ? "APPLY" : "SELECT") : "FULL")}</span>
        </button>
      `;
    }).join("");
    return `
      <div class="target-panel skill-target-panel ${choice ? "choosing-skill" : "idle-target"}" style="--target-color:${targetColor}">
        <div class="target-panel-main">
          <span class="target-avatar" style="${targetBall ? this.ballIconStyle(targetBall) : `background:${targetColor}`}"></span>
          <span class="target-copy">
            <span class="target-kicker">${modeLabel}</span>
            <span class="target-title">${targetBall ? `BALL ${targetIndex + 1}` : title}</span>
            <span class="target-selected-skills">${selectedSkills}</span>
          </span>
          <span class="target-selected-pill">${choice ? "CHOOSE" : `${targetBall ? targetBall.skills.length : 0}/3 SLOT`}</span>
        </div>
        <div class="skill-target-grid" style="--target-count:${Math.max(1, Math.min(4, balls.length))}">${options}</div>
      </div>
    `;
  },

  targetSkillListHtml(entity) {
    if (!entity || !entity.skills || entity.skills.length === 0) {
      return `<span class="target-skill-empty">EMPTY</span>`;
    }
    return entity.skills.map((skill) => `
      <span class="target-skill-chip" style="--skill-color:${skill.color || "var(--accent-blue)"}">
        <span></span>
        <b>${this.skillDisplayName(skill)}</b>
        <em>★${skill.level}</em>
      </span>
    `).join("");
  },

  clearSlotTargets() {
    for (let i = 0; i < BALL_MAX; i += 1) {
      const slot = document.getElementById(`slot-${i}`);
      if (!slot) continue;
      slot.classList.remove("targetable", "disabled-target", "selected-upgrade", "selected-skill");
      slot.style.removeProperty("--target-color");
    }
    const paddleSlot = document.getElementById("slot-paddle");
    const bumperSlot = document.getElementById("slot-bumper");
    paddleSlot?.classList.remove("targetable", "disabled-target", "selected-upgrade");
    bumperSlot?.classList.remove("targetable", "disabled-target", "selected-upgrade");
    paddleSlot?.style.removeProperty("--target-color");
    bumperSlot?.style.removeProperty("--target-color");
  },

  isUpgradeTargetSelected(type, index = null) {
    const target = this.selectedUpgradeTarget;
    if (!target || target.type !== type) return false;
    return type !== "ball" || target.index === index;
  },

  isSkillTargetSelected(index) {
    const target = this.selectedSkillTarget;
    return !!target && target.type === "ball" && target.index === index;
  },

  prepareSkillTarget(balls) {
    if (this.selectedSkillTarget && balls[this.selectedSkillTarget.index]) return;
    if (this.selectedUpgradeTarget && this.selectedUpgradeTarget.type === "ball" && balls[this.selectedUpgradeTarget.index]) {
      this.selectedSkillTarget = { type: "ball", index: this.selectedUpgradeTarget.index };
      return;
    }
    const firstBallIndex = balls.findIndex(Boolean);
    this.selectedSkillTarget = firstBallIndex >= 0 ? { type: "ball", index: firstBallIndex } : null;
  },

  getSelectedSkillBall(balls) {
    const target = this.selectedSkillTarget;
    if (!target || target.type !== "ball") return null;
    const ball = balls[target.index];
    return ball ? { ball, index: target.index } : null;
  },

  selectSkillTarget(index) {
    if (typeof currentState === "undefined" || currentState !== STATE.SKILL_SELECT) return;
    if (!Game.balls[index]) {
      this.handleEmptyBallSlotClick(index);
      return;
    }
    this.selectedSkillTarget = { type: "ball", index };
    AudioSystem.playUiOpen();
    if (typeof this.onSkillTargetChanged === "function") {
      this.onSkillTargetChanged();
      return;
    }
    this.renderSlots(Game.balls, Game.paddle);
    this.renderSkillTargetSelector(Game.balls);
  },

  normalizeUpgradeTarget(balls) {
    const target = this.selectedUpgradeTarget;
    if (target && target.type === "ball" && balls[target.index]) return target;
    const firstBallIndex = balls.findIndex(Boolean);
    this.selectedUpgradeTarget = { type: "ball", index: firstBallIndex >= 0 ? firstBallIndex : 0 };
    return this.selectedUpgradeTarget;
  },

  selectUpgradeTarget(type, index = 0) {
    if (typeof currentState === "undefined" || currentState !== STATE.UPGRADE) return;
    if (type !== "ball") return;
    if (type === "ball" && !Game.balls[index]) {
      this.handleEmptyBallSlotClick(index);
      return;
    }
    this.selectedUpgradeTarget = { type, index };
    this.renderUpgradePanel();
    this.flashUpgradeList("target-switched");
    this.renderSlots(Game.balls, Game.paddle);
  },

  showUpgrade(balls, tokens, onPurchase, onComplete) {
    this.onSkillTargetChanged = null;
    this.upgradeContext = { balls, onPurchase, onComplete };
    if (typeof Game !== "undefined" && Game.updateHud) Game.updateHud();
    this.normalizeUpgradeTarget(balls);
    this.renderUpgradePanel();
    document.getElementById("btn-continue").onclick = onComplete;
    this.renderSlots(balls, Game.paddle);
  },

  renderUpgradePanel() {
    const list = document.getElementById("upgrade-list");
    if (!list || !this.upgradeContext) return;
    const { balls, onPurchase } = this.upgradeContext;
    const target = this.normalizeUpgradeTarget(balls);
    const ball = balls[target.index] || balls[0];
    const color = ball ? (ball.skills[0] ? ball.skills[0].color : ball.color) : "#4a9eff";
    list.style.setProperty("--upgrade-color", color || "#4a9eff");
    list.innerHTML = this.upgradeBallHtml(ball, target.index || 0);

    list.querySelectorAll(".btn-upgrade-buy").forEach((button) => {
      button.addEventListener("click", () => {
        const bought = onPurchase(Number(button.dataset.ball), button.dataset.key);
        if (bought) AudioSystem.playUiSuccess();
        this.renderUpgradePanel();
        if (bought) this.flashUpgradeList("upgrade-success");
        this.renderSlots(Game.balls, Game.paddle);
      });
    });
  },

  flashUpgradeList(className) {
    const list = document.getElementById("upgrade-list");
    if (!list) return;
    list.classList.remove(className);
    void list.offsetWidth;
    list.classList.add(className);
    setTimeout(() => list.classList.remove(className), 420);
  },

  upgradeTargetLabel(target) {
    if (target.type === "ball") return `BALL ${target.index + 1}`;
    if (target.type === "paddle") return "PADDLE";
    return "BUMPER";
  },

  upgradeTargetPanelHtml(target, balls) {
    const meta = this.upgradeTargetMeta(target, balls);
    return `
      <div class="upgrade-target-shell">
        <div class="upgrade-simple-header" style="--target-color:${meta.color}">
          <div class="upgrade-simple-title">
            ${meta.icon}
            <span>
              <b>${meta.title}</b>
              <em>${meta.status}</em>
            </span>
          </div>
          <div class="upgrade-simple-token">
            <span></span>
            <b>${formatNumber(Game.tokens)}</b>
          </div>
        </div>
        ${this.upgradeTargetSwitchHtml(target, balls)}
      </div>
    `;
  },

  upgradeTargetMeta(target, balls) {
    if (target.type === "ball") {
      const ball = balls[target.index] || balls[0];
      const color = ball ? (ball.skills[0] ? ball.skills[0].color : ball.color) : "#ffffff";
      const damage = ball ? Math.round(ball.getBaseDamage ? ball.getBaseDamage(Game) : 100 + ball.baseDamageBonus + ball.upgrades.damage * 50) : 0;
      return {
        title: `BALL ${target.index + 1}`,
        color,
        icon: `<span class="target-avatar ball-avatar" style="${ball ? this.ballIconStyle(ball) : "background:#ffffff"}"></span>`,
        status: ball ? `${ball.skills.length}/3 SKILL SLOTS` : "EMPTY",
        power: `DMG ${formatNumber(damage)}`,
        skills: this.targetSkillListHtml(ball)
      };
    }
    if (target.type === "paddle") {
      return {
        title: "PADDLE",
        color: "#f6fbff",
        icon: `<span class="target-avatar paddle-avatar"></span>`,
        status: `HP ${Math.ceil(Game.paddle.hp)} / ${Math.ceil(Game.paddle.maxHp)}`,
        power: `WIDTH ${Math.round(Game.paddle.getWidth())}`,
        skills: this.targetSkillListHtml(Game.paddle)
      };
    }
    const bumper = typeof Game !== "undefined" ? Game.bumper : null;
    const color = bumper && bumper.skills && bumper.skills[0] ? bumper.skills[0].color : "#67d8ff";
    const level = bumper ? (bumper.level || 0) : 0;
    const unlocked = bumper && bumper.unlocked;
    return {
      title: "BUMPER",
      color,
      icon: `<span class="target-avatar bumper-avatar"></span>`,
      status: unlocked ? `AUTO LV ${level}/${BALL_MAX - 1}` : "LOCKED",
      power: unlocked && level > 0 && bumper ? `HP ${Math.ceil(bumper.hp)} / ${Math.ceil(bumper.maxHp)}` : `UNLOCK ${formatNumber(BUMPER_UNLOCK_COST)}T`,
      skills: this.targetSkillListHtml(bumper)
    };
  },

  upgradeTargetSwitchHtml(target, balls) {
    const choices = [];
    for (let i = 0; i < BALL_MAX; i += 1) {
      const ball = balls[i];
      const selected = target.type === "ball" && target.index === i;
      const color = ball ? (ball.skills[0] ? ball.skills[0].color : ball.color) : "rgba(255,255,255,0.24)";
      choices.push(`
        <button class="upgrade-target-choice ${selected ? "selected" : ""} ${ball ? "" : "empty"}" type="button" data-type="ball" data-index="${i}" style="--target-color:${color}" ${ball ? "" : "disabled"}>
          <span class="upgrade-target-choice-icon" style="${ball ? this.ballIconStyle(ball) : "background:rgba(255,255,255,0.1);box-shadow:none"}"></span>
          <span class="upgrade-target-choice-label">B${i + 1}</span>
          <span class="upgrade-target-choice-state">${ball ? `${ball.skills.length}/3` : "EMPTY"}</span>
        </button>
      `);
    }
    const paddleSelected = target.type === "paddle";
    const bumperSelected = target.type === "bumper";
    const bumperUnlocked = Game.bumper && Game.bumper.unlocked;
    const bumperLevel = Game.bumper ? (Game.bumper.level || 0) : 0;
    choices.push(`
      <button class="upgrade-target-choice wide ${paddleSelected ? "selected" : ""}" type="button" data-type="paddle" style="--target-color:#f6fbff">
        <span class="upgrade-target-choice-paddle"></span>
        <span class="upgrade-target-choice-label">PADDLE</span>
        <span class="upgrade-target-choice-state">HP</span>
      </button>
    `);
    choices.push(`
      <button class="upgrade-target-choice wide ${bumperSelected ? "selected" : ""}" type="button" data-type="bumper" style="--target-color:#67d8ff">
        <span class="upgrade-target-choice-bumper"></span>
        <span class="upgrade-target-choice-label">BUMPER</span>
        <span class="upgrade-target-choice-state">${bumperUnlocked ? `AUTO ${bumperLevel}/${BALL_MAX - 1}` : `${formatNumber(BUMPER_UNLOCK_COST)}T`}</span>
      </button>
    `);
    return `<div class="upgrade-target-strip">${choices.join("")}</div>`;
  },

  upgradeTargetHtml(target, balls) {
    if (target.type === "paddle") return this.upgradePaddleHtml(Game.paddle);
    if (target.type === "bumper") return this.upgradeBumperHtml(Game.bumper);
    const ball = balls[target.index] || balls[0];
    return this.upgradeBallHtml(ball, target.index || 0);
  },

  upgradeBallHtml(ball, ballIndex) {
    if (!ball) return "";
    const labels = {
      speed: "SPEED",
      damage: "DAMAGE",
      reviveSpeed: "SPAWN",
      critRate: "CRITICAL"
    };
    const rows = ["speed", "damage", "reviveSpeed", "critRate"].map((key) => {
      const definition = UPGRADE_DEFS[key];
      const rawLevel = Math.max(0, Math.floor(Number(ball.upgrades[key]) || 0));
      const level = Math.min(rawLevel, definition.max);
      const cost = getUpgradeCost(level, key);
      const disabled = Game.tokens < cost || rawLevel >= definition.max;
      const isMax = level >= definition.max;
      const canBuy = !isMax && Game.tokens >= cost;
      const buttonHint = level >= definition.max
        ? `${labels[key]} MAX`
        : `${labels[key]} ${formatNumber(cost)}T`;
      const priceText = isMax ? "MAX" : `${this.compactUpgradeCost(cost)}T`;
      const fill = clamp((level / Math.max(1, definition.max)) * 100, 0, 100);
      return `
        <div class="upgrade-row simple-upgrade-row">
          <div class="upgrade-main">
            <div class="upgrade-level-head">
              <div class="upgrade-name">${labels[key]}</div>
              <div class="upgrade-gauge">LV ${level}/${definition.max}</div>
            </div>
            <div class="upgrade-level-meter" style="--level-fill:${fill}%" aria-label="${labels[key]} LEVEL ${level}/${definition.max}">
              <span class="upgrade-level-fill"></span>
            </div>
          </div>
          <div class="upgrade-actions ${canBuy ? "can-buy" : ""}">
            <span class="upgrade-price-pill ${isMax ? "maxed" : ""}">
              <span class="upgrade-price-token"></span>
              <b>${priceText}</b>
            </span>
            <button class="btn-buy btn-upgrade-buy" data-ball="${ballIndex}" data-key="${key}" title="${buttonHint}" aria-label="${buttonHint}" ${disabled ? "disabled" : ""}>BUY</button>
          </div>
        </div>
      `;
    }).join("");
    return `
      <section class="upgrade-ball simple-upgrade-list">
        ${rows}
      </section>
    `;
  },

  compactUpgradeCost(value) {
    const amount = Math.max(0, Number(value) || 0);
    if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(amount >= 10_000_000_000 ? 1 : 2).replace(/\.0+$/, "").replace(/(\.\d)0$/, "$1")}B`;
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(amount >= 10_000_000 ? 1 : 2).replace(/\.0+$/, "").replace(/(\.\d)0$/, "$1")}M`;
    if (amount >= 100_000) return `${(amount / 1_000).toFixed(0)}K`;
    return formatNumber(amount);
  },

  upgradePaddleHtml(paddle) {
    const hp = paddle ? `${Math.ceil(paddle.hp)} / ${Math.ceil(paddle.maxHp)}` : "0 / 0";
    const width = paddle ? Math.round(paddle.getWidth()) : 0;
    const skills = this.upgradeSkillListHtml(paddle);
    return `
      <section class="upgrade-ball upgrade-target">
        <div class="upgrade-ball-title">
          <span class="slot-paddle-icon"></span>
          <span>PADDLE</span>
        </div>
        <div class="upgrade-row">
          <div>
            <div class="upgrade-name">HP</div>
            <div class="upgrade-gauge">${hp}</div>
            <div class="upgrade-meter" style="--fill:${paddle ? (paddle.hp / Math.max(1, paddle.maxHp)) * 100 : 0}%"></div>
          </div>
          <div class="upgrade-actions">
            <span class="upgrade-value">${hp}</span>
          </div>
        </div>
        <div class="upgrade-row">
          <div>
            <div class="upgrade-name">WIDTH</div>
            <div class="upgrade-gauge">SKILL +${getSkillLevel(paddle, "paddleWidth")}</div>
          </div>
          <div class="upgrade-actions">
            <span class="upgrade-value">${width}</span>
          </div>
        </div>
        <div class="upgrade-skill-box">${skills}</div>
      </section>
    `;
  },

  upgradeBumperHtml(bumper) {
    const level = bumper ? (bumper.level || 0) : 0;
    const unlocked = bumper && bumper.unlocked;
    const autoMax = BALL_MAX - 1;
    const ballCount = typeof Game !== "undefined" && Game.balls ? Game.balls.length : 1;
    const nextBall = Math.min(BALL_MAX, level + 2);
    const hp = bumper ? `${Math.ceil(bumper.hp)} / ${Math.ceil(bumper.maxHp)}` : "0 / 0";
    const levelFill = autoMax > 0 ? Math.min(100, (level / autoMax) * 100) : 100;
    const skills = this.upgradeSkillListHtml(bumper);
    if (!unlocked) {
      const canBuy = Game.tokens >= BUMPER_UNLOCK_COST;
      return `
        <section class="upgrade-ball upgrade-target">
          <div class="upgrade-ball-title">
            <span class="slot-bumper-icon empty"></span>
            <span>BUMPER</span>
          </div>
          <div class="upgrade-row">
            <div>
              <div class="upgrade-name">UNLOCK</div>
              <div class="upgrade-gauge">REQUIRES ${formatNumber(BUMPER_UNLOCK_COST)}T</div>
              <div class="upgrade-meter" style="--fill:${Math.min(100, (Game.tokens / BUMPER_UNLOCK_COST) * 100)}%"></div>
            </div>
            <div class="upgrade-actions">
              <span class="upgrade-cost">${formatNumber(BUMPER_UNLOCK_COST)}</span>
              <button class="btn-buy btn-bumper-buy" type="button" ${canBuy ? "" : "disabled"}>BUY</button>
            </div>
          </div>
          <div class="upgrade-row">
            <div>
              <div class="upgrade-name">AUTO LINK</div>
              <div class="upgrade-gauge">LOCKED</div>
            </div>
            <div class="upgrade-actions">
              <span class="upgrade-value">OFF</span>
            </div>
          </div>
          <div class="upgrade-skill-box"><span class="upgrade-skill-empty">UNLOCK FIRST</span></div>
        </section>
      `;
    }
    return `
      <section class="upgrade-ball upgrade-target">
        <div class="upgrade-ball-title">
          <span class="slot-bumper-icon ${level > 0 ? "" : "empty"}"></span>
          <span>BUMPER</span>
        </div>
        <div class="upgrade-row">
          <div>
            <div class="upgrade-name">AUTO LINK</div>
            <div class="upgrade-gauge">BALLS ${ballCount}/${BALL_MAX} / BUMPER LV ${level}/${autoMax}</div>
            <div class="upgrade-meter" style="--fill:${levelFill}%"></div>
          </div>
          <div class="upgrade-actions">
            <span class="upgrade-value">${level >= autoMax ? "AUTO MAX" : `BALL ${nextBall}`}</span>
          </div>
        </div>
        <div class="upgrade-row">
          <div>
            <div class="upgrade-name">HP</div>
            <div class="upgrade-gauge">${level > 0 ? hp : "UNLOCK FIRST"}</div>
          </div>
          <div class="upgrade-actions">
            <span class="upgrade-value">${level > 0 ? hp : "NONE"}</span>
          </div>
        </div>
        <div class="upgrade-row">
          <div>
            <div class="upgrade-name">RECOVER</div>
            <div class="upgrade-gauge">LEVEL +${getSkillLevel(bumper, "bumperRecover")}</div>
          </div>
          <div class="upgrade-actions">
            <span class="upgrade-value">${level > 0 && bumper ? bumper.getReviveTime().toFixed(1) : "LOCKED"}${level > 0 ? "s" : ""}</span>
          </div>
        </div>
        <div class="upgrade-skill-box">${skills}</div>
      </section>
    `;
  },

  upgradeSkillListHtml(entity) {
    if (!entity || !entity.skills || entity.skills.length === 0) {
      return `<span class="upgrade-skill-empty">NO SKILL</span>`;
    }
    return entity.skills.map((skill) => this.slotSkillChip(skill)).join("");
  },

  showGameOver(score, blocksDestroyed, highScore, bestBlocks) {
    const root = document.getElementById("gameover-card");
    root.innerHTML = `
      <div class="gameover-card">
        <p class="gameover-title">GAME OVER</p>
        <p class="gameover-score" id="go-score">0</p>
        <p class="gameover-best">BEST: ${formatNumber(highScore)}</p>
        <p class="gameover-meta">BLOCKS: ${formatNumber(blocksDestroyed)}</p>
        <p class="gameover-meta">BEST BLOCKS: ${formatNumber(bestBlocks)}</p>
        <div class="gameover-divider"></div>
        <button class="btn-start" id="btn-retry">PLAY AGAIN</button>
      </div>
    `;
    const scoreNode = document.getElementById("go-score");
    const start = performance.now();
    const animate = (now) => {
      const progress = clamp((now - start) / 2000, 0, 1);
      scoreNode.textContent = formatNumber(score * progress);
      if (progress < 1) requestAnimationFrame(animate);
      else scoreNode.textContent = formatNumber(score);
    };
    requestAnimationFrame(animate);
    document.getElementById("btn-retry").addEventListener("click", () => {
      AudioSystem.unlock();
      Game.init();
      setState(STATE.PLAYING);
      Game.startRun();
    });
  },

  showRanking() {
    const highScore = Number(localStorage.getItem("ricoBlast_highScore") || 0);
    const bestBlocks = Number(localStorage.getItem("ricoBlast_bestBlocks") || 0);
    const title = document.getElementById("screen-title");
    title.innerHTML = `
      <div class="simple-card">
        <p class="simple-title">RANKING</p>
        <p class="simple-line">BEST SCORE</p>
        <p class="gameover-score">${formatNumber(highScore)}</p>
        <p class="simple-line">BEST BLOCKS ${formatNumber(bestBlocks)}</p>
        <div class="simple-divider"></div>
        <button class="btn-sub" id="btn-back">BACK</button>
      </div>
    `;
    document.getElementById("btn-back").addEventListener("click", () => this.initTitle());
  },

  showSettings() {
    const title = document.getElementById("screen-title");
    title.innerHTML = `
      <div class="simple-card">
        <p class="simple-title">SETTINGS</p>
        <p class="simple-line">SOUND: READY</p>
        <p class="simple-line">INPUT: TOUCH / POINTER</p>
        <div class="simple-divider"></div>
        <button class="btn-sub" id="btn-back">BACK</button>
      </div>
    `;
    document.getElementById("btn-back").addEventListener("click", () => this.initTitle());
  },

  showBallDetail(ball, number) {
    const skills = ball.skills.length
      ? ball.skills.map((skill) => `${skill.name} ★${skill.level}`).join(" / ")
      : "スキルなし";
    this.showToast(`BALL ${number}: ${skills}`);
  },

  showPaddleDetail(paddle) {
    const skills = paddle.skills.length
      ? paddle.skills.map((skill) => `${skill.name} ★${skill.level}`).join(" / ")
      : "パドルスキルなし";
    this.showToast(`PADDLE: ${skills}`);
  },

  showBumperDetail(bumper) {
    if (!bumper) return;
    const skills = bumper.skills.length
      ? bumper.skills.map((skill) => `${skill.name} Lv${skill.level}`).join(" / ")
      : "バンパースキルなし";
    if (!bumper.unlocked || (bumper.level || 0) <= 0) {
      this.showToast(`BUMPER LOCKED: BUY ${formatNumber(BUMPER_UNLOCK_COST)}T`);
      return;
    }
    this.showToast(`BUMPER Lv ${bumper.level} HP ${bumper.hp}/${bumper.maxHp}: AUTO FROM BALLS / ${skills}`);
  },

  showBallDetail(ball, number) {
    const skills = ball.skills.length
      ? ball.skills.map((skill) => `${this.skillDisplayName(skill)} ★${skill.level}`).join(" / ")
      : "NO SKILL";
    this.showToast(`BALL ${number}: ${skills}`);
  },

  showPaddleDetail(paddle) {
    const skills = paddle.skills.length
      ? paddle.skills.map((skill) => `${this.skillDisplayName(skill)} ★${skill.level}`).join(" / ")
      : "NO SKILL";
    this.showToast(`PADDLE: ${skills}`);
  },

  showBumperDetail(bumper) {
    if (!bumper) return;
    const skills = bumper.skills.length
      ? bumper.skills.map((skill) => `${this.skillDisplayName(skill)} ★${skill.level}`).join(" / ")
      : "NO SKILL";
    if (!bumper.unlocked || (bumper.level || 0) <= 0) {
      this.showToast(`BUMPER LOCKED: BUY ${formatNumber(BUMPER_UNLOCK_COST)}T`);
      return;
    }
    this.showToast(`BUMPER Lv ${bumper.level} HP ${bumper.hp}/${bumper.maxHp}: AUTO FROM BALLS / ${skills}`);
  },

  showConfirm({ title, message, confirmLabel = "OK", cancelLabel = "CANCEL", onConfirm }) {
    let root = document.getElementById("confirm-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "confirm-root";
      root.setAttribute("aria-live", "polite");
      document.body.appendChild(root);
    }
    root.innerHTML = `
      <div class="confirm-backdrop"></div>
      <div class="confirm-card" role="dialog" aria-modal="true">
        <div class="confirm-title">${title}</div>
        <div class="confirm-message">${message}</div>
        <div class="confirm-actions">
          <button class="btn-confirm-cancel" type="button">${cancelLabel}</button>
          <button class="btn-confirm-ok" type="button">${confirmLabel}</button>
        </div>
      </div>
    `;
    root.classList.add("active");
    const close = () => {
      root.classList.remove("active");
      root.innerHTML = "";
    };
    root.querySelector(".confirm-backdrop").addEventListener("click", close);
    root.querySelector(".btn-confirm-cancel").addEventListener("click", close);
    root.querySelector(".btn-confirm-ok").addEventListener("click", () => {
      close();
      AudioSystem.playUiSuccess();
      if (onConfirm) onConfirm();
    });
  },

  showToast(message) {
    const root = document.getElementById("toast-root");
    root.innerHTML = `<div class="toast-card">${message}</div>`;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      root.innerHTML = "";
    }, 2400);
  }
};
