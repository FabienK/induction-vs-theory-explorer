const test = require('node:test');
const assert = require('node:assert');
const { compile } = require('../js/expr.js');

const ev = (src, env = {}) => compile(src).evaluate({ x: 0, a: 0, b: 0, c: 0, ...env });

test('priorités et associativité', () => {
  assert.strictEqual(ev('2+3*4'), 14);
  assert.strictEqual(ev('-2^2'), -4);
  assert.strictEqual(ev('2^3^2'), 512);
  assert.strictEqual(ev('2^-1'), 0.5);
  assert.strictEqual(ev('(1+2)*3'), 9);
});

test('variables, constantes, fonctions, virgule décimale', () => {
  assert.ok(Math.abs(ev('a*sin(b*x)+c', { a: 2, b: 1, x: Math.PI / 2, c: 1 }) - 3) < 1e-12);
  assert.strictEqual(ev('0,5*x', { x: 4 }), 2);
  assert.ok(Math.abs(ev('pi') - Math.PI) < 1e-12);
  assert.strictEqual(ev('SQRT(16)'), 4);
});

test('variables utilisées', () => {
  assert.deepStrictEqual([...compile('a*x+b').uses].sort(), ['a', 'b', 'x']);
});

test('base négative et exposant fractionnaire donnent NaN, pas une exception', () => {
  assert.ok(Number.isNaN(ev('x^0.5', { x: -1 })));
  assert.ok(Math.abs(ev('a*(-x)^b', { a: 2, b: -0.5, x: -4 }) - 1) < 1e-12);
});

test('erreurs claires et aucune exécution de code', () => {
  assert.throws(() => compile(''), /loi/);
  assert.throws(() => compile('2+'), /incompl/);
  assert.throws(() => compile('foo(2)'), /Fonction inconnue/);
  assert.throws(() => compile('z+1'), /Symbole inconnu/);
  assert.throws(() => compile('(1+2'), /Parenthèse/);
  assert.throws(() => compile('1 $ 2'), /Caractère/);
  assert.throws(() => compile('constructor'), /Symbole inconnu/);
  assert.throws(() => compile('process.exit()'), /inattendu|inconnu/);
  assert.throws(() => compile('('.repeat(60) + '1' + ')'.repeat(60)), /imbriqu/);
  assert.throws(() => compile('1+'.repeat(200) + '1'), /longue/);
});
