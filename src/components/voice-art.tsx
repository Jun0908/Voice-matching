import { AudioLines, Headphones } from "lucide-react";

export function VoiceArt() {
  return <div className="voice-art" aria-hidden="true">
    <div className="art-circle art-left"><span className="art-side">L</span><Headphones className="art-headphones" strokeWidth={1.7} /><AudioLines className="art-wave" strokeWidth={2.5} /></div>
    <div className="art-circle art-right"><span className="art-side">R</span><Headphones className="art-headphones" strokeWidth={1.7} /><AudioLines className="art-wave" strokeWidth={2.5} /></div>
    <span className="art-sticker">どっちの声が好き？</span>
  </div>;
}
