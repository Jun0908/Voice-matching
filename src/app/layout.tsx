import type { Metadata, Viewport } from "next";
import { StoreProvider } from "@/lib/store";
import { Shell } from "@/components/shell";
import "./globals.css";
export const metadata: Metadata = { title: "VOICE MATCH | 見た目の前に、声でつながる。", description: "ふたつの声を聴いて、直感で選ぶ。声からはじまる出会いの端末内デモ。", robots: { index: false, follow: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0d0e16" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ja"><body><a className="skip-link" href="#main-content">本文へ移動</a><StoreProvider><Shell>{children}</Shell></StoreProvider></body></html>; }
