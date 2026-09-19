# 246-gesshoku-no-keiyakusha LEARNINGS

## 2026-09-19 フォルダ改名・ハーネス操作盤
- `246-day070` → `246-gesshoku-no-keiyakusha`。エントリを `gesshoku.html` から `index.html` へ。
- 320×224の論理座標を `#screen-wrap` 実寸へ `setTransform` で伸ばし、`data-logical-*` はCSS寸法にしてハーネスの等倍スケール判定を通す。
- 十字＋A/Bを操作盤へ。ミュート `tg.246.mute`、明示ポーズを追加。
- harness PASS: `docs/harness-reports/246-gesshoku-no-keiyakusha-2026-09-19T07-15-14-221Z.md`。iPhoneシミュレータは未実施。
