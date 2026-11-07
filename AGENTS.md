# Element Blocks — Agent Guide

Mobile-first 1010!-style puzzle (Famobi Element Blocks clone). Zero-build vanilla: `index.html` + `js/logic.js` (pure rules seam) + `js/app.js` (DOM/input) + `css/style.css`. Tests: `node --test tests/`. Deploy: GitHub Pages on `main`.

## Agent skills

### Issue tracker
GitHub issues via `gh` CLI; local mirror in `.scratch/element-blocks/issues/`. See `docs/agents/issue-tracker.md`.

### Triage labels
`ready-for-agent` = agent-grabbable. See `docs/agents/triage-labels.md`.

### Domain docs
Single-context `GLOSSARY.md` + `docs/adr/`. See `docs/agents/domain.md`.

## Rules

- Read `GLOSSARY.md` + `docs/SPEC.md` before changing rules. Use glossary terms (Grid, Piece, Tray, Clear, Star, Power-up, Combo, Game over).
- Rules live ONLY in `js/logic.js` (no DOM). `js/app.js` renders + forwards input.
- Every rule change: failing test first in `tests/logic.test.js`, then `node --test` green.
- Exact Game over only (`anyFit`); never a "board full" heuristic. (ADR-0002)
- No deps, no build. Commit small, push to integration branch, PR with evidence (see `/pr` skill).
