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

  // ---------- Banco de íconos SVG (química, estaciones del juego, personaje, feedback) ----------
  // Estilo cuaderno de laboratorio: viewBox 0 0 24 24, trazo 2, redondeado, currentColor.
  // Cada entrada guarda el interior del ícono; también se registran como <symbol id="i-<nombre>">
  // en el sprite compartido, para que LS.ui.icon(nombre) los use igual que los originales.
  const ICONOS = {
    // --- Metáforas de laboratorio ---
    probeta:
      '<path d="M9 7v12a3 3 0 006 0V7z" fill="currentColor" fill-opacity="0.22" stroke="none"/>' +
      '<path d="M9 3v16a3 3 0 006 0V3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M8 3h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M9 9.5h2.4M9 13h2M9 16.5h2.4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
    matraz:
      '<path d="M10 8l-3.7 9.3A2 2 0 008.2 20h7.6a2 2 0 001.9-2.7L14 8z" fill="currentColor" fill-opacity="0.18" stroke="none"/>' +
      '<path d="M9 3h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M10 3v5l-3.7 9.3A2 2 0 008.2 20h7.6a2 2 0 001.9-2.7L14 8V3" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>' +
      '<rect x="9" y="14.2" width="6" height="3.2" rx="0.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
    mechero:
      '<path d="M12 3.5c1.4 2 3 3.3 3 6a3 3 0 11-6 0c0-1.5.8-2.3 1.7-3.5.6-.8 1-1.5 1.3-2.5z" fill="currentColor" fill-opacity="0.32" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>' +
      '<rect x="10" y="13" width="4" height="7" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M7 20h10l-1.2 1.5H8.2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    pipeta:
      '<circle cx="12" cy="5" r="2" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<path d="M11 7v10l1 1.5 1-1.5V7" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M12 19.6c0 .5-.9 1-.9 1.7a.9 .9 0 001.8 0c0-.7-.9-1.2-.9-1.7z" fill="currentColor" stroke="none"/>',
    microscopio:
      '<circle cx="14" cy="5" r="1.8" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<path d="M14 6.8v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
      '<rect x="11.5" y="10.8" width="5" height="3" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M8 15.2h11M12 15.2v2.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M6 21h14M8 21l1.5-3h5L16 21" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    burbuja:
      '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<ellipse cx="9.2" cy="9.2" rx="2" ry="1.3" fill="currentColor" fill-opacity="0.55" stroke="none" transform="rotate(-35 9.2 9.2)"/>',
    gota:
      '<path d="M12 3c-3 5-5 8-5 11a5 5 0 0010 0c0-3-2-6-5-11z" fill="currentColor" fill-opacity="0.25" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M9.7 14.3a2 2 0 001.6 2.2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.65"/>',

    // --- Estaciones del juego (una por parada) ---
    'est-materia':
      '<path d="M10 4v5l-3 8a2 2 0 001.9 2.7h6.2A2 2 0 0017 17l-3-8V4z" fill="currentColor" fill-opacity="0.18" stroke="none"/>' +
      '<path d="M9 4h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M10 4v5l-3 8a2 2 0 001.9 2.7h6.2A2 2 0 0017 17l-3-8V4" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>' +
      '<circle cx="10" cy="17" r="0.9" fill="currentColor" stroke="none"/>' +
      '<circle cx="13.5" cy="18" r="0.7" fill="currentColor" stroke="none"/>' +
      '<circle cx="12.4" cy="15.2" r="0.6" fill="currentColor" stroke="none"/>',
    'est-cambios':
      '<path d="M12 7c1.2 2.3 3.8 3.5 3.8 6.5a3.8 3.8 0 11-7.6 0c0-1.5.8-2.2 1.8-3.5C10.6 8.9 11.4 8.3 12 7z" fill="currentColor" fill-opacity="0.3" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M4.5 6.5c1.4-1.6 3.4-1.6 4.8 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M9.3 6.5l-1.8-1.6M9.3 6.5l-1.8 1.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M19.5 17.5c-1.4 1.6-3.4 1.6-4.8 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M14.7 17.5l1.8-1.6M14.7 17.5l1.8 1.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    'est-atomo':
      '<circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none"/>' +
      '<ellipse cx="12" cy="12" rx="9" ry="3.5" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<ellipse cx="12" cy="12" rx="9" ry="3.5" fill="none" stroke="currentColor" stroke-width="2" transform="rotate(60 12 12)"/>' +
      '<ellipse cx="12" cy="12" rx="9" ry="3.5" fill="none" stroke="currentColor" stroke-width="2" transform="rotate(-60 12 12)"/>',
    'est-particulas':
      '<circle cx="8.5" cy="9.5" r="3.4" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="2"/>' +
      '<circle cx="15.5" cy="9.5" r="3.4" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="2"/>' +
      '<circle cx="12" cy="16" r="3.4" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="2"/>' +
      '<text x="8.5" y="11" text-anchor="middle" font-size="4.2" font-weight="800" font-family="system-ui, sans-serif" fill="currentColor" stroke="none">p</text>' +
      '<text x="15.5" y="11" text-anchor="middle" font-size="4.2" font-weight="800" font-family="system-ui, sans-serif" fill="currentColor" stroke="none">n</text>' +
      '<text x="12" y="17.5" text-anchor="middle" font-size="4.2" font-weight="800" font-family="system-ui, sans-serif" fill="currentColor" stroke="none">e</text>',
    'est-tabla':
      '<rect x="4" y="4" width="4" height="4" fill="currentColor" fill-opacity="0.3" stroke="none"/>' +
      '<rect x="3" y="3" width="18" height="18" rx="1.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M9 3v18M15 3v18M3 9h18M3 15h18" fill="none" stroke="currentColor" stroke-width="1.8"/>',
    'est-jefe':
      '<path d="M3 8l4 4 5-6 5 6 4-4v10H3z" fill="currentColor" fill-opacity="0.28" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M3 18h18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
      '<circle cx="3" cy="8" r="1.3" fill="currentColor" stroke="none"/>' +
      '<circle cx="21" cy="8" r="1.3" fill="currentColor" stroke="none"/>' +
      '<circle cx="12" cy="6" r="1.3" fill="currentColor" stroke="none"/>',

    // --- Personaje Ignacio (rostro estilizado, no retrato) ---
    'ignacio-cara':
      '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<circle cx="9" cy="10.6" r="2.2" fill="none" stroke="currentColor" stroke-width="1.8"/>' +
      '<circle cx="15" cy="10.6" r="2.2" fill="none" stroke="currentColor" stroke-width="1.8"/>' +
      '<path d="M11.2 10.6h1.6M6.9 10.6h-1M17.1 10.6h1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path d="M9 15.5c1 1.2 2 1.7 3 1.7s2-.5 3-1.7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
      '<circle cx="16.4" cy="14.6" r="0.75" fill="currentColor" stroke="none"/>',
    'ignacio-piensa':
      '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<circle cx="9" cy="10.6" r="2.2" fill="none" stroke="currentColor" stroke-width="1.8"/>' +
      '<circle cx="15" cy="10.6" r="2.2" fill="none" stroke="currentColor" stroke-width="1.8"/>' +
      '<path d="M11.2 10.6h1.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path d="M6.4 8.3l1.7-1M17.6 8.3l-1.7-1" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>' +
      '<path d="M9.6 16.4h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M14.6 17c1.5 0 2.4-1 2.4-2.1v-1.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    'ignacio-feliz':
      '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<path d="M7 11c.8-1.3 2.2-1.3 3 0M14 11c.8-1.3 2.2-1.3 3 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M8 14.2c1.5 2.6 3 3.6 4 3.6s2.5-1 4-3.6z" fill="currentColor" fill-opacity="0.35" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M9.5 14.6c1 .5 4 .5 5 0" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',

    // --- Feedback / celebración ---
    'sello-aprobado':
      '<circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<circle cx="12" cy="12" r="6.8" fill="none" stroke="currentColor" stroke-width="1.4"/>' +
      '<path d="M8 12.3l2.8 2.8L16 9.6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
    chispa:
      '<path d="M12 3l1.9 6.1L20 12l-6.1 1.9L12 20l-1.9-6.1L4 12l6.1-1.9z" fill="currentColor" fill-opacity="0.3" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M19.5 4.5v3M18 6h3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    'corona-mini':
      '<path d="M3 9l4 4 5-6 5 6 4-4v9H3z" fill="currentColor" fill-opacity="0.28" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M3 15h18" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
      '<circle cx="12" cy="7" r="1" fill="currentColor" stroke="none"/>'
  };

  function icon(nombre, cls) {
    const cuerpo = ICONOS[nombre];
    if (!cuerpo) return '';
    return '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + cuerpo + '</svg>';
  }
  function iconos() { return Object.keys(ICONOS); }

  // Inyecta los íconos como <symbol id="i-<nombre>"> en el sprite compartido del index,
  // para que LS.ui.icon(nombre) (basado en <use href="#i-...">) también los encuentre.
  function inyectarSprite() {
    try {
      const doc = document;
      let defs = doc.querySelector('svg > defs');
      if (!defs) {
        const wrap = doc.createElement('div');
        wrap.setAttribute('aria-hidden', 'true');
        wrap.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
        wrap.innerHTML = '<svg width="0" height="0"><defs></defs></svg>';
        doc.body.appendChild(wrap);
        defs = wrap.querySelector('defs');
      }
      Object.keys(ICONOS).forEach(nombre => {
        const id = 'i-' + nombre;
        if (doc.getElementById(id)) return;
        const sym = doc.createElementNS('http://www.w3.org/2000/svg', 'symbol');
        sym.setAttribute('id', id);
        sym.setAttribute('viewBox', '0 0 24 24');
        sym.innerHTML = ICONOS[nombre];
        defs.appendChild(sym);
      });
    } catch (e) { /* silencioso: si no hay DOM listo, icon() sigue devolviendo el SVG en línea */ }
  }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inyectarSprite, { once: true });
    else inyectarSprite();
  }

  LS.svg = { recta, fichas, ficha, escalera, tablaSignos, cuentaNegativos, sello, estrellas, F, icon, iconos, ICONOS };
})();
