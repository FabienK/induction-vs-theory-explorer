/* Calcul pur : générateur pseudo-aléatoire, régression polynomiale, petit réseau de neurones, écarts, verdicts, graduations. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ITE = Object.assign(root.ITE || {}, api);
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function mulberry32(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function gaussian(rand) {
    const u = Math.max(rand(), 1e-12);
    const v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /* Résout A·w = b par élimination de Gauss avec pivot partiel ; null si singulier. */
  function solveLinear(A, b) {
    const n = b.length;
    const M = A.map((row, i) => row.concat([b[i]]));
    for (let col = 0; col < n; col++) {
      let piv = col;
      for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
      if (Math.abs(M[piv][col]) < 1e-14) return null;
      [M[col], M[piv]] = [M[piv], M[col]];
      for (let r = col + 1; r < n; r++) {
        const f = M[r][col] / M[col][col];
        for (let k = col; k <= n; k++) M[r][k] -= f * M[col][k];
      }
    }
    const w = new Array(n).fill(0);
    for (let r = n - 1; r >= 0; r--) {
      let s = M[r][n];
      for (let k = r + 1; k < n; k++) s -= M[r][k] * w[k];
      w[r] = s / M[r][r];
    }
    return w;
  }

  /* Régression polynomiale (moindres carrés, crête minuscule). Le degré est plafonné à n-1. */
  function fitPoly(points, degree, domain) {
    const n = points.length;
    if (n === 0) return null;
    const d = Math.max(0, Math.min(Math.floor(degree), n - 1));
    const mid = (domain.x0 + domain.x1) / 2;
    const half = (domain.x1 - domain.x0) / 2 || 1;
    const size = d + 1;
    const A = Array.from({ length: size }, () => new Array(size).fill(0));
    const b = new Array(size).fill(0);
    for (const p of points) {
      const t = (p.x - mid) / half;
      const pw = [1];
      for (let k = 1; k < 2 * size; k++) pw.push(pw[k - 1] * t);
      for (let r = 0; r < size; r++) {
        b[r] += pw[r] * p.y;
        for (let c = 0; c < size; c++) A[r][c] += pw[r + c];
      }
    }
    for (let r = 0; r < size; r++) A[r][r] += 1e-9;
    const w = solveLinear(A, b);
    if (!w) return null;
    return {
      kind: 'poly',
      degree: d,
      coeffs: w,
      predict(x) {
        const t = (x - mid) / half;
        let y = 0;
        for (let k = w.length - 1; k >= 0; k--) y = y * t + w[k];
        return y;
      },
    };
  }

  /* Petit réseau de neurones : 1 entrée, une couche de `hidden` neurones tanh, 1 sortie.
     Entraîné par descente de gradient (Adam) sur tout le jeu, initialisation déterministe. */
  function fitNet(points, hidden, domain, opts) {
    const n = points.length;
    if (n === 0) return null;
    const H = Math.max(1, Math.min(32, Math.floor(hidden)));
    const epochs = (opts && opts.epochs) || 1200;
    const mid = (domain.x0 + domain.x1) / 2;
    const half = (domain.x1 - domain.x0) / 2 || 1;
    const ts = points.map((p) => (p.x - mid) / half);
    const mean = points.reduce((s, p) => s + p.y, 0) / n;
    let std = Math.sqrt(points.reduce((s, p) => s + (p.y - mean) * (p.y - mean), 0) / n);
    if (!(std > 1e-9)) std = 1;
    const ys = points.map((p) => (p.y - mean) / std);

    const rand = mulberry32(7 + H);
    const w1 = Array.from({ length: H }, () => gaussian(rand) * 1.5);
    const b1 = Array.from({ length: H }, () => (rand() - 0.5) * 2);
    const w2 = Array.from({ length: H }, () => gaussian(rand) * 0.6);
    let b2 = 0;
    const params = [w1, b1, w2];
    const m = [new Array(H).fill(0), new Array(H).fill(0), new Array(H).fill(0)];
    const v = [new Array(H).fill(0), new Array(H).fill(0), new Array(H).fill(0)];
    let mb = 0, vb = 0;
    const lr = 0.03, B1 = 0.9, B2 = 0.999, EPS = 1e-8;
    const a = new Array(H);
    const g = [new Array(H), new Array(H), new Array(H)];

    for (let e = 1; e <= epochs; e++) {
      g[0].fill(0); g[1].fill(0); g[2].fill(0);
      let gb = 0;
      for (let i = 0; i < n; i++) {
        let out = b2;
        for (let h = 0; h < H; h++) { a[h] = Math.tanh(w1[h] * ts[i] + b1[h]); out += w2[h] * a[h]; }
        const dout = (2 * (out - ys[i])) / n;
        gb += dout;
        for (let h = 0; h < H; h++) {
          g[2][h] += dout * a[h];
          const dz = dout * w2[h] * (1 - a[h] * a[h]);
          g[0][h] += dz * ts[i];
          g[1][h] += dz;
        }
      }
      const c1 = 1 - Math.pow(B1, e), c2 = 1 - Math.pow(B2, e);
      for (let k = 0; k < 3; k++) {
        for (let h = 0; h < H; h++) {
          m[k][h] = B1 * m[k][h] + (1 - B1) * g[k][h];
          v[k][h] = B2 * v[k][h] + (1 - B2) * g[k][h] * g[k][h];
          params[k][h] -= (lr * (m[k][h] / c1)) / (Math.sqrt(v[k][h] / c2) + EPS);
        }
      }
      mb = B1 * mb + (1 - B1) * gb;
      vb = B2 * vb + (1 - B2) * gb * gb;
      b2 -= (lr * (mb / c1)) / (Math.sqrt(vb / c2) + EPS);
    }

    return {
      kind: 'net',
      hidden: H,
      predict(x) {
        const t = (x - mid) / half;
        let out = b2;
        for (let h = 0; h < H; h++) out += w2[h] * Math.tanh(w1[h] * t + b1[h]);
        return out * std + mean;
      },
    };
  }

  /* kind : 'poly' (complexity = degré) ou 'net' (complexity = neurones). */
  function fitModel(kind, points, complexity, domain) {
    return kind === 'net' ? fitNet(points, complexity, domain) : fitPoly(points, complexity, domain);
  }

  /* Écart quadratique moyen, en % de la hauteur du graphique, séparé dans / hors de la zone connue. */
  function errors(hidden, zone, predict, span) {
    const acc = { inside: { s: 0, n: 0, bad: false }, outside: { s: 0, n: 0, bad: false } };
    for (const h of hidden) {
      const k = h.x >= zone.x0 && h.x <= zone.x1 ? 'inside' : 'outside';
      const p = predict ? predict(h.x) : NaN;
      acc[k].n++;
      if (!Number.isFinite(p)) acc[k].bad = true;
      else acc[k].s += (p - h.y) * (p - h.y);
    }
    const out = {};
    for (const k of ['inside', 'outside']) {
      const a = acc[k];
      out[k] = a.n === 0 || a.bad ? null : (Math.sqrt(a.s / a.n) / span) * 100;
    }
    return out;
  }

  const LIMIT = 8;
  function judge(err) {
    return {
      inside: err.inside == null ? null : err.inside <= LIMIT,
      outside: err.outside == null ? null : err.outside <= LIMIT,
    };
  }

  function sentence(kind, j) {
    if (j.inside == null && j.outside == null) {
      return kind === 'model' ? 'Placez au moins un point pour obtenir un modèle.' : 'Cette loi ne donne pas de prédiction exploitable.';
    }
    if (kind === 'model') {
      if (j.inside === false) return 'Le modèle ne colle pas, même dans le connu : changez sa complexité ou les points.';
      if (j.outside === false) return 'Le modèle colle au connu, pas au-delà.';
      return 'Le modèle tient aussi hors du connu, dans ce cas précis.';
    }
    if (j.outside === true && j.inside !== false) return 'La théorie tient, y compris hors du connu.';
    return 'La théorie est réfutée : ses prédictions s’écartent des observations.';
  }

  function niceStep(range, count) {
    const raw = range / count;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    const f = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
    return f * mag;
  }

  function niceTicks(min, max, count) {
    const step = niceStep(max - min, count);
    const ticks = [];
    const start = Math.ceil(min / step - 1e-9) * step;
    for (let v = start; v <= max + step * 1e-6; v += step) ticks.push(Math.abs(v) < step * 1e-9 ? 0 : +v.toPrecision(12));
    return ticks;
  }

  return { mulberry32, gaussian, solveLinear, fitPoly, fitNet, fitModel, errors, judge, sentence, niceTicks, ERROR_LIMIT: LIMIT };
});
