import { test } from "node:test";
import assert from "node:assert/strict";
import { answerSession, createSession, likedIds, type Choice } from "../src/features/comparison/model";
import { aggregate } from "../src/features/preferences/aggregate";
import { interestStatus } from "../src/features/matching/model";
import { importLegacySettings, initialState, parseState } from "../src/lib/store";
import voices from "../src/data/voices.json";

test("a session contains five distinct pairs and preserves its exact assignment", () => {
  const session = createSession(voices.map(v => v.id), () => .25);
  assert.equal(session.pairs.length, 5);
  assert.equal(new Set(session.pairs.flatMap(p => [p.left, p.right])).size, 10);
  const state = { ...initialState, session };
  assert.deepEqual(parseState(JSON.stringify(state)), state);
  assert.notDeepEqual(createSession(voices.map(v => v.id)).id, session.id);
});
test("four choices count both sides correctly; stale/double events cannot advance", () => {
  let session = createSession(voices.map(v => v.id), () => .25);
  const choices: Choice[] = ["left", "right", "both", "neither"];
  choices.forEach((choice, i) => {
    session = answerSession(session, i, choice);
    assert.equal(answerSession(session, i, choice), session);
  });
  assert.equal(session.answers.length, 4);
  assert.equal(likedIds(session.answers).size, 4);
  const counts = aggregate(session.answers, voices);
  assert.equal(counts.reduce((sum, t) => sum + t.presented, 0), 16);
  assert.equal(counts.reduce((sum, t) => sum + t.selected, 0), 8);
  assert.ok(counts.every(t => t.selected <= t.presented));
  session = answerSession(session, 4, "both");
  assert.equal(answerSession(session, 5, "left"), session);
  assert.deepEqual(parseState(JSON.stringify({ ...initialState, session })).session, session);
});
test("corrupt storage is rejected, including fabricated voices and divergent answers", () => {
  assert.throws(() => parseState("broken json"));
  assert.throws(() => parseState(JSON.stringify({ version: 1 })));
  const session = createSession(voices.map(v => v.id));
  assert.throws(() => parseState(JSON.stringify({ ...initialState, session: { ...session, pairs: [{ left: "unknown", right: "asmr-risa" }] } })));
  const answered = answerSession(session, 0, "left");
  assert.throws(() => parseState(JSON.stringify({ ...initialState, session: { ...answered, answers: [{ ...answered.answers[0], pairIndex: 3 }] } })));
});
test("matching requires an explicit local interest and a reciprocal fixture", () => {
  assert.equal(interestStatus("asmr-risa", []), "none");
  assert.equal(interestStatus("asmr-risa", ["asmr-risa"]), "matched");
  assert.equal(interestStatus("asmr-yui", ["asmr-yui"]), "sent");
});
test("all available subsets maximize distinct-speaker pairs", () => {
  const speakers = new Map(voices.map(v => [v.id, v.speakerId]));
  for (let mask = 0; mask < 2 ** voices.length; mask++) {
    const available = voices.filter((_, index) => mask & (1 << index));
    const counts = available.map(v => available.filter(w => v.speakerId === w.speakerId).length);
    const maximum = Math.min(Math.floor(available.length / 2), available.length - Math.max(0, ...counts));
    const { pairs } = createSession(available.map(v => v.id));
    assert.equal(pairs.length, maximum);
    assert.equal(new Set(pairs.flatMap(p => [p.left, p.right])).size, maximum * 2);
    assert.ok(pairs.every(p => speakers.get(p.left) !== speakers.get(p.right)));
  }
});
test("old catalog choices stay separate from personal settings", () => {
  const profile = { ...initialState.profile, nickname: "テスト", visible: true };
  const migrated = importLegacySettings(JSON.stringify({ ...initialState, stereo: false, onboarded: true,
    interests: ["voice-01"], hidden: ["voice-02"], profile: { ...profile, photoRequests: ["voice-01"] } }));
  assert.deepEqual(migrated, { ...initialState, stereo: false, onboarded: true, profile });
});
test("catalog contains the ten named whisper auditions", () => {
  assert.deepEqual(voices.map(v => v.name), ["リサ", "ゆい", "あかり", "しおり", "さな", "すず", "ひな", "なぎ", "まき", "れい"]);
  assert.equal(new Set(voices.map(v => v.file)).size, 10);
  voices.forEach(v => {
    assert.ok(v.duration > 0);
    assert.ok(Math.abs(v.loudness + 25) < 1);
    assert.ok(v.peak < -1.8);
    assert.equal(v.waveform.length, 48);
    assert.ok(v.waveform.every(n => Number.isFinite(n) && n > 0 && n <= 1));
  });
});
