import { test } from "node:test";
import assert from "node:assert/strict";
import { VoicePlayer } from "../src/lib/audio";

test("audio switches stop the previous source, pan can be centered, and disposal releases audio", async () => {
  let active = 0;
  let peakActive = 0;
  let closed = false;
  const panners: { pan: { value: number }; connect: () => unknown; disconnect: () => void }[] = [];
  const sources: { stop: () => void; onended: (() => void) | null }[] = [];
  class FakeContext {
    currentTime = 0;
    destination = {};
    async resume() {}
    async close() { closed = true; }
    async decodeAudioData() { return { duration: 5 }; }
    createStereoPanner() {
      const panner = { pan: { value: 0 }, connect: () => this.destination, disconnect() {} };
      panners.push(panner); return panner;
    }
    createBufferSource() {
      const source = {
        buffer: null,
        onended: null as (() => void) | null,
        start() { active++; peakActive = Math.max(peakActive, active); },
        stop() { active--; },
        connect: (node: unknown) => node,
        disconnect() {},
      };
      sources.push(source); return source;
    }
  }
  const oldContext = Object.getOwnPropertyDescriptor(globalThis, "AudioContext");
  const oldFetch = globalThis.fetch;
  Object.defineProperty(globalThis, "AudioContext", { value: FakeContext, configurable: true });
  globalThis.fetch = async () => new Response(new ArrayBuffer(4));
  try {
    const player = new VoicePlayer();
    await player.play("/left.wav", -.65, () => {});
    assert.equal(active, 1);
    assert.equal(panners.at(-1)?.pan.value, -.65);
    await player.play("/right.wav", .65, () => {});
    assert.equal(active, 1);
    assert.equal(peakActive, 1);
    assert.equal(panners.at(-1)?.pan.value, .65);
    player.setPan(0);
    assert.equal(panners.at(-1)?.pan.value, 0);
    let ended = false;
    await player.play("/end.wav", 0, () => { ended = true; });
    sources.at(-1)?.onended?.();
    assert.equal(ended, true);
    assert.equal(active, 0);
    player.dispose();
    assert.equal(closed, true);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldContext) Object.defineProperty(globalThis, "AudioContext", oldContext);
    else Reflect.deleteProperty(globalThis, "AudioContext");
  }
});

test("a stopped pending audio download cannot begin playing after a later choice", async () => {
  let active = 0;
  let releaseDownload!: (response: Response) => void;
  class FakeContext {
    currentTime = 0;
    destination = {};
    async resume() {}
    async close() {}
    async decodeAudioData() { return { duration: 5 }; }
    createStereoPanner() { return { pan: { value: 0 }, connect() {}, disconnect() {} }; }
    createBufferSource() { return { buffer: null, onended: null, connect: (node: unknown) => node, start() { active++; }, stop() { active--; }, disconnect() {} }; }
  }
  const oldContext = Object.getOwnPropertyDescriptor(globalThis, "AudioContext");
  const oldFetch = globalThis.fetch;
  Object.defineProperty(globalThis, "AudioContext", { value: FakeContext, configurable: true });
  globalThis.fetch = () => new Promise(resolve => { releaseDownload = resolve; });
  try {
    const player = new VoicePlayer();
    const pending = player.play("/slow.wav", -.65, () => {});
    await Promise.resolve();
    player.stop();
    releaseDownload(new Response(new ArrayBuffer(4)));
    assert.equal(await pending, false);
    assert.equal(active, 0);
    player.dispose();
  } finally {
    globalThis.fetch = oldFetch;
    if (oldContext) Object.defineProperty(globalThis, "AudioContext", oldContext);
    else Reflect.deleteProperty(globalThis, "AudioContext");
  }
});
