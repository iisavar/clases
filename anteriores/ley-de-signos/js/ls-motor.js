/* Motor matemático: árbol de expresiones propio (sin eval), dibujo en HTML/texto,
   evaluación exacta, resolución paso a paso (ESCALERA), evaluaciones "con error"
   para diagnosticar, generador aleatorio con semilla y catálogo de errores. */
(function () {
  'use strict';
  const LS = window.LS = window.LS || {};
  const MENOS = '−';

  // ---------- Nodos ----------
  // n(v,{plus})        número entero; plus:true lo dibuja como (+5)
  // b(op,a,b,{imp,slash}) op en '+','-','*','/'; imp: multiplicación pegada 2(−4); slash: 12/3
  // p(base,e)          potencia
  // o(a)               "lo contrario de": −(…), −3²
  // g(a,'('|'[')       agrupación explícita con una cuenta adentro
  const n = (v, o) => Object.assign({ t: 'n', v: norm(v) }, o || {});
  const b = (op, a, c, o) => Object.assign({ t: 'b', op, a: aNodo(a), b: aNodo(c) }, o || {});
  const p = (base, e) => ({ t: 'p', a: aNodo(base), e });
  const o = (a) => { const x = aNodo(a); return { t: 'o', a: x, pw: x.t === 'p' }; };
  const g = (a, br) => ({ t: 'g', a: aNodo(a), br: br || '(' });
  function aNodo(x) { return typeof x === 'number' ? n(x) : x; }
  function norm(v) { return v === 0 ? 0 : v; }
  const clon = (x) => JSON.parse(JSON.stringify(x));

  // ---------- Evaluación ----------
  function ev(x) {
    switch (x.t) {
      case 'n': return x.v;
      case 'g': return ev(x.a);
      case 'o': return norm(-ev(x.a));
      case 'p': { const B = ev(x.a); let r = 1; for (let i = 0; i < x.e; i++) r *= B; return norm(r); }
      case 'b': {
        const A = ev(x.a), C = ev(x.b);
        if (x.op === '+') return norm(A + C);
        if (x.op === '-') return norm(A - C);
        if (x.op === '*') return norm(A * C);
        if (C === 0) throw new Error('div0');
        if (A % C !== 0) throw new Error('noexacta');
        return norm(A / C);
      }
    }
    throw new Error('nodo');
  }
  function evSeguro(x) { try { return ev(x); } catch (e) { return null; } }

  // ---------- Dibujo ----------
  function fmt(v, plus) { return (v < 0 ? MENOS : (plus ? '+' : '')) + Math.abs(v); }

  // lectNeg: número positivo escrito después de un − binario (en −5 − 9 el 9 es deuda por LECTURA)
  function numHtml(v, plus, par, lectNeg) {
    const cls = v === 0 ? 'zero' : (v < 0 || lectNeg ? 'neg' : 'pos');
    const chip = '<span class="num ' + cls + '">' + fmt(v, plus && v > 0) + '</span>';
    return par ? '<span class="grp"><span class="par">(</span>' + chip + '<span class="par">)</span></span>' : chip;
  }
  function numTxt(v, plus, par) { const s = fmt(v, plus && v > 0); return par ? '(' + s + ')' : s; }

  // ctx: { parNeg: poner paréntesis si es negativo, parSiempre: poner paréntesis siempre (si es número) }
  function R(x, path, ctx, H) {
    ctx = ctx || {};
    const sp = (inner) => H ? '<span class="sub" data-p="' + path + '">' + inner + '</span>' : inner;
    const op = (s) => H ? ' <span class="op" data-p="' + path + '">' + s + '</span> ' : ' ' + s + ' ';
    switch (x.t) {
      case 'n': {
        const par = !!x.plus || (x.v < 0 && (ctx.parNeg || ctx.parSiempre)) || (ctx.parSiempre && x.v >= 0);
        return H ? numHtml(x.v, x.plus, par, ctx.lectNeg && !par && x.v > 0) : numTxt(x.v, x.plus, par);
      }
      case 'g': {
        const ab = x.br === '[' ? ['[', ']'] : ['(', ')'];
        const inner = R(x.a, path + 'a', {}, H);
        return H ? sp('<span class="par">' + ab[0] + '</span>' + inner + '<span class="par">' + ab[1] + '</span>')
                 : ab[0] + inner + ab[1];
      }
      case 'p': {
        const base = x.a.t === 'n' ? R(x.a, path + 'a', { parNeg: true }, H) : R(x.a, path + 'a', {}, H);
        return H ? sp(base + '<sup data-p="' + path + '">' + x.e + '</sup>') : base + supTxt(x.e);
      }
      case 'o': {
        const inner = x.a.t === 'n' ? R(x.a, path + 'a', { parSiempre: true }, H) : R(x.a, path + 'a', {}, H);
        return H ? sp('<span class="op opp" data-p="' + path + '">' + MENOS + '</span>' + inner) : MENOS + inner;
      }
      case 'b': {
        const mult = x.op === '*' || x.op === '/';
        let ca, cb;
        if (x.imp) { ca = { parNeg: true }; cb = { parSiempre: true }; }
        else if (x.slash) { ca = { parNeg: ctx.parNeg }; cb = { parNeg: true }; }
        else if (mult) { ca = { parNeg: true }; cb = { parNeg: true }; }
        else { ca = { parNeg: ctx.parNeg }; cb = { parNeg: true, lectNeg: x.op === '-' }; }
        const A = R(x.a, path + 'a', ca, H), B = R(x.b, path + 'b', cb, H);
        if (x.imp) return H ? sp(A + '<span class="op imp" data-p="' + path + '"></span>' + B) : A + B;
        const s = x.op === '+' ? '+' : x.op === '-' ? MENOS : x.op === '*' ? '·' : (x.slash ? '/' : '÷');
        if (x.slash) return H ? sp(A + '<span class="op slash" data-p="' + path + '">/</span>' + B) : A + '/' + B;
        return H ? sp(A + op(s) + B) : A + op(s) + B;
      }
    }
    return '';
  }
  const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  function supTxt(e) { return String(e).split('').map(d => SUP[d]).join(''); }

  function html(x, opt) {
    opt = opt || {};
    let h = '<span class="fx' + (opt.clase ? ' ' + opt.clase : '') + '" role="img" aria-label="' + hablar(x) + '">' + R(x, 'r', {}, true) + '</span>';
    return h;
  }
  function texto(x) { return R(x, 'r', {}, false).replace(/\s+/g, ' ').trim(); }
  function hablar(x) {
    return texto(x).replace(/−/g, ' menos ').replace(/\+/g, ' más ').replace(/·/g, ' por ').replace(/÷/g, ' entre ')
      .replace(/²/g, ' al cuadrado').replace(/³/g, ' al cubo').replace(/[⁴⁵⁶⁷⁸⁹]/g, m => ' a la ' + ({ '⁴': 'cuarta', '⁵': 'quinta', '⁶': 'sexta', '⁷': 'séptima', '⁸': 'octava', '⁹': 'novena' })[m])
      .replace(/\s+/g, ' ').trim();
  }

  // ---------- Paso a paso (ESCALERA) ----------
  function enRuta(x, path) { let cur = x; for (let i = 1; i < path.length; i++) cur = cur[path[i]]; return cur; }
  function ponerEn(x, path, nuevo) {
    if (path.length === 1) return nuevo;
    const padre = enRuta(x, path.slice(0, -1));
    padre[path[path.length - 1]] = nuevo;
    return x;
  }
  function colapsar(x) {
    if (!x || typeof x !== 'object') return x;
    if (x.t === 'g') { x.a = colapsar(x.a); if (x.a.t === 'n') return n(x.a.v); return x; }
    if (x.a) x.a = colapsar(x.a);
    if (x.b) x.b = colapsar(x.b);
    return x;
  }
  function reducibles(x) {
    const out = []; let pos = 0;
    (function vis(y, path, gd) {
      if (y.t === 'n') { pos++; return; }
      if (y.t === 'g') { vis(y.a, path + 'a', gd + 1); return; }
      if (y.t === 'o') { const mi = pos++; vis(y.a, path + 'a', gd); if (y.a.t === 'n') out.push({ path, y, gd, rank: 3, pos: mi }); return; }
      if (y.t === 'p') { vis(y.a, path + 'a', gd); const mi = pos++; if (y.a.t === 'n') out.push({ path, y, gd, rank: 3, pos: mi }); return; }
      vis(y.a, path + 'a', gd); const mi = pos++; vis(y.b, path + 'b', gd);
      if (y.a.t === 'n' && y.b.t === 'n') out.push({ path, y, gd, rank: (y.op === '*' || y.op === '/') ? 2 : 1, pos: mi });
    })(x, 'r', 0);
    return out;
  }
  function elegir(lst) {
    return lst.slice().sort((A, B) => (B.gd - A.gd) || (B.rank - A.rank) || (A.pos - B.pos))[0];
  }
  function reglaDe(y) {
    if (y.t === 'p') return 'POTENCIA';
    if (y.t === 'o') return y.pw ? 'POTENCIA' : 'SIGNOS PEGADOS';
    if (y.op === '*' || y.op === '/') return 'CUENTA LOS NEGATIVOS';
    if (y.b.v < 0 || y.b.plus) return 'SIGNOS PEGADOS';
    const t1 = y.a.v, t2 = y.op === '+' ? y.b.v : -y.b.v;
    if (t1 === 0 || t2 === 0) return 'SE JUNTAN';
    return Math.sign(t1) === Math.sign(t2) ? 'SE JUNTAN' : 'SE CANCELAN';
  }
  function escalonDe(r) {
    if (r.gd > 0) return 1;
    if (r.y.t === 'p' || r.y.t === 'o') return 2;
    return r.rank === 2 ? 3 : 4;
  }
  function pasos(expr) {
    let cur = colapsar(clon(expr));
    const out = [];
    let guard = 0;
    while (cur.t !== 'n' && guard++ < 40) {
      const r = elegir(reducibles(cur));
      if (!r) break;
      const antes = clon(cur);
      const valor = ev(r.y);
      const sub = clon(r.y);
      cur = colapsar(ponerEn(cur, r.path.split(''), n(valor)));
      out.push({ antes, path: r.path, sub, valor, despues: clon(cur), escalon: escalonDe(r), regla: reglaDe(r.y), tipo: r.y.t === 'b' ? r.y.op : r.y.t });
    }
    return out;
  }
  // La ruta 'r' + letras: 'rab' = raíz → a → b
  function siguienteRuta(expr) { const r = elegir(reducibles(colapsar(clon(expr)))); return r ? r.path : null; }

  // ---------- Evaluaciones con error (diagnóstico) ----------
  function aplanar(x, atravesarGrupos) {
    // devuelve [v0, op1, v1, op2, v2...] con átomos evaluados
    if (x.t === 'b') {
      const opx = x.imp ? '*' : x.op;
      return aplanar(x.a, atravesarGrupos).concat([opx], aplanar(x.b, atravesarGrupos));
    }
    if (x.t === 'g' && atravesarGrupos) return aplanar(x.a, true);
    return [evSeguro(x)];
  }
  function opera(A, op, C) {
    if (A === null || C === null) return null;
    if (op === '+') return A + C; if (op === '-') return A - C; if (op === '*') return A * C;
    if (C === 0 || A % C !== 0) return null; return A / C;
  }
  function plegarIzq(lst) { let r = lst[0]; for (let i = 1; i < lst.length; i += 2) r = opera(r, lst[i], lst[i + 1]); return r; }
  function conJerarquia(lst, rtl) {
    const terms = [], tops = []; let fac = [lst[0]], fops = [];
    const cerrar = () => { terms.push(evalFactores(fac, fops, rtl)); };
    for (let i = 1; i < lst.length; i += 2) {
      const op = lst[i];
      if (op === '*' || op === '/') { fops.push(op); fac.push(lst[i + 1]); }
      else { cerrar(); tops.push(op); fac = [lst[i + 1]]; fops = []; }
    }
    cerrar();
    return evalFactores(terms, tops, rtl);
  }
  function evalFactores(f, ops, rtl) {
    if (!rtl) { let r = f[0]; for (let i = 0; i < ops.length; i++) r = opera(r, ops[i], f[i + 1]); return r; }
    let r = f[f.length - 1];
    for (let i = ops.length - 1; i >= 0; i--) r = opera(f[i], ops[i], r);
    return r;
  }
  const entero = (v) => (v === null || !Number.isFinite(v) || Math.round(v) !== v) ? null : norm(v);
  const alt = {
    izqADer: (x) => entero(plegarIzq(aplanar(x, false))),          // E16: sin jerarquía
    mismoEscalonDer: (x) => entero(conJerarquia(aplanar(x, false), true)), // E17: mismo escalón de derecha a izquierda
    sinParentesis: (x) => entero(conJerarquia(aplanar(x, true), false))    // E19: quitó los paréntesis sin resolver
  };

  // Términos con su signo (LECTURA) de una cadena de + y − de números
  function terminos(x) {
    if (x.t === 'n') return [x.v];
    if (x.t === 'b' && (x.op === '+' || x.op === '-')) {
      const izq = terminos(x.a); if (!izq) return null;
      if (x.b.t !== 'n') return null;
      return izq.concat([x.op === '+' ? x.b.v : norm(-x.b.v)]);
    }
    return null;
  }

  // ---------- Azar con semilla ----------
  function rng(seed) {
    let a = (seed >>> 0) || 1;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const ri = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  function barajar(r, arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function semillaNueva() { return (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0; }

  // ---------- Leer respuesta escrita ----------
  function leerNumero(s) {
    if (typeof s === 'number') return norm(s);
    const t = String(s).trim().replace(/[−–—]/g, '-').replace(/\s+/g, '').replace(/^\+/, '');
    if (!/^-?\d+$/.test(t)) return null;
    return norm(parseInt(t, 10));
  }

  // ---------- Catálogo único de errores ----------
  const ERR = {
    E0: { txt: 'El signo está bien, pero la cuenta con los tamaños no.', lamina: 15, tema: 'A' },
    E1: { txt: 'Usaste «negativo por negativo da positivo» en una suma o resta. Esa regla es solo para ·, ÷ y signos pegados.', lamina: 28, tema: 'A' },
    E2: { txt: 'Con el mismo signo, restaste. Si los dos son deudas (o los dos plata), SE JUNTAN.', lamina: 12, tema: 'A' },
    E3: { txt: 'Con signos distintos, juntaste. Si uno es plata y otro deuda, SE CANCELAN.', lamina: 13, tema: 'A' },
    E4: { txt: 'El tamaño está bien, pero el signo quedó al revés.', lamina: 13, tema: 'A' },
    E5: { txt: 'Restaste al revés (3 − 8 = 5). Tienes 3 y pagas 8: te faltan 5 → −5.', lamina: 14, tema: 'A' },
    E6: { txt: 'No usaste los signos pegados en −(−): quitar una deuda es ganar.', lamina: 21, tema: 'B' },
    E6b: { txt: 'Un menos pegado a un paréntesis con negativo: − y − dan +, así que −(−a) = a.', lamina: 21, tema: 'B' },
    E7: { txt: 'Tomaste +(−) como si sumara. Te dan una deuda: pierdes.', lamina: 21, tema: 'B' },
    E7b: { txt: 'Tomaste −(+) como si sumara. Te quitan plata: pierdes.', lamina: 21, tema: 'B' },
    E8: { txt: 'Con una cantidad PAR de negativos al multiplicar o dividir, el resultado es positivo.', lamina: 26, tema: 'C' },
    E9: { txt: 'Sumaste o restaste donde había que multiplicar o dividir (número pegado a un paréntesis = multiplicar).', lamina: 23, tema: 'C' },
    E10: { txt: 'Con una cantidad IMPAR de negativos al multiplicar o dividir, el resultado es negativo.', lamina: 26, tema: 'C' },
    E11: { txt: 'Multiplicaste en vez de dividir.', lamina: 26, tema: 'C' },
    E12: { txt: 'Con el cero: cualquier número por 0 da 0, y no se divide entre 0.', lamina: 26, tema: 'C' },
    E13a: { txt: 'Tomaste −a² como (−a)². Sin paréntesis, el exponente solo toca al número; el menos espera afuera.', lamina: 32, tema: 'D' },
    E13b: { txt: 'Tomaste (−a)² como −a². Con paréntesis, el exponente toca al negativo completo.', lamina: 32, tema: 'D' },
    E14: { txt: 'Multiplicaste la base por el exponente. 2³ es 2 · 2 · 2, no 2 · 3.', lamina: 30, tema: 'D' },
    E15: { txt: 'Con exponente IMPAR, una base negativa da negativo.', lamina: 31, tema: 'D' },
    E16: { txt: 'Hiciste las operaciones en orden sin respetar la ESCALERA: · y ÷ van antes que + y −.', lamina: 34, tema: 'E' },
    E17: { txt: 'En el mismo escalón se va de izquierda a derecha, como lees.', lamina: 34, tema: 'E' },
    E18: { txt: 'Separaste un número de su signo. Cada número se lleva el signo de su izquierda.', lamina: 10, tema: 'A' },
    E19: { txt: 'Quitaste el paréntesis sin resolverlo primero. Primero lo de adentro.', lamina: 36, tema: 'E' },
    E20: { txt: 'Multiplicaste antes de la potencia. La potencia va en un escalón más alto.', lamina: 36, tema: 'E' },
    E21: { txt: 'Perdiste o cambiaste un signo entre un paso y el siguiente.', lamina: 35, tema: 'E' },
    E30: { txt: 'Elegiste PLATA donde había multiplicación o división.', lamina: 29, tema: 'C' },
    E31: { txt: 'Elegiste CUENTA LOS NEGATIVOS en una suma o resta.', lamina: 28, tema: 'A' },
    E32: { txt: 'Tocaste una operación que no va primero en la ESCALERA.', lamina: 34, tema: 'E' }
  };

  LS.M = {
    MENOS, n, b, p, o, g, clon, ev, evSeguro, fmt, numHtml, html, texto, hablar,
    pasos, siguienteRuta, enRuta, colapsar, alt, terminos,
    rng, ri, pick, barajar, semillaNueva, leerNumero, ERR
  };
})();
