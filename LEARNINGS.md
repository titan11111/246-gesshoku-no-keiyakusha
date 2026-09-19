# 246-gesshoku-no-keiyakusha LEARNINGS

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
