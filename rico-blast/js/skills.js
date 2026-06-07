const BALL_MAX = 3;
const BALL_COLORS = ["#ff6b6b", "#4a9eff", "#ffcc4a"];

const UPGRADE_DEFS = {
  speed: { label: "速度", baseCost: 10, max: 5 },
  damage: { label: "ダメージ", baseCost: 10, max: 5 },
  reviveSpeed: { label: "復活速度", baseCost: 10, max: 5 },
  critRate: { label: "クリティカル率", baseCost: 10, max: 5 }
};

Object.assign(UPGRADE_DEFS, {
  speed: { ...UPGRADE_DEFS.speed, costs: [120, 300, 800, 2200, 6200] },
  damage: { ...UPGRADE_DEFS.damage, costs: [180, 450, 1200, 3400, 9600] },
  reviveSpeed: { ...UPGRADE_DEFS.reviveSpeed, costs: [140, 360, 950, 2600, 7200] },
  critRate: { ...UPGRADE_DEFS.critRate, costs: [160, 400, 1050, 3000, 8400] }
});

const SKILLS = {
  homing: {
    id: "homing",
    name: "ホーミング",
    type: "ball",
    category: "movement",
    color: "#4a9eff",
    maxLevel: 5,
    description: "最も近いブロックへ軌道を微補正する",
    applyEffect(ball, game, level) {
      const target = game.findNearestBlock(ball.x, ball.y);
      if (!target) return;
      steerBallToward(ball, target.cx, target.cy, 0.012 * level);
    }
  },
  penetration: {
    id: "penetration",
    name: "貫通",
    type: "ball",
    category: "attack",
    color: "#ff4a4a",
    maxLevel: 5,
    description: "数枚のブロックを反射せず貫く"
  },
  immortality: {
    id: "immortality",
    name: "不死",
    type: "ball",
    category: "movement",
    color: "#ffffff",
    maxLevel: 5,
    description: "落下時に一定回数だけ跳ね返る"
  },
  sprint: {
    id: "sprint",
    name: "スプリント",
    type: "ball",
    category: "movement",
    color: "#4a9eff",
    maxLevel: 5,
    description: "パドル直後の2秒だけ高速化する"
  },
  teleporter: {
    id: "teleporter",
    name: "テレポーター",
    type: "ball",
    category: "movement",
    color: "#44ddcc",
    maxLevel: 5,
    description: "打ち返し時にブロック群の前へ跳ぶ"
  },
  splash: {
    id: "splash",
    name: "スプラッシュ",
    type: "ball",
    category: "attack",
    color: "#ffcc4a",
    maxLevel: 5,
    description: "破壊時に周囲へ範囲ダメージ"
  },
  spread: {
    id: "spread",
    name: "拡散",
    type: "ball",
    category: "attack",
    color: "#ff8844",
    maxLevel: 5,
    description: "落下直前に複数方向へ分裂弾を出す"
  },
  chain: {
    id: "chain",
    name: "チェーン",
    type: "ball",
    category: "attack",
    color: "#ffcc4a",
    maxLevel: 5,
    description: "破壊後に隣接ブロックへ連鎖する"
  },
  sniper: {
    id: "sniper",
    name: "スナイパー",
    type: "ball",
    category: "attack",
    color: "#ff4a4a",
    maxLevel: 5,
    description: "破壊時に同じ列へ追加ダメージ"
  },
  magnetism: {
    id: "magnetism",
    name: "磁力",
    type: "ball",
    category: "attack",
    color: "#44ddcc",
    maxLevel: 5,
    description: "小弾が周囲ブロックに吸い寄せられる"
  },
  doubleChance: {
    id: "doubleChance",
    name: "ダブルチャンス",
    type: "ball",
    category: "attack",
    color: "#ffcc4a",
    maxLevel: 5,
    description: "確率で同じヒットをもう一度与える"
  },
  crossfire: {
    id: "crossfire",
    name: "クロスファイヤー",
    type: "ball",
    category: "attack",
    color: "#ff8844",
    maxLevel: 5,
    description: "破壊時に左右へ貫通弾を放つ"
  },
  overload: {
    id: "overload",
    name: "オーバーロード",
    type: "ball",
    category: "attack",
    color: "#ff4a4a",
    maxLevel: 5,
    description: "同じブロックへの連続ヒットが強くなる"
  },
  fragment: {
    id: "fragment",
    name: "フラグメント",
    type: "ball",
    category: "attack",
    color: "#ff8844",
    maxLevel: 5,
    description: "破壊時に欠片を飛ばして追撃する"
  },
  detonator: {
    id: "detonator",
    name: "デトネーター",
    type: "ball",
    category: "attack",
    color: "#ffcc4a",
    maxLevel: 5,
    description: "3ヒットごとに範囲爆発を起こす"
  },
  shatter: {
    id: "shatter",
    name: "シャッター",
    type: "ball",
    category: "attack",
    color: "#ff4a4a",
    maxLevel: 5,
    description: "弱った近接ブロックを自動射撃する"
  },
  poison: {
    id: "poison",
    name: "ポイズン",
    type: "ball",
    category: "attack",
    color: "#4aff88",
    maxLevel: 5,
    description: "毒で継続ダメージを与える"
  },
  afterburn: {
    id: "afterburn",
    name: "アフターバーン",
    type: "ball",
    category: "attack",
    color: "#ff8844",
    maxLevel: 5,
    description: "破壊位置に炎を残し通過弾を強化"
  },
  lightning: {
    id: "lightning",
    name: "ライトニング",
    type: "ball",
    category: "attack",
    color: "#4a9eff",
    maxLevel: 5,
    description: "破壊時に電撃が隣接へ連鎖する"
  },
  impact: {
    id: "impact",
    name: "インパクト",
    type: "ball",
    category: "attack",
    color: "#ffcc4a",
    maxLevel: 5,
    description: "打ち出し直後の初撃が重くなる"
  },
  crash: {
    id: "crash",
    name: "クラッシュ",
    type: "ball",
    category: "attack",
    color: "#ff4a4a",
    maxLevel: 5,
    description: "速度が高いほどダメージが伸びる"
  },
  blast: {
    id: "blast",
    name: "ブラスト",
    type: "ball",
    category: "attack",
    color: "#ffcc4a",
    maxLevel: 5,
    description: "破壊時に横長の衝撃波を出す"
  },
  mirror: {
    id: "mirror",
    name: "ミラー",
    type: "ball",
    category: "special",
    color: "#aa66ff",
    maxLevel: 5,
    description: "反対軌道の薄い分身が追従する"
  },
  rebound: {
    id: "rebound",
    name: "リバウンド強化",
    type: "ball",
    category: "special",
    color: "#ffffff",
    maxLevel: 5,
    description: "パドルに当たるほど次弾が強化"
  },
  echo: {
    id: "echo",
    name: "エコー",
    type: "ball",
    category: "special",
    color: "#44ddcc",
    maxLevel: 5,
    description: "軌道上に残像ダメージを残す"
  },
  focus: {
    id: "focus",
    name: "フォーカス",
    type: "ball",
    category: "special",
    color: "#4a9eff",
    maxLevel: 5,
    description: "最高HPのブロックを狙う"
  },
  phantom: {
    id: "phantom",
    name: "ファントム",
    type: "ball",
    category: "special",
    color: "#aa66ff",
    maxLevel: 5,
    description: "落下後に残像弾が同じ軌道を往復"
  },
  aura: {
    id: "aura",
    name: "オーラ",
    type: "ball",
    category: "special",
    color: "#44ddcc",
    maxLevel: 5,
    description: "近くのブロックへ微量ダメージ"
  },
  berserker: {
    id: "berserker",
    name: "バーサーカー",
    type: "ball",
    category: "special",
    color: "#ff8844",
    maxLevel: 5,
    description: "復活直後だけ全ステータス上昇"
  },
  cycle: {
    id: "cycle",
    name: "サイクル",
    type: "ball",
    category: "special",
    color: "#aa66ff",
    maxLevel: 5,
    description: "一定間隔で追加効果を切り替える"
  },
  expert: {
    id: "expert",
    name: "エキスパート",
    type: "ball",
    category: "special",
    color: "#ffffff",
    maxLevel: 5,
    description: "高レベルスキルほどダメージ増加"
  },
  tokenHunter: {
    id: "tokenHunter",
    name: "トークンハンター",
    type: "ball",
    category: "economy",
    color: "#4aff88",
    maxLevel: 5,
    description: "トークン収集時に追加獲得"
  },
  lastHit: {
    id: "lastHit",
    name: "ラストヒット",
    type: "ball",
    category: "economy",
    color: "#4aff88",
    maxLevel: 5,
    description: "トドメ時に大量トークンを落とす"
  },
  collector: {
    id: "collector",
    name: "コレクター",
    type: "ball",
    category: "economy",
    color: "#4aff88",
    maxLevel: 5,
    description: "近くのトークンを自動で拾う"
  },
  scoreBoost: {
    id: "scoreBoost",
    name: "スコアブースト",
    type: "ball",
    category: "economy",
    color: "#4aff88",
    maxLevel: 5,
    description: "このボールの撃破スコアが増える"
  },
  vampire: {
    id: "vampire",
    name: "ヴァンパイア",
    type: "ball",
    category: "recovery",
    color: "#7cf5b2",
    maxLevel: 5,
    description: "ブロック破壊時にパドルHPを吸収回復"
  },
  paddleWidth: {
    id: "paddleWidth",
    name: "パドル幅拡大",
    type: "paddle",
    category: "paddle",
    color: "#ffffff",
    maxLevel: 5,
    description: "パドルの横幅を広げる"
  },
  bounceHeal: {
    id: "bounceHeal",
    name: "バウンスヒール",
    type: "paddle",
    category: "paddle",
    color: "#4aff88",
    maxLevel: 5,
    description: "ボールがパドルに当たるたびHP回復"
  },
  magnet: {
    id: "magnet",
    name: "マグネット",
    type: "paddle",
    category: "paddle",
    color: "#44ddcc",
    maxLevel: 5,
    description: "トークンをパドルへ引き寄せる"
  },
  reviveBoost: {
    id: "reviveBoost",
    name: "全ボール復活速度UP",
    type: "paddle",
    category: "paddle",
    color: "#4aff88",
    maxLevel: 5,
    description: "全ボールの復活時間を短縮する"
  },
  superBounce: {
    id: "superBounce",
    name: "スーパーバウンス",
    type: "paddle",
    category: "paddle",
    color: "#ffcc4a",
    maxLevel: 5,
    description: "確率で強烈に打ち返す"
  },
  globalDamage: {
    id: "globalDamage",
    name: "全体ダメージUP",
    type: "paddle",
    category: "paddle",
    color: "#ff4a4a",
    maxLevel: 5,
    description: "全ボールのダメージを底上げする"
  },
  globalSpeed: {
    id: "globalSpeed",
    name: "全体速度UP",
    type: "paddle",
    category: "paddle",
    color: "#4a9eff",
    maxLevel: 5,
    description: "全ボールの移動速度を上げる"
  },
  bumperFortify: {
    id: "bumperFortify",
    name: "バンパー強化",
    type: "bumper",
    category: "bumper",
    color: "#67d8ff",
    maxLevel: 5,
    description: "バンパー最大HP+1"
  },
  bumperRecover: {
    id: "bumperRecover",
    name: "バンパー復活",
    type: "bumper",
    category: "bumper",
    color: "#7cf5b2",
    maxLevel: 5,
    description: "復活時間を短縮する"
  }
};

