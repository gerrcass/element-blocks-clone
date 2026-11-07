// Element Blocks — DOM/input layer only. All rules live in js/logic.js.
import {
  SIZE, COSTS, createGrid, canPlace, placePiece, findClears, applyClears,
  anyFit, generateTray, scoreForPlacement, applyHammer, applyBomb,
} from './logic.js';

const $ = (s) => document.querySelector(s);
const gridEl = $('#grid'); const trayEl = $('#tray'); const ghostEl = $('#drag-ghost');
const hudScore = $('#hud-score'); const hudBest = $('#hud-best'); const hudStars = $('#hud-stars');
const hudCombo = $('#hud-combo'); const cursorHint = $('#cursor-hint');
const overlay = $('#overlay'); const hint = $('#powerup-hint');

let grid = createGrid();
let tray = []; // [{piece, used}]
let score = 0, stars = 0, combo = 0, hammerFree = 1;
function lsGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } }
function lsNum(k, d = 0) { const n = +lsGet(k); return Number.isFinite(n) && n >= 0 ? n : d; }
let highScore = lsNum('eb.highScore');
stars = lsNum('eb.stars');
let soundOn = lsGet('eb.sound') !== '0';
let selected = -1; // tray index
let cursor = { r: 0, c: 0 };
let armed = null; // 'hammer' | 'bomb' | null
let drag = null;  // {idx, ok, row, col}
let gameOver = false;
let audioCtx = null;

function persist() {
  lsSet('eb.highScore', String(highScore));
  lsSet('eb.stars', String(stars));
  lsSet('eb.sound', soundOn ? '1' : '0');
}
function beep(freq, dur = 0.08, type = 'sine', vol = 0.15) {
  if (!soundOn) return;
  try {
    audioCtx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') void audioCtx.resume();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    o.connect(g).connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + dur);
  } catch { /* no audio */ }
}
const sPlace = () => beep(440, .07);
const sClear = (n) => [523, 659, 784].slice(0, Math.min(3, n)).forEach((f, i) => setTimeout(() => beep(f, .12, 'triangle'), i * 70));
const sErr = () => beep(160, .12, 'sawtooth', .08);
const sPower = () => beep(880, .1, 'square', .08);
const sOver = () => [392, 330, 262].forEach((f, i) => setTimeout(() => beep(f, .18, 'triangle'), i * 160));

// ---------- Render ----------
function buildGrid() {
  gridEl.innerHTML = '';
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
    const cell = document.createElement('div');
    cell.className = 'cell'; cell.dataset.r = r; cell.dataset.c = c;
    cell.setAttribute('role', 'gridcell'); cell.tabIndex = -1;
    cell.setAttribute('aria-label', `Cell ${r + 1}, ${c + 1}`);
    gridEl.appendChild(cell);
  }
}
function renderGrid() {
  const cells = gridEl.children;
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
    const el = cells[r * SIZE + c];
    const v = grid[r][c];
    el.className = 'cell' + (v ? ` filled ${v}` : '');
    if (cursor.r === r && cursor.c === c && selected >= 0 && !gameOver) el.classList.add('cursor');
  }
}
function miniFor(piece, size = 16) {
  const minR = Math.min(...piece.cells.map(([r]) => r));
  const minC = Math.min(...piece.cells.map(([, c]) => c));
  const rows = Math.max(...piece.cells.map(([r]) => r)) - minR + 1;
  const cols = Math.max(...piece.cells.map(([, c]) => c)) - minC + 1;
  const m = document.createElement('div'); m.className = 'mini';
  m.style.gridTemplateColumns = `repeat(${cols}, ${size}px)`;
  const set = new Set(piece.cells.map(([r, c]) => `${r},${c}`));
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = document.createElement('i');
    if (set.has(`${r + minR},${c + minC}`)) i.className = `on ${piece.element}`;
    m.appendChild(i);
  }
  return m;
}
function renderTray() {
  trayEl.innerHTML = '';
  tray.forEach((slot, idx) => {
    const d = document.createElement('div');
    d.className = 'slot' + (slot.used ? ' used' : '') + (idx === selected ? ' selected' : '');
    d.setAttribute('role', 'button'); d.tabIndex = slot.used ? -1 : 0;
    d.setAttribute('aria-label', slot.used ? 'Empty tray slot' : `Piece ${idx + 1}, ${slot.piece.element}, ${slot.piece.cells.length} cells`);
    if (!slot.used) d.appendChild(miniFor(slot.piece));
    else { const s = document.createElement('span'); s.textContent = '✓'; d.appendChild(s); }
    const k = document.createElement('span'); k.className = 'key'; k.textContent = `key ${idx + 1}`; d.appendChild(k);
    if (!slot.used) {
      d.addEventListener('pointerdown', (e) => startDrag(e, idx));
      d.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); selectTray(idx); } });
    }
    trayEl.appendChild(d);
  });
}
function renderHUD() {
  hudScore.textContent = score; hudBest.textContent = highScore;
  hudStars.textContent = `★ ${stars}`; hudCombo.textContent = `×${Math.max(1, combo)}`;
}
function renderPowerups() {
  $('#pu-hammer').setAttribute('aria-pressed', armed === 'hammer');
  $('#pu-bomb').setAttribute('aria-pressed', armed === 'bomb');
  $('#pu-shuffle').removeAttribute('aria-pressed');
  $('#hammer-free').hidden = hammerFree <= 0;
  $('#pu-hammer').disabled = gameOver;
  $('#pu-bomb').disabled = gameOver;
  $('#pu-shuffle').disabled = gameOver;
  hint.textContent = armed ? `Tap a grid cell to use ${armed} — Esc to cancel.` : '';
}

