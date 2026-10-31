/* Láminas 1 a 19 (+ 7.5 y el cierre 19.5): Inicio, Capítulo 1 y Capítulo 2.
   Solo datos: el motor que las pinta es ls-carrusel.js. Estilos propios en css/ls-laminas-a.css (prefijo lsa-).
   Formato fijo de las láminas de regla: LS.ui.regla, LS.ui.ejemplo (3 pasos), dibujo compacto, LS.ui.ojo. */
(function () {
  'use strict';
  const LS = window.LS = window.LS || {};

  // ---------- Ayudas ----------
  const fx = (s, o) => LS.ui.fx(s, o);
  const fxM = (s) => LS.ui.fx(s, { clase: 'fx-medio' });
  // expresión equivocada, tachada en gris (mal:true = no la comprueba el validador)
  const fxMal = (s) => '<span class="tachado">' + LS.ui.fx(s, { mal: true }) + '</span>';
  const num = (v, o) => LS.ui.num(v, o);
  const nP = (v) => LS.ui.num(v, { plus: true });
  const esc = (s) => LS.ui.esc(s);
  const chip = (s) => LS.ui.chip(s);
  // formato fijo (llamadas perezosas: así el validador puede envolverlas)
  const regla = (h, n) => LS.ui.regla(h, n);
  const ejemplo = (o) => LS.ui.ejemplo(o);
  const ojo = (h) => LS.ui.ojo(h);
  const metodo = (n) => LS.ui.metodo(n);
  const visto = () => '<svg class="lsa-visto" aria-label="hecho" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" style="stroke:var(--ok)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  // burbuja de LECTURA: el número con su signo (el positivo muestra su +)
  const burb = (v) => '<span class="lsa-burbuja">' + num(v, { plus: v > 0 }) + '</span>';
  const burbs = (...vs) => '<span class="lsa-burbujas">' + vs.map(burb).join('') + '</span>';
  const dib = (svg, cls) => '<div class="dibujo' + (cls ? ' ' + cls : '') + '">' + svg + '</div>';
  // fichas de plata a escala 1:1 (sin esto, con pocas fichas el dibujo se estira a todo el ancho)
  const dibFichas = (o) => {
    const n = Math.max(o.tengo || 0, o.debo || 0, 1), W = Math.max(120, 40 + Math.min(32, 300 / n) * n);
    return '<div class="dibujo lsa-dib-compacto"><div style="width:100%;max-width:' + Math.round(W * 1.1) + 'px">' + LS.svg.fichas(o) + '</div></div>';
  };
  const fichaIco = (tipo) => '<svg class="lsa-ficha-ico" viewBox="0 0 30 30" aria-hidden="true">' + LS.svg.ficha(15, 15, tipo) + '</svg>';
  const hecho = (c, id) => { try { const r = c.st.laminas.respuestas[id]; return !!(r && r.hecho); } catch (e) { return false; } };
  const MENOS = '−';
  const F = (v) => (v < 0 ? MENOS : '') + Math.abs(v);
  const colTxt = (v) => v === 0 ? 'var(--ink)' : v < 0 ? 'var(--neg-text)' : 'var(--pos-text)';
  const colRel = (v) => v === 0 ? 'var(--ink)' : v < 0 ? 'var(--neg)' : 'var(--pos)';

  // ---------- Textos exactos de las reglas (iguales en láminas, juego y test) ----------
  const R = {
    LECTURA: 'Cada número se lleva el signo que tiene a su izquierda. Si no tiene signo, es positivo.',
    JUNTAN: 'Si los dos signos son iguales, suma los tamaños y deja ese signo.',
    CANCELAN: 'Si los signos son distintos, resta los tamaños (grande menos chico) y deja el signo del que tiene más tamaño.'
  };
  // nombres de los 3 pasos del método (los mismos de LS.ui.PASOS)
  const P1 = 'Mira los signos', P2 = 'Elige la regla', P3 = 'Calcula';

  // ---------- Dibujos propios (SVG plano, trazo 2,5, tokens de color) ----------

  // Recta con marca en cada entero pero número solo en las etiquetas pedidas (para rangos largos).
  // o: {min,max, etiquetas:[], puntos:[v], salto:{de,a,etiqueta}, flecha:'texto', titulo}
  function rectaEtiq(o) {
    const min = o.min, max = o.max, rango = max - min;
    const W = 340, M = 18;
    const y = o.salto ? 100 : (o.flecha ? 74 : 50), H = y + 46;
    const X = (v) => M + (v - min) * (W - 2 * M) / rango;
    const titulo = o.titulo || 'Recta numérica';
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + titulo + '"><title>' + titulo + '</title>';
    s += '<line x1="' + (M - 10) + '" y1="' + y + '" x2="' + (W - M + 10) + '" y2="' + y + '" style="stroke:var(--ink)" stroke-width="2.5" stroke-linecap="round"/>';
    s += '<path d="M' + (W - M + 4) + ' ' + (y - 5) + 'l7 5-7 5" fill="none" style="stroke:var(--ink)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
    s += '<path d="M' + (M - 4) + ' ' + (y - 5) + 'l-7 5 7 5" fill="none" style="stroke:var(--ink)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
    for (let v = min; v <= max; v++) {
      const x = X(v), lab = (o.etiquetas || []).indexOf(v) >= 0 || v === 0;
      const h = lab ? 7 : 4;
      s += '<line x1="' + x + '" y1="' + (y - h) + '" x2="' + x + '" y2="' + (y + h) + '" style="stroke:' + colRel(v) + '" stroke-width="' + (lab ? 2.5 : 2) + '" stroke-linecap="round"/>';
      if (v === 0) s += '<circle cx="' + x + '" cy="' + (y + 24) + '" r="12" style="fill:var(--surface);stroke:var(--ink)" stroke-width="2"/>';
      if (lab) s += '<text x="' + x + '" y="' + (y + 29) + '" text-anchor="middle" font-size="14" font-weight="800" style="fill:' + colTxt(v) + '">' + F(v) + '</text>';
    }
    (o.puntos || []).forEach(v => {
      s += '<circle cx="' + X(v) + '" cy="' + y + '" r="7" style="fill:' + colRel(v) + ';stroke:var(--surface)" stroke-width="2"/>';
    });
    if (o.salto) {
      const x1 = X(o.salto.de), x2 = X(o.salto.a), alto = Math.min(60, 18 + Math.abs(x2 - x1) * .35);
      const col = o.salto.a - o.salto.de < 0 ? 'var(--neg)' : 'var(--pos)';
      s += '<path class="trazo" pathLength="1" d="M' + x1 + ' ' + (y - 8) + ' Q ' + ((x1 + x2) / 2) + ' ' + (y - 8 - alto * 2) + ' ' + x2 + ' ' + (y - 8) + '" fill="none" style="stroke:' + col + '" stroke-width="3" stroke-linecap="round"/>';
      const ang = x2 > x1 ? 1 : -1;
      s += '<path class="aparece" d="M' + (x2 - 7 * ang) + ' ' + (y - 17) + 'L' + x2 + ' ' + (y - 8) + 'L' + (x2 - 9 * ang) + ' ' + (y - 5) + '" fill="none" style="stroke:' + col + ';animation-delay:.6s" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';
      if (o.salto.etiqueta) s += '<text class="aparece" x="' + ((x1 + x2) / 2) + '" y="' + (y - 14 - alto) + '" text-anchor="middle" font-size="14" font-weight="800" style="fill:' + col.replace(')', '-text)') + ';animation-delay:.3s">' + o.salto.etiqueta + '</text>';
    }
    if (o.flecha) {
      s += '<path d="M' + (M + 30) + ' 22H' + (W - M - 20) + 'M' + (W - M - 29) + ' 14l9 8-9 8" fill="none" style="stroke:var(--ink)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
      s += '<text x="' + (W / 2) + '" y="44" text-anchor="middle" font-size="13" font-weight="800" style="fill:var(--ink)">' + o.flecha + '</text>';
    }
    return s + '</svg>';
  }

  // Montones de fichas de deber (o de tener), una fila por montón, con etiqueta a la izquierda.
  // filas: [{n, etiqueta}], tipo 'neg'|'pos'
  function montones(filas, tipo, titulo) {
    const paso = 26, x0 = 112, dy = 42, H = 20 + filas.length * dy;
    let s = '<svg viewBox="0 0 340 ' + H + '" role="img" aria-label="' + titulo + '"><title>' + titulo + '</title>';
    filas.forEach((f, r) => {
      const y = 28 + r * dy;
      s += '<text x="4" y="' + (y + 5) + '" font-size="13" font-weight="800" style="fill:' + (tipo === 'neg' ? 'var(--neg-text)' : 'var(--pos-text)') + '">' + f.etiqueta + '</text>';
      for (let i = 0; i < f.n; i++) s += LS.svg.ficha(x0 + i * paso, y, tipo);
    });
    return s + '</svg>';
  }

  // Mano que desliza hacia la izquierda (lámina 1)
  function manoDesliza() {
    return '<svg viewBox="0 0 170 92" role="img" aria-label="Una mano desliza hacia la izquierda para pasar de lámina"><title>Desliza para pasar</title>' +
      '<path d="M58 34H18M30 22L18 34l12 12" fill="none" style="stroke:var(--ink-2)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<g class="lsa-mano">' +
      '<rect x="76" y="44" width="50" height="42" rx="16" style="fill:var(--surface);stroke:var(--ink)" stroke-width="2.5"/>' +
      '<rect x="80" y="10" width="17" height="50" rx="8.5" style="fill:var(--surface);stroke:var(--ink)" stroke-width="2.5"/>' +
      '<path d="M104 50v-8a6 6 0 0112 0v8M116 52v-6a6 6 0 0112 0v14" fill="none" style="stroke:var(--ink)" stroke-width="2.5" stroke-linecap="round"/>' +
      '</g></svg>';
  }

  // Lámina en miniatura con flechas a Atrás, Siguiente y «Explícame más despacio» (lámina 2)
  function miniLamina() {
    return '<svg viewBox="0 0 340 250" role="img" aria-label="Así es una lámina: abajo el botón Atrás y el botón Siguiente; en el medio el botón Explícame más despacio"><title>Cómo es una lámina</title>' +
      '<rect x="96" y="8" width="148" height="232" rx="16" style="fill:var(--surface);stroke:var(--ink)" stroke-width="2.5"/>' +
      '<rect x="110" y="24" width="90" height="10" rx="5" style="fill:var(--line)"/>' +
      '<rect x="110" y="44" width="120" height="7" rx="3.5" style="fill:var(--line)"/>' +
      '<rect x="110" y="58" width="104" height="7" rx="3.5" style="fill:var(--line)"/>' +
      '<rect x="110" y="76" width="120" height="58" rx="8" fill="none" style="stroke:var(--ink-3)" stroke-width="2" stroke-dasharray="5 4"/>' +
      '<g class="lsa-parpadea"><rect x="102" y="146" width="136" height="24" rx="6" style="fill:var(--zero-soft);stroke:var(--ink)" stroke-width="2"/>' +
      '<text x="170" y="162" text-anchor="middle" font-size="9.5" font-weight="800" style="fill:var(--ink)">Explícame más despacio ▾</text></g>' +
      '<line x1="96" y1="188" x2="244" y2="188" style="stroke:var(--line)" stroke-width="2"/>' +
      '<rect x="106" y="198" width="30" height="30" rx="8" style="fill:var(--surface);stroke:var(--ink)" stroke-width="2"/>' +
      '<path d="M124 205l-7 8 7 8" fill="none" style="stroke:var(--ink)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<rect x="144" y="198" width="90" height="30" rx="8" style="fill:var(--primary)"/>' +
      '<text x="189" y="218" text-anchor="middle" font-size="12" font-weight="800" style="fill:var(--on-primary)">Siguiente ›</text>' +
      // flechas y rótulos
      '<text x="6" y="150" font-size="13" font-weight="800" style="fill:var(--ink)">¿No</text>' +
      '<text x="6" y="166" font-size="13" font-weight="800" style="fill:var(--ink)">entendiste?</text>' +
      '<path d="M84 158h16M93 151l7 7-7 7" fill="none" style="stroke:var(--ink)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<text x="6" y="232" font-size="13" font-weight="800" style="fill:var(--ink)">Atrás</text>' +
      '<path d="M46 228c20 0 40-4 56-13M94 211l8 4-4 8" fill="none" style="stroke:var(--ink)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<text x="334" y="200" text-anchor="end" font-size="13" font-weight="800" style="fill:var(--ink)">Siguiente</text>' +
      '<text x="334" y="216" text-anchor="end" font-size="11" font-weight="700" style="fill:var(--ink-2)">(o desliza)</text>' +
      '<path d="M270 206h-22M255 199l-7 7 7 7" fill="none" style="stroke:var(--ink)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>';
  }

  // Termómetro del congelador (lámina 4): 0 en tinta, positivos azules, negativos naranjas, sin degradado
  function termometro() {
    const Y = (t) => 85 - t * 2; // 0 °C en y=85
    let s = '<svg viewBox="0 0 120 200" role="img" aria-label="Termómetro del congelador marcando menos 18 grados"><title>Termómetro</title>';
    s += '<rect x="48" y="12" width="22" height="150" rx="11" style="fill:var(--surface);stroke:var(--ink)" stroke-width="2.5"/>';
    s += '<rect x="53" y="' + Y(-18) + '" width="12" height="' + (165 - Y(-18)) + '" style="fill:var(--neg)"/>';
    s += '<circle cx="59" cy="172" r="18" style="fill:var(--neg);stroke:var(--ink)" stroke-width="2.5"/>';
    [20, 10, 0, -10, -20].forEach(t => {
      s += '<line x1="70" y1="' + Y(t) + '" x2="' + (t === 0 ? 82 : 78) + '" y2="' + Y(t) + '" style="stroke:' + colRel(t) + '" stroke-width="2.5" stroke-linecap="round"/>';
      s += '<text x="85" y="' + (Y(t) + 5) + '" font-size="13" font-weight="800" style="fill:' + colTxt(t) + '">' + F(t) + '</text>';
    });
    s += '<path d="M30 ' + Y(-18) + 'h14M38 ' + (Y(-18) - 6) + 'l6 6-6 6" fill="none" style="stroke:var(--ink)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
    s += '<text x="26" y="' + (Y(-18) + 5) + '" text-anchor="end" font-size="13" font-weight="900" style="fill:var(--neg-text)">' + F(-18) + '</text>';
    return s + '</svg>';
  }

  // Panel del ascensor del mall (lámina 4): PB = 0 en tinta; −1 y −2 como fichas negativas (borde discontinuo)
  function ascensor() {
    const bots = [[2, '2'], [1, '1'], [0, 'PB'], [-1, F(-1)], [-2, F(-2)]];
    let s = '<svg viewBox="0 0 120 200" role="img" aria-label="Botones del ascensor: 2, 1, planta baja igual a 0, menos 1 y menos 2"><title>Ascensor</title>';
    s += '<rect x="14" y="4" width="92" height="192" rx="14" style="fill:var(--surface);stroke:var(--ink)" stroke-width="2.5"/>';
    bots.forEach((b, i) => {
      const cy = 30 + i * 36, v = b[0];
      const estilo = v > 0 ? 'fill:var(--pos-soft);stroke:var(--pos)' : v < 0 ? 'fill:var(--neg-soft);stroke:var(--neg)' : 'fill:var(--zero-soft);stroke:var(--ink)';
      s += '<circle cx="46" cy="' + cy + '" r="14" style="' + estilo + '" stroke-width="2.5"' + (v < 0 ? ' stroke-dasharray="4 3"' : '') + '/>';
      s += '<text x="46" y="' + (cy + 5) + '" text-anchor="middle" font-size="' + (v === 0 ? 12 : 14) + '" font-weight="900" style="fill:' + colTxt(v) + '">' + b[1] + '</text>';
      if (v === 0) s += '<text x="66" y="' + (cy + 5) + '" font-size="13" font-weight="800" style="fill:var(--ink)">= 0</text>';
    });
    return s + '</svg>';
  }

  // Cuaderno de fiado de la tienda (lámina 4)
  function cuadernoFiado(nombre) {
    let n = String(nombre || '');
    if (n.length > 9) n = n.slice(0, 8) + '.';
    let s = '<svg viewBox="0 0 120 200" role="img" aria-label="Cuaderno de fiado de la tienda: ' + esc(n) + ' debe 2 dólares"><title>Cuaderno de fiado</title>';
    s += '<rect x="10" y="18" width="100" height="172" rx="8" style="fill:var(--surface);stroke:var(--ink)" stroke-width="2.5"/>';
    [26, 46, 66, 86].forEach(x => { s += '<circle cx="' + x + '" cy="18" r="5" style="fill:var(--bg);stroke:var(--ink)" stroke-width="2.5"/>'; });
    s += '<text x="60" y="52" text-anchor="middle" font-size="15" font-weight="900" style="fill:var(--ink)">Fiado</text>';
    [64, 104, 144].forEach(y => { s += '<line x1="20" y1="' + y + '" x2="100" y2="' + y + '" style="stroke:var(--line)" stroke-width="2"/>'; });
    s += '<text x="60" y="94" text-anchor="middle" font-size="13" font-weight="800" style="fill:var(--ink)">' + esc(n) + ':</text>';
    s += '<text x="60" y="130" text-anchor="middle" font-size="22" font-weight="900" style="fill:var(--ink)">$2</text>';
    return s + '</svg>';
  }

  // Cuaderno de Mateo (lámina 18): la cuenta encerrada en un círculo gris y un «?»
  function cuadernoMateo() {
    return '<div class="lsa-cuaderno" role="img" aria-label="Cuaderno de Mateo: escribió menos 5 menos 9 igual a 14">' +
      '<div class="lsa-cuaderno-anillos" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>' +
      '<p class="lsa-cuaderno-nombre">Cuaderno de Mateo</p>' +
      '<div class="lsa-cuaderno-linea"><span class="lsa-circulo">' + LS.ui.fx('−5 − 9 = 14', { clase: 'fx-medio', mal: true }) + '</span><span class="lsa-pregunta" aria-hidden="true">?</span></div>' +
      '</div>';
  }

  // Mini tarjeta de la vida real (lámina 4): dibujo pequeño arriba y 2 líneas de texto
  const mini = (svg, txt) => '<div class="lsa-mini"><div class="lsa-mini-dib">' + svg + '</div><p>' + txt + '</p></div>';

  // Paso ya resuelto (lámina 16): número, nombre del paso y lo hecho
  const hechoLi = (n, nombre, html) => '<li><span class="lsa-pn">' + n + '</span><span><b>' + nombre + ':</b> ' + html + '</span>' + visto() + '</li>';

  // ---------- Láminas 12 y 13: lo que se revela después de la predicción ----------
  function cajaGancho(c) {
    const g = c.gancho;
    let t = null;
    if (g === '-14') t = 'Al inicio pusiste ' + num(-14) + '. ¡Le atinaste! Ahora ya sabes por qué.';
    else if (g === '14') t = 'Al inicio pusiste ' + num(14) + '. Es el error más común. Pero nadie te regaló plata: debes 5 y 9 más, o sea ' + num(-14) + '.';
    else if (g === '-4' || g === '4') t = 'Al inicio pusiste ' + num(+g) + ': restaste ' + fx('9 − 5') + '. Pero son dos deudas: no se restan, se juntan.';
    else if (g === 'nose') t = 'Al inicio no lo sabías. Ahora sí: ' + num(-14) + '.';
    return t ? '<div class="caja-nota lsa-gancho">' + t + '</div>' : '';
  }

  function reglaL12(c) {
    return regla(R.JUNTAN, 'SE JUNTAN') +
      ejemplo({
        expr: '−5 − 9',
        pasos: [
          { t: P1, html: burbs(-5, -9) + ' Dos deudas.' },
          { t: P2, html: 'Los dos signos son iguales.', regla: 'SE JUNTAN' },
          { t: P3, html: 'Suma los tamaños: ' + fx('5 + 9 = 14') + '. Deja el signo −.' }
        ],
        resultado: '−5 − 9 = −14'
      }) +
      dib(montones([{ n: 7, etiqueta: 'Ahora' }, { n: 7, etiqueta: 'debes 14' }], 'neg', 'Las 14 fichas de deber juntas en un solo montón'), 'lsa-dib-compacto') +
      cajaGancho(c);
  }

  function reglaL13() {
    return regla(R.CANCELAN, 'SE CANCELAN') +
      ejemplo({
        expr: '−9 + 5',
        pasos: [
          { t: P1, html: burbs(-9, 5) + ' Debes 9 y tienes 5.' },
          { t: P2, html: 'Los signos son distintos.', regla: 'SE CANCELAN' },
          { t: P3, html: 'Resta los tamaños: ' + fx('9 − 5 = 4') + '. Tiene más tamaño la deuda de 9: queda negativo.' + dibFichas({ tengo: 5, debo: 9, cancelar: true }) }
        ],
        resultado: '−9 + 5 = −4'
      });
  }

  // ---------- Lámina 5: tocar el −3 en la recta ----------
  function tocarRecta(el, api) {
    el.classList.add('bloque-preg');
    el.innerHTML = '<div class="enunciado">Toca dónde va el ' + num(-3) + '.</div>' +
      '<div class="dibujo lsa-recta-toca" data-noswipe>' + LS.svg.recta({ min: -6, max: 6, tocables: true, titulo: 'Recta numérica de menos 6 a 6. Toca un número.' }) + '</div>' +
      '<div class="zona-fb" aria-live="polite"></div>';
    const zfb = el.querySelector('.zona-fb');
    let intentos = 0, listo = false;
    function punto(g, v) {
      const ln = g.querySelector('line');
      if (!ln) return;
      const ci = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ci.setAttribute('cx', ln.getAttribute('x1'));
      ci.setAttribute('cy', String(+ln.getAttribute('y1') + 7));
      ci.setAttribute('r', '8');
      ci.setAttribute('style', 'fill:' + colRel(v) + ';stroke:var(--surface)');
      ci.setAttribute('stroke-width', '2');
      g.appendChild(ci);
    }
    function tocar(g) {
      if (listo) return;
      const v = +g.getAttribute('data-v');
      if (v === -3) {
        listo = true; g.classList.add('lsa-ok'); punto(g, -3);
        zfb.innerHTML = api.fb('ok', '¡Bien! ' + num(-3) + ' está 3 saltos a la izquierda del 0.');
        LS.ui.sonido('ok');
        api.completar(intentos === 0);
        return;
      }
      intentos++; api.fallo();
      g.classList.add('lsa-miss');
      const msg = v === 3
        ? 'Casi. Ese es el ' + num(3) + ', a la <b>derecha</b> del 0. El ' + num(-3) + ' está a la <b>izquierda</b>.'
        : 'Casi. Desde el 0, cuenta 3 saltos hacia la <b>izquierda</b>.';
      if (intentos >= 2) {
        listo = true;
        const bien = el.querySelector('.tick[data-v="-3"]');
        if (bien) { bien.classList.add('lsa-ok'); punto(bien, -3); }
        zfb.innerHTML = api.fb('miss', msg) + api.fb('info', '<b>Así se hace:</b> desde el 0, cuenta 3 saltos a la izquierda. Ahí está el ' + num(-3) + '.');
        api.completar(false);
      } else {
        zfb.innerHTML = api.fb('miss', msg + '<br><span class="peq tinta-2">Puedes intentar otra vez.</span>');
      }
    }
    el.addEventListener('click', e => { const g = e.target.closest && e.target.closest('.tick[data-v]'); if (g) tocar(g); });
    el.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const g = e.target.closest && e.target.closest('.tick[data-v]');
      if (g) { e.preventDefault(); tocar(g); }
    });
  }

  // =====================================================================
  const LAMINAS = [

    // ======================= INICIO =======================
    {
      id: 'L1', num: 1, cap: 0, desliza: true,
      titulo: c => 'Hola, ' + esc(c.nombre) + '.',
      html: '<div class="sin-color lsa-portada">' + fx('−5 − 9', { clase: 'fx-enorme' }) + '</div>' +
        '<p>Esto sale <b>siempre</b> en el examen de admisión. Mucha gente lo responde mal.</p>' +
        '<p>Al terminar, lo vas a resolver solo, paso a paso.</p>' +
        '<p class="peq tinta-2">Láminas ≈ 25 min · Juego ≈ 30 min · Test ≈ 25 min. Tu avance se guarda solo.</p>' +
        dib(manoDesliza(), 'lsa-dib-mano'),
      bloques: [{ tipo: 'boton', texto: 'Empezar' }]
    },
    {
      id: 'L2', num: 2, cap: 0,
      titulo: 'Cómo usar estas láminas',
      html: '<ol class="lista-num">' +
        '<li>Lee con calma. Cada lámina tiene una sola idea.</li>' +
        '<li>Pasa con <b>Siguiente</b> o deslizando.</li>' +
        '<li>¿No entendiste? Toca <b>«Explícame más despacio»</b>.</li>' +
        '<li>Responde la pregunta para seguir. Equivocarte aquí no resta nada.</li></ol>' +
        dib(miniLamina()),
      bloques: [{ tipo: 'boton', texto: 'Entendido' }]
    },
    {
      id: 'L3', num: 3, cap: 0,
      titulo: 'Adivina primero',
      html: '<p>Aún no te explicamos nada. <b>Solo adivina: no cuenta para nada.</b></p>',
      bloques: [{
        tipo: 'opciones', prediccion: true, guardar: 'gancho',
        enunciado: '¿Cuánto es <span class="sin-color">' + fx('−5 − 9') + '</span>?',
        opciones: [
          { t: num(-14), valor: '-14' },
          { t: num(-4), valor: '-4' },
          { t: num(4), valor: '4' },
          { t: num(14), valor: '14' },
          { t: 'No tengo idea', valor: 'nose' }
        ],
        fbComun: 'Guardado. Más adelante lo resolvemos y verás por qué.'
      }]
    },

    // ======================= CAPÍTULO 1 =======================
    {
      id: 'L4', num: 4, cap: 1,
      entrada: 'Capítulo 1 de 4 · ¿Qué es un número negativo? · unos 4 minutos',
      titulo: 'Los números negativos existen',
      html: c => '<p>Los <b>negativos</b> cuentan lo que está <b>bajo cero</b> o lo que <b>falta</b>.</p>' +
        '<div class="lsa-minis">' +
        mini(termometro(), '<b>' + num(-18) + ' °C</b><br>18 grados bajo cero') +
        mini(ascensor(), 'Piso <b>' + num(-2) + '</b><br>2 pisos bajo la planta baja') +
        mini(cuadernoFiado(c.nombre), '<b>' + num(-2) + ' dólares</b><br>le debes $2 a la tienda') +
        '</div>',
      mas: '<p><b>Otro ejemplo:</b> un buzo está 5 metros bajo el mar. El nivel del mar es el 0, así que el buzo está en ' + num(-5) + ' m.</p>' +
        '<p>El signo − dice que el número está <b>al otro lado del cero</b>. Los números de siempre (1, 2, 3…) son <b>positivos</b>. A veces llevan un + delante: ' + nP(3) + ' es lo mismo que ' + num(3) + '.</p>',
      bloques: [{
        tipo: 'opciones',
        enunciado: 'El ascensor está en el piso ' + num(-1) + '. ¿Dónde está?',
        opciones: [
          { t: '1 piso arriba de la planta baja', fb: 'Casi. El − dice «bajo cero». La planta baja es el 0, así que ' + num(-1) + ' está un piso <b>abajo</b>.' },
          { t: 'En la planta baja', fb: 'Casi. La planta baja es el 0. El ' + num(-1) + ' está un piso más abajo.' },
          { t: '1 piso abajo de la planta baja', ok: true, fb: '¡Eso! El − dice que está bajo el 0.' }
        ]
      }]
    },
    {
      id: 'L5', num: 5, cap: 1,
      titulo: 'La recta numérica',
      html: regla('A la derecha del 0 van los positivos. A la izquierda, los negativos. El 0 no es ni uno ni otro.') +
        '<p><b>Ejemplo:</b> el ' + num(-4) + ' está 4 saltos a la izquierda del 0.</p>' +
        dib(LS.svg.recta({ min: -6, max: 6, puntos: [{ v: -4 }], saltos: [{ de: 0, a: -4, etiqueta: '4 saltos' }], titulo: 'Desde el 0, 4 saltos a la izquierda hasta menos 4' }), 'lsa-dib-compacto') +
        '<p class="caja-nota">El color solo ayuda. Manda el <b>signo escrito</b>: en el examen todo sale en negro.</p>',
      mas: '<p><b>Otro ejemplo:</b> el ' + num(5) + ' está 5 saltos a la <b>derecha</b> del 0. El ' + num(-5) + ' también está a 5 saltos, pero a la <b>izquierda</b>.</p>' +
        '<p>¿Por qué? La recta es como una regla larga con el 0 en el centro. Cuenta siempre los saltos desde el 0.</p>',
      bloques: [{ tipo: 'custom', render: tocarRecta }]
    },
    {
      id: 'L6', num: 6, cap: 1,
      titulo: '¿Cuál es mayor?',
      html: regla('En la recta, el que está más a la derecha es el mayor.') +
        ejemplo({
          titulo: 'Ejemplo: ¿cuál es mayor?',
          pasos: [
            { t: 'Ubícalos en la recta', html: num(-9) + ' y ' + num(-5) + dib(rectaEtiq({ min: -10, max: 1, etiquetas: [-9, -5], puntos: [-9, -5], flecha: 'más a la derecha = mayor', titulo: 'Recta con menos 9 y menos 5. Más a la derecha es mayor' }), 'lsa-dib-compacto') },
            { t: 'Elige el de más a la derecha', html: num(-5) + ' es mayor que ' + num(-9) + '. En plata: deber 9 es peor que deber 5.' }
          ]
        }),
      mas: ejemplo({
        titulo: 'Otro ejemplo: ¿cuál es mayor?',
        pasos: [
          { t: 'Ubícalos en la recta', html: num(-1) + ' está a 1 salto del 0. ' + num(6) + ' está a 6 saltos, a la derecha.' },
          { t: 'Elige el de más a la derecha', html: num(6) + ' es mayor que ' + num(-1) + '.' }
        ]
      }) +
        '<p>¿Por qué? Ir a la derecha es tener más plata o deber menos. Todo positivo es mayor que cualquier negativo.</p>',
      bloques: [
        {
          tipo: 'opciones', columnas: 2,
          enunciado: '¿Cuál es mayor: ' + num(-2) + ' o ' + num(-7) + '?',
          opciones: [
            { t: num(-7), fb: 'Casi. El 7 se ve grande, pero ' + num(-7) + ' es deber 7. ' + num(-2) + ' está más a la derecha: es mayor.' },
            { t: num(-2), ok: true, fb: '¡Exacto! ' + num(-2) + ' está más a la derecha.' }
          ]
        },
        {
          tipo: 'opciones', columnas: 2,
          enunciado: '¿Cuál es mayor: ' + num(-4) + ' o ' + num(0) + '?',
          opciones: [
            { t: num(-4), fb: 'Casi. Todo negativo está a la izquierda del 0. Tener 0 es mejor que deber 4.' },
            { t: num(0), ok: true, fb: '¡Bien! Todo negativo es menor que 0.' }
          ]
        }
      ]
    },
    {
      id: 'L7', num: 7, cap: 1,
      titulo: 'El tamaño de un número',
      html: regla('El tamaño de un número es el número sin su signo. Dice a cuántos saltos está del 0.') +
        ejemplo({
          titulo: 'Ejemplo: ¿cuál tiene más tamaño?',
          pasos: [
            { t: 'Quita los signos', html: num(-9) + ' queda 9. ' + num(5) + ' queda 5.' },
            { t: 'Compara', html: '9 es más que 5. Tiene más tamaño el ' + num(-9) + '.' }
          ]
        }) +
        ojo('Tamaño y mayor son preguntas distintas. ' + num(-9) + ' tiene más tamaño que ' + num(5) + ', pero es menor.'),
      mas: ejemplo({
        titulo: 'Otro ejemplo: ¿cuál tiene más tamaño?',
        pasos: [
          { t: 'Quita los signos', html: num(-2) + ' queda 2. ' + num(6) + ' queda 6.' },
          { t: 'Compara', html: '6 es más que 2. Tiene más tamaño el ' + num(6) + '.' }
        ]
      }) +
        '<p>¿Por qué sirve? Para sumar y restar vas a comparar tamaños. En los libros el tamaño se llama «valor absoluto»: |' + num(-9) + '| = 9.</p>',
      bloques: [{
        tipo: 'opciones', columnas: 2,
        enunciado: '¿Cuál tiene <b>más tamaño</b>: ' + num(-7) + ' o ' + num(4) + '?',
        opciones: [
          { t: num(-7), ok: true, fb: '¡Bien! Sin signos queda 7 y 4. Gana el 7.' },
          { t: num(4), fb: 'Casi. No preguntamos cuál es mayor. Quita los signos: 7 y 4. Gana el ' + num(-7) + '.' }
        ]
      }]
    },
    {
      id: 'L7b', num: 7.5, cap: 1,
      titulo: 'Opuestos: juntos dan 0',
      html: regla('Dos números con el mismo tamaño y signos distintos son opuestos. Juntos dan 0.') +
        ejemplo({
          titulo: 'Ejemplo: ' + num(3) + ' y ' + num(-3),
          pasos: [
            { t: 'Mira tamaño y signo', html: 'Los dos tienen tamaño 3. Uno es +, el otro es −. Son opuestos.' },
            { t: 'Júntalos', html: 'Tienes $3 y debes $3. Cada ficha azul paga una naranja.' + dibFichas({ tengo: 3, debo: 3, cancelar: true }) + 'Pagas todo y quedas en ' + num(0) + '.' }
          ]
        }),
      mas: ejemplo({
        titulo: 'Otro ejemplo: ' + num(7) + ' y ' + num(-7),
        pasos: [
          { t: 'Mira tamaño y signo', html: 'Tamaño 7 los dos. Signos distintos. Son opuestos.' },
          { t: 'Júntalos', html: 'Tienes $7 y debes $7. Pagas los 7 y quedas en ' + num(0) + '.' }
        ]
      }) +
        '<p>¿Por qué? En la recta, los opuestos están a la misma distancia del 0, uno a cada lado.</p>',
      bloques: [{
        tipo: 'opciones',
        enunciado: '¿Cuál es el opuesto de ' + num(-6) + '?',
        opciones: [
          { t: num(-6), fb: 'Casi. Ese es el mismo número. El opuesto tiene el signo contrario: ' + num(6) + '.' },
          { t: num(0), fb: 'Casi. 0 es lo que dan <b>juntos</b>. El opuesto de ' + num(-6) + ' es ' + num(6) + '.' },
          { t: num(6), ok: true, fb: '¡Eso! Mismo tamaño, signo contrario.' }
        ]
      }]
    },
    {
      id: 'L8', num: 8, cap: 1,
      titulo: 'Minichequeo 1',
      html: '<p>Dos preguntas rápidas. Equivocarte aquí no resta nada.</p>',
      bloques: [{
        tipo: 'chequeo',
        repaso: [6, 7.5],
        preguntas: [
          {
            tipo: 'opciones', columnas: 2,
            enunciado: '¿Qué número es el <b>menor</b>?',
            opciones: [
              { t: num(-8), ok: true, fb: '¡Bien! ' + num(-8) + ' es el que está más a la izquierda.' },
              { t: num(-1), fb: 'Casi. ' + num(-1) + ' está muy cerca del 0. ' + num(-8) + ' está más a la izquierda: es el menor.' },
              { t: num(0), fb: 'Casi. Todo negativo es menor que 0. El menor es ' + num(-8) + '.' },
              { t: num(3), fb: 'Casi. ' + num(3) + ' está a la derecha: es el <b>mayor</b>. El menor es ' + num(-8) + '.' }
            ]
          },
          {
            tipo: 'opciones', columnas: 2,
            enunciado: 'Tienes $4 y debes $4. ¿Cómo quedas?',
            opciones: [
              { t: num(-4), fb: 'Casi. Tienes $4 para pagar. Pagas todo y quedas en 0.' },
              { t: num(0), ok: true, fb: '¡Bien! Son opuestos: juntos dan 0.' },
              { t: num(4), fb: 'Casi. Esos $4 los usas para pagar. Quedas en 0.' },
              { t: num(8), fb: 'Casi. Una es plata que tienes y otra que debes. Pagas y quedas en 0.' }
            ]
          }
        ],
        segundo: [
          {
            tipo: 'opciones', columnas: 2,
            enunciado: '¿Qué número es el <b>menor</b>?',
            opciones: [
              { t: num(-6), ok: true, fb: '¡Bien! ' + num(-6) + ' es el que está más a la izquierda.' },
              { t: num(-2), fb: 'Casi. ' + num(-2) + ' está cerca del 0. ' + num(-6) + ' está más a la izquierda: es el menor.' },
              { t: num(0), fb: 'Casi. Todo negativo es menor que 0. El menor es ' + num(-6) + '.' },
              { t: num(4), fb: 'Casi. ' + num(4) + ' está a la derecha: es el <b>mayor</b>. El menor es ' + num(-6) + '.' }
            ]
          },
          {
            tipo: 'opciones', columnas: 2,
            enunciado: 'Tienes $7 y debes $7. ¿Cómo quedas?',
            opciones: [
              { t: num(-7), fb: 'Casi. Tienes $7 para pagar. Pagas todo y quedas en 0.' },
              { t: num(0), ok: true, fb: '¡Bien! Son opuestos: juntos dan 0.' },
              { t: num(7), fb: 'Casi. Esos $7 los usas para pagar. Quedas en 0.' },
              { t: num(14), fb: 'Casi. Una es plata que tienes y otra que debes. Pagas y quedas en 0.' }
            ]
          }
        ],
        salida: '¡Muy bien! Ya sabes ordenar números y qué son los opuestos.'
      }]
    },
    {
      id: 'L9', num: 9, cap: 1,
      titulo: c => '¡Capítulo 1 listo, ' + esc(c.nombre) + '!',
      html: '<div class="sello">' + LS.svg.sello('Capítulo 1 superado') + '</div>' +
        '<p>Ya sabes qué es un negativo, cuál es mayor, qué es el tamaño y qué son los opuestos.</p>' +
        '<p><b>Lo que viene:</b> sumar y restar con la regla de la plata.</p>' +
        '<p class="caja-nota">Puedes parar aquí: tu avance quedó guardado.</p>'
    },

    // ======================= CAPÍTULO 2 =======================
    {
      id: 'L10', num: 10, cap: 2, chip: 'LECTURA', masAlFallar: true,
      entrada: 'Capítulo 2 de 4 · Sumar y restar: la regla de la plata · unos 7 minutos',
      titulo: 'Paso 1: mira los signos',
      html: '<p>Para sumar y restar usarás siempre estos 3 pasos:</p>' + metodo(1) +
        regla(R.LECTURA, 'LECTURA') +
        ejemplo({
          expr: '8 − 5',
          pasos: [
            { t: 'Encierra cada número con su signo', html: burbs(8, -5) },
            { t: 'Léelos', html: 'El 8 no tiene signo: es ' + nP(8) + '. El − es del 5: ' + num(-5) + '.' }
          ]
        }),
      mas: ejemplo({
        titulo: 'Otro ejemplo',
        expr: '−5 − 9',
        pasos: [
          { t: 'Encierra cada número con su signo', html: burbs(-5, -9) },
          { t: 'Léelos', html: 'El primer − es del 5: ' + num(-5) + '. El segundo − es del 9: ' + num(-9) + '.' }
        ]
      }) +
        '<p>¿Por qué? Cada signo va pegado al número que tiene a su derecha. Por eso ese número se lo lleva.</p>',
      bloques: [{
        tipo: 'opciones',
        enunciado: '¿Cuáles son los números de <span class="sin-color">' + fx('7 − 10') + '</span>?',
        opciones: [
          { t: num(7) + ' y ' + num(10), fb: 'Casi. El − que está antes del 10 es del 10. Los números son ' + nP(7) + ' y ' + num(-10) + '.' },
          { t: num(-7) + ' y ' + num(-10), fb: 'Casi. El 7 no tiene signo a su izquierda: es positivo. El − es del 10.' },
          { t: num(-7) + ' y ' + num(10), fb: 'Casi. Cada número se lleva el signo de su <b>izquierda</b>. El − es del 10: ' + nP(7) + ' y ' + num(-10) + '.' },
          { t: nP(7) + ' y ' + num(-10), ok: true, fb: '¡Bien! Siempre empieza así: ' + burbs(7, -10) }
        ]
      }]
    },
    {
      id: 'L11', num: 11, cap: 2, chip: 'PLATA',
      titulo: 'Todo es plata',
      html: '<div class="lsa-plata">' +
        '<p>' + fichaIco('pos') + '<span><b>Positivo</b> = plata que <b>tienes</b>. ' + nP(8) + ' es tener $8.</span></p>' +
        '<p>' + fichaIco('neg') + '<span><b>Negativo</b> = plata que <b>debes</b>. ' + num(-5) + ' es deber $5.</span></p>' +
        '</div>' +
        '<p>Una ficha que tienes paga una que debes: las dos se cancelan.</p>' +
        dibFichas({ tengo: 8, debo: 5, cancelar: true }) +
        '<p class="centro lsa-igual">Quedan 3 que tienes: ' + num(3) + '</p>',
      mas: ejemplo({
        titulo: 'Otro ejemplo: tienes $2 y debes $6',
        pasos: [
          { t: 'Pon las fichas', html: '2 azules y 6 naranjas.' },
          { t: 'Cancela', html: 'Cada azul paga una naranja. Se van 2 parejas.' },
          { t: 'Mira qué queda', html: 'Quedan 4 naranjas: debes 4, o sea ' + num(-4) + '.' }
        ]
      }) +
        '<p>¿Por qué sirve? Sumar y restar es juntar lo que tienes con lo que debes y ver cómo quedas.</p>',
      bloques: [{
        tipo: 'opciones',
        enunciado: '¿Qué significa ' + num(-4) + '?',
        opciones: [
          { t: 'Tienes 4 dólares', fb: 'Casi. El − es plata que <b>debes</b>: debes 4 dólares.' },
          { t: 'Debes 4 dólares', ok: true, fb: '¡Eso! El − es plata que debes.' },
          { t: 'No tienes nada', fb: 'Casi. No tener nada es 0. ' + num(-4) + ' es deber 4 dólares.' }
        ]
      }]
    },
    {
      id: 'L12', num: 12, cap: 2, chip: 'SE JUNTAN', masAlFallar: true,
      titulo: 'Mismo signo: SE JUNTAN',
      html: c => '<p>Primero, predice.</p>' +
        '<p>En ' + fx('−5 − 9') + ' debes 5 y luego debes 9 más.</p>' +
        dib(montones([{ n: 5, etiqueta: 'Debes 5' }, { n: 9, etiqueta: 'y 9 más' }], 'neg', 'Un montón de 5 fichas de deber y otro de 9'), 'lsa-dib-compacto') +
        (hecho(c, 'L12') ? reglaL12(c) : ''),
      mas: ejemplo({
        titulo: 'Otro ejemplo',
        expr: '−3 − 4',
        pasos: [
          { t: P1, html: burbs(-3, -4) + ' Debes 3 y luego 4 más.' },
          { t: P2, html: 'Los dos signos son iguales.', regla: 'SE JUNTAN' },
          { t: P3, html: 'Suma los tamaños: ' + fx('3 + 4 = 7') + '. Deja el signo −.' }
        ],
        resultado: '−3 − 4 = −7'
      }) +
        '<p>¿Por qué? Dos deudas no se pagan entre sí: solo crecen. Con plata que tienes pasa igual: ' + fx('3 + 4 = 7') + '.</p>',
      bloques: [
        {
          tipo: 'opciones',
          enunciado: '¿Cómo quedas?',
          opciones: [
            { t: 'Debo menos', fb: 'Casi. Si a una deuda le sumas otra, debes <b>más</b>.' },
            { t: 'Ya no debo nada', fb: 'Casi. No pagaste nada: solo tienes otra deuda.' },
            { t: 'Debo más', ok: true, fb: '¡Eso! Mira cuánto:' }
          ],
          solucion: 'Debes 5 y pides 9 más: debes más. Mira cuánto:'
        },
        { tipo: 'revelar', html: c => hecho(c, 'L12') ? '' : reglaL12(c) }
      ]
    },
    {
      id: 'L13', num: 13, cap: 2, chip: 'SE CANCELAN', masAlFallar: true,
      titulo: 'Signos distintos: SE CANCELAN',
      html: c => '<p>Primero, predice.</p>' +
        '<p>En ' + fx('−9 + 5') + ' debes 9 y tienes 5. Pagas lo que puedes.</p>' +
        (hecho(c, 'L13') ? reglaL13() : dibFichas({ tengo: 5, debo: 9 })),
      mas: ejemplo({
        titulo: 'Otro ejemplo',
        expr: '−2 + 7',
        pasos: [
          { t: P1, html: burbs(-2, 7) + ' Debes 2 y tienes 7.' },
          { t: P2, html: 'Los signos son distintos.', regla: 'SE CANCELAN' },
          { t: P3, html: 'Resta los tamaños: ' + fx('7 − 2 = 5') + '. Tiene más tamaño el ' + nP(7) + ': queda positivo.' }
        ],
        resultado: '−2 + 7 = 5'
      }) +
        '<p>¿Por qué? Cada dólar que tienes paga un dólar que debes. Lo que sobra decide el signo.</p>',
      bloques: [
        {
          tipo: 'opciones',
          enunciado: '¿Qué te queda?',
          opciones: [
            { t: 'Me sobra plata', fb: 'Casi. Con 5 no alcanza para pagar 9: sigues debiendo.' },
            { t: 'Sigo debiendo', ok: true, fb: '¡Eso! ¿Cuánto? Mira:' }
          ],
          solucion: 'Con 5 no alcanza para pagar 9: sigues debiendo. ¿Cuánto? Mira:'
        },
        { tipo: 'revelar', html: c => hecho(c, 'L13') ? '' : reglaL13() },
        {
          tipo: 'teclado', cuenta: '−3 + 10',
          enunciado: 'Ahora tú: ' + fx('−3 + 10') + ' = ?',
          correcta: 7,
          errores: {
            '-7': 'Casi. El tamaño está bien, revisa el signo. Tiene más tamaño el ' + nP(10) + ': queda positivo.',
            '13': 'Casi. Juntaste, pero los signos son distintos: SE CANCELAN. Resta ' + fx('10 − 3') + '.',
            '-13': 'Casi. Juntaste, pero los signos son distintos: SE CANCELAN. Resta ' + fx('10 − 3') + '.'
          },
          okFb: '¡Bien! ' + fx('10 − 3 = 7') + ', y gana el ' + nP(10) + '.',
          solucion: burbs(-3, 10) + ' Signos distintos: SE CANCELAN. ' + fx('10 − 3 = 7') + '. Gana el ' + nP(10) + ': queda ' + num(7) + '.'
        }
      ]
    },
    {
      id: 'L14', num: 14, cap: 2, chip: 'SE CANCELAN',
      titulo: 'El caso más tramposo: <span class="sin-color">' + fx('3 − 8') + '</span>',
      html: ejemplo({
        expr: '3 − 8',
        pasos: [
          { t: P1, html: burbs(3, -8) + ' Tienes 3 y debes 8.' },
          { t: P2, html: 'Los signos son distintos.', regla: 'SE CANCELAN' },
          { t: P3, html: 'Resta los tamaños: ' + fx('8 − 3 = 5') + '. Tiene más tamaño la deuda de 8: queda negativo.' }
        ],
        resultado: '3 − 8 = −5'
      }) +
        dibFichas({ tengo: 3, debo: 8, cancelar: true }) +
        ojo('No escribas ' + fxMal('3 − 8 = 5') + '. Tienes 3 y gastas 8: te faltan 5.'),
      mas: ejemplo({
        titulo: 'Otro ejemplo',
        expr: '6 − 10',
        pasos: [
          { t: P1, html: burbs(6, -10) + ' Tienes 6 y debes 10.' },
          { t: P2, html: 'Los signos son distintos.', regla: 'SE CANCELAN' },
          { t: P3, html: 'Resta los tamaños: ' + fx('10 − 6 = 4') + '. Tiene más tamaño la deuda de 10: queda negativo.' }
        ],
        resultado: '6 − 10 = −4'
      }) +
        '<p>¿Por qué engaña? El 6 va primero, pero no decide. Decide el que tiene más tamaño.</p>',
      bloques: [{
        tipo: 'teclado', cuenta: '4 − 11',
        enunciado: fx('4 − 11') + ' = ?',
        correcta: -7,
        errores: {
          '7': 'Casi. El tamaño está bien, pero el signo no. Tienes 4 y debes 11: sigues debiendo 7.',
          '15': 'Casi. Juntaste, pero ' + nP(4) + ' y ' + num(-11) + ' tienen signos distintos: SE CANCELAN. Resta ' + fx('11 − 4') + '.',
          '-15': 'Casi. Juntaste, pero ' + nP(4) + ' y ' + num(-11) + ' tienen signos distintos: SE CANCELAN. Resta ' + fx('11 − 4') + '.'
        },
        okFb: '¡Bien! Tienes 4 y debes 11: sigues debiendo 7.',
        solucion: burbs(4, -11) + ' Signos distintos: SE CANCELAN. ' + fx('11 − 4 = 7') + '. Gana la deuda de 11: queda ' + num(-7) + '.'
      }]
    },
    {
      id: 'L15', num: 15, cap: 2,
      titulo: 'Ejemplos resueltos',
      html: '<p>Mira los 3 pasos en acción. Toca <b>Ver siguiente paso</b>.</p>' + metodo(0),
      bloques: [
        {
          tipo: 'pasos',
          titulo: 'Ejemplo 1: ' + fxM('−8 + 13'),
          filas: [
            { n: '1', html: '<b>' + P1 + '</b><br>' + burbs(-8, 13) + ' Debes 8 y tienes 13.' },
            { n: '2', html: '<b>' + P2 + '</b><br>Los signos son distintos.', regla: 'SE CANCELAN' },
            { n: '3', html: '<b>' + P3 + '</b><br>Resta los tamaños: ' + fx('13 − 8 = 5') + '.' },
            { n: 'Resultado', html: 'Tiene más tamaño el ' + nP(13) + ': queda positivo.<br>' + fxM('−8 + 13 = 5') }
          ],
          pregunta: {
            despuesDe: 2, tipoPreg: 'opciones',
            enunciado: 'El resultado sale positivo. ¿Por qué?',
            opciones: [
              { t: 'Porque hay un signo +', fb: 'Casi. El + solo no decide. Decide el que tiene más tamaño: el ' + nP(13) + '.' },
              { t: 'Porque el 13 va al final', fb: 'Casi. El orden no decide. Decide el que tiene más tamaño: el ' + nP(13) + '.' },
              { t: 'Porque 13 tiene más tamaño y es positivo', ok: true, fb: '¡Exacto! Decide el que tiene más tamaño.' }
            ],
            solucion: 'Decide el que tiene más tamaño: el ' + nP(13) + '.'
          }
        },
        {
          tipo: 'pasos',
          titulo: 'Ejemplo 2: ' + fxM('−6 − 7'),
          filas: [
            { n: '1', html: '<b>' + P1 + '</b><br>' + burbs(-6, -7) + ' Dos deudas.' },
            { n: '2', html: '<b>' + P2 + '</b><br>Los dos signos son iguales.', regla: 'SE JUNTAN' },
            { n: '3', html: '<b>' + P3 + '</b><br>Suma los tamaños: ' + fx('6 + 7 = 13') + '. Deja el signo −.' },
            { n: 'Resultado', html: fxM('−6 − 7 = −13') }
          ]
        }
      ]
    },
    {
      id: 'L16', num: 16, cap: 2,
      titulo: 'Te toca terminar',
      html: '<p>Algunos pasos ya están hechos. Tú terminas.</p>',
      bloques: [
        {
          tipo: 'revelar',
          html: '<div class="lsa-resuelto"><p class="lsa-resuelto-tit"><b>Ejercicio A:</b> ' + fxM('−11 + 4') + ' <span class="peq tinta-2">(falta el signo)</span></p>' +
            '<ul class="lsa-hechos">' +
            hechoLi(1, P1, burbs(-11, 4)) +
            hechoLi(2, P2, 'signos distintos, ' + chip('SE CANCELAN')) +
            hechoLi(3, P3, fx('11 − 4 = 7')) + '</ul></div>'
        },
        {
          tipo: 'opciones', columnas: 2, cuenta: '−11 + 4',
          enunciado: '<b>Tú</b> terminas el paso 3: ¿qué signo lleva?',
          opciones: [
            { t: num(-7), ok: true, fb: '¡Bien! Tiene más tamaño la deuda de 11: ' + fx('−11 + 4 = −7') + '.' },
            { t: num(7), fb: 'Casi. El 4 no decide. Tiene más tamaño el 11, que es deuda: ' + num(-7) + '.' }
          ]
        },
        {
          tipo: 'revelar',
          html: '<div class="lsa-resuelto"><p class="lsa-resuelto-tit"><b>Ejercicio B:</b> ' + fxM('−6 − 9') + ' <span class="peq tinta-2">(faltan los pasos 2 y 3)</span></p>' +
            '<ul class="lsa-hechos">' + hechoLi(1, P1, burbs(-6, -9)) + '</ul></div>'
        },
        {
          tipo: 'opciones', columnas: 2,
          enunciado: 'Paso 2, <b>tú</b>: ¿qué regla toca?',
          opciones: [
            { t: chip('SE CANCELAN'), fb: 'Casi. Los dos son deudas: signos iguales. Toca SE JUNTAN.' },
            { t: chip('SE JUNTAN'), ok: true, fb: '¡Eso! Signos iguales: SE JUNTAN.' }
          ]
        },
        {
          tipo: 'teclado', cuenta: '−6 − 9',
          enunciado: 'Paso 3, <b>tú</b>: ' + fx('−6 − 9') + ' = ?',
          correcta: -15,
          errores: {
            '15': 'Casi. El tamaño está bien. Son dos deudas: el resultado también es deuda.',
            '3': 'Casi. Restaste, pero los signos son iguales: SE JUNTAN. Suma ' + fx('6 + 9') + '.',
            '-3': 'Casi. Restaste, pero los signos son iguales: SE JUNTAN. Suma ' + fx('6 + 9') + '.'
          },
          okFb: '¡Bien! Debes 6 y 9 más: ' + fx('−6 − 9 = −15') + '.',
          solucion: 'Signos iguales: SE JUNTAN. ' + fx('6 + 9 = 15') + ' y deja el signo −: ' + num(-15) + '.'
        }
      ]
    },
    {
      id: 'L17', num: 17, cap: 2, chip: 'PLATA',
      titulo: 'Tres o más números',
      html: regla('Con tres o más números, junta lo que tienes, junta lo que debes y cancela.') +
        ejemplo({
          expr: '3 − 7 + 2 − 5',
          pasos: [
            { t: P1, html: burbs(3, -7, 2, -5) },
            { t: P2, html: 'Hay signos iguales y distintos: primero ' + chip('SE JUNTAN') + ' y luego ' + chip('SE CANCELAN') + '.' },
            { t: P3, html: 'Tienes ' + fx('3 + 2 = 5') + '. Debes ' + fx('7 + 5 = 12') + '.<br>Cancela: ' + fx('12 − 5 = 7') + '. Gana la deuda: queda negativo.' }
          ],
          resultado: '3 − 7 + 2 − 5 = −7'
        }),
      mas: ejemplo({
        titulo: 'Otro ejemplo',
        expr: '−2 + 6 − 1 + 3',
        pasos: [
          { t: P1, html: burbs(-2, 6, -1, 3) },
          { t: P2, html: 'Primero ' + chip('SE JUNTAN') + ' y luego ' + chip('SE CANCELAN') + '.' },
          { t: P3, html: 'Tienes ' + fx('6 + 3 = 9') + '. Debes ' + fx('2 + 1 = 3') + '.<br>Cancela: ' + fx('9 − 3 = 6') + '. Gana lo que tienes: queda positivo.' }
        ],
        resultado: '−2 + 6 − 1 + 3 = 6'
      }) +
        '<p>¿Por qué? Da lo mismo que ir de izquierda a derecha, de dos en dos. Pero separar lo que tienes y lo que debes es más fácil.</p>',
      bloques: [{
        tipo: 'teclado', cuenta: '−4 + 10 − 3',
        enunciado: fx('−4 + 10 − 3') + ' = ?',
        correcta: 3,
        errores: {
          '-3': 'Casi. Revisa el signo. Tienes 10 y debes 7: te alcanza y te sobran 3.',
          '9': 'Casi. El 3 tiene un − a su izquierda: es deuda. Debes ' + fx('4 + 3 = 7') + ' y tienes 10.',
          '17': 'Casi. Juntaste todo. Separa: tienes 10 y debes 7. Luego cancela.',
          '-17': 'Casi. Juntaste todo. Separa: tienes 10 y debes 7. Luego cancela.'
        },
        okFb: '¡Bien! Tienes 10 y debes 7: te sobran 3.',
        solucion: burbs(-4, 10, -3) + ' Tienes 10. Debes ' + fx('4 + 3 = 7') + '. Cancela: ' + fx('10 − 7 = 3') + '. Gana lo que tienes: ' + num(3) + '.'
      }]
    },
    {
      id: 'L18', num: 18, cap: 2,
      titulo: 'Encuentra el error',
      html: '<p>Mateo resolvió esto. ¿Qué hizo mal?</p>' + cuadernoMateo(),
      bloques: [{
        tipo: 'opciones',
        enunciado: '¿Qué hizo mal Mateo?',
        opciones: [
          { t: 'Sumó mal: ' + fx('5 + 9') + ' no es ' + num(14), fb: 'Casi. ' + fx('5 + 9 = 14') + ' está bien. Falla el signo: son dos deudas, así que da ' + num(-14) + '.' },
          { t: 'No hay error', fb: 'Casi. Debe 5 y debe 9 más: el resultado es deuda. Da ' + num(-14) + ', no ' + num(14) + '.' },
          { t: 'Debió restar: da ' + num(-4), fb: 'Casi. Los signos son iguales: SE JUNTAN, no se restan. Da ' + num(-14) + '.' },
          { t: 'Usó una regla de multiplicar, pero aquí no hay multiplicación', ok: true, fb: '¡Exacto! Aquí no se multiplica. Son dos deudas: SE JUNTAN y da ' + num(-14) + '.' }
        ],
        solucion: 'Mateo usó una regla de multiplicar. Aquí no se multiplica: son dos deudas y ' + fx('−5 − 9 = −14') + '.'
      }]
    },
    {
      id: 'L19', num: 19, cap: 2,
      titulo: 'Minichequeo 2',
      html: '<p>Tres preguntas para ver cómo vas. Usa los 3 pasos:</p>' + metodo(0),
      bloques: [{
        tipo: 'chequeo',
        repaso: [12, 13],
        preguntas: [
          {
            tipo: 'opciones', columnas: 2, cuenta: '−6 + 2',
            enunciado: fx('−6 + 2') + ' = ?',
            opciones: [
              { t: num(-8), fb: 'Casi. Juntaste, pero los signos son distintos: SE CANCELAN. ' + fx('6 − 2 = 4') + ' y gana la deuda.' },
              { t: num(-4), ok: true, fb: '¡Bien! Debes 6 y tienes 2: sigues debiendo 4.' },
              { t: num(4), fb: 'Casi. El tamaño está bien, falta el signo. Debes 6 y tienes 2: sigues debiendo.' },
              { t: num(8), fb: 'Casi. Los signos son distintos: SE CANCELAN. Resta ' + fx('6 − 2') + ' y gana la deuda.' }
            ]
          },
          {
            tipo: 'opciones', columnas: 2, cuenta: '−3 − 8',
            enunciado: fx('−3 − 8') + ' = ?',
            opciones: [
              { t: num(-11), ok: true, fb: '¡Bien! Dos deudas: SE JUNTAN.' },
              { t: num(-5), fb: 'Casi. Restaste, pero son dos deudas: SE JUNTAN. Suma ' + fx('3 + 8') + '.' },
              { t: num(5), fb: 'Casi. Restaste, pero son dos deudas: SE JUNTAN. Suma ' + fx('3 + 8') + ' y deja el −.' },
              { t: num(11), fb: 'Casi. El tamaño está bien. Dos deudas dan una deuda más grande: lleva −.' }
            ]
          },
          {
            tipo: 'teclado', cuenta: '7 − 15',
            enunciado: fx('7 − 15') + ' = ?',
            correcta: -8,
            errores: {
              '8': 'Casi. El tamaño está bien, revisa el signo. Tienes 7 y gastas 15: te faltan 8.',
              '22': 'Casi. Juntaste, pero los signos son distintos: SE CANCELAN. Resta ' + fx('15 − 7') + '.',
              '-22': 'Casi. Juntaste, pero los signos son distintos: SE CANCELAN. Resta ' + fx('15 − 7') + '.'
            },
            okFb: '¡Bien! Tienes 7 y gastas 15: debes 8.',
            solucion: burbs(7, -15) + ' SE CANCELAN. ' + fx('15 − 7 = 8') + '. Gana la deuda de 15: ' + num(-8) + '.'
          }
        ],
        segundo: [
          {
            tipo: 'opciones', columnas: 2, cuenta: '−8 + 3',
            enunciado: fx('−8 + 3') + ' = ?',
            opciones: [
              { t: num(-11), fb: 'Casi. Juntaste, pero los signos son distintos: SE CANCELAN. ' + fx('8 − 3 = 5') + ' y gana la deuda.' },
              { t: num(-5), ok: true, fb: '¡Bien! Debes 8 y tienes 3: sigues debiendo 5.' },
              { t: num(5), fb: 'Casi. El tamaño está bien, falta el signo. Debes 8 y tienes 3: sigues debiendo.' },
              { t: num(11), fb: 'Casi. Los signos son distintos: SE CANCELAN. Resta ' + fx('8 − 3') + ' y gana la deuda.' }
            ]
          },
          {
            tipo: 'opciones', columnas: 2, cuenta: '−4 − 9',
            enunciado: fx('−4 − 9') + ' = ?',
            opciones: [
              { t: num(-13), ok: true, fb: '¡Bien! Dos deudas: SE JUNTAN.' },
              { t: num(-5), fb: 'Casi. Restaste, pero son dos deudas: SE JUNTAN. Suma ' + fx('4 + 9') + '.' },
              { t: num(5), fb: 'Casi. Restaste, pero son dos deudas: SE JUNTAN. Suma ' + fx('4 + 9') + ' y deja el −.' },
              { t: num(13), fb: 'Casi. El tamaño está bien. Dos deudas dan una deuda más grande: lleva −.' }
            ]
          },
          {
            tipo: 'teclado', cuenta: '5 − 12',
            enunciado: fx('5 − 12') + ' = ?',
            correcta: -7,
            errores: {
              '7': 'Casi. El tamaño está bien, revisa el signo. Tienes 5 y gastas 12: te faltan 7.',
              '17': 'Casi. Juntaste, pero los signos son distintos: SE CANCELAN. Resta ' + fx('12 − 5') + '.',
              '-17': 'Casi. Juntaste, pero los signos son distintos: SE CANCELAN. Resta ' + fx('12 − 5') + '.'
            },
            okFb: '¡Bien! Tienes 5 y gastas 12: debes 7.',
            solucion: burbs(5, -12) + ' SE CANCELAN. ' + fx('12 − 5 = 7') + '. Gana la deuda de 12: ' + num(-7) + '.'
          }
        ],
        salida: '¡Muy bien! Ya sabes sumar y restar con la regla de la plata.'
      }]
    },
    {
      id: 'L19b', num: 19.5, cap: 2,
      titulo: c => '¡Capítulo 2 listo, ' + esc(c.nombre) + '!',
      html: '<div class="sello">' + LS.svg.sello('Capítulo 2 superado') + '</div>' +
        '<p>Ya sabes mirar los signos, juntar y cancelar.</p>' +
        '<p><b>Lo que viene:</b> la trampa en la que cae casi todo el mundo.</p>' +
        '<p class="caja-nota">Puedes parar aquí: tu avance quedó guardado.</p>'
    }
  ];

  LS.LAMINAS = (LS.LAMINAS || []).concat(LAMINAS);
})();
