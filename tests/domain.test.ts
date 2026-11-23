import { test } from "node:test";
import assert from "node:assert/strict";
import { answerSession, createSession, likedIds, type Choice } from "../src/features/comparison/model";
import { aggregate } from "../src/features/preferences/aggregate";
import { interestStatus } from "../src/features/matching/model";
import { initialState, parseState } from "../src/lib/store";
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
  assert.throws(() => parseState(JSON.stringify({ ...initialState, session: { ...session, pairs: [{ left: "unknown", right: "voice-01" }] } })));
  const answered = answerSession(session, 0, "left");
  assert.throws(() => parseState(JSON.stringify({ ...initialState, session: { ...answered, answers: [{ ...answered.answers[0], pairIndex: 3 }] } })));
});
test("matching requires an explicit local interest and a reciprocal fixture", () => {
  assert.equal(interestStatus("voice-01", []), "none");
  assert.equal(interestStatus("voice-01", ["voice-01"]), "matched");
  assert.equal(interestStatus("voice-02", ["voice-02"]), "sent");
});
test("audio catalog has ten unique speakers, finite waveform and normalized levels", () => {
  assert.equal(voices.length, 10);
  assert.equal(new Set(voices.map(v => v.speakerId)).size, 10);
  voices.forEach(v => {
    assert.ok(v.duration > 0);
    assert.ok(Math.abs(v.loudness + 20) < 1);
    assert.ok(v.peak < -1.8);
    assert.equal(v.waveform.length, 48);
    assert.ok(v.waveform.every(n => Number.isFinite(n) && n > 0 && n <= 1));
  });
});
