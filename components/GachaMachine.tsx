"use client";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { type Lang } from "../data/content";
import { chenleFortunes, type ChenleFortune } from "../data/chenleFortunes";
import { chooseFortune } from "../lib/chenle-fortune";
import FortuneGachaResult from "./gacha/FortuneGachaResult";
import { gachaAssets, gachaCapsules, gachaCopy } from "../data/gachaDesigns";
import CutChevron from "./CutChevron";
import {
  CapsuleRound,
  chooseCapsule,
  type CapsuleStep,
} from "../lib/gacha-flow";
export default function GachaMachine({
  lang,
  onComplete,
}: {
  lang: Lang;
  onComplete: () => void;
}) {
  const [step, setStep] = useState<CapsuleStep>("idle"),
    [selected, setSelected] = useState(0),
    [fortune, setFortune] = useState<ChenleFortune | null>(null),
    [edge, setEdge] = useState(0),
    previousFortune = useRef<string | null>(null),
    controller = useRef<CapsuleRound | null>(null),
    previous = useRef(-1),
    round = useRef(0),
    complete = useRef(onComplete),
    clip = useId(),
    copy = gachaCopy[lang];
  complete.current = onComplete;
  if (!controller.current) controller.current = new CapsuleRound();
  useEffect(() => () => controller.current?.cancel(), []);
  function turn() {
    if (controller.current!.busy) return;
    const index = chooseCapsule(previous.current, gachaCapsules.length);
    previous.current = index;
    setSelected(index);
    const picked = chooseFortune(chenleFortunes, previousFortune.current);
    previousFortune.current = picked.id;
    setFortune(picked);
    setEdge(Math.floor(Math.random() * 4));
    round.current++;
    controller.current!.play(setStep, () => complete.current());
  }
  const capsule = gachaCapsules[selected],
    actionable = step === "idle" || step === "reveal",
    knob = gachaAssets.knob;
  return (
    <section className="module gacha-page capsule-studio page-enter">
      <div className="module-heading capsule-heading">
        <h1 aria-label="CHENLE FORTUNE GACHA" className="fortune-heading"><span>CHENLE</span><em>FORTUNE</em><span>GACHA</span><small>What's your Chenle luck today?</small></h1>
      </div>
      <div className={`capsule-scene stage-${step}`}>
        <div className={`capsule-machine ${step}`} aria-busy={!actionable}>
          <img
            className="capsule-machine-render"
            src={gachaAssets.machine}
            width={gachaAssets.width}
            height={gachaAssets.height}
            alt={copy.machine}
          />
          <div className="capsule-hopper" aria-hidden="true">
            {gachaCapsules.map((c) => (
              <div
                key={c.id}
                className={`hopper-capsule ${step === "mixing" ? "is-mixing" : ""}`}
                style={
                  {
                    left: `${c.x}%`,
                    top: `${c.y}%`,
                    width: `${c.size}%`,
                    zIndex: c.depth,
                    "--capsule-angle": `${c.angle}deg`,
                    "--capsule-delay": `${c.depth * 0.045}s`,
                  } as CSSProperties
                }
              >
                <img src={c.src} alt="" draggable={false} />
              </div>
            ))}
          </div>
          <svg
            className="capsule-front-glass"
            viewBox="0 0 1024 1536"
            aria-hidden="true"
          >
            <defs>
              <clipPath id={clip}>
                <ellipse cx="512" cy="491" rx="440" ry="389" />
              </clipPath>
              <linearGradient id={`${clip}-shine`}>
                <stop stopColor="#fff" stopOpacity="0" />
                <stop offset=".45" stopColor="#fff" stopOpacity=".2" />
                <stop offset="1" stopColor="#fff" stopOpacity="0" />
              </linearGradient>
            </defs>
            <g clipPath={`url(#${clip})`} fill="none">
              <path
                d="M160 370Q180 235 320 160"
                stroke="#fff"
                strokeWidth="18"
                strokeLinecap="round"
                opacity=".32"
              />
              <path
                d="M925 550Q930 700 780 808"
                stroke="#fff"
                strokeWidth="10"
                strokeLinecap="round"
                opacity=".3"
              />
              <path
                d="M140 550Q512 660 900 530"
                stroke={`url(#${clip}-shine)`}
                strokeWidth="55"
              />
            </g>
          </svg>
          <button
            className={`capsule-turn-knob ${actionable ? "is-ready" : ""}`}
            onClick={turn}
            disabled={!actionable}
            aria-label={step === "reveal" ? copy.again : copy.turn}
            style={{
              left: `${(knob.x / gachaAssets.width) * 100}%`,
              top: `${(knob.y / gachaAssets.height) * 100}%`,
              width: `${(knob.size / gachaAssets.width) * 100}%`,
            }}
          >
            <svg
              viewBox={`${knob.x} ${knob.y} ${knob.size} ${knob.size}`}
              aria-hidden="true"
            >
              <image
                href={gachaAssets.machine}
                width={gachaAssets.width}
                height={gachaAssets.height}
              />
            </svg>
          </button>
          {actionable && (
            <div className="capsule-knob-hint" aria-hidden="true">
              <CutChevron />
            </div>
          )}
          {(step === "drop" || step === "opening") && (
            <div className={`capsule-prize-chute ${step}`} key={round.current}>
              <img className="capsule-prize-whole" src={capsule.src} alt="" />
              {step === "opening" && (
                <>
                  <img
                    className="capsule-half capsule-lid"
                    src={capsule.src}
                    alt=""
                  />
                  <img
                    className="capsule-half capsule-bottom"
                    src={capsule.src}
                    alt=""
                  />
                </>
              )}
              <span className="capsule-open-glow" />
            </div>
          )}
        </div>
        <div
          className="capsule-reveal-area"
          aria-live="polite"
          aria-atomic="true"
        >
          {step === "reveal" && fortune && (
            <FortuneGachaResult key={round.current} fortune={fortune} lang={lang} capsuleSrc={capsule.src} edge={edge} onAgain={turn} />
          )}
          {step === "mixing" && (
            <span className="capsule-action-status sr-only">{copy.mixing}</span>
          )}
          {(step === "drop" || step === "opening") && (
            <span className="capsule-action-status sr-only">
              {copy.opening}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
