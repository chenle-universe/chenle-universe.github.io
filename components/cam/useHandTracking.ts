"use client";
import { useEffect, useRef, useState } from "react";
import type { HandLandmarker } from "@mediapipe/tasks-vision";
import { smoothHands, type TrackedHand } from "../../lib/cam/gestures";
import { useCamera } from "./CameraProvider";
export function useHandTracking(enabled: boolean) {
  const camera = useCamera(),
    task = useRef<HandLandmarker | null>(null),
    hands = useRef<TrackedHand[]>([]),
    sample = useRef(0),
    [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
      "idle",
    ),
    [count, setCount] = useState(0),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false,
      timer: ReturnType<typeof setTimeout>,
      lastTime = -1;
    hands.current = [];
    setCount(0);
    if (!enabled || camera.status !== "on") {
      setStatus("idle");
      return;
    }
    setStatus("loading");
    const run = async () => {
      try {
        if (!task.current) {
          const { FilesetResolver, HandLandmarker } =
              await import("@mediapipe/tasks-vision"),
            files = await FilesetResolver.forVisionTasks("/assets/vision/wasm");
          let next: HandLandmarker;
          try {
            next = await HandLandmarker.createFromOptions(files, {
              baseOptions: {
                modelAssetPath: "/assets/vision/hand_landmarker.task",
                delegate: "GPU",
              },
              runningMode: "VIDEO",
              numHands: 2,
              minHandDetectionConfidence: 0.6,
              minHandPresenceConfidence: 0.6,
              minTrackingConfidence: 0.6,
            });
          } catch {
            next = await HandLandmarker.createFromOptions(files, {
              baseOptions: {
                modelAssetPath: "/assets/vision/hand_landmarker.task",
                delegate: "CPU",
              },
              runningMode: "VIDEO",
              numHands: 2,
              minHandDetectionConfidence: 0.6,
              minHandPresenceConfidence: 0.6,
              minTrackingConfidence: 0.6,
            });
          }
          if (cancelled) {
            next.close();
            return;
          }
          task.current = next;
        }
        if (cancelled) return;
        setStatus("ready");
        const detect = () => {
          if (cancelled) return;
          const video = camera.video.current;
          if (
            video &&
            video.readyState >= 2 &&
            video.currentTime !== lastTime &&
            !document.hidden
          ) {
            try {
              lastTime = video.currentTime;
              const now = performance.now(),
                result = task.current!.detectForVideo(video, now);
              const next: TrackedHand[] = result.landmarks.map((points, i) => ({
                id: result.handedness[i]?.[0]?.categoryName ?? String(i),
                confidence: result.handedness[i]?.[0]?.score ?? 0,
                seen: now,
                points: points.map((p) => ({ x: 1 - p.x, y: p.y, z: p.z })),
              }));
              hands.current = smoothHands(hands.current, next, now);
              sample.current = now;
              setCount(next.filter((h) => h.confidence >= 0.55).length);
            } catch {
              hands.current = [];
              setCount(0);
              setStatus("error");
              return;
            }
          }
          timer = setTimeout(detect, 80);
        };
        detect();
      } catch {
        if (!cancelled) setStatus("error");
      }
    };
    run();
    return () => {
      cancelled = true;
      clearTimeout(timer);
      hands.current = [];
    };
  }, [enabled, camera.status, attempt, camera.video]);
  useEffect(
    () => () => {
      task.current?.close();
      task.current = null;
    },
    [],
  );
  return {
    hands,
    sample,
    status,
    count,
    retry: () => {
      task.current?.close();
      task.current = null;
      setAttempt((n) => n + 1);
    },
  };
}
