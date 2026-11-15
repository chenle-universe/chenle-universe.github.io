export type CapsuleStep = "idle" | "mixing" | "drop" | "opening" | "reveal";
type Clock = {
  set: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
  clear: (id: ReturnType<typeof setTimeout>) => void;
};
export function chooseCapsule(
  previous: number,
  count: number,
  random = Math.random,
) {
  if (count < 1) throw Error("No capsules");
  const available = Array.from({ length: count }, (_, i) => i).filter(
    (i) => count === 1 || i !== previous,
  );
  return available[
    Math.min(available.length - 1, Math.floor(random() * available.length))
  ];
}
export class CapsuleRound {
  busy = false;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private generation = 0;
  private clock: Clock;
  constructor(
    clock: Clock = {
      set: (callback, delay) => setTimeout(callback, delay),
      clear: (id) => clearTimeout(id),
    },
  ) {
    this.clock = clock;
  }
  play(onStep: (step: CapsuleStep) => void, onComplete: () => void) {
    if (this.busy) return false;
    this.cancel();
    this.busy = true;
    const generation = this.generation;
    onStep("mixing");
    for (const [delay, step] of [
      [800, "drop"],
      [1550, "opening"],
      [2200, "reveal"],
    ] as const)
      this.timers.push(
        this.clock.set(() => {
          if (generation !== this.generation) return;
          onStep(step);
          if (step === "reveal") {
            this.busy = false;
            this.timers = [];
            onComplete();
          }
        }, delay),
      );
    return true;
  }
  cancel() {
    this.generation++;
    this.timers.forEach((id) => this.clock.clear(id));
    this.timers = [];
    this.busy = false;
  }
}
