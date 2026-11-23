"use client";
import { AudioLines, Headphones, Mic, ChartNoAxesCombined, Heart, UserRound, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
const links = [ { href: "/", label: "声を聴く", icon: Headphones }, { href: "/record", label: "録音する", icon: Mic }, { href: "/insights", label: "好み分析", icon: ChartNoAxesCombined }, { href: "/matches", label: "マッチ", icon: Heart }, { href: "/profile", label: "マイページ", icon: UserRound } ];
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { error } = useStore();
  return <><header className="site-header"><Link href="/" className="brand" aria-label="VOICE MATCH ホーム"><span className="brand-mark"><AudioLines size={24} /></span>VOICE<span>MATCH</span></Link><nav className="desktop-nav" aria-label="メインナビゲーション">{links.map(({ href, label, icon: Icon }) => <Link aria-current={path === href ? "page" : undefined} className={path === href ? "active" : ""} href={href} key={href}><Icon size={17} />{label}</Link>)}</nav><span className="header-demo">LOCAL DEMO</span></header><main id="main-content" className={path === "/" ? "main comparison-main" : "main"}>{error && <div role="alert" className="notice storage-error">{error}<button className="button" onClick={() => window.location.reload()}>再読み込み</button></div>}{children}</main><footer className="site-footer"><span>見た目の前に、声でつながる。</span><span><ShieldCheck size={13} />この端末だけのデモ体験</span></footer><nav className="mobile-nav" aria-label="モバイルナビゲーション">{links.map(({ href, label, icon: Icon }) => <Link aria-current={path === href ? "page" : undefined} className={path === href ? "active" : ""} href={href} key={href}><Icon size={21} /><span>{label}</span></Link>)}</nav></>;
}