// ---------- Ghost / drag ----------
function cellFromPoint(x, y) {
  const rect = gridEl.getBoundingClientRect();
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return null;
  const c = Math.min(SIZE - 1, Math.floor((x - rect.left) / rect.width * SIZE));
  const r = Math.min(SIZE - 1, Math.floor((y - rect.top) / rect.height * SIZE));
  return { r: Math.max(0, r), c: Math.max(0, c) };
}
function showGhost(piece, ok) {
  ghostEl.innerHTML = ''; ghostEl.appendChild(miniFor(piece, 22));
  ghostEl.hidden = false; ghostEl.className = ok ? '' : 'below';
  ghostEl.style.borderRadius = '8px'; ghostEl.style.padding = '2px';
  ghostEl.style.background = ok ? 'rgba(34,197,94,.35)' : 'rgba(239,68,68,.35)';
}
function clearGhostCells() {
  [...gridEl.querySelectorAll('.ghost-ok,.ghost-bad')].forEach((e) => e.classList.remove('ghost-ok', 'ghost-bad'));
}
function paintGhost(piece, r, c) {
  clearGhostCells();
  const ok = canPlace(grid, piece, r, c);
  for (const [dr, dc] of piece.cells) {
    const rr = r + dr, cc = c + dc;
    if (rr < 0 || rr >= SIZE || cc < 0 || cc >= SIZE) continue;
    gridEl.children[rr * SIZE + cc].classList.add(ok ? 'ghost-ok' : 'ghost-bad');
  }
  return ok;
}
function startDrag(e, idx) {
  if (gameOver || armed || tray[idx]?.used || drag) return;
  // Pointer must move beyond a small threshold before it counts as a drag;
  // a plain tap selects the piece (tap-to-place) instead.
  const sx = e.clientX, sy = e.clientY;
  const piece = tray[idx].piece;
  const pid = e.pointerId;
  drag = { idx, ok: false, row: -1, col: -1, started: false };
  const move = (ev) => {
    if (!drag || ev.pointerId !== pid) return;
    if (!drag.started) {
      if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 8) return;
      drag.started = true; selected = idx; // don't touch tray DOM mid-drag (keeps gesture alive); highlight on drop
      showGhost(piece, true); moveGhost(sx, sy);
    }
    moveGhost(ev.clientX, ev.clientY);
    const cell = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('.cell');
    const hit = cell ? { r: +cell.dataset.r, c: +cell.dataset.c } : cellFromPoint(ev.clientX, ev.clientY);
    if (hit) {
      drag.ok = paintGhost(piece, hit.r, hit.c); drag.row = hit.r; drag.col = hit.c;
      ghostEl.style.background = drag.ok ? 'rgba(34,197,94,.35)' : 'rgba(239,68,68,.35)';
    } else {
      clearGhostCells(); drag.ok = false;
      ghostEl.style.background = 'rgba(239,68,68,.35)'; // off-grid: show invalid, not the last stale state
    }
  };
  const cleanup = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', cancel);
    ghostEl.hidden = true; clearGhostCells();
  };
  const up = (ev) => {
    if (drag?.idx !== idx || (ev && ev.pointerId !== pid)) return;
    const d = drag; cleanup(); drag = null;
    if (!d) return;
    if (!d.started) { selectTray(idx); return; } // plain tap → select
    if (d.ok) commitPlace(idx, d.row, d.col); // commitPlace renders; re-rendering here would strip the clear anim
    else { renderTray(); renderGrid(); }
  };
  const cancel = (ev) => { // pointercancel: snap back silently
    if (drag?.idx !== idx || (ev && ev.pointerId !== pid)) return;
    cleanup(); drag = null; renderTray(); renderGrid();
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', cancel);
}
function moveGhost(x, y) { ghostEl.style.left = x + 'px'; ghostEl.style.top = y + 'px'; }
function selectTray(idx) {
  if (gameOver || tray[idx]?.used) return;
  const hadFocus = trayEl.contains(document.activeElement);
  selected = selected === idx ? -1 : idx; armed = null;
  cursorHint.textContent = selected >= 0
    ? `Piece ${selected + 1} selected — tap the grid, or arrows + Enter.`
    : 'Select a piece, then tap the grid — or use 1–3 + arrows + Enter.';
  renderTray(); renderGrid(); renderPowerups();
  if (hadFocus) trayEl.children[idx]?.focus(); // keep keyboard focus on the same slot across re-renders
}

