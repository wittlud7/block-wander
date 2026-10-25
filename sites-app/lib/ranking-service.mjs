var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// shared/blocks.js
var require_blocks = __commonJS({
  "shared/blocks.js"(exports, module) {
    (function(root, factory) {
      if (typeof module === "object" && module.exports) module.exports = factory();
      else root.Blocks = factory();
    })(typeof globalThis !== "undefined" ? globalThis : exports, function() {
      "use strict";
      const N = 8;
      const definitions = [["dot", ["1"], 0.25], ["two", ["11"], 1], ["two-v", ["1", "1"], 1], ["three", ["111"], 1.3], ["three-v", ["1", "1", "1"], 1.3], ["square", ["11", "11"], 1.5], ["four", ["1111"], 1], ["four-v", ["1", "1", "1", "1"], 1], ["five", ["11111"], 0.5], ["five-v", ["1", "1", "1", "1", "1"], 0.5], ["corner", ["10", "11"], 1.2], ["corner-r", ["01", "11"], 1.2], ["corner-u", ["11", "10"], 1.2], ["corner-l", ["11", "01"], 1.2], ["el", ["10", "10", "11"], 1], ["el-r", ["01", "01", "11"], 1], ["el-wide", ["100", "111"], 1], ["el-wide-r", ["001", "111"], 1], ["tee", ["111", "010"], 1], ["tee-u", ["010", "111"], 1], ["zig", ["110", "011"], 0.8], ["zig-r", ["011", "110"], 0.8], ["six", ["111", "111"], 0.65], ["six-v", ["11", "11", "11"], 0.65], ["nine", ["111", "111", "111"], 0.35], ["angle", ["100", "100", "111"], 0.7], ["angle-r", ["001", "001", "111"], 0.7]];
      const SHAPES = definitions.map(([id, rows, weight]) => ({ id, w: rows[0].length, h: rows.length, weight, cells: rows.flatMap((row, y) => [...row].flatMap((v, x) => v === "1" ? [[x, y]] : [])) }));
      const BY_ID = Object.fromEntries(SHAPES.map((s) => [s.id, s]));
      const empty = () => Array.from({ length: N }, () => Array(N).fill(0));
      const copyBoard = (board) => board.map((r) => r.slice());
      function fits(board, shape, row, col) {
        return Boolean(Number.isInteger(row) && Number.isInteger(col) && shape && shape.cells.every(([x, y]) => row + y >= 0 && row + y < N && col + x >= 0 && col + x < N && !board[row + y][col + x]));
      }
      function locations(board, shape) {
        const out = [];
        for (let row = 0; row <= N - shape.h; row++) for (let col = 0; col <= N - shape.w; col++) if (fits(board, shape, row, col)) out.push({ row, col });
        return out;
      }
      function lines(board) {
        const rows = [], cols = [];
        for (let i = 0; i < N; i++) {
          if (board[i].every(Boolean)) rows.push(i);
          if (board.every((r) => r[i])) cols.push(i);
        }
        return { rows, cols };
      }
      function clear(board) {
        const full = lines(board), removed = [];
        for (let row = 0; row < N; row++) for (let col = 0; col < N; col++) if ((full.rows.includes(row) || full.cols.includes(col)) && board[row][col]) {
          removed.push({ row, col, color: board[row][col] });
          board[row][col] = 0;
        }
        return { ...full, removed };
      }
      const finiteInt = (v) => Number.isSafeInteger(v) && v >= 0;
      function validState(s) {
        return s && s.version === 3 && Array.isArray(s.board) && s.board.length === N && s.board.every((r) => Array.isArray(r) && r.length === N && r.every((v) => Number.isInteger(v) && v >= 0 && v <= 6)) && Array.isArray(s.tray) && s.tray.length === 3 && s.tray.some(Boolean) && s.tray.every((p) => p === null || p && BY_ID[p.shape] && Number.isInteger(p.color) && p.color >= 1 && p.color <= 6) && ["score", "combo", "moves", "cleared"].every((key) => finiteInt(s[key])) && lines(s.board).rows.length === 0 && lines(s.board).cols.length === 0;
      }
      function starter() {
        const b = empty();
        for (const x of [0, 1]) for (const y of [2, 3]) b[y][x] = 2;
        for (const x of [6, 7]) for (const y of [3, 4]) b[y][x] = 4;
        for (const y of [6, 7]) for (const x of [0, 1, 2, 5, 6, 7]) b[y][x] = x < 3 ? 3 : 1;
        return b;
      }
      class Game {
        constructor(options = {}) {
          this.random = options.random || Math.random;
          this.onEvent = options.onEvent || (() => {
          });
          this.reset();
          if (options.state) this.restore(options.state);
        }
        reset() {
          this.board = starter();
          this.tray = [{ shape: "square", color: 1 }, { shape: "el-wide", color: 2 }, { shape: "three-v", color: 3 }];
          this.score = 0;
          this.combo = 0;
          this.moves = 0;
          this.cleared = 0;
          this.undoLeft = 3;
          this.history = [];
          this.status = "playing";
        }
        get canUndo() {
          return this.undoLeft > 0 && this.history.length > 0;
        }
        getShape(index) {
          return this.tray[index] ? BY_ID[this.tray[index].shape] : null;
        }
        canPlace(index, row, col) {
          return this.status === "playing" && fits(this.board, this.getShape(index), row, col);
        }
        hasMoves() {
          return this.tray.some((p) => p && locations(this.board, BY_ID[p.shape]).length > 0);
        }
        refill() {
          const virtual = copyBoard(this.board), tray = [];
          for (let i = 0; i < 3; i++) {
            const candidates = SHAPES.map((shape) => ({ shape, spots: locations(virtual, shape) })).filter((c) => c.spots.length);
            const total = candidates.reduce((n, c) => n + c.shape.weight, 0);
            let pick = this.random() * total, selected = candidates[candidates.length - 1];
            for (const c of candidates) {
              pick -= c.shape.weight;
              if (pick < 0) {
                selected = c;
                break;
              }
            }
            if (!selected) {
              this.status = "over";
              return;
            }
            const color = 1 + Math.floor(this.random() * 6), spot = selected.spots[Math.floor(this.random() * selected.spots.length)];
            tray.push({ shape: selected.shape.id, color });
            selected.shape.cells.forEach(([x, y]) => virtual[spot.row + y][spot.col + x] = color);
            clear(virtual);
          }
          this.tray = tray;
        }
        place(index, row, col) {
          if (!this.canPlace(index, row, col)) return false;
          this.history.push(this.snapshot(false));
          if (this.history.length > 3) this.history.shift();
          const piece = this.tray[index], shape = BY_ID[piece.shape];
          shape.cells.forEach(([x, y]) => this.board[row + y][col + x] = piece.color);
          this.tray[index] = null;
          this.moves++;
          const result = clear(this.board), count = result.rows.length + result.cols.length;
          this.combo = count ? this.combo + 1 : 0;
          this.cleared += count;
          const allClear = count > 0 && this.board.every((r) => r.every((v) => !v));
          const earned = shape.cells.length + count * count * 20 + Math.max(0, this.combo - 1) * 10 + (allClear ? 100 : 0);
          this.score += earned;
          if (this.tray.every((p) => !p)) this.refill();
          if (!this.hasMoves()) this.status = "over";
          const event = { type: "place", row, col, index, color: piece.color, cells: shape.cells.map(([x, y]) => ({ row: row + y, col: col + x })), ...result, count, earned, combo: this.combo, allClear, over: this.status === "over" };
          this.onEvent(event);
          return event;
        }
        undo() {
          if (!this.canUndo) return false;
          const h = this.history.pop();
          this.board = copyBoard(h.board);
          this.tray = h.tray.map((p) => p ? { ...p } : null);
          this.score = h.score;
          this.combo = h.combo;
          this.moves = h.moves;
          this.cleared = h.cleared;
          this.undoLeft--;
          this.status = "playing";
          this.onEvent({ type: "undo" });
          return true;
        }
        snapshot(includeHistory = true) {
          return { version: 3, board: copyBoard(this.board), tray: this.tray.map((p) => p ? { ...p } : null), score: this.score, combo: this.combo, moves: this.moves, cleared: this.cleared, undoLeft: this.undoLeft, status: this.status, ...includeHistory ? { history: JSON.parse(JSON.stringify(this.history)) } : {} };
        }
        restore(s) {
          if (!validState(s)) return false;
          this.board = copyBoard(s.board);
          this.tray = s.tray.map((p) => p ? { ...p } : null);
          this.score = s.score;
          this.combo = s.combo;
          this.moves = s.moves;
          this.cleared = s.cleared;
          this.undoLeft = Number.isInteger(s.undoLeft) ? Math.max(0, Math.min(3, s.undoLeft)) : 0;
          this.history = Array.isArray(s.history) ? JSON.parse(JSON.stringify(s.history.filter(validState).slice(-3))) : [];
          this.status = this.hasMoves() ? "playing" : "over";
          return true;
        }
      }
      return { Game, SHAPES, BY_ID, N, fits, locations, lines, clear, empty, validState };
    });
  }
});

