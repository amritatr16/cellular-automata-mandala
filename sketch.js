// A cellular automaton lives in ONE wedge (pi/N wide) of a polar dot-grid (pulli).
// Mirror walls on both edges + N-fold rotation = dihedral symmetry (mandala),
// and neighbouring live dots are joined by strokes (kolam-style).
const H = 26, W = 9, R0 = 4;          // rings, sub-sectors per half-petal, inner hole
const NS = [4, 5, 6, 8, 10, 12];
const PALS = [
  { bg: '#0d0712', c: ['#ffd27a','#ff8c42','#e63946','#b5179e','#4361ee','#4cc9f0','#f1faee'] },
  { bg: '#06100f', c: ['#ffffff','#e8f1ee','#bfe3d6','#8fd1bd','#5ab8a3','#3a9a8a','#2d7a73'] },
  { bg: '#140a05', c: ['#fff3b0','#ffd166','#f4a261','#e76f51','#c1440e','#8c2f1b','#5c1a10'] }
];
let ni = 3, N, M, delta, sOf, cs, sn, R, cells, nxt;
let rule = 0, S = 3, P, cols, palI = 0, speed = 4, paused = false, rot = 0, quiet = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(min(2, window.devicePixelRatio || 1));
  textFont('monospace');
  cells = new Uint8Array(H * W); nxt = new Uint8Array(H * W);
  setPal(0); rebuild(); setRule(0); onResize();
}
function onResize() { R = min(width, height) * 0.45; }
function windowResized() { resizeCanvas(windowWidth, windowHeight); onResize(); }
function setPal(i) { palI = i; P = PALS[i]; cols = P.c.map(c => color(c)); }
function setRule(r) { rule = r; S = r === 0 ? 3 : 7; seedCells(); }

function rebuild() {
  N = NS[ni]; M = 2 * W * N; delta = TWO_PI / M;
  sOf = new Uint8Array(M); cs = new Float32Array(M); sn = new Float32Array(M);
  for (let j = 0; j < M; j++) { const i = j % (2 * W); sOf[j] = i < W ? W - 1 - i : i - W; }
}
function seedCells() {
  cells.fill(0); quiet = 0;
  if (rule === 0) {
    for (let k = 0; k < 16; k++) {
      const r = floor(random(H)), s = floor(random(W));
      cells[r * W + s] = 1; cells[min(H - 1, r + 1) * W + s] = random() < .5 ? 1 : 2;
    }
  } else {
    for (let i = 0; i < cells.length; i++) { cells[i] = floor(random(S)); }
  }
}

function stepCA() {
  let alive = 0;
  for (let r = 0; r < H; r++) {
  for (let s = 0; s < W; s++) {
    const i = r * W + s, st = cells[i];
    let c = 0, tgt = rule === 0 ? 1 : (st + 1) % S;
    for (let dr = -1; dr <= 1; dr++) {
      const rr = r + dr; if (rr < 0 || rr >= H) continue;
      for (let ds = -1; ds <= 1; ds++) {
        if (!dr && !ds) continue;
        const ss = s + ds < 0 ? 0 : s + ds >= W ? W - 1 : s + ds;   // mirror wall
        if (cells[rr * W + ss] === tgt) c++;
      }
    }
    let v;
    if (rule === 0) v = st === 0 ? (c === 2 ? 1 : 0) : st === 1 ? 2 : 0;
    else v = (c >= 2 || random() < 0.0004) ? tgt : st;
    nxt[i] = v; if (v) alive++;
  }
  }
  [cells, nxt] = [nxt, cells];
  if (rule === 0) { quiet = alive < 4 ? quiet + 1 : 0; if (quiet > 12) seedCells(); }
}

const rho = r => R * (r + R0 + 0.5) / (H + R0);
const colOf = st => rule === 0 ? (st === 1 ? cols[0] : cols[4]) : cols[st % 7];
const linked = (a, b) => rule === 0 ? (a > 0 && b > 0) : (((a - b + S) % S) === 1 || ((b - a + S) % S) === 1);

function draw() {
  blendMode(BLEND); background(P.bg);
  if (!paused) { rot += 0.0008; if (frameCount % speed === 0) stepCA(); }
  for (let j = 0; j < M; j++) { const a = (j - W + 0.5) * delta + rot; cs[j] = cos(a); sn[j] = sin(a); }
  push(); translate(width / 2, height / 2); blendMode(ADD);
  const dr = R / (H + R0), dim = color(red(cols[6]), green(cols[6]), blue(cols[6]), 70);
  strokeWeight(1.3);
  for (let r = 0; r < H; r++) {
    const rh = rho(r), sp = rh * delta, rh2 = r < H - 1 ? rho(r + 1) : 0;
    for (let j = 0; j < M; j++) {
      const st = cells[r * W + sOf[j]], x = rh * cs[j], y = rh * sn[j];
      if (sp > 3) {
        const j2 = (j + 1) % M;
        if (linked(st, cells[r * W + sOf[j2]])) { stroke(colOf(st)); line(x, y, rh * cs[j2], rh * sn[j2]); }
      }
      if (r < H - 1 && linked(st, cells[(r + 1) * W + sOf[j]])) { stroke(colOf(st)); line(x, y, rh2 * cs[j], rh2 * sn[j]); }
      noStroke();
      if (rule === 0 && st === 0) { fill(dim); circle(x, y, 1.5); }
      else { fill(colOf(st)); circle(x, y, max(1.6, min(dr, sp) * (rule === 0 && st === 2 ? 0.5 : 0.8))); }
    }
  }
  // bindu at the centre and a beaded border of pulli
  fill(cols[0]); circle(0, 0, 10);
  fill(cols[2]);
  for (let k = 0; k < 12 * N; k++) { const a = k * TWO_PI / (12 * N) + rot * 0.5; circle(R * 1.06 * cos(a), R * 1.06 * sin(a), k % 3 === 0 ? 4 : 2); }
  pop();
  blendMode(BLEND); noStroke(); fill(255, 110); textSize(11);
  text(`${rule ? 'cyclic waves' : "brian's brain"} · ${N}-fold · drag to seed · space pause · R reseed · N symmetry · 1/2 rule · P palette · +/- speed`, 14, height - 22);
}

function poke() {
  const dx = mouseX - width / 2, dy = mouseY - height / 2;
  const r = floor(sqrt(dx * dx + dy * dy) / R * (H + R0) - R0);
  if (r < 0 || r >= H) return;
  const a = atan2(dy, dx) - rot;
  const j = ((round(a / delta + W - 0.5) % M) + M) % M, s = sOf[j];
  for (let a1 = -1; a1 <= 1; a1++) {
  for (let b = -1; b <= 1; b++) {
    const rr = constrain(r + a1, 0, H - 1), ss = constrain(s + b, 0, W - 1);
    cells[rr * W + ss] = rule === 0 ? (random() < .7 ? 1 : 2) : floor(random(S));
  }
  }
}
function mousePressed() { poke(); return false; }
function mouseDragged() { poke(); return false; }
function keyPressed() {
  if (key === ' ') paused = !paused;
  else if (key === 'r' || key === 'R') seedCells();
  else if (key === 'n' || key === 'N') { ni = (ni + 1) % NS.length; rebuild(); }
  else if (key === 'p' || key === 'P') setPal((palI + 1) % PALS.length);
  else if (key === '1') setRule(0);
  else if (key === '2') setRule(1);
  else if (key === '+' || key === '=') speed = max(1, speed - 1);
  else if (key === '-') speed = min(20, speed + 1);
  return false;
}