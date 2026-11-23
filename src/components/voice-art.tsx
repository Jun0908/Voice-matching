"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { Heart, Pause, Play } from "lucide-react";
import voices from "@/data/voices.json";

export function VoiceArt() {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);
  const sample = voices[0];
  const toggle = async () => {
    if (!audio.current) return;
    if (!audio.current.paused) { audio.current.pause(); return; }
    setError(false);
    try { await audio.current.play(); } catch { setError(true); }
  };
  return <div className="voice-art">
    <div className="portrait-stack">
      <div className="portrait-card">
        <Image src="/art/headphones.webp" alt="白いヘッドホンをつけたアバター" width={1000} height={667} preload />
        <button className="sample-button" onClick={toggle} aria-label={playing ? "リサの試聴を一時停止" : "リサの声を試聴"}>
          {playing ? <Pause size={15} /> : <Play size={15} fill="currentColor" />} {sample.name}の声
          <span className="sample-bars" aria-hidden="true">{sample.waveform.slice(0, 17).map((v, i) => <i key={i} style={{height: Math.max(3, v * 22)}} />)}</span>
        </button>
      </div>
      <span className="heart-sticker" aria-hidden="true"><Heart size={22} />いいね</span>
    </div>
    <audio ref={audio} src={sample.file} preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />
    {error && <p role="alert" className="art-error">試聴できませんでした。もう一度お試しください。</p>}
  </div>;
}