// shared/themes.js
var require_themes = __commonJS({
  "shared/themes.js"(exports, module) {
    (function(root, factory) {
      if (typeof module === "object" && module.exports) module.exports = factory();
      else root.InkThemes = factory();
    })(typeof globalThis !== "undefined" ? globalThis : exports, function() {
      const specs = [["retro", "\u5370\u8C61\u6D3E", "\u83AB\u5948", "\u83AB\u5948\u7B14\u4E0B\u7684\u82B1\u56ED\u3001\u7761\u83B2\u4E0E\u6D77\u5CB8", "#f3eddd", "#213f36", "#b64530", "#294d3e"], ["comic", "\u540E\u5370\u8C61\u6D3E", "\u68B5\u9AD8\u4E0E\u585E\u5C1A", "\u68B5\u9AD8\u4E0E\u585E\u5C1A\u7684\u7B14\u89E6\u548C\u8272\u5F69", "#f7efcf", "#242547", "#c13a2f", "#343d88"], ["clay", "\u65B0\u827A\u672F", "\u7A46\u590F", "\u7A46\u590F\u7684\u690D\u7269\u7EB9\u6837\u4E0E\u88C5\u9970\u7EBF\u6761", "#eee4d8", "#4a403a", "#b65e40", "#4a5a85"], ["paper", "\u6D6E\u4E16\u7ED8", "\u5317\u658B\u4E0E\u5E7F\u91CD", "\u6C5F\u6237\u65F6\u671F\u7684\u6728\u7248\u98CE\u666F\u753B", "#f0e9d9", "#193e47", "#ad552c", "#265363"], ["neon", "\u8C61\u5F81\u4E3B\u4E49", "\u96F7\u4E1C", "\u96F7\u4E1C\u7684\u5E7B\u60F3\u3001\u8096\u50CF\u4E0E\u82B1\u5349", "#171a31", "#e7e3f0", "#dd8cb2", "#7373bc"], ["oriental", "\u4E2D\u56FD\u5C71\u6C34", "\u8427\u4E91\u4ECE\u4E0E\u6C88\u5468", "\u660E\u6E05\u5C71\u6C34\u753B\u4E2D\u7684\u4E18\u58D1\u4E0E\u7B14\u58A8", "#f2eddf", "#33433c", "#ac4533", "#566b52"]];
      const credits = [{ "theme": "retro", "id": "fish", "name": "\u6602\u8482\u5E03\u7684\u56ED\u4E01\u4E4B\u5BB6", "style": "\u83AB\u5948 \xB7 1888", "file": "assets/museum/retro-fish.jpg", "artist": "\u514B\u6D1B\u5FB7\xB7\u83AB\u5948", "date": "1888", "source": "https://clevelandart.org/art/1916.1044", "sourceApi": "https://openaccess-api.clevelandart.org/api/artworks/95272/", "license": "CC0", "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/", "museum": "The Cleveland Museum of Art", "originalTitle": "Gardener's House at Antibes" }, { "theme": "retro", "id": "cat", "name": "\u7761\u83B2", "style": "\u83AB\u5948 \xB7 c. 1915\u201326", "file": "assets/museum/retro-cat.jpg", "artist": "\u514B\u6D1B\u5FB7\xB7\u83AB\u5948", "date": "c. 1915\u201326", "source": "https://clevelandart.org/art/1960.81", "sourceApi": "https://openaccess-api.clevelandart.org/api/artworks/136510/", "license": "CC0", "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/", "museum": "The Cleveland Museum of Art", "originalTitle": "Water Lilies (Agapanthus)" }, { "theme": "retro", "id": "snail", "name": "\u666E\u5C14\u7EF4\u5C14\u9000\u6F6E", "style": "\u83AB\u5948 \xB7 1882", "file": "assets/museum/retro-snail.jpg", "artist": "\u514B\u6D1B\u5FB7\xB7\u83AB\u5948", "date": "1882", "source": "https://clevelandart.org/art/1947.196", "sourceApi": "https://openaccess-api.clevelandart.org/api/artworks/125234/", "license": "CC0", "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/", "museum": "The Cleveland Museum of Art", "originalTitle": "Low Tide at Pourville, near Dieppe, 1882" }, { "theme": "comic", "id": "comic-fish", "name": "\u5723\u96F7\u7C73\u4FEE\u8DEF\u5DE5", "style": "\u68B5\u9AD8 \xB7 1889", "file": "assets/museum/comic-fish.jpg", "artist": "\u6587\u68EE\u7279\xB7\u68B5\u9AD8", "date": "1889", "source": "https://clevelandart.org/art/1947.209", "sourceApi": "https://openaccess-api.clevelandart.org/api/artworks/125249/", "license": "CC0", "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/", "museum": "The Cleveland Museum of Art", "originalTitle": "The Large Plane Trees (Road Menders at Saint-R\xE9my)" }, { "theme": "comic", "id": "comic-cat", "name": "\u4E24\u68F5\u767D\u6768", "style": "\u68B5\u9AD8 \xB7 1889", "file": "assets/museum/comic-cat.jpg", "artist": "\u6587\u68EE\u7279\xB7\u68B5\u9AD8", "date": "1889", "source": "https://clevelandart.org/art/1958.32", "sourceApi": "https://openaccess-api.clevelandart.org/api/artworks/135310/", "license": "CC0", "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/", "museum": "The Cleveland Museum of Art", "originalTitle": "Two Poplars in the Alpilles near Saint-R\xE9my" }, { "theme": "comic", "id": "comic-snail", "name": "\u5723\u7EF4\u514B\u591A\u5C71", "style": "\u585E\u5C1A \xB7 c. 1904", "file": "assets/museum/comic-snail.jpg", "artist": "\u4FDD\u7F57\xB7\u585E\u5C1A", "date": "c. 1904", "source": "https://clevelandart.org/art/1958.21", "sourceApi": "https://openaccess-api.clevelandart.org/api/artworks/135185/", "license": "CC0", "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/", "museum": "The Cleveland Museum of Art", "originalTitle": "Mount Sainte-Victoire" }, { "theme": "clay", "id": "clay-fish", "name": "\u4E1C\u65B9\u7F42\u7C9F", "style": "\u7A46\u590F \xB7 1901\u20132", "file": "assets/museum/clay-fish.jpg", "artist": "\u963F\u5C14\u4E30\u65AF\xB7\u7A46\u590F", "date": "1901\u20132", "source": "https://clevelandart.org/art/1969.236", "sourceApi": "https://openaccess-api.clevelandart.org/api/artworks/144595/", "license": "CC0", "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/", "museum": "The Cleveland Museum of Art", "originalTitle": "Documents Decoratifs:  Oriental Poppies" }, { "theme": "clay", "id": "clay-cat", "name": "\u9999\u8C4C\u8C46", "style": "\u7A46\u590F \xB7 1901\u20132", "file": "assets/museum/clay-cat.jpg", "artist": "\u963F\u5C14\u4E30\u65AF\xB7\u7A46\u590F", "date": "1901\u20132", "source": "https://clevelandart.org/art/1969.238", "sourceApi": "https://openaccess-api.clevelandart.org/api/artworks/144597/", "license": "CC0", "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/", "museum": "The Cleveland Museum of Art", "originalTitle": "Documents Decoratifs:  Sweet Peas" }, { "theme": "clay", "id": "clay-snail", "name": "\u4F0A\u5C14\u8D5B\u516C\u4E3B", "style": "\u7A46\u590F \xB7 1897", "file": "assets/museum/clay-snail.jpg", "artist": "\u963F\u5C14\u4E30\u65AF\xB7\u7A46\u590F", "date": "1897", "source": "https://clevelandart.org/art/1977.1018", "sourceApi": "https://openaccess-api.clevelandart.org/api/artworks/148901/", "license": "CC0", "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/", "museum": "The Cleveland Museum of Art", "originalTitle": "Ilsee, Princesse de Tripoli" }, { "theme": "paper", "id": "paper-fish", "name": "\u51EF\u98CE\u5FEB\u6674", "style": "\u5317\u658B \xB7 early 1830s", "file": "assets/museum/paper-fish.jpg", "artist": "\u845B\u9970\u5317\u658B", "date": "early 1830s", "source": "https://clevelandart.org/art/1930.189", "sourceApi": "https://openaccess-api.clevelandart.org/api/artworks/111654/", "license": "CC0", "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/", "museum": "The Cleveland Museum of Art", "originalTitle": "South Wind, Clear Sky, from Thirty-Six Views of Mount Fuji" }, { "theme": "paper", "id": "paper-cat", "name": "\u5927\u6865\u9AA4\u96E8", "style": "\u5E7F\u91CD \xB7 1857", "file": "assets/museum/paper-cat.jpg", "artist": "\u6B4C\u5DDD\u5E7F\u91CD", "date": "1857", "source": "https://clevelandart.org/art/1921.318", "sourceApi": "https://openaccess-api.clevelandart.org/api/artworks/103244/", "license": "CC0", "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/", "museum": "The Cleveland Museum of Art", "originalTitle": "Sudden Shower over Shin-\u014Chashi Bridge and Atake, from One Hundred Famous Views of Edo" }, { "theme": "paper", "id": "paper-snail", "name": "\u5E84\u91CE\u767D\u96E8", "style": "\u5E7F\u91CD \xB7 1833", "file": "assets/museum/paper-snail.jpg", "artist": "\u6B4C\u5DDD\u5E7F\u91CD", "date": "1833", "source": "https://clevelandart.org/art/1948.306", "sourceApi": "https://openaccess-api.clevelandart.org/api/artworks/126086/", "license": "CC0", "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/", "museum": "The Cleveland Museum of Art", "originalTitle": "Driving Rain at Sh\u014Dno, from Fifty-Three Stations of the Tokaid\u014D" }, { "theme": "neon", "id": "neon-fish", "name": "\u7EF4\u5965\u83B1\u7279\xB7\u6D77\u66FC", "style": "\u96F7\u4E1C \xB7 1910", "file": "assets/museum/neon-fish.jpg", "artist": "\u5965\u8FEA\u9686\xB7\u96F7\u4E1C", "date": "1910", "source": "https://clevelandart.org/art/1926.1976", "sourceApi": "https://openaccess-api.clevelandart.org/api/artworks/148753/", "license": "CC0", "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/", "museum": "The Cleveland Museum of Art", "originalTitle": "Violette Heymann" }, { "theme": "neon", "id": "neon-cat", "name": "\u4FC4\u8033\u752B\u65AF", "style": "\u96F7\u4E1C \xB7 c. 1903\u201310", "file": "assets/museum/neon-cat.jpg", "artist": "\u5965\u8FEA\u9686\xB7\u96F7\u4E1C", "date": "c. 1903\u201310", "source": "https://clevelandart.org/art/1926.25", "sourceApi": "https://openaccess-api.clevelandart.org/api/artworks/108544/", "license": "CC0", "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/", "museum": "The Cleveland Museum of Art", "originalTitle": "Orpheus" }, { "theme": "neon", "id": "neon-snail", "name": "\u82B1\u74F6", "style": "\u96F7\u4E1C \xB7 1916", "file": "assets/museum/neon-snail.jpg", "artist": "\u5965\u8FEA\u9686\xB7\u96F7\u4E1C", "date": "1916", "source": "https://clevelandart.org/art/1958.46", "sourceApi": "https://openaccess-api.clevelandart.org/api/artworks/135469/", "license": "CC0", "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/", "museum": "The Cleveland Museum of Art", "originalTitle": "Vase of Flowers" }, { "theme": "oriental", "id": "oriental-fish", "name": "\u56DB\u5B63\u5C71\u6C34\u518C", "style": "\u8427\u4E91\u4ECE \xB7 1668", "file": "assets/museum/oriental-fish.jpg", "artist": "\u8427\u4E91\u4ECE", "date": "1668", "source": "https://clevelandart.org/art/1955.302.4", "sourceApi": "https://openaccess-api.clevelandart.org/api/artworks/132837/", "license": "CC0", "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/", "museum": "The Cleveland Museum of Art", "originalTitle": "Album of Seasonal Landscapes, Leaf A (previous leaf 4)" }, { "theme": "oriental", "id": "oriental-cat", "name": "\u5343\u9877\u4E91", "style": "\u6C88\u5468 \xB7 after 1490", "file": "assets/museum/oriental-cat.jpg", "artist": "\u6C88\u5468", "date": "after 1490", "source": "https://clevelandart.org/art/1964.371.9", "sourceApi": "https://openaccess-api.clevelandart.org/api/artworks/140452/", "license": "CC0", "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/", "museum": "The Cleveland Museum of Art", "originalTitle": "The Thousand Acres of Clouds, from Twelve Views of Tiger Hill, Suzhou" }, { "theme": "oriental", "id": "oriental-snail", "name": "\u5251\u6C60", "style": "\u6C88\u5468 \xB7 after 1490", "file": "assets/museum/oriental-snail.jpg", "artist": "\u6C88\u5468", "date": "after 1490", "source": "https://clevelandart.org/art/1964.371.6", "sourceApi": "https://openaccess-api.clevelandart.org/api/artworks/140449/", "license": "CC0", "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/", "museum": "The Cleveland Museum of Art", "originalTitle": "The Sword Spring, Tiger Hill, from Twelve Views of Tiger Hill, Suzhou" }];
      const THEMES = specs.map(([id, name, collection, description, paper, ink, accent, primary]) => ({ id, name, collection, description, paper, ink, accent, primary, dark: id === "neon", arts: credits.filter((a) => a.theme === id).map((a) => ({ ...a, paper, ink, accent, color: accent })) }));
      const get = (id) => THEMES.find((t) => t.id === id) || THEMES[0];
      return { THEMES, get, art: (id, index) => get(id).arts[index] };
    });
  }
});

