# Element Blocks — Spec

## Problem Statement

Casual puzzle players want a 60-second-to-learn, endless block puzzle (Famobi Element Blocks / 1010! loop): drag nature pieces onto a grid, fill rows/columns to clear, chase a high score. Existing clones are heavy, ad-ridden, or browser-incompatible.

## Solution

A zero-build, mobile-first web game: 10×10 Grid, 3-Piece Tray, drag + tap + keyboard placement, 5 Elements, Stars + 3 Power-ups, exact Game over detection, local High score — deployable to GitHub Pages, rules proven by `node --test`.

## User Stories

1. As a player, I want to see a 10×10 Grid and a 3-Piece Tray on load, so that I can start playing instantly.
2. As a player, I want to drag a Piece onto the Grid with a ghost preview, so that I can see valid/invalid placement before dropping.
3. As a player, I want invalid drops to snap back, so that I don't lose a Piece by mistake.
4. As a player, I want tap-to-select + tap-to-place, so that I can play without precise dragging.
5. As a player, I want keyboard placement (arrows + Enter), so that I can play accessibly.
6. As a player, I want a full row/column to Clear automatically, so that 1010! rules feel familiar.
7. As a player, I want Score = placement + clear with Combo multiplier, so that multi-line clears feel rewarding.
8. As a player, I want Stars from Clears, so that I can earn recovery tools.
9. As a player, I want Hammer/Bomb/Shuffle Power-ups, so that I can recover from tight Grids.
10. As a player, I want Tray refill when empty, so that I always have 3 Pieces to plan with.
11. As a player, I want Game over only when no Piece fits anywhere, so that the run ends fairly.
12. As a player, I want High score persisted locally, so that I can chase my best across sessions.
13. As a player, I want synthesized sound + mute, so that feedback is juicy without audio assets.
14. As a player, I want element artwork (water/fire/earth/lightning/sun), so that the game feels nature-themed.
15. As a player, I want New Game / restart after Game over, so that I can replay immediately.
16. As a maintainer, I want rules in a pure seam tested by `node --test`, so that I can change rules without a browser.

## Implementation Decisions

- Grid 10×10; Piece set = full polyomino set (1–5 lines, squares, L/T/Z families), weighted (small frequent, 5-lines rare); Element per Piece, visual only.
- Scoring: `1` per placed Cell; Clear: `10 × clearedCells × linesCleared × comboStreak` (comboStreak = consecutive clearing placements, min 1). Stars: `1 per line + (lines-1)` bonus.
- Power-ups (Star costs): Hammer 5 (remove 1 Cell), Bomb 10 (remove 3×3), Shuffle 3 (re-roll Tray). Start: 1 Hammer free, 0 Stars.
- Tray: 3 Pieces, refill all 3 when empty. Generation: weighted random via injected RNG (seedable for tests), no rescue.
- Game over: exact `anyFit` over all Tray Pieces × all positions.
- Seam: `js/logic.js` pure (no DOM): `createGrid`, `canPlace`, `placePiece`, `findClears`, `applyClears`, `anyFit`, `generatePiece`, `generateTray`, `scoreForPlacement`, `applyPowerUp` helpers. `js/app.js` renders + input only.
- Persistence: `localStorage` keys `eb.highScore`, `eb.stars`, `eb.sound`. No backend.
- Audio: WebAudio oscillators, no assets. Reduced-motion respected.

## Testing Decisions

- Good test = external rule behavior via the pure seam (place → clear → score → game-over), never DOM internals.
- Runner: `node --test tests/` zero deps; CI runs it on PR and main.
- Prior art: none (greenfield) — tests in `tests/logic.test.js` are the first suite and set the style: `node:test` + `node:assert/strict`.
- Manual evidence: screenshot of live game in README + PR.

## Out of Scope

Online leaderboards, accounts, multiplayer, level packs, timed modes, Undo, piece rotation, animated piece physics, i18n.

## Further Notes

See `docs/grill-session.md` (autonomous, recommendations accepted), `GLOSSARY.md`, ADR-0001..0004.
