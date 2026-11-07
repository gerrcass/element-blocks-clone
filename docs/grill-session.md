# Grill-with-docs session — Element Blocks clone

> Autonomous mode: user said "don't wait, choose what you recommend".
> Every ❓ below records the recommended answer, accepted by default.
> Frontier is empty — no branch left silently assumed.

## Objective (challenging)

Build a **web-playable, mobile-first, endless 1010!-style block puzzle**
faithful to Famobi Element Blocks' loop (3-piece tray → drag onto grid →
fill rows/columns → clear → survive longer), with nature-element theming,
star economy, 3 power-ups, exact game-over detection, ghost preview,
tap-to-place fallback, keyboard play, synthesized sound, local high-score —
as a **zero-build static site** deployable to GitHub Pages, with a pure,
deterministically testable core logic seam and 100% ticket coverage.

Non-negotiable bar: a player on a phone can start, place, clear, and
game-over in <60s with no tutorial, and an agent can prove the rules
with `node --test` without a browser.

## Round 1 — Frontier (all settled by recommendation)

❓ **Q1 - Grid size**: 8×8 (compact, forgiving) vs 10×10 (1010! standard, harder, more faithful).
➡️ **10×10.** Faithful to 1010!/Element Blocks; harder hunt for space is the game.

❓ **Q2 - Placement input**: drag-only vs drag + tap-to-select/tap-to-place + keyboard.
➡️ **All three.** Drag is primary; tap and keyboard are required for accessibility and for agents to drive it headlessly.

❓ **Q3 - Shape set**: minimal 8 vs full polyomino set (19 shapes: 1–5 lines, squares, L/T/Z families).
➡️ **Full set, weighted.** Small pieces frequent, 5-lines rare. Prevents "always one big piece" degeneracy.

❓ **Q4 - Scoring**: flat vs placement + clear with combo/multiplier.
➡️ **Placement 1/cell + clear 10/cell × lines-cleared × combo streak.** Rewards multi-line clears and consecutive clears; easy to test exactly.

❓ **Q5 - Power-ups**: none vs stars + Hammer / Bomb / Shuffle.
➡️ **Stars earned on clears (1/line, +1 per extra simultaneous line), spent on Hammer (remove 1), Bomb (3×3), Shuffle (re-roll tray).** Default inventory: 1 Hammer. This is the "recover from tight boards" loop from the brief.

❓ **Q6 - Theme**: single colour vs 5 elements (water/fire/earth/lightning/sun) per piece.
➡️ **5 elements, assigned per piece, icons are CSS/SVG glyphs (no image assets).** Each tile shows its element; rarity is visual only, rules stay element-agnostic.

❓ **Q7 - Stack**: framework (React/Vite) vs vanilla zero-build.
➡️ **Vanilla, zero build, `index.html + js/logic.js + js/app.js + css/style.css`.** Deploys to Pages with no CI build, logic testable in Node, no dependency lock-in. (ADR-0001)

❓ **Q8 - Game over**: "board full" heuristic vs exact "no tray piece fits anywhere".
➡️ **Exact fit check over all tray pieces × all positions.** A heuristic ends runs early and breaks trust. (ADR-0002)

❓ **Q9 - Generation fairness**: pure random vs "at least one fits if possible".
➡️ **Pure weighted random, no rescue.** Rescue generation hides bad luck and makes game-over nondeterministic; exact detection (Q8) already guarantees a fair ending.

❓ **Q10 - Persistence**: backend leaderboard vs localStorage high-score/stars/settings.
➡️ **localStorage only.** No backend, no accounts, works offline on Pages. (ADR-0003)

❓ **Q11 - Sound**: asset files vs WebAudio synthesis.
➡️ **WebAudio synthesis** (place/clear/power-up/game-over blips), mute toggle, no assets.

❓ **Q12 - Scope cuts**: online leaderboard, multiplayer, level packs, undo.
➡️ **All out of scope.** Undo is replaced by Hammer/Bomb (spend to recover). See SPEC Out of Scope.

## Round 2 — Frontier (unblocked by Round 1)

❓ **Q13 - Logic seam**: UI-coupled vs pure `logic.js` (no DOM).
➡️ **Pure `logic.js`**: `canPlace`, `placePiece`, `findClears`, `applyClears`, `anyFit`, `generateTray`, `scorePlacement`. UI is a thin renderer. This single seam is where all ticket tests live. (ADR-0004)

❓ **Q14 - Ghost preview**: show validity on drag yes/no.
➡️ **Yes** — green/red ghost + snap-back on invalid drop. Without it the game feels broken on mobile.

❓ **Q15 - Tray refill**: refill per-piece vs refill all three when empty.
➡️ **Refill all three when empty** (1010! rule). Keeps the "plan with 3" decision intact.

❓ **Q16 - Testing bar**: manual only vs Node test runner, no deps.
➡️ **`node --test tests/`**, zero deps, CI runs it. Every ticket ships a failing-then-passing test at the logic seam.

❓ **Q17 - Deployment**: manual upload vs GitHub Pages via Actions.
➡️ **Pages via Actions on `main`**, workflow in-repo, live URL in README.

## Decisions captured as ADRs

- ADR-0001: zero-build vanilla stack
- ADR-0002: exact game-over fit check
- ADR-0003: localStorage-only persistence
- ADR-0004: pure logic seam (`js/logic.js`)

## Shared understanding

Frontier empty. Proceed to `/to-spec` → `/to-tickets` → `/writing-for-agents` → `/implement-spec`.
