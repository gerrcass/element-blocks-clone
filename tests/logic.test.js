// External rule behavior via the pure seam — never DOM (see docs/SPEC.md).
// Style: node:test + node:assert/strict. Run: node --test tests/
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SIZE, createGrid, canPlace, placePiece, findClears, applyClears,
  scoreForPlacement, anyFit, generatePiece, generateTray, seededRng,
  applyHammer, applyBomb, COSTS, SHAPES_LIST,
} from '../js/logic.js';

const P = (cells, element = 'water') => ({ cells, element, id: 't' });

describe('canPlace / placePiece', () => {
  test('accepts empty in-bounds', () => {
    const g = createGrid();
    assert.equal(canPlace(g, P([[0, 0]]), 0, 0), true);
    assert.equal(canPlace(g, P([[0, 0], [0, 1]]), 9, 8), true);
  });
  test('rejects out-of-bounds', () => {
    const g = createGrid();
    assert.equal(canPlace(g, P([[0, 0], [0, 1]]), 0, 9), false);
    assert.equal(canPlace(g, P([[0, 0], [1, 0]]), 9, 0), false);
    assert.equal(canPlace(g, P([[0, 0]]), -1, 0), false);
  });
  test('rejects overlap; placePiece does not mutate on invalid', () => {
    const g = createGrid();
    assert.equal(placePiece(g, P([[0, 0]]), 5, 5), true);
    const before = JSON.stringify(g);
    assert.equal(canPlace(g, P([[0, 0]]), 5, 5), false);
    assert.equal(placePiece(g, P([[0, 0]]), 5, 5), false);
    assert.equal(JSON.stringify(g), before);
    assert.equal(g[5][5], 'water');
  });
});

describe('findClears / applyClears', () => {
  test('single full row', () => {
    const g = createGrid();
    g[3] = Array(SIZE).fill('fire');
    const c = findClears(g);
    assert.deepEqual(c.rows, [3]);
    assert.deepEqual(c.cols, []);
    assert.equal(c.lines, 1);
    assert.equal(applyClears(g, c), 10);
    assert.equal(g[3].every(v => v === null), true);
  });
  test('simultaneous row + column share the intersection counted once', () => {
    const g = createGrid();
    for (let i = 0; i < SIZE; i++) { g[0][i] = 'earth'; g[i][0] = 'earth'; }
    const c = findClears(g);
    assert.deepEqual(c.rows, [0]);
    assert.deepEqual(c.cols, [0]);
    assert.equal(c.lines, 2);
    assert.equal(applyClears(g, c), 19); // 10 + 10 - 1 shared
    assert.equal(g[0][0], null);
  });
  test('nothing full -> no clears', () => {
    const g = createGrid();
    g[0][0] = 'sun';
    const c = findClears(g);
    assert.equal(c.lines, 0);
    assert.equal(applyClears(g, c), 0);
  });
});

describe('scoreForPlacement', () => {
  test('no clear: 1 per Cell, combo resets to 0', () => {
    const r = scoreForPlacement(P([[0, 0], [0, 1], [0, 2]]), { rows: [], cols: [], lines: 0 }, 0, 3);
    assert.equal(r.total, 3);
    assert.equal(r.combo, 0);
    assert.equal(r.stars, 0);
  });
  test('1 line: placement + 10*cleared*lines*combo', () => {
    const r = scoreForPlacement(P([[0, 0]]), { rows: [0], cols: [], lines: 1 }, 10, 1);
    assert.equal(r.total, 1 + 10 * 10 * 1 * 1);
    assert.equal(r.combo, 1);
  });
  test('combo streak multiplies subsequent clears (min 1)', () => {
    const r = scoreForPlacement(P([[0, 0]]), { rows: [0], cols: [], lines: 1 }, 10, 2);
    assert.equal(r.total, 1 + 10 * 10 * 1 * 2);
    assert.equal(r.combo, 2);
    const r0 = scoreForPlacement(P([[0, 0]]), { rows: [0], cols: [], lines: 1 }, 10, 0);
    assert.equal(r0.total, 1 + 10 * 10 * 1 * 1); // min 1 streak
  });
  test('stars: 1 per line + (lines-1) bonus (1,2,3 lines)', () => {
    assert.equal(scoreForPlacement(P([[0,0]]), { rows: [0], cols: [], lines: 1 }, 10, 1).stars, 1);
    assert.equal(scoreForPlacement(P([[0,0]]), { rows: [0,1], cols: [], lines: 2 }, 20, 1).stars, 3);
    assert.equal(scoreForPlacement(P([[0,0]]), { rows: [0,1,2], cols: [], lines: 3 }, 30, 1).stars, 5);
  });
});

describe('anyFit (exact Game over)', () => {
  test('empty grid fits anything', () => {
    assert.equal(anyFit(createGrid(), [P([[0, 0], [0, 1]])]), true);
  });
  test('false only when truly stuck', () => {
    const g = createGrid();
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) g[r][c] = 'sun';
    g[9][9] = null;
    assert.equal(anyFit(g, [P([[0, 0]])]), true); // single fits the hole
    assert.equal(anyFit(g, [P([[0, 0], [0, 1]])]), false); // domino does not
  });
  test('empty tray means no fit', () => {
    assert.equal(anyFit(createGrid(), [null, null, null]), false);
  });
});

describe('generation (weighted + seeded)', () => {
  test('generateTray returns 3 pieces from the set', () => {
    const t = generateTray(seededRng(42));
    assert.equal(t.length, 3);
    for (const p of t) {
      assert.ok(p.cells.length >= 1 && p.cells.length <= 9);
      assert.ok(['water', 'fire', 'earth', 'lightning', 'sun'].includes(p.element));
      assert.ok(p.id);
    }
  });
  test('seeded RNG is deterministic', () => {
    const a = generateTray(seededRng(7)).map(p => JSON.stringify(p.cells) + p.element);
    const b = generateTray(seededRng(7)).map(p => JSON.stringify(p.cells) + p.element);
    assert.deepEqual(a, b);
    const c = generateTray(seededRng(8)).map(p => JSON.stringify(p.cells) + p.element);
    assert.notDeepEqual(a, c);
  });
  test('5-lines are in the set but rare in the pool', () => {
    const fiveLines = SHAPES_LIST.filter(s => s.cells.length === 5 && (s.cells.every(c => c[0] === 0) || s.cells.every(c => c[1] === 0)));
    assert.equal(fiveLines.length, 2);
    for (const s of fiveLines) assert.equal(s.w, 3); // minimal weight
  });
});

describe('power-ups', () => {
  test('costs are constants in the seam', () => {
    assert.deepEqual(COSTS, { hammer: 5, bomb: 10, shuffle: 3 });
  });
  test('Hammer removes exactly 1 Cell; empty Cell is a no-op', () => {
    const g = createGrid();
    g[4][4] = 'fire';
    assert.equal(applyHammer(g, 4, 4), true);
    assert.equal(g[4][4], null);
    assert.equal(applyHammer(g, 4, 4), false);
    assert.equal(applyHammer(g, -1, 0), false);
  });
  test('Bomb removes the 3x3 neighbourhood, clipped at edges', () => {
    const g = createGrid();
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) g[r][c] = 'sun';
    assert.equal(applyBomb(g, 1, 1), 9);
    assert.equal(g[1][1], null);
    g[0][0] = 'sun';
    assert.equal(applyBomb(g, 0, 0), 1); // clipped 2x2, only 1 filled
  });
});
