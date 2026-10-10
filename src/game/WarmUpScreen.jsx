import { lazy, Suspense } from "react";
import DotGridBackground from "../Warping.jsx";

const Toy = lazy(() => import("../Toy.jsx"));

// Full-screen warm-up menu over the game, with a fixed "Back to spin" button in the corner.
export default function WarmUpScreen({ onBack }) {
  return (
    <div className="sam sam-toy-screen" role="dialog" aria-modal="true" aria-label="Warm up">
      <DotGridBackground />
      <Suspense fallback={<p className="sam-sub">Loading…</p>}>
        <Toy />
      </Suspense>
      <button type="button" className="sam-btn sam-back" onClick={onBack}>
        ← Back to spin
      </button>
    </div>
  );
}