SKILLS.bumperFortify.name = "バンパー強化";
SKILLS.bumperFortify.description = "バンパーの壊れるまでの回数+1";

delete SKILLS.tokenHunter;
delete SKILLS.collector;
delete SKILLS.magnet;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function randomInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function formatNumber(value) {
  return Math.floor(value).toLocaleString("ja-JP");
}

function getSkillLevel(entity, skillId) {
  if (!entity || !entity.skills) return 0;
  const equipped = entity.skills.find((skill) => skill.id === skillId);
  return equipped ? equipped.level : 0;
}

function getTotalStars(entity) {
  if (!entity || !entity.skills) return 0;
  return entity.skills.reduce((sum, skill) => sum + skill.level, 0);
}

function getAverageSkillLevel(entity) {
  if (!entity || !entity.skills || entity.skills.length === 0) return 0;
  return getTotalStars(entity) / entity.skills.length;
}

function getHighestSkillLevel(entities, skillId) {
  return entities.reduce((best, entity) => Math.max(best, getSkillLevel(entity, skillId)), 0);
}

function getSkillLimit(entity) {
  if (!entity) return 0;
  if (entity.isBumper) return 2;
  return entity.isPaddle ? 6 : 3;
}

function canEquipSkill(entity, skillId) {
  const definition = SKILLS[skillId];
  if (!entity || !definition) return false;
  const current = getSkillLevel(entity, skillId);
  if (current > 0) return current < definition.maxLevel;
  return entity.skills.length < getSkillLimit(entity);
}

