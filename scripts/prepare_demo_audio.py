"""Prepare the named ASMR clips from the audition WAVs and their credits."""
import json
import re
import subprocess
from pathlib import Path

import imageio_ffmpeg
import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/audio/asmr"
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
TARGET_LUFS = -25.0


def measure(path):
    result = subprocess.run(
        [FFMPEG, "-hide_banner", "-i", str(path), "-af", "loudnorm=print_format=json",
         "-f", "null", "-"], check=True, capture_output=True,
    )
    log = result.stderr.decode("utf-8", errors="replace")
    stats = json.JSONDecoder().raw_decode(log[log.rindex("{"):])[0]
    return float(stats["input_i"]), float(stats["input_tp"])


def auditions():
    for collection in ["risa-whisper", "whisper-quartet", "whisper-five-02"]:
        folder = ROOT / "auditions" / collection
        credits = (folder / "CREDIT.txt").read_text(encoding="utf-8-sig").strip()
        for block in re.split(r"\n\s*\n", credits):
            lines = block.splitlines()
            if collection == "risa-whisper":
                name, filename, slug = "リサ", "risa-whisper.wav", "risa"
            else:
                name, filename, _ = lines.pop(0).split()
                slug = Path(filename).stem
            credit, script, terms = lines
            yield folder / filename, slug, name, credit, script, terms


def prepare(path, slug, name, credit, script, terms):
    target = OUT / f"{slug}.wav"
    loudness, _ = measure(path)
    gain = TARGET_LUFS - loudness
    subprocess.run(
        [FFMPEG, "-v", "error", "-y", "-i", str(path), "-af",
         f"volume={gain:.2f}dB,aresample=96000,alimiter=limit=0.72:level=false:latency=true",
         "-ar", "24000", "-ac", "1", "-c:a", "pcm_s16le", str(target)], check=True,
    )
    samples, rate = sf.read(target)
    loudness, peak = measure(target)
    if abs(loudness - TARGET_LUFS) >= 1 or peak > -1:
        raise ValueError(f"{name}: {loudness} LUFS, {peak} dBTP")
    rms = [float(np.sqrt(np.mean(chunk ** 2))) for chunk in np.array_split(samples, 48)]
    window = rate // 50
    frames = samples[:len(samples) // window * window].reshape(-1, window)
    pause = float(np.mean(np.sqrt(np.mean(frames ** 2, axis=1)) < 0.008))
    speaker, style = credit.removeprefix("VOICEVOX:").rstrip("）").split("（")
    return dict(id=f"asmr-{slug}", name=name, file=f"/audio/asmr/{target.name}",
                speakerId=speaker, source=credit, sourceClip=str(path.relative_to(ROOT).as_posix()),
                license=terms, script=script, style=style, duration=round(len(samples) / rate, 3),
                loudness=loudness, peak=peak, pauseShare=round(pause, 3),
                waveform=[round(max(.08, value / max(rms)), 3) for value in rms])


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    voices = [prepare(*entry) for entry in auditions()]
    median = np.median([v["pauseShare"] for v in voices])
    for voice in voices:
        voice["tags"] = [voice["style"], "間をとる話し方" if voice["pauseShare"] >= median else "なめらかな話し方"]
    (ROOT / "src/data/voices.json").write_text(
        json.dumps(voices, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for voice in voices:
        print(voice["id"], voice["duration"], voice["loudness"], voice["peak"])
