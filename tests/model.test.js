const test = require('node:test');
const assert = require('node:assert');
const M = require('../js/model.js');

const dom = { x0: 0, x1: 10 };

test('la régression retrouve une droite exacte', () => {
  const pts = [0, 2, 5, 7, 10].map((x) => ({ x, y: 3 * x - 4 }));
  const fit = M.fitPoly(pts, 1, dom);
  assert.ok(Math.abs(fit.predict(20) - 56) < 1e-6);
});

test('degré plafonné à n-1 et interpolation exacte', () => {
  const pts = [{ x: 0, y: 1 }, { x: 5, y: -2 }, { x: 10, y: 4 }];
  const fit = M.fitPoly(pts, 9, dom);
  assert.strictEqual(fit.degree, 2);
  for (const p of pts) assert.ok(Math.abs(fit.predict(p.x) - p.y) < 1e-4);
});

test('aucun point : pas de modèle ; un point : constante ; points confondus : pas de plantage', () => {
  assert.strictEqual(M.fitPoly([], 3, dom), null);
  assert.strictEqual(M.fitNet([], 3, dom), null);
  assert.ok(Math.abs(M.fitPoly([{ x: 4, y: 7 }], 3, dom).predict(9) - 7) < 1e-6);
  const fit = M.fitPoly([{ x: 3, y: 1 }, { x: 3, y: 3 }, { x: 8, y: 2 }], 2, dom);
  assert.ok(fit && Number.isFinite(fit.predict(5)));
  const net = M.fitNet([{ x: 3, y: 5 }, { x: 3, y: 5 }], 4, dom);
  assert.ok(Math.abs(net.predict(9) - 5) < 0.5, 'jeu constant');
});

const truth = (x) => 3 * Math.sin(0.8 * x);
const train = [0.4, 1.2, 2.1, 3, 3.9, 4.8, 5.6].map((x) => ({ x, y: truth(x) }));
const hidden = [1.5, 2.5, 3.5, 5, 8, 10, 12, 14].map((x) => ({ x, y: truth(x) }));

test('un polynôme appris interpole bien et extrapole mal', () => {
  const fit = M.fitPoly(train, 4, { x0: 0, x1: 6 });
  const e = M.errors(hidden, { x0: 0, x1: 6 }, fit.predict, 10);
  assert.ok(e.inside < 3, 'dans le connu : ' + e.inside);
  assert.ok(e.outside > 20, 'hors du connu : ' + e.outside);
});

test('un réseau de neurones interpole bien, extrapole mal, de façon déterministe', () => {
  const a = M.fitNet(train, 8, { x0: 0, x1: 6 });
  const b = M.fitNet(train, 8, { x0: 0, x1: 6 });
  assert.strictEqual(a.predict(4.4), b.predict(4.4));
  const e = M.errors(hidden, { x0: 0, x1: 6 }, a.predict, 10);
  assert.ok(e.inside < 5, 'dans le connu : ' + e.inside);
  assert.ok(e.outside > 20, 'hors du connu : ' + e.outside);
  assert.ok(Number.isFinite(a.predict(1e6)), 'valeur finie très loin');
});

test('fitModel choisit le bon modèle', () => {
  assert.strictEqual(M.fitModel('poly', train, 3, { x0: 0, x1: 6 }).kind, 'poly');
  assert.strictEqual(M.fitModel('net', train, 3, { x0: 0, x1: 6 }).kind, 'net');
});

test('errors : valeur non finie => null, aucune observation => null', () => {
  const h = [{ x: 1, y: 1 }, { x: 20, y: 1 }];
  const e = M.errors(h, { x0: 0, x1: 5 }, (x) => (x > 10 ? NaN : 1), 10);
  assert.strictEqual(e.inside, 0);
  assert.strictEqual(e.outside, null);
  assert.deepStrictEqual(M.errors([], { x0: 0, x1: 5 }, null, 10), { inside: null, outside: null });
});

test('verdicts', () => {
  assert.match(M.sentence('model', M.judge({ inside: 2, outside: 50 })), /pas au-delà/);
  assert.match(M.sentence('model', M.judge({ inside: 30, outside: 50 })), /même dans le connu/);
  assert.match(M.sentence('theory', M.judge({ inside: 2, outside: 3 })), /tient/);
  assert.match(M.sentence('theory', M.judge({ inside: 2, outside: 60 })), /réfutée/);
  assert.match(M.sentence('theory', M.judge({ inside: null, outside: null })), /exploitable/);
});

test('graduations et générateur déterministe', () => {
  assert.deepStrictEqual(M.niceTicks(0, 10, 5), [0, 2, 4, 6, 8, 10]);
  assert.strictEqual(M.niceTicks(-0.4, 0, 4)[0], -0.4);
  assert.strictEqual(M.mulberry32(5)(), M.mulberry32(5)());
});