// ---------- Rules (via seam) ----------
function commitPlace(idx, r, c) {
  const slot = tray[idx];
  if (!slot || slot.used || !placePiece(grid, slot.piece, r, c)) { sErr(); return false; }
  slot.used = true; selected = -1; sPlace();
  const clears = findClears(grid);
  let clearedCells = 0; const clearedPos = [];
  if (clears.lines > 0) {
    for (const r of clears.rows) for (let c = 0; c < SIZE; c++) clearedPos.push([r, c]);
    for (const c of clears.cols) for (let r = 0; r < SIZE; r++) if (grid[r][c] !== null) clearedPos.push([r, c]);
    clearedCells = applyClears(grid, clears);
    combo = combo > 0 ? combo + 1 : 1;
    const res = scoreForPlacement(slot.piece, clears, clearedCells, combo);
    score += res.total; stars += res.stars;
    sClear(clears.lines);
  } else {
    combo = 0;
    score += scoreForPlacement(slot.piece, clears, 0, 0).total;
  }
  if (score > highScore) highScore = score;
  persist();
  if (tray.every((s) => s.used)) { tray = generateTray().map((p) => ({ piece: p, used: false })); }
  checkGameOver();
  renderGrid(); renderTray(); renderHUD();
  if (clearedPos.length && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const els = clearedPos.map(([r, c]) => gridEl.children[r * SIZE + c]).filter(Boolean);
    els.forEach((el) => el.classList.add('cleared'));
    setTimeout(() => els.forEach((el) => el.classList.remove('cleared')), 350);
  }
  return true;
}
function checkGameOver() {
  const remaining = tray.filter((s) => !s.used).map((s) => s.piece);
  if (remaining.length && !anyFit(grid, remaining)) {
    gameOver = true; sOver();
    $('#final-score').textContent = score; $('#final-best').textContent = highScore;
    overlay.hidden = false;
    $('#again-btn').focus();
  }
}
function usePowerupAt(r, c) {
  if (armed === 'hammer') {
    if (grid[r][c] === null) { sErr(); hint.textContent = 'Hammer needs a filled cell.'; return; } // validate before charging
    if (hammerFree > 0) hammerFree--;
    else if (stars >= COSTS.hammer) stars -= COSTS.hammer;
    else { sErr(); hint.textContent = 'Not enough Stars for Hammer.'; renderPowerups(); return; }
    applyHammer(grid, r, c);
  } else if (armed === 'bomb') {
    if (stars < COSTS.bomb) { sErr(); hint.textContent = 'Bomb needs 10★.'; renderPowerups(); return; }
    stars -= COSTS.bomb; applyBomb(grid, r, c);
  }
  armed = null; sPower(); persist();
  checkGameOver(); renderGrid(); renderPowerups(); renderHUD();
}
function tryPlaceAt(r, c) {
  if (gameOver) return;
  if (armed) { usePowerupAt(r, c); return; }
  if (selected < 0) { cursorHint.textContent = 'Select a tray piece first (or keys 1–3).'; sErr(); return; }
  if (!commitPlace(selected, r, c)) { /* commitPlace already beeps; piece stays */ }
}

