// Game rules and state for Spin and match: levels, timing, and the ball of numbers.

export const MAX_NUMBER = 20;
export const MAX_MISSES = 3;
// Each level lasts TIME_LIMIT_MS. Clear every number on the ball in time to move up.
// Higher levels start faster, speed up more, and put more pairs on the ball.
export const TIME_LIMIT_MS = 60 * 1000;
export const MAX_LEVEL = 10;
export const FRAME_MS = 1000 / 60;
export const PITCH_LIMIT = 1.2;
export const POP_MS = 450;
export const BAD_MS = 350;
export const MAX_SIZE = 560;
export const GOLDEN_ANGLE = 2.399963;
export const MIN_NUMBERS = 6;

// A ball of `pairs` matching pairs using the values 1..numbers. Every value appears an even
// number of times, so the whole ball can always be cleared.
export function buildPoints(numbers, pairs) {
  const nums = [];
  for (let i = 0; i < pairs; i++) {
    const n = (i % numbers) + 1;
    nums.push(n, n);
  }
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  return nums.map((n, i) => {
    const y = 1 - (2 * (i + 0.5)) / nums.length;
    const r = Math.sqrt(1 - y * y);
    const t = i * GOLDEN_ANGLE;
    return {
      n,
      x: Math.cos(t) * r,
      y,
      z: Math.sin(t) * r,
      alive: true,
      px: 0,
      py: 0,
      pz: 0,
      size: 14,
      badAt: 0,
    };
  });
}

export function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function playTime(s) {
  return s.playedMs + (s.playing ? Date.now() - s.resumedAt : 0);
}

// Pairs on the ball. Level 1: 12 pairs (24 numbers), each level adds 2 pairs,
// Level 10: 30 pairs (60 numbers).
export function levelGoal(level) {
  return 10 + level * 2;
}

// Level 1 is a slow ball with numbers 1-6 and big labels. Level 10 is a faster ball with
// numbers 1-20 and small labels. Speed is in turns a minute, fixed for the whole level:
// 1.0 at level 1, 1.8 at level 2, and SPIN_STEP more for every level after (8.2 at level 10).
export const AUTO_SPIN = 1.0; // level 1 speed
export const SPIN_STEP = 0.8; // added per level

export function levelSpeed(level) {
  return AUTO_SPIN + SPIN_STEP * (level - 1);
}

export function levelConfig(level) {
  const k = (level - 1) / (MAX_LEVEL - 1);
  return {
    numbers: Math.round(MIN_NUMBERS + k * (MAX_NUMBER - MIN_NUMBERS)),
    scale: 1.1 - k * 0.27,
    // Radians per 60fps frame.
    spin: (levelSpeed(level) * 2 * Math.PI) / 3600,
  };
}

export function spinSpeed(s) {
  return levelConfig(s.level).spin;
}

export function createSim(level = 1) {
  const cfg = levelConfig(level);
  return {
    level,
    pairs: 0,
    pts: buildPoints(cfg.numbers, levelGoal(level)),
    scale: cfg.scale,
    yaw: 0,
    pitch: 0.35,
    vy: 0,
    vp: 0,
    drag: null,
    sel: null,
    misses: 0,
    lost: false,
    fx: [],
    size: 0,
    // Play time banked before the last Stop, plus when the current run resumed.
    playedMs: 0,
    resumedAt: 0,
    // Stays still and ignores input until the Start button is pressed.
    playing: false,
  };
}
