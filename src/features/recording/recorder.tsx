"use client";
import { useEffect, useRef, useState } from "react";
import { Mic, Square, RotateCcw, Save, LockKeyhole, Check, Play } from "lucide-react";
import { questions, type RecordingKind } from "@/data/questions";
import { getRecordings, saveRecording, type SavedRecording } from "@/lib/recordings";
import { RecordedAudio } from "@/components/recorded-audio";

export function RecordingStudio() {
  const [kind, setKind] = useState<RecordingKind>("intro");
  const [phase, setPhase] = useState<"idle" | "requesting" | "recording" | "stopping" | "preview">("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [draft, setDraft] = useState<Blob | null>(null);
  const [draftDuration, setDraftDuration] = useState(0);
  const [saved, setSaved] = useState<SavedRecording[]>([]);
  const [saving, setSaving] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const started = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const mounted = useRef(false);
  const previewAudio = useRef<HTMLAudioElement | null>(null);
  const release = () => { stream.current?.getTracks().forEach(track => track.stop()); stream.current = null; if (timer.current) clearInterval(timer.current); timer.current = null; };
  useEffect(() => {
    mounted.current = true;
    getRecordings().then(setSaved).catch(() => setError("録音の保存領域を開けません。プライベートモードや端末の空き容量を確認して再読み込みしてください。"));
    const leave = () => { if (recorder.current?.state === "recording") recorder.current.stop(); release(); };
    const hidden = () => { if (document.hidden) leave(); };
    window.addEventListener("pagehide", leave); document.addEventListener("visibilitychange", hidden);
    return () => { mounted.current = false; if (recorder.current) { recorder.current.onstop = null; recorder.current.ondataavailable = null; } leave(); window.removeEventListener("pagehide", leave); document.removeEventListener("visibilitychange", hidden); };
  }, []);
  const existing = saved.find(item => item.kind === kind);
  const blob = draft ?? existing?.blob;
  const start = async () => {
    if (recorder.current?.state === "recording" || phase === "requesting") return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { setError("このブラウザでは録音できません。HTTPS または localhost で、最新版の Safari / Chrome を開いてください。"); return; }
    previewAudio.current?.pause(); setPhase("requesting"); setError(""); setNotice("");
    try {
      const input = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
      if (!mounted.current || document.hidden) { input.getTracks().forEach(t => t.stop()); if (mounted.current) setPhase(draft ? "preview" : "idle"); return; }
      stream.current = input;
      const mime = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg;codecs=opus"].find(t => MediaRecorder.isTypeSupported(t));
      const instance = new MediaRecorder(input, mime ? { mimeType: mime } : undefined);
      recorder.current = instance;
      const chunks: BlobPart[] = [];
      instance.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      instance.onerror = () => { release(); setError("録音が中断されました。マイクの接続を確認して、もう一度録音してください。"); setPhase("idle"); };
      instance.onstop = () => {
        const duration = Math.min(30, (performance.now() - started.current) / 1000);
        release(); if (!mounted.current) return;
        setSeconds(duration);
        if (duration < 15 || chunks.length === 0) { setError("15秒以上お話しください。保存済みの録音は残っています。もう一度録音できます。"); setPhase(draft ? "preview" : "idle"); return; }
        setDraft(new Blob(chunks, { type: instance.mimeType })); setDraftDuration(duration); setPhase("preview");
      };
      started.current = performance.now(); instance.start(250); setSeconds(0); setPhase("recording");
      timer.current = setInterval(() => {
        const elapsed = (performance.now() - started.current) / 1000;
        setSeconds(Math.min(30, elapsed));
        if (elapsed >= 30 && instance.state === "recording") { setPhase("stopping"); instance.stop(); release(); }
      }, 100);
    } catch (cause) {
      release(); setPhase(draft ? "preview" : "idle");
      const denied = cause instanceof DOMException && (cause.name === "NotAllowedError" || cause.name === "SecurityError");
      setError(denied ? "マイクが許可されていません。ブラウザのサイト設定でマイクを許可し、もう一度録音してください。" : "マイクを起動できません。他のアプリでの使用や接続を確認し、再試行してください。");
    }
  };
  const stop = () => { if (recorder.current?.state === "recording") { setPhase("stopping"); recorder.current.stop(); release(); } };
  const save = async () => {
    if (!draft || saving) return;
    setSaving(true);
    const value: SavedRecording = { kind, blob: draft, duration: draftDuration, savedAt: new Date().toISOString(), visible: false };
    try { await saveRecording(value); setSaved(previous => [...previous.filter(r => r.kind !== kind), value]); setDraft(null); setPhase("idle"); setNotice("非公開で保存しました。この端末でいつでも聴けます。"); setError(""); }
    catch { setError("保存できませんでした。空き容量や保存設定を確認して再試行してください。録り直す前の録音は保持されています。"); }
    finally { setSaving(false); }
  };
  const busy = phase === "recording" || phase === "requesting" || phase === "stopping" || saving;
  return <><div className="page-heading"><h1>声を録音する</h1><p>自己紹介や質問への回答を、15〜30秒で。</p></div>
    <section className="panel recording-panel"><fieldset className="record-topics"><legend>話すテーマ</legend><div className="topic-chips">{questions.map(q => <button type="button" key={q.id} aria-pressed={kind === q.id} disabled={busy || !!draft} onClick={() => { setKind(q.id); setNotice(""); setError(""); }}>{q.label}</button>)}</div></fieldset><p className="record-prompt">{questions.find(q => q.id === kind)?.prompt}</p>
    <div className={`record-wave ${phase === "recording" ? "live" : ""}`} aria-hidden="true">
      {Array.from({ length: 46 }, (_, i) => <i key={i} style={{height: `${8 + Math.abs(Math.sin(i * .77) * Math.sin((i + 1) / 47 * Math.PI)) * 88}%`, animationDelay: `${i * -.09}s`}} />)}
    </div>
    <p className={`record-clock ${phase === "recording" ? "live" : ""}`} role="timer" aria-label="録音経過時間">00:{String(Math.floor(seconds)).padStart(2, "0")}<span> / 00:30</span></p><div className="record-meter"><span style={{ width: `${seconds / 30 * 100}%` }} /></div><p className="fine">{phase === "recording" ? "録音中 · 30秒で自動停止します" : "静かな場所で、いつもの話し方で。"}</p>
    {phase === "recording" ? <button className="button primary" onClick={stop}><Square size={18} />録音を停止</button> : <button className="button primary" disabled={busy} onClick={() => void start()}><Mic size={18} />{phase === "requesting" ? "マイクを起動中…" : phase === "stopping" ? "音声を準備中…" : draft ? "もう一度録音" : "録音をはじめる"}</button>}
    {blob && !busy && <div className="record-preview"><h2><Play size={16} />{draft ? "公開前プレビュー" : "保存済みの録音"}</h2><RecordedAudio blob={blob} label="録音を試聴" audioRef={previewAudio} />{draft && <div className="button-row"><button className="button primary" onClick={() => void save()} disabled={saving}><Save size={17} />非公開で保存</button><button className="button" onClick={() => { setDraft(null); setPhase("idle"); setNotice("録り直しを取り消しました。保存済みの録音に戻りました。"); }}><RotateCcw size={16} />取り消す</button></div>}</div>}
    {error && <p className="notice" role="alert">{error}</p>}{notice && <p className="success" role="status"><Check size={16} />{notice}</p>}
    </section><div className="privacy-note"><LockKeyhole size={18} /><p>録音はこの端末だけに保存。初期設定は非公開です。<br />デモの公開設定を変えても、他の人には送信されません。</p></div></>;
}
