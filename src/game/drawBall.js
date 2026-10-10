import { BAD_MS, PITCH_LIMIT, POP_MS, spinSpeed } from "./sim.js";

// Advances the spin by dt (in 60fps frames) and paints the ball, its numbers, and match pops.
export default function drawBall(canvas, g, s, now, dt) {
  const S = s.size;
  const R = S * 0.4;
  const cs = getComputedStyle(canvas);
  const ball = cs.getPropertyValue("--sam-ball");
  const chalk = cs.getPropertyValue("--sam-chalk");
  const pick = cs.getPropertyValue("--sam-pick");
  const bad = cs.getPropertyValue("--sam-bad");
  const ink = cs.getPropertyValue("--sam-ball");

  if (s.playing && !s.drag) {
    s.yaw += s.vy * dt;
    s.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, s.pitch + s.vp * dt));
    s.vy += (spinSpeed(s) - s.vy) * 0.02;
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
    p.size = (12 + (z2 + 1) * 6) * s.scale;
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
}
