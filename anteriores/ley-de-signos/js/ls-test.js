/* Test final de 25 preguntas: plantillas con semilla (semilla 0 = versión A), pantallas de
   intro, pregunta, revisión y resultados, guardado continuo en LS.st.test y envío del resultado.
   Expone LS.test = { abrir(root, opts), atras() } y, para el validador, LS.test._generar(semilla). */
(function () {
  'use strict';
  const LS = window.LS = window.LS || {};
  const M = () => LS.M;
  const MENOS = '−';
  const TOTAL = 25;

  // ======================================================================
  // 1. TEMAS, VOCABULARIO Y EXPRESIONES DE LAS LÁMINAS
  // ======================================================================
  const TEMAS = {
    A: { nombre: 'Sumar y restar', regla: 'PLATA', lamina: 12, nivel: 1 },
    B: { nombre: 'Signos pegados', regla: 'SIGNOS PEGADOS', lamina: 21, nivel: 3 },
    C: { nombre: 'Multiplicar y dividir', regla: 'CUENTA LOS NEGATIVOS', lamina: 26, nivel: 4 },
    D: { nombre: 'Potencias', regla: 'POTENCIA', lamina: 31, nivel: 5 },
    E: { nombre: 'Operaciones combinadas', regla: 'ESCALERA', lamina: 34, nivel: 6 }
  };
  const TEMA_DE = { 1: 'A', 5: 'A', 9: 'A', 14: 'A', 19: 'A', 2: 'B', 6: 'B', 12: 'B', 16: 'B', 22: 'B', 4: 'C', 7: 'C', 11: 'C', 15: 'C', 20: 'C', 3: 'D', 8: 'D', 13: 'D', 17: 'D', 24: 'D', 10: 'E', 18: 'E', 21: 'E', 23: 'E', 25: 'E' };
  const NUMERICAS = { 19: 1, 20: 1, 22: 1, 24: 1, 25: 1 };
  const FIJAS = { 1: 1, 7: 1 };               // Q1 ancla; Q7 contraste declarado con Q1
  const EXCEPCION_LAMINA = { 1: 1, 7: 1 };    // únicas que pueden coincidir con una lámina
  const EXCEPCION_RANGO = { 8: 1 };           // (−4)³ = −64 ya está en la versión A

  // Ejemplos y ejercicios que aparecen en las láminas (guion + correcciones del plan final).
  // Ningún ítem del test puede ser igual a uno de estos (salvo Q1 y Q7).
  const LAMINAS_EXPR = [
    '−5 − 9', '8 − 5', '−9 + 5', '−3 + 10', '3 − 8', '−8 + 13', '−6 − 7', '−11 + 4', '−6 − 9',
    '3 − 7 + 2 − 5', '−4 + 10 − 3', '−4 + 10', '−6 + 2', '−3 − 8', '3 − 7', '−4 + 2', '−2 − 5', '3 + 4', '9 − 5',
    '5 + (+2)', '5 + (−2)', '5 − (+2)', '5 − (−2)', '5 − 2', '5 − 1', '5 − 0', '5 − (−1)', '8 − (−3)',
    '6 + (−9)', '6 − 9', '−4 − (−10)', '−5 − (−9)', '−5 + 9', '−8 − (−2)', '−8 + 2', '−8 − 2', '−8 ÷ (−2)', '(−8) ÷ (−2)',
    '9 − (−4)', '−4 − 6', '−7 − 3', '3 + (−3)', '7 − (−2)', '7 + 2', '5 − (−4)', '−3 − (−10)', '−3 + 10',
    '2 · (−4)', '2(−4)', '2 − 4', '2 + 4', '5 · (−3)', '3 · (−2)', '(−2) · 3', '3 · 2', '4 · (−5)', '2 · (−2)', '1 · (−2)',
    '0 · (−2)', '(−1) · (−2)', '(−2) · (−2)', '(−3) · (−4)', '(−3)(−4)', '(−20) ÷ 4', '(−18) ÷ (−6)', '(−1)(−2)(−3)',
    '(−6) ÷ (−2)', '(−24) ÷ 6', '(−36) ÷ (−4)', '(−12) ÷ 3', '0 · (−3)', '(−5)(−9)',
    '(−2)¹', '(−2)²', '(−2)³', '(−2)⁴', '(−1)⁵', '(−3)²', '−3²', '−4²', '(−5)²', '(−3)³', '(−4)²', '−(−3)²',
    '12 ÷ 3 · 2', '12 ÷ 6', '10 − 4 + 2', '2 + 3 · (−4)', '2 + 3', '3 − 2(−4) + (−6) ÷ 2', '3 − 2(−4) + 1',
    '7 − (3 − 5)', '7 − [3 − 5]', '3 − 5', '2 · (−3)²', '5 − (2 − 6)', '2 − 6', '10 − 3(−2)²', '10 − 12',
    '(−12) ÷ 4 − 2(−5)', '−1 + 18 ÷ (−3) · 2', '4 − 5 · (−2)', '4 + 10', '8 − [1 − 4]', '1 − 4', '8 − (−3)',
    '7 − 10', '7 − 15', '(−7)(−6)', '(−7) · (−6)', '(−12) ÷ 4', '(−6) ÷ 2', '2 − 12', '4 − 11',
    '−4 − 9', '−8 + 3', '5 − 12'   // de ls-laminas-data-a.js
    // Nota: (−6)² aparece en la capa 2 de la lámina 36 solo como camino equivocado de 2 · (−3)²;
    // el plan final la eligió como Q3 de la versión A, así que se permite.
  ];
  function clave(s) {
    return String(s).replace(/\s+/g, '').replace(/[−–-]/g, '-').replace(/\[/g, '(').replace(/\]/g, ')')
      .replace(/·\(/g, '(').replace(/\)·\(/g, ')(');
  }
  const CLAVES_LAMINAS = {};
  LAMINAS_EXPR.forEach(s => { CLAVES_LAMINAS[clave(s)] = s; });
  const esDeLamina = (nodo) => !!CLAVES_LAMINAS[clave(M().texto(nodo))];

  // ======================================================================
  // 2. PLANTILLAS (parámetros de la versión A + generador + armado)
  // ======================================================================
  const PA = {
    1: {}, 2: { a: 7, b: 3 }, 3: { a: 6 }, 4: { q: 6, d: 3 }, 5: { a: 6, b: 11 }, 6: { a: 6, b: 3 }, 7: {},
    8: { a: 4, e: 3 }, 9: { a: 9, b: 4 }, 10: { a: 3, b: 2, c: 5 }, 11: { q: 7, d: 6 }, 12: { a: 4, b: 6 },
    13: { a: 6 }, 14: { a: 4, b: 10 }, 15: { a: 6, b: 4, orden: [0, 1, 2, 3] }, 16: { a: 8, b: 3 }, 17: { n: 7 },
    18: { k: 2, d: 2, m: 3 }, 19: { a: 4, b: 9, c: 3, d: 6 }, 20: { a: 2, b: 3, c: 5 }, 21: { a: 9, b: 4, c: 7 },
    22: { a: 3, b: 5, c: 6 }, 23: { a: 5, b: 2, c: 3 }, 24: { a: 2 }, 25: { a: 5, b: 4, c: 3, d: 8, e: 2 }
  };

  // Parámetros al azar (el armado y la validación filtran lo que no sirve)
  function params(q, r, ctx) {
    const ri = (lo, hi) => M().ri(r, lo, hi), pick = (arr) => M().pick(r, arr);
    let a, b, c, d, e, k, m, qq;
    switch (q) {
      case 2: a = ri(3, 12); return { a, b: ri(2, a - 1) };
      case 3: return { a: pick([4, 5, 6, 7]) };
      case 4: case 11: do { qq = ri(2, 9); d = ri(2, 9); } while (qq * d > 50); return { q: qq, d };
      case 5: a = ri(2, 14); return { a, b: ri(a + 1, 15) };
      case 6: a = ri(3, 12); return { a, b: ri(2, a - 1) };
      case 8: return pick([{ a: 4, e: 3 }, { a: 5, e: 3 }, { a: 2, e: 5 }]);
      case 9: b = ri(2, 14); return { a: ri(b + 1, 15), b };
      case 10: do { a = ri(2, 9); b = ri(2, 9); c = ri(2, 9); } while (b * c > 50 || b * c <= a); return { a, b, c };
      case 12: a = ri(2, 11); return { a, b: ri(a + 1, 12) };
      case 13: return { a: ctx[3].p.a };
      case 14: a = ri(2, 14); return { a, b: ri(a + 1, 15) };
      case 15: do { a = ri(2, 9); b = ri(2, 9); } while (a === b || a * b > 50); return { a, b, orden: M().barajar(r, [0, 1, 2, 3]) };
      case 16: b = ri(2, 11); return { a: ri(b + 1, 12), b };
      case 17: return { n: pick([5, 7, 9]) };
      case 18: do { d = ri(2, 5); m = ri(2, 5); k = ri(1, 6); } while (d === m || k * d * m > 50 || k * m * m > 50); return { k, d, m };
      case 19: do { a = ri(2, 9); b = ri(2, 9); c = ri(2, 9); d = ri(2, 9); } while (a - b + c - d >= 0); return { a, b, c, d };
      case 20: do { a = ri(2, 7); b = ri(a + 1, 8); c = ri(b + 1, 9); } while (a * b * c > 50); return { a, b, c };
      case 21: b = ri(2, 8); return { a: ri(2, 9), b, c: ri(b + 1, 9) };
      case 22: do { a = ri(2, 9); b = ri(2, 9); c = ri(2, 9); } while (a === b || b === c || a === c); return { a, b, c };
      case 23: do { a = ri(2, 9); b = ri(2, 5); c = ri(2, 4); } while (b * c * c > 50 || b * c * c <= a || b === c); return { a, b, c };
      case 24: do { a = pick([2, 3, 4, 5, 6]); } while (a === ctx[3].p.a); return { a };
      case 25: do { a = ri(2, 9); b = ri(2, 6); c = ri(2, 6); e = ri(2, 5); d = ri(1, 5) * e; } while (b * c > 50 || a + b * c > 50); return { a, b, c, d, e };
    }
    return PA[q];
  }

  // Frases de apoyo de las explicaciones (HTML con fichas; a color en la revisión final)
  const N = (v) => M().numHtml(v, false, false);
  const Nm = (v) => M().numHtml(v, true, false);   // con «+» visible
  const X = (nodo) => M().html(nodo, { clase: 'ts-fx-in' });
  function cancelan(t, d) {
    if (t >= d) return 'SE CANCELAN: ' + t + ' ' + MENOS + ' ' + d + ' = ' + (t - d) + ', y gana la plata → ' + N(t - d);
    return 'SE CANCELAN: ' + d + ' ' + MENOS + ' ' + t + ' = ' + (d - t) + ', y gana la deuda → ' + N(t - d);
  }

  // Arma el ítem q con sus parámetros: nodo, correcta, distractores/reconocidos con código y explicación.
  function armar(q, p) {
    const Mo = M(), nn = Mo.n, bb = Mo.b, pp = Mo.p, oo = Mo.o, gg = Mo.g;
    const it = { q, tema: TEMA_DE[q], tipo: q === 15 ? 'elige' : NUMERICAS[q] ? 'num' : 'mc', p };
    let dis = [], nodo = null, correcta = null, exp = '';
    const { a, b, c, d, e } = p;
    switch (q) {
      case 1:
        nodo = bb('-', nn(-5), 9); correcta = -14;
        dis = [[14, 'E1'], [-4, 'E2'], [4, 'E2+E4']];
        exp = 'Cada número se lleva el signo que tiene delante, así que los números son ' + N(-5) + ' y ' + N(-9) + '. Los dos son deudas, entonces SE JUNTAN: debes 5 y debes 9 más, 5 + 9 = 14 de deuda. Resultado: ' + N(-14) + '. Aquí no hay multiplicación, así que «negativo por negativo» no se usa.';
        break;
      case 2:
        nodo = bb('+', a, nn(-b)); correcta = a - b;
        dis = [[a + b, 'E7'], [-(a - b), 'E4'], [-(a + b), 'E3']];
        exp = 'Primero, SIGNOS PEGADOS: + con ' + MENOS + ' da ' + MENOS + ', así que ' + X(nodo) + ' = ' + X(bb('-', a, b)) + '. Es como si te dieran una deuda de ' + b + ': tienes ' + a + ' y pagas ' + b + '. ' + cancelan(a, b) + '.';
        break;
      case 3:
        nodo = pp(nn(-a), 2); correcta = a * a;
        dis = [[-a * a, 'E13b'], [-2 * a, 'E14'], [2 * a, 'E14']];
        exp = 'El ² toca todo lo que está pegado a él, y aquí es el paréntesis completo: ' + X(bb('*', nn(-a), nn(-a), { imp: true })) + '. CUENTA LOS NEGATIVOS: hay 2, que es par, así que da positivo. Tamaños: ' + a + ' · ' + a + ' = ' + a * a + '. Resultado: ' + N(a * a) + '.';
        break;
      case 4: {
        const qq = p.q;
        nodo = bb('/', nn(-qq * d), d); correcta = -qq;
        dis = [[-qq * d * d, 'E11'], [-qq * d + d, 'E9'], [qq, 'E10']];
        exp = 'Dividir usa la misma regla que multiplicar: CUENTA LOS NEGATIVOS. Hay 1, que es impar, así que el resultado es negativo. Tamaños: ' + qq * d + ' ÷ ' + d + ' = ' + qq + '. Resultado: ' + N(-qq) + '.';
        break;
      }
      case 5:
        nodo = bb('+', nn(-a), b); correcta = b - a;
        dis = [[-(b - a), 'E4'], [-(a + b), 'E3'], [a + b, 'E3']];
        exp = 'Debes ' + a + ' y tienes ' + b + ': ' + cancelan(b, a) + '. El signo lo pone el que tiene más tamaño, no el que va primero.';
        break;
      case 6:
        nodo = bb('-', a, nn(-b)); correcta = a + b;
        dis = [[a - b, 'E6'], [b - a, 'E6'], [-(a + b), 'E4']];
        exp = 'SIGNOS PEGADOS: ' + MENOS + ' con ' + MENOS + ' da +, así que ' + X(nodo) + ' = ' + X(bb('+', a, b)) + '. Te QUITAN una deuda de ' + b + ', y eso es ganar: ' + a + ' + ' + b + ' = ' + (a + b) + '. Resultado: ' + N(a + b) + '.';
        break;
      case 7:
        nodo = bb('*', nn(-5), nn(-9), { imp: true }); correcta = 45;
        dis = [[-45, 'E8'], [-14, 'E9'], [14, 'E9']];
        exp = 'Dos paréntesis pegados significan MULTIPLICAR. CUENTA LOS NEGATIVOS: hay 2, que es par, así que el resultado es positivo. Tamaños: 5 · 9 = 45. Resultado: ' + N(45) + '. Compárala con la pregunta 1: ' + X(bb('-', nn(-5), 9)) + ' = ' + N(-14) + ', porque ahí no se multiplica.';
        break;
      case 8: {
        let pot = 1; for (let i = 0; i < e; i++) pot *= a;
        let fac = nn(-a); for (let i = 1; i < e; i++) fac = bb('*', fac, nn(-a), { imp: true });
        nodo = pp(nn(-a), e); correcta = -pot;   // exponente impar
        dis = [[pot, 'E15'], [-a * e, 'E14'], [a * e, 'E14']];
        exp = X(nodo) + ' = ' + X(fac) + '. Hay ' + e + ' negativos, que es impar, así que el resultado es negativo. Tamaños: ' + Array(e).fill(a).join(' · ') + ' = ' + pot + '. Resultado: ' + N(-pot) + '. Exponente par da positivo; exponente impar conserva el negativo.';
        break;
      }
      case 9:
        nodo = bb('+', nn(-a), b); correcta = b - a;
        dis = [[a - b, 'E4'], [-(a + b), 'E3'], [a + b, 'E3']];
        exp = 'Debes ' + a + ' y tienes ' + b + ': ' + cancelan(b, a) + '. Ojo: el signo lo pone el que tiene más tamaño, no el número mayor de la recta.';
        break;
      case 10: {
        const pr = -b * c;
        nodo = bb('+', a, bb('*', b, nn(-c))); correcta = a + pr;
        dis = [[-(a + b) * c, 'E16'], [-a - b * c, 'E18'], [a + b * c, 'E10']];
        exp = 'ESCALERA: el · va antes que el +. Primero ' + X(bb('*', b, nn(-c))) + ' = ' + N(pr) + ', porque hay 1 negativo. Queda ' + X(bb('+', a, nn(pr))) + ' = ' + X(bb('-', a, b * c)) + '. Tienes ' + a + ' y debes ' + (b * c) + ': ' + cancelan(a, b * c) + '.';
        break;
      }
      case 11: {
        const qq = p.q;
        nodo = bb('/', nn(-qq * d), nn(-d)); correcta = qq;
        dis = [[-qq, 'E8'], [-qq * d - d, 'E9'], [-qq * d + d, 'E9']];
        exp = 'CUENTA LOS NEGATIVOS: hay 2, que es par, así que el resultado es positivo. Tamaños: ' + qq * d + ' ÷ ' + d + ' = ' + qq + '. Resultado: ' + N(qq) + '.';
        break;
      }
      case 12:
        nodo = bb('-', nn(-a), nn(b, { plus: true })); correcta = -(a + b);
        dis = [[b - a, 'E7b'], [a - b, 'E2'], [a + b, 'E4']];
        exp = 'SIGNOS PEGADOS: ' + MENOS + ' con + da ' + MENOS + ', así que ' + X(nodo) + ' = ' + X(bb('-', nn(-a), b)) + '. Te quitan ' + b + ' de plata cuando ya debías ' + a + ': SE JUNTAN, ' + a + ' + ' + b + ' = ' + (a + b) + ' de deuda. Resultado: ' + N(-(a + b)) + '.';
        break;
      case 13:
        nodo = oo(pp(a, 2)); correcta = -a * a;
        dis = [[a * a, 'E13a'], [-2 * a, 'E14'], [2 * a, 'E14']];
        exp = 'Sin paréntesis, el ² solo toca al ' + a + '. El menos queda afuera y dice «lo contrario de». Primero ' + a + '<sup>2</sup> = ' + a + ' · ' + a + ' = ' + a * a + ', y después lo contrario: ' + N(-a * a) + '. Compárala con la pregunta 3: ' + X(pp(nn(-a), 2)) + ' = ' + N(a * a) + '.';
        break;
      case 14:
        nodo = bb('-', a, b); correcta = a - b;
        dis = [[b - a, 'E5'], [a + b, 'E3'], [-(a + b), 'E3']];
        exp = 'Los números son ' + Nm(a) + ' y ' + N(-b) + '. Tienes ' + a + ' y gastas ' + b + ': ' + cancelan(a, b) + '. Restar no es voltear los números.';
        break;
      case 15: {
        const base = [
          { nodo: bb('-', nn(-a), b), codigo: 'E1' },
          { nodo: bb('+', nn(-a), nn(-b)), codigo: 'E7' },
          { nodo: bb('*', nn(-a), nn(-b), { imp: true }), codigo: '' },
          { nodo: oo(gg(bb('+', a, b))), codigo: 'E6b' }
        ];
        const L = 'abcd';
        it.opciones = p.orden.map((ix, pos) => ({ letra: L[pos], base: ix, nodo: base[ix].nodo, texto: Mo.texto(base[ix].nodo), v: Mo.evSeguro(base[ix].nodo), codigo: base[ix].codigo }));
        const letraDe = (ix) => it.opciones.find(o => o.base === ix).letra;
        it.correcta = letraDe(2);
        it.texto = '¿Cuál da POSITIVO? ' + it.opciones.map(o => '(' + o.letra + ') ' + o.texto).join('  ');
        it.pregunta = '¿En cuál de estas operaciones el resultado es POSITIVO?';
        const ab = [letraDe(0), letraDe(1)].sort();
        it.exp = 'Solo en (' + letraDe(2) + ') hay multiplicación: dos paréntesis pegados. Tiene 2 negativos, que es par, así que da positivo: ' + X(base[2].nodo) + ' = ' + N(a * b) + '. En (' + ab[0] + ') y (' + ab[1] + ') hay dos deudas que SE JUNTAN y dan ' + N(-(a + b)) + '. En (' + letraDe(3) + '), lo contrario de ' + (a + b) + ' es ' + N(-(a + b)) + '.';
        return it;
      }
      case 16:
        nodo = bb('-', nn(-a), nn(-b)); correcta = b - a;
        dis = [[-a - b, 'E6'], [a - b, 'E4'], [a + b, 'E6']];
        exp = 'SIGNOS PEGADOS: ' + MENOS + ' con ' + MENOS + ' da +, así que ' + X(nodo) + ' = ' + X(bb('+', nn(-a), b)) + '. Debías ' + a + ' y te perdonan ' + b + ': ' + cancelan(b, a) + '.';
        break;
      case 17: {
        const n = p.n;
        nodo = pp(nn(-1), n); correcta = -1;
        dis = [[1, 'E15'], [-n, 'E14'], [n, 'E14']];
        exp = 'Es (' + N(-1) + ') multiplicado ' + n + ' veces por sí mismo. Hay ' + n + ' negativos, que es impar, así que el resultado es negativo. Y 1 · 1 · … · 1 = 1. Resultado: ' + N(-1) + '.';
        break;
      }
      case 18: {
        const k = p.k, m = p.m, N0 = k * d * m;
        nodo = bb('*', bb('/', nn(-N0), d), m); correcta = -k * m * m;
        dis = [[-k, 'E17'], [k * m * m, 'E10'], [k, 'E17']];
        exp = '÷ y · están en el MISMO escalón de la ESCALERA, así que se resuelven de izquierda a derecha, como lees. Primero ' + X(bb('/', nn(-N0), d)) + ' = ' + N(-k * m) + '. Después ' + X(bb('*', nn(-k * m), m)) + ' = ' + N(-k * m * m) + '. Si multiplicas primero ' + d + ' · ' + m + ', te sale otra cosa.';
        break;
      }
      case 19:
        nodo = bb('-', bb('+', bb('-', a, b), c), d); correcta = a - b + c - d;
        dis = [[a - (b + c) - d, 'E18'], [a - (b + c - d), 'E18'], [-(a + b + c + d), 'E21'], [a + b + c + d, 'E21'], [-(a - b + c - d), 'E4']];
        exp = 'Cada número se lleva su signo: ' + [Nm(a), N(-b), Nm(c), N(-d)].join(', ') + '. Junta lo que TIENES: ' + a + ' + ' + c + ' = ' + (a + c) + '. Junta lo que DEBES: ' + b + ' + ' + d + ' = ' + (b + d) + '. ' + cancelan(a + c, b + d) + '.';
        break;
      case 20:
        nodo = bb('*', bb('*', nn(-a), nn(-b), { imp: true }), nn(-c), { imp: true }); correcta = -a * b * c;
        dis = [[a * b * c, 'E10'], [-(a + b + c), 'E9'], [a + b + c, 'E9']];
        exp = 'Los paréntesis pegados significan multiplicar. CUENTA LOS NEGATIVOS: hay 3, que es impar, así que el resultado es negativo. Tamaños: ' + a + ' · ' + b + ' · ' + c + ' = ' + a * b * c + '. Resultado: ' + N(-a * b * c) + '.';
        break;
      case 21: {
        const ad = b - c;
        nodo = bb('-', a, gg(bb('-', b, c), '[')); correcta = a - ad;
        dis = [[a - b - c, 'E19'], [a - (c - b), 'E6'], [a + b + c, 'E21']];
        exp = 'ESCALERA: primero lo de adentro del corchete. ' + X(bb('-', b, c)) + ' = ' + N(ad) + ' (tienes ' + b + ' y debes ' + c + '). Queda ' + X(bb('-', a, nn(ad))) + ', y con SIGNOS PEGADOS ' + MENOS + ' con ' + MENOS + ' da +: ' + X(bb('+', a, c - b)) + ' = ' + N(a - ad) + '.';
        break;
      }
      case 22:
        nodo = bb('-', bb('+', nn(-a), nn(b, { plus: true })), nn(-c)); correcta = -a + b + c;
        dis = [[-a + b - c, 'E6'], [-a - b + c, 'E7b'], [-a - b - c, 'E21'], [a + b + c, 'E21']];
        exp = 'Primero los SIGNOS PEGADOS: + con + da + y ' + MENOS + ' con ' + MENOS + ' da +. Queda ' + X(bb('+', bb('+', nn(-a), b), c)) + '. Tienes ' + b + ' + ' + c + ' = ' + (b + c) + ' y debes ' + a + ': ' + cancelan(b + c, a) + '.';
        break;
      case 23: {
        const c2 = c * c, bc2 = b * c2;
        nodo = bb('-', a, bb('*', b, pp(nn(-c), 2), { imp: true })); correcta = a - bc2;
        dis = [[(a - b) * c2, 'E16'], [a + bc2, 'E13b'], [a - (b * c) * (b * c), 'E20']];
        exp = 'ESCALERA: la potencia va primero: ' + X(pp(nn(-c), 2)) + ' = ' + N(c2) + '. Luego el ·: ' + b + ' · ' + c2 + ' = ' + bc2 + '. Al final ' + X(bb('-', a, bc2)) + ': tienes ' + a + ' y debes ' + bc2 + '. ' + cancelan(a, bc2) + '.';
        break;
      }
      case 24:
        nodo = oo(pp(nn(-a), 2)); correcta = -a * a;
        dis = [[a * a, 'E13a']];
        exp = 'El ² solo toca lo que está dentro del paréntesis: ' + X(pp(nn(-a), 2)) + ' = ' + N(a * a) + '. El menos de afuera espera y al final dice «lo contrario de»: lo contrario de ' + N(a * a) + ' es ' + N(-a * a) + '.';
        break;
      case 25: {
        const pr = -b * c, dv = -d / e, t = a + b * c;
        nodo = bb('+', bb('-', a, bb('*', b, nn(-c), { imp: true })), bb('/', nn(-d), e)); correcta = a + b * c - d / e;
        dis = [[a - b * c - d / e, 'E6'], [a + b * c + d / e, 'E10'], [-correcta, 'E4'], [a - b - c - d / e, 'E9']];
        exp = 'ESCALERA, escalón de · y ÷: ' + X(bb('*', b, nn(-c), { imp: true })) + ' = ' + N(pr) + ' (número pegado a un paréntesis significa multiplicar) y ' + X(bb('/', nn(-d), e)) + ' = ' + N(dv) + '. Queda ' + X(bb('+', bb('-', a, nn(pr)), nn(dv))) + '. Con SIGNOS PEGADOS eso es ' + X(bb('-', bb('+', a, b * c), d / e)) + '. Tienes ' + t + ' y debes ' + (d / e) + ': ' + cancelan(t, d / e) + '.';
        break;
      }
    }
    it.nodo = nodo;
    it.texto = Mo.texto(nodo);
    it.correcta = correcta;
    it.exp = exp;
    if (it.tipo === 'mc') {
      it.pregunta = '¿Cuánto es?';
      it.opciones = [{ v: correcta, codigo: '' }].concat(dis.map(x => ({ v: x[0], codigo: x[1] })))
        .sort((x, y) => x.v - y.v);
    } else {
      it.pregunta = 'Escribe el resultado';
      it.reconoce = dis.map(x => ({ v: x[0], codigo: x[1] }));
    }
    return it;
  }

  // ---------- Validez de un ítem (el generador descarta lo que no cumple) ----------
  function subnodos(x, out) {
    out = out || []; out.push(x);
    if (x.a && typeof x.a === 'object') subnodos(x.a, out);
    if (x.b && typeof x.b === 'object') subnodos(x.b, out);
    return out;
  }
  function problemas(it) {
    const Mo = M(), err = [];
    const nodos = it.tipo === 'elige' ? it.opciones.map(o => o.nodo) : [it.nodo];
    nodos.forEach(nd => {
      if (Mo.evSeguro(nd) === null) err.push('división no exacta o entre 0');
      subnodos(nd).forEach(s => {
        if (s.t === 'b' && s.op === '/') { const dv = Mo.evSeguro(s.b); if (dv === 0) err.push('÷0'); }
        const v = Mo.evSeguro(s);
        if (v !== null && !EXCEPCION_RANGO[it.q] && (v < -50 || v > 50)) err.push('intermedio fuera de rango: ' + v);
      });
      if (!EXCEPCION_LAMINA[it.q] && esDeLamina(nd)) err.push('igual a una lámina: ' + Mo.texto(nd));
    });
    if (it.tipo === 'mc') {
      const vs = it.opciones.map(o => o.v);
      if (new Set(vs).size !== 4) err.push('opciones repetidas');
      if (vs.indexOf(it.correcta) < 0) err.push('falta la correcta');
      if (Mo.ev(it.nodo) !== it.correcta) err.push('clave mal');
    } else if (it.tipo === 'num') {
      const vs = it.reconoce.map(o => o.v).concat([it.correcta]);
      if (new Set(vs).size !== vs.length) err.push('reconocidos repetidos');
      if (Mo.ev(it.nodo) !== it.correcta) err.push('clave mal');
    } else {
      const pos = it.opciones.filter(o => o.v > 0);
      if (pos.length !== 1 || pos[0].letra !== it.correcta) err.push('Q15: debe haber una sola positiva');
      if (new Set(it.opciones.map(o => o.texto)).size !== 4) err.push('Q15 opciones repetidas');
    }
    if (it.correcta === 0) err.push('resultado 0');
    return err;
  }

  // ---------- Generador de versiones ----------
  const cache = {};
  function generar(semilla) {
    semilla = (semilla >>> 0);
    if (cache[semilla]) return cache[semilla];
    const esA = semilla === 0;
    const r = M().rng(semilla ^ 0x5eed);
    const ctx = {}, items = [];
    for (let q = 1; q <= TOTAL; q++) {
      let it = null;
      if (esA || FIJAS[q]) it = armar(q, PA[q]);
      else {
        for (let t = 0; t < 500 && !it; t++) {
          const cand = armar(q, params(q, r, ctx));
          if (!problemas(cand).length) it = cand;
        }
        if (!it) it = armar(q, PA[q]);
      }
      ctx[q] = it; items.push(it);
    }
    cache[semilla] = items;
    return items;
  }
  const versionDe = (s) => (s >>> 0) === 0 ? 'A' : 'V' + (s >>> 0).toString(36).toUpperCase();

  // ======================================================================
  // 3. CORRECCIÓN Y RESUMEN
  // ======================================================================
  const fmtV = (v) => v == null || v === '' ? '' : (typeof v === 'string' ? '(' + v + ')' : (v < 0 ? MENOS : '') + Math.abs(v));
  function codigoDe(it, dada) {
    if (dada == null) return 'SR';
    if (it.tipo === 'elige') { const o = it.opciones.find(x => x.letra === dada); return o ? o.codigo : ''; }
    if (dada === it.correcta) return '';
    if (it.tipo === 'mc') { const o = it.opciones.find(x => x.v === dada); return o ? o.codigo : ''; }
    const rc = it.reconoce.find(x => x.v === dada);
    if (rc) return rc.codigo;
    if (dada === -it.correcta) return 'E4';
    if (Math.sign(dada) === Math.sign(it.correcta)) return 'E0';
    return '';
  }
  function errTxt(cod) {
    const E = M().ERR;
    return String(cod || '').split('+').map(c => E[c] ? E[c].txt : '').filter(Boolean).join(' ');
  }

  function calcular(items, respuestas, tiempos) {
    const porTema = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    const cuenta = {}, orden = [];
    const filas = items.map((it, i) => {
      const dada = respuestas[i] == null ? null : respuestas[i];
      const ok = dada !== null && dada === it.correcta;
      const codigo = ok ? '' : codigoDe(it, dada);
      if (ok) porTema[it.tema]++;
      if (!ok && codigo && codigo !== 'SR') codigo.split('+').forEach(c => { if (!cuenta[c]) { cuenta[c] = 0; orden.push(c); } cuenta[c]++; });
      return { q: it.q, tema: it.tema, enunciado: it.texto, dada: fmtV(dada), correcta: fmtV(it.correcta), ok, codigo, segundos: Math.round((tiempos[i] || 0) * 10) / 10 };
    });
    const nota = filas.filter(f => f.ok).length;
    const erroresTop = orden.slice().sort((x, y) => (cuenta[y] - cuenta[x]) || (orden.indexOf(x) - orden.indexOf(y)))
      .slice(0, 2).map(c => ({ codigo: c, veces: cuenta[c], txt: errTxt(c) }));
    return { filas, nota, nota10: Math.round(nota * 4) / 10, porTema, erroresTop, tiempoTotalSeg: Math.round(tiempos.reduce((s, t) => s + (t || 0), 0)) };
  }

  function ganchoNorm() {
    const g = LS.st.laminas && LS.st.laminas.gancho;
    if (g == null || g === '') return null;
    const s = String(g).replace(/[−–]/g, '-').trim().toLowerCase();
    if (s === 'nose' || /idea/.test(s)) return 'nose';
    return ['-14', '-4', '4', '14'].indexOf(s) >= 0 ? s : s;
  }

  function payloadDe(snap) {
    const items = generar(snap.semilla);
    const R = calcular(items, snap.respuestas, snap.tiempos);
    let juego = null;
    try { juego = (LS.juego && LS.juego.resumen ? LS.juego.resumen() : null); } catch (e) { juego = null; }
    return {
      tipoIntento: snap.modo === 'PRACTICA' ? 'PRACTICA' : 'OFICIAL',
      version: snap.version, semilla: snap.semilla,
      nota: R.nota, nota10: R.nota10, porTema: R.porTema,
      gancho: ganchoNorm(),
      respuestas: R.filas,
      tiempoTotalSeg: R.tiempoTotalSeg,
      erroresTop: R.erroresTop,
      juego
    };
  }

  // ======================================================================
  // 4. ESTADO Y TIEMPOS
  // ======================================================================
  let root = null, tec = null, tEntrada = null, desuscribir = null;
  const ui = () => LS.ui;
  function S() { if (!LS.st.test || typeof LS.st.test !== 'object') LS.st.test = {}; return LS.st.test; }
  const guardar = () => { try { LS.guardar(); } catch (e) { } };
  const enCurso = (st) => st.fase === 'intro' || st.fase === 'preg' || st.fase === 'revision';

  function nuevoIntento(modo) {
    const st = S();
    let s = M().semillaNueva() >>> 0;
    const evitar = [st.oficial && st.oficial.semilla, st.practica && st.practica.semilla, 0];
    while (evitar.indexOf(s) >= 0) s = (s + 7919) >>> 0;
    Object.assign(st, {
      modo, semilla: s, version: versionDe(s),
      respuestas: Array(TOTAL).fill(null), tiempos: Array(TOTAL).fill(0),
      idx: 0, fase: 'intro', inicio: null, fin: null
    });
    guardar();
  }

  function empezarReloj() { tEntrada = Date.now(); }
  function cortarReloj() {
    const st = S();
    if (tEntrada != null && st.fase === 'preg' && Array.isArray(st.tiempos)) {
      const dt = Math.min(1800, Math.max(0, (Date.now() - tEntrada) / 1000));
      st.tiempos[st.idx] = Math.round(((st.tiempos[st.idx] || 0) + dt) * 10) / 10;
    }
    tEntrada = null;
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (!root || !document.body.contains(root.querySelector('.ts-preg'))) return;
      if (document.hidden) { cortarReloj(); guardar(); } else empezarReloj();
    });
  }

  function limpiar() {
    if (tec) { try { tec.destruir(); } catch (e) { } tec = null; }
    if (desuscribir) { try { desuscribir(); } catch (e) { } desuscribir = null; }
  }

  // ======================================================================
  // 5. PANTALLAS
  // ======================================================================
  function abrir(r, o) {
    root = r; o = o || {};
    limpiar(); tEntrada = null;
    const st = S();
    // La práctica solo se abre si el intento oficial ya terminó (nunca pisa un oficial en curso).
    if (o.practica && st.oficialTerminado && !enCurso(st)) nuevoIntento('PRACTICA');
    else if (!st.fase || (st.fase === 'resultados' && !st.oficial && !st.practica)) {
      if (st.oficialTerminado && st.oficial) { st.fase = 'resultados'; st.ver = 'OFICIAL'; }
      else nuevoIntento('OFICIAL');
    }
    pintar();
  }

  function pintar() {
    limpiar();
    const st = S();
    ui().cerrarHoja(true);
    if (st.fase === 'resultados') { LS.setColor('full'); pintarResultados(); }
    else {
      LS.setColor('off');
      if (st.fase === 'preg') pintarPregunta();
      else if (st.fase === 'revision') pintarRevision();
      else pintarIntro();
    }
    try { window.scrollTo(0, 0); } catch (e) { }
  }

  const insignia = (st) => st.modo === 'PRACTICA' ? '<span class="ts-insignia">PRÁCTICA</span>' : '';
  const esc = (s) => ui().esc(s);

  // ---------- Intro ----------
  function pintarIntro() {
    const st = S(), practica = st.modo === 'PRACTICA';
    const hechas = (st.respuestas || []).filter(x => x != null).length;
    const correo = LS.st.usuario.correo || '';
    root.innerHTML =
      '<div class="pantalla ts ts-intro">' +
      '<div class="fila ts-cab"><span class="esp ts-cab-t">Test final ' + insignia(st) + '</span>' +
      '<button class="btn-ico" data-a="ajustes" aria-label="Ajustes">' + ui().icon('ajustes') + '</button>' +
      '<button class="btn-ico" data-a="mapa" aria-label="Ir al mapa">' + ui().icon('mapa') + '</button></div>' +
      '<h1 class="ts-h1">' + (practica ? 'Modo práctica' : '25 preguntas, sin apuro') + '</h1>' +
      (practica
        ? '<p class="tinta-2">Es otra versión del test, con números distintos. No cambia tu resultado oficial.</p>'
        : '<div class="caja-nota ts-calma"><p><b>Esto no es para calificarte: es para que veas todo lo que ya aprendiste.</b></p><p>No hay tiempo límite. Los errores no restan: responde todas. Puedes pausar; se guarda solo.</p></div>') +
      '<ul class="ts-reglas">' +
      '<li>' + ui().icon('check') + '<span>Una pregunta por pantalla. Puedes ir atrás y adelante.</span></li>' +
      '<li>' + ui().icon('check') + '<span>No verás si acertaste hasta el final.</span></li>' +
      '<li>' + ui().icon('check') + '<span>Todo va en tinta, como en el examen de admisión.</span></li>' +
      '<li>' + ui().icon('check') + '<span>Antes de terminar podrás revisar cuáles te faltan.</span></li>' +
      '</ul>' +
      (practica ? '' :
        '<div class="tarjeta ts-correo"><p class="peq tinta-2">Tu resultado y un PDF llegarán a:</p>' +
        '<p class="ts-correo-v">' + esc(correo || 'sin correo') + '</p>' +
        '<button class="btn-txt" data-a="correo">¿Está mal? Corregir correo</button></div>') +
      '<div class="esp"></div>' +
      '<button class="btn btn-pri btn-ancho" data-a="empezar">' + (hechas ? 'Seguir donde iba (' + hechas + ' de 25)' : 'Empezar') + ' ' + ui().icon('sig') + '</button>' +
      '</div>';
    root.querySelector('[data-a="empezar"]').addEventListener('click', () => {
      st.fase = 'preg'; if (!st.inicio) st.inicio = Date.now();
      guardar(); pintar();
    });
    const c = root.querySelector('[data-a="correo"]');
    if (c) c.addEventListener('click', () => corregirCorreo(() => pintar()));
    cabecera();
  }
  function cabecera() {
    const a = root.querySelector('[data-a="ajustes"]'), m = root.querySelector('[data-a="mapa"]');
    if (a) a.addEventListener('click', () => LS.app && LS.app.ajustes());
    if (m) m.addEventListener('click', () => { cortarReloj(); guardarTecleado(); guardar(); LS.app && LS.app.ir('hub'); });
  }

  // ---------- Pregunta ----------
  function pintarPregunta() {
    const st = S(), items = generar(st.semilla);
    st.idx = Math.max(0, Math.min(TOTAL - 1, st.idx || 0));
    const i = st.idx, it = items[i], dada = st.respuestas[i];
    const pct = Math.round((i + 1) / TOTAL * 100);
    let cuerpo = '';
    if (it.tipo === 'mc') {
      cuerpo = '<div class="ts-expr">' + M().html(it.nodo) + '</div>' +
        '<div class="opciones ts-opciones" role="radiogroup" aria-label="Opciones">' +
        it.opciones.map(o => '<button class="opt ts-opt" role="radio" aria-checked="' + (dada === o.v) + '" data-v="' + o.v + '"><span class="ts-radio" aria-hidden="true"></span><span class="fx ts-opt-v">' + N(o.v) + '</span></button>').join('') +
        '</div>';
    } else if (it.tipo === 'elige') {
      cuerpo = '<div class="opciones ts-opciones" role="radiogroup" aria-label="Opciones">' +
        it.opciones.map(o => '<button class="opt ts-opt" role="radio" aria-checked="' + (dada === o.letra) + '" data-l="' + o.letra + '"><span class="ts-radio" aria-hidden="true"></span><span class="ts-letra">(' + o.letra + ')</span><span class="ts-opt-v">' + M().html(o.nodo) + '</span></button>').join('') +
        '</div>';
    } else {
      cuerpo = '<div class="ts-expr">' + M().html(it.nodo) + '</div>' +
        '<p class="ts-guardada" aria-live="polite"></p><div class="ts-tec"></div>';
    }
    root.innerHTML =
      '<div class="pantalla ts ts-preg">' +
      '<div class="ts-top">' +
      '<div class="fila"><span class="esp ts-prog">Pregunta ' + (i + 1) + ' de ' + TOTAL + ' ' + insignia(st) + '</span>' +
      '<button class="btn-ico" data-a="ajustes" aria-label="Ajustes">' + ui().icon('ajustes') + '</button>' +
      '<button class="btn-ico" data-a="mapa" aria-label="Pausar e ir al mapa">' + ui().icon('mapa') + '</button></div>' +
      '<div class="ts-barra" aria-hidden="true"><i style="width:' + pct + '%"></i></div></div>' +
      '<section class="tarjeta ts-card" aria-labelledby="ts-enun">' +
      '<p class="ts-enun" id="ts-enun">' + it.pregunta + '</p>' + cuerpo +
      '</section>' +
      '<div class="esp"></div>' +
      '<nav class="ts-nav">' +
      '<button class="btn btn-sec" data-a="ant"' + (i === 0 ? ' aria-label="Volver a las instrucciones"' : '') + '>' + ui().icon('atras') + ' Anterior</button>' +
      '<button class="btn btn-pri" data-a="sig">' + (i === TOTAL - 1 ? 'Revisar' : 'Siguiente') + ' ' + ui().icon('sig') + '</button>' +
      '</nav></div>';

    root.querySelectorAll('.ts-opt').forEach(bt => bt.addEventListener('click', () => {
      const v = bt.hasAttribute('data-l') ? bt.getAttribute('data-l') : Number(bt.getAttribute('data-v'));
      st.respuestas[i] = v; guardar();
      root.querySelectorAll('.ts-opt').forEach(x => x.setAttribute('aria-checked', String(x === bt)));
    }));
    if (it.tipo === 'num') montarTeclado(st, i, dada);
    root.querySelector('[data-a="ant"]').addEventListener('click', () => mover(-1));
    root.querySelector('[data-a="sig"]').addEventListener('click', () => mover(+1));
    cabecera();
    empezarReloj();
  }

  function montarTeclado(st, i, dada) {
    const zona = root.querySelector('.ts-tec'), aviso = root.querySelector('.ts-guardada');
    const mostrar = (v) => { aviso.innerHTML = v == null ? '' : 'Respuesta guardada: <b>' + fmtV(v) + '</b> · puedes cambiarla'; };
    tec = ui().teclado(zona, {
      max: 4,
      onOk(v) { st.respuestas[i] = v; guardar(); mostrar(v); }
    });
    const b = tec.raiz.querySelector('.btn-comprobar');
    if (b) b.textContent = 'Guardar respuesta';
    if (typeof dada === 'number') {
      if (dada < 0) tec._tecla('±');
      String(Math.abs(dada)).split('').forEach(k => tec._tecla(k));
      mostrar(dada);
    }
  }
  function guardarTecleado() {
    const st = S();
    if (tec && st.fase === 'preg') { const v = tec.valor(); if (v !== null) st.respuestas[st.idx] = v === 0 ? 0 : v; }
  }
  function mover(d) {
    const st = S();
    cortarReloj(); guardarTecleado();
    if (d < 0) { if (st.idx > 0) st.idx--; else st.fase = 'intro'; }
    else { if (st.idx < TOTAL - 1) st.idx++; else st.fase = 'revision'; }
    guardar(); pintar();
  }

  // ---------- Revisión antes de enviar ----------
  function pintarRevision() {
    const st = S();
    const faltan = [];
    st.respuestas.forEach((x, i) => { if (x == null) faltan.push(i + 1); });
    const practica = st.modo === 'PRACTICA';
    root.innerHTML =
      '<div class="pantalla ts ts-revision">' +
      '<div class="fila ts-cab"><span class="esp ts-cab-t">Revisión ' + insignia(st) + '</span>' +
      '<button class="btn-ico" data-a="mapa" aria-label="Pausar e ir al mapa">' + ui().icon('mapa') + '</button></div>' +
      '<h1 class="ts-h1">Revisa antes de ' + (practica ? 'terminar' : 'enviar') + '</h1>' +
      '<p class="tinta-2">Respondiste <b>' + (TOTAL - faltan.length) + ' de ' + TOTAL + '</b>. Toca un número para volver a esa pregunta.</p>' +
      '<div class="ts-grid">' +
      st.respuestas.map((x, i) => '<button class="ts-celda' + (x == null ? ' falta' : '') + '" data-i="' + i + '" aria-label="Pregunta ' + (i + 1) + (x == null ? ', sin responder' : ', respondida') + '">' + (i + 1) + '</button>').join('') +
      '</div>' +
      (faltan.length
        ? '<div class="caja-ojo ts-faltan"><b>Sin responder: ' + faltan.join(', ') + '.</b><br>Los errores no restan: vale la pena responderlas todas.</div>'
        : '<div class="caja-nota">Respondiste todas. ¡Bien!</div>') +
      '<div class="esp"></div>' +
      '<div class="col ts-rev-bot">' +
      '<button class="btn btn-pri btn-ancho" data-a="enviar">' + (practica ? 'Ver mi resultado' : 'Enviar mis respuestas') + ' ' + ui().icon('sig') + '</button>' +
      '<button class="btn btn-sec btn-ancho" data-a="volver">' + ui().icon('atras') + ' Volver a la pregunta 25</button>' +
      '</div></div>';
    root.querySelectorAll('.ts-celda').forEach(b => b.addEventListener('click', () => {
      st.idx = +b.getAttribute('data-i'); st.fase = 'preg'; guardar(); pintar();
    }));
    root.querySelector('[data-a="volver"]').addEventListener('click', () => { st.idx = TOTAL - 1; st.fase = 'preg'; guardar(); pintar(); });
    root.querySelector('[data-a="enviar"]').addEventListener('click', () => {
      if (!faltan.length) { terminar(); return; }
      ui().hoja({
        tipo: 'info', icono: 'foco', titulo: 'Te faltan ' + faltan.length + (faltan.length === 1 ? ' pregunta' : ' preguntas'),
        html: '<p>Sin responder: ' + faltan.join(', ') + '. Los errores no restan, así que conviene intentarlas.</p>',
        botones: [
          { t: 'Responderlas', cls: 'btn-pri', fn: () => { st.idx = faltan[0] - 1; st.fase = 'preg'; guardar(); pintar(); } },
          { t: practica ? 'Terminar así' : 'Enviar así', cls: 'btn-sec', fn: terminar }
        ]
      });
    });
    cabecera();
  }

  // ---------- Terminar ----------
  function terminar() {
    const st = S();
    cortarReloj();
    st.fin = Date.now();
    const snap = {
      modo: st.modo, semilla: st.semilla, version: st.version,
      respuestas: st.respuestas.slice(), tiempos: st.tiempos.slice(), inicio: st.inicio, fin: st.fin
    };
    const R = calcular(generar(snap.semilla), snap.respuestas, snap.tiempos);
    snap.nota = R.nota; snap.nota10 = R.nota10; snap.porTema = R.porTema;
    const payload = payloadDe(snap);
    let id = null;
    try { id = LS.envio ? LS.envio.resultado(payload) : null; } catch (e) { id = null; }
    snap.envioId = id;
    if (st.modo === 'PRACTICA') { st.practica = snap; st.practicas = (st.practicas || 0) + 1; st.ver = 'PRACTICA'; }
    else { st.oficial = snap; st.oficialTerminado = true; st.oficialEnviado = !!id; st.envioId = id; st.ver = 'OFICIAL'; }
    st.fase = 'resultados';
    guardar();
    pintar();
    if (R.nota >= 20) { try { ui().confeti(); ui().sonido('nivel'); } catch (e) { } }
  }

  // ---------- Resultados ----------
  function estadoTema(n) { return n >= 4 ? 'Parece que lo dominas' : n === 3 ? 'Casi' : 'Conviene repasar'; }
  function recomendacion(nota, porTema) {
    const ord = Object.keys(porTema).sort((x, y) => porTema[x] - porTema[y]);
    const nom = (k) => '«' + TEMAS[k].nombre + '»';
    if (nota >= 22) return '¡Excelente! Estás listo para este tema en el examen de admisión. Si quieres, prueba el Reto relámpago.';
    if (nota >= 18) {
      const casi = ord.filter(k => porTema[k] <= 3);
      return 'Muy bien. Refuerza ' + (casi.length ? 'el tema ' + casi.map(nom).join(' y ') : 'tu tema más bajo, ' + nom(ord[0])) + ' con un nivel del juego y haz el modo práctica.';
    }
    if (nota >= 13) return 'Vas por buen camino. Repasa los 2 temas más bajos, ' + nom(ord[0]) + ' y ' + nom(ord[1]) + ' (capítulo y nivel del juego), y vuelve mañana al modo práctica.';
    return 'Lo importante es que lo intentaste solo. Empieza por el tema más bajo, ' + nom(ord[0]) + ', capítulo por capítulo, y vuelve al test en 2 días.';
  }
  function ganchoHtml(dada1) {
    const g = ganchoNorm(), hoyOk = dada1 === -14;
    const hoy = dada1 == null ? 'la dejaste sin responder' : 'respondiste ' + N(dada1);
    const antes = g === 'nose' ? null : g != null && /^-?\d+$/.test(g) ? Number(g) : null;
    let t;
    if (g === '-14') t = hoyOk ? 'Le atinaste desde el principio y hoy sabes POR QUÉ.' : 'Al inicio respondiste ' + N(-14) + ' a ' + X(M().b('-', M().n(-5), 9)) + ', y hoy ' + hoy + '. Recuerda: son dos deudas, SE JUNTAN → ' + N(-14) + '.';
    else if (g === 'nose') t = hoyOk ? 'Al inicio no tenías idea de cuánto era ' + X(M().b('-', M().n(-5), 9)) + '. Hoy respondiste ' + N(-14) + '. Ya sabes por qué.' : 'Al inicio no sabías cuánto era ' + X(M().b('-', M().n(-5), 9)) + ', y hoy ' + hoy + '. Son dos deudas: SE JUNTAN → ' + N(-14) + '.';
    else if (antes !== null) t = hoyOk ? 'Al inicio respondiste ' + N(antes) + ' a ' + X(M().b('-', M().n(-5), 9)) + '. Hoy respondiste ' + N(-14) + '. Ya sabes por qué.' : 'Al inicio respondiste ' + N(antes) + ' a ' + X(M().b('-', M().n(-5), 9)) + ', y hoy ' + hoy + '. Todavía se cruza: son dos deudas, SE JUNTAN → ' + N(-14) + '.';
    else t = hoyOk ? 'Respondiste bien la pregunta del inicio: ' + X(M().b('-', M().n(-5), 9)) + ' = ' + N(-14) + '.' : 'La pregunta del inicio, ' + X(M().b('-', M().n(-5), 9)) + ', da ' + N(-14) + ': son dos deudas y SE JUNTAN.';
    return '<section class="tarjeta ts-gancho">' + '<p class="ts-sec-t">La pregunta del inicio</p><p>' + t + '</p>' +
      (hoyOk ? '' : '<button class="btn-txt" data-lam="12">Repasar la lámina 12</button>') + '</section>';
  }

  function pintarResultados() {
    const st = S();
    const verP = st.ver === 'PRACTICA' && st.practica;
    const snap = verP ? st.practica : st.oficial;
    if (!snap) { st.fase = null; nuevoIntento('OFICIAL'); pintar(); return; }
    const items = generar(snap.semilla);
    const R = calcular(items, snap.respuestas, snap.tiempos);
    const nota10 = R.nota10.toFixed(1).replace('.', ',');

    const barras = Object.keys(TEMAS).map(k => {
      const n = R.porTema[k], T = TEMAS[k], est = estadoTema(n);
      return '<div class="ts-tema">' +
        '<div class="fila"><b class="esp">' + T.nombre + '</b><span class="ts-tema-n">' + n + '/5</span></div>' +
        '<div class="ts-bar" role="img" aria-label="' + n + ' de 5"><i style="width:' + (n * 20) + '%"></i></div>' +
        '<div class="fila ts-tema-pie"><span class="ts-estado ' + (n >= 4 ? 'dom' : n === 3 ? 'casi' : 'rep') + '">' + (n >= 4 ? ui().icon('check') : '') + est + '</span></div>' +
        (n <= 2 ? '<div class="fila ts-tema-bot"><button class="btn btn-sec" data-lamina="' + T.lamina + '">Repasar lámina ' + T.lamina + '</button><button class="btn btn-sec" data-juego="' + T.nivel + '">Nivel ' + T.nivel + ' del juego</button></div>' : '') +
        '</div>';
    }).join('');

    const errores = R.erroresTop.length
      ? R.erroresTop.map(e => {
        const E = M().ERR[e.codigo.split('+')[0]] || {};
        const tm = E.tema && TEMAS[E.tema];
        return '<li class="ts-err">' + (tm ? ui().chip(tm.regla) : '') + '<p>' + e.txt + ' <span class="tinta-2">(' + e.veces + (e.veces === 1 ? ' vez' : ' veces') + ')</span></p>' +
          (E.lamina ? '<button class="btn-txt" data-ver="' + E.lamina + '">Ver la lámina ' + E.lamina + '</button>' : '') + '</li>';
      }).join('')
      : '<li class="ts-err"><p>No hay un error que se repita. ¡Muy bien!</p></li>';

    const revision = items.map((it, i) => {
      const f = R.filas[i], dada = snap.respuestas[i];
      const marca = f.ok ? '<span class="ts-marca ok">' + ui().icon('check') + '<span class="sr-only">bien</span></span>'
        : dada == null ? '<span class="ts-marca sr">sin responder</span>'
          : '<span class="ts-marca miss">' + ui().icon('x') + '<span class="sr-only">casi</span></span>';
      const enun = it.tipo === 'elige' ? '¿Cuál da positivo?' : M().html(it.nodo);
      let det = '';
      if (it.tipo === 'elige') {
        det += '<ul class="ts-q15">' + it.opciones.map(o => '<li><b>(' + o.letra + ')</b> ' + M().html(o.nodo) + ' = ' + N(o.v) + (o.letra === it.correcta ? ' ' + ui().icon('check', 'ts-ico-ok') : '') + '</li>').join('') + '</ul>';
        det += '<p>Tu respuesta: <b>' + (dada == null ? 'sin responder' : '(' + dada + ')') + '</b> · Correcta: <b>(' + it.correcta + ')</b></p>';
      } else {
        det += '<p>Tu respuesta: ' + (dada == null ? '<b>sin responder</b>' : N(dada)) + ' · Correcta: ' + N(it.correcta) + '</p>';
      }
      if (!f.ok && f.codigo && f.codigo !== 'SR') {
        const signo = f.codigo === 'E4' && it.tipo === 'num' ? 'El número está bien, revisa el signo. ' : '';
        const tx = f.codigo === 'E4' && it.tipo === 'num' ? '' : errTxt(f.codigo);
        det += '<p class="ts-casi">' + ui().icon('x') + '<span><b>Casi.</b> ' + signo + tx + '</span></p>';
      }
      det += '<div class="ts-exp">' + ui().chip(TEMAS[it.tema].regla) + '<p>' + it.exp + '</p></div>';
      return '<details class="ts-rev"><summary><span class="ts-rev-n">' + (i + 1) + '</span><span class="ts-rev-e">' + enun + '</span>' + marca + '</summary><div class="ts-rev-c">' + det + '</div></details>';
    }).join('');

    const oficial = !verP;
    root.innerHTML =
      '<div class="pantalla ts ts-res">' +
      '<div class="fila ts-cab"><span class="esp ts-cab-t">Tu resultado ' + (verP ? '<span class="ts-insignia">PRÁCTICA</span>' : '') + '</span>' +
      '<button class="btn-ico" data-a="ajustes" aria-label="Ajustes">' + ui().icon('ajustes') + '</button>' +
      '<button class="btn-ico" data-a="mapa" aria-label="Ir al mapa">' + ui().icon('mapa') + '</button></div>' +
      '<h1 class="ts-h1">¡Terminaste, ' + esc(LS.nombre()) + '!</h1>' +
      ganchoHtml(snap.respuestas[0]) +
      '<section class="tarjeta"><p class="ts-sec-t">Por tema</p>' + barras + '</section>' +
      '<section class="tarjeta ts-nota-caja"><p class="ts-sec-t">Tu nota</p><p class="ts-nota"><b>' + R.nota + '/25</b> · ' + nota10 + ' sobre 10</p></section>' +
      '<section class="tarjeta"><p class="ts-sec-t">Tus 2 errores más frecuentes</p><ul class="ts-errs">' + errores + '</ul></section>' +
      '<section class="tarjeta ts-reco"><p class="ts-sec-t">Qué te recomiendo</p><p>' + recomendacion(R.nota, R.porTema) + '</p></section>' +
      '<section class="ts-revs"><p class="ts-sec-t">Revisa las 25 preguntas</p><p class="peq tinta-2">Toca una pregunta para ver la explicación.</p>' + revision + '</section>' +
      (oficial ? '<section class="tarjeta ts-envio"><p class="ts-sec-t">Tu correo con el PDF</p><div class="ts-envio-z"></div></section>'
        : '<section class="caja-nota">Modo práctica. Tu resultado oficial sigue siendo <b>' + (st.oficial ? st.oficial.nota + '/25' : '—') + '</b>.</section>') +
      '<div class="col ts-fin">' +
      (R.nota >= 22 ? '<button class="btn btn-premio btn-ancho" data-a="reto">' + ui().icon('rayo') + ' Reto relámpago</button>' : '') +
      '<button class="btn btn-pri btn-ancho" data-a="practica">' + ui().icon('reintentar') + ' ' + (verP ? 'Otra práctica' : 'Hacer el modo práctica') + '</button>' +
      (verP && st.oficial ? '<button class="btn btn-sec btn-ancho" data-a="veroficial">Ver mi resultado oficial</button>' : '') +
      (!verP && st.practica ? '<button class="btn btn-sec btn-ancho" data-a="verpractica">Ver mi última práctica (' + st.practica.nota + '/25)</button>' : '') +
      '<button class="btn btn-sec btn-ancho" data-a="hub">' + ui().icon('mapa') + ' Volver al mapa</button>' +
      '</div></div>';

    // Acciones
    root.querySelectorAll('[data-lamina]').forEach(b => b.addEventListener('click', () => LS.app && LS.app.ir('laminas', { num: +b.getAttribute('data-lamina') })));
    root.querySelectorAll('[data-lam]').forEach(b => b.addEventListener('click', () => LS.app && LS.app.ir('laminas', { num: +b.getAttribute('data-lam') })));
    root.querySelectorAll('[data-juego]').forEach(b => b.addEventListener('click', () => LS.app && LS.app.ir('juego', { nivel: +b.getAttribute('data-juego') })));
    root.querySelectorAll('[data-ver]').forEach(b => b.addEventListener('click', () => {
      const n = +b.getAttribute('data-ver');
      if (LS.laminas && LS.laminas.verLamina) LS.laminas.verLamina(n);
    }));
    const on = (sel, fn) => { const x = root.querySelector(sel); if (x) x.addEventListener('click', fn); };
    on('[data-a="reto"]', () => LS.app && LS.app.ir('juego', { relampago: true }));
    on('[data-a="practica"]', () => { if (LS.app) LS.app.ir('test', { practica: true, forzar: true }); else abrir(root, { practica: true }); });
    on('[data-a="veroficial"]', () => { st.ver = 'OFICIAL'; guardar(); pintar(); });
    on('[data-a="verpractica"]', () => { st.ver = 'PRACTICA'; guardar(); pintar(); });
    on('[data-a="hub"]', () => LS.app && LS.app.ir('hub'));
    cabecera();
    if (oficial) pintarEnvio();
  }

  // ---------- Estado del envío ----------
  function pintarEnvio() {
    const st = S(), z = root && root.querySelector('.ts-envio-z');
    if (!z) return;
    const id = st.envioId;
    const est = LS.envio ? LS.envio.estado(id) : 'sin-configurar';
    const correo = esc(LS.st.usuario.correo || '');
    let pill;
    if (est === 'enviado') pill = '<span class="estado-envio ok">' + ui().icon('check') + ' Enviado a ' + correo + '</span>';
    else if (est === 'enviando') pill = '<span class="estado-envio">Enviando…</span>';
    else if (est === 'pendiente') pill = '<span class="estado-envio">Pendiente: se enviará cuando tengas internet</span>';
    else pill = '<span class="estado-envio">Tu resultado quedó guardado en este celular. El envío por correo todavía no está activo.</span>';
    z.innerHTML = '<p class="ts-pill" aria-live="polite">' + pill + '</p>' +
      '<p class="peq tinta-2">Correo: <b>' + correo + '</b></p>' +
      '<div class="fila ts-envio-bot"><button class="btn btn-sec" data-e="reenviar">' + ui().icon('reintentar') + ' Reenviar</button>' +
      '<button class="btn btn-sec" data-e="correo">Corregir correo</button></div>';
    z.querySelector('[data-e="reenviar"]').addEventListener('click', reenviar);
    z.querySelector('[data-e="correo"]').addEventListener('click', () => corregirCorreo((cambio) => {
      if (cambio && LS.envio && LS.envio.estado(S().envioId) === 'enviado') reenviar();
      else pintarEnvio();
    }));
    if (!desuscribir && LS.envio && LS.envio.alCambiar) desuscribir = LS.envio.alCambiar(() => {
      if (root && root.querySelector('.ts-envio-z')) pintarEnvio();
    });
  }
  function reenviar() {
    const st = S();
    if (!LS.envio || !st.oficial) return;
    const est = LS.envio.estado(st.envioId);
    if (est === 'enviado') {
      const p = payloadDe(st.oficial); p.reenvio = true;
      st.envioId = LS.envio.resultado(p); st.oficial.envioId = st.envioId; st.oficialEnviado = true;
      guardar();
    } else LS.envio.vaciar();
    pintarEnvio();
  }

  // ---------- Corregir correo (hoja con campo) ----------
  function corregirCorreo(alTerminar) {
    const actual = LS.st.usuario.correo || '';
    ui().hoja({
      tipo: 'info', titulo: 'Corregir correo',
      html: '<div class="campo"><label for="ts-correo-in">Tu correo</label>' +
        '<input id="ts-correo-in" type="email" autocomplete="email" inputmode="email" value="' + esc(actual) + '" placeholder="nombre@gmail.com">' +
        '<p class="error ts-correo-err" hidden>Revisa tu correo: debe verse como nombre@gmail.com</p></div>',
      botones: [
        {
          t: 'Guardar', cls: 'btn-pri', cerrar: false, fn: () => {
            const inp = document.getElementById('ts-correo-in'), er = document.querySelector('.ts-correo-err');
            const c = (inp.value || '').trim().toLowerCase();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c)) { er.hidden = false; inp.focus(); return; }
            const cambio = c !== actual;
            LS.st.usuario.correo = c; guardar();
            ui().cerrarHoja(true);
            if (alTerminar) alTerminar(cambio);
          }
        },
        { t: 'Cancelar', cls: 'btn-txt' }
      ]
    });
  }

  // ---------- Botón Atrás del celular ----------
  function atras() {
    const st = S();
    if (!root) return false;
    if (st.fase === 'preg') { mover(-1); return true; }
    if (st.fase === 'revision') { st.idx = TOTAL - 1; st.fase = 'preg'; guardar(); pintar(); return true; }
    return false;
  }

  LS.test = {
    abrir, atras,
    _generar: generar, _problemas: problemas, _calcular: calcular, _codigoDe: codigoDe, _payloadDe: payloadDe,
    _clave: clave, _LAMINAS: LAMINAS_EXPR, _TEMAS: TEMAS, _versionDe: versionDe
  };
})();
