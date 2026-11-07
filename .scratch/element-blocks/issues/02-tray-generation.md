# 02: Tray generation + anyFit game-over

**What to build:** Weighted Piece generation into 3-slot Tray, refill when empty, exact anyFit Game over detection.

**Blocked by:** 01-core-logic-seam

**Status:** ready-for-agent

- [ ] generateTray returns 3 Pieces from full polyomino set, weighted (5-lines rare)
- [ ] generatePiece accepts seeded RNG (deterministic tests)
- [ ] anyFit(grid, tray) true iff some Piece fits somewhere; false only when truly stuck
- [ ] Tray refill triggers only when all 3 placed
- [ ] node --test green incl. seeded determinism + anyFit edge cases
