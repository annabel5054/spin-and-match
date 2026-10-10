import { useEffect, useRef } from "react";
import { STAGE_HEIGHT, STAGE_FADE, createStage, localPoint, CanvasFrame } from "./shared.jsx";

const PARTICLE_COUNT = 80;
const PARTICLE_REACH = 150;
const PARTICLE_BURST_REACH = 180;
const LINK_DISTANCE = 70;

// Particles that chase the pointer and link up when close. Tap to scatter them.
export default function ParticlePlayground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parts = [];
    const pointer = { x: -999, y: -999 };
    const stage = createStage(canvas, STAGE_HEIGHT, (s) => {
      for (const p of parts) p.x = Math.min(p.x, s.w);
    });
    const g = stage.g;
    let raf = 0;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      parts.push({
        x: Math.random() * stage.w,
        y: Math.random() * STAGE_HEIGHT,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
      });
    }

    const onMove = (e) => Object.assign(pointer, localPoint(canvas, e));
    const onLeave = () => {
      pointer.x = pointer.y = -999;
    };
    const onDown = (e) => {
      Object.assign(pointer, localPoint(canvas, e));
      for (const p of parts) {
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const d = Math.hypot(dx, dy);
        if (d < PARTICLE_BURST_REACH && d > 1) {
          const force = (1 - d / PARTICLE_BURST_REACH) * 8;
          p.vx += (dx / d) * force;
          p.vy += (dy / d) * force;
        }
      }
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointerdown", onDown);

    const frame = () => {
      const w = stage.w;
      g.fillStyle = STAGE_FADE;
      g.fillRect(0, 0, w, STAGE_HEIGHT);

      for (const p of parts) {
        const dx = pointer.x - p.x;
        const dy = pointer.y - p.y;
        const d = Math.hypot(dx, dy);
        if (d < PARTICLE_REACH && d > 1) {
          p.vx += (dx / d) * 0.09;
          p.vy += (dy / d) * 0.09;
        }
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > STAGE_HEIGHT) p.vy *= -1;
      }

      g.lineWidth = 1;
      for (let i = 0; i < parts.length; i++) {
        for (let j = i + 1; j < parts.length; j++) {
          const d = Math.hypot(parts[i].x - parts[j].x, parts[i].y - parts[j].y);
          if (d < LINK_DISTANCE) {
            g.strokeStyle = `rgba(242, 182, 50, ${1 - d / LINK_DISTANCE})`;
            g.beginPath();
            g.moveTo(parts[i].x, parts[i].y);
            g.lineTo(parts[j].x, parts[j].y);
            g.stroke();
          }
        }
      }
      g.fillStyle = "#F4EFD8";
      for (const p of parts) g.fillRect(p.x - 1, p.y - 1, 2, 2);

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      stage.destroy();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return <CanvasFrame canvasRef={canvasRef} label="Particle playground: move to attract, tap to scatter" />;
}
