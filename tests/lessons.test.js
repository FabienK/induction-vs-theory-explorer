const test = require('node:test');
const assert = require('node:assert');
const { LESSONS } = require('../js/lessons.js');
const { TEACHER_STEPS, TEACHER_WAIT } = require('../js/teacher.js');
const { SCENARIOS } = require('../js/scenarios.js');

const words = (s) => s.trim().split(/\s+/).filter(Boolean).length;
const FORBIDDEN = /leçon|exercice|devoir|\bcours\b|élève|bravo|!/i;
const EMOJI = /\p{Extended_Pictographic}/u;

function allTexts() {
  const out = [LESSONS.common.intro, LESSONS.common.outro, LESSONS.common.principle];
  for (const it of LESSONS.common.reading.items) out.push(it.mark, it.means);
  for (const w of LESSONS.common.words) out.push(w.word, w.means);
  for (const sc of Object.values(LESSONS.scenarios)) {
    for (const st of sc.steps) out.push(st.title, st.say, st.task, st.hint);
    out.push(...sc.debate);
  }
  return out;
}

test('chaque scénario a 7 étapes dans l’ordre, des textes complets et 3 questions de débat', () => {
  assert.strictEqual(Object.keys(LESSONS.scenarios).length, SCENARIOS.length);
  for (const s of SCENARIOS) {
    const l = LESSONS.scenarios[s.id];
    assert.ok(l, s.id);
    assert.deepStrictEqual(l.steps.map((x) => x.id), TEACHER_STEPS);
    assert.strictEqual(l.debate.length, 3);
    for (const st of l.steps) {
      assert.ok(st.title && st.say && st.hint, s.id + '/' + st.id);
      if (TEACHER_WAIT[st.id] || st.id === 'bet') assert.ok(st.task, s.id + '/' + st.id + ' sans consigne');
    }
  }
});

test('longueurs bornées (tient à l’écran à 375 px)', () => {
  assert.ok(words(LESSONS.common.principle) <= 32);
  assert.ok(words(LESSONS.common.intro) <= 38 && words(LESSONS.common.outro) <= 38);
  for (const sc of Object.values(LESSONS.scenarios)) {
    for (const st of sc.steps) {
      assert.ok(words(st.say) <= 45, st.id + ' say ' + words(st.say));
      assert.ok(words(st.task) <= 18, st.id + ' task');
      assert.ok(words(st.hint) <= 24, st.id + ' hint');
      assert.ok(words(st.title) <= 5, st.id + ' title');
    }
    for (const q of sc.debate) assert.ok(words(q) <= 28);
  }
});

test('ton : ni vocabulaire scolaire, ni exclamation, ni emoji', () => {
  for (const t of allTexts()) {
    assert.ok(!FORBIDDEN.test(t), 'interdit dans : ' + t);
    assert.ok(!EMOJI.test(t), 'emoji dans : ' + t);
  }
});

test('les consignes désignent les contrôles de la visite, pas des onglets', () => {
  for (const t of allTexts()) assert.ok(!/onglet/i.test(t), 'onglet dans : ' + t);
});

test('le principe : pas de théorie sans observation', () => {
  assert.match(LESSONS.common.principle, /Pas de théorie sans observation/);
  assert.ok(!/précède les données/i.test(allTexts().join(' ')));
});

test('les chiffres cités correspondent aux scénarios', () => {
  const ondes = LESSONS.scenarios.ondes.steps.map((s) => s.say + ' ' + s.hint).join(' ');
  assert.match(ondes, /−3\/8/);
  assert.match(ondes, /−0,18/);
  const evo = LESSONS.scenarios.evolution.steps.map((s) => s.say).join(' ');
  assert.match(evo, /100 %/);
  const kep = LESSONS.scenarios.kepler.steps.map((s) => s.say + ' ' + s.hint).join(' ');
  for (const n of ['0,241', '9,537', '29,46', '30,07', '164,8', '1846', '1781']) assert.ok(kep.includes(n), n);
});

test('lexique : mots essentiels présents', () => {
  const ws = LESSONS.common.words.map((w) => w.word);
  for (const w of ['interpolation', 'extrapolation', 'induction', 'théorie', 'modèle', 'observation', 'réseau de neurones']) assert.ok(ws.includes(w), w);
});
