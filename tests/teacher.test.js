const test = require('node:test');
const assert = require('node:assert');
const { teacher: T, TEACHER_STEPS, TEACHER_WAIT } = require('../js/teacher.js');

test('au repos, rien ne bouge', () => {
  const t = T.idle();
  assert.strictEqual(T.next(t), t);
  assert.strictEqual(T.event(t, 'points'), t);
  assert.strictEqual(T.focusOf(t), '');
});

test('une étape qui attend une action ne passe pas sans elle', () => {
  let t = T.start({ revealed: false });
  assert.strictEqual(T.stepId(t), 'data');
  assert.strictEqual(T.canNext(t), false);
  assert.strictEqual(T.next(t), t);
  t = T.event(t, 'model');
  assert.strictEqual(T.canNext(t), false, 'mauvaise action');
  t = T.event(t, 'points');
  assert.strictEqual(T.canNext(t), true);
  assert.strictEqual(T.stepId(T.next(t)), 'learn');
});

test('parcours complet, de la première étape à la fin', () => {
  let t = T.start({});
  const seen = [];
  for (let guard = 0; guard < 20 && !t.finished; guard++) {
    seen.push(T.stepId(t));
    const w = TEACHER_WAIT[T.stepId(t)];
    if (w) t = T.event(t, w);
    assert.ok(T.canNext(t));
    t = T.next(t, { revealed: false });
  }
  assert.deepStrictEqual(seen, TEACHER_STEPS);
  assert.strictEqual(t.finished, true);
  assert.strictEqual(T.canNext(t), false);
});

test('une action déjà faite avant l’étape valide l’étape (révélation)', () => {
  let t = { ...T.start({}), index: TEACHER_STEPS.indexOf('theory'), satisfied: true };
  t = T.next(t, { revealed: true });
  assert.strictEqual(T.stepId(t), 'reveal');
  assert.strictEqual(t.satisfied, true);
  const u = T.next({ ...T.start({}), index: 3, satisfied: true }, { revealed: false });
  assert.strictEqual(u.satisfied, false);
});

test('retour arrière, quitter, rejouer', () => {
  let t = T.start({});
  t = T.next(T.event(t, 'points'));
  t = T.prev(t);
  assert.strictEqual(T.stepId(t), 'data');
  assert.strictEqual(t.satisfied, true);
  assert.strictEqual(T.prev(t).index, 0);
  assert.deepStrictEqual(T.stop(), T.idle());
  const fin = { active: true, finished: true, index: 6, satisfied: true };
  assert.strictEqual(T.prev(fin).finished, false);
  assert.strictEqual(T.start({}).index, 0);
});

test('mise en avant du graphique par étape', () => {
  assert.strictEqual(T.focusOf(T.start({})), 'zone');
  assert.strictEqual(T.focusOf({ active: true, finished: true, index: 6, satisfied: true }), '');
});
