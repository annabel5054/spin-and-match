import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import DotGridBackground from "./Warping.jsx";
import drawBall from "./game/drawBall.js";
import ResultCard from "./game/ResultCard.jsx";
import WarmUpScreen from "./game/WarmUpScreen.jsx";
import {
  FRAME_MS,
  MAX_LEVEL,
  MAX_MISSES,
  MAX_SIZE,
  PITCH_LIMIT,
  TIME_LIMIT_MS,
  createSim,
  formatTime,
  levelConfig,
  levelGoal,
  levelSpeed,
  playTime,
  spinSpeed,
} from "./game/sim.js";

const DRAG_THRESHOLD = 6;
const LEVEL_KEY = "spin-and-match-level";

// The level you reached is kept in this browser so a refresh doesn't send you back to level 1.
function loadLevel() {
  try {
    const n = Number(localStorage.getItem(LEVEL_KEY));
    return n >= 1 && n <= MAX_LEVEL ? Math.floor(n) : 1;
  } catch {
    return 1;
  }
}

function saveLevel(level) {
  try {
    localStorage.setItem(LEVEL_KEY, String(level));
  } catch {
    // Storage blocked (private mode etc.): the game still works, it just won't remember.
  }
}

export default function SpinAndMatch() {
  const canvasRef = useRef(null);
  const sim = useRef(null);
  if (sim.current === null) sim.current = createSim(loadLevel());

  const [level, setLevel] = useState(() => sim.current.level);
  const [pairs, setPairs] = useState(0);
  const [levelDone, setLevelDone] = useState(false);
  const [misses, setMisses] = useState(0);
  const [lost, setLost] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showToy, setShowToy] = useState(false);

  // Render loop lives outside React state so spinning never triggers re-renders.
  useEffect(() => {
    const canvas = canvasRef.current;
    const g = canvas.getContext("2d");
    let raf = 0;
    let last = 0;

    const fit = () => {
      const w = Math.min(canvas.parentElement.clientWidth, MAX_SIZE);
      const dpr = window.devicePixelRatio || 1;
      sim.current.size = w;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${w}px`;
      canvas.width = canvas.height = Math.round(w * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
  

    const ro = new ResizeObserver(fit);
    ro.observe(canvas.parentElement);
    fit();

    const frame = (now) => {
      const s = sim.current;
      // Speeds are per 60fps frame; scale by real frame time so 120Hz screens spin the same.
      const dt = Math.min((now - (last || now)) / FRAME_MS, 3);
      last = now;
      drawBall(canvas, g, s, now, dt);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  // Stops the ball and the clock, keeping the time played so far.
  const halt = (s, playedMs = playTime(s)) => {
    s.playedMs = playedMs;
    s.playing = false;
    s.drag = null;
    s.sel = null;
    s.vy = 0;
    s.vp = 0;
    setElapsed(playedMs);
    setPlaying(false);
  };

  useEffect(() => {
    if (!playing || levelDone || lost) return undefined;
    const id = setInterval(() => {
      const s = sim.current;
      if (playTime(s) < TIME_LIMIT_MS) {
        setElapsed(playTime(s));
        return;
      }
      s.lost = true;
      halt(s, TIME_LIMIT_MS);
      setTimeUp(true);
    }, 100);
    return () => clearInterval(id);
  }, [playing, levelDone, lost]);


  const tap = useCallback((x, y) => {
    const s = sim.current;
    if (!s.playing || s.lost) return;

    let target = null;
    for (const p of s.pts) {
      if (!p.alive || p.pz <= -0.05) continue;
      if (Math.hypot(p.px - x, p.py - y) < p.size * 0.95 && (!target || p.pz > target.pz)) {
        target = p;
      }
    }
    if (!target) return;

    if (s.sel === target) {
      s.sel = null;
      return;
    }
    if (!s.sel) {
      s.sel = target;
      return;
    }

    const first = s.sel;
    s.sel = null;
    const now = performance.now();

    if (first.n === target.n) {
      s.fx.push({ x: first.px, y: first.py, t: now }, { x: target.px, y: target.py, t: now });
      first.alive = false;
      target.alive = false;
      s.pairs += 1;
      setPairs(s.pairs);
      // The level is only cleared once every number on the ball is gone.
      if (s.pts.every((p) => !p.alive)) {
        s.lost = true;
        halt(s);
        setLevelDone(true);
      }
    } else {
      first.badAt = now;
      target.badAt = now;
      s.misses += 1;
      setMisses(s.misses);
      if (s.misses >= MAX_MISSES) {
        s.lost = true;
        halt(s);
        setLost(true);
      }
    }
  }, []);

  const toggleSpin = () => {
    const s = sim.current;
    if (s.playing) {
      halt(s);
    } else {
      s.resumedAt = Date.now();
      s.playing = true;
      s.vy = spinSpeed(s);
      setPlaying(true);
    }
  };

  const onPointerDown = (e) => {
    if (!sim.current.playing) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    sim.current.drag = { x: e.clientX, y: e.clientY, moved: false };
  };

  const onPointerMove = (e) => {
    const s = sim.current;
    const d = s.drag;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    d.moved = true;
    s.yaw += dx * 0.006;
    s.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, s.pitch + dy * 0.006));
    // No fling: letting go returns the ball to the level's speed instead of spinning it faster.
    d.x = e.clientX;
    d.y = e.clientY;
  };

  const onPointerUp = (e) => {
    const s = sim.current;
    if (s.drag && !s.drag.moved) {
      const rect = e.currentTarget.getBoundingClientRect();
      tap(e.clientX - rect.left, e.clientY - rect.top);
    }
    s.drag = null;
  };

  const onPointerCancel = () => {
    sim.current.drag = null;
  };

  const reset = (nextLevel = sim.current.level) => {
    sim.current = createSim(nextLevel);
    saveLevel(nextLevel);
    setLevel(nextLevel);
    setPairs(0);
    setLevelDone(false);
    setMisses(0);
    setLost(false);
    setTimeUp(false);
    setPlaying(false);
    setElapsed(0);
    // The canvas size is owned by the resize observer, so carry it over.
    const w = Math.min(canvasRef.current.parentElement.clientWidth, MAX_SIZE);
    sim.current.size = w;
  };

  // Pauses the level (if running) rather than restarting it; press Start to carry on afterwards.
  const openWarmUp = () => {
    const s = sim.current;
    if (s.playing) halt(s);
    setShowToy(true);
  };


  const time = formatTime(elapsed);
  const goal = levelGoal(level);
  const { numbers } = levelConfig(level);
  const speed = levelSpeed(level).toFixed(1);
  const restartLevel = () => reset(level);

  return (
    <section className="sam">
      <DotGridBackground />
      <header className="sam-header">
        <h1 className="sam-title">Spin and match</h1>
        <button
          type="button"
          className="sam-btn sam-warmup"
          onClick={openWarmUp}
        >
          Warm up
        </button>
      </header>
      <p className="sam-sub">
        Tap two matching numbers to clear them. Clear every number on the ball in one minute to reach the next level. Each level spins faster and has more numbers, up to level {MAX_LEVEL}. Three misses and you replay the level.
      </p>

      <div className="sam-bar">
        <button
          type="button"
          className="sam-btn sam-start"
          onClick={toggleSpin}
          disabled={lost || timeUp || levelDone}
        >
          {playing ? "Stop" : "Start"}
        </button>
      </div>

      <div className="sam-side">
        <div className="sam-time">
          Time <b>{time}</b> / {formatTime(TIME_LIMIT_MS)}
        </div>
        <div className="sam-stats">
          <span>
            Pairs <b>{pairs}</b> / {goal}
          </span>
          <span>
            Speed <b>{speed}</b>
          </span>
          <span>
            Misses <b>{misses}</b> / {MAX_MISSES}
          </span>
        </div>
      </div>
      <div className="sam-badge sam-level" aria-live="polite">
        Level <b>{level}</b> / {MAX_LEVEL}
      </div>

      <div className="sam-stage">
        <canvas
          ref={canvasRef}
          className="sam-canvas"
          aria-label={`Spinning ball of numbers from 1 to ${numbers}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        />
        {timeUp && (
          <ResultCard title="Time up" button="Restart" onClick={restartLevel}>
            You cleared {pairs} of {goal} pairs. Try level {level} again.
          </ResultCard>
        )}
        {lost && !timeUp && !levelDone && (
          <ResultCard title="Game over" button="Restart" onClick={restartLevel}>
            Three misses. Try level {level} again.
          </ResultCard>
        )}
        {levelDone && level < MAX_LEVEL && (
          <ResultCard title={`Level ${level} cleared`} button="Next level" onClick={() => reset(level + 1)}>
            Every number cleared in {time}. Level {level + 1} spins faster.
          </ResultCard>
        )}
        {levelDone && level === MAX_LEVEL && (
          <ResultCard title={`You beat all ${MAX_LEVEL} levels`} button="Play again from level 1" onClick={() => reset(1)}>
            Level {MAX_LEVEL} cleared in {time}.
          </ResultCard>
        )}
      </div>

      {showToy && (
        <WarmUpScreen onBack={() => setShowToy(false)} />
      )}
    </section>
  );
}
