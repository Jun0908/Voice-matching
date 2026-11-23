"use client";
import { useEffect, useRef, type RefObject } from "react";
export function RecordedAudio({ blob, label, audioRef }: { blob: Blob; label: string; audioRef?: RefObject<HTMLAudioElement | null> }) {
  const localRef = useRef<HTMLAudioElement | null>(null);
  const ref = audioRef ?? localRef;
  useEffect(() => {
    const element = ref.current;
    const url = URL.createObjectURL(blob);
    if (element) { element.src = url; element.load(); }
    return () => { element?.pause(); element?.removeAttribute("src"); URL.revokeObjectURL(url); };
  }, [blob, ref]);
  return <audio ref={ref} controls preload="metadata" aria-label={label} onPlay={e => document.querySelectorAll("audio").forEach(a => { if (a !== e.currentTarget) a.pause(); })} />;
}