function addOrLevelSkill(entity, skillId) {
  const definition = SKILLS[skillId];
  if (!definition || !entity || !entity.skills) return false;
  const current = entity.skills.find((skill) => skill.id === skillId);
  if (current) {
    if (current.level >= definition.maxLevel) return false;
    current.level += 1;
    return true;
  }
  if (entity.skills.length >= getSkillLimit(entity)) return false;
  entity.skills.push({
    id: definition.id,
    name: definition.name,
    color: definition.color,
    level: 1,
    category: definition.category,
    type: definition.type
  });
  return true;
}

function getRarityColor(level) {
  return `var(--rarity-${clamp(level || 1, 1, 5)})`;
}

function makeStars(level, max = 5) {
  const safeMax = Math.max(1, Math.floor(max || 5));
  const current = clamp(Math.floor(level || 0), 0, safeMax);
  const rarityLevel = clamp(current || 1, 1, 5);
  const fill = clamp((current / safeMax) * 100, 0, 100);
  return `
    <span class="level-badge" style="--level-color:${getRarityColor(rarityLevel)};--level-fill:${fill}%">
      <span class="level-badge-text">LV ${current}/${safeMax}</span>
      <span class="level-badge-track"><span></span></span>
    </span>
  `;
}

function getUpgradeCost(level, key) {
  const definition = UPGRADE_DEFS[key];
  if (!definition || level >= definition.max) return Infinity;
  if (definition.costs && Number.isFinite(definition.costs[level])) return definition.costs[level];
  return Infinity;
}

