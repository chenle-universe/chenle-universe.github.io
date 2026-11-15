"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
type CameraStatus =
  | "off"
  | "starting"
  | "on"
  | "paused"
  | "denied"
  | "unavailable"
  | "busy"
  | "error";
type CameraValue = {
  video: RefObject<HTMLVideoElement>;
  status: CameraStatus;
  start: () => Promise<void>;
  stop: () => void;
};
const CameraContext = createContext<CameraValue | null>(null);
export function CameraProvider({ children }: { children: ReactNode }) {
  const video = useRef<HTMLVideoElement>(null),
    stream = useRef<MediaStream | null>(null),
    generation = useRef(0),
    pending = useRef(false),
    mounted = useRef(true),
    [status, setStatus] = useState<CameraStatus>("off");
  const release = useCallback(() => {
    generation.current++;
    pending.current = false;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    if (video.current) {
      video.current.pause();
      video.current.srcObject = null;
    }
  }, []);
  const stop = useCallback(() => {
    release();
    if (mounted.current) setStatus("off");
  }, [release]);
  const start = useCallback(async () => {
    release();
    const token = generation.current;
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unavailable");
      return;
    }
    setStatus("starting");
    pending.current = true;
    try {
      const next = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 960 },
          frameRate: { ideal: 24, max: 30 },
        },
      });
      if (!mounted.current || token !== generation.current) {
        next.getTracks().forEach((t) => t.stop());
        return;
      }
      pending.current = false;
      stream.current = next;
      const element = video.current;
      if (!element) {
        release();
        return;
      }
      element.srcObject = next;
      await element.play();
      if (token !== generation.current) return;
      next
        .getVideoTracks()
        .forEach((t) => t.addEventListener("ended", stop, { once: true }));
      setStatus("on");
    } catch (error) {
      if (!mounted.current || token !== generation.current) return;
      release();
      const name = (error as DOMException)?.name;
      setStatus(
        name === "NotAllowedError" || name === "SecurityError"
          ? "denied"
          : name === "NotFoundError"
            ? "unavailable"
            : name === "NotReadableError"
              ? "busy"
              : "error",
      );
    }
  }, [release, stop]);
  useEffect(() => {
    mounted.current = true;
    const hide = () => {
      if (document.hidden) {
        const active = !!stream.current || pending.current;
        release();
        if (active) setStatus("paused");
      }
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      mounted.current = false;
      document.removeEventListener("visibilitychange", hide);
      release();
    };
  }, [release]);
  return (
    <CameraContext.Provider value={{ video, status, start, stop }}>
      {children}
      <video
        ref={video}
        muted
        playsInline
        autoPlay
        className="cam-source-video"
        aria-hidden="true"
      />
    </CameraContext.Provider>
  );
}
export function useCamera() {
  const value = useContext(CameraContext);
  if (!value) throw Error("CameraProvider missing");
  return value;
}
