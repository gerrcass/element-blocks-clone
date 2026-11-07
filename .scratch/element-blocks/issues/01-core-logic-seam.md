# 01: Core logic seam — grid, place, clear, score

**What to build:** Pure rules seam on a 10×10 Grid: place a Piece, detect full rows/columns, Clear them, compute Score with Combo. No UI.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] `canPlace` rejects out-of-bounds and overlapping placements, accepts empty in-bounds
- [ ] `placePiece` writes Cells atomically and does not mutate on invalid
- [ ] `findClears` returns all full rows + full columns (simultaneous)
- [ ] `applyClears` empties exactly the cleared Cells
- [ ] `scoreForPlacement`: 1/Cell + `10 × cleared × lines × combo`; combo resets on non-clearing placement
- [ ] `node --test tests/` green, zero deps
