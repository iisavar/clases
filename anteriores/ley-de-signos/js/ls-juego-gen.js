/* «Signo a Signo» — lógica pura del juego (sin DOM): generadores por subtipo, gemelos,
   gemelos trampa, planificador de subtipos, diagnóstico error → pista (catálogo único),
   solución en una línea, pistas en 3 escalones y datos del dibujo.
   Expone LS.juegoGen. Depende solo de LS.M (ls-motor.js). */
(function () {
  'use strict';
  const LS = window.LS = window.LS || {};
  const M = LS.M;
  const MENOS = '−';
  const abs = Math.abs;
  const sg = (v) => v > 0 ? 1 : v < 0 ? -1 : 0;
  const F = (v) => (v < 0 ? MENOS : '') + abs(v);
  const FP = (v) => v < 0 ? '(' + F(v) + ')' : F(v);
  const SUP = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
  const sup = (e) => String(e).split('').map(d => SUP[+d]).join('');
  const T = (x) => M.texto(x);
  const nrm = (v) => v === 0 ? 0 : v;
  const lista = (arr) => arr.length <= 1 ? arr.join('') : arr.slice(0, -1).join(', ') + ' y ' + arr[arr.length - 1];
  const PAL = { 2: 'Dos', 3: 'Tres', 4: 'Cuatro', 5: 'Cinco', 6: 'Seis', 7: 'Siete' };
  const E = (cod, msg, extra) => Object.assign({ cod, msg }, extra || {});
  const nb = (v, o) => M.n(v, o), bb = (op, a, c, o) => M.b(op, a, c, o);
  const pw = (x, e) => M.p(x, e), opu = (x) => M.o(x), gr = (x, br) => M.g(x, br);

  // ---------- Subtipos ----------
  const SUBS = {
    1: ['1a', '1b', '1c'],
    2: ['2a', '2b', '2c', '2d'],
    3: ['3a', '3b', '3c', '3d', '3e', '3f', '3g'],
    4: ['4a', '4b', '4c', '4d'],
    5: ['5a', '5b', '5c', '5d', '5e', '5f'],
    6: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6']
  };
  const PESOS = {
    1: { '1a': 70, '1b': 20, '1c': 10 },
    2: { '2a': 35, '2b': 25, '2c': 20, '2d': 20 },
    3: { '3a': 1, '3b': 1, '3c': 1, '3d': 1, '3e': 1, '3f': 1, '3g': 1 },
    4: { '4a': 40, '4b': 30, '4c': 20, '4d': 10 },
    5: { '5a': 20, '5b': 20, '5c': 15, '5d': 15, '5e': 15, '5f': 15 },
    6: { T1: 1, T2: 1, T3: 1, T4: 1, T5: 1, T6: 1 }
  };
  const PNUEVO = { 1: 1, 2: 0.7, 3: 0.6, 4: 0.5, 5: 0.6 };
  const nivelDe = (sub) => sub[0] === 'T' ? 6 : +sub[0];
  const MITAD = 5; // desde el 6.º ítem del nivel es «2.ª mitad»

  // ---------- Análisis de la forma de una expresión ----------
  function factores(x) {
    if (x.t === 'n') return [x.v];
    if (x.t === 'b' && x.op === '*') { const A = factores(x.a), B = factores(x.b); return A && B ? A.concat(B) : null; }
    return null;
  }
  function analizar(x, cods) {
    if (cods) return { forma: 'comb' };
    if (x.t === 'o' && x.a.t === 'n') return { forma: 'opuesto', v: x.a.v };
    if (x.t === 'o' && x.a.t === 'p' && x.a.a.t === 'n') return { forma: 'pot', v: x.a.a.v, e: x.a.e, tipo: x.a.a.v < 0 ? 'mpn' : 'mp' };
    if (x.t === 'p' && x.a.t === 'n') return { forma: 'pot', v: x.a.v, e: x.e, tipo: x.a.v < 0 ? 'pn' : 'pp' };
    if (x.t === 'b' && (x.op === '+' || x.op === '-') && x.a.t === 'n' && x.b.t === 'n' && (x.b.v < 0 || x.b.plus))
      return { forma: 'pegados', x: x.a.v, op: x.op, y: x.b.v, plus: !!x.b.plus };
    if (x.t === 'b' && x.op === '/' && x.a.t === 'n' && x.b.t === 'n') return { forma: 'div', D: x.a.v, d: x.b.v, slash: !!x.slash };
    if (x.t === 'b' && x.op === '*') { const f = factores(x); if (f) return { forma: 'prod', f, imp: !!x.imp, nodo: x }; }
    const t = M.terminos(x);
    if (t && t.length >= 2) return { forma: 'suma', t, aMenosB: t.length === 2 && x.op === '-' && x.a.v > 0 };
    return { forma: 'comb' };
  }
  function PD(t) { let P = 0, D = 0; t.forEach(v => { if (v > 0) P += v; else D -= v; }); return { P, D }; }

  // cadena de + y − de números: [v0, op1, v1, ...]
  function cadena(x) { return x.t === 'n' ? [x.v] : cadena(x.a).concat([x.op, x.b.v]); }
  function sumasPrimero(lst) { // «+» antes que «−» (error de agrupar)
    const grupos = [[lst[0]]];
    for (let i = 1; i < lst.length; i += 2) { if (lst[i] === '+') grupos[grupos.length - 1].push(lst[i + 1]); else grupos.push([lst[i + 1]]); }
    const s = grupos.map(g => g.reduce((a, c) => a + c, 0));
    return nrm(s.slice(1).reduce((a, c) => a - c, s[0]));
  }
  function e18(x, C) {
    const out = [];
    [M.alt.mismoEscalonDer(x), sumasPrimero(cadena(x))].forEach(v => { if (v !== null && v !== C && out.indexOf(v) < 0) out.push(v); });
    return out;
  }

  // ---------- Evaluaciones «con error» de las combinadas ----------
  function evMod(x, modo) {
    switch (x.t) {
      case 'n': return x.v;
      case 'g': return evMod(x.a, modo);
      case 'o': { const v = evMod(x.a, modo); return v === null ? null : nrm(-v); }
      case 'p': {
        const B = evMod(x.a, modo); if (B === null) return null;
        if (modo === 'E13b' && x.a.t === 'n' && B < 0 && x.e % 2 === 0) return -Math.pow(-B, x.e);
        return nrm(Math.pow(B, x.e));
      }
      case 'b': {
        if (modo === 'E20' && x.op === '*' && x.b.t === 'p') {
          const A = evMod(x.a, modo), B = evMod(x.b.a, modo);
          return (A === null || B === null) ? null : nrm(Math.pow(A * B, x.b.e));
        }
        const A = evMod(x.a, modo), C = evMod(x.b, modo);
        if (A === null || C === null) return null;
        if (modo === 'E6' && x.op === '-' && x.b.t !== 'n' && x.b.t !== 'p' && C < 0) return nrm(A + C);
        if (x.op === '+') return nrm(A + C);
        if (x.op === '-') return nrm(A - C);
        if (x.op === '*') return nrm(A * C);
        if (C === 0 || A % C !== 0) return null;
        return nrm(A / C);
      }
    }
    return null;
  }
  // E9: leer 2(−4) como 2 − 4 (la multiplicación pegada se vuelve suma de términos)
  function plano(x) { return x.t === 'b' ? plano(x.a).concat([x.imp ? '+' : x.op], plano(x.b)) : [M.evSeguro(x)]; }
  function jerarquia(lst) {
    const terms = [], tops = []; let acc = lst[0];
    for (let i = 1; i < lst.length; i += 2) {
      const op = lst[i], v = lst[i + 1];
      if (acc === null || v === null) return null;
      if (op === '*') acc = acc * v;
      else if (op === '/') { if (v === 0 || acc % v !== 0) return null; acc = acc / v; }
      else { terms.push(acc); tops.push(op); acc = v; }
    }
    if (acc === null) return null;
    terms.push(acc);
    let r = terms[0];
    for (let i = 0; i < tops.length; i++) r = tops[i] === '+' ? r + terms[i + 1] : r - terms[i + 1];
    return nrm(r);
  }
  const ORDEN_COMB = ['E16', 'E17', 'E19', 'E20', 'E13b', 'E9', 'E6'];
  // Valores alternativos aplicables (solo los que difieren de la respuesta correcta)
  function altsComb(x, cods) {
    const C = M.ev(x), out = [];
    ORDEN_COMB.forEach(cod => {
      if (!cods || cods.indexOf(cod) < 0) return;
      let v = null;
      if (cod === 'E16') v = M.alt.izqADer(x);
      else if (cod === 'E17') v = M.alt.mismoEscalonDer(x);
      else if (cod === 'E19') v = M.alt.sinParentesis(x);
      else if (cod === 'E9') v = jerarquia(plano(x));
      else v = evMod(x, cod);
      if (v !== null && Number.isFinite(v) && v !== C) out.push({ cod, v: nrm(v) });
    });
    return out;
  }

  // ---------- Valores de error del catálogo (para descartar ítems ambiguos) ----------
  function valoresError(x, cods) {
    const A = analizar(x, cods), C = M.ev(x), out = [];
    const add = (cod, v) => { if (v !== null && v !== undefined && Number.isFinite(v)) out.push({ cod, v: nrm(v) }); };
    switch (A.forma) {
      case 'suma': valSuma(A, x, C, add); break;
      case 'pegados': {
        const X = A.x, y = A.y;
        if (A.op === '-' && y < 0) add('E6', X - abs(y));
        if (A.op === '+' && y < 0) add('E7', X + abs(y));
        if (A.op === '-' && A.plus) add('E7b', X + y);
        const s = A.op === '-' ? -y : y;
        valSuma({ t: [X, s], aMenosB: X > 0 && s < 0 }, null, C, add);
        break;
      }
      case 'opuesto': if (A.v < 0) add('E6b', A.v); break;
      case 'prod': if (A.f.length === 2) { add('E9', A.f[0] + A.f[1]); add('E9', A.f[0] - A.f[1]); } break;
      case 'div':
        add('E9', A.D + A.d); add('E9', A.D - A.d);
        if (A.D !== 0) { add('E11', abs(A.D * A.d)); add('E11', -abs(A.D * A.d)); }
        break;
      case 'pot': { const a = abs(A.v); if (a * A.e !== abs(C)) { add('E14', a * A.e); add('E14', -a * A.e); } break; }
      case 'comb': altsComb(x, cods).forEach(z => add(z.cod, z.v)); break;
    }
    return out;
  }
  function valSuma(A, x, C, add) {
    const t = A.t;
    if (t.length === 2) {
      const t1 = t[0], t2 = t[1];
      if (t1 < 0 && t2 < 0) add('E1', abs(t1) + abs(t2));
      if (A.aMenosB && t1 > 0 && t1 < abs(t2)) add('E5', abs(t2) - t1);
      if (sg(t1) === sg(t2) && abs(t1) !== abs(t2)) { const d = abs(abs(t1) - abs(t2)); add('E2', d); add('E2', -d); }
      if (sg(t1) * sg(t2) < 0) { const s = abs(t1) + abs(t2); add('E3', s); add('E3', -s); }
    } else {
      const pd = PD(t);
      if (pd.P === 0) add('E1', pd.D);
      if (pd.P > 0 && pd.D > 0) { add('E3', pd.P + pd.D); add('E3', -(pd.P + pd.D)); }
      if (x) e18(x, C).forEach(v => add('E18', v));
    }
  }

  // ---------- Diagnóstico: error → pista (se usa la primera regla que se cumple) ----------
  function diagnosticar(x, r, cods) {
    const C = M.ev(x);
    r = nrm(r);
    if (r === C) return { cod: 'OK' };
    const A = analizar(x, cods);
    let d = null;
    if (A.forma === 'suma') d = dSuma(A, x, C, r);
    else if (A.forma === 'pegados') d = dPegados(A, C, r);
    else if (A.forma === 'opuesto') d = dOpuesto(A, C, r);
    else if (A.forma === 'prod' || A.forma === 'div') d = dMult(A, C, r);
    else if (A.forma === 'pot') d = dPot(A, C, r);
    else d = dComb(x, cods, C, r);
    return d || { cod: null, msg: 'Mira cómo se resuelve paso a paso:' };
  }
  function dSuma(A, x, C, r) {
    const t = A.t, pd = PD(t), P = pd.P, D = pd.D;
    const mayor = Math.max(P, D), menor = Math.min(P, D);
    if (t.length === 2) {
      const t1 = t[0], t2 = t[1], a1 = abs(t1), a2 = abs(t2);
      if (t1 < 0 && t2 < 0 && r === a1 + a2)
        return E('E1', 'Aquí no hay multiplicación: no hay · ni paréntesis pegados. Son dos deudas: debes ' + a1 + ' y debes ' + a2 + ' más. Se JUNTAN: debes ' + abs(C) + ' → ' + F(C) + '.');
      if (A.aMenosB && t1 > 0 && t1 < a2 && r === a2 - t1)
        return E('E5', 'Tienes ' + t1 + ' y pagas ' + a2 + ': no te alcanza. Te faltan ' + (a2 - t1) + ', o sea ' + F(C) + '. Restar no es dar la vuelta a los números.');
      if (sg(t1) === sg(t2) && a1 !== a2 && abs(r) === abs(a1 - a2))
        return E('E2', 'Los dos son ' + (t1 < 0 ? 'deudas' : 'plata que tienes') + ': se JUNTAN, no se cancelan. Suma ' + a1 + ' + ' + a2 + ' y deja el signo ' + (t1 < 0 ? MENOS : '+') + '.');
      if (sg(t1) * sg(t2) < 0 && abs(r) === a1 + a2)
        return E('E3', 'Tienes ' + P + ' y debes ' + D + ': no se juntan, se CANCELAN. Pagas lo que puedes: ' + mayor + ' − ' + menor + '.');
      if (C !== 0 && r === -C) return E('E4', msgE4(t1, t2, P, D, C));
      if (r !== 0 && sg(r) === sg(C))
        return E('E0', 'Vas bien con el signo. Revisa la cuenta con los tamaños: ' + (sg(t1) === sg(t2) ? a1 + ' + ' + a2 : Math.max(a1, a2) + ' − ' + Math.min(a1, a2)) + ' = ?');
      return null;
    }
    if (P === 0 && r === D)
      return E('E1', 'Aquí no hay multiplicación: no hay · ni paréntesis pegados. Son deudas: debes ' + lista(t.map(abs)) + '. Se JUNTAN: debes ' + D + ' → ' + F(C) + '.');
    if (P > 0 && D > 0 && abs(r) === P + D)
      return E('E3', 'Tienes ' + P + ' y debes ' + D + ': no se juntan, se CANCELAN. Pagas lo que puedes: ' + mayor + ' − ' + menor + '.');
    if (C !== 0 && r === -C) return E('E4', msgE4(P ? P : -D, D ? -D : P, P, D, C));
    if (x && e18(x, C).indexOf(r) >= 0)
      return E('E18', 'Cada número se lleva el signo de su izquierda: ' + t.map(F).join(', ') + '. Junta lo que tienes (' + P + '), junta lo que debes (' + D + ') y luego cancela.');
    if (r !== 0 && sg(r) === sg(C))
      return E('E0', 'Vas bien con el signo. Revisa la cuenta: tienes ' + P + ' y debes ' + D + ' → ' + (P && D ? mayor + ' − ' + menor : (P || D)) + ' = ?');
    return null;
  }
  function msgE4(t1, t2, P, D, C) {
    if (sg(t1) === sg(t2)) return t1 < 0 ? '¡El número está bien! Si todo era deuda, el resultado es deuda: ' + F(C) + '.'
      : '¡El número está bien! Si todo era plata que tienes, el resultado es positivo: ' + F(C) + '.';
    return '¡El ' + abs(C) + ' está bien! Falta el signo: ¿qué era más, lo que tienes (' + P + ') o lo que debes (' + D + ')? Ese pone el signo.';
  }
  function dPegados(A, C, r) {
    const X = A.x, y = A.y, b = abs(y);
    if (A.op === '-' && y < 0 && r === X - b)
      return E('E6', 'El menos de afuera te QUITA una deuda de ' + b + '. Si te quitan una deuda, ganas: ' + F(X) + ' − (−' + b + ') = ' + F(X) + ' + ' + b + '.');
    if (A.op === '+' && y < 0 && r === X + b)
      return E('E7', 'Te DAN una deuda de ' + b + ': pierdes. Signos pegados + y − dan −: ' + F(X) + ' + (−' + b + ') = ' + F(X) + ' − ' + b + '.');
    if (A.op === '-' && A.plus && r === X + b)
      return E('E7b', 'Te QUITAN ' + b + ' dólares: pierdes. Signos pegados − y + dan −: ' + F(X) + ' − (+' + b + ') = ' + F(X) + ' − ' + b + '.');
    const s = A.op === '-' ? -y : y;
    const d = dSuma({ t: [X, s], aMenosB: X > 0 && s < 0 }, null, C, r);
    if (d) { d.msg = 'Primero fundiste bien los signos: ' + simplTxt(A) + '. ' + d.msg; return d; }
    return null;
  }
  function simplTxt(A) { const s = A.op === '-' ? -A.y : A.y; return F(A.x) + (s < 0 ? ' − ' : ' + ') + abs(s); }
  function dOpuesto(A, C, r) {
    const a = abs(A.v);
    if (A.v < 0 && r === A.v) return E('E6b', 'El menos de afuera da la vuelta: el opuesto de −' + a + ' es +' + a + '.');
    return null;
  }
  function dMult(A, C, r) {
    const div = A.forma === 'div';
    const f = div ? [A.D, A.d] : A.f;
    const nNeg = f.filter(v => v < 0).length;
    const extra = div ? ' Dividir usa la MISMA regla que multiplicar.' : '';
    const sim = div ? (A.slash ? '/' : '÷') : '';
    if (f.some(v => v === 0) && r !== 0)
      return E('E12', 'Cualquier número por 0 da 0. Y 0 repartido entre cualquier número también da 0.');
    if (!div && f.length === 2 && (r === f[0] + f[1] || r === f[0] - f[1]))
      return E('E9', (A.imp ? 'Número pegado a un paréntesis, o dos paréntesis pegados, significa MULTIPLICAR: ' : 'El punto · significa MULTIPLICAR: ') + T(A.nodo) + ' = ' + FP(f[0]) + ' · ' + FP(f[1]) + '.');
    if (div && (r === A.D + A.d || r === A.D - A.d))
      return E('E9', 'El signo ' + sim + ' significa DIVIDIR, no sumar ni restar: ' + F(A.D) + ' entre ' + F(A.d) + '.');
    if (div && A.D !== 0 && abs(r) === abs(A.D * A.d))
      return E('E11', 'El ' + sim + ' pide DIVIDIR. Piensa al revés: ¿qué número por ' + abs(A.d) + ' da ' + abs(A.D) + '?');
    if (C !== 0 && r === -C && nNeg % 2 === 0)
      return E('E8', (nNeg === 0 ? 'No hay negativos: el resultado es positivo: ' + F(C) + '.'
        : 'Cuenta los negativos: hay ' + nNeg + '. ' + nNeg + ' es PAR → el resultado es positivo: ' + F(C) + '.') + extra);
    if (C !== 0 && r === -C)
      return E('E10', 'Cuenta los negativos: hay ' + nNeg + '. ' + nNeg + ' es IMPAR → el resultado es negativo: ' + F(C) + '.' + extra);
    if (r !== 0 && sg(r) === sg(C))
      return E('E0', 'El signo está perfecto. Revisa la tabla: ' + (div ? abs(A.D) + ' ÷ ' + abs(A.d) : f.map(abs).join(' · ')) + ' = ?');
    return null;
  }
  function expansion(A) {
    const a = abs(A.v), e = A.e;
    if (A.tipo === 'pn') return Array(e).fill('(' + F(A.v) + ')').join('');
    if (A.tipo === 'pp') return Array(e).fill(String(a)).join(' · ');
    if (A.tipo === 'mp') return '−(' + Array(e).fill(String(a)).join(' · ') + ')';
    return '−[' + Array(e).fill('(' + F(A.v) + ')').join('') + ']';
  }
  function dPot(A, C, r) {
    const a = abs(A.v), e = A.e, exp = expansion(A);
    if (abs(r) === a * e && a * e !== abs(C))
      return E('E14', 'El ' + e + ' chiquito no es ·' + e + '. Significa repetir el número ' + e + ' veces: ' + exp + '.');
    if (A.tipo === 'mp' && e % 2 === 0 && r === -C)
      return E('E13a', 'Sin paréntesis, el exponente solo toca al ' + a + '. El menos espera afuera: −' + a + sup(e) + ' = ' + exp + ' = ' + F(C) + '.');
    if (A.tipo === 'mpn' && e % 2 === 0 && r === -C)
      return E('E13a', 'Primero la potencia: (−' + a + ')' + sup(e) + ' = ' + Math.pow(a, e) + '. Después el menos de afuera da la vuelta: ' + F(C) + '.');
    if (A.tipo === 'pn' && e % 2 === 0 && r === -C)
      return E('E13b', 'Con paréntesis, el exponente toca al −' + a + ' completo: ' + exp + '. ' + (PAL[e] || e) + ' negativos → par → ' + F(C) + '.');
    if (A.v < 0 && e % 2 === 1 && r === -C)
      return E('E15', 'Se multiplican ' + e + ' negativos. ' + e + ' es IMPAR → queda negativo: ' + F(C) + '.');
    if (C !== 0 && r === -C) return E('E4', '¡El número está bien! Cuenta los negativos que se multiplican para decidir el signo.');
    if (r !== 0 && sg(r) === sg(C)) return E('E0', 'Vas bien con el signo. Revisa la cuenta: ' + exp + ' = ?');
    return null;
  }
  const ESC_NOM = { 1: 'lo de adentro del paréntesis', 2: 'las potencias', 3: '· y ÷', 4: '+ y −' };
  function dComb(x, cods, C, r) {
    const ps = M.pasos(x);
    const alts = altsComb(x, cods);
    for (let i = 0; i < alts.length; i++) if (alts[i].v === r) return E(alts[i].cod, msgComb(alts[i].cod, ps), { porPasos: true });
    if (C !== 0 && r === -C) return E('E4', '¡El número está bien! Revisa los signos en cada paso.', { porPasos: true });
    if (r !== 0 && sg(r) === sg(C)) return E('E0', 'Vas bien con el signo. Revisa las cuentas de cada paso.', { porPasos: true });
    return null;
  }
  function msgComb(cod, ps) {
    const p0 = ps[0], op = (p) => T(p.sub) + ' = ' + F(p.valor);
    if (cod === 'E16') return 'Primero va el escalón de ' + ESC_NOM[p0.escalon] + '; la suma y la resta esperan. Aquí primero: ' + op(p0) + '.';
    if (cod === 'E17') {
      const p = ps.find(q => q.escalon === 3) || p0;
      return '· y ÷ (o + y −) están en el MISMO escalón: se hacen de izquierda a derecha, como lees. Primero ' + op(p) + '.';
    }
    if (cod === 'E19') return 'Primero resuelve lo de adentro: ' + op(p0) + '. Después ' + T(p0.despues) + '.';
    if (cod === 'E20') return 'La potencia está en un escalón más alto que ·: primero ' + op(p0) + ', después ' + T(p0.despues) + '.';
    if (cod === 'E13b') {
      const p = ps.find(q => q.tipo === 'p') || p0;
      return 'Con paréntesis, el exponente toca al ' + F(p.sub.a.v) + ' completo: ' + op(p) + '.';
    }
    if (cod === 'E9') {
      const p = ps.find(q => q.sub.imp) || p0;
      return 'Número pegado a un paréntesis significa MULTIPLICAR: ' + T(p.sub) + ' = ' + FP(p.sub.a.v) + ' · ' + FP(p.sub.b.v) + ' = ' + F(p.valor) + '.';
    }
    if (cod === 'E6') {
      const p = ps.find(q => q.tipo === '-' && q.sub.b.t === 'n' && q.sub.b.v < 0) || p0;
      return 'Ojo con los signos pegados: ' + T(p.sub) + '. Restar una deuda es ganar: ' + op(p) + '.';
    }
    return 'Mira cómo se resuelve paso a paso:';
  }
  // ---------- Generadores por subtipo ----------
  // Cada uno devuelve {expr, nums (tamaños usados), pat (variante), cods?, trampa?} o null.
  const ri = (r, lo, hi) => M.ri(r, lo, hi);
  const lim = (o, hi) => o && o.facil ? Math.min(hi, 9) : hi;
  const signo = (r, pNeg) => r() < pNeg ? -1 : 1;
  const P3 = (fn) => (r, o) => { const a = ri(r, 1, lim(o, 15)), c = ri(r, 1, lim(o, 15)); if (a === c) return null; return { expr: fn(a, c), nums: [a, c] }; };
  const CICLO4 = ['--', '+-', '-+', '--', '-+', '+-', '--', '+-', '-+', '++'];
  function cadenaExpr(t) { let x = nb(t[0]); for (let i = 1; i < t.length; i++) x = bb(t[i] > 0 ? '+' : '-', x, nb(abs(t[i]))); return x; }

  const GEN = {
    '1a': (r, o) => { const a = ri(r, 1, lim(o, 15)), c = ri(r, 1, lim(o, 15)); return { expr: bb('-', nb(-a), nb(c)), nums: [a, c] }; },
    '1b': (r, o) => { const a = ri(r, 1, lim(o, 15)), c = ri(r, 1, lim(o, 15)); return { expr: bb('+', nb(a), nb(c)), nums: [a, c] }; },
    '1c': (r) => { const a = ri(r, 1, 9), c = ri(r, 1, 9), d = ri(r, 1, 9); return { expr: bb('-', bb('-', nb(-a), nb(c)), nb(d)), nums: [a, c, d] }; },
    '2a': (r, o) => {
      const hi = lim(o, 20); let a = ri(r, 1, hi), c = ri(r, 1, hi);
      if (o.cero) c = a; else if (a === c) return null;
      if (o.signo === '+' && c < a) { const t = a; a = c; c = t; }
      if (o.signo === '-' && c > a) { const t = a; a = c; c = t; }
      return { expr: bb('+', nb(-a), nb(c)), nums: [a, c] };
    },
    '2b': (r, o) => { const a = ri(r, 1, lim(o, 12)), hi = lim(o, 20); if (a >= hi) return null; const c = ri(r, a + 1, hi); return { expr: bb('-', nb(a), nb(c)), nums: [a, c] }; },
    '2c': (r, o) => { const a = ri(r, 2, lim(o, 20)), c = o.cero ? a : ri(r, 1, a - 1); return { expr: bb('-', nb(a), nb(c)), nums: [a, c] }; },
    '2d': (r, o) => {
      const k = r() < 0.5 ? 3 : 4, t = [];
      for (let i = 0; i < k; i++) { const v = ri(r, 1, 9); t.push(i === 0 ? v * signo(r, 0.25) : v * signo(r, 0.5)); }
      if (!t.some(v => v > 0) || !t.some(v => v < 0)) return null;
      const C = t.reduce((a, c) => a + c, 0);
      if (C === 0 || abs(C) > 20) return null;
      if (o.signo && (o.signo === '+') !== (C > 0)) return null;
      return { expr: cadenaExpr(t), nums: t.map(abs), pat: String(k) };
    },
    '3a': P3((a, c) => bb('-', nb(a), nb(-c))),
    '3b': P3((a, c) => bb('+', nb(a), nb(-c))),
    '3c': P3((a, c) => bb('-', nb(a), nb(c, { plus: true }))),
    '3d': P3((a, c) => bb('+', nb(a), nb(c, { plus: true }))),
    '3e': P3((a, c) => bb('-', nb(-a), nb(-c))),
    '3f': P3((a, c) => bb('+', nb(-a), nb(-c))),
    '3g': (r, o) => { const a = ri(r, 1, lim(o, 15)); return { expr: opu(nb(-a)), nums: [a] }; },
    '4a': (r, o) => {
      const pat = o.pat || (r() < 0.1 ? '++' : M.pick(r, ['+-', '-+', '--']));
      const a = ri(r, 1, lim(o, 10)), c = ri(r, 1, lim(o, 10));
      const f1 = pat[0] === '-' ? -a : a, f2 = pat[1] === '-' ? -c : c;
      const imp = r() < 0.5;
      return { expr: bb('*', nb(f1), nb(f2), imp ? { imp: true } : null), nums: [a, c], pat: pat + (imp ? 'i' : 'p') };
    },
    '4b': (r, o) => {
      const q = ri(r, 1, lim(o, 10)), d = ri(r, 2, lim(o, 10)), D = q * d, f = ri(r, 0, 3);
      const expr = f === 0 ? bb('/', nb(-D), nb(d)) : f === 1 ? bb('/', nb(D), nb(-d)) : f === 2 ? bb('/', nb(-D), nb(-d)) : bb('/', nb(-D), nb(d), { slash: true });
      return { expr, nums: [q, d, D], pat: String(f) };
    },
    '4c': (r) => {
      const f = [ri(r, 1, 5), ri(r, 1, 5), ri(r, 1, 5)];
      if (f.filter(v => v === 1).length > 1) return null;
      const s = f.map(v => v * signo(r, 0.6));
      const k = s.filter(v => v < 0).length;
      if (k === 0 && r() < 0.8) return null;
      return { expr: bb('*', bb('*', nb(s[0]), nb(s[1]), { imp: true }), nb(s[2]), { imp: true }), nums: f, pat: String(k) };
    },
    '4d': (r) => { const a = ri(r, 1, 10), f = r() < 0.5 ? 0 : 1; return { expr: bb(f ? '/' : '*', nb(0), nb(-a)), nums: [a], pat: String(f) }; },
    '5a': (r, o) => { const a = o.base || ri(r, 2, 6); return { expr: pw(nb(-a), 2), nums: [a] }; },
    '5b': (r, o) => { const a = o.base || ri(r, 2, 6); return { expr: opu(pw(nb(a), 2)), nums: [a] }; },
    '5c': (r) => { if (r() < 0.2) return { expr: pw(nb(-2), 5), nums: [], pat: '5' }; const a = ri(r, 2, 5); return { expr: pw(nb(-a), 3), nums: [a], pat: '3' }; },
    '5d': (r) => { const e = ri(r, 2, 7); return { expr: pw(nb(-1), e), nums: [e], pat: String(e % 2) }; },
    '5e': (r) => { const a = ri(r, 2, 5), e = r() < 0.5 ? 2 : 3; if (a === 2 && e === 2) return null; return { expr: pw(nb(a), e), nums: [a], pat: String(e) }; },
    '5f': (r) => { if (r() < 0.3) return { expr: pw(nb(-2), 4), nums: [], pat: 'p' }; const a = ri(r, 1, 4); return { expr: opu(pw(nb(-a), 2)), nums: [a], pat: 'm' }; },
    'T1': (r) => {
      const a = ri(r, 1, 12), B = ri(r, 2, 6), c = signo(r, 0.75) * ri(r, 2, 6), op = r() < 0.6 ? '-' : '+';
      return { expr: bb(op, nb(a), bb('*', nb(B), nb(c), { imp: true })), nums: [a, B, abs(c)], pat: op + (c < 0 ? 'n' : 'p'), cods: ['E16', 'E9', 'E6'], trampa: 'E16' };
    },
    'T2': (r) => {
      if (r() < 0.8) { // a ÷ b · c  (trampa: hacer b · c primero)
        const B = signo(r, 0.3) * ri(r, 2, 6), q = signo(r, 0.5) * ri(r, 2, 9), A = q * B, Cc = signo(r, 0.4) * ri(r, 2, 5);
        if (abs(A) > 50) return null;
        return { expr: bb('*', bb('/', nb(A), nb(B)), nb(Cc)), nums: [abs(A), abs(B), abs(Cc)], pat: 'dm', cods: ['E17'], trampa: 'E17' };
      }
      const A = signo(r, 0.5) * ri(r, 2, 9), B = signo(r, 0.3) * ri(r, 2, 9), pr = A * B;
      const divs = []; for (let k = 2; k <= 9; k++) if (pr % k === 0) divs.push(k);
      if (!divs.length) return null;
      const Cc = signo(r, 0.4) * M.pick(r, divs);
      return { expr: bb('/', bb('*', nb(A), nb(B)), nb(Cc)), nums: [abs(A), abs(B), abs(Cc)], pat: 'md', cods: ['E17'] };
    },
    'T3': (r) => {
      const a = ri(r, 1, 12), B = signo(r, 0.4) * ri(r, 1, 9), c = ri(r, 1, 9);
      if (B - c === 0) return null;
      const br = r() < 0.5 ? '[' : '(';
      return { expr: bb('-', nb(a), gr(bb('-', nb(B), nb(c)), br)), nums: [a, abs(B), c], pat: (br === '[' ? 'c' : 'p') + (B - c < 0 ? 'n' : 'p'), cods: ['E19', 'E6'], trampa: 'E19' };
    },
    'T4': (r) => {
      if (r() < 0.5) {
        const A = signo(r, 0.3) * ri(r, 2, 5), B = ri(r, 2, 6), imp = A > 0 && r() < 0.5;
        if (abs(A) * B * B > 50) return null;
        return { expr: bb('*', nb(A), pw(nb(-B), 2), imp ? { imp: true } : null), nums: [abs(A), B], pat: 'm', cods: ['E20', 'E13b'], trampa: 'E20' };
      }
      const A = ri(r, 1, 12), B = ri(r, 2, 6);
      return { expr: bb('-', nb(A), pw(nb(-B), 2)), nums: [A, B], pat: 'r', cods: ['E13b'], trampa: 'E13b' };
    },
    'T5': (r) => {
      const A = ri(r, 1, 10), B = ri(r, 2, 5), c = signo(r, 0.7) * ri(r, 2, 5), Ee = signo(r, 0.5) * ri(r, 2, 5), q = signo(r, 0.5) * ri(r, 1, 6), D = q * Ee;
      const op1 = r() < 0.7 ? '-' : '+', op2 = r() < 0.6 ? '+' : '-';
      return { expr: bb(op2, bb(op1, nb(A), bb('*', nb(B), nb(c), { imp: true })), bb('/', nb(D), nb(Ee))), nums: [A, B, abs(c), abs(D), abs(Ee)], pat: op1 + op2, cods: ['E16', 'E9', 'E6'], trampa: 'E16' };
    },
    'T6': (r) => {
      const k = r() < 0.5 ? 3 : 4, t = [];
      for (let i = 0; i < k; i++) { const v = ri(r, 1, 15); t.push(i === 0 ? v * signo(r, 0.3) : v * signo(r, 0.5)); }
      if (!t.some(v => v < 0)) return null;
      return { expr: cadenaExpr(t), nums: t.map(abs), pat: String(k), cods: ['E17'], trampa: 'E17' };
    }
  };

  function numerosDe(x, out) {
    out = out || [];
    if (x.t === 'n') out.push(x.v); else { if (x.a) numerosDe(x.a, out); if (x.b) numerosDe(x.b, out); }
    return out;
  }
  // Valida un candidato y arma el ítem
  function completar(sub, c, o) {
    const x = c.expr;
    let C;
    try { C = M.ev(x); } catch (e) { return null; }
    if (!Number.isInteger(C) || abs(C) > 999) return null;
    const nivel = nivelDe(sub), cods = c.cods || null;
    if (nivel === 6) {
      const ps = M.pasos(x);
      if (abs(C) > 50 || ps.some(p => abs(p.valor) > 50) || numerosDe(x).some(v => abs(v) > 50)) return null;
      if ((o.fase === 'A' || o.fase === 'B') && ps.length > 3) return null;
      if (ps.length > 4) return null;
      if (c.trampa && !altsComb(x, cods).some(z => z.cod === c.trampa)) return null;
    }
    const ve = valoresError(x, cods);
    if (ve.some(z => z.v === C)) return null;
    if (sub === '2d' && !ve.some(z => z.cod === 'E18')) return null;
    return {
      id: sub + ':' + T(x), sub, nivel, expr: x, C,
      patron: sub + ':' + (c.pat || '') + (nivel === 6 ? '' : ':' + (C > 0 ? '+' : C < 0 ? '-' : '0')),
      nums: c.nums || [], cods, regla: reglaBtn(x, cods)
    };
  }
  // crear(sub, {r, patron, evitarNums, recientes, fase, facil, signo, cero, base, pat})
  function crear(sub, o) {
    o = o || {};
    const r = o.r || M.rng(M.semillaNueva());
    const evitar = o.evitarNums || [];
    let respaldo = null;
    for (let i = 0; i < 700; i++) {
      const c = GEN[sub](r, o);
      if (!c) continue;
      const it = completar(sub, c, o);
      if (!it) continue;
      if (!respaldo) respaldo = it;
      if (o.patron && it.patron !== o.patron && i < 500) continue;
      if (evitar.length && it.nums.some(v => evitar.indexOf(abs(v)) >= 0) && i < 400) continue;
      if (o.recientes && o.recientes.indexOf(it.id) >= 0 && i < 600) continue;
      return it;
    }
    return respaldo;
  }
  // Gemelo: mismo subtipo y mismo patrón de signos, otros números
  function gemelo(item, o) {
    o = Object.assign({}, o || {}, { patron: item.patron, evitarNums: item.nums, cero: item.C === 0 });
    return crear(item.sub, o);
  }
  // Gemelo trampa (nivel 4): tras (−5)(−9) sale −5 − 9; tras (−6) ÷ (−2) sale −6 − 2
  function trampa(item, o) {
    const x = item.expr;
    let f1, f2;
    if (x.t === 'b' && (x.op === '*' || x.op === '/') && x.a.t === 'n' && x.b.t === 'n') { f1 = x.a.v; f2 = x.b.v; } else return null;
    if (f1 === 0 || f2 === 0) return null;
    const a2 = abs(f2);
    const sub = f1 < 0 ? '1a' : (f1 < a2 ? '2b' : '2c');
    const it = completar(sub, { expr: bb('-', nb(f1), nb(a2)), nums: [abs(f1), a2] }, o || {});
    if (!it || f1 === a2) return null;
    it.trampa = true;
    return it;
  }
  // ---------- Planificador: qué subtipo sale ahora ----------
  function pesado(r, pesos, evitar) {
    let keys = Object.keys(pesos).filter(k => pesos[k] > 0);
    if (evitar && keys.length > 1) keys = keys.filter(k => k !== evitar);
    const tot = keys.reduce((a, k) => a + pesos[k], 0);
    let x = r() * tot;
    for (let i = 0; i < keys.length; i++) { x -= pesos[keys[i]]; if (x < 0) return keys[i]; }
    return keys[keys.length - 1];
  }
  function pesosNivel(nivel, est) {
    const p = Object.assign({}, PESOS[nivel]);
    if ((est.items || 0) < MITAD) { delete p['1c']; delete p['2d']; }
    if (nivel === 6 && est.fase !== 'C') delete p.T5;
    return p;
  }
  // est: {items, subtiposOk, barra, ultimoSub, ultimo, fase, ciclo, cola:{sub,base,en}}
  // → {sub, opts, previo} | {trampa:true}
  function elegirSub(nivel, est, r) {
    est = est || {}; r = r || M.rng(M.semillaNueva());
    const ok = est.subtiposOk || [], opts = {};
    if (est.cola && est.cola.en <= (est.items || 0)) return { sub: est.cola.sub, opts: { base: est.cola.base }, contraste: true };
    if (nivel === 4 && est.ultimo && /^4[ab]$/.test(est.ultimo.sub) && r() < 0.35) return { trampa: true };
    const pN = nivel === 6 ? (est.fase === 'C' ? 0.8 : 1) : PNUEVO[nivel];
    if (r() >= pN) {
      const lv = ri(r, 1, nivel === 6 ? 5 : nivel - 1);
      return { sub: pesado(r, PESOS[lv], est.ultimoSub), opts, previo: true };
    }
    let pes = pesosNivel(nivel, est);
    const falt = Object.keys(pes).filter(s => ok.indexOf(s) < 0);
    if ((est.barra || 0) >= 3 && falt.length && r() < 0.6) { const q = {}; falt.forEach(s => { q[s] = pes[s]; }); pes = q; }
    const sub = pesado(r, pes, nivel >= 3 ? est.ultimoSub : null);
    const ciclo = est.ciclo || 0;
    if (sub === '2a' || sub === '2d') opts.signo = ciclo % 2 ? '-' : '+';
    if ((sub === '2a' || sub === '2c') && (est.items || 0) >= MITAD && r() < 0.1) opts.cero = true;
    if (sub === '4a') opts.pat = CICLO4[ciclo % CICLO4.length];
    return { sub, opts };
  }
  // Par de contraste (−a)² / −a² con la misma base
  function parContraste(item) {
    if (item.sub !== '5a' && item.sub !== '5b') return null;
    return { sub: item.sub === '5a' ? '5b' : '5a', base: item.nums[0] };
  }
  const subtiposRequeridos = (nivel) => SUBS[nivel].slice();

  // ---------- Solución en una línea, pistas y dibujo ----------
  const hueco = (arr) => arr.length > 1 ? arr.join(' + ') + ' = __' : String(arr[0]);
  function info(item) {
    const x = item.expr, A = analizar(x, item.cods), C = M.ev(x);
    let reglas = [], partes = [], filas = null, p1 = '', p2 = '';
    const dib = {};
    const recta = (t) => {
      let s = t[0]; const pts = [0, s], saltos = [];
      for (let i = 1; i < t.length; i++) { saltos.push({ de: s, a: s + t[i], etiqueta: t[i] < 0 ? 'debes ' + abs(t[i]) + ' más' : 'tienes ' + t[i] + ' más' }); s += t[i]; pts.push(s); }
      return { min: Math.min.apply(null, pts) - 2, max: Math.max.apply(null, pts) + 2, puntos: [{ v: t[0] }], saltos };
    };
    if (A.forma === 'suma') {
      const t = A.t, pd = PD(t), mags = t.map(abs);
      const pos = t.filter(v => v > 0), neg = t.filter(v => v < 0).map(abs);
      dib.recta = recta(t);
      if (pd.P && pd.D && Math.max(pd.P, pd.D) <= 20) dib.fichas = { tengo: pd.P, debo: pd.D, cancelar: true };
      if (t.length === 2 && sg(t[0]) === sg(t[1])) {
        const neg2 = t[0] < 0;
        reglas = ['SE JUNTAN'];
        partes = [T(x), (neg2 ? 'debes ' : 'tienes ') + mags[0] + ' y ' + (neg2 ? 'debes ' : 'tienes ') + mags[1], mags[0] + ' + ' + mags[1] + ' = ' + abs(C), F(C)];
        p1 = neg2 ? 'Los dos son deudas.' : 'Los dos son plata que tienes.';
        p2 = 'Suma los tamaños: ' + mags[0] + ' + ' + mags[1] + ' = __. Deja el signo ' + (neg2 ? MENOS : '+') + '.';
      } else if (t.length === 2) {
        const mx = Math.max(mags[0], mags[1]), mn = Math.min(mags[0], mags[1]);
        reglas = ['SE CANCELAN'];
        partes = [T(x), t.map(v => v < 0 ? 'debes ' + abs(v) : 'tienes ' + v).join(', '), mx + ' − ' + mn + ' = ' + abs(C), C < 0 ? 'quedas debiendo' : C > 0 ? 'te sobra' : 'no queda nada', F(C)];
        p1 = 'Uno es plata que tienes y el otro es deuda: pagas lo que puedes.';
        p2 = 'Resta grande menos chico: ' + mx + ' − ' + mn + ' = __. ¿Qué era más, lo que tienes (' + pd.P + ') o lo que debes (' + pd.D + ')?';
      } else if (!pd.P || !pd.D) {
        reglas = ['SE JUNTAN'];
        partes = [T(x), (pd.D ? 'debes ' : 'tienes ') + lista(mags), mags.join(' + ') + ' = ' + abs(C), F(C)];
        p1 = pd.D ? 'Todos son deudas.' : 'Todo es plata que tienes.';
        p2 = 'Suma los tamaños: ' + hueco(mags) + '.';
      } else {
        reglas = ['SE JUNTAN', 'SE CANCELAN'];
        partes = [T(x), 'tienes ' + (pos.length > 1 ? pos.join(' + ') + ' = ' : '') + pd.P + ' · debes ' + (neg.length > 1 ? neg.join(' + ') + ' = ' : '') + pd.D, pd.P + ' − ' + pd.D + ' = ' + F(C)];
        p1 = 'Cada número se lleva el signo de su izquierda. Junta lo que tienes, junta lo que debes y luego cancela.';
        p2 = 'Tienes ' + hueco(pos) + ' · debes ' + hueco(neg);
      }
    } else if (A.forma === 'pegados') {
      const s = A.op === '-' ? -A.y : A.y;
      reglas = ['SIGNOS PEGADOS'];
      partes = [T(x), (A.op === '-' ? MENOS : '+') + ' y ' + (A.y < 0 ? MENOS : '+') + ' pegados dan ' + (s > 0 ? '+' : MENOS), simplTxt(A) + ' = ' + F(C)];
      p1 = 'Hay dos signos pegados, sin número en medio: iguales dan +, distintos dan −.';
      p2 = 'Funde los signos: ' + T(x) + ' → ' + simplTxt(A) + ' = __';
      dib.fusion = { antes: T(x), despues: simplTxt(A) };
      dib.recta = recta([A.x, s]);
    } else if (A.forma === 'opuesto') {
      const a = abs(A.v);
      reglas = ['SIGNOS PEGADOS'];
      partes = [T(x), 'el opuesto de ' + F(A.v) + ' es ' + F(-A.v), F(C)];
      p1 = 'El menos de afuera da la vuelta: busca el opuesto.';
      p2 = 'El opuesto de ' + F(A.v) + ' es __.';
      dib.recta = { min: -a - 2, max: a + 2, espejo: true, puntos: [{ v: A.v }, { v: -A.v, etiqueta: 'opuesto' }] };
    } else if (A.forma === 'prod' || A.forma === 'div') {
      const div = A.forma === 'div', f = div ? [A.D, A.d] : A.f, nNeg = f.filter(v => v < 0).length, par = nNeg % 2 === 0;
      reglas = ['CUENTA LOS NEGATIVOS'];
      if (f.some(v => v === 0)) {
        const fr = div ? '0 repartido entre cualquier número da 0' : 'cualquier número por 0 da 0';
        partes = [T(x), 'hay un 0', fr, '0'];
        p1 = 'Fíjate en el 0.'; p2 = 'Recuerda: ' + fr + '.';
      } else {
        const cuenta = div ? abs(A.D) + ' ÷ ' + abs(A.d) : f.map(abs).join(' · ');
        const st = nNeg === 0 ? 'ningún negativo → +' : nNeg + (nNeg === 1 ? ' negativo' : ' negativos') + ', ' + (par ? 'par → +' : 'impar → −');
        partes = [T(x), st, cuenta + ' = ' + abs(C), F(C)];
        p1 = 'Cuenta los negativos: si son PAR da +, si son IMPAR da −. Luego ' + (div ? 'divide' : 'multiplica') + ' los tamaños.';
        p2 = 'Negativos: ' + nNeg + ' → ' + (par ? 'par → el resultado es +' : 'impar → el resultado es −') + '. Ahora ' + cuenta + ' = __';
        if (f.length === 2) dib.tabla = f[0] >= 0 && f[1] >= 0 ? 0 : f[0] < 0 && f[1] < 0 ? 1 : f[0] >= 0 ? 2 : 3;
        dib.contador = 'negativos: ' + (nNeg ? Array.from({ length: nNeg }, (_, i) => i + 1).join(', ') : '0') + ' → ' + (par ? 'par → +' : 'impar → −');
      }
    } else if (A.forma === 'pot') {
      const a = abs(A.v), e = A.e, ex = expansion(A);
      reglas = ['POTENCIA'];
      if (A.tipo === 'pn') partes = [T(x), 'el ' + sup(e) + ' toca al ' + F(A.v) + ' completo', ex, e + ' negativos, ' + (e % 2 ? 'impar → −' : 'par → +'), F(C)];
      else if (A.tipo === 'mp') partes = [T(x), 'el ' + sup(e) + ' solo toca al ' + a, ex + ' = ' + F(C)];
      else if (A.tipo === 'pp') partes = [T(x), ex + ' = ' + C];
      else partes = [T(x), 'primero (' + F(A.v) + ')' + sup(e) + ' = ' + Math.pow(a, e), 'el menos de afuera da la vuelta', F(C)];
      p1 = 'El exponente solo toca lo que está pegado a él.';
      p2 = 'Escríbelo repetido: ' + ex + ' = __';
      dib.expansion = { tipo: A.tipo, base: A.tipo === 'pn' || A.tipo === 'mpn' ? '(' + F(A.v) + ')' : String(a), e, afuera: A.tipo === 'mp' || A.tipo === 'mpn', fila: ex + ' = ' + F(C) };
    } else {
      const ps = M.pasos(x);
      reglas = ['ESCALERA'];
      filas = [{ txt: T(x) }].concat(ps.map(p => ({ txt: T(p.despues), esc: p.escalon, regla: p.regla, op: T(p.sub) + ' = ' + F(p.valor) })));
      partes = [T(x)].concat(ps.map(p => T(p.despues)));
      p1 = 'Sube la ESCALERA: paréntesis → potencias → · y ÷ → + y −. En el mismo escalón, de izquierda a derecha.';
      p2 = ps.length ? 'Primero: ' + T(ps[0].sub) + ' = __' : '';
      dib.escalera = ps.length ? ps[0].escalon : 4;
    }
    return { reglas, sol: { reglas, partes, filas }, pistas: [{ regla: reglas.join(' + '), txt: p1 }, p2], dibujo: dib, C };
  }

  // ---------- «¿Qué regla uso?» (puerta y paso previo) ----------
  const BTN_REGLA = ['PLATA', 'SIGNOS PEGADOS', 'CUENTA LOS NEGATIVOS'];
  function reglaBtn(x, cods) {
    if (cods) return 'ESCALERA';
    const f = analizar(x).forma;
    if (f === 'suma') return 'PLATA';
    if (f === 'pegados' || f === 'opuesto') return 'SIGNOS PEGADOS';
    if (f === 'prod' || f === 'div') return 'CUENTA LOS NEGATIVOS';
    return f === 'pot' ? 'POTENCIA' : 'ESCALERA';
  }
  function diagRegla(x, elegido) {
    const ok = reglaBtn(x), A = analizar(x);
    if (elegido === ok) return { cod: 'OK' };
    if (ok === 'CUENTA LOS NEGATIVOS') {
      const div = A.forma === 'div';
      const ind = div ? 'el signo ' + (A.slash ? '/' : '÷') : A.imp ? (A.f[0] < 0 ? 'dos paréntesis pegados' : 'un número pegado a un paréntesis') : 'el punto ·';
      const q = div ? 'división' : 'multiplicación';
      if (elegido === 'PLATA') return { cod: 'E30', msg: 'Aquí hay ' + q + ': ' + ind + '. La plata no sirve para ' + (div ? 'dividir' : 'multiplicar') + ': CUENTA LOS NEGATIVOS.' };
      return { cod: null, msg: 'Aquí hay ' + q + ': ' + ind + '. Signos pegados son dos signos sin número en medio. Aquí toca CUENTA LOS NEGATIVOS.' };
    }
    if (ok === 'PLATA') {
      const a = abs(A.t[0]);
      const base = A.t[0] < 0 ? 'Entre los dos signos hay un número (el ' + a + '): no están pegados.' : 'Aquí no hay · ni ÷ ni signos pegados: solo números separados.';
      return { cod: elegido === 'CUENTA LOS NEGATIVOS' ? 'E31' : null, msg: base + ' Es plata: se juntan o se cancelan.' };
    }
    if (ok === 'SIGNOS PEGADOS') {
      return { cod: null, msg: A.forma === 'opuesto' ? 'Mira: el menos de afuera y el − del número están pegados, sin número en medio: SIGNOS PEGADOS.'
        : 'Mira: el ' + (A.op === '-' ? MENOS : '+') + ' y el ' + (A.y < 0 ? MENOS : '+') + ' están pegados, solo los separa un paréntesis: SIGNOS PEGADOS.' };
    }
    return { cod: null, msg: '' };
  }
  const PUERTA = [
    { expr: bb('-', nb(-5), nb(9)) },
    { expr: bb('*', nb(-5), nb(-9), { imp: true }) },
    { expr: bb('-', nb(5), nb(-9)) },
    { expr: bb('/', nb(-6), nb(2)) },
    { expr: bb('+', nb(-8), nb(3)) }
  ];

  // ---------- Jefe (fase B): qué operaciones se pueden tocar ----------
  function candidatos(x) {
    const out = [];
    (function vis(y, path, gd) {
      if (y.t === 'n') return;
      if (y.t === 'g') { vis(y.a, path + 'a', gd + 1); return; }
      if (y.t === 'o' || y.t === 'p') { vis(y.a, path + 'a', gd); out.push({ path, tipo: y.t, gd, rank: 3, listo: y.a.t === 'n' }); return; }
      vis(y.a, path + 'a', gd); vis(y.b, path + 'b', gd);
      out.push({ path, tipo: y.op, imp: !!y.imp, gd, rank: (y.op === '*' || y.op === '/') ? 2 : 1, listo: y.a.t === 'n' && y.b.t === 'n' });
    })(x, 'r', 0);
    return out;
  }
  const OP_NOM = { '+': 'suma', '-': 'resta', '*': 'multiplicación', '/': 'división', p: 'potencia', o: 'operación del menos de afuera' };
  // → 'ok' | 'equiv' (mismo escalón e independiente: vale, pero se sigue el orden de lectura) | {cod:'E32', msg}
  function evaluarToque(antes, pathTocado, pathCorrecto) {
    if (pathTocado === pathCorrecto) return 'ok';
    const cs = candidatos(antes);
    const t = cs.find(c => c.path === pathTocado), k = cs.find(c => c.path === pathCorrecto);
    if (t && k && t.listo && t.gd === k.gd && t.rank === k.rank && t.rank >= 2) return 'equiv';
    const nom = t ? OP_NOM[t.tipo] : 'operación';
    if (t && k && t.gd === k.gd && t.rank === k.rank)
      return { cod: 'E32', msg: 'Están en el MISMO escalón de la ESCALERA: se va de izquierda a derecha, como lees. La ' + nom + ' espera.' };
    return { cod: 'E32', msg: 'Mira la ESCALERA: primero paréntesis, luego potencias, luego · y ÷. La ' + nom + ' espera.' };
  }

  LS.juegoGen = {
    SUBS, PESOS, MITAD, nivelDe, analizar, valoresError, altsComb, diagnosticar,
    diagItem: (item, r) => diagnosticar(item.expr, r, item.cods),
    crear, gemelo, trampa, elegirSub, parContraste, subtiposRequeridos, info,
    BTN_REGLA, reglaBtn, diagRegla, PUERTA, candidatos, evaluarToque, OP_NOM, F, sup
  };
})();
