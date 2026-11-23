# デモ音声の出典と処理

初版は合成音声を配信せず、既存 Common Voice Japanese 17.0 の読み上げ10話者を使用する。実在会員の自己紹介ではなく、名前・人物写真・性格を付与しない。

- 元素材: `../voice-younger-vc/pairs/common-voice-ja-20s/full_v17/selected/rank_*/young_original.mp3`
- 元の話者ID・出典クリップ名・採用ファイル・長さ・特徴・測定値: [`src/data/voices.json`](../src/data/voices.json)
- 利用条件: [Mozilla Common Voice Terms](https://commonvoice.mozilla.org/en/terms)、[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)。2026-11-23確認。データセットはCC0として公開されている。話者の特定を試みず、本人の推薦・参加・交際意思を示唆しない。
- 比較対象は匿名IDが異なる10人。同じ話者を重複採用しない。
- FFmpeg の2パス `loudnorm`、目標 −20 LUFS / true peak −2 dBTP、24 kHz / mono / PCM16。
- 実測は −20.90〜−19.90 LUFS、true peak −6.16〜−1.97 dBTP。全サンプルは有限値で、PCMクリッピングなし。
- ピッチ・フォルマント・話速の変更なし。各ファイルは一人の単独クリップ。
- 波形は音声から48区間のRMSを抽出。再生中は AudioContext の経過時間を反映する。
- 特徴タグ: 自己相関による有声音の推定基本周波数中央値と、RMS 0.015未満の区間割合を、10素材の中央値で分割。「高め／低めの声」「間をとる／連続的な話し方」はこのサンプル集合内での目安。感情・人柄の推定や検証済み心理分析ではない。
- デモ相互関心の固定データは `voice-01 / 04 / 07 / 10`。実際の話者の意思と無関係。

## 再作成

アプリの利用にはPythonも外部モデルも不要。素材を再作成する場合だけ、親の既存Python環境を利用する。

```powershell
& '..\.venvs\cosyvoice\Scripts\python.exe' scripts/prepare_demo_audio.py
```

## 任意の合成音声作成

`scripts/generate_demo.py` は以前の作品の固定台本・読み・参照話者を使用しない独立入口。参照音声、参照の正確な本文と読み、生成本文と読みを明示する。CosyVoice3 / `llm.rl.pt`、日本語同士、単一参照、速度1.0。親の既存スクリプトと過去作品の設定は変更しない。

```powershell
& '..\.venvs\cosyvoice\Scripts\python.exe' scripts/generate_demo.py --help
```

必須引数: `--repo --model --reference --output-dir --speaker-label --reference-transcript --reference-reading --text --reading`。読みはカタカナで入力する。参照音声の許諾を確認し、出力は公開フォルダ外へ保存する。

合成音声を採用する場合は、まず異なる2参照で同じ短い本文を生成する。読み間違い・語尾欠落・間・イヤホンでの聴き取りを人が確認し、音量の正規化と左右の入れ替え試聴を経て採用する。採用時は目録と画面の種別を「合成デモ音声」に変更する。初版は既存の読み上げを採用したため、この合成試聴工程は未実施・適用外。

公開フォルダの未採用WAVはGit対象外。配布物は目録の `voice-01.wav` 〜 `voice-10.wav` のみ。
