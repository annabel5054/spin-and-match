import { useEffect, useRef } from "react";
import { STAGE_HEIGHT, createStage, localPoint, CanvasFrame } from "./shared.jsx";

const MAX_NUMBER = 20;
const TOY_START_BALLS = 14;
const TOY_MAX_BALLS = 60;
const TOY_GRAVITY = 0.35;
const TOY_BOUNCE = 0.78;
const TOY_WALL_BOUNCE = 0.9;
const TOY_POP_MS = 450;
// Chance that a new ball copies the number of one already in the box, so matches actually happen.
// Set to 0 for purely random numbers.
const TOY_MATCH_BIAS = 0.35;
const TOY_PALETTE = [
  { fill: "#1F4D3F", text: "#F4EFD8" },
  { fill: "#F2B632", text: "#14332A" },
  { fill: "#E4572E", text: "#F4EFD8" },
  { fill: "#3E8E73", text: "#F4EFD8" },
  { fill: "#9FCDB7", text: "#14332A" },
];

function makeBall(x, y, n) {
  return {
    x,
    y,
    vx: (Math.random() - 0.5) * 6,
    vy: -Math.random() * 4,
    r: 14 + Math.random() * 14,
    n,
    color: TOY_PALETTE[Math.floor(Math.random() * TOY_PALETTE.length)],
    gone: false,
  };
}

// Numbered balls with gravity, bounce, and collisions. Tap the box to drop more.
export default function PhysicsToy() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const balls = [];
    const pops = [];
    let raf = 0;
    let last = 0;
    const stage = createStage(canvas, STAGE_HEIGHT, (s) => {
      for (const b of balls) b.x = Math.min(Math.max(b.x, b.r), s.w - b.r);
    });
    const g = stage.g;
    const H = STAGE_HEIGHT;

    const drop = (x, y) => {
      const copy = balls.length > 0 && Math.random() < TOY_MATCH_BIAS;
      const n = copy
        ? balls[Math.floor(Math.random() * balls.length)].n
        : 1 + Math.floor(Math.random() * MAX_NUMBER);
      balls.push(makeBall(x, y, n));
      if (balls.length > TOY_MAX_BALLS) balls.shift();
    };

    for (let i = 0; i < TOY_START_BALLS; i++) {
      drop(30 + Math.random() * (stage.w - 60), 10 + Math.random() * 120);
    }

    const onDown = (e) => {
      const p = localPoint(canvas, e);
      drop(p.x, p.y);
    };
    canvas.addEventListener("pointerdown", onDown);

    const frame = (now) => {
      const w = stage.w;
      const dt = Math.min((now - (last || now)) / 16.67, 2);
      last = now;

      for (const b of balls) {
        b.vy += TOY_GRAVITY * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.y + b.r > H) {
          b.y = H - b.r;
          b.vy *= -TOY_BOUNCE;
          b.vx *= 0.985;
          if (Math.abs(b.vy) < 0.8) b.vy = 0;
        }
        if (b.x - b.r < 0) {
          b.x = b.r;
          b.vx *= -TOY_WALL_BOUNCE;
        }
        if (b.x + b.r > w) {
          b.x = w - b.r;
          b.vx *= -TOY_WALL_BOUNCE;
        }
      }

      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          const a = balls[i];
          const b = balls[j];
          if (a.gone || b.gone) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.hypot(dx, dy);
          const min = a.r + b.r;
          if (d >= min || d === 0) continue;
          if (a.n === b.n) {
            a.gone = true;
            b.gone = true;
            pops.push(
              { x: a.x, y: a.y, r: a.r, fill: a.color.fill, t: now },
              { x: b.x, y: b.y, r: b.r, fill: b.color.fill, t: now },
            );
            continue;
          }
          const nx = dx / d;
          const ny = dy / d;
          const push = (min - d) / 2;
          a.x -= nx * push;
          a.y -= ny * push;
          b.x += nx * push;
          b.y += ny * push;
          const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (rel < 0) {
            const ma = a.r * a.r;
            const mb = b.r * b.r;
            const impulse = (-(1 + TOY_BOUNCE) * rel) / (1 / ma + 1 / mb);
            a.vx -= (impulse / ma) * nx;
            a.vy -= (impulse / ma) * ny;
            b.vx += (impulse / mb) * nx;
            b.vy += (impulse / mb) * ny;
          }
        }
      }

      for (let i = balls.length - 1; i >= 0; i--) {
        if (balls[i].gone) balls.splice(i, 1);
      }

      g.clearRect(0, 0, w, H);
      g.textAlign = "center";
      g.textBaseline = "middle";
      for (const b of balls) {
        g.fillStyle = b.color.fill;
        g.beginPath();
        g.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = b.color.text;
        g.font = `700 ${Math.round(b.r * 0.95)}px "Bricolage Grotesque", system-ui, sans-serif`;
        g.fillText(String(b.n), b.x, b.y + 1);
      }

      for (let i = pops.length - 1; i >= 0; i--) {
        if (now - pops[i].t >= TOY_POP_MS) pops.splice(i, 1);
      }
      g.lineWidth = 3;
      for (const pop of pops) {
        const a = (now - pop.t) / TOY_POP_MS;
        g.globalAlpha = 1 - a;
        g.strokeStyle = pop.fill;
        g.beginPath();
        g.arc(pop.x, pop.y, pop.r + a * 30, 0, Math.PI * 2);
        g.stroke();
      }
      g.globalAlpha = 1;

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      stage.destroy();
      canvas.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return <CanvasFrame canvasRef={canvasRef} label="Physics toy: tap to drop numbered balls" />;
}
