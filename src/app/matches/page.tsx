"use client";
import Link from "next/link";
import { useState } from "react";
import { Heart, Check, AudioLines, LockKeyhole, MessageCircle, Mic, Phone } from "lucide-react";
import { allAnswers, useStore } from "@/lib/store";
import { likedIds } from "@/features/comparison/model";
import { interestStatus } from "@/features/matching/model";
import voices from "@/data/voices.json";
export default function MatchesPage() {
  const { state, ready, update } = useStore();
  const [message, setMessage] = useState("");
  const likes = likedIds(allAnswers(state));
  const candidates = voices.filter(v => likes.has(v.id) && !state.hidden.includes(v.id));
  const [playing, setPlaying] = useState<string | null>(null);
  if (!ready) return <div className="empty">関心を読み込んでいます…</div>;
  return <><div className="page-heading"><span className="eyebrow">A LITTLE CLOSER</span><h1>もう一度、聴きたい声。</h1><p>あなたの「好き」から、次の一歩へ。</p></div><div className="info-banner"><LockKeyhole size={19} /><p>端末内のマッチング体験です。関心は送信されず、相手の反応はデモデータで再現します。</p></div>{!candidates.length ? <section className="panel empty"><Heart size={40} /><h2>気になる声を、見つけよう。</h2><p>比較で好きと答えた候補がここに並びます。<br />非表示にした候補は設定から戻せます。</p><Link href="/" className="button primary">声を聴きにいく</Link></section> : <div className="match-grid">{candidates.map(v => {
    const status = interestStatus(v.id, state.interests);
    return <article className={`panel match-card ${status === "matched" ? "matched" : ""}`} key={v.id}><div className="match-card-heading"><div className="small-avatar"><AudioLines /></div><div><h2>{v.name}</h2><span className="fine">デモ音声 · 読み上げサンプル</span></div></div><div className="tag-pills">{v.tags.map(tag => <span key={tag}>{tag}</span>)}</div><audio controls src={v.file} preload="none" aria-label={`${v.name}を試聴`} onPlay={e => { document.querySelectorAll("audio").forEach(a => { if (a !== e.currentTarget) a.pause(); }); setPlaying(v.id); }} onEnded={() => setPlaying(null)} /><span className="sr-only" aria-live="polite">{playing === v.id ? "再生中" : ""}</span><button className={`button ${status === "matched" ? "match-success" : "primary"}`} disabled={status !== "none"} onClick={() => update(s => ({ ...s, interests: [...new Set([...s.interests, v.id])] }))}>{status === "matched" ? <><Heart size={17} />マッチ成立（デモ）</> : status === "sent" ? <><Check size={17} />関心を送信済み（デモ）</> : <><Heart size={17} />関心を送る</>}</button>{status === "matched" && <div className="match-detail"><p>お互いの関心がそろいました。</p><div className="future-actions"><span><MessageCircle size={15} />チャット</span><span><Mic size={15} />音声メッセージ</span><span><Phone size={15} />通話</span></div><p className="fine">会話機能は今後対応予定です。</p><label className="checkbox-label"><input type="checkbox" checked={state.profile.photoRequests.includes(v.id)} onChange={e => update(s => ({ ...s, profile: { ...s.profile, photoRequests: e.target.checked ? [...new Set([...s.profile.photoRequests, v.id])] : s.profile.photoRequests.filter(id => id !== v.id) } }))} />写真の公開を希望する（端末内）</label><p className="fine">双方の希望がそろうまで写真は表示しません。デモでは相手の写真はありません。本番ではサーバーで判定します。</p></div>}<button className="plain-button muted" onClick={() => { if (update(s => ({ ...s, hidden: [...new Set([...s.hidden, v.id])] }))) setMessage(`${v.name}を非表示にしました。設定から戻せます。`); }}>この候補を非表示にする</button></article>;
  })}</div>}{message && <p className="success" role="status">{message}</p>}</>;
}
