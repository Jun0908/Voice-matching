"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AudioLines, Headphones, Heart } from "lucide-react";
import { useStore } from "@/lib/store";
import Link from "next/link";
import { VoiceArt } from "@/components/voice-art";
export default function WelcomePage() {
  const { state, ready, update, start } = useStore();
  const router = useRouter();
  const [nickname, setNickname] = useState<string | null>(null);
  const [age, setAge] = useState<string | null>(null);
  const [area, setArea] = useState<string | null>(null);
  const [seeking, setSeeking] = useState<string | null>(null);
  if (!ready) return <div className="empty">プロフィールを準備しています…</div>;
  return <><div className="welcome-hero"><VoiceArt /><div className="page-heading"><span className="eyebrow">声からはじまる、あなたの出会い。</span><h1>顔より先に、<br />声で会おう。</h1><p>30秒の言葉から、あなたらしさを。<br />まずは気になる声を、聴いてみよう。</p></div></div><div className="welcome-steps"><span><Headphones />聴いて</span><span><Heart />心で選んで</span><span><AudioLines />自分を知る</span></div><form className="panel form-panel" onSubmit={e => { e.preventDefault(); if (update(s => ({ ...s, onboarded: true, profile: { ...s.profile, nickname: (nickname ?? s.profile.nickname).trim(), age: age ?? s.profile.age, area: (area ?? s.profile.area).trim(), seeking: seeking ?? s.profile.seeking } }))) { if (!state.session) start(); router.push("/"); } }}>
    <h2>あなたのこと、少しだけ。</h2><p className="fine">すべてこの端末に保存します。あとから変更できます。</p><label>ニックネーム<input required maxLength={24} autoComplete="nickname" value={nickname ?? state.profile.nickname} onChange={e => setNickname(e.target.value)} placeholder="例：はる" /></label><div className="form-grid"><label>年齢<select required value={age ?? state.profile.age} onChange={e => setAge(e.target.value)}><option value="">選択してください</option>{["18〜24歳", "25〜29歳", "30〜34歳", "35〜39歳", "40歳以上"].map(v => <option key={v}>{v}</option>)}</select></label><label>お住まいの地域<input maxLength={30} value={area ?? state.profile.area} onChange={e => setArea(e.target.value)} placeholder="例：東京都" /></label></div><label>希望する出会い<select value={seeking ?? state.profile.seeking} onChange={e => setSeeking(e.target.value)}>{["指定なし", "ゆっくり関係を育てたい", "まずは会話を楽しみたい", "将来を考えられる関係"].map(v => <option key={v}>{v}</option>)}</select></label><p className="fine">18歳以上向けのデモです。イヤホンを用意してお楽しみください。</p><button className="button primary" disabled={!ready} type="submit">声の出会いをはじめる <Headphones size={18} /></button><Link className="text-link" href="/">入力せずにデモを試す</Link></form></>;
}
