/* Scénarios : monde (loi cachée ou données réelles), zone des données connues, points de départ, observations cachées, textes. */
(function (root, factory) {
  const api = factory(root.ITE || (typeof require === 'function' ? require('./model.js') : {}));
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ITE = Object.assign(root.ITE || {}, api);
})(typeof self !== 'undefined' ? self : this, function (M) {
  'use strict';

  const SCENARIOS = [
    {
      id: 'libre',
      nom: 'Libre',
      source: 'Données illustratives (simulées).',
      xLabel: 'x',
      yLabel: 'mesure',
      view: { x0: 0, x1: 16, y0: -5, y1: 5 },
      zone: { x0: 0, x1: 6 },
      truth: (x) => 3 * Math.sin(0.8 * x),
      noise: 0.25,
      seed: 11,
      nTrain: 7,
      hiddenXs: [1.4, 2.6, 3.8, 5.0, 6.8, 7.8, 8.8, 9.8, 10.8, 11.8, 12.8, 13.8, 15.0],
      degree: 4,
      neurons: 6,
      theory: {
        expr: 'a*sin(b*x)+c',
        params: {
          a: { min: 0, max: 6, step: 0.05, value: 2 },
          b: { min: 0.1, max: 2, step: 0.01, value: 0.5 },
          c: { min: -3, max: 3, step: 0.05, value: 0 },
        },
        preset: null,
      },
      story: {
        context: 'Un phénomène inconnu. Vous ne voyez que quelques mesures, dans la zone grisée.',
        steps: [
          'Placez ou déplacez des points, choisissez un modèle et regardez sa courbe au-delà de la zone.',
          'Proposez une loi avec a, b, c et réglez-la.',
          'Révélez les observations cachées.',
        ],
      },
    },
    {
      id: 'ondes',
      nom: 'Ondes gravitationnelles',
      source: 'Données illustratives (simulées), inspirées du signal observé en 2015.',
      xLabel: 'temps par rapport à la fusion (s)',
      yLabel: 'fréquence du signal (Hz)',
      view: { x0: -0.4, x1: 0, y0: 0, y1: 140 },
      zone: { x0: -0.4, x1: -0.18 },
      truth: (x) => 23.6 * Math.pow(-x, -0.375),
      noise: 1.8,
      seed: 23,
      nTrain: 7,
      hiddenXs: [-0.36, -0.3, -0.24, -0.2, -0.16, -0.12, -0.09, -0.065, -0.045, -0.03, -0.02, -0.012],
      degree: 3,
      neurons: 5,
      theory: {
        expr: 'a*(-x)^b',
        params: {
          a: { min: 5, max: 60, step: 0.1, value: 15 },
          b: { min: -1, max: 0.5, step: 0.005, value: -0.1 },
          c: { min: -30, max: 30, step: 0.5, value: 0 },
        },
        preset: { expr: 'a*(-x)^b', a: 23.6, b: -0.375, c: 0 },
        presetLabel: 'Loi de la relativité générale',
      },
      story: {
        context: 'Deux astres massifs spiralent l’un vers l’autre puis fusionnent : le signal monte en fréquence. Version simplifiée : seules les premières fractions de seconde sont connues.',
        steps: [
          'Observez ce que le modèle prédit pour la fin du signal.',
          'La relativité générale prévoit une fréquence en (−t) à la puissance −3/8 : appliquez-la.',
          'Révélez les observations cachées.',
        ],
      },
    },
    {
      id: 'evolution',
      nom: 'Sélection naturelle',
      source: 'Données illustratives (simulées).',
      xLabel: 'génération',
      yLabel: 'part de la population porteuse',
      view: { x0: 0, x1: 80, y0: 0, y1: 1.1 },
      zone: { x0: 0, x1: 25 },
      truth: (x) => 1 / (1 + 49 * Math.exp(-0.12 * x)),
      noise: 0.015,
      seed: 37,
      nTrain: 7,
      hiddenXs: [4, 9, 14, 19, 22, 30, 38, 46, 54, 62, 72, 80],
      degree: 3,
      neurons: 5,
      theory: {
        expr: '1/(1+a*exp(-b*x))',
        params: {
          a: { min: 1, max: 200, step: 1, value: 20 },
          b: { min: 0, max: 0.4, step: 0.005, value: 0.05 },
          c: { min: -1, max: 1, step: 0.01, value: 0 },
        },
        preset: { expr: '1/(1+a*exp(-b*x))', a: 49, b: 0.12, c: 0 },
        presetLabel: 'Loi de la sélection (avantage de 12 %)',
      },
      story: {
        context: 'Une variante héréditaire avantageuse se répand dans une population. Modèle simplifié : la sélection naturelle de Darwin, mise en équation plus tard par la génétique des populations.',
        steps: [
          'Observez la suite que le modèle imagine pour les générations suivantes.',
          'Une part ne peut pas dépasser 100 % : appliquez la loi de la sélection.',
          'Révélez les observations cachées.',
        ],
      },
    },
    {
      id: 'kepler',
      nom: 'Kepler et Newton',
      source: 'Données réelles : distances au Soleil et durées de révolution des planètes (valeurs arrondies).',
      xLabel: 'distance au Soleil (UA)',
      yLabel: 'durée d’une révolution (années)',
      view: { x0: 0, x1: 32, y0: 0, y1: 180 },
      zone: { x0: 0.3, x1: 10 },
      train: [
        { x: 0.387, y: 0.241 },
        { x: 0.723, y: 0.615 },
        { x: 1.0, y: 1.0 },
        { x: 1.524, y: 1.881 },
        { x: 5.203, y: 11.862 },
        { x: 9.537, y: 29.457 },
      ],
      hiddenData: [
        { x: 2.362, y: 3.63, label: 'Vesta' },
        { x: 2.767, y: 4.6, label: 'Cérès' },
        { x: 19.19, y: 84.0, label: 'Uranus' },
        { x: 30.07, y: 164.8, label: 'Neptune' },
      ],
      degree: 3,
      neurons: 5,
      theory: {
        expr: 'a*x^b',
        params: {
          a: { min: 0.1, max: 5, step: 0.01, value: 3 },
          b: { min: 0.2, max: 3, step: 0.005, value: 1 },
          c: { min: -1, max: 1, step: 0.01, value: 0 },
        },
        preset: { expr: 'a*x^b', a: 1, b: 1.5, c: 0 },
        presetLabel: 'Troisième loi de Kepler',
      },
      story: {
        context: 'Les six planètes que Tycho Brahe et Kepler observaient : plus une planète est loin du Soleil, plus elle met de temps à en faire le tour.',
        steps: [
          'Observez la courbe du modèle au-delà de Saturne.',
          'Kepler a cherché une loi simple dans les mesures de Tycho Brahe : appliquez la sienne.',
          'Révélez les observations cachées.',
        ],
      },
    },
  ];

  function round(v, d) { const k = Math.pow(10, d); return Math.round(v * k) / k; }

  function initialPoints(scn) {
    if (scn.train) return scn.train.map((p) => ({ x: p.x, y: p.y }));
    const rand = M.mulberry32(scn.seed);
    const w = scn.zone.x1 - scn.zone.x0;
    const pts = [];
    for (let i = 0; i < scn.nTrain; i++) {
      const x = scn.zone.x0 + ((i + 0.5) / scn.nTrain) * w + (rand() - 0.5) * (w / scn.nTrain) * 0.4;
      pts.push({ x: round(x, 4), y: round(scn.truth(x) + M.gaussian(rand) * scn.noise, 4) });
    }
    return pts;
  }

  function buildHidden(scn) {
    if (scn.hiddenData) return scn.hiddenData.map((h) => ({ ...h }));
    const rand = M.mulberry32(scn.seed + 1000);
    return scn.hiddenXs.map((x) => ({ x, y: round(scn.truth(x) + M.gaussian(rand) * scn.noise, 4) }));
  }

  return { SCENARIOS, initialPoints, buildHidden };
});
