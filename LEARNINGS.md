# 246-gesshoku-no-keiyakusha LEARNINGS

## 2026-09-20 遊びやすさ・ディストピアタイトル改修
- タイトルを「中央統制局・第九封鎖区」の緊急放送画面へ刷新。赤い月、監視灯、識別番号、走査線、警告帯を同じ画面にまとめ、ゲーム開始前に世界の圧力が伝わる構成にした。
- Canvas内の選択肢を直接タップ可能にした。描画時に各行の論理座標を `uiTapRects` へ保持し、実Canvas寸法から320×224へ逆変換して選択・決定する。
- `tg.246.save.v2` へ探索状態をオートセーブし、タイトルから再開できるようにした。新規契約は旧セーブを明示的に消して開始する。
- 初回説明を4画面から2画面へ短縮し、HUDに現在目的を常時表示。A/Bボタンの場面別役割も操作盤へ記載した。
- 検証: game-harness 14項目PASS。Playwrightの390×844タッチ環境で「新規開始→説明送り→Bメニュー→どうぐを直接タップ→再読込→続きから」を実行し、コンソールエラー0件を確認。
- 目視: 390×844、DPR 2のタイトル画面とフィールドメニューをスクリーンショットで確認。文字重なりと操作盤は問題なし。

## 2026-09-19 フォルダ改名・ハーネス操作盤
- `246-day070` → `246-gesshoku-no-keiyakusha`。エントリを `gesshoku.html` から `index.html` へ。
- 320×224の論理座標を `#screen-wrap` 実寸へ `setTransform` で伸ばし、`data-logical-*` はCSS寸法にしてハーネスの等倍スケール判定を通す。
- 十字＋A/Bを操作盤へ。ミュート `tg.246.mute`、明示ポーズを追加。
- harness PASS: `docs/harness-reports/246-gesshoku-no-keiyakusha-2026-09-19T07-15-14-221Z.md`。iPhoneシミュレータは未実施。

## 2026-09-19 公開（GitHub Pages）
- URL: https://titan11111.github.io/246-gesshoku-no-keiyakusha/ （HTTP 200・Pages status=built を実測）
- publish.sh が OGP タグを index.html へ挿入したため、**公開実体で harness を取り直した**: `docs/harness-reports/246-gesshoku-no-keiyakusha-2026-09-19T07-20-29-052Z.md` → 14項目すべて PASS
- 学び: publish.sh の OGP 挿入は harness の後に走る。公開後の実体で1回取り直さないと、証跡が公開物と一致しない
- 未検証: iPhone実機（harness は Playwright/WebKit 390px のみ）

## 2026-09-19 旧URLの404を修復
- 症状: `https://titan11111.github.io/246-gesshoku-no-keiyakusha/gesshoku.html` が **404**。本体（`/246-gesshoku-no-keiyakusha/`）は 200 で生きていた
- 原因: エントリを `gesshoku.html` → `index.html` へ改名したため、**改名前に配ったリンクだけが死んだ**。リポジトリもPagesも正常
- 対処: `gesshoku.html` を index.html へのリダイレクト専用ページとして復活（meta refresh ＋ `location.replace()` の二段。`?query`・`#hash` も引き継ぐ）
- 検証: 旧URL **404 → 200** を Pages ビルド完了後に実測。本体URLも 200 のまま
- 学び: **エントリ名を変えたら旧名をリダイレクトとして残す**。フォルダ改名と違い「本体は200」なので気づけない
- 検出: `_tools/check-legacy-entry.sh` で機械検出できるようにした（245で同じ事故が出たのを機に新設）

### 【訂正】上の「404だった」は誤り（2026-09-19 同日中に判明）
- gitで裏を取った結果、`gesshoku.html` は**このリポジトリで一度も公開されていなかった**（`git cat-file -e <修復コミット>^:gesshoku.html` → 不在）。
  改名はローカルフォルダ内で完結しており、リポジトリは改名**後**に作成されている
- つまり `…/246-gesshoku-no-keiyakusha/gesshoku.html` というURLは**元から存在しない**。「配ったリンクが死んだ」という上の記述は**誤り**
- 置いたリダイレクトは**害はないが、壊れていたものを直したわけではない**（将来その名前で来た人を受けるだけの保険）
- 誤認の原因: LEARNINGS.md の本文を証拠として扱ったこと。**本文は作業メモであって証拠ではない。証拠はgit履歴**
- 検出器も v2 で「git履歴に存在 かつ HEADに不在」判定へ作り直した（`_tools/check-legacy-entry.sh`）

## 2026-09-21 公開（9/20改修分の反映）
- URL: https://titan11111.github.io/246-gesshoku-no-keiyakusha/ （HTTP 200・Pages status=built・`title=246｜月蝕ノ契約者` を実測）
- commit: `2c974ae`（未push 0 を確認）。Pages ビルドの commit SHA が `2c974ae...` と一致することを `gh api .../pages/builds/latest` で確認
- **本番の実体で反映を確認**: `script.js` に `中央統制局`×2 / `tg.246.save.v2`×1 がヒット（＝新タイトルとオートセーブが配信されている）。`script.js` `style.css` とも HTTP 200
- 公開後 harness: `docs/harness-reports/246-gesshoku-no-keiyakusha-2026-09-20T23-40-08-155Z.md` → 14項目 PASS（通信量 0.04MB）
- 鉄則8チェック: `_tools/check-legacy-entry.sh 246-gesshoku-no-keiyakusha` → 旧エントリ0件・404は0件（exit 0）
