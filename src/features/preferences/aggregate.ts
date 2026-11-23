import type { Answer, Voice } from "@/features/comparison/model";
export function aggregate(answers: Answer[], voices: Voice[]) {
  const tags = new Map<string, { tag: string; presented: number; selected: number }>();
  for (const answer of answers) {
    for (const side of ["left", "right"] as const) {
      const voice = voices.find(v => v.id === answer[side]);
      for (const tag of voice?.tags ?? []) {
        const count = tags.get(tag) ?? { tag, presented: 0, selected: 0 };
        count.presented++;
        if (answer.choice === side || answer.choice === "both") count.selected++;
        tags.set(tag, count);
      }
    }
  }
  return [...tags.values()].sort((a, b) => b.selected - a.selected || b.presented - a.presented);
}
