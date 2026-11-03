const test = require('node:test');
const assert = require('node:assert');
const M = require('../js/model.js');
const { compile } = require('../js/expr.js');
const S = require('../js/scenarios.js');

const span = (s) => s.view.y1 - s.view.y0;
const defaults = (s) => Object.fromEntries(Object.entries(s.theory.params).map(([k, v]) => [k, v.value]));
const theoryFn = (s, p) => { const c = compile(p.expr || s.theory.expr); return (x) => c.evaluate({ x, a: p.a, b: p.b, c: p.c }); };

test('chaque scénario est cohérent, avec une source déclarée', () => {
  assert.deepStrictEqual(S.SCENARIOS.map((s) => s.id), ['libre', 'ondes', 'evolution', 'kepler']);
  for (const s of S.SCENARIOS) {
    assert.ok(s.source, s.id + ' sans source');
    assert.ok(s.zone.x0 >= s.view.x0 && s.zone.x1 < s.view.x1, s.id + ' zone dans la vue');
    const pts = S.initialPoints(s);
    assert.ok(pts.length >= 6);
    for (const p of pts) {
      assert.ok(p.x >= s.zone.x0 && p.x <= s.zone.x1, s.id + ' points dans la zone');
      assert.ok(p.y >= s.view.y0 && p.y <= s.view.y1, s.id + ' points dans la vue');
    }
    const hid = S.buildHidden(s);
    const inside = hid.filter((h) => h.x >= s.zone.x0 && h.x <= s.zone.x1).length;
    assert.ok(inside >= 2 && hid.length - inside >= 2, s.id + ' observations dans et hors de la zone');
    for (const h of hid) assert.ok(h.y >= s.view.y0 && h.y <= s.view.y1 && h.x <= s.view.x1, s.id + ' observation dans la vue');
    assert.deepStrictEqual(S.buildHidden(s), hid, 'déterministe');
  }
});

test('modèles : bons dans le connu, faux hors du connu, sur chaque scénario, polynôme comme réseau', () => {
  for (const s of S.SCENARIOS) {
    for (const [kind, c] of [['poly', s.degree], ['net', s.neurons]]) {
      const fit = M.fitModel(kind, S.initialPoints(s), c, s.zone);
      const e = M.errors(S.buildHidden(s), s.zone, fit.predict, span(s));
      assert.ok(e.inside <= M.ERROR_LIMIT, s.id + ' ' + kind + ' dedans ' + e.inside);
      assert.ok(e.outside > M.ERROR_LIMIT, s.id + ' ' + kind + ' dehors ' + e.outside);
    }
  }
});

test('la loi par défaut est réfutée, la loi prédéfinie tient partout', () => {
  for (const s of S.SCENARIOS) {
    const eDef = M.errors(S.buildHidden(s), s.zone, theoryFn(s, defaults(s)), span(s));
    assert.ok(eDef.outside == null || eDef.outside > M.ERROR_LIMIT, s.id + ' loi par défaut');
    if (s.theory.preset) {
      const e = M.errors(S.buildHidden(s), s.zone, theoryFn(s, s.theory.preset), span(s));
      assert.ok(e.inside <= M.ERROR_LIMIT && e.outside <= M.ERROR_LIMIT, s.id + ' loi juste ' + JSON.stringify(e));
    }
    for (const k of Object.keys(s.theory.params)) {
      const q = s.theory.params[k];
      assert.ok(q.value >= q.min && q.value <= q.max);
    }
  }
});

test('le scénario libre se résout avec la bonne loi (a=3, b=0,8, c=0)', () => {
  const s = S.SCENARIOS.find((x) => x.id === 'libre');
  const e = M.errors(S.buildHidden(s), s.zone, theoryFn(s, { a: 3, b: 0.8, c: 0 }), span(s));
  assert.ok(e.inside <= M.ERROR_LIMIT && e.outside <= M.ERROR_LIMIT);
});

test('Kepler : données réelles, T² = a³ tient pour les huit corps', () => {
  const s = S.SCENARIOS.find((x) => x.id === 'kepler');
  const all = [...S.initialPoints(s), ...S.buildHidden(s)];
  for (const p of all) {
    const ratio = (p.y * p.y) / (p.x * p.x * p.x);
    assert.ok(Math.abs(ratio - 1) < 0.02, 'T²/a³ = ' + ratio.toFixed(3) + ' pour x=' + p.x);
  }
  assert.deepStrictEqual(S.buildHidden(s).map((h) => h.label), ['Vesta', 'Cérès', 'Uranus', 'Neptune']);
});
