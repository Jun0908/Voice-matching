import catalog from "../../data/voices.json";

const speakers = new Map(catalog.map(voice => [voice.id, voice.speakerId]));
const speakerOf = (id: string) => speakers.get(id) ?? id;
export const speakerCount = (ids: string[]) => new Set(ids.map(speakerOf)).size;

export type Choice = "left" | "right" | "both" | "neither";
export type Pair = { left: string; right: string };
export type Answer = Pair & { sessionId: string; pairIndex: number; choice: Choice; at: string };
export type Session = { id: string; pairs: Pair[]; answers: Answer[] };
export type Voice = { id: string; name: string; file: string; duration: number; tags: string[]; waveform: number[]; speakerId: string; sourceClip: string; source: string; license: string; loudness: number; peak: number };

function shuffle<T>(items: T[], random: () => number) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

export function createSession(ids: string[], random = Math.random): Session {
  const groups = new Map<string, string[]>();
  for (const id of shuffle([...new Set(ids)], random)) {
    const speaker = speakerOf(id);
    if (!groups.has(speaker)) groups.set(speaker, []);
    groups.get(speaker)!.push(id);
  }
  const pairs: Pair[] = [];
  while (pairs.length < 5) {
    const available = shuffle([...groups.values()].filter(group => group.length), random);
    available.sort((a, b) => b.length - a.length);
    if (available.length < 2) break;
    const [left, right] = shuffle([available[0].pop()!, available[1].pop()!], random);
    pairs.push({ left, right });
  }
  shuffle(pairs, random);
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