function getSkillRerollCost() {
  return 5;
}

function getBallPurchaseCost(ballNumber) {
  const costs = {
    2: 1000,
    3: 10000
  };
  return ballNumber <= BALL_MAX ? (costs[ballNumber] || Infinity) : Infinity;
}

function generateSkillChoices(balls, paddle, bumper) {
  const choices = [];
  const usedIds = new Set();
  const pushUniqueChoice = (choice) => {
    if (!choice || usedIds.has(choice.id) || choices.length >= 3) return false;
    usedIds.add(choice.id);
    choices.push(choice);
    return true;
  };

  const isChoiceAvailable = (id) => {
    const skill = SKILLS[id];
    if (skill.type === "ball") return balls.some((ball) => canEquipSkill(ball, id));
    if (skill.type === "bumper") return bumper && bumper.level > 0 && canEquipSkill(bumper, id);
    return canEquipSkill(paddle, id);
  };

  const ids = Object.keys(SKILLS).filter(isChoiceAvailable);

  for (const id of shuffle(ids)) {
    if (choices.length >= 3) break;
    pushUniqueChoice(SKILLS[id]);
  }

  const fallbackIds = shuffle(Object.keys(SKILLS).filter(isChoiceAvailable));
  for (const id of fallbackIds) {
    if (choices.length >= 3) break;
    pushUniqueChoice(SKILLS[id]);
  }

  return choices;
}