// shared/ink.js
var require_ink = __commonJS({
  "shared/ink.js"(exports, module) {
    (function(root, factory) {
      if (typeof module === "object" && module.exports) module.exports = factory(require_blocks(), require_themes());
      else root.Ink = factory(root.Blocks, root.InkThemes);
    })(typeof globalThis !== "undefined" ? globalThis : exports, function(B, T) {
      "use strict";
      const ARTS = T.get("retro").arts;
      const art = (c) => T.art(c.theme || "retro", c.art);
      const DIFFICULTIES = [{ id: "easy", name: "\u8F7B\u677E", undo: 3, hints: 3, maxSize: 4 }, { id: "normal", name: "\u6807\u51C6", undo: 2, hints: 2, maxSize: 6 }, { id: "master", name: "\u5927\u5E08", undo: 1, hints: 1, maxSize: 9 }];
      const STAGES = ["\u7B2C1\u5173", "\u7B2C2\u5173", "\u7B2C3\u5173", "\u7B2C4\u5173", "\u7B2C5\u5173", "\u7B2C6\u5173"];
      const GOALS = [[24, 28, 32, 36, 40, 44], [32, 36, 40, 44, 48, 50], [36, 40, 44, 48, 50, 52]];
      const clone = (v) => JSON.parse(JSON.stringify(v));
      function hash(s) {
        let h = 2166136261;
        for (const c of String(s)) {
          h ^= c.charCodeAt(0);
          h = Math.imul(h, 16777619);
        }
        return h >>> 0;
      }
      function random(seed) {
        let n = seed >>> 0;
        return () => {
          n = n + 1831565813 >>> 0;
          let t = Math.imul(n ^ n >>> 15, 1 | n);
          t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
          return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
      }
      function chinaDate(time = Date.now()) {
        return new Date(time + 288e5).toISOString().slice(0, 10);
      }
      function seasonal(time = Date.now()) {
        const date = chinaDate(time);
        return date >= "2026-10-23" && date <= "2026-11-06";
      }
      function daily(time = Date.now()) {
        const date = chinaDate(time);
        return { art: seasonal(time) ? 1 : hash(date) % 3, level: 2 + hash(date + "stage") % 3, difficulty: 1, date, seed: hash("ink-daily-" + date) };
      }
      function config(art2 = 1, level = 0, difficulty = 1, date = null, theme = "retro") {
        if (!Number.isInteger(art2) || art2 < 0 || art2 > 2 || !Number.isInteger(level) || level < 0 || level > 5 || !Number.isInteger(difficulty) || difficulty < 0 || difficulty > 2) throw new Error("Invalid chapter");
        if (!T.THEMES.some((t) => t.id === theme)) throw new Error("Invalid theme");
        return { art: art2, level, difficulty, date, theme, seed: hash(`ink-${art2}-${level}-${difficulty}-${date || "book"}`), goal: GOALS[difficulty][level], budget: difficulty === 0 ? null : (difficulty === 1 ? 28 : 24) + level * 2, ...DIFFICULTIES[difficulty], name: STAGES[level] };
      }
      function initial(c) {
        const board = B.empty(), seals = B.empty(), lvl = c.level;
        if (c.mode === "endless") return { board, seals, marks: [], deck: [] };
        const marks = [[[4, 5], [6, 2], [7, 6]], [[1, 6], [5, 4], [7, 7]], [[2, 0], [4, 1], [7, 6]], [[2, 3], [4, 6], [7, 1]], [[1, 3], [4, 2], [6, 5]], [[1, 1], [3, 5], [6, 2], [7, 7]]][lvl].map((p) => p.slice());
        if (c.difficulty === 2) {
          const row = 7, col = lvl === 1 ? 7 : 0;
          seals[row][col] = 1;
          marks[marks.length - 1] = [row, col];
        }
        const deck = [];
        return { board, marks, seals, deck };
      }
      const validMask = (m) => Array.isArray(m) && m.length === 8 && m.every((r) => Array.isArray(r) && r.length === 8 && r.every((v) => v === 0 || v === 1));
      class Game extends B.Game {
        constructor(options = {}) {
          super({ random: random(1) });
          this.external = options.onEvent || (() => {
          });
          this.onEvent = () => {
          };
          this.load(options.config || config());
          if (options.state?.version === 4) {
            try {
              this.load(config(options.state.config.art, options.state.config.level, options.state.config.difficulty, options.state.config.date));
            } catch {
            }
          } else if (options.state) this.restore(options.state);
        }
        load(c) {
          this.c = { ...c };
          this.rngState = c.seed;
          this.random = () => {
            this.rngState = Math.imul(this.rngState, 1664525) + 1013904223 >>> 0;
            return this.rngState / 4294967296;
          };
          super.reset();
          const start = initial(c);
          this.board = start.board;
          this.marks = start.marks;
          this.seals = start.seals;
          this.deck = start.deck;
          this.deckAt = 0;
          this.repaired = B.empty();
          this.undoLeft = c.undo;
          this.hintsLeft = c.hints;
          this.credits = 0;
          this.swaps = 0;
          this.inkHistory = [];
          this.actions = [];
          this.ranked = c.mode !== "endless";
          this.failure = "";
          this.status = "playing";
          this.refill();
          this.onEvent = () => {
          };
        }
        refill() {
          const pool = B.SHAPES.filter((s) => s.cells.length <= DIFFICULTIES[this.c.difficulty].maxSize);
          const virtual = this.board.map((r) => r.slice()), tray = [];
          if (this.c.mode === "endless") {
            this.tray = Array.from({ length: 3 }, () => {
              let pick = this.random() * pool.reduce((n, s) => n + s.weight, 0), chosen = pool[pool.length - 1];
              for (const s of pool) {
                pick -= s.weight;
                if (pick < 0) {
                  chosen = s;
                  break;
                }
              }
              return { shape: chosen.id, color: 1 + Math.floor(this.random() * 6) };
            });
            return;
          }
          for (let i = 0; i < 3; i++) {
            let shape, spots;
            const wanted = B.BY_ID[this.deck[this.deckAt++]];
            if (wanted && (spots = B.locations(virtual, wanted)).length) shape = wanted;
            else {
              const choices = pool.map((s) => ({ s, spots: B.locations(virtual, s) })).filter((x) => x.spots.length);
              const total = choices.reduce((n2, x) => n2 + x.s.weight, 0);
              let n = this.random() * total;
              let choice = choices[choices.length - 1];
              for (const x of choices) {
                n -= x.s.weight;
                if (n < 0) {
                  choice = x;
                  break;
                }
              }
              if (!choice) {
                this.status = "over";
                return;
              }
              shape = choice.s;
              spots = choice.spots;
            }
            const p = spots[Math.floor(this.random() * spots.length)], color = 1 + Math.floor(this.random() * 6);
            tray.push({ shape: shape.id, color });
            shape.cells.forEach(([x, y]) => virtual[p.row + y][p.col + x] = color);
            B.clear(virtual);
          }
          this.tray = tray;
        }
        get repairedCount() {
          return this.repaired.flat().reduce((a, b) => a + b, 0);
        }
        get canUndo() {
          return this.status !== "over" && super.canUndo && !!this.inkHistory?.length;
        }
        get stamps() {
          return this.marks.filter(([r, c]) => this.repaired[r][c]).length;
        }
        get remaining() {
          return this.c.budget === null ? null : Math.max(0, this.c.budget - this.moves);
        }
        get stars() {
          if (this.status !== "won") return 0;
          const par = 14 + this.c.level * 2;
          return this.moves <= par ? 3 : this.moves <= par + 6 ? 2 : 1;
        }
        inkState() {
          return { repaired: clone(this.repaired), seals: clone(this.seals), deckAt: this.deckAt, rngState: this.rngState };
        }
        place(index, row, col) {
          if (!this.canPlace(index, row, col)) return false;
          const before = this.inkState(), refilled = this.tray.filter(Boolean).length === 1;
          const e = super.place(index, row, col);
          this.inkHistory.push(before);
          if (this.inkHistory.length > 3) this.inkHistory.shift();
          const repaired = [], broken = [];
          const repair = (r, c) => {
            if (r < 0 || r >= 8 || c < 0 || c >= 8 || this.seals[r][c]) return;
            if (!this.repaired[r][c]) {
              this.repaired[r][c] = 1;
              repaired.push([r, c]);
            }
          };
          for (const p of e.removed) {
            if (this.seals[p.row][p.col]) {
              this.seals[p.row][p.col]--;
              this.board[p.row][p.col] = p.color;
              broken.push([p.row, p.col]);
            } else repair(p.row, p.col);
          }
          if (e.count >= 2) {
            for (const p of e.removed) for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!broken.some(([r, c]) => r === p.row + dr && c === p.col + dc)) repair(p.row + dr, p.col + dc);
          }
          if (refilled && broken.length) this.refill();
          if (this.c.mode === "endless") this.credits += e.count * 25 + (e.allClear ? 50 : 0);
          if (this.c.mode !== "endless" && this.repairedCount >= this.c.goal && this.stamps === this.marks.length) this.status = "won";
          else if (this.remaining === 0) {
            this.status = "over";
            this.failure = "\u6B65\u6570\u7528\u5B8C";
          } else if (!this.hasMoves()) {
            this.status = "over";
            this.failure = "\u6CA1\u6709\u53EF\u653E\u7684\u4F4D\u7F6E";
          } else this.status = "playing";
          const event = { ...e, restored: repaired, broken, bleed: e.count >= 2, over: this.status === "over", won: this.status === "won" };
          if (this.c.mode === "endless") {
            this.history = [];
            this.inkHistory = [];
            this.actions = [];
          } else this.actions.push(["p", index, row, col]);
          this.external(event);
          return event;
        }
        undo() {
          if (!this.canUndo) return false;
          const m = this.inkHistory[this.inkHistory.length - 1];
          const ok = super.undo();
          if (!ok) return false;
          this.inkHistory.pop();
          Object.assign(this, clone(m));
          this.failure = "";
          this.actions.push(["u"]);
          this.external({ type: "undo" });
          return true;
        }
        get swapCost() {
          return 100 + this.swaps * 50;
        }
        swap(index) {
          if (this.c.mode !== "endless" || this.status !== "playing" || !Number.isInteger(index) || !this.tray[index] || this.credits < this.swapCost) return false;
          const old = this.tray[index], pool = B.SHAPES.filter((s) => s.cells.length <= 9 && s.id !== old.shape && B.locations(this.board, s).length);
          if (!pool.length) return false;
          const cost = this.swapCost;
          this.tray[index] = { shape: pool[Math.floor(this.random() * pool.length)].id, color: old.color };
          this.credits -= cost;
          this.swaps++;
          this.external({ type: "swap", cost });
          return true;
        }
        snapshot(history = true) {
          const base = super.snapshot(history);
          return { ...base, version: 6, actions: clone(this.actions), ranked: this.ranked, config: { ...this.c }, ink: this.inkState(), credits: this.credits, swaps: this.swaps, hintsLeft: this.hintsLeft, ...history ? { inkHistory: clone(this.inkHistory) } : {}, status: this.status };
        }
        restore(s) {
          if (![5, 6].includes(s?.version) || !s.config || !validMask(s.ink?.repaired) || !validMask(s.ink?.seals) || !Array.isArray(s.tray) || !Number.isSafeInteger(s.ink.deckAt) || s.ink.deckAt < 0 || !Number.isInteger(s.ink.rngState) || s.ink.rngState < 0 || s.ink.rngState > 4294967295) return false;
          let c;
          try {
            c = s.config.mode === "endless" ? endlessConfig(s.config.theme, s.config.seed) : config(s.config.art, s.config.level, s.config.difficulty, s.config.date, s.config.theme || "retro");
          } catch {
            return false;
          }
          if (s.config.seed !== c.seed) return false;
          const base = { ...s, version: 3, history: Array.isArray(s.history) ? s.history.map((h) => ({ ...h, version: 3 })) : [] };
          if (!B.validState(base)) return false;
          this.load(c);
          super.restore(base);
          Object.assign(this, clone(s.ink));
          this.hintsLeft = Math.max(0, Math.min(c.hints, Number.isInteger(s.hintsLeft) ? s.hintsLeft : 0));
          this.inkHistory = Array.isArray(s.inkHistory) ? s.inkHistory.filter((m) => validMask(m.repaired) && validMask(m.seals)).slice(-3).map(clone) : [];
          this.credits = Number.isSafeInteger(s.credits) && s.credits >= 0 ? s.credits : 0;
          this.swaps = Number.isSafeInteger(s.swaps) && s.swaps >= 0 ? s.swaps : 0;
          this.status = c.mode !== "endless" && this.repairedCount >= c.goal && this.stamps === this.marks.length ? "won" : this.remaining === 0 || !this.hasMoves() ? "over" : "playing";
          this.actions = s.version === 6 && Array.isArray(s.actions) ? clone(s.actions) : [];
          this.ranked = c.mode !== "endless" && s.version === 6 && s.ranked === true;
          this.failure = this.status === "over" ? this.remaining === 0 ? "\u6B65\u6570\u7528\u5B8C" : "\u6CA1\u6709\u53EF\u653E\u7684\u4F4D\u7F6E" : "";
          return true;
        }
        hint() {
          if (this.hintsLeft <= 0 || this.status !== "playing") return null;
          const choice = bestMove(this);
          if (choice) {
            this.hintsLeft--;
            this.actions.push(["h"]);
          }
          return choice;
        }
      }
      function bestMove(game, noise = 0) {
        let best = null;
        const saved = game.snapshot();
        for (let i = 0; i < 3; i++) {
          const shape = game.getShape(i);
          if (!shape) continue;
          for (const spot of B.locations(game.board, shape)) {
            const sim = new Game({ state: saved });
            const e = sim.place(i, spot.row, spot.col);
            let potential = 0;
            for (let n = 0; n < 8; n++) {
              let row = 0, col = 0, ur = 0, uc = 0;
              for (let j = 0; j < 8; j++) {
                row += !!sim.board[n][j];
                col += !!sim.board[j][n];
                ur += !sim.repaired[n][j];
                uc += !sim.repaired[j][n];
              }
              potential += row * row * (0.4 + ur / 8) + col * col * (0.4 + uc / 8);
            }
            let isolated = 0;
            for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (!sim.board[r][c] && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dr, dc]) => r + dr < 0 || r + dr >= 8 || c + dc < 0 || c + dc >= 8 || sim.board[r + dr][c + dc])) isolated++;
            let targetPotential = 0;
            for (const [r, c] of sim.marks) if (!sim.repaired[r][c]) {
              const row = sim.board[r].filter(Boolean).length, col = sim.board.reduce((n, line) => n + !!line[c], 0);
              targetPotential += Math.max(row, col) ** 2;
            }
            const value = (sim.status === "won" ? 1e5 : sim.status === "over" ? -1e4 : 0) + e.restored.length * 18 + (sim.stamps - game.stamps) * 150 + e.broken.length * 90 + e.count * 18 + potential * 0.7 + targetPotential * 2 - isolated * 10 - sim.board.flat().filter(Boolean).length * 0.7 + noise * (hash(`${game.moves}-${i}-${spot.row}-${spot.col}`) % 100 / 100 - 0.5);
            if (!best || value > best.value) best = { index: i, ...spot, value };
          }
        }
        return best;
      }
      function progressKey(c) {
        return `${c.theme || "retro"}:${c.art}:${c.level}:${c.difficulty}`;
      }
      function endlessConfig(theme = "retro", seed = Date.now() >>> 0) {
        if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295) throw new Error("Invalid seed");
        return { ...config(0, 0, 2, null, theme), mode: "endless", seed, budget: null, goal: 64, undo: 0, hints: 0, name: "\u65E0\u5C3D\u6A21\u5F0F" };
      }
      function record(book, game) {
        const out = clone(book || {});
        if (game.status !== "won") return out;
        const key = progressKey(game.c), old = out[key] || {};
        out[key] = { stars: Math.max(old.stars || 0, game.stars), score: Math.max(old.score || 0, game.score), moves: Math.min(old.moves ?? Infinity, game.moves) };
        return out;
      }
      function unlocked(book, art2, level, theme = "retro") {
        return level === 0 || DIFFICULTIES.some((_, d) => book[`${theme}:${art2}:${level - 1}:${d}`]);
      }
      return { Game, ARTS, THEMES: T.THEMES, theme: T.get, art, DIFFICULTIES, STAGES, config, endlessConfig, initial, hash, random, chinaDate, seasonal, daily, bestMove, record, progressKey, unlocked };
    });
  }
});

