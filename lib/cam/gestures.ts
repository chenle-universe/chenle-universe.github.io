export type Point = { x: number; y: number; z?: number };
export type TrackedHand = {
  id: string;
  points: Point[];
  confidence: number;
  seen: number;
};
export type GestureEvent = {
  type: "dust" | "pinch" | "friends" | "clap" | "swipe" | "chord" | "stop";
  x: number;
  y: number;
  hand?: string;
  zone?: number;
};
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const center = (p: Point[]) => ({
  x: (p[0].x + p[9].x) / 2,
  y: (p[0].y + p[9].y) / 2,
});
export function handShape(p: Point[]) {
  if (p.length < 21) return { pinch: 1, open: false, fist: false };
  const span = Math.max(0.035, distance(p[5], p[17])),
    extended = [8, 12, 16, 20].filter(
      (tip, i) =>
        distance(p[tip], p[0]) > distance(p[[6, 10, 14, 18][i]], p[0]) * 1.18,
    ).length;
  return {
    pinch: distance(p[4], p[8]) / span,
    open: extended === 4,
    fist:
      extended === 0 &&
      [8, 12, 16, 20].every((t) => distance(p[t], p[0]) < span * 1.65),
  };
}
export function smoothHands(
  previous: TrackedHand[],
  next: TrackedHand[],
  now: number,
): TrackedHand[] {
  const current = next
    .filter((h) => h.confidence >= 0.55 && h.points.length === 21)
    .map((h) => {
      const old = previous.find((p) => p.id === h.id && now - p.seen < 200);
      return {
        ...h,
        seen: now,
        points: h.points.map((p, i) =>
          old
            ? {
                x: old.points[i].x + (p.x - old.points[i].x) * 0.48,
                y: old.points[i].y + (p.y - old.points[i].y) * 0.48,
                z: p.z,
              }
            : p,
        ),
      };
    });
  return [
    ...current,
    ...previous.filter(
      (p) => !current.some((h) => h.id === p.id) && now - p.seen < 220,
    ),
  ];
}
export class GestureEngine {
  private states = new Map<
    string,
    {
      pinched: boolean;
      pinchFrames: number;
      lastPinch: number;
      zone: number;
      lastNote: number;
      fistSince: number;
      fistDone: boolean;
      center: Point;
    }
  >();
  private friendsFrames = 0;
  private lastFriends = -Infinity;
  private lastClap = -Infinity;
  private lastDistance: number | null = null;
  private lastTime = 0;
  private openSince = -1;
  private chordLatched = false;
  reset() {
    this.states.clear();
    this.friendsFrames = 0;
    this.lastFriends = -Infinity;
    this.lastClap = -Infinity;
    this.lastDistance = null;
    this.lastTime = 0;
    this.openSince = -1;
    this.chordLatched = false;
  }
  update(hands: TrackedHand[], now: number): GestureEvent[] {
    const events: GestureEvent[] = [],
      valid = hands.filter(
        (h) => h.confidence >= 0.55 && h.points.length === 21,
      ),
      active = new Set(valid.map((h) => h.id));
    for (const id of this.states.keys())
      if (!active.has(id)) this.states.delete(id);
    for (const hand of valid) {
      const p = hand.points,
        shape = handShape(p),
        c = center(p),
        s = this.states.get(hand.id) ?? {
          pinched: false,
          pinchFrames: 0,
          lastPinch: -Infinity,
          zone: -1,
          lastNote: -Infinity,
          fistSince: -1,
          fistDone: false,
          center: c,
        };
      if (shape.pinch < 0.32) s.pinchFrames++;
      else if (shape.pinch > 0.48) {
        s.pinched = false;
        s.pinchFrames = 0;
      }
      const at = {
        x: (p[4].x + p[8].x) / 2,
        y: (p[4].y + p[8].y) / 2,
        hand: hand.id,
      };
      if (s.pinchFrames >= 2) {
        events.push({ type: "dust", ...at });
        if (!s.pinched && now - s.lastPinch > 260) {
          events.push({ type: "pinch", ...at });
          s.lastPinch = now;
          s.pinched = true;
        }
      }
      const zone = Math.max(0, Math.min(7, Math.floor(c.x * 8)));
      if (shape.open) {
        if (s.zone < 0) s.zone = zone;
        else if (
          zone !== s.zone &&
          (zone > s.zone
            ? c.x > (s.zone + 1) / 8 + 0.015
            : c.x < s.zone / 8 - 0.015) &&
          now - s.lastNote > 120
        ) {
          events.push({ type: "swipe", x: c.x, y: c.y, zone, hand: hand.id });
          s.lastNote = now;
          s.zone = zone;
        }
      } else s.zone = -1;
      if (shape.fist) {
        if (s.fistSince < 0) s.fistSince = now;
        if (now - s.fistSince >= 1000 && !s.fistDone) {
          events.push({ type: "stop", x: c.x, y: c.y });
          s.fistDone = true;
        }
      } else {
        s.fistSince = -1;
        s.fistDone = false;
      }
      s.center = c;
      this.states.set(hand.id, s);
    }
    if (valid.length === 2) {
      const [a, b] = valid,
        pa = center(a.points),
        pb = center(b.points),
        d = distance(pa, pb),
        dt = (now - this.lastTime) / 1000,
        closing =
          this.lastDistance !== null && dt > 0 && dt < 0.3
            ? (this.lastDistance - d) / dt
            : 0;
      // Clap requires rapid movement AND palm proximity; slow hand contact cannot clear the scene.
      if (d < 0.17 && closing > 0.75 && now - this.lastClap > 1200) {
        events.push({
          type: "clap",
          x: (pa.x + pb.x) / 2,
          y: (pa.y + pb.y) / 2,
        });
        this.lastClap = now;
        this.friendsFrames = 0;
      }
      const tips = distance(a.points[8], b.points[8]);
      if (tips < 0.065 && now - this.lastClap > 500) this.friendsFrames++;
      else this.friendsFrames = 0;
      if (this.friendsFrames >= 3 && now - this.lastFriends > 2200) {
        events.push({
          type: "friends",
          x: (a.points[8].x + b.points[8].x) / 2,
          y: (a.points[8].y + b.points[8].y) / 2,
        });
        this.lastFriends = now;
        this.friendsFrames = 0;
      }
      if (valid.every((h) => handShape(h.points).open)) {
        if (this.openSince < 0) this.openSince = now;
        if (now - this.openSince >= 500 && !this.chordLatched) {
          events.push({
            type: "chord",
            x: (pa.x + pb.x) / 2,
            y: (pa.y + pb.y) / 2,
          });
          this.chordLatched = true;
        }
      } else {
        this.openSince = -1;
        this.chordLatched = false;
      }
      this.lastDistance = d;
    } else {
      this.friendsFrames = 0;
      this.lastDistance = null;
      this.openSince = -1;
      this.chordLatched = false;
    }
    this.lastTime = now;
    return events;
  }
}
