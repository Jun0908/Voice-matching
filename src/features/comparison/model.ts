export type Choice = "left" | "right" | "both" | "neither";
export type Pair = { left: string; right: string };
export type Answer = Pair & { sessionId: string; pairIndex: number; choice: Choice; at: string };
export type Session = { id: string; pairs: Pair[]; answers: Answer[] };
export type Voice = { id: string; name: string; file: string; duration: number; tags: string[]; waveform: number[]; speakerId: string; sourceClip: string; source: string; license: string; loudness: number; peak: number };

export function createSession(ids: string[], random = Math.random): Session {
  const shuffled = [...new Set(ids)];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const pairs: Pair[] = [];
  for (let i = 0; i + 1 < shuffled.length && pairs.length < 5; i += 2) pairs.push({ left: shuffled[i], right: shuffled[i + 1] });
  return { id: crypto.randomUUID(), pairs, answers: [] };
}

// The expected index makes a repeated tap or stale event idempotent.
export function answerSession(session: Session, index: number, choice: Choice): Session {
  if (index !== session.answers.length || !session.pairs[index]) return session;
  return { ...session, answers: [...session.answers, { ...session.pairs[index], sessionId: session.id, pairIndex: index, choice, at: new Date().toISOString() }] };
}

export function likedIds(answers: Answer[]): Set<string> {
  return new Set(answers.flatMap(a => a.choice === "both" ? [a.left, a.right] : a.choice === "neither" ? [] : [a[a.choice]]));
}
