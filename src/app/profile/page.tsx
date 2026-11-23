"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { UserRound, LockKeyhole, Headphones, Trash2, Mic, EyeOff, Check } from "lucide-react";
import { useStore } from "@/lib/store";
import { deleteRecording, getRecordings, saveRecording, type SavedRecording } from "@/lib/recordings";
import { questions, type RecordingKind } from "@/data/questions";
import voices from "@/data/voices.json";
import { RecordedAudio } from "@/components/recorded-audio";

function RecordingItem({ recording, onChange }: { recording: SavedRecording; onChange: () => Promise<void> }) {
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const action = async (fn: () => Promise<unknown>) => { setBusy(true); setError(""); try { await fn(); await onChange(); } catch { setError("操作を保存できませんでした。空き容量を確認して再試行してください。"); } finally { setBusy(false); } };
  return <div className="saved-recording"><div className="section-row"><h3>{questions.find(q => q.id === recording.kind)?.label}</h3><span className="demo-pill">{recording.visible ? "公開希望（端末内）" : "非公開"}</span></div><RecordedAudio blob={recording.blob} label={`${questions.find(q => q.id === recording.kind)?.label}の保存済み録音`} /><div className="section-row"><label className="checkbox-label"><input type="checkbox" disabled={busy} checked={recording.visible} onChange={e => void action(() => saveRecording({ ...recording, visible: e.target.checked }))} />端末内デモで公開希望</label><button className="plain-button danger" disabled={busy} onClick={() => setConfirming(true)}><Trash2 size={15} />削除</button></div>{confirming && <div className="notice"><p>この録音を削除しますか？元には戻せません。</p><div className="button-row"><button className="button" disabled={busy} onClick={() => void action(() => deleteRecording(recording.kind as RecordingKind))}>録音を削除する</button><button className="button" onClick={() => setConfirming(false)}>残す</button></div></div>}{error && <p role="alert" className="notice">{error}</p>}</div>;
}
export default function ProfilePage() {
  const { state, ready, update } = useStore();
  const [recordings, setRecordings] = useState<SavedRecording[]>([]);
  const [recordError, setRecordError] = useState("");
  const [notice, setNotice] = useState("");
  const reload = async () => { setRecordings(await getRecordings()); };
  useEffect(() => { getRecordings().then(setRecordings).catch(() => setRecordError("録音を読み込めません。端末の保存設定を確認して再読み込みしてください。")); }, []);
  const introduction = recordings.find(recording => recording.kind === "intro");
  if (!ready) return <div className="empty">設定を読み込んでいます…</div>;
  return <><div className="page-heading"><h1>あなたのプロフィール</h1></div>
    <section className="profile-cover panel">
      <div className="profile-art" aria-hidden="true" />
      <div className="profile-summary"><h2>{state.profile.nickname || "ゲスト"}</h2>
        {introduction ? <RecordedAudio blob={introduction.blob} label="自己紹介の再生" /> : <Link className="text-link" href="/record"><Mic size={16} />自己紹介を録音する</Link>}
      </div>
    </section>
    <form className="panel form-panel" onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); if (update(s => ({ ...s, profile: { ...s.profile, nickname: String(data.get("nickname")).trim(), age: String(data.get("age")), area: String(data.get("area")).trim(), seeking: String(data.get("seeking")), about: String(data.get("about")).trim() } }))) setNotice("プロフィールをこの端末に保存しました。"); }}><h2><UserRound size={20} />プロフィール</h2><label>ニックネーム<input name="nickname" maxLength={24} defaultValue={state.profile.nickname} placeholder="ニックネーム" /></label><div className="form-grid"><label>年齢<select name="age" defaultValue={state.profile.age}><option value="">未設定</option>{["18〜24歳", "25〜29歳", "30〜34歳", "35〜39歳", "40歳以上"].map(v => <option key={v}>{v}</option>)}</select></label><label>お住まいの地域<input name="area" maxLength={30} defaultValue={state.profile.area} /></label></div><label>希望する出会い<select name="seeking" defaultValue={state.profile.seeking}>{["指定なし", "ゆっくり関係を育てたい", "まずは会話を楽しみたい", "将来を考えられる関係"].map(v => <option key={v}>{v}</option>)}</select></label><label>大切にしていること<textarea name="about" rows={3} maxLength={300} defaultValue={state.profile.about} placeholder="あなたの言葉で教えてください。" /></label><p className="fine">人柄や価値観は、本人が入力した内容を参照します。デモ候補は希望条件による絞り込みの対象外です。</p><button className="button primary" type="submit">プロフィールを保存</button>{notice && <p className="success" role="status"><Check size={16} />{notice}</p>}</form>
    <section className="panel"><h2><Headphones size={20} />再生と公開の設定</h2><label className="switch-row"><span><strong>ステレオ定位</strong><span>オンにすると、イヤホンでは左の声は左耳だけ、右の声は右耳だけに流れます。オフで中央再生。</span></span><input type="checkbox" role="switch" checked={state.stereo} onChange={e => update(s => ({ ...s, stereo: e.target.checked }))} /></label><label className="switch-row"><span><strong>プロフィールの公開希望</strong><span>この端末内の状態です。インターネットには公開されません。</span></span><input type="checkbox" role="switch" checked={state.profile.visible} onChange={e => update(s => ({ ...s, profile: { ...s.profile, visible: e.target.checked } }))} /></label></section>
    <section className="panel"><div className="section-row"><h2><Mic size={20} />保存した声</h2><Link className="text-link" href="/record">録音・差し替え</Link></div><p className="fine">自己紹介と各質問の回答を個別に保存します。差し替えは新しい録音の保存時に確定します。</p>{recordError && <p role="alert" className="notice">{recordError}</p>}{recordings.length ? recordings.map(recording => <RecordingItem recording={recording} onChange={reload} key={recording.kind} />) : <p className="muted">まだ保存した録音がありません。</p>}</section>
    <section className="panel"><h2><EyeOff size={20} />非表示にした候補</h2><p className="fine">非表示は候補一覧と次のセッションに反映します。進行中の比較と過去の履歴は維持します。</p>{!state.hidden.length ? <p className="muted">非表示の候補はいません。</p> : state.hidden.map(id => <div className="hidden-row" key={id}><span>{voices.find(v => v.id === id)?.name}</span><button className="button" onClick={() => update(s => ({ ...s, hidden: s.hidden.filter(v => v !== id) }))}>表示を戻す</button></div>)}</section>
    <details className="panel"><summary>ASMRボイスの名前とクレジット</summary>
      <dl>{voices.map(voice => <div className="hidden-row" key={voice.id}>
        <dt><strong>{voice.name}</strong></dt><dd><a className="text-link" href={voice.license}>{voice.source}</a></dd>
      </div>)}</dl>
    </details>
    <div className="privacy-note"><LockKeyhole size={20} /><p>比較履歴・設定・録音はこのブラウザに保存されます。ブラウザのデータ削除や端末変更では引き継げません。本番のアカウントと通信機能は未接続です。</p></div></>;
}