// shared/ranking.js
var require_ranking = __commonJS({
  "shared/ranking.js"(exports, module) {
    (function(root, factory) {
      if (typeof module === "object" && module.exports) module.exports = factory(require_ink());
      else root.InkRanking = factory(root.Ink);
    })(typeof globalThis !== "undefined" ? globalThis : exports, function(I) {
      const compare = (a, b) => a.moves - b.moves || a.hints - b.hints || a.undos - b.undos || b.score - a.score || String(a.achievedAt).localeCompare(String(b.achievedAt));
      function verify(input, now = Date.now()) {
        if (!input || input.date !== I.chinaDate(now) || !Array.isArray(input.actions) || !input.actions.length || input.actions.length > 200) throw new Error("\u4EC5\u63A5\u53D7\u4ECA\u65E5\u6311\u6218\u7684\u5B8C\u6574\u64CD\u4F5C\u8BB0\u5F55");
        const d = I.daily(now), c = I.config(d.art, d.level, d.difficulty, d.date, input.theme || "retro"), g = new I.Game({ config: c });
        let hints = 0, undos = 0;
        for (const a of input.actions) {
          if (!Array.isArray(a) || g.status === "won" || g.status === "over" && a[0] !== "u") throw new Error("\u64CD\u4F5C\u8BB0\u5F55\u65E0\u6548");
          if (a[0] === "p" && a.length === 4 && a.slice(1).every(Number.isInteger)) {
            if (!g.place(a[1], a[2], a[3])) throw new Error("\u542B\u6709\u975E\u6CD5\u843D\u70B9");
          } else if (a[0] === "u" && a.length === 1) {
            if (!g.undo()) throw new Error("\u64A4\u56DE\u6B21\u6570\u65E0\u6548");
            undos++;
          } else if (a[0] === "h" && a.length === 1) {
            if (!g.hint()) throw new Error("\u63D0\u793A\u6B21\u6570\u65E0\u6548");
            hints++;
          } else throw new Error("\u672A\u77E5\u64CD\u4F5C");
        }
        if (g.status !== "won") throw new Error("\u5BF9\u5C40\u5C1A\u672A\u8FBE\u6210\u76EE\u6807");
        return { date: d.date, theme: c.theme, moves: g.moves, score: g.score, stars: g.stars, hints, undos, achievedAt: new Date(now).toISOString() };
      }
      function nickname(value) {
        const s = String(value || "").normalize("NFKC").trim();
        if (s.length < 2 || s.length > 12 || /[<>\u0000-\u001f\u007f]/.test(s)) throw new Error("\u6635\u79F0\u9700\u4E3A2\u201312\u4E2A\u5B57\u7B26");
        return s;
      }
      return { compare, verify, nickname };
    });
  }
});

