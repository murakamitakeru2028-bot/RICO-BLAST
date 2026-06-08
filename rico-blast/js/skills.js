const BALL_MAX = 4;
const BALL_COLORS = ["#ff6b6b", "#4a9eff", "#ffcc4a", "#7cf5b2"];
const BUMPER_UNLOCK_COST = 10000;
const BUMPER_SKILL_CHOICE_RATE = 0.4;

const UPGRADE_MAX_LEVEL = 100;
const UPGRADE_LIMITED_LEVEL = 10;

const UPGRADE_DEFS = {
  speed: { label: "SPEED", baseCost: 240, max: UPGRADE_LIMITED_LEVEL, costGrowth: 1.17, costStep: 60 },
  damage: { label: "DAMAGE", baseCost: 360, max: UPGRADE_MAX_LEVEL, costGrowth: 1.175, costStep: 84 },
  reviveSpeed: { label: "SPAWN", baseCost: 280, max: UPGRADE_LIMITED_LEVEL, costGrowth: 1.17, costStep: 70 },
  critRate: { label: "CRITICAL", baseCost: 330, max: UPGRADE_MAX_LEVEL, costGrowth: 1.18, costStep: 78 }
};

const SKILL_LEVELS = {
  splash: { radius: [30, 40, 52, 65, 80], damage: [0.08, 0.11, 0.16, 0.22, 0.27] },
  spread: { count: [3, 4, 5, 6, 8], damage: [0.08, 0.10, 0.12, 0.14, 0.17] },
  chain: { count: [1, 2, 3, 4, 5], damage: [0.10, 0.13, 0.16, 0.19, 0.22] },
  sniper: { limit: [3, 5, Infinity, Infinity, Infinity], damage: [0.12, 0.16, 0.20, 0.26, 0.32], cross: [false, false, false, false, true] },
  doubleChance: { chance: [0.20, 0.30, 0.35, 0.42, 0.50], damageMultiplier: [0.40, 0.50, 0.55, 0.65, 0.75] },
  crossfire: { countPerSide: [1, 1, 1, 2, 2], damage: [0.08, 0.10, 0.13, 0.15, 0.17], pierce: [2, 3, 4, 5, 7] },
  overload: { step: [0.2, 0.3, 0.4, 0.5, 0.6], cap: [2, 2.5, 3, 4, 5] },
  fragment: { count: [3, 4, 5, 6, 8], damage: [0.06, 0.07, 0.09, 0.10, 0.11] },
  detonator: { hits: [3, 3, 3, 3, 3], radius: [40, 52, 62, 72, 81], damage: [0.18, 0.22, 0.27, 0.32, 0.36] },
  shatter: { threshold: [0.15, 0.20, 0.25, 0.28, 0.32], radius: [80, 100, 130, 155, 176], damage: [0.06, 0.07, 0.09, 0.10, 0.11] },
  poison: { duration: [8, 11, 14, 18, 24], interval: [0.5, 0.5, 0.5, 0.5, 0.5], damage: [0.035, 0.045, 0.058, 0.074, 0.092] },
  afterburn: { radius: [32, 38, 45, 52, 60], duration: [3, 4, 5, 6, 8], damage: [0.045, 0.06, 0.078, 0.096, 0.125], projectileBuff: [1.25, 1.35, 1.45, 1.52, 1.65] },
  lightning: { count: [2, 2, 3, 4, 5], radius: [100, 130, 160, 185, 210], damage: [0.10, 0.13, 0.16, 0.19, 0.22] },
  blast: { height: [6, 8, 12, 15, 18], damage: [0.10, 0.13, 0.17, 0.21, 0.24] },
  impact: { multiplier: [1.4, 1.6, 1.75, 1.9, 2.0] },
  crash: { normalMultiplier: [1.05, 1.08, 1.12, 1.18, 1.275], cap: [1.2, 1.35, 1.5, 1.65, 1.8] },
  sprint: { duration: [0.8, 1, 1.3, 1.6, 2], speedMultiplier: [1.4, 1.55, 1.7, 1.85, 2.0] },
  teleporter: { chance: [0.25, 0.28, 0.30, 0.32, 0.35] },
  immortality: { saves: [1, 1, 2, 2, 3], boostMultiplier: [1.2, 1.35, 1.45, 1.55, 1.6], boostDuration: [0.5, 0.8, 1, 1, 1] },
  mirror: { duration: [0.75, 0.9, 1.05, 1.2, 1.35], hits: [2, 3, 3, 4, 5], damage: [0.10, 0.13, 0.16, 0.20, 0.24] },
  rebound: { multiplier: [1.3, 1.5, 1.65, 1.8, 2.0] },
  phantom: { count: [2, 3, 3, 4, 5], damage: [0.10, 0.13, 0.17, 0.21, 0.25], reviveLevel: [3, 3, 3, 3, 3] },
  aura: { radius: [66, 76, 90, 104, 118], interval: [0.1, 0.1, 0.1, 0.1, 0.1], damage: [0.027, 0.041, 0.055, 0.069, 0.083] },
  berserker: { duration: [4, 6, 8, 9, 10], speedMultiplier: [1.1, 1.12, 1.15, 1.18, 1.2], damageMultiplier: [1.3, 1.45, 1.6, 1.7, 1.8] },
  cycle: { interval: [3, 2.8, 2.5, 2.2, 2], splashDamage: [0.08, 0.11, 0.14, 0.17, 0.20], lightningDamage: [0.10, 0.13, 0.16, 0.19, 0.22], damageMultiplier: [1.2, 1.25, 1.3, 1.4, 1.5] },
  expert: {
    avgLv1: [1.05, 1.07, 1.10, 1.12, 1.15],
    avgLv3: [1.10, 1.18, 1.25, 1.32, 1.38],
    avgLv5: [1.15, 1.25, 1.35, 1.48, 1.60]
  },
  echo: { radius: [28, 36, 44, 52, 60], duration: [3, 4, 5.5, 6.5, 7.5], damage: [0.018, 0.026, 0.034, 0.043, 0.052] },
  lastHit: { fixedBonus: [8, 12, 16, 20, 25], hpDivisor: [25, 20, 16, 13, 10] },
  scoreBoost: { multiplier: [1.2, 1.35, 1.5, 1.63, 1.75] },
  vampire: { percent: [0.02, 0.03, 0.035, 0.04, 0.05] },
  paddleWidth: { width: [96, 108, 120, 135, 150] },
  bounceHeal: { percent: [0.01, 0.02, 0.03, 0.04, 0.05] },
  reviveBoost: { seconds: [1, 2, 2.5, 3, 4] },
  superBounce: { chance: [0.20, 0.27, 0.33, 0.38, 0.43], duration: [0.5, 0.8, 1, 1.4, 1.8], damageMultiplier: [1.4, 1.55, 1.7, 1.9, 2.15] },
  globalDamage: { multiplier: [1.15, 1.25, 1.38, 1.5, 1.6] },
  globalSpeed: { multiplier: [1.1, 1.2, 1.28, 1.34, 1.4] },
  bumperFortify: { hp: [4, 5, 6, 8, 10] },
  bumperRecover: { seconds: [2.4, 2.0, 1.6, 1.2, 1.0] }
};

