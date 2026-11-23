"use client";
import { Heart, Headphones, ChartNoAxesCombined, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { allAnswers, useStore } from "@/lib/store";
import { aggregate } from "@/features/preferences/aggregate";
import { likedIds } from "@/features/comparison/model";
import voices from "@/data/voices.json";
const choiceLabels = { left: "左が好き", right: "右が好き", both: "どちらも好き", neither: "どちらでもない" };
export default function InsightsPage() {
  const { state, ready, start } = useStore();
  const router = useRouter();
  const answers = allAnswers(state);
  const tags = aggregate(answers, voices);
  const selected = likedIds(answers);
  if (!ready) return <div className="empty">履歴を読み込んでいます…</div>;
  return <><div className="page-heading"><span className="eyebrow">あなたが惹かれたポイント</span><h1>好きな声が、<br />ちょっとわかってきた。</h1><p>小さな「好き」を重ねて、あなたの好みを見つけよう。</p></div>{!answers.length ? <section className="panel empty"><ChartNoAxesCombined size={40} /><h2>まだ、まっさらな好み。</h2><p>まずは声を聴き比べてみませんか。</p><Link className="button primary" href="/">声を聴きにいく <Headphones size={18} /></Link></section> : <>
    <div className="stats-grid"><div className="stat"><span>聴き比べたペア</span><strong>{answers.length}<small>組</small></strong></div><div className="stat"><span>好きと感じた声</span><strong>{selected.size}<small>人</small></strong></div><div className="stat"><span>今回の進捗</span><strong>{state.session?.answers.length ?? 0}<small>/ {state.session?.pairs.length ?? 0}</small></strong></div></div>
    <section className="panel"><h2><Sparkles size={20} />あなたが選んだ声の特徴</h2><p className="fine">少ない回数では件数を参考に。声の特徴から人柄や価値観は判断しません。</p><div className="tag-results">{tags.map(t => <div className="tag-result" key={t.tag}><div><strong>{t.tag}</strong><span>選択 {t.selected} / 提示 {t.presented} 件</span></div><div className="progress-track"><div style={{ width: `${t.selected / t.presented * 100}%` }} /></div></div>)}</div><p className="fine">タグは音声の音響指標から付けたデモ用の目安です。「両方」は2声を選択、「どちらでもない」は選択0件として集計します。</p></section>
    <section className="panel"><h2>最近の選択</h2><div className="history-list">{answers.slice(-10).reverse().map(a => <div className="history-row" key={`${a.sessionId}-${a.pairIndex}`}><span className="history-icon"><Heart size={17} /></span><div><strong>{voices.find(v => v.id === a.left)?.name} <span>＆</span> {voices.find(v => v.id === a.right)?.name}</strong><span>{new Date(a.at).toLocaleString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} · {a.pairIndex + 1}組目</span></div><span className="choice-badge">{choiceLabels[a.choice]}</span></div>)}</div></section>
    <div className="button-row center"><Link href="/matches" className="button primary"><Heart size={17} />気になる声を見返す</Link>{state.session && state.session.answers.length < state.session.pairs.length ? <Link href="/" className="button">比較を続ける</Link> : <button className="button" disabled={voices.length - state.hidden.length < 2} onClick={() => { if (start()) router.push("/"); }}>新しい5組を聴く</button>}</div></>}</>;
}