// ---------- Events ----------
gridEl.addEventListener('pointerdown', (e) => {
  const cell = e.target.closest('.cell'); if (!cell) return;
  if (drag) return; // drag handles placement
  cursor = { r: +cell.dataset.r, c: +cell.dataset.c };
  tryPlaceAt(cursor.r, cursor.c);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { armed = null; selected = -1; renderTray(); renderGrid(); renderPowerups(); return; }
  if (overlay.hidden === false) return;
  // Let buttons/controls keep their own keys (Enter/Space/arrows/numbers).
  if (e.target instanceof HTMLButtonElement) return;
  if (['1', '2', '3'].includes(e.key)) { selectTray(+e.key - 1); return; }
  if (e.key.startsWith('Arrow')) {
    e.preventDefault();
    if (e.key === 'ArrowUp') cursor.r = Math.max(0, cursor.r - 1);
    if (e.key === 'ArrowDown') cursor.r = Math.min(SIZE - 1, cursor.r + 1);
    if (e.key === 'ArrowLeft') cursor.c = Math.max(0, cursor.c - 1);
    if (e.key === 'ArrowRight') cursor.c = Math.min(SIZE - 1, cursor.c + 1);
    cursorHint.textContent = `Cursor at row ${cursor.r + 1}, column ${cursor.c + 1}.`;
    renderGrid(); return;
  }
  if (e.key === 'Enter' && selected >= 0) { e.preventDefault(); tryPlaceAt(cursor.r, cursor.c); }
});
$('#pu-hammer').addEventListener('click', () => {
  if (hammerFree <= 0 && stars < COSTS.hammer) { sErr(); hint.textContent = 'Hammer needs 5★ (or use your free Hammer).'; return; }
  armed = armed === 'hammer' ? null : 'hammer'; selected = -1; renderPowerups(); renderGrid();
});
$('#pu-bomb').addEventListener('click', () => {
  if (stars < COSTS.bomb) { sErr(); hint.textContent = 'Bomb needs 10★.'; return; }
  armed = armed === 'bomb' ? null : 'bomb'; selected = -1; renderPowerups(); renderGrid();
});
$('#pu-shuffle').addEventListener('click', () => {
  if (stars < COSTS.shuffle) { sErr(); hint.textContent = 'Shuffle needs 3★.'; return; }
  stars -= COSTS.shuffle;
  tray = tray.map((s) => (s.used ? s : { piece: generateTray(Math.random, 1)[0], used: false }));
  sPower(); persist(); checkGameOver(); renderTray(); renderHUD(); renderPowerups();
});
function newGame() {
  grid = createGrid(); score = 0; combo = 0; hammerFree = 1; // Stars persist across games (eb.stars wallet)
  selected = -1; armed = null; gameOver = false; cursor = { r: 0, c: 0 };
  tray = generateTray().map((p) => ({ piece: p, used: false }));
  ghostEl.hidden = true; drag = null; hint.textContent = '';
  overlay.hidden = true; cursorHint.textContent = 'Select a piece, then tap the grid — or use 1–3 + arrows + Enter.';
  persist(); buildGrid(); renderGrid(); renderTray(); renderHUD(); renderPowerups();
}
$('#new-btn').addEventListener('click', newGame);
$('#again-btn').addEventListener('click', newGame);
$('#sound-btn').addEventListener('click', () => {
  soundOn = !soundOn; persist();
  $('#sound-btn').textContent = soundOn ? '🔊' : '🔇';
  $('#sound-btn').setAttribute('aria-pressed', String(soundOn));
  $('#sound-btn').setAttribute('aria-label', soundOn ? 'Mute sound' : 'Unmute sound');
});

// ---------- Boot ----------
$('#sound-btn').textContent = soundOn ? '🔊' : '🔇';
$('#sound-btn').setAttribute('aria-pressed', String(soundOn));
$('#sound-btn').setAttribute('aria-label', soundOn ? 'Mute sound' : 'Unmute sound');
newGame();
