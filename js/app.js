/* Interface : canvas, interactions, panneaux, professeur. Tout texte est posé via textContent. */
(function () {
  'use strict';
  const { SCENARIOS, initialPoints, buildHidden, fitModel, errors, judge, sentence, niceTicks, compile, teacher: T, TEACHER_STEPS, TEACHER_WAIT, LESSONS } = window.ITE;

  const $ = (id) => document.getElementById(id);
  const canvas = $('plot');
  const ctx = canvas.getContext('2d');
  const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 });
  const pf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
  const TABS = ['story', 'model', 'theory', 'verdict'];
  const KINDS = [
    { id: 'poly', label: 'Polynôme', name: 'Degré', min: 0, max: 9, note: 'Régression polynomiale : la courbe la plus proche de vos points, pour un degré donné.' },
    { id: 'net', label: 'Réseau', name: 'Neurones', min: 1, max: 16, note: 'Petit réseau de neurones, entraîné ici, dans votre navigateur, sur vos points.' },
  ];

  const state = {
    scn: null, points: [], hidden: [], selected: -1, revealed: false,
    showModel: true, showTheory: true, kind: 'poly', degree: 4, neurons: 6,
    expr: '', params: { a: 0, b: 0, c: 0 }, theory: null, theoryError: '',
    tab: 'story', tour: T.idle(), view: 'step', bet: null,
  };
  let cssW = 0, cssH = 0, dpr = 1, geo = null, flashTimer = 0, drag = null, touch = false;

  const kindInfo = () => KINDS.find((k) => k.id === state.kind);
  const complexity = () => (state.kind === 'net' ? state.neurons : state.degree);
  function setComplexity(v) { if (state.kind === 'net') state.neurons = v; else state.degree = v; }

  /* ---------- Modèle et théorie ---------- */
  let fitKey = '', fitVal = null;
  function currentFit() {
    const key = state.kind + '|' + complexity() + '|' + state.scn.id + '|' + state.points.map((p) => p.x + ',' + p.y).join(';');
    if (key !== fitKey) { fitVal = fitModel(state.kind, state.points, complexity(), state.scn.zone); fitKey = key; }
    return fitVal;
  }

  function compileTheory() {
    try { state.theory = compile(state.expr); state.theoryError = ''; }
    catch (e) { state.theory = null; state.theoryError = e.message; }
  }
  function theoryFn() {
    if (!state.theory) return null;
    const t = state.theory, p = state.params;
    return (x) => t.evaluate({ x, a: p.a, b: p.b, c: p.c });
  }

  function loadScenario(id) {
    const s = SCENARIOS.find((x) => x.id === id) || SCENARIOS[0];
    state.scn = s;
    state.points = initialPoints(s);
    state.hidden = buildHidden(s);
    state.selected = -1;
    state.revealed = false;
    state.tour = T.idle();
    state.view = 'step';
    state.bet = null;
    state.degree = s.degree;
    state.neurons = s.neurons;
    state.expr = s.theory.expr;
    for (const k of ['a', 'b', 'c']) state.params[k] = s.theory.params[k].value;
    compileTheory();
    renderStory();
    renderParams();
    syncAll();
    renderTeacher();
  }

  /* ---------- Panneaux ---------- */
  function setTab(name) {
    state.tab = name;
    for (const t of TABS) {
      const on = t === name;
      const tab = $('tab-' + t);
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      $('panel-' + t).hidden = !on;
    }
  }

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function renderStory() {
    const box = $('choices');
    box.replaceChildren();
    for (const s of SCENARIOS) {
      const b = el('button', 'choice', s.nom);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(s === state.scn));
      b.addEventListener('click', () => loadScenario(s.id));
      box.appendChild(b);
    }
    $('story-context').textContent = state.scn.story.context;
    $('story-source').textContent = state.scn.source;
    const ol = $('story-steps');
    ol.replaceChildren();
    for (const step of state.scn.story.steps) ol.appendChild(el('li', '', step));
    $('scenario-name').textContent = state.scn.nom;
  }

  /* Choix du modèle : boutons Polynôme / Réseau. `onChange` est appelé après chaque changement. */
  function buildKindSeg(box, onChange) {
    box.replaceChildren();
    for (const k of KINDS) {
      const b = el('button', '', k.label);
      b.type = 'button';
      b.dataset.kind = k.id;
      b.setAttribute('aria-pressed', String(state.kind === k.id));
      b.addEventListener('click', () => {
        state.kind = k.id;
        for (const o of box.querySelectorAll('button')) o.setAttribute('aria-pressed', String(o.dataset.kind === state.kind));
        onChange();
      });
      box.appendChild(b);
    }
  }

  const sliders = {};
  function renderParams() {
    const box = $('params');
    box.replaceChildren();
    for (const k of ['a', 'b', 'c']) {
      const q = state.scn.theory.params[k];
      const label = el('label', 'field');
      label.htmlFor = 'p-' + k;
      const name = el('span', 'field-name', k + ' = ');
      const out = document.createElement('output');
      name.appendChild(out);
      const input = document.createElement('input');
      input.type = 'range'; input.id = 'p-' + k; input.min = q.min; input.max = q.max; input.step = q.step; input.value = state.params[k];
      input.addEventListener('input', () => { state.params[k] = parseFloat(input.value); syncAll(); emit('theory'); });
      label.append(name, input);
      box.appendChild(label);
      sliders[k] = { input, out, label };
    }
    const preset = state.scn.theory.preset;
    const btn = $('btn-preset');
    btn.hidden = !preset;
    if (preset) btn.textContent = state.scn.theory.presetLabel;
    $('expr').value = state.expr;
  }

  function applyPreset() {
    const p = state.scn.theory.preset;
    if (!p) return;
    state.expr = p.expr;
    for (const k of ['a', 'b', 'c']) state.params[k] = p[k];
    $('expr').value = state.expr;
    compileTheory();
    syncAll();
    emit('theory');
  }

  function modelChanged() { syncAll(); emit('model'); }

  function syncPanels() {
    const n = state.points.length;
    const ki = kindInfo();
    const slider = $('complexity');
    slider.min = ki.min; slider.max = ki.max;
    slider.value = complexity();
    $('complexity-name').textContent = ki.name;
    $('complexity-out').textContent = String(complexity());
    $('kind-note').textContent = ki.note;
    const eff = Math.max(0, Math.min(state.degree, n - 1));
    $('complexity-note').textContent = state.kind === 'poly'
      ? (n === 0 ? 'Aucun point.' : eff < state.degree ? 'Limité à ' + eff + ' par le nombre de points (' + n + ').' : eff === n - 1 && n > 1 ? 'Le modèle passe par tous les points.' : '')
      : '';
    for (const o of $('kind-seg').querySelectorAll('button')) o.setAttribute('aria-pressed', String(o.dataset.kind === state.kind));
    $('btn-remove').disabled = state.selected < 0;
    $('btn-clear').disabled = n === 0;

    $('expr-error').hidden = !state.theoryError;
    $('expr-error').textContent = state.theoryError;
    $('expr').setAttribute('aria-invalid', String(!!state.theoryError));
    for (const k of ['a', 'b', 'c']) {
      const s = sliders[k];
      if (!s) continue;
      s.input.value = state.params[k];
      s.out.textContent = nf.format(state.params[k]);
      s.label.hidden = !!state.theory && !state.theory.uses.has(k);
    }

    $('tog-model').setAttribute('aria-pressed', String(state.showModel));
    $('tog-theory').setAttribute('aria-pressed', String(state.showTheory));
    const rev = $('reveal');
    rev.textContent = state.revealed ? 'Masquer' : 'Révéler';
    rev.setAttribute('aria-pressed', String(state.revealed));
    renderVerdict();
  }

  function cell(tr, text, cls, tag) {
    const td = document.createElement(tag || 'td');
    td.textContent = text;
    if (cls) td.className = cls;
    tr.appendChild(td);
  }

  function renderVerdict() {
    const box = $('verdict');
    box.replaceChildren();
    if (!state.revealed) {
      box.appendChild(el('p', 'note', 'Révélez les observations cachées pour comparer.'));
      return;
    }
    const s = state.scn;
    const span = s.view.y1 - s.view.y0;
    const fit = currentFit();
    const eM = errors(state.hidden, s.zone, fit ? fit.predict : null, span);
    const eT = errors(state.hidden, s.zone, theoryFn(), span);
    const jM = judge(eM), jT = judge(eT);

    const table = document.createElement('table');
    const head = document.createElement('tr');
    cell(head, '', '', 'th'); cell(head, 'Dans le connu', '', 'th'); cell(head, 'Hors du connu', '', 'th');
    table.appendChild(head);
    for (const [name, e, j] of [['Modèle', eM, jM], ['Théorie', eT, jT]]) {
      const tr = document.createElement('tr');
      cell(tr, name, '', 'th');
      for (const k of ['inside', 'outside']) {
        const txt = e[k] == null ? '—' : (e[k] > 100 ? '> 100' : pf.format(e[k])) + ' % · ' + (j[k] ? 'juste' : 'faux');
        cell(tr, txt, e[k] == null ? '' : j[k] ? 'ok' : 'bad');
      }
      table.appendChild(tr);
    }
    box.appendChild(table);
    box.appendChild(el('p', 'key', 'Écart moyen, en % de la hauteur du graphique. Losange creux : observation dans le connu. Losange plein : hors du connu.'));
    for (const [kind, j] of [['model', jM], ['theory', jT]]) box.appendChild(el('p', 'verdict-line', sentence(kind, j)));
    box.appendChild(el('p', 'verdict-line lesson', LESSONS.common.principle));
  }

  /* ---------- Dessin ---------- */
  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    cssW = Math.max(1, Math.round(r.width));
    cssH = Math.max(1, Math.round(r.height));
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    draw();
  }

  function makeGeo() {
    const narrow = cssW < 520;
    const m = { l: narrow ? 46 : 62, r: 14, t: 30, b: narrow ? 44 : 50 };
    const v = state.scn.view;
    const pw = Math.max(10, cssW - m.l - m.r);
    const ph = Math.max(10, cssH - m.t - m.b);
    return {
      m, pw, ph, narrow,
      sx: (x) => m.l + ((x - v.x0) / (v.x1 - v.x0)) * pw,
      sy: (y) => m.t + (1 - (y - v.y0) / (v.y1 - v.y0)) * ph,
      ix: (px) => v.x0 + ((px - m.l) / pw) * (v.x1 - v.x0),
      iy: (py) => v.y0 + (1 - (py - m.t) / ph) * (v.y1 - v.y0),
    };
  }

  function draw() {
    if (!state.scn) return;
    const css = getComputedStyle(document.documentElement);
    const col = (n) => css.getPropertyValue(n).trim();
    const C = { panel: col('--panel'), ink: col('--ink'), soft: col('--ink-soft'), line: col('--line'), zone: col('--zone'), model: col('--model'), theory: col('--theory'), obs: col('--obs') };
    const font = col('--font');
    const g = (geo = makeGeo());
    const s = state.scn, v = s.view;
    const fs = g.narrow ? 12 : 13;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    ctx.font = fs + 'px ' + font;
    ctx.lineJoin = 'round';

    const zx0 = g.sx(s.zone.x0), zx1 = g.sx(s.zone.x1);
    ctx.globalAlpha = 0.22; ctx.fillStyle = C.zone;
    ctx.fillRect(zx0, g.m.t, zx1 - zx0, g.ph);
    ctx.globalAlpha = 1;

    const focus = state.view === 'step' ? T.focusOf(state.tour) : '';
    if (focus === 'zone' || focus === 'outside' || (focus === 'obs' && !state.revealed)) {
      const fx0 = focus === 'zone' ? zx0 : zx1;
      const fx1 = focus === 'zone' ? zx1 : g.m.l + g.pw;
      ctx.globalAlpha = 0.12; ctx.fillStyle = C.ink; ctx.fillRect(fx0, g.m.t, fx1 - fx0, g.ph); ctx.globalAlpha = 1;
      ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.strokeRect(fx0 + 1.5, g.m.t + 1.5, fx1 - fx0 - 3, g.ph - 3);
    }

    ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.fillStyle = C.soft;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (const t of niceTicks(v.x0, v.x1, g.narrow ? 4 : 7)) {
      const px = Math.round(g.sx(t)) + 0.5;
      ctx.beginPath(); ctx.moveTo(px, g.m.t); ctx.lineTo(px, g.m.t + g.ph); ctx.stroke();
      ctx.fillText(nf.format(t), px, g.m.t + g.ph + 6);
    }
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (const t of niceTicks(v.y0, v.y1, 5)) {
      const py = Math.round(g.sy(t)) + 0.5;
      ctx.beginPath(); ctx.moveTo(g.m.l, py); ctx.lineTo(g.m.l + g.pw, py); ctx.stroke();
      ctx.fillText(nf.format(t), g.m.l - 6, py);
    }
    ctx.strokeStyle = C.ink;
    ctx.strokeRect(g.m.l + 0.5, g.m.t + 0.5, g.pw, g.ph);

    ctx.fillStyle = C.soft; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(s.xLabel, g.m.l + g.pw / 2, cssH - 4);
    ctx.save();
    ctx.translate(13, g.m.t + g.ph / 2); ctx.rotate(-Math.PI / 2);
    ctx.textBaseline = 'top';
    ctx.fillText(s.yLabel, 0, -4);
    ctx.restore();

    ctx.textBaseline = 'bottom'; ctx.fillStyle = C.ink; ctx.textAlign = 'center';
    if (zx1 - zx0 > 90) ctx.fillText('Données connues', (zx0 + zx1) / 2, g.m.t - 8);
    const rx1 = g.m.l + g.pw;
    if (rx1 - zx1 > 90) ctx.fillText('Hors du connu', (zx1 + rx1) / 2, g.m.t - 8);
    ctx.setLineDash([5, 5]); ctx.strokeStyle = C.ink; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(Math.round(zx1) + 0.5, g.m.t); ctx.lineTo(Math.round(zx1) + 0.5, g.m.t + g.ph); ctx.stroke();
    ctx.setLineDash([]);

    ctx.save();
    ctx.beginPath(); ctx.rect(g.m.l, g.m.t, g.pw, g.ph); ctx.clip();

    const fit = currentFit();
    const tf = theoryFn();
    const span = v.y1 - v.y0;
    const clampY = (y) => Math.max(v.y0 - 10 * span, Math.min(v.y1 + 10 * span, y));

    /* Un seul tracé continu par tronçon de même style : un pointillé redémarrerait à chaque petit segment
       et paraîtrait plein. */
    function curve(fn, color, dashOutside, halo) {
      const N = Math.max(60, Math.ceil(g.pw / 2));
      ctx.strokeStyle = color;
      ctx.globalAlpha = halo ? 0.25 : 1;
      let prev = null, mode = null, open = false;
      const flush = () => {
        if (!open) return;
        ctx.setLineDash(mode === 'out' ? [8, 6] : []);
        ctx.lineWidth = halo ? 14 : mode === 'out' ? 2.5 : 3.5;
        ctx.stroke();
        open = false;
      };
      for (let i = 0; i <= N; i++) {
        const x = v.x0 + ((v.x1 - v.x0) * i) / N;
        const y = fn(x);
        const cur = Number.isFinite(y) ? { x, y: clampY(y) } : null;
        if (!cur) { flush(); prev = null; continue; }
        if (prev) {
          const seg = !halo && dashOutside && (x + prev.x) / 2 > s.zone.x1 ? 'out' : 'in';
          if (!open || seg !== mode) {
            flush();
            mode = seg;
            ctx.beginPath();
            ctx.moveTo(g.sx(prev.x), g.sy(prev.y));
            open = true;
          }
          ctx.lineTo(g.sx(cur.x), g.sy(cur.y));
        }
        prev = cur;
      }
      flush();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    if (focus === 'model' && state.showModel && fit) curve(fit.predict, C.model, true, true);
    if (focus === 'theory' && state.showTheory && tf) curve(tf, C.theory, false, true);
    if (state.showModel && fit) curve(fit.predict, C.model, true);
    if (state.showTheory && tf) curve(tf, C.theory, false);

    if (state.revealed) {
      for (const h of state.hidden) {
        const px = g.sx(h.x), py = g.sy(h.y);
        ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
        for (const [on, fn, color] of [[state.showModel && fit, fit && fit.predict, C.model], [state.showTheory && tf, tf, C.theory]]) {
          if (!on) continue;
          const y = fn(h.x);
          if (!Number.isFinite(y)) continue;
          ctx.strokeStyle = color;
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, g.sy(clampY(y))); ctx.stroke();
        }
        ctx.setLineDash([]);
        const inside = h.x >= s.zone.x0 && h.x <= s.zone.x1;
        const r = g.narrow ? 6 : 7;
        ctx.beginPath(); ctx.moveTo(px, py - r); ctx.lineTo(px + r, py); ctx.lineTo(px, py + r); ctx.lineTo(px - r, py); ctx.closePath();
        ctx.fillStyle = inside ? C.panel : C.obs; ctx.fill();
        ctx.strokeStyle = C.obs; ctx.lineWidth = 2; ctx.stroke();
        if (focus === 'obs') {
          ctx.beginPath(); ctx.arc(px, py, r + 6, 0, Math.PI * 2);
          ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.stroke();
        }
        if (h.label) {
          ctx.fillStyle = C.obs; ctx.textBaseline = 'bottom';
          ctx.textAlign = px > g.m.l + g.pw - 60 ? 'right' : 'left';
          ctx.fillText(h.label, px + (ctx.textAlign === 'left' ? 9 : -9), py - 6);
        }
      }
    }

    if (state.bet) {
      const bx = g.sx(state.bet.x), by = g.sy(state.bet.y);
      ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.arc(bx, by, 10, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(bx - 5, by); ctx.lineTo(bx + 5, by); ctx.moveTo(bx, by - 5); ctx.lineTo(bx, by + 5); ctx.stroke();
      ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText('Votre pari', bx, by - 14);
    }

    state.points.forEach((p, i) => {
      const px = g.sx(p.x), py = g.sy(p.y);
      if (i === state.selected) {
        ctx.beginPath(); ctx.arc(px, py, 12, 0, Math.PI * 2);
        ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = C.ink; ctx.fill();
      ctx.strokeStyle = C.panel; ctx.lineWidth = 2; ctx.stroke();
    });
    ctx.restore();

    if (state.points.length === 0) {
      ctx.fillStyle = C.soft; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('Cliquez dans la zone grisée pour placer des points', (zx0 + zx1) / 2, g.m.t + g.ph / 2, Math.max(60, zx1 - zx0 - 10));
    }

    canvas.setAttribute('aria-label', 'Graphique : ' + s.nom + ', ' + state.points.length + ' points connus' + (state.revealed ? ', observations révélées' : ''));
  }

  function syncAll() { syncPanels(); draw(); }

  /* ---------- Interactions ---------- */
  function flash(text) {
    const f = $('flash');
    f.textContent = text;
    f.hidden = false;
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => { f.hidden = true; }, 2200);
  }

  function pos(e) {
    const r = canvas.getBoundingClientRect();
    return { px: e.clientX - r.left, py: e.clientY - r.top };
  }
  function hit(px, py) {
    const reach = touch ? 26 : 16;
    let best = -1, bd = reach * reach;
    state.points.forEach((p, i) => {
      const dx = geo.sx(p.x) - px, dy = geo.sy(p.y) - py;
      const d = dx * dx + dy * dy;
      if (d <= bd) { bd = d; best = i; }
    });
    return best;
  }
  const clampPoint = (x, y) => {
    const s = state.scn;
    return { x: Math.max(s.zone.x0, Math.min(s.zone.x1, x)), y: Math.max(s.view.y0, Math.min(s.view.y1, y)) };
  };

  canvas.addEventListener('pointerdown', (e) => {
    if (!geo) return;
    touch = e.pointerType === 'touch';
    const { px, py } = pos(e);
    let i = hit(px, py);
    if (i < 0) {
      const x = geo.ix(px);
      const inPlot = py >= geo.m.t && py <= geo.m.t + geo.ph && px >= geo.m.l && px <= geo.m.l + geo.pw;
      if (inPlot && x > state.scn.zone.x1 && state.tour.active && T.stepId(state.tour) === 'bet') {
        state.bet = { x, y: geo.iy(py) };
        draw();
        return;
      }
      if (x < state.scn.zone.x0 || x > state.scn.zone.x1 || !inPlot) {
        flash('Placez vos points dans la zone grisée : le reste est inconnu.');
        return;
      }
      state.points.push(clampPoint(x, geo.iy(py)));
      i = state.points.length - 1;
      emit('points');
    }
    state.selected = i;
    drag = { id: e.pointerId };
    canvas.setPointerCapture(e.pointerId);
    canvas.focus({ preventScroll: true });
    syncAll();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag || drag.id !== e.pointerId || state.selected < 0) return;
    const { px, py } = pos(e);
    state.points[state.selected] = clampPoint(geo.ix(px), geo.iy(py));
    syncAll();
    emit('points');
  });
  const endDrag = (e) => { if (drag && drag.id === e.pointerId) drag = null; };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('dblclick', (e) => {
    const { px, py } = pos(e);
    const i = hit(px, py);
    if (i >= 0) removePoint(i);
  });

  function removePoint(i) {
    state.points.splice(i, 1);
    state.selected = -1;
    syncAll();
  }

  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && state.selected >= 0 && !/^(INPUT|TEXTAREA)$/.test(e.target.tagName)) {
      e.preventDefault();
      removePoint(state.selected);
    }
  });

  $('btn-remove').addEventListener('click', () => { if (state.selected >= 0) removePoint(state.selected); });
  $('btn-clear').addEventListener('click', () => { state.points = []; state.selected = -1; syncAll(); });
  $('btn-reset').addEventListener('click', () => { state.points = initialPoints(state.scn); state.selected = -1; syncAll(); });
  $('complexity').addEventListener('input', (e) => { setComplexity(parseInt(e.target.value, 10)); modelChanged(); });
  $('expr').addEventListener('input', (e) => { state.expr = e.target.value; compileTheory(); syncAll(); if (!state.theoryError) emit('theory'); });
  $('btn-preset').addEventListener('click', applyPreset);
  $('tog-model').addEventListener('click', () => { state.showModel = !state.showModel; syncAll(); });
  $('tog-theory').addEventListener('click', () => { state.showTheory = !state.showTheory; syncAll(); });
  $('reveal').addEventListener('click', () => {
    state.revealed = !state.revealed;
    if (state.revealed && !state.tour.active) setTab('verdict');
    syncAll();
    if (state.revealed) emit('reveal');
  });
  for (const t of TABS) {
    $('tab-' + t).addEventListener('click', () => setTab(t));
    $('tab-' + t).addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      const n = TABS[(TABS.indexOf(t) + d + TABS.length) % TABS.length];
      setTab(n); $('tab-' + n).focus();
    });
  }

  /* ---------- Professeur ---------- */
  function lesson() { return LESSONS.scenarios[state.scn.id]; }
  function emit(name) {
    const before = state.tour;
    state.tour = T.event(state.tour, name);
    if (state.tour !== before) renderTeacher();
  }
  const ctxNow = () => ({ revealed: state.revealed });

  function showTeacher(on) { $('teacher').hidden = !on; $('tabbed').hidden = on; }

  function sheetButtons(rows) {
    const row = el('div', 'sheet-row');
    for (const [label, cls, fn] of rows) {
      const b = el('button', cls, label);
      b.type = 'button';
      b.addEventListener('click', fn);
      row.appendChild(b);
    }
    return row;
  }

  function renderSheet() {
    const box = $('t-sheet');
    box.replaceChildren();
    const common = LESSONS.common;
    if (state.view === 'reading' || state.view === 'words') {
      const items = state.view === 'reading' ? common.reading.items.map((i) => [i.mark, i.means]) : common.words.map((i) => [i.word, i.means]);
      box.appendChild(el('h2', 'sheet-title', state.view === 'reading' ? common.reading.title : 'Les mots'));
      const dl = el('dl', 'sheet');
      for (const [a, b] of items) { dl.appendChild(el('dt', '', a)); dl.appendChild(el('dd', '', b)); }
      box.appendChild(dl);
      box.appendChild(sheetButtons([['Fermer', 'secondary', closeSheet]]));
    } else {
      box.appendChild(el('h2', 'sheet-title', 'Pour finir'));
      box.appendChild(el('p', 'say', common.outro));
      box.appendChild(el('p', 'task', common.principle));
      box.appendChild(el('p', 'hint', 'Pour en discuter :'));
      const ul = el('ul', 'sheet-list');
      for (const q of lesson().debate) ul.appendChild(el('li', '', q));
      box.appendChild(ul);
      box.appendChild(sheetButtons([['Rejouer la visite', 'secondary', () => startTour()]]));
    }
  }

  function sliderField(id, name, min, max, step, value, fmt, onInput) {
    const label = el('label', 'field');
    label.htmlFor = id;
    const nm = el('span', 'field-name', name + ' ');
    const out = el('output', '', fmt(value));
    nm.appendChild(out);
    const input = document.createElement('input');
    input.type = 'range'; input.id = id; input.min = min; input.max = max; input.step = step; input.value = value;
    input.addEventListener('input', () => { out.textContent = fmt(parseFloat(input.value)); onInput(parseFloat(input.value)); });
    label.append(nm, input);
    return label;
  }

  function renderAction(id) {
    const box = $('t-action');
    box.replaceChildren();
    if (id === 'learn') {
      const seg = el('div', 'seg');
      seg.setAttribute('role', 'group');
      seg.setAttribute('aria-label', 'Type de modèle');
      const holder = el('div');
      const build = () => {
        holder.replaceChildren();
        const ki = kindInfo();
        holder.appendChild(sliderField('t-complexity', ki.name, ki.min, ki.max, 1, complexity(), (v) => String(v), (v) => { setComplexity(v); modelChanged(); }));
      };
      buildKindSeg(seg, () => { build(); modelChanged(); });
      box.append(seg, holder);
      build();
    } else if (id === 'theory') {
      if (state.scn.theory.preset) {
        const b = el('button', 'secondary', state.scn.theory.presetLabel);
        b.type = 'button';
        b.addEventListener('click', applyPreset);
        box.appendChild(b);
      } else {
        for (const k of ['a', 'b', 'c']) {
          const q = state.scn.theory.params[k];
          box.appendChild(sliderField('t-p-' + k, k + ' =', q.min, q.max, q.step, state.params[k], (v) => nf.format(v), (v) => { state.params[k] = v; syncAll(); emit('theory'); }));
        }
      }
    }
  }

  let renderedStep = '';
  function renderTeacher() {
    const t = state.tour;
    const sheet = state.view !== 'step';
    const open = t.active || sheet;
    showTeacher(open);
    if (!open) { renderedStep = ''; draw(); return; }
    const total = TEACHER_STEPS.length;
    const onStep = t.active && !t.finished && !sheet;
    const finished = t.active && t.finished && !sheet;
    ['t-title', 't-say', 't-task', 't-hint', 't-action', 't-intro'].forEach((id) => { $(id).hidden = !onStep; });
    $('t-sheet').hidden = onStep;
    $('t-prev').hidden = !t.active || sheet;
    $('t-quit').hidden = !t.active;
    $('t-reading').hidden = sheet;
    $('t-words').hidden = sheet;
    const next = $('t-next');
    next.hidden = sheet && !finished;

    if (onStep) {
      const id = T.stepId(t);
      const st = lesson().steps.find((x) => x.id === id);
      $('t-count').textContent = 'Étape ' + (t.index + 1) + ' sur ' + total;
      $('t-intro').textContent = LESSONS.common.intro;
      $('t-intro').hidden = t.index !== 0;
      $('t-title').textContent = st.title;
      $('t-say').textContent = st.say;
      $('t-task-text').textContent = st.task;
      $('t-task').hidden = !st.task;
      $('t-done').hidden = !(t.satisfied && !!TEACHER_WAIT[id]);
      $('t-hint').textContent = st.hint;
      if (renderedStep !== id + '|' + state.scn.id) { renderAction(id); renderedStep = id + '|' + state.scn.id; }
      next.textContent = t.index === total - 1 ? 'Terminer' : 'Suivant';
      next.disabled = !T.canNext(t);
    } else {
      renderedStep = '';
      $('t-count').textContent = sheet ? '' : 'Visite terminée';
      renderSheet();
      next.textContent = 'Quitter';
      next.disabled = false;
    }
    draw();
  }

  function startTour() { state.view = 'step'; state.bet = null; state.tour = T.start(ctxNow()); renderedStep = ''; renderTeacher(); }
  function stopTour() { state.tour = T.stop(); state.view = 'step'; state.bet = null; renderedStep = ''; renderTeacher(); }
  function openSheet(name) { state.view = name; renderTeacher(); }
  function closeSheet() { state.view = 'step'; renderedStep = ''; renderTeacher(); }

  $('start-tour').addEventListener('click', startTour);
  $('open-reading').addEventListener('click', () => openSheet('reading'));
  $('open-words').addEventListener('click', () => openSheet('words'));
  $('t-reading').addEventListener('click', () => openSheet('reading'));
  $('t-words').addEventListener('click', () => openSheet('words'));
  $('t-quit').addEventListener('click', stopTour);
  $('t-prev').addEventListener('click', () => { state.tour = T.prev(state.tour); renderedStep = ''; renderTeacher(); });
  $('t-next').addEventListener('click', () => {
    if (state.view !== 'step' || (state.tour.active && state.tour.finished)) { stopTour(); return; }
    state.tour = T.next(state.tour, ctxNow());
    renderTeacher();
  });

  /* ---------- Démarrage ---------- */
  buildKindSeg($('kind-seg'), modelChanged);
  new ResizeObserver(resize).observe(canvas);
  loadScenario(SCENARIOS[0].id);
  setTab('story');
  resize();
})();
