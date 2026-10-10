// Canvas sizing and frame wrappers shared by the warm-up toys.
export const MAX_SIZE = 560;
export const STAGE_HEIGHT = 380;
export const STAGE_BG = "#14332A";
export const STAGE_FADE = "rgba(20, 51, 42, 0.3)";
export const FRAME_BORDER = 2;

// Sizes a canvas to its frame (capped at MAX_SIZE, sharp on high-DPI screens) and keeps it sized.
export function createStage(canvas, height, onResize) {
  const holder = canvas.parentElement.parentElement;
  const g = canvas.getContext("2d");
  const stage = { g, w: 0 };
  const fit = () => {
    const avail = holder.clientWidth - FRAME_BORDER * 2;
    stage.w = Math.max(160, Math.min(avail, MAX_SIZE));
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = `${stage.w}px`;
    canvas.style.height = `${height}px`;
    canvas.width = Math.round(stage.w * dpr);
    canvas.height = Math.round(height * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (onResize) onResize(stage);
  };
  const ro = new ResizeObserver(fit);
  ro.observe(holder);
  fit();
  stage.destroy = () => ro.disconnect();
  return stage;
}

export function localPoint(el, e) {
  const r = el.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

export function CanvasFrame({ canvasRef, label }) {
  return (
    <div className="sam-toy-wrap">
      <div className="sam-toy-frame">
        <canvas ref={canvasRef} className="sam-toy-canvas" aria-label={label} />
      </div>
    </div>
  );
}

export function DomFrame({ children }) {
  return (
    <div className="sam-toy-wrap">
      <div className="sam-toy-frame sam-toy-frame--dom">{children}</div>
    </div>
  );
}
