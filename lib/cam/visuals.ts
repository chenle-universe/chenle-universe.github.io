import { frameForMode, fingerStickerSize, type CamFrame, type CamMode } from "../../data/camStudio.ts";
import type { Point, TrackedHand } from "./gestures";
export type Rect = { x: number; y: number; w: number; h: number };
export function containRect(width: number, height: number, area: Rect): Rect {
  const scale = Math.min(
    area.w / Math.max(1, width),
    area.h / Math.max(1, height),
  );
  return {
    x: area.x + (area.w - width * scale) / 2,
    y: area.y + (area.h - height * scale) / 2,
    w: width * scale,
    h: height * scale,
  };
}
export function coverRect(width: number, height: number, area: Rect): Rect {
  const scale = Math.max(area.w / Math.max(1, width), area.h / Math.max(1, height));
  return {
    x: area.x + (area.w - width * scale) / 2,
    y: area.y + (area.h - height * scale) / 2,
    w: width * scale,
    h: height * scale,
  };
}
// Tracking already mirrors x; project that full-camera geometry through the same crop.
export function projectHands(hands: TrackedHand[], source: Rect, viewport: Rect): TrackedHand[] {
  return hands.map(hand => ({
    ...hand,
    points: hand.points.map(point => ({
      ...point,
      x: (source.x + point.x * source.w - viewport.x) / viewport.w,
      y: (source.y + point.y * source.h - viewport.y) / viewport.h,
    })),
  }));
}
export function mirrorPoint(point: Point, rect: Rect) {
  return { x: rect.x + point.x * rect.w, y: rect.y + point.y * rect.h };
}
export function roundBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
export function paintBase(
  ctx: CanvasRenderingContext2D,
  {
    mode,
    frame,
    source,
    mirror,
    beauty,
    stickers,
    frames = {},
  }: {
    mode: CamMode;
    frame: CamFrame;
    source: CanvasImageSource | null;
    mirror: boolean;
    beauty: boolean;
    stickers: HTMLImageElement[];
    frames?: Partial<Record<CamFrame, HTMLImageElement>>;
  },
) {
  const w = ctx.canvas.width,
    h = ctx.canvas.height;
  ctx.save();
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, "#DDF4FF");
  bg.addColorStop(0.55, "#FFFDF8");
  bg.addColorStop(1, "#D8CBFF");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  // Fill behind the whole artwork, including irregular transparent frame openings.
  const area = { x: 0, y: 0, w, h };
  let rect = area;
  if (source) {
    const image = source as HTMLVideoElement & HTMLImageElement;
    const sw = image.videoWidth || image.naturalWidth || image.width,
      sh = image.videoHeight || image.naturalHeight || image.height;
    rect = coverRect(sw, sh, area);
    ctx.save();
    ctx.fillStyle = "#e5edf7";
    ctx.fillRect(area.x, area.y, area.w, area.h);
    if (beauty) ctx.filter = "brightness(1.045) saturate(1.08) contrast(1.02)";
    if (mirror) {
      ctx.translate(rect.x + rect.w, rect.y);
      ctx.scale(-1, 1);
      ctx.drawImage(source, 0, 0, rect.w, rect.h);
    } else ctx.drawImage(source, rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
  }
  ctx.restore();
  return rect;
}
// Paint after gestures/effects so the same fixed frame stays on top in preview and export.
export function paintFrame(
  ctx: CanvasRenderingContext2D,
  mode: CamMode,
  photoFrame: CamFrame,
  frames: Partial<Record<CamFrame, HTMLImageElement>>,
) {
  const art = frames[frameForMode(mode, photoFrame)];
  if (art?.complete && art.naturalWidth)
    ctx.drawImage(art, 0, 0, ctx.canvas.width, ctx.canvas.height);
}
type Dust = {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  tone: number;
  shape: number;
  phase: number;
  gold: boolean;
};
type Friend = {
  start: Point;
  end: Point;
  control: Point;
  age: number;
  life: number;
  id: number;
  size: number;
  phase: number;
  note: boolean;
  shimmer: number;
};
export class MagicField {
  private dust: Dust[] = Array.from({ length: 850 }, () => ({
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 0,
    max: 0,
    size: 0,
    tone: 0,
    shape: 0,
    phase: 0,
    gold: true,
  }));
  private trail: { x: number; y: number; life: number }[] = [];
  private ringAt = { x: 0.5, y: 0.5 };
  private cursor = 0;
  private dustSprites = new Map<string, HTMLCanvasElement>();
  private friends: Friend[] = [];
  flash = 0;
  ring = 0;
  burst(x: number, y: number, count = 22, gold = true) {
    for (let i = 0; i < count; i++) {
      const p = this.dust[this.cursor++ % this.dust.length];
      const choice = Math.random(),
        shape = gold
          ? choice < 0.65
            ? 0
            : choice < 0.82
              ? 1
              : choice < 0.96
                ? 2
                : 3
          : 0;
      Object.assign(p, {
        active: true,
        x,
        y,
        vx: (Math.random() - 0.5) * 0.23,
        vy: -0.03 - Math.random() * 0.15,
        life: 1 + Math.random() * 1.6,
        size: gold
          ? shape
            ? 6 + Math.random() * 5
            : 1.1 + Math.random() * 2.1
          : 0.65 + Math.random() * 1.9,
        shape,
        phase: Math.random() * Math.PI * 2,
        gold,
        tone: Math.floor(Math.random() * 4),
      });
      p.max = p.life;
    }
  }
  // Cache the small faceted star sprites once, rather than drawing blurred paths for every particle on every frame.
  private dustSprite(shape: number, tone: number) {
    const key = `${shape}-${tone}`,
      cached = this.dustSprites.get(key);
    if (cached) return cached;
    const image = document.createElement("canvas");
    image.width = 64;
    image.height = 64;
    const c = image.getContext("2d")!;
    c.translate(32, 32);
    const points = shape === 1 ? 5 : shape === 2 ? 4 : 4,
      outer = 19,
      inner = shape === 1 ? 8 : shape === 2 ? 4.5 : 11;
    c.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points - Math.PI / 2,
        r = i % 2 ? inner : outer;
      c.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    c.closePath();
    const fill = c.createLinearGradient(-14, -18, 12, 21);
    fill.addColorStop(0, "#FFF4A5");
    fill.addColorStop(0.4, ["#FFD84B", "#FFC82F", "#FFE16B", "#FFD052"][tone]);
    fill.addColorStop(1, "#EEA619");
    c.fillStyle = fill;
    c.shadowColor = "#FFCC3299";
    c.shadowBlur = 7;
    c.fill();
    c.shadowBlur = 0;
    c.strokeStyle = "#BE810C";
    c.lineWidth = 1.2;
    c.stroke();
    c.save();
    c.clip();
    c.beginPath();
    c.moveTo(0, -19);
    c.lineTo(0, 1);
    c.lineTo(18, -4);
    c.closePath();
    c.fillStyle = "#FFF7B9";
    c.globalAlpha = 0.7;
    c.fill();
    c.restore();
    this.dustSprites.set(key, image);
    return image;
  }
  summon(x: number, y: number) {
    for (let i = 0; i < 3 && this.friends.length < 9; i++)
      this.friends.push({
        start: { x, y },
        end: { x: 0.08 + Math.random() * 0.84, y: 0.1 + Math.random() * 0.65 },
        control: {
          x: x + (Math.random() - 0.5) * 0.8,
          y: y - 0.25 - Math.random() * 0.35,
        },
        age: 0,
        life: 4 + Math.random() * 2,
        id: [0, 1, 3, 4, 8][Math.floor(Math.random() * 5)],
        size: 60 + Math.random() * 18,
        phase: Math.random() * 6.28,
        note: false,
        shimmer: Math.random(),
      });
  }
  note(x: number, y: number) {
    if (this.friends.length >= 16) this.friends.shift();
    this.friends.push({
      start: { x, y },
      end: { x: x + (Math.random() - 0.5) * 0.14, y: y - 0.3 },
      control: { x: x + 0.1, y: y - 0.1 },
      age: 0,
      life: 1.9,
      id: 6,
      size: 34,
      phase: Math.random() * 6,
      note: true,
      shimmer: Math.random(),
    });
    this.burst(x, y, 6, false);
  }
  clear(soft = true) {
    if (!soft) {
      this.dust.forEach((p) => (p.active = false));
      this.friends = [];
      this.flash = 0;
      this.ring = 0;
      this.trail = [];
      return;
    }
    this.dust.forEach((p) => {
      p.life = Math.min(p.life, 0.3);
    });
    this.friends.forEach((p) => (p.life = p.age + 0.25));
    this.flash = 0.35;
    this.ring = 0;
    this.trail.forEach((p) => (p.life = Math.min(p.life, 0.2)));
  }
  trace(x: number, y: number) {
    this.trail.push({ x, y, life: 0.8 });
    if (this.trail.length > 14) this.trail.shift();
  }
  wave(x = 0.5, y = 0.5) {
    this.ring = 1;
    this.ringAt = { x, y };
  }
  draw(
    ctx: CanvasRenderingContext2D,
    rect: Rect,
    dt: number,
    stickers: HTMLImageElement[],
    hands: TrackedHand[],
    fingerTips: boolean,
    now: number,
  ) {
    const scale = ctx.canvas.width / 960;
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    for (const p of this.dust) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.vx *= Math.max(0, 1 - dt * 0.7);
      p.vy += dt * 0.14;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const at = mirrorPoint(p, rect);
      const shimmer =
        0.52 +
        0.48 *
          (0.5 + 0.5 * Math.sin(now * (0.004 + p.tone * 0.0006) + p.phase));
      ctx.globalAlpha = Math.min(1, p.life / 0.45) * shimmer;
      const size = p.size * scale;
      if (p.gold && p.shape) {
        ctx.save();
        ctx.translate(at.x, at.y);
        ctx.rotate(p.phase + (p.max - p.life) * (p.tone % 2 ? -0.45 : 0.45));
        const span = size * 3.3;
        ctx.drawImage(
          this.dustSprite(p.shape, p.tone),
          -span / 2,
          -span / 2,
          span,
          span,
        );
        ctx.restore();
      } else {
        ctx.fillStyle = p.gold
          ? ["#FFC72C", "#FFD95A", "#F4AF13", "#FFE485"][p.tone]
          : ["#fffdf8", "#ddf4ff", "#f6d7e7", "#e1d8ff"][p.tone];
        if (p.gold) {
          ctx.fillRect(at.x - size * 0.5, at.y - size * 0.5, size, size);
          if (p.tone === 0) {
            ctx.fillStyle = "#FFF1A0";
            ctx.fillRect(
              at.x - size * 0.2,
              at.y - size * 0.2,
              size * 0.4,
              size * 0.4,
            );
          }
        } else ctx.fillRect(at.x, at.y, size, size);
      }
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    this.friends = this.friends.filter((p) => p.age < p.life);
    for (const p of this.friends) {
      p.age += dt;
      const t = Math.min(1, p.age / p.life),
        ease = (1 - Math.cos(t * Math.PI)) / 2,
        x =
          (1 - ease) ** 2 * p.start.x +
          2 * (1 - ease) * ease * p.control.x +
          ease ** 2 * p.end.x +
          Math.sin(t * 8 + p.phase) * 0.025,
        y =
          (1 - ease) ** 2 * p.start.y +
          2 * (1 - ease) * ease * p.control.y +
          ease ** 2 * p.end.y;
      const at = mirrorPoint({ x, y }, rect),
        size = p.size * scale,
        image = stickers[p.id];
      if (image?.complete && image.naturalWidth) {
        ctx.save();
        ctx.globalAlpha = Math.max(
          0,
          Math.min(1, p.age * 5, (p.life - p.age) * 3),
        );
        ctx.translate(at.x, at.y);
        ctx.rotate(Math.sin(t * 9 + p.phase) * 0.12);
        ctx.filter = `hue-rotate(${(p.shimmer - 0.5) * 24}deg)`;
        ctx.shadowColor = p.shimmer > 0.5 ? "#ddf4ff" : "#f6d7e9";
        ctx.shadowBlur = (3 + p.shimmer * 3) * scale;
        ctx.drawImage(image, -size / 2, -size / 2, size, size);
        ctx.restore();
      }
    }
    if (fingerTips)
      for (const hand of hands) {
        const alpha = Math.max(0, Math.min(1, (260 - (now - hand.seen)) / 160));
        if (!alpha) continue;
        [4, 8, 12, 16, 20].forEach((tip, i) => {
          const at = mirrorPoint(hand.points[tip], rect),
            index = i + (hand.id === "Left" ? 0 : 5),
            image = stickers[index];
          if (image?.complete && image.naturalWidth) {
            const size = fingerStickerSize * scale;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.shadowColor = "#fffdf8";
            ctx.shadowBlur = 5 * scale;
            ctx.drawImage(
              image,
              at.x - size / 2,
              at.y - size * 0.9 + Math.sin(now / 500 + i) * 2 * scale,
              size,
              size,
            );
            ctx.restore();
          }
        });
      }
    this.trail = this.trail.filter((p) => (p.life -= dt) > 0);
    if (this.trail.length > 1) {
      ctx.save();
      const wave = ctx.createLinearGradient(rect.x, 0, rect.x + rect.w, 0);
      wave.addColorStop(0, "#F6B8D8");
      wave.addColorStop(0.5, "#D8CBFF");
      wave.addColorStop(1, "#DDF4FF");
      ctx.strokeStyle = wave;
      ctx.lineWidth = 4 * scale;
      ctx.lineCap = "round";
      ctx.globalAlpha = this.trail[this.trail.length - 1].life;
      ctx.shadowColor = "#fff";
      ctx.shadowBlur = 9 * scale;
      ctx.beginPath();
      this.trail.forEach((p, i) => {
        const at = mirrorPoint(p, rect);
        if (i) ctx.lineTo(at.x, at.y + Math.sin(i * 1.4) * 6 * scale);
        else ctx.moveTo(at.x, at.y);
      });
      ctx.stroke();
      ctx.restore();
    }
    if (this.ring > 0) {
      this.ring = Math.max(0, this.ring - dt * 0.55);
      ctx.strokeStyle = `rgba(246,184,216,${this.ring * 0.6})`;
      ctx.lineWidth = 5 * scale;
      ctx.beginPath();
      ctx.ellipse(
        rect.x + rect.w * this.ringAt.x,
        rect.y + rect.h * this.ringAt.y,
        rect.w * (0.2 + (1 - this.ring) * 0.2),
        rect.h * 0.16,
        0,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
    }
    if (this.flash > 0) {
      this.flash = Math.max(0, this.flash - dt);
      ctx.globalAlpha = this.flash * 0.7;
      ctx.fillStyle = "#fffdf8";
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    ctx.restore();
  }
}
