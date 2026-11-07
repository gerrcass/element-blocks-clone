# ADR-0004: Pure logic seam in js/logic.js

All rules — `canPlace`, `placePiece`, `findClears`, `applyClears`, `anyFit`, `generateTray`, scoring — live in `js/logic.js` with no DOM access. `js/app.js` only renders state and forwards input.

Why: one seam, testable with `node --test` and no browser; UI bugs and rule bugs never share a file. New rules go in `logic.js` first, with a test, before any renderer touches them.
