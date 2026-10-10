import { useState } from "react";
import { DomFrame } from "./shared.jsx";

const SCENE_STARS = [
  [8, 8], [22, 24], [35, 7], [48, 18], [61, 6], [74, 22], [88, 10], [94, 28], [15, 34], [56, 30],
];

// One piece of state flips the sky, the sun and moon, the hills, and the stars.
export default function DayNightScene() {
  const [night, setNight] = useState(false);
  const toggle = () => setNight((n) => !n);

  return (
    <DomFrame>
      <div
        className={`sam-scene${night ? " is-night" : ""}`}
        role="button"
        tabIndex={0}
        aria-pressed={night}
        aria-label="Switch between day and night"
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        }}
      >
        {SCENE_STARS.map(([x, y]) => (
          <span key={`${x}-${y}`} className="sam-star" style={{ left: `${x}%`, top: `${y}%` }} />
        ))}
        <span className="sam-orb sam-sun" />
        <span className="sam-orb sam-moon" />
        <span className="sam-hill sam-hill-a" />
        <span className="sam-hill sam-hill-b" />
      </div>
    </DomFrame>
  );
}