function rectsOverlap(a, b, padding = 0) {
  return a.x < b.x + b.width + padding &&
    a.x + a.width + padding > b.x &&
    a.y < b.y + b.height + padding &&
    a.y + a.height + padding > b.y;
}

function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

function getCircleRectOverlap(cx, cy, radius, rect) {
  const closestX = clamp(cx, rect.x, rect.x + rect.width);
  const closestY = clamp(cy, rect.y, rect.y + rect.height);
  const dx = cx - closestX;
  const dy = cy - closestY;
  const distSq = dx * dx + dy * dy;
  if (distSq > radius * radius) return null;

  if (distSq > 0.0001) {
    const dist = Math.sqrt(distSq);
    return {
      hit: true,
      t: 1,
      normalX: dx / dist,
      normalY: dy / dist,
      penetration: radius - dist,
      contactX: cx,
      contactY: cy
    };
  }

  const left = Math.abs(cx - rect.x);
  const right = Math.abs(rect.x + rect.width - cx);
  const top = Math.abs(cy - rect.y);
  const bottom = Math.abs(rect.y + rect.height - cy);
  const min = Math.min(left, right, top, bottom);
  if (min === left) return { hit: true, t: 1, normalX: -1, normalY: 0, penetration: radius + left, contactX: cx, contactY: cy };
  if (min === right) return { hit: true, t: 1, normalX: 1, normalY: 0, penetration: radius + right, contactX: cx, contactY: cy };
  if (min === top) return { hit: true, t: 1, normalX: 0, normalY: -1, penetration: radius + top, contactX: cx, contactY: cy };
  return { hit: true, t: 1, normalX: 0, normalY: 1, penetration: radius + bottom, contactX: cx, contactY: cy };
}

function getSweptPointRectCollision(prevX, prevY, x, y, rect) {
  const dx = x - prevX;
  const dy = y - prevY;
  if (Math.abs(dx) < 0.0001 && Math.abs(dy) < 0.0001) return null;
  if (pointInRect(prevX, prevY, rect)) return null;

  const xEntry = dx > 0 ? (rect.x - prevX) / dx : dx < 0 ? (rect.x + rect.width - prevX) / dx : -Infinity;
  const xExit = dx > 0 ? (rect.x + rect.width - prevX) / dx : dx < 0 ? (rect.x - prevX) / dx : Infinity;
  const yEntry = dy > 0 ? (rect.y - prevY) / dy : dy < 0 ? (rect.y + rect.height - prevY) / dy : -Infinity;
  const yExit = dy > 0 ? (rect.y + rect.height - prevY) / dy : dy < 0 ? (rect.y - prevY) / dy : Infinity;
  const entry = Math.max(xEntry, yEntry);
  const exit = Math.min(xExit, yExit);

  if (entry < 0 || entry > 1 || entry > exit) return null;
  const normalX = xEntry > yEntry ? (dx > 0 ? -1 : 1) : 0;
  const normalY = yEntry >= xEntry ? (dy > 0 ? -1 : 1) : 0;
  return {
    hit: true,
    t: entry,
    normalX,
    normalY,
    penetration: 0,
    contactX: prevX + dx * entry,
    contactY: prevY + dy * entry
  };
}

function getCircleRectCollision(prevX, prevY, x, y, radius, rect) {
  const expanded = {
    x: rect.x - radius,
    y: rect.y - radius,
    width: rect.width + radius * 2,
    height: rect.height + radius * 2
  };
  const swept = getSweptPointRectCollision(prevX, prevY, x, y, expanded);
  if (swept) return swept;
  return getCircleRectOverlap(x, y, radius, rect);
}

function circleRectHit(cx, cy, radius, rect) {
  return Boolean(getCircleRectOverlap(cx, cy, radius, rect));
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function steerBallToward(ball, targetX, targetY, force) {
  const angle = Math.atan2(targetY - ball.y, targetX - ball.x);
  ball.vx += Math.cos(angle) * force;
  ball.vy += Math.sin(angle) * force;
  ball.normalizeSpeed(ball.getTargetSpeed());
}
