"use client";
import { useEffect, useRef, useState } from "react";
import { Play, Square, Headphones, Check, Heart, Minus, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import voices from "@/data/voices.json";
import { useStore } from "@/lib/store";
import { comparisonPan, VoicePlayer } from "@/lib/audio";
import { speakerCount, type Choice, type Voice } from "@/features/comparison/model";
import { VoiceArt } from "@/components/voice-art";

export function VoiceComparison() {
  const { state, ready, start, answer, error: saveError } = useStore();
  const router = useRouter();
  const engine = useRef<VoicePlayer | null>(null);
  const request = useRef(0);
  const locked = useRef(false);
  const unlockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [choosing, setChoosing] = useState(false);
  const [active, setActive] = useState<"left" | "right" | null>(null);
  const [loading, setLoading] = useState<"left" | "right" | null>(null);
  const [progress, setProgress] = useState(0);
  const [audioError, setAudioError] = useState("");
  const [heard, setHeard] = useState<string[]>([]);
  const session = state.session;
  const index = session?.answers.length ?? 0;
  const complete = !!session && index === session.pairs.length;
  useEffect(() => { const player = new VoicePlayer(); engine.current = player; return () => { player.dispose(); if (unlockTimer.current) clearTimeout(unlockTimer.current); }; }, []);
  useEffect(() => { if (complete) router.replace("/insights"); }, [complete, router]);
  useEffect(() => {
    if (active) engine.current?.setPan(comparisonPan(active, state.stereo));
  }, [state.stereo, active]);
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
  const availableSpeakers = speakerCount(voices.filter(v => !state.hidden.includes(v.id)).map(v => v.id));
  if (!session) return <section className="intro-card"><VoiceArt /><div className="intro-copy"><span className="eyebrow">声からはじまる、小さな出会い。</span><h1>顔より先に、<br />声で会おう。</h1><p>ふたりのささやき声を聴いて、直感で選ぶ。<br />あなたの「好き」が、きっと見つかる。</p><button className="button primary" onClick={start} disabled={availableSpeakers < 2 || !!saveError}><Headphones size={22} />声を聴きはじめる</button><Link className="text-link" href="/welcome">はじめての方へ</Link><p className="fine">録音・登録なしで試せる端末内デモです</p>{availableSpeakers < 2 && <p role="alert">候補が不足しています。設定で非表示を解除してください。</p>}</div></section>;
  if (complete) return <div className="empty"><Link href="/insights">好みの結果を見る</Link></div>;
  const pair = session.pairs[index];
  const choose = (choice: Choice) => {
    if (locked.current) return;
    locked.current = true; setChoosing(true); request.current++; engine.current?.stop(); setActive(null); setLoading(null); setProgress(0); setAudioError("");
    unlockTimer.current = setTimeout(() => { locked.current = false; setChoosing(false); }, 400);
    if (!answer(index, choice)) { locked.current = false; setChoosing(false); }
    else if (index + 1 === session.pairs.length) router.push("/insights");
  };
  const play = async (side: "left" | "right", voice: Voice) => {
    if (typeof window.AudioContext === "undefined") { setAudioError("このブラウザでは音声再生に対応していません。最新版の Safari / Chrome で開いてください。"); return; }
    const token = ++request.current;
    engine.current?.stop(); setAudioError(""); setProgress(0);
    if (active === side || loading === side) { setActive(null); setLoading(null); return; }
    setActive(null); setLoading(side);
    try {
      const started = await engine.current?.play(voice.file, comparisonPan(side, state.stereo), () => { setActive(null); setProgress(1); });
      if (token !== request.current) return;
      if (started) { setActive(side); setHeard(previous => [...new Set([...previous, voice.id])]); }
    } catch { if (token === request.current) setAudioError("音声を読み込めませんでした。接続を確認し、再生ボタンでもう一度お試しください。"); }
    finally { if (token === request.current) setLoading(null); }
  };
  return <>
    <div className="comparison-toolbar"><div className="session-progress"><span>ROUND</span><strong>{index + 1} <span>/ {session.pairs.length}</span></strong><div className="step-dots" aria-hidden="true">{session.pairs.map((_, i) => <span className={i < index ? "done" : i === index ? "current" : ""} key={i} />)}</div></div><div className="listen-tip"><Headphones size={17} /><span>イヤホン推奨</span></div></div>
    <div className="page-heading comparison-heading"><span className="eyebrow">2人の声を、聴きくらべ。</span><h1>どっちの声が好き？</h1><p>{state.stereo ? "イヤホンで、左の声は左耳だけ、右の声は右耳だけに。" : "中央再生中。左右どちらの声も両耳に流れます。"}</p></div>
    <div className="voice-pair" key={index}>{(["left", "right"] as const).map(side => {
      const voice = voices.find(v => v.id === pair[side])!;
      const playing = active === side;
      return <article className={`voice-card ${side} ${playing ? "playing" : ""}`} key={side}>
        <div className="voice-card-top"><span className="side-label" aria-label={side === "left" ? "左" : "右"}>{side === "left" ? "L" : "R"}</span><span className="demo-pill">合成ASMR</span></div>
        <button aria-describedby={`name-${voice.id}`} aria-label={`${side === "left" ? "左" : "右"}の声を${playing || loading === side ? "停止" : "再生"}`} className="voice-avatar play-button" onClick={() => void play(side, voice)}><Headphones className="avatar-headphones" strokeWidth={1.6} /><span className="play-overlay">{playing || loading === side ? <Square size={16} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</span></button>
        <div className="waveform" aria-hidden="true">{voice.waveform.map((height, i) => <span className={playing && i / voice.waveform.length <= progress ? "played" : ""} key={i} style={{ height: `${height * 100}%` }} />)}</div>
        <div className="audio-time"><span>{playing ? `0:${String(Math.floor(progress * voice.duration)).padStart(2, "0")}` : "0:00"}</span><span>0:{String(Math.ceil(voice.duration)).padStart(2, "0")}</span></div>
        <p className="play-state" aria-live="polite">{loading === side ? "読み込み中…" : playing ? "再生中" : heard.includes(voice.id) ? "もう一度聴く" : "タップして聴く"}</p>
        <h2 id={`name-${voice.id}`}>{voice.name}</h2><p className="voice-caption">{voice.style}</p>
      </article>;
    })}</div>
    {audioError && <p role="alert" className="notice">{audioError}</p>}
    <section className="choice-section"><div className="choice-heading"><span />あなたの直感で選んでください<span /></div><div className="choices"><button className="choose-left" onClick={() => choose("left")} disabled={!!saveError || choosing}><Heart size={18} />左が好き</button><button className="choose-right" onClick={() => choose("right")} disabled={!!saveError || choosing}><Heart size={18} />右が好き</button><button onClick={() => choose("both")} disabled={!!saveError || choosing}><Heart size={17} />どちらも好き</button><button onClick={() => choose("neither")} disabled={!!saveError || choosing}><Minus size={18} />どちらでもない</button></div><p className="fine">正解はありません。いま、心地よいと感じた声を。</p></section>
    <div className="comparison-footer"><span><Check size={14} />選択はこの端末に保存されます</span><button className="plain-button" onClick={() => { request.current++; engine.current?.stop(); setActive(null); setLoading(null); start(); }}><RotateCcw size={13} />最初から</button></div>
  </>;
}
