# Element Blocks

Endless tile-matching puzzle: drag element pieces onto a 10×10 grid, fill rows/columns to clear, survive. Famobi Element Blocks / 1010! loop.

## Language

**Grid**:
The 10×10 board a piece is placed on. A cell is either empty or holds one element tile.
_Avoid_: board (use Grid for the 10×10 specifically), field

**Cell**:
One square of the Grid, addressed by (row, col) with row 0 at top.
_Avoid_: tile (a tile is placed content; a cell is the slot)

**Piece**:
A set of cells in a fixed polyomino shape (e.g. 3-line, L-tromino, 2×2 square), generated into the Tray.
_Avoid_: block (reserve "block" for the game title / casual speech), shape (use Piece in specs/tests)

**Tray**:
The three Piece slots at the bottom of the screen. Refills with three new Pieces when all three are placed.
_Avoid_: hand, inventory (power-ups live in the Power-up bar, not the Tray)

**Clear**:
Removal of every Cell in a full row or full column after a placement completes it.
_Avoid_: line delete, pop

**Element**:
One of five natures — water, fire, earth, lightning, sun — assigned to a Piece; visual identity only, never changes placement rules.
_Avoid_: type, colour (colour is a rendering of Element)

**Star**:
The in-game currency earned from Clears (1 per line, +1 per extra simultaneous line), spent on Power-ups.
_Avoid_: coin, gem, point (points are Score)

**Power-up**:
A spendable recovery tool: Hammer (remove 1 Cell), Bomb (remove 3×3), Shuffle (re-roll Tray). Activated from the Power-up bar, then applied to the Grid/Tray.
_Avoid_: item, boost, ability

**Score**:
The run total: 1 per placed Cell + 10 per cleared Cell × lines × combo streak. Compared against High score at run end.
_Avoid_: points (use Score), stars

**Combo**:
Consecutive placements (with no non-clearing placement between) that each produce at least one Clear; multiplies clear score.
_Avoid_: streak (Combo is the multiplier concept; streak is its count)

**Game over**:
The state where no Piece in the Tray fits in any Grid position (exact fit check). Ends the run.
_Avoid_: dead, stuck, board full
