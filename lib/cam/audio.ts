const NOTES = [60, 62, 64, 67, 69, 72, 74, 76];
const CHORDS = [
  [48, 52, 55],
  [45, 48, 52],
  [41, 45, 48],
  [43, 47, 50],
];
export const chordNames = ["C Major", "A Minor", "F Major", "G Major"];
export class StudioAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private bus: DynamicsCompressorNode | null = null;
  private destination: MediaStreamAudioDestinationNode | null = null;
  private tones = new Set<OscillatorNode>();
  private pads: { osc: OscillatorNode; gain: GainNode }[] = [];
  private noteTimes = new Map<number, number>();
  private recentNotes: number[] = [];
  private chordIndex = -1;
  private recorder: MediaRecorder | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  active = false;
  volume = 0.4;
  muted = false;
  async start() {
    if (!this.context) {
      const Audio =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!Audio) throw Error("Audio unavailable");
      this.context = new Audio();
      this.master = this.context.createGain();
      this.bus = this.context.createDynamicsCompressor();
      this.bus.threshold.value = -18;
      this.bus.ratio.value = 8;
      this.bus.connect(this.master);
      this.master.connect(this.context.destination);
      this.destination = this.context.createMediaStreamDestination();
      this.master.connect(this.destination);
      this.master.gain.value = this.muted ? 0 : this.volume;
    }
    await this.context.resume();
    this.active = true;
  }
  setVolume(value: number, muted = this.muted) {
    this.volume = Math.max(0, Math.min(0.7, value));
    this.muted = muted;
    if (this.context && this.master)
      this.master.gain.setTargetAtTime(
        muted ? 0 : this.volume,
        this.context.currentTime,
        0.03,
      );
  }
  note(zone: number) {
    const ctx = this.context;
    if (!ctx || !this.active || ctx.state !== "running") return false;
    const now = ctx.currentTime;
    zone = Math.max(0, Math.min(7, zone));
    this.recentNotes = this.recentNotes.filter((t) => now - t < 1);
    if (
      now - (this.noteTimes.get(zone) ?? -Infinity) < 0.12 ||
      this.recentNotes.length >= 14
    )
      return false;
    this.noteTimes.set(zone, now);
    this.recentNotes.push(now);
    const midi = NOTES[Math.max(0, Math.min(7, zone))],
      frequency = 440 * 2 ** ((midi - 69) / 12),
      gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.065, now + 0.18);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.65);
    gain.connect(this.bus!);
    [1, 2, 4].forEach((harmonic, i) => {
      while (this.tones.size >= 36) {
        const old = this.tones.values().next().value as OscillatorNode;
        try {
          old.stop();
        } catch {}
        this.tones.delete(old);
      }
      const osc = ctx.createOscillator(),
        part = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = frequency * harmonic;
      part.gain.value = [1, 0.24, 0.055][i];
      osc.connect(part);
      part.connect(gain);
      this.tones.add(osc);
      osc.onended = () => {
        this.tones.delete(osc);
        osc.disconnect();
        part.disconnect();
      };
      osc.start(now);
      osc.stop(now + 1.7);
    });
    setTimeout(() => gain.disconnect(), 1900);
    return true;
  }
  nextChord() {
    if (!this.active || !this.context) return -1;
    this.stopChord();
    this.chordIndex = (this.chordIndex + 1) % CHORDS.length;
    const ctx = this.context,
      now = ctx.currentTime;
    for (const midi of CHORDS[this.chordIndex]) {
      const osc = ctx.createOscillator(),
        gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = 440 * 2 ** ((midi - 69) / 12);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.024, now + 0.6);
      osc.connect(gain);
      gain.connect(this.bus!);
      osc.start();
      this.pads.push({ osc, gain });
    }
    return this.chordIndex;
  }
  stopChord() {
    const ctx = this.context;
    if (!ctx) return;
    const now = ctx.currentTime;
    this.pads.forEach(({ osc, gain }) => {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setTargetAtTime(0.0001, now, 0.12);
      try {
        osc.stop(now + 0.7);
      } catch {}
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    });
    this.pads = [];
  }
  record(onDone: (blob: Blob) => void) {
    if (
      !this.active ||
      !this.destination ||
      typeof MediaRecorder === "undefined" ||
      this.recorder?.state === "recording"
    )
      throw Error("Recording unavailable");
    const types = [
        "audio/webm;codecs=opus",
        "audio/mp4",
        "audio/ogg;codecs=opus",
        "audio/webm",
      ],
      mime = types.find((t) => MediaRecorder.isTypeSupported(t));
    const recorder = new MediaRecorder(
        this.destination.stream,
        mime ? { mimeType: mime } : undefined,
      ),
      chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    recorder.onstop = () => {
      if (this.timer) clearTimeout(this.timer);
      this.timer = null;
      this.recorder = null;
      onDone(
        new Blob(chunks, { type: recorder.mimeType || mime || "audio/webm" }),
      );
    };
    recorder.start(250);
    this.recorder = recorder;
    this.timer = setTimeout(() => this.stopRecording(), 12000);
    return recorder.mimeType || mime || "audio/webm";
  }
  stopRecording() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    if (this.recorder?.state === "recording") this.recorder.stop();
  }
  async pause() {
    this.active = false;
    this.noteTimes.clear();
    this.recentNotes = [];
    this.stopRecording();
    this.stopChord();
    this.tones.forEach((osc) => {
      try {
        osc.stop();
      } catch {}
    });
    this.tones.clear();
    if (this.context?.state === "running") {
      try {
        await this.context.suspend();
      } catch {}
    }
  }
  async close() {
    await this.pause();
    try {
      await this.context?.close();
    } catch {}
    this.context = null;
    this.destination?.stream.getTracks().forEach((t) => t.stop());
    this.destination = null;
    this.master = null;
    this.bus = null;
  }
}
