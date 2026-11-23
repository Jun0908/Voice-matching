# VOICE MATCH の画面デザイン

ユーザー提供の `pen-v33-dark.jpg` をもとに、既存の比較・録音・プロフィール・マッチ・分析画面を設計しています。

- 背景はチャコール、主操作はピンク。左の音声はブルー、右はミント、ラウンド進捗はイエローで示します。文字は自己配信の Zen Kaku Gothic New です。
- トップでは、重ねたカードからリサの音声を試聴できます。録音と比較にはそれぞれ直接入れます。
- 比較では、中央の聞き手を挟んで、ニックネーム、再生ボタン、音声から作った波形を配置します。左右へのスワイプと4つの選択ボタンを利用できます。
- 録音中は波形のアニメーションと経過時間を表示します。マイページのプロフィールカードでは保存した自己紹介を再生できます。
- スマートフォンでは下部のカプセル型ナビの中央に録音ボタンを置きます。デスクトップでは上部ナビと横並びのトップを使います。

## アバター素材

アバターは内蔵の imagegen で生成し、WebPに変換して同梱しています。候補者や利用者の写真ではなく、声を聴く操作を表す共通のビジュアルです。

| 素材 | 用途 |
| --- | --- |
| [headphones.webp](../public/art/headphones.webp) | トップのカード、候補アイコン、プロフィール、マッチ成立 |
| [listener.webp](../public/art/listener.webp) | 聴き比べの中央に配置する聞き手 |

<details>
<summary>使用した生成プロンプト</summary>

**ヘッドホン姿**

Horizontal 3:2 editorial studio product photograph of a sculptural warm ivory matte porcelain mannequin bust wearing thick plush ivory premium wireless over-ear headphones, eyes and eyebrows completely absent, smooth blank oval where eyes and nose would be, only a tiny shallow soft mouth indentation. Warm and approachable softly curved youthful abstract adult face, slight 10-degree tilt to right, lovely soft cascading shadow under headphone arch over head, imaginative modern Japanese music brand visual. Centered perfectly symmetrical composition from upper chest up with full overhead headband visible, occupies 90% of frame height, plain powder pastel pink backdrop, natural ambient occlusion, subtle ceramic and velour texture, bright soft beauty lighting. No text, no logos, no extra objects, no UI, photographic commercial quality.

**聞き手**

Square editorial studio 3D render of the head, ears, neck and shoulder line of a smooth abstract matte ivory ceramic adult mannequin, viewed head-on with both ears visibly symmetrical and exposed, featureless oval visage without eyes, nose or mouth. No headphones. Cropped bust from shoulders up in dead center with comfortable margin above. Soft shadows under chin, delicately sculpted ceramic silhouette. Seamless uniform very dark warm charcoal #201b1e studio backdrop with no ground, no text or graphics. This is a binaural listening diagram art asset for a Japanese audio app.

</details>
