import { useEffect, useRef } from "react";
import { STAGE_HEIGHT, localPoint, DomFrame } from "./shared.jsx";

const BLOB_FOLLOW = [0.28, 0.2, 0.14, 0.1, 0.07, 0.05];
const BLOB_RADIUS = 22;

// Blobs that trail the pointer; an SVG filter melts them into each other.
export default function GooeyBlobs() {
  const stageRef = useRef(null);
  const blobRefs = useRef([]);

  useEffect(() => {
    const el = stageRef.current;
    const pos = BLOB_FOLLOW.map(() => ({ x: el.clientWidth / 2, y: STAGE_HEIGHT / 2 }));
    let target = null;
    let raf = 0;

    const onMove = (e) => {
      target = localPoint(el, e);
    };
    const onLeave = () => {
      target = null;
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);

    const frame = (now) => {
      const t = now / 900;
      const w = el.clientWidth;
      BLOB_FOLLOW.forEach((follow, i) => {
        const tx = target ? target.x : w / 2 + Math.cos(t + i * 1.3) * (60 + i * 18);
        const ty = target ? target.y : STAGE_HEIGHT / 2 + Math.sin(t * 1.2 + i * 1.3) * (40 + i * 10);
        pos[i].x += (tx - pos[i].x) * follow;
        pos[i].y += (ty - pos[i].y) * follow;
        const blob = blobRefs.current[i];
        if (blob) blob.style.transform = `translate(${pos[i].x - BLOB_RADIUS}px, ${pos[i].y - BLOB_RADIUS}px)`;
      });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <DomFrame>
      <svg className="sam-defs" width="0" height="0" aria-hidden="true">
        <defs>
          <filter id="sam-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="7" />
            <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8" />
          </filter>
        </defs>
      </svg>
      <div ref={stageRef} className="sam-goo-stage" aria-label="Gooey blobs that follow your pointer">
        <div className="sam-goo-blobs">
          {BLOB_FOLLOW.map((_, i) => (
            <i
              key={i}
              ref={(node) => {
                blobRefs.current[i] = node;
              }}
            />
          ))}
        </div>
      </div>
    </DomFrame>
  );
}
