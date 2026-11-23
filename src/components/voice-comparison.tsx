"use client";
import { useEffect, useRef, useState } from "react";
import { Play, Square, Headphones, Check, Heart, Minus, RotateCcw, Mic, ArrowLeft, ArrowRight, SlidersHorizontal } from "lucide-react";
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
  const gesture = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const [swipeSide, setSwipeSide] = useState<"left" | "right" | null>(null);
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
  if (!session) return <section className="intro-card">
    <VoiceArt />
    <div className="intro-copy">
      <span className="listen-tip"><Headphones size={15} />左右で聴く</span>
      <h1>声で、好きになる<span className="pink-period">。</span></h1>
      <p>声と話し方で出会うマッチングアプリ。<br />ふたりの声を聴いて、好きなほうを選んでみよう。</p>
      <div className="intro-actions">
        <Link href="/record" className="button primary"><Mic size={19} />声を録音する</Link>
        <button className="button" onClick={start} disabled={availableSpeakers < 2 || !!saveError}><Headphones size={18} />声を聴きはじめる</button>
      </div>
      <Link className="text-link" href="/welcome">はじめての方へ <ArrowRight size={14} /></Link>
      {availableSpeakers < 2 && <p role="alert">候補が不足しています。設定で非表示を解除してください。</p>}
    </div>
  </section>;
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
    <div className="discovery-title"><h1>さがす</h1><Link href="/profile" className="settings-link" aria-label="再生設定"><SlidersHorizontal size={17} /></Link></div>
    <div className="comparison-toolbar">
      <div className="session-progress"><span>ROUND</span><strong>{index + 1} / {session.pairs.length}</strong>
        <div className="step-dots" aria-hidden="true">{session.pairs.map((_, i) => <span className={i < index ? "done" : i === index ? "current" : ""} key={i} />)}</div>
      </div>
      <div className="listen-tip"><Headphones size={15} />{state.stereo ? "イヤホンで左右から" : "両耳で中央再生"}</div>
    </div>
    <div className="question-card"><span>ふたりの声を聴き比べ</span><h2>どっちの声が好き？</h2></div>
    <div className={`voice-pair ${active ? "listen-" + active : ""} ${swipeSide ? "select-" + swipeSide : ""}`} key={index}
      onPointerDown={event => {
        if (!event.isPrimary || event.button !== 0 || saveError || locked.current || (event.target as Element).closest("button")) return;
        gesture.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={event => {
        const origin = gesture.current;
        if (origin?.pointerId !== event.pointerId) return;
        const dx = event.clientX - origin.x;
        const dy = event.clientY - origin.y;
        setSwipeSide(Math.abs(dx) > Math.max(24, Math.abs(dy) * 1.4) ? (dx < 0 ? "left" : "right") : null);
      }}
      onPointerUp={event => {
        const origin = gesture.current;
        if (origin?.pointerId !== event.pointerId) return;
        gesture.current = null;
        setSwipeSide(null);
        const dx = event.clientX - origin.x;
        if (!saveError && Math.abs(dx) >= Math.max(56, Math.abs(event.clientY - origin.y) * 1.4)) choose(dx < 0 ? "left" : "right");
      }}
      onLostPointerCapture={() => { gesture.current = null; setSwipeSide(null); }}
    >
      <div className="listener" aria-hidden="true"><i className="sound-arc left" /><i className="sound-arc right" /></div>
      {(["left", "right"] as const).map(side => {
        const voice = voices.find(v => v.id === pair[side])!;
        const playing = active === side;
        return <article className={`voice-card ${side} ${playing ? "playing" : ""}`} key={side}>
          <button aria-describedby={`name-${voice.id}`} aria-label={`${side === "left" ? "左" : "右"}の声を${playing || loading === side ? "停止" : "再生"}`} className="voice-avatar play-button" onClick={() => void play(side, voice)}>
            <span className="play-overlay">{playing || loading === side ? <Square size={12} fill="currentColor" /> : <Play size={11} fill="currentColor" />}</span>
          </button>
          <p className="play-state" aria-live="polite">{loading === side ? "読込中" : playing ? "再生中" : heard.includes(voice.id) ? "試聴済み" : "待機中"}</p>
          <h2 id={`name-${voice.id}`}>{voice.name}</h2>
          <p className="voice-caption">{voice.style}</p>
          <div className="clip-track"><span>{side === "left" ? "L" : "R"}</span>
            <div className="waveform" aria-hidden="true">{voice.waveform.filter((_, i) => i % 2 === 0).map((height, i) => <i className={playing && i / 24 <= progress ? "played" : ""} key={i} style={{ height: `${height * 100}%` }} />)}</div>
          </div>
          <div className="audio-time">0:{String(Math.floor(playing ? progress * voice.duration : voice.duration)).padStart(2, "0")}</div>
        </article>;
      })}
    </div>
    {audioError && <p role="alert" className="notice">{audioError}</p>}
    <section className="choice-section"><div className="choice-heading"><span />左右にスワイプ、またはタップで選択<span /></div><div className="choices"><button className="choose-left" onClick={() => choose("left")} disabled={!!saveError || choosing}><ArrowLeft size={17} />左が好き</button><button className="choose-right" onClick={() => choose("right")} disabled={!!saveError || choosing}>右が好き<ArrowRight size={17} /></button><button onClick={() => choose("both")} disabled={!!saveError || choosing}><Heart size={17} />どちらも好き</button><button onClick={() => choose("neither")} disabled={!!saveError || choosing}><Minus size={18} />どちらでもない</button></div></section>
    <div className="comparison-footer"><span><Check size={14} />選択はこの端末に保存されます</span><button className="plain-button" onClick={() => { request.current++; engine.current?.stop(); setActive(null); setLoading(null); start(); }}><RotateCcw size={13} />最初から</button></div>
  </>;
}
