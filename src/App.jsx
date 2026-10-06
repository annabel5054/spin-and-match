import { useCallback, useEffect, useRef, useState } from "react";
import './App.css'
import DotGridBackground from "./warping.jsx";




const MAX_NUMBER = 20;
const MAX_MISSES = 3;
const COPIES = 6;
const TOTAL = MAX_NUMBER * COPIES;
const AUTO_SPIN = 0.003;
const PITCH_LIMIT = 1.2;
const DRAG_THRESHOLD = 6;
const POP_MS = 450;
const BAD_MS = 350;
const MAX_SIZE = 560;
const RED_TEXT_MS = 30 * 1000;
const GOLDEN_ANGLE = 2.399963;

function buildPoints() {
  const nums = [];
  for (let n = 1; n <= MAX_NUMBER; n++) {
    for (let k = 0; k < COPIES; k++) nums.push(n);
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


function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function createSim() {
  return {
    pts: buildPoints(),
    yaw: 0,
    pitch: 0.35,
    vy: AUTO_SPIN,
    vp: 0,
    drag: null,
    sel: null,
    misses: 0,
    lost: false,
    fx: [],
    size: 0,
    startedAt: 0,
  };
}

export default function SpinAndMatch() {
  const canvasRef = useRef(null);
  const sim = useRef(null);
  if (sim.current === null) sim.current = createSim();

  const [left, setLeft] = useState(TOTAL);
  const [misses, setMisses] = useState(0);
  const [lost, setLost] = useState(false);
  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [finishedIn, setFinishedIn] = useState(null);
  const [redText, setRedText] = useState(false);
  const redTimer = useRef(0);

  // Render loop lives outside React state so spinning never triggers re-renders.
  useEffect(() => {
    const canvas = canvasRef.current;
    const g = canvas.getContext("2d");
    let raf = 0;

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
      const S = s.size;
      const R = S * 0.4;
      const cs = getComputedStyle(canvas);
      const ball = cs.getPropertyValue("--sam-ball");
      const chalk = cs.getPropertyValue("--sam-chalk");
      const pick = cs.getPropertyValue("--sam-pick");
      const bad = cs.getPropertyValue("--sam-bad");
      const ink = cs.getPropertyValue("--sam-ball");

      if (!s.drag) {
        s.yaw += s.vy;
        s.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, s.pitch + s.vp));
        s.vy += (AUTO_SPIN - s.vy) * 0.02;
        s.vp *= 0.92;
      }

      const cy = Math.cos(s.yaw);
      const sy = Math.sin(s.yaw);
      const cp = Math.cos(s.pitch);
      const sp = Math.sin(s.pitch);
      for (const p of s.pts) {
        const x1 = p.x * cy + p.z * sy;
        const z1 = -p.x * sy + p.z * cy;
        const y2 = p.y * cp - z1 * sp;
        const z2 = p.y * sp + z1 * cp;
        const k = 1 + z2 * 0.14;
        p.px = S / 2 + x1 * R * k;
        p.py = S / 2 + y2 * R * k;
        p.pz = z2;
        p.size = 12 + (z2 + 1) * 6;
      }

      g.clearRect(0, 0, S, S);
      g.fillStyle = ball;
      g.beginPath();
      g.arc(S / 2, S / 2, R * 1.13, 0, Math.PI * 2);
      g.fill();

      g.textAlign = "center";
      g.textBaseline = "middle";
      const visible = s.pts.filter((p) => p.alive).sort((a, b) => a.pz - b.pz);
      for (const p of visible) {
        const front = p.pz > -0.05;
        const isSel = p === s.sel;
        const isBad = p.badAt > 0 && now - p.badAt < BAD_MS;
        g.globalAlpha = front ? 0.55 + (p.pz + 1) * 0.225 : 0.18;
        if (isSel || isBad) {
          g.fillStyle = isBad ? bad : pick;
          g.beginPath();
          g.arc(p.px, p.py, p.size * 0.85, 0, Math.PI * 2);
          g.fill();
        }
        g.fillStyle = isSel ? ink : chalk;
        g.font = `700 ${p.size}px "Bricolage Grotesque", system-ui, sans-serif`;
        g.fillText(String(p.n), p.px, p.py + 1);
      }

      s.fx = s.fx.filter((f) => now - f.t < POP_MS);
      g.strokeStyle = pick;
      g.lineWidth = 3;
      for (const f of s.fx) {
        const a = (now - f.t) / POP_MS;
        g.globalAlpha = 1 - a;
        g.beginPath();
        g.arc(f.x, f.y, 10 + a * 34, 0, Math.PI * 2);
        g.stroke();
      }
      g.globalAlpha = 1;

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!started || finishedIn !== null || lost) return undefined;
    const id = setInterval(() => setElapsed(Date.now() - sim.current.startedAt), 250);
    return () => clearInterval(id);
  }, [started, finishedIn, lost]);

  useEffect(() => () => window.clearTimeout(redTimer.current), []);

  const tap = useCallback((x, y) => {
    const s = sim.current;
    if (s.lost || s.pts.every((p) => !p.alive)) return;

    let target = null;
    for (const p of s.pts) {
      if (!p.alive || p.pz <= -0.05) continue;
      if (Math.hypot(p.px - x, p.py - y) < p.size * 0.95 && (!target || p.pz > target.pz)) {
        target = p;
      }
    }
    if (!target) return;

    if (!s.startedAt) {
      s.startedAt = Date.now();
      setStarted(true);
    }

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
      const remaining = s.pts.filter((p) => p.alive).length;
      setLeft(remaining);
      if (remaining === 0) setFinishedIn(Date.now() - s.startedAt);
    } else {
      first.badAt = now;
      target.badAt = now;
      s.misses += 1;
      setMisses(s.misses);
      if (s.misses >= MAX_MISSES) {
        s.lost = true;
        setLost(true);
      }
    }
  }, []);

  const onPointerDown = (e) => {
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
    s.vy = dx * 0.006;
    s.vp = dy * 0.003;
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

  const reset = () => {
    sim.current = createSim();
    setLeft(TOTAL);
    setMisses(0);
    setLost(false);
    setStarted(false);
    setElapsed(0);
    setFinishedIn(null);
    // The canvas size is owned by the resize observer, so carry it over.
    const w = Math.min(canvasRef.current.parentElement.clientWidth, MAX_SIZE);
    sim.current.size = w;
  };

  const onNewGame = () => {
    reset();
    window.clearTimeout(redTimer.current);
    if (redText) {
      setRedText(false);
      return;
    }
    setRedText(true);
    redTimer.current = window.setTimeout(() => setRedText(false), RED_TEXT_MS);
  };


  const time = formatTime(finishedIn ?? elapsed);

  return (
    <section className="sam">
      <DotGridBackground />
      <h1 className="sam-title">Spin and match</h1>
      <p className="sam-sub">
        Drag the ball to spin it. Tap two matching numbers to clear them. Three misses and the game is over.
      </p>

      <div className="sam-bar">
        <span>
          Left <b>{left}</b>
        </span>
        <span>
          Time <b>{time}</b>
        </span>
        <span>
          Misses <b>{misses}</b>
        </span>
        <button
          type="button"
          className={redText ? "sam-btn is-red" : "sam-btn"}
          onClick={onNewGame}
        >
          New game
        </button>
      </div>

      <div className="sam-stage">
        <canvas
          ref={canvasRef}
          className="sam-canvas"
          aria-label="Spinning ball of numbers from 1 to 20"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        />
        {lost && (
          <div className="sam-win" role="status">
            <div className="sam-win-card">
              <h2>Game over</h2>
              <p>Three misses. Start a new game.</p>
              <button type="button" className="sam-btn" onClick={reset}>
                Start a new game
              </button>
            </div>
          </div>
        )}
        {finishedIn !== null && (
          <div className="sam-win" role="status">
            <div className="sam-win-card">
              <h2>Ball cleared</h2>
              <p>
                Time {formatTime(finishedIn)} with {misses} miss{misses === 1 ? "" : "es"}.
              </p>
              <button type="button" className="sam-btn" onClick={reset}>
                Play again
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
