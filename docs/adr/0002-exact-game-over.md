# ADR-0002: Exact game-over fit check

Game over is declared only when `anyFit(grid, tray)` proves no Tray Piece fits at any Grid position — never by a "board looks full" heuristic, which ends runs early and breaks player trust.

Consequence: `anyFit` is on the hot path after every placement and power-up, so it must stay a pure function over Grid + Pieces.
