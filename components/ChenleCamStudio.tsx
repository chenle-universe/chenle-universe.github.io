"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import {
  Camera,
  CameraOff,
  Sparkles,
  Music2,
  Download,
  Volume2,
  VolumeX,
  Mic,
  Square,
  ImagePlus,
  RotateCcw,
  Hand,
  ChevronDown,
  Check,
} from "lucide-react";
import type { Lang } from "../data/content";
import {
  camCopy,
  camFrames,
  frameForMode,
  frameOrder,
  camStickers,
  type CamMode,
  type CamFrame,
} from "../data/camStudio";
import { CameraProvider, useCamera } from "./cam/CameraProvider";
import { useHandTracking } from "./cam/useHandTracking";
import PhotoResult from "./cam/PhotoResult";
import { GestureEngine, type GestureEvent } from "../lib/cam/gestures";
import { MagicField, paintBase, paintFrame, projectHands, type Rect } from "../lib/cam/visuals";
import { StudioAudio, chordNames } from "../lib/cam/audio";
type Source = "live" | "upload" | "magic" | "sound";
const noteLabels = ["C", "D", "E", "G", "A", "C↑", "D↑", "E↑"];
export default function ChenleCamStudio(props: {
  lang: Lang;
  onComplete: () => void;
  completed?: boolean;
}) {
  return (
    <CameraProvider>
      <Studio {...props} />
    </CameraProvider>
  );
}
function Studio({
  lang,
  onComplete,
  completed = false,
}: {
  lang: Lang;
  onComplete: () => void;
  completed?: boolean;
}) {
  const copy = camCopy[lang],
    camera = useCamera(),
    [mode, setMode] = useState<CamMode>("photo"),
    [frame, setFrame] = useState<CamFrame>("birthday"),
    [beauty, setBeauty] = useState(true),
    [countdownEnabled, setCountdownEnabled] = useState(true),
    [countdown, setCountdown] = useState<number | null>(null),
    [interaction, setInteraction] = useState<"gesture" | "touch">("gesture"),
    [photoSource, setPhotoSource] = useState<Source>("live"),
    [available, setAvailable] = useState<Source[]>([]),
    [musicOn, setMusicOn] = useState(false),
    [volume, setVolume] = useState(60),
    [muted, setMuted] = useState(false),
    [chord, setChord] = useState(-1),
    [recording, setRecording] = useState(false),
    [recSeconds, setRecSeconds] = useState(0),
    [recordUrl, setRecordUrl] = useState(""),
    [recordMime, setRecordMime] = useState(""),
    [resultUrl, setResultUrl] = useState(""),
    [error, setError] = useState<keyof typeof camCopy.zh | "">(""),
    [flash, setFlash] = useState(false),
    [rewarded, setRewarded] = useState(completed),
    [played, setPlayed] = useState(0),
    [activeNote, setActiveNote] = useState(-1);
  const canvas = useRef<HTMLCanvasElement>(null),
    playback = useRef<HTMLAudioElement>(null),
    upload = useRef<HTMLInputElement>(null),
    field = useRef<MagicField | null>(null),
    engine = useRef<StudioAudio | null>(null),
    gestures = useRef(new GestureEngine()),
    stickers = useRef<HTMLImageElement[]>([]),
    frames = useRef<Partial<Record<CamFrame, HTMLImageElement>>>({}),
    framesReady = useRef<Promise<void>>(Promise.resolve()),
    sources = useRef<Partial<Record<Source, HTMLImageElement>>>({}),
    urls = useRef<string[]>([]),
    sourceUrls = useRef<Partial<Record<Source, string>>>({}),
    lastResult = useRef(""),
    lastRecord = useRef(""),
    mounted = useRef(true),
    earned = useRef(completed),
    notes = useRef(0),
    pointers = useRef(
      new Map<number, { x: number; y: number; zone: number; at: number }>(),
    ),
    keyboardPointers = useRef(new Map<number, number>()),
    lastSummon = useRef(-Infinity),
    lastTrackedFrame = useRef(-1),
    rect = useRef<Rect>({ x: 12, y: 12, w: 936, h: 696 }),
    recordStart = useRef(0),
    captureToken = useRef(0),
    noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null),
    flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  if (!field.current) field.current = new MagicField();
  if (!engine.current) engine.current = new StudioAudio();
  const tracking = useHandTracking(
      mode !== "photo" && interaction === "gesture",
    ),
    touch =
      interaction === "touch" ||
      camera.status !== "on" ||
      tracking.status === "error";
  const settings = useRef({
    mode,
    frame,
    beauty,
    photoSource,
    cameraStatus: camera.status,
    touch,
  });
  settings.current = {
    mode,
    frame,
    beauty,
    photoSource,
    cameraStatus: camera.status,
    touch,
  };
  const complete = useRef(onComplete);
  complete.current = onComplete;
  const earn = useCallback(() => {
    if (earned.current) return;
    earned.current = true;
    setRewarded(true);
    complete.current();
  }, []);
  useEffect(() => {
    if (completed) {
      earned.current = true;
      setRewarded(true);
    }
  }, [completed]);
  const playNote = useCallback(
    (zone: number, x: number, y: number) => {
      if (!engine.current?.note(zone)) return;
      field.current?.note(x, y);
      notes.current++;
      setPlayed(notes.current);
      setActiveNote(zone);
      if (noteTimer.current) clearTimeout(noteTimer.current);
      noteTimer.current = setTimeout(() => setActiveNote(-1), 250);
      if (notes.current >= 3) earn();
    },
    [earn],
  );
  const nextChord = useCallback((x = 0.5, y = 0.5) => {
    const index = engine.current?.nextChord() ?? -1;
    if (index >= 0) {
      setChord(index);
      field.current?.wave(x, y);
    }
  }, []);
  const handleGestures = useRef((events: GestureEvent[]) => {});
  handleGestures.current = (events) => {
    for (const event of events) {
      const { type, x, y } = event;
      if (settings.current.mode === "magic") {
        if (type === "dust") {
          field.current!.burst(x, y);
          earn();
        }
        if (type === "friends") {
          field.current!.summon(x, y);
          earn();
        }
        if (type === "clap") field.current!.clear();
      } else if (settings.current.mode === "sound" && engine.current?.active) {
        if (type === "pinch" || type === "swipe") {
          playNote(
            type === "swipe" ? event.zone! : Math.max(0, Math.min(7, Math.floor(x * 8))),
            x,
            y,
          );
          if (type === "swipe") field.current!.trace(x, y);
        }
        if (type === "chord") nextChord(x, y);
        if (type === "stop") {
          engine.current.stopChord();
          setChord(-1);
          field.current!.clear();
          field.current!.flash = 0;
        }
      }
    }
  };
  useEffect(() => {
    stickers.current = camStickers.map(({ src }) => {
      const image = new Image();
      image.src = src;
      return image;
    });
    framesReady.current = Promise.all(
      (Object.keys(camFrames) as CamFrame[]).map(
        (id) =>
          new Promise<void>((resolve) => {
            const image = new Image();
            frames.current[id] = image;
            image.onload = () => resolve();
            image.onerror = () => resolve();
            image.src = camFrames[id];
          }),
      ),
    ).then(() => undefined);
    let raf = 0,
      last = performance.now();
    const draw = (now: number) => {
      const context = canvas.current?.getContext("2d");
      if (context && !document.hidden) {
        const dt = Math.min(0.05, (now - last) / 1000),
          s = settings.current,
          video = camera.video.current,
          image =
            s.mode === "photo" && s.photoSource !== "live"
              ? sources.current[s.photoSource]
              : null,
          source =
            image ??
            ((s.mode !== "photo" || s.photoSource === "live") &&
            s.cameraStatus === "on" &&
            video?.readyState! >= 2
              ? video
              : null);
        const sourceRect = paintBase(context, {
          mode: s.mode,
          frame: s.frame,
          beauty: s.beauty,
          source,
          mirror: !image && !!source,
          stickers: stickers.current,
          frames: frames.current,
        });
        rect.current = { x: 0, y: 0, w: context.canvas.width, h: context.canvas.height };
        if (s.mode !== "photo") {
          const timestamp = tracking.sample.current,
            hands = projectHands(tracking.hands.current, sourceRect, rect.current);
          if (!s.touch && timestamp !== lastTrackedFrame.current) {
            lastTrackedFrame.current = timestamp;
            const tracked = hands.filter(
              (h) => h.seen === timestamp && h.points[9].x >= 0 && h.points[9].x <= 1 && h.points[9].y >= 0 && h.points[9].y <= 1,
            );
            handleGestures.current(gestures.current.update(tracked, now));
          }
          field.current!.draw(
            context,
            rect.current,
            dt,
            stickers.current,
            s.touch ? [] : hands,
            s.mode === "magic" && !s.touch,
            now,
          );
        }
        paintFrame(context, s.mode, s.frame, frames.current);
      }
      last = now;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [camera.video, tracking.hands, tracking.sample]);
  useEffect(() => {
    captureToken.current++;
    setCountdown(null);
    setError("");
    gestures.current.reset();
    field.current!.clear(false);
    pointers.current.clear();
    keyboardPointers.current.clear();
    lastTrackedFrame.current = -1;
    if (mode !== "sound") {
      engine.current!.pause();
      setMusicOn(false);
      setChord(-1);
      setRecording(false);
      playback.current?.pause();
    }
  }, [mode]);
  useEffect(() => {
    gestures.current.reset();
    field.current!.clear(false);
    lastTrackedFrame.current = -1;
  }, [interaction, camera.status]);
  useEffect(() => {
    const hide = () => {
      if (document.hidden) {
        captureToken.current++;
        setCountdown(null);
        engine.current!.pause();
        setMusicOn(false);
        setChord(-1);
        setRecording(false);
        playback.current?.pause();
        field.current!.clear(false);
        gestures.current.reset();
      }
    };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, []);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      captureToken.current++;
      engine.current!.close();
      urls.current.forEach((url) => URL.revokeObjectURL(url));
      if (lastResult.current) URL.revokeObjectURL(lastResult.current);
      if (lastRecord.current) URL.revokeObjectURL(lastRecord.current);
      if (noteTimer.current) clearTimeout(noteTimer.current);
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, []);
  useEffect(() => {
    engine.current!.setVolume((volume / 100) * 0.7, muted);
  }, [volume, muted]);
  const takePhoto = useRef(async () => {});
  takePhoto.current = async () => {
    const element = canvas.current;
    if (!element) return;
    const token = ++captureToken.current,
      s = settings.current,
      video = camera.video.current,
      image =
        s.mode === "photo" && s.photoSource !== "live"
          ? sources.current[s.photoSource]
          : null;
    if (s.mode === "photo" && !image && s.cameraStatus !== "on") {
      setError("uploadNote");
      return;
    }
    try {
      await document.fonts.ready;
      await framesReady.current;
      if (!frames.current[frameForMode(s.mode, s.frame)]?.naturalWidth)
        throw Error("Frame unavailable");
      if (token !== captureToken.current || !mounted.current) return;
      const exported = document.createElement("canvas");
      exported.width = element.width * 2;
      exported.height = element.height * 2;
      const context = exported.getContext("2d")!;
      const source =
          image ??
          ((s.mode !== "photo" || s.photoSource === "live") &&
          s.cameraStatus === "on" &&
          video?.readyState! >= 2
            ? video
            : null),
        area = paintBase(context, {
          mode: s.mode,
          frame: s.frame,
          source,
          mirror: !image && !!source,
          beauty: s.beauty,
          stickers: stickers.current,
          frames: frames.current,
        });
      if (s.mode !== "photo") {
        const viewport = { x: 0, y: 0, w: exported.width, h: exported.height };
        field.current!.draw(
          context,
          viewport,
          0,
          stickers.current,
          s.touch ? [] : projectHands(tracking.hands.current, area, viewport),
          s.mode === "magic" && !s.touch,
          performance.now(),
        );
      }
      paintFrame(context, s.mode, s.frame, frames.current);
      const blob = await new Promise<Blob | null>((resolve) =>
        exported.toBlob(resolve, "image/png"),
      );
      if (!blob) throw Error("Empty photo");
      if (token !== captureToken.current || !mounted.current) return;
      const url = URL.createObjectURL(blob);
      if (lastResult.current) URL.revokeObjectURL(lastResult.current);
      lastResult.current = url;
      setResultUrl(url);
      setFlash(true);
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setFlash(false), 450);
      if (s.mode !== "photo") {
        const memoryUrl = URL.createObjectURL(blob);
        urls.current.push(memoryUrl);
        const memory = new Image();
        memory.onload = () => {
          if (mounted.current) {
            const key = s.mode as "magic" | "sound";
            if (sourceUrls.current[key])
              URL.revokeObjectURL(sourceUrls.current[key]!);
            sourceUrls.current[key] = memoryUrl;
            sources.current[key] = memory;
            setAvailable((a) =>
              a.includes(s.mode as Source) ? a : [...a, s.mode as Source],
            );
          }
        };
        memory.src = memoryUrl;
      }
      if (s.mode === "photo") earn();
    } catch {
      if (mounted.current) setError("photoError");
    }
  };
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      takePhoto.current();
      return;
    }
    const timer = setTimeout(
      () => setCountdown((n) => (n === null ? null : n - 1)),
      1000,
    );
    return () => clearTimeout(timer);
  }, [countdown]);
  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(
      () =>
        setRecSeconds(
          Math.min(12, Math.floor((Date.now() - recordStart.current) / 1000)),
        ),
      200,
    );
    return () => clearInterval(timer);
  }, [recording]);
  function capture() {
    setError("");
    if (mode === "photo" && photoSource === "live" && camera.status !== "on") {
      setError("uploadNote");
      return;
    }
    if (mode === "photo" && countdownEnabled) setCountdown(3);
    else takePhoto.current();
  }
  async function toggleMusic() {
    setError("");
    if (musicOn) {
      await engine.current!.pause();
      setMusicOn(false);
      setChord(-1);
      setRecording(false);
      return;
    }
    try {
      await engine.current!.start();
      if (
        mounted.current &&
        settings.current.mode === "sound" &&
        !document.hidden
      )
        setMusicOn(true);
      else await engine.current!.pause();
    } catch {
      setError("audioError");
    }
  }
  function startRecording() {
    setError("");
    playback.current?.pause();
    try {
      engine.current!.record((blob) => {
        if (!mounted.current) return;
        setRecording(false);
        if (!blob.size) {
          setError("recordError");
          return;
        }
        const url = URL.createObjectURL(blob);
        if (lastRecord.current) URL.revokeObjectURL(lastRecord.current);
        lastRecord.current = url;
        setRecordUrl(url);
        setRecordMime(blob.type);
      });
      recordStart.current = Date.now();
      setRecSeconds(0);
      setRecording(true);
    } catch {
      setError("recordError");
    }
  }
  function loadPhoto(file?: File) {
    if (!file) return;
    setError("");
    if (
      ![
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/heic",
        "image/heif",
      ].includes(file.type)
    ) {
      setError("uploadError");
      return;
    }
    const url = URL.createObjectURL(file),
      image = new Image();
    image.onload = () => {
      if (!mounted.current) {
        URL.revokeObjectURL(url);
        return;
      }
      urls.current.push(url);
      if (sourceUrls.current.upload)
        URL.revokeObjectURL(sourceUrls.current.upload);
      sourceUrls.current.upload = url;
      sources.current.upload = image;
      setAvailable((a) => (a.includes("upload") ? a : [...a, "upload"]));
      setPhotoSource("upload");
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      setError("uploadError");
    };
    image.src = url;
  }
  function eventPoint(event: PointerEvent<HTMLCanvasElement>) {
    const bounds = event.currentTarget.getBoundingClientRect(),
      area = rect.current;
    return {
      x: Math.max(
        0,
        Math.min(
          1,
          (((event.clientX - bounds.left) / bounds.width) *
            event.currentTarget.width -
            area.x) /
            area.w,
        ),
      ),
      y: Math.max(
        0,
        Math.min(
          1,
          (((event.clientY - bounds.top) / bounds.height) *
            event.currentTarget.height -
            area.y) /
            area.h,
        ),
      ),
    };
  }
  function pointerDown(event: PointerEvent<HTMLCanvasElement>) {
    if (mode === "photo" || !touch) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const p = eventPoint(event),
      zone = Math.min(7, Math.floor(p.x * 8));
    pointers.current.set(event.pointerId, {
      ...p,
      zone,
      at: performance.now(),
    });
    if (mode === "magic") {
      field.current!.burst(p.x, p.y, 40);
      earn();
      if (
        pointers.current.size >= 2 &&
        performance.now() - lastSummon.current > 2000
      ) {
        field.current!.summon(p.x, p.y);
        lastSummon.current = performance.now();
      }
    } else playNote(zone, p.x, p.y);
  }
  function pointerMove(event: PointerEvent<HTMLCanvasElement>) {
    const previous = pointers.current.get(event.pointerId);
    if (!previous || !touch) return;
    const p = eventPoint(event),
      now = performance.now(),
      zone = Math.min(7, Math.floor(p.x * 8));
    if (mode === "magic" && now - previous.at > 30) {
      field.current!.burst(p.x, p.y, 14);
      previous.at = now;
      earn();
    }
    if (mode === "sound" && previous.zone !== zone) {
      playNote(zone, p.x, p.y);
      field.current!.trace(p.x, p.y);
      previous.zone = zone;
    }
    previous.x = p.x;
    previous.y = p.y;
  }
  function keyboardPlay(event: PointerEvent<HTMLDivElement>, start = false) {
    if (!musicOn || (!start && !keyboardPointers.current.has(event.pointerId)))
      return;
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    const zone = Math.max(
      0,
      Math.min(
        7,
        Math.floor(((event.clientX - bounds.left) / bounds.width) * 8),
      ),
    );
    if (start) event.currentTarget.setPointerCapture(event.pointerId);
    if (keyboardPointers.current.get(event.pointerId) !== zone) {
      playNote(zone, (zone + 0.5) / 8, 0.65);
      field.current!.trace((zone + 0.5) / 8, 0.65);
    }
    keyboardPointers.current.set(event.pointerId, zone);
  }
  const cameraMessage =
    camera.status === "paused"
      ? copy.cameraPaused
      : camera.status === "denied"
        ? copy.denied
        : camera.status === "unavailable"
          ? copy.unavailable
          : camera.status === "busy"
            ? copy.busy
            : camera.status === "error"
              ? copy.cameraError
              : copy.permission;
  const isCard = mode === "photo" && frame === "card",
    needsPhoto =
      mode === "photo" && photoSource === "live" && camera.status !== "on",
    filename = recordMime.includes("mp4")
      ? "m4a"
      : recordMime.includes("ogg")
        ? "ogg"
        : "webm";
  return (
    <section className="cam-studio module page-enter">
      <div className="cam-studio-heading">
        <h1>
          CHENLE <em>CAM</em> STUDIO
        </h1>
        <p>{copy.subtitle}</p>
      </div>
      <div className="cam-toolbar">
        <div
          className={`cam-device-status ${camera.status === "on" ? "is-on" : ""}`}
        >
          <i />
          {camera.status === "on"
            ? copy.cameraOn
            : camera.status === "starting"
              ? copy.trackingLoad
              : copy.cameraOff}
        </div>
        <button
          className="cam-camera-toggle"
          onClick={() => {
            setError("");
            if (camera.status === "on") {
              camera.stop();
              setCountdown(null);
            } else {
              setInteraction("gesture");
              camera.start();
            }
          }}
          disabled={camera.status === "starting"}
        >
          {camera.status === "on" ? (
            <CameraOff size={18} />
          ) : (
            <Camera size={18} />
          )}
          <span>
            {camera.status === "on"
              ? copy.stopCamera
              : camera.status === "paused"
                ? copy.resume
                : copy.startCamera}
          </span>
        </button>
      </div>
      {!["on", "off", "starting"].includes(camera.status) && (
        <div className="cam-permission-note">
          <Camera size={20} />
          <p>{cameraMessage}</p>
        </div>
      )}
      <div className="cam-workspace">
        <div className="cam-stage-column">
          <div
            className={`cam-viewfinder ${isCard ? "is-portrait" : ""} ${flash ? "shutter-flash" : ""}`}
          >
            <canvas
              ref={canvas}
              width="960"
              height={isCard ? 1280 : 720}
              aria-label={`${mode === "photo" ? copy.photo : mode === "magic" ? copy.magic : copy.sound} · CHENLE UNIVERSE`}
              onPointerDown={pointerDown}
              onPointerMove={pointerMove}
              onPointerUp={(e) => pointers.current.delete(e.pointerId)}
              onPointerCancel={(e) => pointers.current.delete(e.pointerId)}
              style={{ touchAction: mode === "photo" ? "pan-y" : "none" }}
            />
            {needsPhoto && countdown === null && (
              <div className="cam-empty-caption">
                <Camera size={32} />
                <strong>{copy.startCamera}</strong>
              </div>
            )}
            {countdown !== null && (
              <div
                className="cam-countdown"
                role="status"
                aria-label={String(countdown)}
              >
                {countdown || "✦"}
              </div>
            )}
          </div>
          {mode === "photo" && (
            <div className="cam-photo-actions">
              <button
                className="cam-frame-cycle"
                onClick={() => {
                  captureToken.current++;
                  setCountdown(null);
                  setFrame(
                    frameOrder[
                      (frameOrder.indexOf(frame) + 1) % frameOrder.length
                    ],
                  );
                }}
                aria-label={`${copy.switchFrame} ${frameOrder.indexOf(frame) + 1}/${frameOrder.length}`}
              >
                <RotateCcw size={20} />
                <span>{copy.switchFrame}</span>
                <i className="cam-frame-cycle-dots" aria-hidden="true">
                  {frameOrder.map((f) => (
                    <b key={f} className={f === frame ? "active" : ""} />
                  ))}
                </i>
              </button>
              <button
                className="cam-primary cam-shutter"
                disabled={countdown !== null}
                onClick={capture}
              >
                <Camera size={22} />
                {countdown !== null ? `${countdown}…` : copy.capture}
              </button>
            </div>
          )}
          {mode !== "photo" && (
            <div className="cam-tracking-bar">
              <span>
                {touch
                  ? copy.touchNote
                  : tracking.status === "loading"
                    ? copy.trackingLoad
                    : tracking.status === "ready"
                      ? `${copy.trackingReady} · ${tracking.count} ${copy.hands}`
                      : copy.trackingFail}
              </span>
              <button
                onClick={() =>
                  setInteraction((t) => (t === "touch" ? "gesture" : "touch"))
                }
                aria-pressed={interaction === "touch"}
              >
                <Hand size={15} />
                {interaction === "touch" ? copy.tracking : copy.touch}
              </button>
            </div>
          )}
          {tracking.status === "error" && mode !== "photo" && (
            <div className="cam-inline-error">
              <span>{copy.trackingFail}</span>
              <button onClick={tracking.retry}>
                <RotateCcw size={15} />
                {copy.retry}
              </button>
            </div>
          )}
          {mode === "sound" && (
            <div
              className="cam-keyboard"
              aria-label={copy.soundTouchGuide}
              onPointerDown={(e) => keyboardPlay(e, true)}
              onPointerMove={(e) => keyboardPlay(e)}
              onPointerUp={(e) => keyboardPointers.current.delete(e.pointerId)}
              onPointerCancel={(e) =>
                keyboardPointers.current.delete(e.pointerId)
              }
              style={{ touchAction: "none" }}
            >
              {noteLabels.map((label, i) => (
                <button
                  key={i}
                  disabled={!musicOn}
                  className={activeNote === i ? "is-playing" : ""}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      playNote(i, (i + 0.5) / 8, 0.65);
                    }
                  }}
                  aria-label={`${label} ${i + 1}`}
                >
                  <span>{label}</span>
                </button>
              ))}
            </div>
          )}
          <nav className="cam-mode-nav" aria-label="CHENLE CAM STUDIO">
            <button
              aria-pressed={mode === "photo"}
              onClick={() => setMode("photo")}
            >
              <Camera size={20} />
              <span>{copy.photo}</span>
            </button>
            <button
              aria-pressed={mode === "magic"}
              onClick={() => setMode("magic")}
            >
              <Sparkles size={20} />
              <span>{copy.magic}</span>
            </button>
            <button
              aria-pressed={mode === "sound"}
              onClick={() => setMode("sound")}
            >
              <Music2 size={20} />
              <span>{copy.sound}</span>
            </button>
          </nav>
        </div>
        <aside className="cam-control-panel">
          <h2>
            {mode === "photo"
              ? copy.photo
              : mode === "magic"
                ? copy.magic
                : copy.sound}
          </h2>
          {mode === "photo" ? (
            <>
              {available.length > 0 && (
                <label className="cam-select-label">
                  {copy.source}
                  <select
                    value={photoSource}
                    onChange={(e) => setPhotoSource(e.target.value as Source)}
                  >
                    <option value="live">{copy.live}</option>
                    {available.map((source) => (
                      <option key={source} value={source}>
                        {source === "upload"
                          ? copy.upload
                          : source === "magic"
                            ? copy.lastMagic
                            : copy.lastSound}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <button
                className="cam-secondary"
                onClick={() => upload.current?.click()}
              >
                <ImagePlus size={17} />
                {copy.upload}
              </button>
              <input
                ref={upload}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                className="cam-file-input"
                onChange={(e) => {
                  loadPhoto(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <label className="cam-switch">
                <input
                  type="checkbox"
                  checked={beauty}
                  onChange={(e) => setBeauty(e.target.checked)}
                />
                <span />
                {copy.beauty}
              </label>
              <label className="cam-switch">
                <input
                  type="checkbox"
                  checked={countdownEnabled}
                  onChange={(e) => setCountdownEnabled(e.target.checked)}
                />
                <span />
                {copy.countdown}
              </label>
            </>
          ) : mode === "magic" ? (
            <>
              <p className="cam-mode-guide">
                {touch ? copy.magicTouchGuide : copy.magicGuide}
              </p>
              <div className="cam-sticker-sample" aria-hidden="true">
                {camStickers.slice(0, 5).map((s) => (
                  <img key={s.id} src={s.src} alt="" />
                ))}
              </div>
              <button
                className="cam-primary"
                onClick={() => {
                  if (performance.now() - lastSummon.current < 2000) return;
                  lastSummon.current = performance.now();
                  field.current!.summon(0.5, 0.5);
                  earn();
                }}
              >
                <Sparkles size={19} />
                {copy.summon}
              </button>
              <button
                className="cam-secondary"
                onClick={() => field.current!.clear()}
              >
                <RotateCcw size={17} />
                {copy.clear}
              </button>
              <button className="cam-secondary" onClick={capture}>
                <Camera size={18} />
                {copy.snapshot}
              </button>
            </>
          ) : (
            <>
              <p className="cam-mode-guide">
                {touch ? copy.soundTouchGuide : copy.soundGuide}
              </p>
              <button className="cam-primary" onClick={toggleMusic}>
                {musicOn ? <Square size={17} /> : <Music2 size={19} />}{" "}
                {musicOn ? copy.stopMusic : copy.startMusic}
              </button>

              <label className="cam-volume-label">
                {copy.volume}
                <span>{volume}%</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                />
              </label>
              <button
                className="cam-secondary"
                aria-pressed={muted}
                onClick={() => setMuted((m) => !m)}
              >
                {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}{" "}
                {muted ? copy.unmute : copy.mute}
              </button>
              <div className="cam-chord-controls">
                <button disabled={!musicOn} onClick={() => nextChord()}>
                  {copy.chord}
                  <strong>{chord >= 0 ? chordNames[chord] : "—"}</strong>
                </button>
                <button
                  disabled={!musicOn || chord < 0}
                  onClick={() => {
                    engine.current!.stopChord();
                    setChord(-1);
                    field.current!.clear();
                    field.current!.flash = 0;
                  }}
                  aria-label={copy.stopChord}
                >
                  <Square size={16} />
                </button>
              </div>
              <button
                className={`cam-secondary cam-record ${recording ? "is-recording" : ""}`}
                disabled={!musicOn}
                onClick={() =>
                  recording ? engine.current!.stopRecording() : startRecording()
                }
              >
                <Mic size={17} />
                {recording ? `${copy.finishRec} · ${recSeconds}/12s` : copy.rec}
              </button>
              <button className="cam-secondary" onClick={capture}>
                <Camera size={18} />
                {copy.snapshot}
              </button>
              {recordUrl && (
                <div className="cam-record-preview">
                  <label>{copy.audioReady}</label>
                  <audio
                    ref={playback}
                    controls
                    src={recordUrl}
                    aria-label={copy.audioReplay}
                  />
                  <a
                    href={recordUrl}
                    download={`CHENLE-UNIVERSE-little-song.${filename}`}
                  >
                    <Download size={16} />
                    {copy.audioSave}
                  </a>
                </div>
              )}
            </>
          )}
          {error && (
            <p className="cam-error" role="alert">
              {copy[error]}
            </p>
          )}
          {rewarded && (
            <div className="cam-earned-badge">
              <Check size={17} />
              <span>{copy.starBadge}</span>
            </div>
          )}
        </aside>
      </div>
      <details className="cam-help">
        <summary>
          {copy.testTitle}
          <ChevronDown size={16} />
        </summary>
        <p>{copy.testHelp}</p>
        <p>{copy.local}</p>
        <p>{copy.pendingStar}</p>
      </details>
      {resultUrl && (
        <PhotoResult
          url={resultUrl}
          lang={lang}
          onClose={() => setResultUrl("")}
        />
      )}
    </section>
  );
}
