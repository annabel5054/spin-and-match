import { useState } from "react";
import "./style.css";
import PhysicsToy from "./toys/PhysicsToy.jsx";
import ParticlePlayground from "./toys/ParticlePlayground.jsx";
import GooeyBlobs from "./toys/GooeyBlobs.jsx";
import GenerativeArt from "./toys/GenerativeArt.jsx";
import KineticType from "./toys/KineticType.jsx";
import DayNightScene from "./toys/DayNightScene.jsx";

function WarmUp({ title, hint, onBack, children }) {
  return (
    <>
      <h1 className="sam-title">{title}</h1>
      <p className="sam-sub">{hint}</p>
      <div className="sam-toy-actions">
        <button type="button" className="sam-btn sam-btn-ghost" onClick={onBack}>
          All warm-ups
        </button>
      </div>
      {children}
    </>
  );
}

function WarmUpMenu({ activities, onPick }) {
  return (
    <>
      <h1 className="sam-title">Pick a warm-up</h1>
      <p className="sam-sub">Play with one of these, then head back to the spin whenever you are ready.</p>
      <div className="sam-menu">
        {activities.map((a) => (
          <button key={a.id} type="button" className="sam-card" onClick={() => onPick(a.id)}>
            <b>{a.title}</b>
            <span>{a.blurb}</span>
          </button>
        ))}
      </div>
    </>
  );
}

const ACTIVITIES = [
  {
    id: "toy",
    title: "Physics toy",
    blurb: "Drop numbered balls. Matching numbers clear when they touch.",
    hint: "Tap anywhere in the box to drop a numbered ball. Two balls with the same number clear each other when they touch.",
    Stage: PhysicsToy,
  },
  {
    id: "particles",
    title: "Particle playground",
    blurb: "Particles chase your pointer and link up.",
    hint: "Move your pointer through the particles and they follow it. Tap to scatter them.",
    Stage: ParticlePlayground,
  },
  {
    id: "gooey",
    title: "Gooey blobs",
    blurb: "Blobs trail you and melt into each other.",
    hint: "Move through the box. The blobs trail you and melt into each other.",
    Stage: GooeyBlobs,
  },
  {
    id: "art",
    title: "Generative art studio",
    blurb: "A pattern draws itself. Reshape it with sliders.",
    hint: "Watch the pattern draw itself. Change the sliders to redraw it, or hit randomize.",
    Stage: GenerativeArt,
  },
  {
    id: "type",
    title: "Kinetic typography",
    blurb: "Letters react to how close you are. Type your own word.",
    hint: "Move over the letters and they react to how close you are. Type your own word below.",
    Stage: KineticType,
  },
  {
    id: "scene",
    title: "Day and night scene",
    blurb: "One click flips the whole world.",
    hint: "Click the scene to switch between day and night.",
    Stage: DayNightScene,
  },
];


// Warm-up picker shown from "Warm up": a menu of toys. App's "Back to spin" button closes it.
export default function WarmUps() {
  const [view, setView] = useState("menu");
  const activity = ACTIVITIES.find((a) => a.id === view);

  if (!activity) {
    return <WarmUpMenu activities={ACTIVITIES} onPick={setView} />;
  }
  const { Stage } = activity;
  return (
    <WarmUp title={activity.title} hint={activity.hint} onBack={() => setView("menu")}>
      <Stage key={activity.id} />
    </WarmUp>
  );
}
