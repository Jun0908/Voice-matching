"use client";
import { useEffect, useRef, useState } from "react";
import { Play, Square, Headphones, Check, Heart, Minus, AudioLines, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import voices from "@/data/voices.json";
import { useStore } from "@/lib/store";
import { VoicePlayer } from "@/lib/audio";
import type { Choice, Voice } from "@/features/comparison/model";

export function VoiceComparison() {
  const { state, ready, start, answer, error: saveError } = useStore();
  const router = useRouter();
  const engine = useRef<VoicePlayer | null>(null);
  const request = useRef(0);
  const locked = useRef(false);
  const [active, setActive] = useState<"left" | "right" | null>(null);
  const [loading, setLoading] = useState<"left" | "right" | null>(null);
  const [progress, setProgress] = useState(0);
  const [audioError, setAudioError] = useState("");
  const [heard, setHeard] = useState<string[]>([]);
  const session = state.session;
  const index = session?.answers.length ?? 0;
  const complete = !!session && index === session.pairs.length;
  useEffect(() => { engine.current = new VoicePlayer(); return () => { request.current++; engine.current?.dispose(); }; }, []);
  useEffect(() => { locked.current = false; }, [index, session?.id]);
  useEffect(() => { if (complete) router.replace("/insights"); }, [complete, router]);
  useEffect(() => { engine.current?.setPan(state.stereo ? active === "left" ? -.65 : .65 : 0); }, [state.stereo, active]);
  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const tick = () => { setProgress(engine.current?.progress() ?? 0); frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  }, [active]);
  useEffect(() => {
    const stop = () => { if (document.hidden) { request.current++; engine.current?.stop(); setActive(null); setLoading(null); } };
    document.addEventListener("visibilitychange", stop); return () => document.removeEventListener("visibilitychange", stop);
  }, []);
  if (!ready) return <div className="empty">保存した進捗を読み込んでいます…</div>;
  if (!session) return <section className="intro-card"><div className="orb"><AudioLines size={44} /></div><span className="eyebrow">YOUR NEXT CONNECTION</span><h1>心が動くのは、<br /><em>どんな声？</em></h1><p>ふたつの声を聴いて、直感で選ぶ。<br />5組の小さな出会いから、あなたの好みが見えてきます。</p><button className="button primary" onClick={start} disabled={voices.length - state.hidden.length < 2 || !!saveError}>声を聴きはじめる <Headphones size={18} /></button><Link className="text-link" href="/welcome">はじめての方へ</Link><p className="fine">録音・登録なしで試せる端末内デモです</p>{voices.length - state.hidden.length < 2 && <p role="alert">候補が不足しています。設定で非表示を解除してください。</p>}</section>;
  if (complete) return <div className="empty"><Link href="/insights">好みの結果を見る</Link></div>;
  const pair = session.pairs[index];
  const choose = (choice: Choice) => {
    if (locked.current) return;
    locked.current = true; request.current++; engine.current?.stop(); setActive(null); setLoading(null); setProgress(0); setAudioError("");
    if (!answer(index, choice)) locked.current = false;
    else if (index + 1 === session.pairs.length) router.push("/insights");
  };
  const play = async (side: "left" | "right", voice: Voice) => {
    const token = ++request.current;
    engine.current?.stop(); setAudioError(""); setProgress(0);
    if (active === side || loading === side) { setActive(null); setLoading(null); return; }
    setActive(null); setLoading(side);
    try {
      const started = await engine.current?.play(voice.file, state.stereo ? side === "left" ? -.65 : .65 : 0, () => { setActive(null); setProgress(1); });
      if (token !== request.current) return;
      if (started) { setActive(side); setHeard(previous => [...new Set([...previous, voice.id])]); }
    } catch { if (token === request.current) setAudioError("音声を読み込めませんでした。接続を確認し、再生ボタンでもう一度お試しください。"); }
    finally { if (token === request.current) setLoading(null); }
  };
  return <>
    <div className="page-heading"><span className="eyebrow">LISTEN TO YOUR FEELING</span><h1>声からはじまる、<br className="mobile-break" />小さな出会い。</h1><p>どちらの声を、もっと聴いてみたい？</p></div>
    <div className="session-progress"><span>今日のリスニング</span><strong>{index + 1} <span>/ {session.pairs.length}</span></strong><div className="progress-track"><div style={{ width: `${index / session.pairs.length * 100}%` }} /></div><div className="step-dots">{session.pairs.map((_, i) => <span className={i < index ? "done" : i === index ? "current" : ""} key={i}>{i < index ? <Check size={10} /> : null}</span>)}</div></div>
    <div className="listen-tip"><Headphones size={17} /><span>イヤホンで、声の距離まで感じてみて。</span><span className="stereo-label">{state.stereo ? "STEREO ON" : "MONO"}</span></div>
    <div className="voice-pair" key={index}>{(["left", "right"] as const).map(side => {
      const voice = voices.find(v => v.id === pair[side])!;
      const playing = active === side;
      return <article className={`voice-card ${side} ${playing ? "playing" : ""}`} key={side}>
        <div className="voice-card-top"><span className="side-label">{side.toUpperCase()}</span><span className="demo-pill">デモ音声</span></div>
        <div className="voice-avatar"><AudioLines size={36} strokeWidth={1.3} /></div>
        <h2>{voice.name}</h2><p className="voice-caption">日本語の読み上げサンプル</p>
        <div className="waveform" aria-hidden="true">{voice.waveform.map((height, i) => <span className={playing && i / voice.waveform.length <= progress ? "played" : ""} key={i} style={{ height: `${height * 100}%` }} />)}</div>
        <div className="audio-time"><span>{playing ? `0:${String(Math.floor(progress * voice.duration)).padStart(2, "0")}` : "0:00"}</span><span>0:{String(Math.ceil(voice.duration)).padStart(2, "0")}</span></div>
        <button aria-label={`${side === "left" ? "左" : "右"}の声を${playing || loading === side ? "停止" : "再生"}`} className="play-button" onClick={() => void play(side, voice)}>{playing || loading === side ? <Square size={20} fill="currentColor" /> : <Play size={23} fill="currentColor" />}</button>
        <p className="play-state" aria-live="polite">{loading === side ? "読み込み中…" : playing ? "再生中" : heard.includes(voice.id) ? "もう一度聴く" : "タップして聴く"}</p>
      </article>;
    })}<span className="pair-divider">&</span></div>
    {audioError && <p role="alert" className="notice">{audioError}</p>}
    <section className="choice-section"><div className="choice-heading"><span />あなたの直感で選んでください<span /></div><div className="choices"><button className="choose-left" onClick={() => choose("left")} disabled={!!saveError}><Heart size={18} />左が好き</button><button className="choose-right" onClick={() => choose("right")} disabled={!!saveError}><Heart size={18} />右が好き</button><button onClick={() => choose("both")} disabled={!!saveError}><Heart size={17} />どちらも好き</button><button onClick={() => choose("neither")} disabled={!!saveError}><Minus size={18} />どちらでもない</button></div><p className="fine">正解はありません。いま、心地よいと感じた声を。</p></section>
    <div className="comparison-footer"><span><Check size={14} />選択はこの端末に保存されます</span><button className="plain-button" onClick={() => { request.current++; engine.current?.stop(); setActive(null); setLoading(null); start(); }}><RotateCcw size={13} />最初から</button></div>
  </>;
}
