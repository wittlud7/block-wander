(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.GardenEngine = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const WIDTH = 10, HEIGHT = 20;
  const SHAPES = {
    I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    O: [[1,1],[1,1]], T: [[0,1,0],[1,1,1],[0,0,0]],
    J: [[1,0,0],[1,1,1],[0,0,0]], L: [[0,0,1],[1,1,1],[0,0,0]],
    S: [[0,1,1],[1,1,0],[0,0,0]], Z: [[1,1,0],[0,1,1],[0,0,0]]
  };
  // SRS clockwise wall kicks. Coordinates use downward-positive Y.
  const KICKS = [ [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]], [[0,0],[1,0],[1,1],[0,-2],[1,-2]], [[0,0],[1,0],[1,-1],[0,2],[1,2]], [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]] ];
  const IKICKS = [ [[0,0],[-2,0],[1,0],[-2,1],[1,-2]], [[0,0],[-1,0],[2,0],[-1,-2],[2,1]], [[0,0],[2,0],[-1,0],[2,-1],[-1,2]], [[0,0],[1,0],[-2,0],[1,2],[-2,-1]] ];
  const clone = matrix => matrix.map(row => row.slice());
  const rotate = matrix => matrix[0].map((_, x) => matrix.map(row => row[x]).reverse());
  class Game {
    constructor(options = {}) { this.random = options.random || Math.random; this.onEvent = options.onEvent || (() => {}); this.reset(options.mode || 'classic'); }
    reset(mode = this.mode) {
      this.mode = mode; this.board = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(null)); this.intervalOverride = null;
      this.bag = []; this.queue = []; this.score = 0; this.lines = 0; this.combo = -1; this.level = 1;
      this.hold = null; this.holdUsed = false; this.status = 'ready'; this.elapsed = 0;
      this.fallTime = 0; this.lockTime = 0; this.lockResets = 0; this.energy = 0; this.recycles = 0;
      while (this.queue.length < 6) this.queue.push(this.takeBag());
      this.spawn();
    }
    takeBag() {
      if (!this.bag.length) {
        this.bag = Object.keys(SHAPES);
        for (let i = 6; i > 0; i--) { const j = Math.floor(this.random() * (i + 1)); [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]]; }
      }
      return this.bag.pop();
    }
    spawn(type) {
      if (!type) { type = this.queue.shift(); this.queue.push(this.takeBag()); }
      this.piece = { type, matrix: clone(SHAPES[type]), x: Math.floor((WIDTH - SHAPES[type].length) / 2), y: 0, rotation: 0 };
      this.fallTime = 0; this.lockTime = 0; this.lockResets = 0;
      if (!this.valid(this.piece)) {
        if (this.mode === 'zen') { this.board = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(null)); this.recycles++; this.onEvent({ type: 'recycle' }); }
        else { this.status = 'over'; this.onEvent({ type: 'over', score: this.score }); }
      }
    }
    valid(piece, dx = 0, dy = 0, matrix = piece.matrix) {
      return matrix.every((row, y) => row.every((cell, x) => !cell || (piece.x+x+dx >= 0 && piece.x+x+dx < WIDTH && piece.y+y+dy < HEIGHT && (piece.y+y+dy < 0 || !this.board[piece.y+y+dy][piece.x+x+dx]))));
    }
    start() { if (this.status === 'ready' || this.status === 'paused') this.status = 'playing'; }
    pause() { if (this.status === 'playing') this.status = 'paused'; }
    move(dx, dy = 0) {
      if (this.status !== 'playing' || !this.valid(this.piece, dx, dy)) return false;
      const grounded = !this.valid(this.piece, 0, 1);
      this.piece.x += dx; this.piece.y += dy;
      if (dx && grounded && this.lockResets < 15) { this.lockTime = 0; this.lockResets++; }
      if (dy) { this.score += dy; this.fallTime = 0; }
      this.onEvent({ type: 'move' }); return true;
    }
    rotate() {
      if (this.status !== 'playing') return false;
      const p = this.piece, matrix = rotate(p.matrix);
      const kicks = p.type === 'O' ? [[0,0]] : (p.type === 'I' ? IKICKS : KICKS)[p.rotation];
      const grounded = !this.valid(p, 0, 1);
      for (const [dx, dy] of kicks) {
        if (!this.valid(p, dx, dy, matrix)) continue;
        p.x += dx; p.y += dy; p.matrix = matrix; p.rotation = (p.rotation+1)%4;
        if (grounded && this.lockResets < 15) { this.lockTime = 0; this.lockResets++; }
        this.onEvent({ type: 'rotate' }); return true;
      }
      return false;
    }
    ghostY() { let dy = 0; while (this.valid(this.piece, 0, dy+1)) dy++; return this.piece.y + dy; }
    hardDrop() {
      if (this.status !== 'playing') return;
      const y = this.ghostY(), distance = y - this.piece.y;
      this.piece.y = y; this.score += distance * 2; this.onEvent({ type: 'drop', distance }); this.lock();
    }
    swapHold() {
      if (this.status !== 'playing' || this.holdUsed) return false;
      const previous = this.hold; this.hold = this.piece.type; this.spawn(previous); this.holdUsed = true;
      this.onEvent({ type: 'hold' }); return true;
    }
    lock() {
      const p = this.piece;
      let above = false;
      p.matrix.forEach((row,y) => row.forEach((cell,x) => { if (cell) { if(p.y+y < 0) above = true; else this.board[p.y+y][p.x+x] = p.type; } }));
      if (above) {
        if (this.mode === 'zen') { this.board = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(null)); this.recycles++; this.onEvent({ type: 'recycle' }); }
        else { this.status = 'over'; this.onEvent({ type: 'over', score: this.score }); return; }
      }
      const cleared = [];
      this.board.forEach((row, y) => { if (row.every(Boolean)) cleared.push(y); });
      if (cleared.length) {
        const seeds = cleared.reduce((total,y)=>total+this.board[y].filter(cell=>cell==='B').length,0);
        this.board = this.board.filter((_, y) => !cleared.includes(y));
        while (this.board.length < HEIGHT) this.board.unshift(Array(WIDTH).fill(null));
        this.combo++; const earned = [0,100,300,500,800][cleared.length] * this.level + Math.max(0, this.combo) * 50 * this.level;
        this.score += earned; this.lines += cleared.length; this.energy += cleared.length;
        this.level = 1 + Math.floor(this.lines / 10);
        this.onEvent({ type: 'clear', rows: cleared, count: cleared.length, earned, combo: this.combo, seeds });
      } else this.combo = -1;
      this.onEvent({ type: 'lock' }); this.holdUsed = false; if(this.status==='playing') this.spawn();
    }
    update(dt) {
      if (this.status !== 'playing') return;
      dt = Math.min(Math.max(dt, 0), 100); this.elapsed += dt; this.fallTime += dt;
      const interval = this.intervalOverride || (this.mode === 'zen' ? 1050 : Math.max(85, 900 * Math.pow(0.8, this.level - 1)));
      if (this.fallTime >= interval) { if (this.valid(this.piece, 0, 1)) this.piece.y++; this.fallTime = 0; }
      if (!this.valid(this.piece, 0, 1)) { this.lockTime += dt; if (this.lockTime >= 480) this.lock(); }
      else this.lockTime = 0;
    }
  }
  return { Game, SHAPES, WIDTH, HEIGHT, rotate };
});
