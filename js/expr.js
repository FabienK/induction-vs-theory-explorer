/* Analyseur d'expressions mathématiques sans eval : x, a, b, c, + - * / ^, fonctions usuelles. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ITE = Object.assign(root.ITE || {}, api);
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const FUNCS = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan, exp: Math.exp,
    ln: Math.log, log: Math.log10, sqrt: Math.sqrt, abs: Math.abs, tanh: Math.tanh,
  };
  const CONSTS = { pi: Math.PI, e: Math.E };
  const VARS = ['x', 'a', 'b', 'c'];
  const MAX_LEN = 200;
  const MAX_DEPTH = 40;

  function tokenize(src) {
    const tokens = [];
    const re = /\s*(?:(\d+(?:[.,]\d+)?|[.,]\d+)|([A-Za-z_]\w*)|([-+*/^()]))/y;
    let pos = 0;
    while (pos < src.length) {
      if (/^\s*$/.test(src.slice(pos))) break;
      re.lastIndex = pos;
      const m = re.exec(src);
      if (!m) throw new Error('Caractère inattendu : « ' + src.slice(pos).trim().charAt(0) + ' »');
      if (m[1] !== undefined) tokens.push({ t: 'num', v: parseFloat(m[1].replace(',', '.')) });
      else if (m[2] !== undefined) tokens.push({ t: 'id', v: m[2].toLowerCase() });
      else tokens.push({ t: 'op', v: m[3] });
      pos = re.lastIndex;
    }
    return tokens;
  }

  function compile(src) {
    if (typeof src !== 'string' || !src.trim()) throw new Error('Écrivez une loi, par exemple a*x+b');
    if (src.length > MAX_LEN) throw new Error('Expression trop longue');
    const tokens = tokenize(src);
    const uses = new Set();
    let i = 0;
    let depth = 0;

    const peek = () => tokens[i];
    const isOp = (v) => tokens[i] && tokens[i].t === 'op' && tokens[i].v === v;

    function parseExpr() {
      let left = parseTerm();
      while (isOp('+') || isOp('-')) {
        const op = tokens[i++].v;
        const l = left;
        const r = parseTerm();
        left = op === '+' ? (env) => l(env) + r(env) : (env) => l(env) - r(env);
      }
      return left;
    }
    function parseTerm() {
      let left = parseUnary();
      while (isOp('*') || isOp('/')) {
        const op = tokens[i++].v;
        const l = left;
        const r = parseUnary();
        left = op === '*' ? (env) => l(env) * r(env) : (env) => l(env) / r(env);
      }
      return left;
    }
    function parseUnary() {
      if (isOp('-')) { i++; const f = parseUnary(); return (env) => -f(env); }
      if (isOp('+')) { i++; return parseUnary(); }
      return parsePower();
    }
    function parsePower() {
      const base = parseAtom();
      if (isOp('^')) {
        i++;
        const exp = parseUnary();
        return (env) => Math.pow(base(env), exp(env));
      }
      return base;
    }
    function parseAtom() {
      const tok = peek();
      if (!tok) throw new Error('Expression incomplète');
      if (tok.t === 'num') { i++; const v = tok.v; return () => v; }
      if (tok.t === 'id') {
        i++;
        if (isOp('(')) {
          if (!Object.prototype.hasOwnProperty.call(FUNCS, tok.v)) throw new Error('Fonction inconnue : ' + tok.v);
          const fn = FUNCS[tok.v];
          i++;
          const arg = parseNested();
          if (!isOp(')')) throw new Error('Parenthèse fermante manquante');
          i++;
          return (env) => fn(arg(env));
        }
        if (Object.prototype.hasOwnProperty.call(CONSTS, tok.v)) { const v = CONSTS[tok.v]; return () => v; }
        if (VARS.includes(tok.v)) { uses.add(tok.v); const k = tok.v; return (env) => env[k]; }
        throw new Error('Symbole inconnu : ' + tok.v);
      }
      if (tok.v === '(') {
        i++;
        const inner = parseNested();
        if (!isOp(')')) throw new Error('Parenthèse fermante manquante');
        i++;
        return inner;
      }
      throw new Error('Symbole inattendu : « ' + tok.v + ' »');
    }
    function parseNested() {
      if (++depth > MAX_DEPTH) throw new Error('Trop de parenthèses imbriquées');
      const f = parseExpr();
      depth--;
      return f;
    }

    const root = parseExpr();
    if (i < tokens.length) throw new Error('Symbole inattendu : « ' + tokens[i].v + ' »');
    return {
      uses,
      evaluate(env) { return root(env); },
    };
  }

  return { compile, EXPR_VARS: VARS };
});
