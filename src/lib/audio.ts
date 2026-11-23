export function comparisonPan(side: "left" | "right", stereo: boolean) {
  if (!stereo) return 0;
  return side === "left" ? -1 : 1;
}

export class VoicePlayer {
  private context: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private panner: StereoPannerNode | null = null;
  private cache = new Map<string, AudioBuffer>();
  private generation = 0;
  started = 0;
  duration = 0;
  private getContext() { this.context ??= new AudioContext(); return this.context; }
  stop() {
    this.generation++;
    if (this.source) { this.source.onended = null; this.source.stop(); this.source.disconnect(); this.source = null; }
    this.panner?.disconnect(); this.panner = null;
  }
  async play(url: string, pan: number, onEnd: () => void) {
    this.stop();
    const token = this.generation;
    const context = this.getContext();
    // Resume directly from the user's gesture, before fetching.
    await context.resume();
    let buffer = this.cache.get(url);
    if (!buffer) {
      const response = await fetch(url);
      if (!response.ok) throw new Error("音声を読み込めませんでした");
      buffer = await context.decodeAudioData(await response.arrayBuffer());
      this.cache.set(url, buffer);
    }
    if (token !== this.generation) return false;
    const source = context.createBufferSource(); source.buffer = buffer;
    const panner = context.createStereoPanner(); panner.pan.value = pan;
    source.connect(panner).connect(context.destination);
    source.onended = () => { if (token === this.generation) { this.stop(); onEnd(); } };
    this.source = source; this.panner = panner; this.started = context.currentTime; this.duration = buffer.duration;
    source.start(); return true;
  }
  progress() { return this.context && this.source ? Math.min(1, (this.context.currentTime - this.started) / this.duration) : 0; }
  setPan(pan: number) { if (this.panner) this.panner.pan.value = pan; }
  dispose() { this.stop(); void this.context?.close(); this.context = null; }
}
