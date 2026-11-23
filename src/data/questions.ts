export const questions = [
  { id: "intro", label: "自己紹介", prompt: "あなたのことを、声で教えてください。" },
  { id: "weekend", label: "休日の過ごし方", prompt: "休日はどんなふうに過ごしますか？" },
  { id: "together", label: "一緒に過ごす時間", prompt: "恋人とどんな時間を過ごしたいですか？" },
  { id: "happy", label: "最近のうれしいこと", prompt: "最近うれしかったことは何ですか？" },
] as const;
export type RecordingKind = (typeof questions)[number]["id"];
