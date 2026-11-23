"""Optional VOICE MATCH Japanese zero-shot entrypoint. Never ships raw takes.

Use one licensed reference per invocation. All text and readings are explicit;
no earlier production's speaker, transcript or script is imported.
"""
import argparse
import json
import random
import sys
from pathlib import Path


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    for key in ('repo', 'model', 'reference', 'output-dir'):
        parser.add_argument('--' + key, type=Path, required=True)
    for key in ('speaker-label', 'reference-transcript', 'reference-reading', 'text', 'reading'):
        parser.add_argument('--' + key, required=True)
    parser.add_argument('--seed', type=int, default=20261123)
    parser.add_argument('--fp32', action='store_true')
    return parser.parse_args()


def main():
    args = parse_args()
    if not args.speaker_label.replace('-', '').replace('_', '').isalnum():
        raise ValueError('speaker-label must be alphanumeric, hyphen or underscore')
    for path in (args.repo, args.model, args.reference):
        if not path.exists():
            raise FileNotFoundError(path)
    if args.output_dir.resolve().is_relative_to(Path(__file__).resolve().parents[1] / 'public'):
        raise ValueError('Raw takes must stay outside public; audition before adoption')
    import numpy as np
    import torch
    import torchaudio
    random.seed(args.seed)
    np.random.seed(args.seed)
    torch.manual_seed(args.seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(args.seed)
    sys.path[:0] = [str(args.repo.resolve()), str(args.repo.resolve() / 'third_party/Matcha-TTS')]
    from cosyvoice.cli.cosyvoice import AutoModel
    model = AutoModel(model_dir=str(args.model.resolve()), load_trt=False, load_vllm=False, fp16=not args.fp32, llm_filename='llm.rl.pt')
    prompt = 'You are a helpful assistant.<|endofprompt|>' + args.reference_reading
    chunks = [x['tts_speech'].detach().cpu() for x in model.inference_zero_shot(args.reading, prompt, str(args.reference.resolve()), stream=False, speed=1.0, text_frontend=False)]
    if not chunks:
        raise RuntimeError('No audio generated')
    waveform = torch.cat(chunks, dim=1)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    output = args.output_dir / f'{args.speaker_label}-{args.seed}.wav'
    torchaudio.save(str(output), waveform, model.sample_rate)
    manifest = {k: str(v) if isinstance(v, Path) else v for k, v in vars(args).items()}
    manifest.update(output=str(output), duration=waveform.shape[1] / model.sample_rate, engine='CosyVoice3', speed=1.0, same_language='ja-ja', adoption='unreviewed', audition_required=['reading', 'ending', 'pauses', 'headphones', 'level', 'swap-left-right'])
    output.with_suffix('.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    print(output)


if __name__ == '__main__':
    main()
