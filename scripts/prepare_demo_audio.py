"""Build the redistributable Common Voice demo, retaining source provenance.

Run with the parent CosyVoice Python (soundfile, numpy, imageio_ffmpeg).
Two-pass EBU R128 loudness normalization; no pitch/formant changes.
"""
import argparse
import json
import subprocess
from pathlib import Path

import imageio_ffmpeg
import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--source', type=Path, default=ROOT.parent / 'voice-younger-vc/pairs/common-voice-ja-20s/full_v17/selected')
args = parser.parse_args()
ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
out = ROOT / 'public/audio/demo'
out.mkdir(parents=True, exist_ok=True)
voices = []
seen = set()
for folder in sorted(args.source.glob('rank_*')):
    meta = json.loads((folder / 'metadata.json').read_text(encoding='utf-8'))
    speaker = meta['anonymous_speaker_id']
    if speaker in seen:
        continue
    seen.add(speaker)
    i = len(voices) + 1
    source = folder / 'young_original.mp3'
    target = out / f'voice-{i:02}.wav'
    analysis = subprocess.run([ffmpeg, '-hide_banner', '-i', str(source), '-af', 'loudnorm=I=-20:TP=-2:LRA=7:print_format=json', '-f', 'null', '-'], capture_output=True, text=True, check=True)
    stats = json.JSONDecoder().raw_decode(analysis.stderr[analysis.stderr.rfind('{'):])[0]
    filt = f"loudnorm=I=-20:TP=-2:LRA=7:measured_I={stats['input_i']}:measured_TP={stats['input_tp']}:measured_LRA={stats['input_lra']}:measured_thresh={stats['input_thresh']}:offset={stats['target_offset']}:linear=true"
    subprocess.run([ffmpeg, '-v', 'error', '-y', '-i', str(source), '-af', filt, '-ar', '24000', '-ac', '1', '-c:a', 'pcm_s16le', str(target)], check=True)
    samples, sr = sf.read(target)
    check = subprocess.run([ffmpeg, '-hide_banner', '-i', str(target), '-af', 'loudnorm=I=-20:TP=-2:LRA=7:print_format=json', '-f', 'null', '-'], capture_output=True, text=True, check=True)
    measured = json.JSONDecoder().raw_decode(check.stderr[check.stderr.rfind('{'):])[0]
    assert np.isfinite(samples).all() and np.max(np.abs(samples)) < 1
    # Objective catalog tags only: durations are not personality inferences.
    duration = round(len(samples) / sr, 3)
    tags = ['短めのサンプル' if duration < 5 else '長めのサンプル', '日本語の読み上げ']
    # F0 via normalized autocorrelation on voiced frames; pause share via RMS.
    pitches, energies = [], []
    for offset in range(0, len(samples) - 1024, 512):
        frame = samples[offset:offset + 1024]
        energy = float(np.sqrt(np.mean(frame ** 2)))
        energies.append(energy)
        if energy < .015:
            continue
        frame = (frame - frame.mean()) * np.hanning(1024)
        corr = np.correlate(frame, frame, mode='full')[1023:]
        low, high = int(sr / 400), int(sr / 100)
        lag = int(np.argmax(corr[low:high])) + low
        if corr[lag] / max(corr[0], 1e-9) > .55:
            pitches.append(sr / lag)
    pitch = float(np.median(pitches)) if pitches else 0
    pause = float(np.mean(np.array(energies) < .015))
    waveform = [round(float(np.sqrt(np.mean(chunk**2))), 4) for chunk in np.array_split(samples, 48)]
    maxval = max(waveform) or 1
    waveform = [round(max(.08, x / maxval), 3) for x in waveform]
    voices.append(dict(id=f'voice-{i:02}', name=f'VOICE {i:02}', speakerId=speaker, sourceClip=meta['source_clip'], source='Mozilla Common Voice Japanese 17.0', license='CC0-1.0', file=f'/audio/demo/{target.name}', duration=duration, tags=tags, waveform=waveform, loudness=float(measured['input_i']), peak=float(measured['input_tp']), medianPitchHz=round(pitch, 1), pauseShare=round(pause, 3)))
    if len(voices) == 10:
        break
assert len(voices) == 10 and len(seen) == 10
pitch_median = np.median([v['medianPitchHz'] for v in voices])
pause_median = np.median([v['pauseShare'] for v in voices])
for voice in voices:
    voice['tags'] = ['高めの声' if voice['medianPitchHz'] >= pitch_median else '低めの声', '間をとる話し方' if voice['pauseShare'] >= pause_median else '連続的な話し方']
(ROOT / 'src/data').mkdir(parents=True, exist_ok=True)
(ROOT / 'src/data/voices.json').write_text(json.dumps(voices, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps([dict(id=v['id'], duration=v['duration'], loudness=v['loudness'], peak=v['peak']) for v in voices], indent=2))