// server/api.cjs
var require_api = __commonJS({
  "server/api.cjs"(exports, module) {
    var Ranking = require_ranking();
    var Ink = require_ink();
    var sha = async (value) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)))).map((b) => b.toString(16).padStart(2, "0")).join("");
    function createAPI2(store, { trustSitesIdentity = false, now = () => Date.now() } = {}) {
      return async function api2(request) {
        const url = new URL(request.url), path = url.pathname.replace(/^\/api\//, ""), headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
        const reply = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });
        try {
          if (!["profile", "rankings"].includes(path)) return reply({ error: "\u672A\u627E\u5230\u6B64\u63A5\u53E3" }, 404);
          if (!["GET", "POST", "DELETE"].includes(request.method)) return reply({ error: "\u4E0D\u652F\u6301\u7684\u64CD\u4F5C" }, 405);
          if (request.method !== "GET" && request.headers.get("origin") && request.headers.get("origin") !== url.origin) return reply({ error: "\u8BF7\u6C42\u6765\u6E90\u65E0\u6548" }, 403);
          const cookie = (request.headers.get("cookie") || "").match(/(?:^|;\s*)ink_guest=([a-f0-9-]{36})(?:;|$)/), sitesId = trustSitesIdentity ? request.headers.get("oai-authenticated-user-id") : null;
          const token = cookie?.[1] || crypto.randomUUID(), id = await sha(sitesId ? "sites:" + sitesId : "guest:" + token);
          if (!cookie && !sitesId) headers["Set-Cookie"] = `ink_guest=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${url.protocol === "https:" ? "; Secure" : ""}`;
          const player = async () => {
            let p = await store.player(id);
            if (!p) {
              p = { id, name: "\u65C5\u4EBA" + id.slice(0, 4), createdAt: new Date(now()).toISOString() };
              await store.savePlayer(p);
            }
            return p;
          };
          let input;
          if (request.method === "POST") {
            if (!request.headers.get("content-type")?.startsWith("application/json")) return reply({ error: "\u4EC5\u63A5\u53D7JSON\u683C\u5F0F" }, 415);
            const reader = request.body?.getReader();
            if (!reader) return reply({ error: "\u7F3A\u5C11\u8BF7\u6C42\u5185\u5BB9" }, 400);
            const chunks = [];
            let size = 0;
            for (; ; ) {
              const { value, done } = await reader.read();
              if (done) break;
              size += value.length;
              if (size > 32768) {
                await reader.cancel();
                return reply({ error: "\u8BB0\u5F55\u8FC7\u957F" }, 413);
              }
              chunks.push(value);
            }
            const body = new Uint8Array(size);
            let offset = 0;
            for (const c of chunks) {
              body.set(c, offset);
              offset += c.length;
            }
            try {
              input = JSON.parse(new TextDecoder().decode(body));
            } catch {
              return reply({ error: "JSON\u683C\u5F0F\u65E0\u6548" }, 400);
            }
          }
          if (path === "profile") {
            if (request.method === "DELETE") {
              await store.deletePlayer(id);
              headers["Set-Cookie"] = "ink_guest=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0";
              return reply({ deleted: true });
            }
            const p = await player();
            if (request.method === "POST") {
              p.name = Ranking.nickname(input.name);
              await store.savePlayer(p);
            }
            return reply({ id: p.id, name: p.name });
          }
          if (request.method === "DELETE") return reply({ error: "\u8BF7\u5728\u73A9\u5BB6\u8BBE\u7F6E\u4E2D\u5220\u9664\u6392\u540D\u8D44\u6599" }, 405);
          if (request.method === "GET") {
            const date = url.searchParams.get("date") || Ink.chinaDate(now());
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > Ink.chinaDate(now()) || date < Ink.chinaDate(now() - 366 * 864e5)) return reply({ error: "\u65E5\u671F\u4E0D\u5728\u53EF\u67E5\u8BE2\u8303\u56F4" }, 400);
            return reply(await store.standings(date, id));
          }
          const result = Ranking.verify(input, now());
          await player();
          await store.saveRank({ ...result, playerId: id });
          const board = await store.standings(result.date, id);
          return reply({ accepted: true, rank: board.mine?.rank, record: board.mine });
        } catch (error) {
          if (error instanceof TypeError) return reply({ error: "\u8BF7\u6C42\u5185\u5BB9\u65E0\u6548" }, 400);
          if (/操作|落点|对局|今日|撤回|提示|昵称|主题|theme/i.test(error.message)) return reply({ error: error.message }, 400);
          console.error("Ranking API:", error.message);
          return reply({ error: "\u6392\u540D\u670D\u52A1\u6682\u4E0D\u53EF\u7528\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5" }, 503);
        }
      };
    }
    module.exports = { createAPI: createAPI2 };
  }
});

// <stdin>
var import_api = __toESM(require_api());
var createAPI = import_api.default.createAPI;
export {
  createAPI
};
