/* Dibujos SVG en línea. Todo con tokens de color (style="fill:var(--…)") para que cambien con el tema. */
(function () {
  'use strict';
  const LS = window.LS = window.LS || {};
  const MENOS = '−';
  const F = (v) => (v < 0 ? MENOS : '') + Math.abs(v);
  const colTxt = (v) => v === 0 ? 'var(--ink)' : v < 0 ? 'var(--neg-text)' : 'var(--pos-text)';
  const colRel = (v) => v === 0 ? 'var(--ink)' : v < 0 ? 'var(--neg)' : 'var(--pos)';

  // ---------- Recta numérica ----------
  // recta({min,max, paso:1, puntos:[{v, etiqueta}], saltos:[{de,a,etiqueta}], tocables:false, espejo:false, titulo})
  function recta(o) {
    o = o || {};
    const min = o.min != null ? o.min : -6, max = o.max != null ? o.max : 6;
    const rango = max - min;
    const paso = o.paso || (rango > 30 ? 5 : 1);
    const W = 340, M = 18, y = o.saltos && o.saltos.length ? 96 : 50;
    const H = y + 46;
    const X = (v) => M + (v - min) * (W - 2 * M) / rango;
    const marcas = [];
    for (let v = Math.ceil(min / paso) * paso; v <= max; v += paso) marcas.push(v);
    (o.puntos || []).forEach(p => { if (marcas.indexOf(p.v) < 0) marcas.push(p.v); });
    (o.saltos || []).forEach(s => { [s.de, s.a].forEach(v => { if (marcas.indexOf(v) < 0) marcas.push(v); }); });
    if (marcas.indexOf(0) < 0 && min <= 0 && max >= 0) marcas.push(0);
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + (o.titulo || 'Recta numérica') + '"><title>' + (o.titulo || 'Recta numérica') + '</title>';
    s += '<line x1="' + (M - 10) + '" y1="' + y + '" x2="' + (W - M + 10) + '" y2="' + y + '" style="stroke:var(--ink)" stroke-width="2.5" stroke-linecap="round"/>';
    s += '<path d="M' + (W - M + 4) + ' ' + (y - 5) + 'l7 5-7 5" fill="none" style="stroke:var(--ink)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
    s += '<path d="M' + (M - 4) + ' ' + (y - 5) + 'l-7 5 7 5" fill="none" style="stroke:var(--ink)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
    if (o.espejo) s += '<line x1="' + X(0) + '" y1="' + (y - 40) + '" x2="' + X(0) + '" y2="' + (y + 10) + '" style="stroke:var(--ink-3)" stroke-width="2" stroke-dasharray="4 4"/>';
    marcas.sort((a, b) => a - b).forEach(v => {
      const x = X(v);
      const mostrarNum = rango <= 16 || v % paso === 0 || (o.puntos || []).some(p => p.v === v) || v === 0;
      s += '<g class="tick" data-v="' + v + '"' + (o.tocables ? ' role="button" tabindex="0" aria-label="' + F(v).replace(MENOS, 'menos ') + '" style="cursor:pointer"' : '') + '>';
      if (o.tocables) s += '<rect x="' + (x - 13) + '" y="' + (y - 24) + '" width="26" height="60" fill="transparent"/>';
      s += '<line x1="' + x + '" y1="' + (y - 7) + '" x2="' + x + '" y2="' + (y + 7) + '" style="stroke:' + (v === 0 ? 'var(--ink)' : colRel(v)) + '" stroke-width="2.5" stroke-linecap="round"/>';
      if (v === 0) s += '<circle cx="' + x + '" cy="' + (y + 24) + '" r="12" style="fill:var(--surface);stroke:var(--ink)" stroke-width="2"/>';
      if (mostrarNum) s += '<text x="' + x + '" y="' + (y + 29) + '" text-anchor="middle" font-size="' + (rango > 16 ? 11 : 14) + '" font-weight="800" style="fill:' + colTxt(v) + '">' + F(v) + '</text>';
      s += '</g>';
    });
    (o.puntos || []).forEach(p => {
      s += '<circle class="punto" cx="' + X(p.v) + '" cy="' + y + '" r="7" style="fill:' + colRel(p.v) + ';stroke:var(--surface)" stroke-width="2"/>';
      if (p.etiqueta) s += '<text x="' + X(p.v) + '" y="' + (y - 14) + '" text-anchor="middle" font-size="13" font-weight="800" style="fill:var(--ink)">' + p.etiqueta + '</text>';
    });
    (o.saltos || []).forEach((sl, i) => {
      const x1 = X(sl.de), x2 = X(sl.a), alto = Math.min(60, 18 + Math.abs(x2 - x1) * .35);
      const col = sl.a - sl.de < 0 ? 'var(--neg)' : 'var(--pos)';
      const d = 'M' + x1 + ' ' + (y - 8) + ' Q ' + ((x1 + x2) / 2) + ' ' + (y - 8 - alto * 2) + ' ' + x2 + ' ' + (y - 8);
      s += '<path class="trazo" pathLength="1" d="' + d + '" fill="none" style="stroke:' + col + ';animation-delay:' + (i * .5) + 's" stroke-width="3" stroke-linecap="round"/>';
      const ang = x2 > x1 ? 1 : -1;
      s += '<path class="aparece" d="M' + (x2 - 7 * ang) + ' ' + (y - 17) + 'L' + x2 + ' ' + (y - 8) + 'L' + (x2 - 9 * ang) + ' ' + (y - 5) + '" fill="none" style="stroke:' + col + ';animation-delay:' + (i * .5 + .6) + 's" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';
      if (sl.etiqueta) s += '<text class="aparece" x="' + ((x1 + x2) / 2) + '" y="' + (y - 14 - alto) + '" text-anchor="middle" font-size="13" font-weight="800" style="fill:var(--ink);animation-delay:' + (i * .5 + .3) + 's">' + sl.etiqueta + '</text>';
    });
    return s + '</svg>';
  }

  // ---------- Fichas de plata ----------
  // fichas({tengo, debo, cancelar:true, etiquetas:true, grupos:null})
  function ficha(x, y, tipo, cls, delay) {
    const st = delay != null ? ' style="animation-delay:' + delay + 's"' : '';
    if (tipo === 'pos') return '<g class="ficha ' + (cls || '') + '"' + st + '><circle cx="' + x + '" cy="' + y + '" r="13" style="fill:var(--pos);stroke:var(--pos)" stroke-width="2.5"/><path d="M' + (x - 6) + ' ' + y + 'h12M' + x + ' ' + (y - 6) + 'v12" style="stroke:#fff" stroke-width="3" stroke-linecap="round"/></g>';
    return '<g class="ficha ' + (cls || '') + '"' + st + '><circle cx="' + x + '" cy="' + y + '" r="13" style="fill:var(--neg-soft);stroke:var(--neg)" stroke-width="2.5" stroke-dasharray="4 3"/><path d="M' + (x - 6) + ' ' + y + 'h12" style="stroke:var(--neg-text)" stroke-width="3" stroke-linecap="round"/></g>';
  }
  function fichas(o) {
    o = o || {};
    const tengo = o.tengo || 0, debo = o.debo || 0;
    const n = Math.max(tengo, debo, 1);
    const paso = Math.min(32, 300 / n);
    const W = Math.max(120, 40 + paso * n), H = 112;
    const x0 = 34;
    const pares = o.cancelar ? Math.min(tengo, debo) : 0;
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + tengo + ' fichas de tener y ' + debo + ' fichas de deber"><title>Fichas de plata</title>';
    if (o.etiquetas !== false) {
      s += '<text x="4" y="32" font-size="12" font-weight="800" style="fill:var(--pos-text)">' + (tengo ? 'Tienes' : '') + '</text>';
      s += '<text x="4" y="88" font-size="12" font-weight="800" style="fill:var(--neg-text)">' + (debo ? 'Debes' : '') + '</text>';
    }
    const off = o.etiquetas !== false ? 22 : 0;
    for (let i = 0; i < tengo; i++) {
      const cancel = i < pares;
      s += ficha(x0 + off + i * paso, 46, 'pos', cancel ? 'cancelar' : 'queda', cancel ? i * .3 : null);
    }
    for (let i = 0; i < debo; i++) {
      const cancel = i < pares;
      s += ficha(x0 + off + i * paso, 80, 'neg', cancel ? 'cancelar' : 'queda', cancel ? i * .3 : null);
    }
    for (let i = 0; i < pares; i++) {
      const x = x0 + off + i * paso;
      s += '<line class="aparece" x1="' + x + '" y1="58" x2="' + x + '" y2="68" style="stroke:var(--ink);animation-delay:' + (i * .3) + 's" stroke-width="2.5" stroke-linecap="round"/>';
    }
    return s + '</svg>';
  }

  // ---------- Escalera ----------
  function escalera(activo) {
    const pasos = [['1', '( ) [ ]'], ['2', 'potencias'], ['3', '·   ÷'], ['4', '+   ' + MENOS]];
    const W = 320, H = 170, w = 76, h = 34;
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Escalera: primero paréntesis, luego potencias, luego multiplicar y dividir, al final sumar y restar"><title>Escalera de operaciones</title>';
    pasos.forEach((p, i) => {
      const x = 8 + i * w, y = H - 16 - (i + 1) * h;
      const on = activo === i + 1;
      s += '<rect x="' + x + '" y="' + y + '" width="' + (w - 4) + '" height="' + ((i + 1) * h) + '" rx="8" style="fill:' + (on ? 'var(--prize)' : 'var(--surface)') + ';stroke:var(--ink)" stroke-width="2.5"/>';
      s += '<text x="' + (x + (w - 4) / 2) + '" y="' + (y + 15) + '" text-anchor="middle" font-size="12" font-weight="900" style="fill:' + (on ? 'var(--on-prize)' : 'var(--ink-2)') + '">' + p[0] + '.º</text>';
      s += '<text x="' + (x + (w - 4) / 2) + '" y="' + (y + 29) + '" text-anchor="middle" font-size="' + (i === 1 ? 12 : 16) + '" font-weight="900" style="fill:' + (on ? 'var(--on-prize)' : 'var(--ink)') + '">' + p[1] + '</text>';
    });
    s += '<text x="' + (W / 2) + '" y="' + (H - 2) + '" text-anchor="middle" font-size="12" font-weight="800" style="fill:var(--ink-2)">mismo escalón: de izquierda a derecha</text>';
    return s + '</svg>';
  }

  // ---------- CUENTA LOS NEGATIVOS (HTML) ----------
  // negativos: cuántos factores negativos hay (se ilumina esa fila).
  // Por compatibilidad, tablaSignos(hl) recibe la celda vieja: 0 (+·+), 1 (−·−), 2 (+·−), 3 (−·+).
  function cuentaNegativos(negativos) {
    const filas = [[0, 'ningún negativo'], [1, '1 negativo'], [2, '2 negativos'], [3, '3 negativos']];
    return '<table class="tabla-signos tabla-cuenta" aria-label="Cuenta los negativos"><tbody>' + filas.map(f => {
      const par = f[0] % 2 === 0, hl = negativos === f[0];
      return '<tr class="' + (hl ? 'hl' : '') + '"><td>' + f[1] + '</td><td>' + (f[0] === 0 ? '—' : f[0] % 2 === 0 ? 'par' : 'impar') + '</td><td><span class="num ' + (par ? 'pos' : 'neg') + '">' + (par ? 'positivo' : 'negativo') + '</span></td></tr>';
    }).join('') + '</tbody></table>';
  }
  function tablaSignos(hl) { return cuentaNegativos(hl == null ? null : [0, 2, 1, 1][hl]); }

  // ---------- Sello de logro ----------
  function sello(texto) {
    return '<svg viewBox="0 0 120 120" role="img" aria-label="' + (texto || 'Logro') + '"><title>' + (texto || 'Logro') + '</title>' +
      '<path d="M60 8l13 12 17-3 5 17 16 7-6 16 6 16-16 7-5 17-17-3-13 12-13-12-17 3-5-17-16-7 6-16-6-16 16-7 5-17 17 3z" style="fill:var(--prize);stroke:var(--ink)" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M40 61l14 14 27-29" fill="none" style="stroke:var(--ink)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  function estrellas(n, total) {
    total = total || 3;
    let s = '<span class="estrellas" aria-label="' + n + ' de ' + total + ' estrellas">';
    for (let i = 0; i < total; i++) s += '<svg class="estrella' + (i < n ? ' llena' : '') + '" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-estrella"/></svg>';
    return s + '</span>';
  }

  LS.svg = { recta, fichas, ficha, escalera, tablaSignos, cuentaNegativos, sello, estrellas, F };
})();
