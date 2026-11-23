# ASMRデモ音声

比較では恋愛をテーマにした合成音声10本を使用します。ニックネームと台詞はデモ用です。音源キャラクターが同じ候補は別のラウンドに登場します。

| ニックネーム | クレジット・利用条件 | 秒数 |
| --- | --- | ---: |
| リサ | [VOICEVOX:九州そら（ささやき）](https://zunko.jp/con_ongen_kiyaku.html) | 10.0 |
| ゆい | [VOICEVOX:満別花丸（ささやき）](https://100hanamaru.wixsite.com/manbetsu-hanamaru/rule) | 6.1 |
| あかり | [VOICEVOX:四国めたん（ささやき）](https://zunko.jp/con_ongen_kiyaku.html) | 10.1 |
| しおり | [VOICEVOX:中部つるぎ（ヒソヒソ）](https://zunko.jp/con_ongen_kiyaku.html) | 9.8 |
| さな | [VOICEVOX:あんこもん（ささやき）](https://zunko.jp/con_ongen_kiyaku.html) | 9.8 |
| すず | [VOICEVOX:ナースロボ＿タイプＴ（内緒話）](https://www.krnr.top/rules) | 10.2 |
| ひな | [VOICEVOX:満別花丸（ささやき）](https://100hanamaru.wixsite.com/manbetsu-hanamaru/rule) | 10.2 |
| なぎ | [VOICEVOX:九州そら（ささやき）](https://zunko.jp/con_ongen_kiyaku.html) | 9.8 |
| まき | [VOICEVOX:ずんだもん（ヒソヒソ）](https://zunko.jp/con_ongen_kiyaku.html) | 10.1 |
| れい | [VOICEVOX:四国めたん（ヒソヒソ）](https://zunko.jp/con_ongen_kiyaku.html) | 10.2 |

## 再作成

音声は `public/audio/asmr` に、台詞・音量・波形・クレジットは `src/data/voices.json` に収録しています。アプリの起動時に音声合成は不要です。

元のWAVと `CREDIT.txt` がある開発環境で、NumPy・SoundFile・imageio-ffmpegを備えたPythonから `python scripts/prepare_demo_audio.py` を実行します。採用テイクの音量を約 −25 LUFS に揃え、ピークを抑えたモノラルWAVを作成します。左右定位は再生時に適用します。

旧カタログの比較結果と関心は旧保存枠に残し、新しい候補は新しい履歴で始めます。プロフィールと再生設定は引き継ぎます。
