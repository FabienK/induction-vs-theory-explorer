/* Professeur : machine à états pure (sans DOM). Une étape attend, au besoin, une action du visiteur. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ITE = Object.assign(root.ITE || {}, api);
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* Ordre fixe des étapes ; l'action attendue ('' = aucune) et la zone du graphique mise en avant. */
  const STEP_IDS = ['data', 'learn', 'bet', 'theory', 'reveal', 'verdict', 'further'];
  const WAIT = { data: 'points', learn: 'model', bet: '', theory: 'theory', reveal: 'reveal', verdict: '', further: '' };
  const FOCUS = { data: 'zone', learn: 'model', bet: 'outside', theory: 'theory', reveal: 'obs', verdict: 'obs', further: '' };

  const idle = () => ({ active: false, finished: false, index: 0, satisfied: false });

  function stepId(t) { return STEP_IDS[t.index]; }

  function satisfiedOnEntry(id, ctx) {
    return !WAIT[id] || (WAIT[id] === 'reveal' && !!(ctx && ctx.revealed));
  }

  function start(ctx) {
    return { active: true, finished: false, index: 0, satisfied: satisfiedOnEntry(STEP_IDS[0], ctx) };
  }

  /* Un événement du visiteur ('points', 'model', 'theory', 'reveal') valide l'étape courante si c'est celui attendu. */
  function event(t, name) {
    if (!t.active || t.finished || t.satisfied) return t;
    return WAIT[stepId(t)] === name ? { ...t, satisfied: true } : t;
  }

  function canNext(t) { return t.active && !t.finished && t.satisfied; }

  function next(t, ctx) {
    if (!canNext(t)) return t;
    if (t.index === STEP_IDS.length - 1) return { ...t, finished: true };
    const index = t.index + 1;
    return { ...t, index, satisfied: satisfiedOnEntry(STEP_IDS[index], ctx) };
  }

  /* Revenir en arrière est toujours permis ; l'étape revue est considérée comme faite. */
  function prev(t) {
    if (!t.active) return t;
    if (t.finished) return { ...t, finished: false, satisfied: true };
    if (t.index === 0) return t;
    return { ...t, index: t.index - 1, satisfied: true };
  }

  function stop() { return idle(); }

  function focusOf(t) { return t.active && !t.finished ? FOCUS[stepId(t)] : ''; }

  return {
    TEACHER_STEPS: STEP_IDS,
    TEACHER_WAIT: WAIT,
    teacher: { idle, start, event, canNext, next, prev, stop, stepId, focusOf },
  };
});
