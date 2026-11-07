// Element Blocks — pure rules seam (no DOM). Grid 10x10, cell = null | element string.
export const SIZE = 10;
export const ELEMENTS = ['water', 'fire', 'earth', 'lightning', 'sun'];
export const COSTS = { hammer: 5, bomb: 10, shuffle: 3 };

// Piece shapes as [row,col] offsets, weighted (small frequent, 5-lines rare).
const SHAPES = [
  { cells: [[0,0]], w: 8 },
  { cells: [[0,0],[0,1]], w: 8 }, { cells: [[0,0],[1,0]], w: 8 },
  { cells: [[0,0],[0,1],[0,2]], w: 9 }, { cells: [[0,0],[1,0],[2,0]], w: 9 },
  { cells: [[0,0],[0,1],[0,2],[0,3]], w: 6 }, { cells: [[0,0],[1,0],[2,0],[3,0]], w: 6 },
  { cells: [[0,0],[0,1],[0,2],[0,3],[0,4]], w: 3 }, { cells: [[0,0],[1,0],[2,0],[3,0],[4,0]], w: 3 },
  { cells: [[0,0],[0,1],[1,0],[1,1]], w: 8 },
  { cells: [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]], w: 3 },
  // L/J/T/S/Z families (both orientations where distinct)
  { cells: [[0,0],[1,0],[2,0],[2,1]], w: 5 }, { cells: [[0,0],[0,1],[0,2],[1,2]], w: 5 },
  { cells: [[0,1],[1,1],[2,1],[2,0]], w: 5 }, { cells: [[0,0],[1,0],[1,1],[1,2]], w: 5 },
  { cells: [[0,0],[1,0],[2,0],[2,-1]] , w: 5 }, { cells: [[0,0],[0,1],[0,2],[1,0]], w: 5 },
  { cells: [[0,0],[1,0],[2,0],[1,1]], w: 5 }, { cells: [[0,1],[1,0],[1,1],[1,2]], w: 5 },
  { cells: [[0,1],[1,1],[2,1],[1,0]], w: 5 }, { cells: [[0,0],[0,1],[0,2],[1,1]], w: 5 },
  { cells: [[0,0],[1,0],[1,1],[2,1]], w: 5 }, { cells: [[0,1],[0,2],[1,0],[1,1]], w: 5 },
  { cells: [[0,0],[1,0],[1,1],[2,1]] , w: 5 },
];
export const SHAPES_LIST = SHAPES;

export function createGrid() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generatePiece(rng = Math.random) {
  const total = SHAPES.reduce((s, x) => s + x.w, 0);
  let r = rng() * total;
  let shape = SHAPES[0];
  for (const s of SHAPES) { if ((r -= s.w) < 0) { shape = s; break; } }
  const element = ELEMENTS[Math.floor(rng() * ELEMENTS.length)];
  return { cells: shape.cells.map(c => [...c]), element, id: Math.random().toString(36).slice(2) };
}

export function generateTray(rng = Math.random, n = 3) {
  return Array.from({ length: n }, () => generatePiece(rng));
}

// Deterministic RNG factory for tests / seeded runs.
export function seededRng(seed) { return mulberry32(seed); }

export function canPlace(grid, piece, row, col) {
  for (const [dr, dc] of piece.cells) {
    const r = row + dr, c = col + dc;
    if (r < 0 || r >= SIZE || c < 0 || c >= SIZE || grid[r][c] !== null) return false;
  }
  return true;
}

export function placePiece(grid, piece, row, col) {
  if (!canPlace(grid, piece, row, col)) return false;
  for (const [dr, dc] of piece.cells) grid[row + dr][col + dc] = piece.element;
  return true;
}

export function findClears(grid) {
  const rows = [], cols = [];
  for (let r = 0; r < SIZE; r++) if (grid[r].every(c => c !== null)) rows.push(r);
  for (let c = 0; c < SIZE; c++) { let full = true; for (let r = 0; r < SIZE; r++) if (grid[r][c] === null) { full = false; break; } if (full) cols.push(c); }
  return { rows, cols, lines: rows.length + cols.length };
}

export function applyClears(grid, clears) {
  const seen = new Set();
  let cleared = 0;
  for (const r of clears.rows) for (let c = 0; c < SIZE; c++) { const k = r * SIZE + c; if (!seen.has(k)) { seen.add(k); if (grid[r][c] !== null) cleared++; grid[r][c] = null; } }
  for (const c of clears.cols) for (let r = 0; r < SIZE; r++) { const k = r * SIZE + c; if (!seen.has(k)) { seen.add(k); if (grid[r][c] !== null) cleared++; grid[r][c] = null; } }
  return cleared;
}

export function scoreForPlacement(piece, clears, clearedCells, combo) {
  const placement = piece.cells.length;
  if (clears.lines === 0) return { total: placement, stars: 0, combo: 0, placement };
  const streak = Math.max(1, combo);
  const clearScore = 10 * clearedCells * clears.lines * streak;
  const stars = clears.lines + (clears.lines - 1);
  return { total: placement + clearScore, stars, combo: streak, placement, clearScore };
}

export function anyFit(grid, tray) {
  for (const piece of tray) {
    if (!piece) continue;
    // piece bounding box
    let maxR = 0, maxC = 0, minR = Infinity, minC = Infinity;
    for (const [r, c] of piece.cells) { maxR = Math.max(maxR, r); minR = Math.min(minR, r); maxC = Math.max(maxC, c); minC = Math.min(minC, c); }
    for (let r = -minR; r <= SIZE - 1 - maxR; r++)
      for (let c = -minC; c <= SIZE - 1 - maxC; c++)
        if (canPlace(grid, piece, r, c)) return true;
  }
  return false;
}

export function applyHammer(grid, r, c) {
  if (r < 0 || r >= SIZE || c < 0 || c >= SIZE || grid[r][c] === null) return false;
  grid[r][c] = null; return true;
}
export function applyBomb(grid, r, c) {
  let removed = 0;
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    const rr = r + dr, cc = c + dc;
    if (rr >= 0 && rr < SIZE && cc >= 0 && cc < SIZE && grid[rr][cc] !== null) { grid[rr][cc] = null; removed++; }
  }
  return removed;
}
export function emptyCount(grid) { return grid.flat().filter(c => c === null).length; }
