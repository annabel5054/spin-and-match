import { useRef, useState } from "react";
import { DomFrame } from "./shared.jsx";

const KINETIC_REACH = 120;

// Letters that lift, grow, and tilt as the pointer gets close. Type any word.
export default function KineticType() {
  const [word, setWord] = useState("wiggle");
  const stageRef = useRef(null);
  const letters = Array.from(word);
  const size = Math.floor(Math.min(120, 520 / Math.max(letters.length, 1)));

  const onMove = (e) => {
    for (const el of stageRef.current.children) {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const near = Math.max(0, 1 - Math.hypot(dx, dy) / KINETIC_REACH);
      el.style.transform = `translateY(${-near * 20}px) scale(${1 + near * 0.7}) rotate(${(-dx / KINETIC_REACH) * near * 16}deg)`;
      el.style.color = near > 0.35 ? "var(--sam-bad)" : "";
    }
  };

  const onLeave = () => {
    for (const el of stageRef.current.children) {
      el.style.transform = "";
      el.style.color = "";
    }
  };

  return (
    <>
      <DomFrame>
        <div
          ref={stageRef}
          className="sam-type-stage"
          style={{ fontSize: `min(${size}px, ${Math.floor(90 / Math.max(letters.length, 1))}vw)` }}
          onPointerMove={onMove}
          onPointerLeave={onLeave}
          aria-label={`The word ${word}, reacting to your pointer`}
        >
          {letters.map((ch, i) => (
            <span key={i}>{ch === " " ? "\u00A0" : ch}</span>
          ))}
        </div>
      </DomFrame>
      <div className="sam-controls">
        <label>
          Your word
          <input
            className="sam-input"
            value={word}
            maxLength={12}
            onChange={(e) => setWord(e.target.value)}
          />
        </label>
      </div>
    </>
  );
}
