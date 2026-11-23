"use client";
import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { answerSession, createSession, type Choice, type Session } from "@/features/comparison/model";
import catalog from "@/data/voices.json";

export type Profile = { nickname: string; age: string; area: string; seeking: string; about: string; visible: boolean; photoRequests: string[] };
export type State = { version: 1; session: Session | null; history: Session[]; stereo: boolean; hidden: string[]; interests: string[]; profile: Profile; onboarded: boolean };
const KEY = "voice-match:v1";
export const initialState: State = { version: 1, session: null, history: [], stereo: true, hidden: [], interests: [], onboarded: false, profile: { nickname: "", age: "", area: "", seeking: "指定なし", about: "", visible: false, photoRequests: [] } };
type Store = { state: State; ready: boolean; error: string; update: (fn: (s: State) => State) => boolean; start: () => boolean; answer: (index: number, choice: Choice) => boolean };
const Context = createContext<Store | null>(null);
const ids = new Set(catalog.map(v => v.id));
function validSession(value: unknown): value is Session {
  if (!value || typeof value !== "object") return false;
  const s = value as Session;
  return typeof s.id === "string" && Array.isArray(s.pairs) && s.pairs.length <= 5 && s.pairs.length > 0 && s.pairs.every(p => ids.has(p.left) && ids.has(p.right) && p.left !== p.right) && new Set(s.pairs.flatMap(p => [p.left, p.right])).size === s.pairs.length * 2 && Array.isArray(s.answers) && s.answers.length <= s.pairs.length && s.answers.every((a, i) => a.sessionId === s.id && a.pairIndex === i && a.left === s.pairs[i].left && a.right === s.pairs[i].right && ["left", "right", "both", "neither"].includes(a.choice) && typeof a.at === "string");
}
export function parseState(raw: string): State {
  const s = JSON.parse(raw) as State;
  if (s.version !== 1 || (s.session !== null && !validSession(s.session)) || !Array.isArray(s.history) || !s.history.every(validSession) || typeof s.stereo !== "boolean" || typeof s.onboarded !== "boolean" || !Array.isArray(s.interests) || !s.interests.every(id => ids.has(id)) || !Array.isArray(s.hidden) || !s.hidden.every(id => ids.has(id)) || !s.profile || ![s.profile.nickname, s.profile.age, s.profile.area, s.profile.seeking, s.profile.about].every(v => typeof v === "string") || typeof s.profile.visible !== "boolean" || !Array.isArray(s.profile.photoRequests) || !s.profile.photoRequests.every(id => ids.has(id))) throw new Error("Invalid saved state");
  return s;
}
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(initialState);
  const current = useRef(initialState);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { current.current = parseState(raw); setState(current.current); }
    } catch { setError("端末の保存データを読み込めません。保存領域の設定を確認してください。データは上書きしていません。"); }
    setReady(true);
    // Other tabs are read-only until reload, avoiding competing session writers.
    const changed = (e: StorageEvent) => { if (e.key === KEY) setError("別のタブでデータが更新されました。再読み込みしてから操作してください。"); };
    window.addEventListener("storage", changed);
    return () => window.removeEventListener("storage", changed);
  }, []);
  const update = useCallback((fn: (s: State) => State) => {
    if (!ready || error) return false;
    const next = fn(current.current);
    try { localStorage.setItem(KEY, JSON.stringify(next)); }
    catch { setError("保存できませんでした。端末の空き容量とブラウザの保存設定を確認し、再読み込みしてください。"); return false; }
    current.current = next; setState(next); return true;
  }, [ready, error]);
  const start = () => update(s => ({ ...s, history: s.session ? [...s.history, s.session] : s.history, session: createSession(catalog.map(v => v.id).filter(id => !s.hidden.includes(id))) }));
  const answer = (index: number, choice: Choice) => update(s => s.session ? { ...s, session: answerSession(s.session, index, choice) } : s);
  return <Context.Provider value={{ state, ready, error, update, start, answer }}>{children}</Context.Provider>;
}
export function useStore() { const store = useContext(Context); if (!store) throw new Error("Missing StoreProvider"); return store; }
export function allAnswers(state: State) { return [...state.history, ...(state.session ? [state.session] : [])].flatMap(s => s.answers); }