const SKILLS = {
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
    name: "SHATTER",
    type: "ball",
    category: "attack",
    color: "#ff5f88",
    maxLevel: 5,
    description: "Low HP blocks near a destroyed block take follow-up damage."
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

function skillParam(skillId, level, key, fallback = 0) {
  const table = SKILL_LEVELS[skillId];
  const values = table ? table[key] : null;
  if (!values) return fallback;
  const index = clamp(Math.floor(level || 1), 1, 5) - 1;
  return values[index] ?? fallback;
}

function skillDamageByMaxHp(block, skillId, level, key = "damage") {
  const ratio = skillParam(skillId, level, key, 0);
  return Math.max(1, Math.round((block ? block.maxHp : 1) * ratio));
}

function getExpertMultiplier(level, averageLevel) {
  const average = clamp(Number(averageLevel) || 1, 1, 5);
  const low = skillParam("expert", level, "avgLv1", 1);
  const mid = skillParam("expert", level, "avgLv3", low);
  const high = skillParam("expert", level, "avgLv5", mid);
  if (average <= 3) return low + ((average - 1) / 2) * (mid - low);
  return mid + ((average - 3) / 2) * (high - mid);
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
  const safeLevel = Math.max(0, Math.floor(Number(level) || 0));
  const base = Number(definition.baseCost) || 100;
  const growth = Number(definition.costGrowth) || 1.14;
  const step = Number(definition.costStep) || 40;
  const scaled = (base + safeLevel * step + safeLevel * safeLevel * 3) * Math.pow(growth, safeLevel);
  return Math.max(1, Math.floor(scaled));
}

function getSkillRerollCost(count = null) {
  const rerolls = count ?? (typeof Game !== "undefined" ? Game.skillRerollCount : 0);
  const safeCount = Math.max(0, Math.floor(Number(rerolls) || 0));
  return 5 + safeCount * 2 + Math.floor((safeCount * safeCount) / 8);
}

function getBallPurchaseCost(ballNumber) {
  const costs = {
    2: 1000,
    3: 10000,
    4: 100000
  };
  return ballNumber <= BALL_MAX ? (costs[ballNumber] || Infinity) : Infinity;
}

function generateSkillChoices(balls, paddle, bumper, preferredBall = null) {
  const choices = [];
  const usedIds = new Set();
  const targetBall = preferredBall && balls.includes(preferredBall) ? preferredBall : null;
  const pushUniqueChoice = (choice) => {
    if (!choice || usedIds.has(choice.id) || choices.length >= 3) return false;
    usedIds.add(choice.id);
    choices.push(choice);
    return true;
  };

  const isChoiceAvailable = (id) => {
    const skill = SKILLS[id];
    if (skill.type === "ball") {
      return targetBall ? canEquipSkill(targetBall, id) : balls.some((ball) => canEquipSkill(ball, id));
    }
    if (skill.type === "bumper") return bumper && bumper.level > 0 && canEquipSkill(bumper, id);
    return canEquipSkill(paddle, id);
  };

  const getCandidateIds = () => Object.keys(SKILLS).filter((id) => {
    if (!isChoiceAvailable(id)) return false;
    const skill = SKILLS[id];
    return skill.type !== "bumper" || Math.random() < BUMPER_SKILL_CHOICE_RATE;
  });

  const ids = getCandidateIds();

  for (const id of shuffle(ids)) {
    if (choices.length >= 3) break;
    pushUniqueChoice(SKILLS[id]);
  }

  const fallbackIds = shuffle(getCandidateIds());
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
