import { useEffect, useRef, useState } from "react";
import { STAGE_HEIGHT, STAGE_BG, createStage, CanvasFrame } from "./shared.jsx";

const ART_COLORS = ["#F4EFD8", "#F2B632", "#E4572E", "#9FCDB7"];
const ART_FADE = "rgba(20, 51, 42, 0.04)";

// A pattern that draws itself from two sine waves. The sliders change the shape live.
export default function GenerativeArt() {
  const canvasRef = useRef(null);
  const [loops, setLoops] = useState(3);
  const [twist, setTwist] = useState(5);
  const params = useRef({ loops: 3, twist: 5, clear: true });

  useEffect(() => {
    params.current.loops = loops;
    params.current.twist = twist;
    params.current.clear = true;
  }, [loops, twist]);

  const randomize = () => {
    setLoops(1 + Math.floor(Math.random() * 8));
    setTwist(2 + Math.floor(Math.random() * 9));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = createStage(canvas, STAGE_HEIGHT, () => {
      params.current.clear = true;
    });
    const g = stage.g;
    let t = 0;
    let raf = 0;

    const frame = () => {
      const { loops: a, twist: b } = params.current;
      if (params.current.clear) {
        g.fillStyle = STAGE_BG;
        g.fillRect(0, 0, stage.w, STAGE_HEIGHT);
        params.current.clear = false;
      }
      g.fillStyle = ART_FADE;
      g.fillRect(0, 0, stage.w, STAGE_HEIGHT);

      const r = Math.min(stage.w, STAGE_HEIGHT) * 0.42;
      for (let s = 0; s < 4; s++) {
        for (let i = 0; i < ART_COLORS.length; i++) {
          const tt = t + i * 1.6;
          const x = stage.w / 2 + r * (Math.cos(tt * a) * 0.6 + Math.cos(tt * b + t * 0.3) * 0.4);
          const y = STAGE_HEIGHT / 2 + r * (Math.sin(tt * a) * 0.6 + Math.sin(tt * b + t * 0.3) * 0.4);
          g.fillStyle = ART_COLORS[i];
          g.fillRect(x, y, 2, 2);
        }
        t += 0.012;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      stage.destroy();
    };
  }, []);

  return (
    <>
      <CanvasFrame canvasRef={canvasRef} label="Generative art drawn from two sine waves" />
      <div className="sam-controls">
        <label>
          Loops
          <input type="range" min="1" max="8" value={loops} onChange={(e) => setLoops(Number(e.target.value))} />
          <b>{loops}</b>
        </label>
        <label>
          Twist
          <input type="range" min="2" max="10" value={twist} onChange={(e) => setTwist(Number(e.target.value))} />
          <b>{twist}</b>
        </label>
        <button type="button" className="sam-btn sam-btn-ghost" onClick={randomize}>
          Randomize
        </button>
      </div>
    </>
  );
}
