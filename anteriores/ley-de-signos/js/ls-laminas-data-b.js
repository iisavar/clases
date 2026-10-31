/* Láminas 21–41: Capítulo 3 (signos pegados, · y ÷), Capítulo 4 (potencias y combinadas) y Cierre.
   Formato fijo de cada lámina de regla: LS.ui.regla (texto exacto) + LS.ui.ejemplo (3 pasos) + dibujo compacto + pregunta.
   Además: LS.resumen, el generador de la imagen «Tu resumen en una foto» (PNG 1080×1350). */
(function () {
  'use strict';
  const LS = window.LS = window.LS || {};
  const M = LS.M;
  // Un espacio de ancho cero al final evita que fx lea un negativo final como «−3²».
  const fx = (s, o) => LS.ui.fx(/\d$/.test(s) ? s + '​' : s, o);
  const t = (s) => fx(s, { clase: 'sin-color' });              // cuentas de tamaños (sin signo)
  const mal = (s) => '<span class="tachado">' + fx(s, { clase: 'sin-color lsb-mal' }) + '</span>';
  const N = (v) => LS.ui.num(v);
  const chip = (x) => LS.ui.chip(x);
  const svg = () => LS.svg;
  const REGLA = (txt, c) => LS.ui.regla(txt, c);
  const EJ = (o) => LS.ui.ejemplo(o);
  const OJO = (h) => LS.ui.ojo(h);

  // Textos EXACTOS de las reglas (iguales en láminas, juego, test y resumen)
  const TXT = {
    'LECTURA': 'Cada número se lleva el signo que tiene a su izquierda. Si no tiene signo, es positivo.',
    'SE JUNTAN': 'Si los dos signos son iguales, suma los tamaños y deja ese signo.',
    'SE CANCELAN': 'Si los signos son distintos, resta los tamaños (grande menos chico) y deja el signo del que tiene más tamaño.',
    'SIGNOS PEGADOS': 'Si dos signos quedan pegados, júntalos en uno: iguales dan +, distintos dan −.',
    'CUENTA LOS NEGATIVOS': 'Cuenta los negativos: si son par (2, 4…), el resultado es positivo; si son impar (1, 3…), es negativo. Luego multiplica o divide los tamaños.',
    'POTENCIA': 'El exponente solo multiplica lo que tiene pegado. Con paréntesis el menos entra; sin paréntesis el menos espera afuera.',
    'ESCALERA': 'Primero paréntesis, luego potencias, luego · y ÷, al final + y −. Si están en el mismo escalón, de izquierda a derecha.'
  };
  const R = (c) => REGLA(TXT[c], c);

  // ---------- Ayudantes de datos ----------
  const opc = (v, fb) => ({ t: fx(M.fmt(v)), v, fb });
  const okc = (v, fb) => ({ t: fx(M.fmt(v)), v, ok: true, fb });
  function E(pares) { const o = {}; pares.forEach(p => p[0].forEach(k => { o[k] = p[1]; })); return o; }
  function pOpc(fuente, opciones, extra) {
    return Object.assign({ tipo: 'opciones', fuente, enunciado: fx(fuente + ' = ?'), opciones, columnas: 2 }, extra || {});
  }
  function pTec(fuente, correcta, errores, extra) {
    return Object.assign({ tipo: 'teclado', fuente, correcta, errores, enunciado: fx(fuente + ' = ?') }, extra || {});
  }
  // Solución en los 3 pasos del método
  const tres = (a, b, c) => '<b>1.</b> ' + a + ' <b>2.</b> ' + b + ' <b>3.</b> ' + c;
  // Expresión con partes enmarcadas: [['3 − ', false], ['2(−4)', true], [' + (−6) ÷ 2', false]]
  function mk(partes) {
    return '<span class="lsb-expr">' + partes.map(p => p[1] ? '<span class="lsb-marco">' + fx(p[0]) + '</span>' : fx(p[0])).join('') + '</span>';
  }
  const queda = (s) => '<div class="lsb-queda">Queda ' + fx(s) + '</div>';
  function yaHecho(c, id, num) {
    const r = c.st.laminas.respuestas[id];
    if (r && r.hecho) return true;
    const i = LS.laminas && LS.laminas.indicePorNum ? LS.laminas.indicePorNum(num) : -1;
    return i >= 0 && i < c.st.laminas.maxAlcanzada;
  }

  // Teclado dentro de un bloque 'custom' (misma lógica que el bloque 'teclado' del carrusel).
  function tecladoLocal(zona, cfg, api, alFin) {
    const ui = LS.ui;
    zona.innerHTML = '<div class="bloque-preg"><div class="enunciado">' + cfg.enunciado + '</div><div class="zona-fb" aria-live="polite"></div><div class="zona-tec"></div></div>';
    const zfb = zona.querySelector('.zona-fb');
    let intentos = 0;
    const tec = ui.teclado(zona.querySelector('.zona-tec'), {
      onOk: (v) => {
        const tu = 'Tu respuesta: ' + ui.num(v) + '. ';
        if (v === cfg.correcta) {
          tec.bloquear(true);
          zfb.innerHTML = api.fb('ok', tu + cfg.okFb);
          ui.sonido('ok');
          alFin(intentos === 0);
          return;
        }
        intentos++;
        api.fallo();
        const conocido = (cfg.errores || {})[String(v)];
        const msg = conocido || 'Casi. Mira cómo se hace:';
        if (intentos >= 2) {
          tec.bloquear(true);
          zfb.innerHTML = api.fb('miss', tu + msg) + api.fb('info', '<b>Respuesta: ' + ui.num(cfg.correcta) + '.</b> ' + cfg.solucion);
          alFin(false);
        } else {
          zfb.innerHTML = api.fb('miss', tu + msg + (!conocido ? '<br>' + cfg.solucion : '') + '<br><span class="peq tinta-2">Intenta otra vez.</span>');
          tec.limpiar();
        }
      }
    });
  }

  // ---------- Dibujos propios ----------
  const T = (x, y, txt, o) => {
    o = o || {};
    return '<text x="' + x + '" y="' + y + '" text-anchor="' + (o.anchor || 'middle') + '" font-size="' + (o.size || 14) + '" font-weight="' + (o.peso || 800) + '" style="fill:' + (o.col || 'var(--ink)') + '">' + txt + '</text>';
  };
  const colTxt = (v) => v === 0 ? 'var(--ink)' : v < 0 ? 'var(--neg-text)' : 'var(--pos-text)';
  const colRel = (v) => v === 0 ? 'var(--ink)' : v < 0 ? 'var(--neg)' : 'var(--pos)';
  const cab = (vb, aria) => '<svg viewBox="' + vb + '" role="img" aria-label="' + aria + '"><title>' + aria + '</title>';

  function svgLupa23() {
    return cab('0 0 320 130', 'Lupa sobre 2(−4): número pegado al paréntesis quiere decir multiplicar') +
      '<circle cx="118" cy="60" r="50" style="fill:var(--surface);stroke:var(--ink)" stroke-width="2.5"/>' +
      '<path d="M154 96 L180 122" style="stroke:var(--ink)" stroke-width="7" stroke-linecap="round"/>' +
      '<text x="118" y="73" text-anchor="middle" font-size="36" font-weight="900"><tspan style="fill:var(--pos-text)">2</tspan><tspan style="fill:var(--ink)">(</tspan><tspan style="fill:var(--neg-text)">−4</tspan><tspan style="fill:var(--ink)">)</tspan></text>' +
      T(252, 54, 'pegados', { size: 16 }) + T(252, 76, 'quiere decir', { size: 14, col: 'var(--ink-2)' }) + T(252, 98, 'multiplicar', { size: 16 }) +
      '</svg>';
  }

  function svgGrupos24() {
    const f = svg().ficha;
    let s = cab('0 0 320 150', '3 grupos de 2 fichas de deber se juntan en 6 fichas: menos 6');
    for (let g = 0; g < 3; g++) {
      const x = 16 + g * 100;
      s += '<rect x="' + x + '" y="8" width="84" height="44" rx="12" fill="none" style="stroke:var(--ink-3)" stroke-width="2" stroke-dasharray="5 4"/>';
      s += f(x + 26, 30, 'neg') + f(x + 58, 30, 'neg');
      s += T(x + 42, 72, '−2', { size: 15, peso: 900, col: 'var(--neg-text)' });
    }
    s += '<path d="M160 80 v18 m-7 -7 l7 7 7 -7" fill="none" style="stroke:var(--ink)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
    for (let i = 0; i < 6; i++) s += f(40 + i * 30, 122, 'neg');
    s += '<text x="226" y="131" font-size="26" font-weight="900"><tspan style="fill:var(--ink)">= </tspan><tspan style="fill:var(--neg-text)">−6</tspan></text>';
    return s + '</svg>';
  }

  // Patrón de la lámina 25: resultados en una recta vertical con insignias «+2»
  function svgPatron25() {
    const Y = (v) => 20 + (4 - v) * 14;
    let s = cab('0 0 120 180', 'Los resultados suben de 2 en 2');
    s += '<line x1="34" y1="' + (Y(5) - 2) + '" x2="34" y2="' + (Y(-7)) + '" style="stroke:var(--ink)" stroke-width="2.5" stroke-linecap="round"/>';
    s += '<path d="M28 ' + (Y(5) + 4) + ' l6 -7 6 7" fill="none" style="stroke:var(--ink)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
    for (let v = -6; v <= 4; v += 2) s += '<line x1="29" y1="' + Y(v) + '" x2="39" y2="' + Y(v) + '" style="stroke:var(--ink-3)" stroke-width="2"/>';
    const pts = [[-6, '0'], [-4, '1'], [-2, '2'], [0, '3'], [2, 'final'], [4, 'final']];
    pts.forEach((p, i) => {
      const v = p[0], y = Y(v);
      const attr = p[1] === '0' ? '' : p[1] === 'final' ? ' class="lsb-oc" data-final' : ' class="lsb-oc" data-toque="' + p[1] + '"';
      s += '<g' + attr + '><circle cx="34" cy="' + y + '" r="6.5" style="fill:' + colRel(v) + ';stroke:var(--surface)" stroke-width="2"/>' +
        T(22, y + 5, (v < 0 ? '−' : '') + Math.abs(v), { anchor: 'end', size: 14, peso: 900, col: colTxt(v) }) + '</g>';
      if (i > 0) {
        const ym = (Y(v) + Y(pts[i - 1][0])) / 2;
        s += '<g' + attr + '><rect x="52" y="' + (ym - 9) + '" width="34" height="18" rx="9" style="fill:var(--zero-soft);stroke:var(--ink)" stroke-width="1.5"/>' +
          T(69, ym + 5, '+2', { size: 12, peso: 900 }) + '</g>';
      }
    });
    // «?» mientras se pregunta (solo en la lámina, desaparece al responder)
    s += '<g class="lsb-oc lsb-solo-lam" data-toque="4" data-preg>' +
      '<rect x="52" y="' + ((Y(2) + Y(0)) / 2 - 9) + '" width="34" height="18" rx="9" style="fill:var(--zero-soft);stroke:var(--ink)" stroke-width="1.5"/>' +
      T(69, (Y(2) + Y(0)) / 2 + 5, '+2', { size: 12, peso: 900 }) + T(22, Y(2) + 5, '?', { anchor: 'end', size: 16, peso: 900 }) + '</g>';
    return s + '</svg>';
  }

  function lupa28(contenido, aria) {
    return cab('0 0 100 88', aria) +
      '<circle cx="44" cy="40" r="34" style="fill:var(--surface);stroke:var(--ink)" stroke-width="2.5"/>' +
      '<path d="M69 65 L88 84" style="stroke:var(--ink)" stroke-width="6" stroke-linecap="round"/>' + contenido + '</svg>';
  }

  function svgPotencia30() {
    return cab('0 0 320 140', 'Dos al cubo: el 2 es la base y el 3 es el exponente, que dice cuántas veces se multiplica la base') +
      T(70, 104, '2', { size: 84, peso: 900, col: 'var(--pos-text)' }) +
      T(112, 50, '3', { size: 40, peso: 900 }) +
      '<path d="M128 32 Q 172 0 214 28" fill="none" style="stroke:var(--ink)" stroke-width="2.5" stroke-linecap="round"/>' +
      '<path d="M203 22 l11 6 -9 8" fill="none" style="stroke:var(--ink)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      T(256, 54, '¿cuántas veces?', { size: 16 }) +
      T(70, 132, 'base', { size: 15, col: 'var(--ink-2)' }) +
      T(112, 76, 'exponente', { size: 15, col: 'var(--ink-2)', anchor: 'start' }) +
      '</svg>';
  }

  function svgAlcance32() {
    return cab('0 0 300 138', 'En (−3)² el exponente toca todo el paréntesis. En −3² el exponente toca solo al 3 y el menos espera afuera') +
      T(24, 92, '(', { size: 46, peso: 800 }) + T(62, 92, '−3', { size: 46, peso: 900, col: 'var(--neg-text)' }) + T(100, 92, ')', { size: 46, peso: 800 }) +
      T(117, 58, '2', { size: 26, peso: 900 }) +
      '<path d="M116 36 Q 66 -12 14 50" fill="none" style="stroke:var(--ink)" stroke-width="2.5" stroke-linecap="round"/>' +
      '<circle cx="14" cy="50" r="3.5" style="fill:var(--ink)"/>' +
      T(62, 124, 'el menos entra', { size: 14, col: 'var(--ink-2)' }) +
      '<line x1="152" y1="16" x2="152" y2="124" style="stroke:var(--line)" stroke-width="2.5" stroke-dasharray="5 5"/>' +
      T(196, 92, '−', { size: 46, peso: 900 }) + T(228, 92, '3', { size: 46, peso: 900, col: 'var(--pos-text)' }) +
      T(250, 58, '2', { size: 26, peso: 900 }) +
      '<path d="M249 36 Q 236 10 214 52" fill="none" style="stroke:var(--ink)" stroke-width="2.5" stroke-linecap="round"/>' +
      '<circle cx="214" cy="52" r="3.5" style="fill:var(--ink)"/>' +
      '<path d="M196 112 v-8" fill="none" style="stroke:var(--ink)" stroke-width="2.5" stroke-linecap="round"/>' +
      T(212, 128, 'el menos espera', { size: 14, col: 'var(--ink-2)' }) +
      '</svg>';
  }

  function svgParadas41() {
    const xs = [30, 86, 142, 198, 254, 310], ys = [70, 40, 70, 40, 70, 40];
    let s = cab('0 0 340 112', 'Camino del juego: 6 paradas hasta el jefe final');
    s += '<path d="M' + xs.map((x, i) => x + ' ' + ys[i]).join(' L') + '" fill="none" style="stroke:var(--ink-3)" stroke-width="3" stroke-dasharray="6 6" stroke-linecap="round"/>';
    xs.forEach((x, i) => {
      s += '<circle cx="' + x + '" cy="' + ys[i] + '" r="20" style="fill:' + (i === 5 ? 'var(--prize)' : 'var(--surface)') + ';stroke:var(--ink)" stroke-width="2.5"/>' +
        T(x, ys[i] + 6, String(i + 1), { size: 17, peso: 900, col: i === 5 ? 'var(--on-prize)' : 'var(--ink)' });
    });
    s += T(30, 106, 'empiezas', { size: 13, col: 'var(--ink-2)' }) + T(310, 76, 'jefe final', { size: 13, col: 'var(--ink-2)' });
    return s + '</svg>';
  }

  function cierreCap(n, resumen, viene) {
    return (c) => '<div class="lsb-cierre"><div class="sello">' + svg().sello('Capítulo ' + n + ' listo') + '</div>' +
      '<p>' + resumen + '</p>' +
      '<p><b>Lo que viene:</b> ' + viene + '</p>' +
      '<p class="caja-nota">Puedes parar aquí: tu avance quedó guardado.</p></div>';
  }

  // =====================================================================
  const LAMINAS = [];

  // ---------------- CAPÍTULO 3 ----------------
  function caso21(expr, dice, cuenta) {
    return '<div class="lsb-celda"><div class="lsb-celda-expr">' + fx(expr) + '</div>' +
      '<div class="lsb-celda-sig">' + dice + '</div><div class="lsb-celda-res">' + fx(cuenta) + '</div></div>';
  }
  LAMINAS.push({
    id: 'L21', num: 21, cap: 3, chip: 'SIGNOS PEGADOS', masAlFallar: true,
    entrada: 'Capítulo 3 de 4 · Signos pegados, multiplicar y dividir · unos 8 minutos',
    titulo: 'Signos pegados: dos signos se vuelven uno',
    html: () =>
      R('SIGNOS PEGADOS') +
      EJ({
        expr: '5 − (−2)',
        pasos: [
          { html: 'Entre el 5 y el 2 hay − y −, pegados. Solo los separa el paréntesis.' },
          { html: 'Son iguales: dan +. Queda ' + fx('5 + 2') + '. Te quitan una deuda de $2: ganas $2.', regla: 'SIGNOS PEGADOS' },
          { html: fx('5 + 2 = 7') }
        ],
        resultado: '5 − (−2) = 7'
      }) +
      '<div class="dibujo"><div class="lsb-grid2 lsb-casos" role="group" aria-label="Los 4 casos de signos pegados">' +
      caso21('5 + (+2)', 'iguales: dan +', '5 + 2 = 7') +
      caso21('5 + (−2)', 'distintos: dan −', '5 − 2 = 3') +
      caso21('5 − (+2)', 'distintos: dan −', '5 − 2 = 3') +
      caso21('5 − (−2)', 'iguales: dan +', '5 + 2 = 7') +
      '</div></div>' +
      '<p>Si el menos está solo delante, ' + fx('−(−7) = 7') + ': también son signos pegados.</p>',
    mas: () =>
      EJ({
        titulo: 'Otro ejemplo',
        expr: '4 + (−6)',
        pasos: [
          { html: 'Entre el 4 y el 6 hay + y −, pegados.' },
          { html: 'Son distintos: dan −. Queda ' + fx('4 − 6') + '. Te dan una deuda de $6.', regla: 'SIGNOS PEGADOS' },
          { html: 'Tienes 4 y debes 6: ' + fx('4 − 6 = −2') + '.' }
        ],
        resultado: '4 + (−6) = −2'
      }) +
      '<p>¿Por qué funciona? El signo de afuera es la acción: + es «te dan» y − es «te quitan». Lo de adentro es plata (+) o deuda (−).</p>',
    bloques: [
      pOpc('8 − (−3)', [
        opc(-11, 'Casi. Los dos menos están pegados: iguales dan +. Queda ' + fx('8 + 3 = 11') + '.'),
        opc(-5, 'Casi. Primero junta los signos pegados: iguales dan +. Queda ' + fx('8 + 3 = 11') + '.'),
        opc(5, 'Casi. No es ' + fx('8 − 3') + '. Los dos menos pegados dan +: ' + fx('8 + 3 = 11') + '.'),
        okc(11, '¡Bien! Te quitan una deuda de 3: ganas. ' + fx('8 + 3 = 11') + '.')
      ], { solucion: tres('− y − están pegados.', 'Iguales dan +: queda ' + fx('8 + 3') + '.', fx('8 + 3 = 11') + '.') })
    ]
  });

  LAMINAS.push({
    id: 'L22', num: 22, cap: 3, chip: 'SIGNOS PEGADOS',
    titulo: 'Practica: signos pegados',
    html: () => '<p>Usa los 3 pasos: mira los signos, júntalos en uno y calcula.</p>' + LS.ui.metodo(0),
    mas: () =>
      EJ({
        titulo: 'Otro ejemplo',
        expr: '−3 + (−5)',
        pasos: [
          { html: 'Entre el 3 y el 5 hay + y −, pegados.' },
          { html: 'Son distintos: dan −. Queda ' + fx('−3 − 5') + '.', regla: 'SIGNOS PEGADOS' },
          { html: 'Debes 3 y debes 5: las deudas se juntan. ' + fx('−3 − 5 = −8') + '.' }
        ],
        resultado: '−3 + (−5) = −8'
      }) +
      '<p>Después de juntar los signos pegados, ya es una suma o resta normal: usa la plata.</p>',
    bloques: [
      pTec('6 + (−9)', -3, E([
        [['15'], 'Casi. + y − pegados son distintos: dan −. Queda ' + fx('6 − 9') + ', no ' + fx('6 + 9') + '.'],
        [['3'], 'Casi. Tienes 6 y debes 9: debes más de lo que tienes. Queda ' + N(-3) + '.'],
        [['-15'], 'Casi. En ' + fx('6 − 9') + ' los signos son distintos: se cancelan. ' + t('9 − 6 = 3') + ', y gana la deuda: ' + N(-3) + '.']
      ]), {
        enunciado: 'A. ' + fx('6 + (−9) = ?'),
        solucion: tres('+ y − están pegados.', 'Distintos dan −: queda ' + fx('6 − 9') + '.', 'Tienes 6 y debes 9: ' + N(-3) + '.')
      }),
      pTec('−4 − (−10)', 6, E([
        [['-14'], 'Casi. Los dos menos del medio están pegados: iguales dan +. Queda ' + fx('−4 + 10') + '.'],
        [['-6'], 'Casi. Debes 4 y tienes 10: te sobran 6. Queda ' + N(6) + '.'],
        [['14'], 'Casi. En ' + fx('−4 + 10') + ' los signos son distintos: se cancelan. ' + t('10 − 4 = 6') + '.']
      ]), {
        enunciado: 'B. ' + fx('−4 − (−10) = ?'),
        solucion: tres('− y − están pegados.', 'Iguales dan +: queda ' + fx('−4 + 10') + '.', 'Debes 4 y tienes 10: ' + N(6) + '.')
      })
    ]
  });

  LAMINAS.push({
    id: 'L23', num: 23, cap: 3,
    titulo: 'Cómo se escribe multiplicar y dividir',
    html: () =>
      '<p>Todas estas formas son <b>multiplicar</b>:</p>' +
      '<p class="lsb-linea">' + fx('3 × 4 = 3 · 4 = 3(4) = (3)(4) = 12') + '</p>' +
      '<p>Un número pegado a un paréntesis, o dos paréntesis pegados, se multiplican. Dividir: ' + fx('12 ÷ 3 = 4') + '.</p>' +
      '<div class="dibujo lsb-dib-peq">' + svgLupa23() + '</div>',
    mas: () =>
      '<p>' + fx('2(−4)') + ' se lee «2 por menos 4». Es lo mismo que ' + fx('2 · (−4)') + '.</p>' +
      '<p>Un negativo después de ·, ÷, + o − va entre paréntesis: se escribe ' + fx('5 · (−3)') + ', no <span class="tachado">5 · −3</span>.</p>',
    bloques: [{
      tipo: 'opciones',
      enunciado: '¿Qué significa ' + fx('2(−4)') + '?',
      columnas: 2,
      opciones: [
        { t: fx('2 − 4'), fb: 'Casi. El 2 está pegado al paréntesis: eso es multiplicar.' },
        { t: fx('2 + 4'), fb: 'Casi. Número pegado a un paréntesis es multiplicar: ' + fx('2 · (−4)') + '.' },
        { t: fx('24'), fb: 'Casi. Las cifras no se juntan. Número pegado a un paréntesis es multiplicar.' },
        { t: fx('2 · (−4)'), ok: true, fb: '¡Eso! Número pegado a un paréntesis es multiplicar.' }
      ],
      solucion: 'Número pegado a un paréntesis es multiplicar: ' + fx('2(−4) = 2 · (−4)') + '.'
    }]
  });

  LAMINAS.push({
    id: 'L24', num: 24, cap: 3,
    titulo: 'Positivo por negativo',
    html: () =>
      '<p>Multiplicar es sumar varias veces lo mismo. Con deudas también funciona:</p>' +
      EJ({
        expr: '3 · (−2)',
        pasos: [
          { html: 'Un positivo (3) por un negativo (' + N(-2) + ').' },
          { t: 'Piensa en plata', html: 'Son 3 deudas de $2.<div class="dibujo lsb-dib-peq">' + svgGrupos24() + '</div>' },
          { html: 'Debes ' + t('2 + 2 + 2 = 6') + ': el resultado es ' + N(-6) + '.' }
        ],
        resultado: '3 · (−2) = −6'
      }) +
      '<p><b>Positivo por negativo da negativo.</b> El orden no importa: ' + fx('(−2) · 3 = −6') + '.</p>',
    mas: () =>
      EJ({
        titulo: 'Otro ejemplo',
        expr: '2 · (−5)',
        pasos: [
          { html: 'Un positivo (2) por un negativo (' + N(-5) + ').' },
          { t: 'Piensa en plata', html: 'Son 2 deudas de $5: ' + fx('(−5) + (−5)') + '.' },
          { html: 'Debes ' + t('5 + 5 = 10') + ': ' + N(-10) + '.' }
        ],
        resultado: '2 · (−5) = −10'
      }) +
      '<p>Para negativo por negativo la plata ya no alcanza. Lo verás en la siguiente lámina con un patrón.</p>',
    bloques: [
      pTec('4 · (−5)', -20, E([
        [['20'], 'Casi. El tamaño está bien, pero son 4 deudas de $5: debes 20. Queda ' + N(-20) + '.'],
        [['-1', '1', '-9', '9'], 'Casi. ' + fx('4 · (−5)') + ' es multiplicar, no sumar ni restar: 4 deudas de $5 son ' + N(-20) + '.']
      ]), { solucion: '4 deudas de $5: debes ' + t('4 · 5 = 20') + '. Queda ' + N(-20) + '.' })
    ]
  });

  const E25 = E([
    [['-2'], 'Casi. Mira: ' + N(-6) + ', ' + N(-4) + ', ' + N(-2) + ', ' + N(0) + '… sube de 2 en 2. Después del 0 viene ' + N(2) + '.'],
    [['0'], 'Casi. El 0 ya salió en la fila de arriba. Súmale 2: da ' + N(2) + '.']
  ]);
  LAMINAS.push({
    id: 'L25', num: 25, cap: 3, masAlFallar: true,
    titulo: 'Negativo por negativo: mira el patrón',
    html: () =>
      '<p>Aquí la plata ya no sirve. Mira cómo cambian los resultados:</p>' +
      '<div class="lsb-patron"><div class="lsb-filas">' +
      '<div class="lsb-fila">' + fx('3 · (−2) = −6') + '</div>' +
      '<div class="lsb-fila lsb-oc" data-toque="1">' + fx('2 · (−2) = −4') + '</div>' +
      '<div class="lsb-fila lsb-oc" data-toque="2">' + fx('1 · (−2) = −2') + '</div>' +
      '<div class="lsb-fila lsb-oc" data-toque="3">' + fx('0 · (−2) = 0') + '</div>' +
      '<div class="lsb-fila lsb-oc" data-toque="4">' + fx('(−1) · (−2) =') + ' <span class="lsb-solo-lam lsb-preg" data-preg>?</span><span class="lsb-oc" data-final>' + N(2) + '</span></div>' +
      '<div class="lsb-fila lsb-oc" data-final>' + fx('(−2) · (−2) = 4') + '</div>' +
      '</div><div class="dibujo lsb-patron-svg">' + svgPatron25() + '</div></div>' +
      '<p class="lsb-oc" data-toque="4"><b>Cada vez el resultado sube 2.</b></p>' +
      '<p class="lsb-frase lsb-oc" data-final>Negativo por negativo da POSITIVO.</p>' +
      '<p class="lsb-oc" data-final>Fíjate: hay 2 negativos, y 2 es par. Por eso da positivo.</p>',
    mas: () =>
      '<p><b>Otro patrón</b>, ahora con ' + N(-3) + ':</p>' +
      '<p class="lsb-lista-fx">' + ['2 · (−3) = −6', '1 · (−3) = −3', '0 · (−3) = 0', '(−1) · (−3) = 3'].map(s => fx(s)).join('<br>') + '</p>' +
      '<p>El primer número baja de 1 en 1 y el resultado sube de 3 en 3. Después del 0 tiene que venir ' + N(3) + ': un positivo.</p>',
    bloques: [{
      tipo: 'custom',
      verif: [{ fuente: '(−1) · (−2)', correcta: 2, errores: E25 }],
      render(el, api) {
        const body = el.closest('.lam-body') || document;
        const mostrar = (sel) => body.querySelectorAll(sel).forEach(x => x.classList.remove('lsb-oc'));
        const final = () => { mostrar('[data-final]'); body.querySelectorAll('[data-preg]').forEach(x => x.remove()); };
        if (yaHecho(api.ctx, 'L25', 25)) {
          for (let i = 1; i <= 4; i++) mostrar('[data-toque="' + i + '"]');
          final(); api.completar(true); return;
        }
        let k = 0;
        el.innerHTML = '<button class="btn btn-sec btn-ancho" data-noswipe>Ver la siguiente fila</button><div class="lsb-zona"></div>';
        const bt = el.querySelector('button');
        bt.addEventListener('click', () => {
          k++; mostrar('[data-toque="' + k + '"]');
          if (k >= 4) {
            bt.remove();
            tecladoLocal(el.querySelector('.lsb-zona'), {
              enunciado: fx('(−1) · (−2) = ?'), correcta: 2, errores: E25,
              okFb: '¡Eso! Después del 0 viene ' + N(2) + '. Mira la última fila.',
              solucion: 'El resultado sube de 2 en 2: ' + N(-2) + ', ' + N(0) + ', ' + N(2) + '.'
            }, api, (ok1) => { final(); api.completar(ok1); });
          }
        });
      }
    }]
  });

  LAMINAS.push({
    id: 'L26', num: 26, cap: 3, chip: 'CUENTA LOS NEGATIVOS', masAlFallar: true,
    titulo: 'Multiplicar y dividir: CUENTA LOS NEGATIVOS',
    html: () =>
      R('CUENTA LOS NEGATIVOS') +
      EJ({
        expr: '(−3) · (−4)',
        pasos: [
          { html: 'Hay 2 negativos: ' + N(-3) + ' y ' + N(-4) + '.' },
          { html: '2 es par: el resultado es positivo.', regla: 'CUENTA LOS NEGATIVOS' },
          { html: 'Multiplica los tamaños: ' + t('3 · 4 = 12') + '.' }
        ],
        resultado: '(−3) · (−4) = 12'
      }) +
      '<div class="dibujo lsb-cuenta">' + svg().cuentaNegativos(2) + '</div>' +
      '<p>Para dividir se hace igual: ' + fx('(−20) ÷ 4 = −5') + ', porque hay 1 negativo.</p>',
    mas: () =>
      EJ({
        titulo: 'Otro ejemplo',
        expr: '(−18) ÷ (−6)',
        pasos: [
          { html: 'Hay 2 negativos: ' + N(-18) + ' y ' + N(-6) + '.' },
          { html: '2 es par: el resultado es positivo.', regla: 'CUENTA LOS NEGATIVOS' },
          { html: 'Divide los tamaños: ' + t('18 ÷ 6 = 3') + '.' }
        ],
        resultado: '(−18) ÷ (−6) = 3'
      }) +
      '<p>¿Por qué funciona? Cada pareja de negativos da positivo, como viste en el patrón. Si sobra un negativo sin pareja, el resultado queda negativo.</p>',
    bloques: [
      pOpc('(−6) ÷ (−2)', [
        opc(-12, 'Casi. Aquí se <b>divide</b>, no se multiplica: ' + t('6 ÷ 2 = 3') + '. Hay 2 negativos, par: positivo.'),
        opc(-3, 'Casi. Hay 2 negativos, y 2 es par: el resultado es positivo.'),
        okc(3, '¡Bien! 2 negativos, par: positivo. Y ' + t('6 ÷ 2 = 3') + '.'),
        opc(12, 'Casi. Aquí se <b>divide</b>, no se multiplica: ' + t('6 ÷ 2 = 3') + '.')
      ], { solucion: tres('Hay 2 negativos.', '2 es par: positivo.', t('6 ÷ 2 = 3') + '. Queda ' + N(3) + '.') })
    ]
  });

  LAMINAS.push({
    id: 'L26b', num: 26.5, cap: 3, chip: 'CUENTA LOS NEGATIVOS',
    titulo: 'Con 3 factores y con el cero',
    html: () =>
      '<p>La regla sirve con cualquier cantidad de números:</p>' +
      EJ({
        expr: '(−2)(−3)(−1)',
        pasos: [
          { html: 'Hay 3 negativos: ' + N(-2) + ', ' + N(-3) + ' y ' + N(-1) + '.' },
          { html: '3 es impar: el resultado es negativo.', regla: 'CUENTA LOS NEGATIVOS' },
          { html: 'Multiplica los tamaños: ' + t('2 · 3 · 1 = 6') + '.' }
        ],
        resultado: '(−2)(−3)(−1) = −6'
      }) +
      '<p><b>El 0 no tiene signo.</b> Si multiplicas por 0, da 0: ' + fx('0 · (−3) = 0') + '.</p>' +
      OJO('No se divide entre ' + N(0) + '. Esa cuenta no tiene respuesta.'),
    mas: () =>
      EJ({
        titulo: 'Otro ejemplo',
        expr: '(−1)(−2)(−3)(−1)',
        pasos: [
          { html: 'Hay 4 negativos.' },
          { html: '4 es par: el resultado es positivo.', regla: 'CUENTA LOS NEGATIVOS' },
          { html: 'Multiplica los tamaños: ' + t('1 · 2 · 3 · 1 = 6') + '.' }
        ],
        resultado: '(−1)(−2)(−3)(−1) = 6'
      }) +
      '<p>Los negativos se emparejan de 2 en 2 y cada pareja da positivo. Con 4 no sobra ninguno.</p>',
    bloques: [
      pOpc('(−2)(−5)(−1)', [
        okc(-10, '¡Bien! 3 negativos, impar: negativo. Y ' + t('2 · 5 · 1 = 10') + '.'),
        opc(-8, 'Casi. Paréntesis pegados es multiplicar, no sumar: ' + t('2 · 5 · 1 = 10') + '. Hay 3 negativos, impar: negativo.'),
        opc(8, 'Casi. Paréntesis pegados es multiplicar, no sumar: ' + t('2 · 5 · 1 = 10') + '.'),
        opc(10, 'Casi. Cuenta los negativos: hay 3, y 3 es impar. El resultado es negativo.')
      ], { solucion: tres('Hay 3 negativos.', '3 es impar: negativo.', t('2 · 5 · 1 = 10') + '. Queda ' + N(-10) + '.') })
    ]
  });

  LAMINAS.push({
    id: 'L27', num: 27, cap: 3, chip: 'CUENTA LOS NEGATIVOS',
    titulo: 'Practica: multiplicar y dividir',
    html: () => '<p>En cada una: cuenta los negativos, decide el signo y luego opera los tamaños.</p>' + LS.ui.metodo(0),
    mas: () =>
      EJ({
        titulo: 'Otro ejemplo',
        expr: '(−9) · 3',
        pasos: [
          { html: 'Hay 1 negativo: ' + N(-9) + '.' },
          { html: '1 es impar: el resultado es negativo.', regla: 'CUENTA LOS NEGATIVOS' },
          { html: 'Multiplica los tamaños: ' + t('9 · 3 = 27') + '.' }
        ],
        resultado: '(−9) · 3 = −27'
      }) +
      '<p>El signo y el tamaño se deciden por separado. Así no se te mezclan.</p>',
    bloques: [
      pTec('(−7)(−6)', 42, E([
        [['-42'], 'Casi. Hay 2 negativos, y 2 es par: el resultado es positivo.'],
        [['-13', '13', '-1', '1'], 'Casi. Paréntesis pegados es multiplicar, no sumar ni restar: ' + t('7 · 6 = 42') + '.']
      ]), {
        enunciado: 'A. ' + fx('(−7)(−6) = ?'),
        solucion: tres('Hay 2 negativos.', '2 es par: positivo.', t('7 · 6 = 42') + '. Queda ' + N(42) + '.')
      }),
      pTec('(−24) ÷ 6', -4, E([
        [['4'], 'Casi. Hay 1 negativo, y 1 es impar: el resultado es negativo. Queda ' + N(-4) + '.'],
        [['-144', '-30', '-18'], 'Casi. Aquí se divide: ' + t('24 ÷ 6 = 4') + '. Con 1 negativo, impar: ' + N(-4) + '.']
      ]), {
        enunciado: 'B. ' + fx('(−24) ÷ 6 = ?'),
        solucion: tres('Hay 1 negativo.', '1 es impar: negativo.', t('24 ÷ 6 = 4') + '. Queda ' + N(-4) + '.')
      })
    ]
  });

  function col28(lupa, etq, expr, res, por) {
    return '<div class="lsb-col"><div class="lsb-lupa">' + lupa + '</div><div class="lsb-etq">' + etq + '</div>' +
      '<div class="lsb-col-expr">' + fx(expr) + '</div><div class="lsb-col-res">= ' + N(res) + '</div>' +
      '<div class="lsb-col-por">' + por + '</div></div>';
  }
  LAMINAS.push({
    id: 'L28', num: 28, cap: 3,
    titulo: 'LA TRAMPA',
    html: () =>
      '<p>Se parecen, pero <b>no</b> son iguales. Mira qué hay entre los signos:</p>' +
      '<div class="dibujo"><div class="lsb-trampa">' +
      col28(lupa28('<text x="44" y="50" text-anchor="middle" font-size="26" font-weight="900"><tspan style="fill:var(--neg-text)">−5</tspan><tspan style="fill:var(--ink)"> −</tspan></text>', 'Entre los dos menos está el 5'),
        'no se tocan', '−5 − 9', -14, 'hay un 5 en medio: dos deudas, se juntan') +
      col28(lupa28('<text x="44" y="50" text-anchor="middle" font-size="26" font-weight="900"><tspan style="fill:var(--ink)">−(</tspan><tspan style="fill:var(--neg-text)">−</tspan></text>', 'El menos toca al paréntesis'),
        'se tocan', '−5 − (−9)', 4, 'signos pegados: queda ' + fx('−5 + 9')) +
      col28(lupa28('<text x="44" y="52" text-anchor="middle" font-size="32" font-weight="900" style="fill:var(--ink)">)(</text>', 'Dos paréntesis pegados'),
        'multiplicar', '(−5)(−9)', 45, '2 negativos, par: positivo') +
      '</div></div>' +
      OJO('Quizá has oído <b>«menos por menos da más»</b>. Solo vale para ·, ÷ y signos pegados. En ' + fx('−5 − 9') + ' no sirve.'),
    mas: () =>
      EJ({
        titulo: 'Otro ejemplo',
        expr: '−3 − 7',
        pasos: [
          { html: 'Entre los dos menos está el 3: no se tocan. Los números son ' + N(-3) + ' y ' + N(-7) + '.' },
          { html: 'No hay · ni ÷. Son dos deudas, con el mismo signo.', regla: 'SE JUNTAN' },
          { html: t('3 + 7 = 10') + ', con signo −.' }
        ],
        resultado: '−3 − 7 = −10'
      }) +
      '<p>En cambio, en ' + fx('(−3)(−7) = 21') + ' sí se multiplica: los paréntesis están pegados.</p>',
    bloques: [
      pOpc('−4 − 6', [
        opc(-24, 'Casi. Aquí no se multiplica: hay un 4 entre los signos. Debes 4 y debes 6: ' + N(-10) + '.'),
        okc(-10, '¡Bien! Hay un 4 entre los signos: debes 4 y debes 6. Queda ' + N(-10) + '.'),
        opc(10, 'Casi. Aquí no se multiplica: hay un 4 entre los signos. Son dos deudas: ' + N(-10) + '.'),
        opc(24, 'Casi. No hay · ni paréntesis pegados. Son dos deudas: se juntan en ' + N(-10) + '.')
      ], { enunciado: '1. ' + fx('−4 − 6 = ?'), solucion: tres('Hay un 4 entre los signos: no se tocan.', 'Dos deudas: se juntan.', t('4 + 6 = 10') + ', con signo −: ' + N(-10) + '.') }),
      pOpc('(−4)(−6)', [
        opc(-24, 'Casi. Hay 2 negativos, y 2 es par: el resultado es positivo.'),
        opc(-10, 'Casi. Paréntesis pegados es multiplicar, no sumar: ' + t('4 · 6 = 24') + '.'),
        opc(10, 'Casi. Paréntesis pegados es multiplicar, no sumar: ' + t('4 · 6 = 24') + '.'),
        okc(24, '¡Bien! Es multiplicar: 2 negativos, par, da positivo. Esa diferencia te da puntos en el examen.')
      ], { enunciado: '2. ' + fx('(−4)(−6) = ?'), solucion: tres('Paréntesis pegados: es multiplicar.', 'Hay 2 negativos, par: positivo.', t('4 · 6 = 24') + '.') })
    ]
  });

  LAMINAS.push({
    id: 'L29', num: 29, cap: 3,
    titulo: '¿Qué regla uso?',
    html: () =>
      '<p>Antes de calcular, hazte estas 3 preguntas en orden:</p>' +
      '<ol class="lsb-arbol">' +
      '<li><span>¿Hay <b>·, ÷ o paréntesis pegados</b>?</span><span class="lsb-arbol-r">Usa ' + chip('CUENTA LOS NEGATIVOS') + '</span></li>' +
      '<li><span>¿Hay <b>dos signos pegados</b>, como ' + fx('8 − (−2)') + '?</span><span class="lsb-arbol-r">Usa ' + chip('SIGNOS PEGADOS') + '</span></li>' +
      '<li><span>¿Solo hay + y − entre números sueltos?</span><span class="lsb-arbol-r">Usa ' + chip('PLATA') + ' se juntan o se cancelan.</span></li>' +
      '</ol>',
    mas: () =>
      EJ({
        titulo: 'Otro ejemplo',
        expr: '−9 − (−3)',
        pasos: [
          { html: 'No hay · ni ÷. El − toca un paréntesis que empieza con −.' },
          { html: 'Son signos pegados, iguales: dan +. Queda ' + fx('−9 + 3') + '.', regla: 'SIGNOS PEGADOS' },
          { html: 'Debes 9 y tienes 3: ' + fx('−9 + 3 = −6') + '.' }
        ],
        resultado: '−9 − (−3) = −6'
      }) +
      '<p>Mira siempre qué hay <b>entre</b> los números. Eso te dice qué regla toca.</p>',
    bloques: [{
      tipo: 'clasificar',
      enunciado: '¿Qué regla toca? Elige un botón en cada tarjeta.',
      botones: ['PLATA', 'SIGNOS PEGADOS', 'CUENTA LOS NEGATIVOS'],
      tarjetas: [
        { html: fx('−8 − 2'), correcta: 'PLATA', fuente: '−8 − 2', valor: -10,
          fb: 'Casi. Entre los dos menos está el 8: no se tocan, y no hay ·. Es PLATA: ' + fx('−8 − 2 = −10') + '.',
          okFb: '¡Eso! Dos deudas se juntan: ' + fx('−8 − 2 = −10') + '.' },
        { html: fx('(−8)(−2)'), correcta: 'CUENTA LOS NEGATIVOS', fuente: '(−8)(−2)', valor: 16,
          fb: 'Casi. Paréntesis pegados es multiplicar. Cuenta los negativos: ' + fx('(−8)(−2) = 16') + '.',
          okFb: '¡Eso! 2 negativos, par: ' + fx('(−8)(−2) = 16') + '.' },
        { html: fx('−8 − (−2)'), correcta: 'SIGNOS PEGADOS', fuente: '−8 − (−2)', valor: -6,
          fb: 'Casi. El − toca un paréntesis que empieza con −: son signos pegados. Queda ' + fx('−8 + 2 = −6') + '.',
          okFb: '¡Eso! Iguales dan +: ' + fx('−8 + 2 = −6') + '.' },
        { html: fx('−8 ÷ (−2)'), correcta: 'CUENTA LOS NEGATIVOS', fuente: '−8 ÷ (−2)', valor: 4,
          fb: 'Casi. Hay ÷: cuenta los negativos. ' + fx('−8 ÷ (−2) = 4') + '.',
          okFb: '¡Eso! 2 negativos, par: ' + fx('−8 ÷ (−2) = 4') + '.' }
      ]
    }]
  });

  LAMINAS.push({
    id: 'L29c', num: 29.2, cap: 3,
    titulo: 'Minichequeo 3',
    html: '<p>Tres preguntas para cerrar el capítulo. Antes de calcular, pregúntate qué regla toca.</p>',
    bloques: [{
      tipo: 'chequeo',
      repaso: [28, 26],
      salida: '¡Minichequeo 3 superado! Ya sabes elegir la regla antes de calcular.',
      preguntas: [
        pOpc('9 − (−4)', [
          opc(-13, 'Casi. Los dos menos están pegados: iguales dan +. Queda ' + fx('9 + 4 = 13') + '.'),
          opc(-5, 'Casi. Primero junta los signos pegados: iguales dan +. Queda ' + fx('9 + 4 = 13') + '.'),
          opc(5, 'Casi. No es ' + fx('9 − 4') + '. Los dos menos pegados dan +: ' + fx('9 + 4 = 13') + '.'),
          okc(13)
        ], { enunciado: '1. ' + fx('9 − (−4) = ?'), solucion: tres('− y − pegados.', 'Iguales dan +.', fx('9 + 4 = 13') + '.') }),
        pOpc('(−36) ÷ (−4)', [
          opc(-40, 'Casi. Aquí se <b>divide</b>: ' + t('36 ÷ 4 = 9') + '. Hay 2 negativos, par: positivo.'),
          opc(-32, 'Casi. Aquí se <b>divide</b>: ' + t('36 ÷ 4 = 9') + '. Hay 2 negativos, par: positivo.'),
          opc(-9, 'Casi. Hay 2 negativos, y 2 es par: el resultado es positivo.'),
          okc(9)
        ], { enunciado: '2. ' + fx('(−36) ÷ (−4) = ?'), solucion: tres('Hay 2 negativos.', '2 es par: positivo.', t('36 ÷ 4 = 9') + '.') }),
        pTec('−7 − 3', -10, E([
          [['10'], 'Casi. ¡Es la trampa! Hay un 7 entre los signos: no se multiplica. Debes 7 y debes 3: ' + N(-10) + '.'],
          [['21', '-21'], 'Casi. No hay · ni paréntesis pegados. Son dos deudas: se juntan en ' + N(-10) + '.'],
          [['4', '-4'], 'Casi. Las dos son deudas, con el mismo signo: se juntan. ' + t('7 + 3 = 10') + ', queda ' + N(-10) + '.']
        ]), { enunciado: '3. ' + fx('−7 − 3 = ?'), solucion: 'Debes 7 y debes 3: se juntan. Queda ' + N(-10) + '.' })
      ],
      segundo: [
        pOpc('7 − (−5)', [
          opc(-12, 'Casi. Los dos menos están pegados: iguales dan +. Queda ' + fx('7 + 5 = 12') + '.'),
          opc(-2, 'Casi. Primero junta los signos pegados: iguales dan +. Queda ' + fx('7 + 5 = 12') + '.'),
          opc(2, 'Casi. No es ' + fx('7 − 5') + '. Los dos menos pegados dan +: ' + fx('7 + 5 = 12') + '.'),
          okc(12)
        ], { enunciado: '1. ' + fx('7 − (−5) = ?'), solucion: tres('− y − pegados.', 'Iguales dan +.', fx('7 + 5 = 12') + '.') }),
        pOpc('(−28) ÷ (−4)', [
          opc(-32, 'Casi. Aquí se <b>divide</b>: ' + t('28 ÷ 4 = 7') + '. Hay 2 negativos, par: positivo.'),
          opc(-24, 'Casi. Aquí se <b>divide</b>: ' + t('28 ÷ 4 = 7') + '. Hay 2 negativos, par: positivo.'),
          opc(-7, 'Casi. Hay 2 negativos, y 2 es par: el resultado es positivo.'),
          okc(7)
        ], { enunciado: '2. ' + fx('(−28) ÷ (−4) = ?'), solucion: tres('Hay 2 negativos.', '2 es par: positivo.', t('28 ÷ 4 = 7') + '.') }),
        pTec('−6 − 5', -11, E([
          [['11'], 'Casi. ¡Es la trampa! Hay un 6 entre los signos: no se multiplica. Debes 6 y debes 5: ' + N(-11) + '.'],
          [['30', '-30'], 'Casi. No hay · ni paréntesis pegados. Son dos deudas: se juntan en ' + N(-11) + '.'],
          [['1', '-1'], 'Casi. Las dos son deudas, con el mismo signo: se juntan. ' + t('6 + 5 = 11') + ', queda ' + N(-11) + '.']
        ]), { enunciado: '3. ' + fx('−6 − 5 = ?'), solucion: 'Debes 6 y debes 5: se juntan. Queda ' + N(-11) + '.' })
      ]
    }]
  });

  LAMINAS.push({
    id: 'L29b', num: 29.5, cap: 3,
    titulo: (c) => '¡Capítulo 3 listo, ' + c.nombre + '!',
    html: cierreCap(3,
      'Ya sabes juntar signos pegados, contar los negativos para multiplicar y dividir, y no caer en la trampa.',
      'el último capítulo: potencias y operaciones combinadas.')
  });

  // ---------------- CAPÍTULO 4 ----------------
  LAMINAS.push({
    id: 'L30', num: 30, cap: 4,
    entrada: 'Capítulo 4 de 4 · Potencias y operaciones combinadas · unos 8 minutos',
    titulo: '¿Qué es una potencia?',
    html: () =>
      REGLA('El exponente (el numerito de arriba) dice cuántas veces se multiplica la base.') +
      '<div class="dibujo lsb-dib-peq">' + svgPotencia30() + '</div>' +
      EJ({
        expr: '2³',
        pasos: [
          { t: 'Mira la base y el exponente', html: 'La base es 2. El exponente es 3: el 2 va 3 veces.' },
          { t: 'Escribe la multiplicación', html: fx('2 · 2 · 2') },
          { html: fx('2 · 2 = 4') + ', luego ' + fx('4 · 2 = 8') + '.' }
        ],
        resultado: '2³ = 8'
      }) +
      OJO(fx('2³') + ' no es ' + fx('2 · 3') + ': ' + mal('2³ = 6')),
    mas: () =>
      EJ({
        titulo: 'Otro ejemplo',
        expr: '5²',
        pasos: [
          { t: 'Mira la base y el exponente', html: 'La base es 5. El exponente es 2: el 5 va 2 veces.' },
          { t: 'Escribe la multiplicación', html: fx('5 · 5') },
          { html: fx('5 · 5 = 25') + '.' }
        ],
        resultado: '5² = 25'
      }) +
      '<p>' + fx('5²') + ' se lee «cinco al cuadrado» y ' + fx('2³') + ' se lee «dos al cubo».</p>',
    bloques: [
      pOpc('3²', [
        opc(5, 'Casi. No se suma: ' + fx('3² = 3 · 3 = 9') + '.'),
        opc(6, 'Casi. ' + fx('3²') + ' no es ' + fx('3 · 2') + '. Es ' + fx('3 · 3 = 9') + '.'),
        okc(9, '¡Bien! ' + fx('3² = 3 · 3 = 9') + '.'),
        opc(32, 'Casi. El numerito dice cuántas veces multiplicas: ' + fx('3 · 3 = 9') + '.')
      ], { solucion: fx('3² = 3 · 3 = 9') + '.' })
    ]
  });

  LAMINAS.push({
    id: 'L31', num: 31, cap: 4, chip: 'POTENCIA', masAlFallar: true,
    titulo: 'Potencias de números negativos',
    html: () =>
      REGLA('Si la base negativa está entre paréntesis, el menos entra: exponente par da positivo; exponente impar da negativo.') +
      EJ({
        expr: '(−2)³',
        pasos: [
          { html: 'El menos está dentro del paréntesis: entra. ' + fx('(−2)³ = (−2)(−2)(−2)') },
          { html: 'Hay 3 negativos, impar: el resultado es negativo.', regla: 'CUENTA LOS NEGATIVOS' },
          { html: 'Multiplica los tamaños: ' + t('2 · 2 · 2 = 8') + '.' }
        ],
        resultado: '(−2)³ = −8'
      }) +
      '<table class="lsb-tabla-pot" aria-label="Potencias de menos 2">' +
      '<tr><td>' + fx('(−2)¹ = −2') + '</td><td>' + fx('(−2)² = 4') + '</td></tr>' +
      '<tr><td>' + fx('(−2)³ = −8') + '</td><td>' + fx('(−2)⁴ = 16') + '</td></tr></table>',
    mas: () =>
      EJ({
        titulo: 'Otro ejemplo',
        expr: '(−3)²',
        pasos: [
          { html: 'El menos está dentro del paréntesis: ' + fx('(−3)² = (−3)(−3)') },
          { html: 'Hay 2 negativos, par: el resultado es positivo.', regla: 'CUENTA LOS NEGATIVOS' },
          { html: 'Multiplica los tamaños: ' + t('3 · 3 = 9') + '.' }
        ],
        resultado: '(−3)² = 9'
      }) +
      '<p>¿Por qué funciona? El exponente dice cuántos negativos se multiplican. Por eso basta con ver si es par o impar.</p>',
    bloques: [
      pOpc('(−1)⁵', [
        opc(-5, 'Casi. No es ' + fx('(−1) · 5') + '. Es ' + fx('(−1)') + ' 5 veces: ' + fx('(−1)(−1)(−1)(−1)(−1) = −1') + '.'),
        okc(-1, '¡Bien! 5 negativos, impar: negativo. Y ' + t('1 · 1 · 1 · 1 · 1 = 1') + '.'),
        opc(1, 'Casi. El exponente 5 es impar: hay 5 negativos. El resultado es negativo.'),
        opc(5, 'Casi. No es ' + fx('(−1) · 5') + '. Es ' + fx('(−1)') + ' 5 veces: ' + fx('(−1)(−1)(−1)(−1)(−1) = −1') + '.')
      ], { solucion: tres('El menos está dentro: entra.', 'Hay 5 negativos, impar: negativo.', t('1 · 1 · 1 · 1 · 1 = 1') + '. Queda ' + N(-1) + '.') })
    ]
  });

  LAMINAS.push({
    id: 'L32', num: 32, cap: 4, chip: 'POTENCIA', masAlFallar: true,
    titulo: '¿Con paréntesis o sin paréntesis?',
    html: () =>
      R('POTENCIA') +
      '<div class="dibujo lsb-dib-peq">' + svgAlcance32() + '</div>' +
      EJ({
        expr: '−3²',
        pasos: [
          { html: 'No hay paréntesis. El ² solo toca al 3; el menos espera afuera.' },
          { html: 'Primero la potencia: ' + fx('3² = 3 · 3 = 9') + '.', regla: 'POTENCIA' },
          { html: 'Después, el menos de afuera lo vuelve negativo: ' + N(-9) + '.' }
        ],
        resultado: '−3² = −9'
      }) +
      '<p>Con paréntesis es distinto: ' + fx('(−3)² = (−3)(−3) = 9') + '.</p>',
    mas: () =>
      EJ({
        titulo: 'Otro ejemplo',
        expr: '−5²',
        pasos: [
          { html: 'No hay paréntesis. El ² solo toca al 5.' },
          { html: 'Primero la potencia: ' + fx('5² = 5 · 5 = 25') + '.', regla: 'POTENCIA' },
          { html: 'Después, el menos de afuera lo vuelve negativo: ' + N(-25) + '.' }
        ],
        resultado: '−5² = −25'
      }) +
      '<p>El exponente solo alcanza lo que tiene pegado. En ' + fx('−5²') + ' lo pegado es el 5; en ' + fx('(−5)²') + ' es todo el paréntesis.</p>',
    bloques: [
      pOpc('−4²', [
        okc(-16, '¡Bien! El ² solo toca al 4: ' + t('4 · 4 = 16') + '. El menos de afuera lo vuelve ' + N(-16) + '.'),
        opc(-8, 'Casi. ' + fx('4²') + ' no es ' + fx('4 · 2') + '. Es ' + fx('4 · 4 = 16') + ', y con el menos de afuera: ' + N(-16) + '.'),
        opc(8, 'Casi. ' + fx('4²') + ' no es ' + fx('4 · 2') + '. Es ' + fx('4 · 4 = 16') + ', y con el menos de afuera: ' + N(-16) + '.'),
        opc(16, 'Casi. Sin paréntesis, el menos espera afuera. ' + t('4 · 4 = 16') + ', y el menos lo vuelve ' + N(-16) + '.')
      ], { solucion: tres('No hay paréntesis: el ² solo toca al 4.', 'Primero ' + fx('4² = 16') + '.', 'El menos de afuera lo vuelve ' + N(-16) + '.') })
    ]
  });

  LAMINAS.push({
    id: 'L33', num: 33, cap: 4, chip: 'POTENCIA',
    titulo: 'Practica potencias',
    html: '<p>Primero mira si el menos está <b>dentro</b> del paréntesis o <b>afuera</b>. Luego multiplica la base las veces que diga el exponente.</p>',
    mas: () =>
      EJ({
        titulo: 'Otro ejemplo',
        expr: '(−2)⁴',
        pasos: [
          { html: 'El menos está dentro del paréntesis: entra. ' + fx('(−2)(−2)(−2)(−2)') },
          { html: 'Hay 4 negativos, par: positivo.', regla: 'CUENTA LOS NEGATIVOS' },
          { html: t('2 · 2 · 2 · 2 = 16') + '.' }
        ],
        resultado: '(−2)⁴ = 16'
      }) +
      '<p>Sin paréntesis cambia: ' + fx('−2⁴ = −16') + ', porque el menos espera afuera.</p>',
    bloques: [
      pTec('(−5)²', 25, E([
        [['-25'], 'Casi. Con paréntesis, el menos entra: ' + fx('(−5)(−5)') + '. 2 negativos, par: ' + N(25) + '.'],
        [['10', '-10'], 'Casi. ² no es «por 2»: ' + fx('(−5)(−5) = 25') + '.']
      ]), { enunciado: 'A. ' + fx('(−5)² = ?'), solucion: tres('El menos está dentro: entra.', fx('(−5)(−5)') + ': 2 negativos, par.', t('5 · 5 = 25') + '. Queda ' + N(25) + '.') }),
      pTec('−2⁴', -16, E([
        [['16'], 'Casi. Sin paréntesis, el ⁴ solo toca al 2: ' + t('2 · 2 · 2 · 2 = 16') + '. El menos de afuera lo vuelve ' + N(-16) + '.'],
        [['-8', '8'], 'Casi. ⁴ significa 4 veces: ' + t('2 · 2 · 2 · 2 = 16') + '. Luego el menos: ' + N(-16) + '.']
      ]), { enunciado: 'B. ' + fx('−2⁴ = ?'), solucion: tres('No hay paréntesis: el menos espera afuera.', 'Primero ' + fx('2⁴ = 16') + '.', 'El menos lo vuelve ' + N(-16) + '.') })
    ]
  });

  LAMINAS.push({
    id: 'L33b', num: 33.5, cap: 4, chip: 'POTENCIA',
    titulo: 'Más potencias',
    html: '<p>Ahora con exponente impar y con un menos delante del paréntesis.</p>',
    mas: () =>
      EJ({
        titulo: 'Otro ejemplo',
        expr: '−(−2)²',
        pasos: [
          { html: 'El ² toca al paréntesis. El menos de afuera espera.' },
          { html: 'Primero la potencia: ' + fx('(−2)² = 4') + '.', regla: 'POTENCIA' },
          { html: 'Después, el menos de afuera lo vuelve negativo: ' + N(-4) + '.' }
        ],
        resultado: '−(−2)² = −4'
      }) +
      '<p>El menos de afuera siempre espera a que termine la potencia.</p>',
    bloques: [
      pTec('(−3)³', -27, E([
        [['27'], 'Casi. Hay 3 negativos, y 3 es impar: el resultado es negativo.'],
        [['-9', '9'], 'Casi. No es ' + fx('(−3) · 3') + '. Es ' + fx('(−3)(−3)(−3) = −27') + '.']
      ]), { enunciado: 'C. ' + fx('(−3)³ = ?'), solucion: tres('El menos está dentro: ' + fx('(−3)(−3)(−3)') + '.', '3 negativos, impar: negativo.', t('3 · 3 · 3 = 27') + '. Queda ' + N(-27) + '.') }),
      pTec('−(−3)²', -9, E([
        [['9'], 'Casi. ' + fx('(−3)² = 9') + ' está bien. Después, el menos de afuera lo vuelve negativo: ' + N(-9) + '.'],
        [['6', '-6'], 'Casi. ² no es «por 2»: ' + fx('(−3)(−3) = 9') + '. Luego el menos de afuera: ' + N(-9) + '.']
      ]), { enunciado: 'D. ' + fx('−(−3)² = ?'), solucion: tres('El menos de afuera espera.', 'Primero ' + fx('(−3)² = 9') + '.', 'El menos de afuera lo vuelve ' + N(-9) + '.') })
    ]
  });

  LAMINAS.push({
    id: 'L34', num: 34, cap: 4, chip: 'ESCALERA', masAlFallar: true,
    titulo: 'La escalera: ¿qué va primero?',
    html: () =>
      '<p>Una <b>operación combinada</b> mezcla varias operaciones. Se resuelve por escalones:</p>' +
      R('ESCALERA') +
      '<div class="dibujo lsb-esc">' + svg().escalera(0) + '</div>' +
      EJ({
        expr: '10 − 2 · 3',
        pasos: [
          { html: 'Hay una resta (−) y una multiplicación (·).' },
          { html: 'El · está en un escalón más alto: va primero. ' + fx('2 · 3 = 6') + '.', regla: 'ESCALERA' },
          { html: fx('10 − 6 = 4') + '.' }
        ],
        resultado: '10 − 2 · 3 = 4'
      }),
    mas: () =>
      EJ({
        titulo: 'Otro ejemplo',
        expr: '12 ÷ 3 · 2',
        pasos: [
          { html: 'Hay ÷ y ·: están en el mismo escalón.' },
          { html: 'De izquierda a derecha: primero ' + fx('12 ÷ 3 = 4') + '.', regla: 'ESCALERA' },
          { html: fx('4 · 2 = 8') + '.' }
        ],
        resultado: '12 ÷ 3 · 2 = 8'
      }) +
      '<p>Si haces primero ' + fx('3 · 2') + ', te sale 2, y está mal. Corchetes [ ] y llaves { } se resuelven como paréntesis.</p>',
    bloques: [
      {
        tipo: 'opciones',
        enunciado: '1. ¿Qué se hace <b>primero</b> en ' + fx('2 + 3 · (−4)') + '?',
        columnas: 2,
        opciones: [
          { t: fx('2 + 3'), fb: 'Casi. El · está en un escalón más alto que el +. Primero ' + fx('3 · (−4) = −12') + '.' },
          { t: fx('3 · (−4)'), ok: true, fb: '¡Eso! ' + fx('3 · (−4) = −12') + ', y luego ' + fx('2 + (−12) = −10') + '.' }
        ],
        solucion: 'El · va antes que el +: ' + fx('3 · (−4) = −12') + ', y luego ' + fx('2 + (−12) = −10') + '.'
      },
      pOpc('10 − 4 + 2', [
        opc(4, 'Casi. − y + están en el mismo escalón: de izquierda a derecha. ' + fx('10 − 4 = 6') + ' y ' + fx('6 + 2 = 8') + '.'),
        okc(8, '¡Bien! De izquierda a derecha: ' + fx('10 − 4 = 6') + ' y ' + fx('6 + 2 = 8') + '.')
      ], { enunciado: '2. ' + fx('10 − 4 + 2 = ?'), solucion: 'De izquierda a derecha: ' + fx('10 − 4 + 2 = 6 + 2 = 8') + '.' })
    ]
  });

  const mini = (n) => '<div class="lsb-esc-mini" aria-hidden="true">' + svg().escalera(n) + '</div>';
  function paso(cuerpo, n) { return '<div class="lsb-paso"><div class="lsb-paso-txt">' + cuerpo + '</div>' + (n ? mini(n) : '') + '</div>'; }
  LAMINAS.push({
    id: 'L35', num: 35, cap: 4, chip: 'ESCALERA',
    titulo: 'Ejemplo resuelto paso a paso',
    html: '<p>Toca <b>Ver siguiente paso</b>. Lo que se resuelve en cada paso está en el recuadro.</p>',
    mas: () =>
      '<p>Antes de calcular, busca el escalón de cada operación. Aquí hay · (el 2 pegado al paréntesis) y ÷: van primero, de izquierda a derecha.</p>' +
      '<p>Después quedan solo + y −: junta los signos pegados y termina con la plata.</p>',
    bloques: [{
      tipo: 'pasos',
      titulo: 'Ejercicio: ' + fx('3 − 2(−4) + (−6) ÷ 2'),
      filas: [
        { n: 'Antes', fuente: '3 − 2(−4) + (−6) ÷ 2',
          html: '<p>Hay · y ÷: primero va el escalón 3.</p><p><b>Cuidado:</b> ' + fx('3 − 2') + ' no va primero. El 2 está pegado al paréntesis: está multiplicando.</p><p>' + mal('3 − 2 = 1') + ' ✗</p>' },
        { n: 'Paso 1', regla: 'CUENTA LOS NEGATIVOS', fuente: '3 − (−8) + (−6) ÷ 2',
          html: paso(mk([['3 − ', false], ['2(−4)', true], [' + (−6) ÷ 2', false]]) +
            '<div class="lsb-sub">' + fx('2(−4) = −8') + ' <span class="peq tinta-2">hay 1 negativo, impar: da negativo</span></div>' + queda('3 − (−8) + (−6) ÷ 2'), 3) },
        { n: 'Paso 2', regla: 'CUENTA LOS NEGATIVOS', fuente: '3 − (−8) + (−3)',
          html: paso(mk([['3 − (−8) + ', false], ['(−6) ÷ 2', true]]) +
            '<div class="lsb-sub">' + fx('(−6) ÷ 2 = −3') + ' <span class="peq tinta-2">hay 1 negativo, impar: da negativo</span></div>' + queda('3 − (−8) + (−3)'), 3) },
        { n: 'Paso 3', regla: 'SIGNOS PEGADOS', fuente: '3 + 8 − 3',
          html: paso(mk([['3 ', false], ['− (−8)', true], [' ', false], ['+ (−3)', true]]) +
            '<div class="lsb-sub">' + fx('−(−8)') + ' queda ' + fx('+8') + '; ' + fx('+(−3)') + ' queda ' + fx('−3') + '</div>' + queda('3 + 8 − 3'), 4) },
        { n: 'Paso 4', regla: 'PLATA', fuente: '11 − 3',
          html: paso(mk([['3 + 8 − 3', true]]) +
            '<div class="lsb-sub">Tienes ' + t('3 + 8 = 11') + ' y debes 3: ' + fx('11 − 3 = 8') + '</div>', 4) },
        { n: 'Final', fuente: '3 − 2(−4) + (−6) ÷ 2',
          html: '<p class="lsb-linea">' + fx('3 − 2(−4) + (−6) ÷ 2 = 8') + '</p>' }
      ],
      pregunta: {
        despuesDe: 2, tipoPreg: 'opciones',
        enunciado: '¿Por qué ' + fx('(−6) ÷ 2') + ' da ' + N(-3) + '?',
        opciones: [
          { t: 'Porque 6 es mayor que 2', fb: 'Casi. En ÷ el signo no depende del tamaño. Cuenta los negativos: hay 1, impar, da negativo.' },
          { t: 'Porque se juntan deudas', fb: 'Casi. «Se juntan» es para sumar y restar. Aquí se divide: cuenta los negativos.' },
          { t: 'Hay 1 negativo, impar: da negativo', ok: true, fb: '¡Eso! Hay 1 negativo, impar: da negativo. Y ' + t('6 ÷ 2 = 3') + '.' }
        ],
        solucion: 'Al dividir, cuenta los negativos: hay 1, impar, da negativo. ' + fx('(−6) ÷ 2 = −3') + '.'
      }
    }]
  });

  LAMINAS.push({
    id: 'L36', num: 36, cap: 4, chip: 'ESCALERA',
    titulo: 'Trampa 1: menos delante de un paréntesis con una cuenta',
    html: () =>
      '<p>Si el paréntesis tiene una cuenta adentro, resuélvela primero.</p>' +
      EJ({
        expr: '7 − (3 − 5)',
        pasos: [
          { html: 'Delante del paréntesis hay un −. Adentro hay una cuenta: ' + fx('3 − 5') + '.' },
          { html: 'Primero el paréntesis: ' + fx('3 − 5 = −2') + '. Queda ' + fx('7 − (−2)') + '.', regla: 'ESCALERA' },
          { html: 'Signos pegados, iguales dan +: ' + fx('7 + 2 = 9') + '.' }
        ],
        resultado: '7 − (3 − 5) = 9'
      }) +
      OJO(mal('7 − (3 − 5) = 7 − 3 − 5') + ' ✗ El menos de afuera afecta a todo el paréntesis.') +
      '<p class="peq">Con corchetes es igual: ' + fx('8 − [1 − 4] = 8 − (−3) = 11') + '.</p>',
    mas: () =>
      EJ({
        titulo: 'Otro ejemplo',
        expr: '10 − (4 − 9)',
        pasos: [
          { html: 'Delante del paréntesis hay un −. Adentro hay una cuenta: ' + fx('4 − 9') + '.' },
          { html: 'Primero el paréntesis: ' + fx('4 − 9 = −5') + '. Queda ' + fx('10 − (−5)') + '.', regla: 'ESCALERA' },
          { html: 'Signos pegados, iguales dan +: ' + fx('10 + 5 = 15') + '.' }
        ],
        resultado: '10 − (4 − 9) = 15'
      }) +
      '<p>Resolver primero adentro evita el error de cambiar solo el primer número.</p>',
    bloques: [
      pOpc('5 − (2 − 6)', [
        opc(-3, 'Casi. El menos de afuera afecta a todo el paréntesis. Primero adentro: ' + fx('2 − 6 = −4') + '. Luego ' + fx('5 − (−4) = 9') + '.'),
        opc(1, 'Casi. Quedó ' + fx('5 − (−4)') + ': son signos pegados, iguales dan +. ' + fx('5 + 4 = 9') + '.'),
        okc(9, '¡Bien! Primero adentro: ' + fx('2 − 6 = −4') + '. Luego ' + fx('5 − (−4) = 5 + 4 = 9') + '.')
      ], { columnas: 1, solucion: tres('Adentro hay una cuenta.', 'Primero el paréntesis: ' + fx('2 − 6 = −4') + '.', fx('5 − (−4) = 5 + 4 = 9') + '.') })
    ]
  });

  LAMINAS.push({
    id: 'L36b', num: 36.5, cap: 4, chip: 'ESCALERA',
    titulo: 'Trampa 2: la potencia va antes que multiplicar',
    html: () =>
      '<p>En la escalera, las potencias están un escalón más arriba que ·.</p>' +
      EJ({
        expr: '2 · (−3)²',
        pasos: [
          { html: 'Hay · y una potencia.' },
          { html: 'Primero la potencia: ' + fx('(−3)² = 9') + '.', regla: 'ESCALERA' },
          { html: fx('2 · 9 = 18') + '.' }
        ],
        resultado: '2 · (−3)² = 18'
      }) +
      OJO(mal('2 · (−3)² = (−6)² = 36') + ' ✗ No multipliques antes de elevar.'),
    mas: () =>
      EJ({
        titulo: 'Otro ejemplo',
        expr: '4 · (−1)³',
        pasos: [
          { html: 'Hay · y una potencia.' },
          { html: 'Primero la potencia: ' + fx('(−1)³ = −1') + '. 3 negativos, impar.', regla: 'ESCALERA' },
          { html: fx('4 · (−1) = −4') + '.' }
        ],
        resultado: '4 · (−1)³ = −4'
      }) +
      '<p>El exponente solo toca su paréntesis. El 4 de afuera se multiplica después.</p>',
    bloques: [
      pOpc('3 · (−2)²', [
        opc(-12, 'Casi. ' + fx('(−2)²') + ' tiene 2 negativos, par: da ' + N(4) + '. Luego ' + fx('3 · 4 = 12') + '.'),
        okc(12, '¡Bien! Primero ' + fx('(−2)² = 4') + ', luego ' + fx('3 · 4 = 12') + '.'),
        opc(36, 'Casi. Multiplicaste antes de elevar. Primero ' + fx('(−2)² = 4') + ', luego ' + fx('3 · 4 = 12') + '.')
      ], { columnas: 1, solucion: tres('Hay · y una potencia.', 'Primero la potencia: ' + fx('(−2)² = 4') + '.', fx('3 · 4 = 12') + '.') })
    ]
  });

  LAMINAS.push({
    id: 'L37', num: 37, cap: 4,
    titulo: 'Te toca terminar',
    html: '<p>Los primeros pasos ya están hechos. Tú haces los que faltan.</p>',
    mas: () =>
      '<p>Sigue la escalera: primero potencias, después · y ÷, al final + y −.</p>' +
      '<p>En ' + fx('10 − 3(−2)²') + ' la potencia va primero: ' + fx('(−2)² = 4') + '. Después se multiplica por 3.</p>',
    bloques: [
      {
        tipo: 'pasos',
        titulo: 'Ejercicio A: ' + fx('10 − 3(−2)²'),
        filas: [
          { n: 'Paso 1', regla: 'POTENCIA', fuente: '10 − 3 · 4',
            html: mk([['10 − 3', false], ['(−2)²', true]]) + '<div class="lsb-sub">' + fx('(−2)² = 4') + '</div>' + queda('10 − 3 · 4') + ' <span class="lsb-visto">✓</span>' },
          { n: 'Paso 2', regla: 'ESCALERA', fuente: '10 − 12',
            html: mk([['10 − ', false], ['3 · 4', true]]) + '<div class="lsb-sub">' + fx('3 · 4 = 12') + '</div>' + queda('10 − 12') + ' <span class="lsb-visto">✓</span>' },
          { n: 'Paso 3', regla: 'PLATA', html: '<b>Tú:</b> ' + mk([['10 − 12', true]]) }
        ],
        pregunta: Object.assign(pTec('10 − 12', -2, E([
          [['2'], 'Casi. Tienes 10 y debes 12: te faltan 2. Queda ' + N(-2) + '.'],
          [['22', '-22'], 'Casi. Los signos son distintos: se cancelan. ' + t('12 − 10 = 2') + ', y gana la deuda: ' + N(-2) + '.']
        ]), { solucion: 'Tienes 10 y debes 12: te faltan 2. Queda ' + N(-2) + '.' }), { despuesDe: 2, tipoPreg: 'teclado' })
      },
      {
        tipo: 'pasos',
        titulo: 'Ejercicio B: ' + fx('(−12) ÷ 4 − 2(−5)'),
        filas: [
          { n: 'Paso 1', regla: 'CUENTA LOS NEGATIVOS', fuente: '−3 − 2(−5)',
            html: mk([['(−12) ÷ 4', true], [' − 2(−5)', false]]) + '<div class="lsb-sub">' + fx('(−12) ÷ 4 = −3') + '</div>' + queda('−3 − 2(−5)') + ' <span class="lsb-visto">✓</span>' },
          { n: 'Paso 2', regla: 'CUENTA LOS NEGATIVOS', html: '<b>Tú:</b> ' + mk([['−3 − ', false], ['2(−5)', true]]) }
        ],
        pregunta: Object.assign(pTec('2(−5)', -10, E([
          [['10'], 'Casi. Hay 1 negativo, impar: da negativo. Queda ' + N(-10) + '.'],
          [['-3', '3', '-7'], 'Casi. ' + fx('2(−5)') + ' es multiplicar: ' + t('2 · 5 = 10') + '. Hay 1 negativo, impar: ' + N(-10) + '.']
        ]), { solucion: fx('2(−5) = −10') + ': hay 1 negativo, impar, da negativo.' }), { despuesDe: 1, tipoPreg: 'teclado' })
      },
      {
        tipo: 'pasos',
        filas: [
          { n: 'Paso 3', regla: 'SIGNOS PEGADOS', fuente: '−3 − (−10)',
            html: 'Queda ' + fx('−3 − (−10)') + '. <b>Tú:</b> ' + mk([['−3 − (−10)', true]]) }
        ],
        pregunta: Object.assign(pTec('−3 − (−10)', 7, E([
          [['-13'], 'Casi. Los dos menos del medio están pegados: iguales dan +. Queda ' + fx('−3 + 10 = 7') + '.'],
          [['-7'], 'Casi. Debes 3 y tienes 10: te sobran 7. Queda ' + fx('+7') + '.'],
          [['13'], 'Casi. En ' + fx('−3 + 10') + ' los signos son distintos: se cancelan. ' + t('10 − 3 = 7') + '.']
        ]), { solucion: tres('− y − pegados.', 'Iguales dan +: queda ' + fx('−3 + 10') + '.', fx('−3 + 10 = 7') + '.') }), { despuesDe: 0, tipoPreg: 'teclado' })
      }
    ]
  });

  LAMINAS.push({
    id: 'L38', num: 38, cap: 4,
    titulo: 'Minichequeo 4',
    html: '<p>Tres preguntas para cerrar el capítulo. Usa la escalera y fíjate en los paréntesis.</p>',
    bloques: [{
      tipo: 'chequeo',
      repaso: [34, 35],
      salida: '¡Minichequeo 4 superado! Ya subes la escalera sin tropezar.',
      preguntas: [
        pOpc('(−4)²', [
          opc(-16, 'Casi. Con paréntesis, el menos entra: ' + fx('(−4)(−4) = 16') + '.'),
          opc(-8, 'Casi. ² no es «por 2»: ' + t('4 · 4 = 16') + '.'),
          opc(8, 'Casi. ² no es «por 2»: ' + t('4 · 4 = 16') + '.'),
          okc(16)
        ], { enunciado: '1. ' + fx('(−4)² = ?'), solucion: fx('(−4)² = (−4)(−4) = 16') + '. 2 negativos, par: positivo.' }),
        pOpc('−1 + 18 ÷ (−3) · 2', [
          okc(-13),
          opc(-4, 'Casi. ÷ y · están en el mismo escalón: de izquierda a derecha. ' + fx('18 ÷ (−3) = −6') + ', luego ' + fx('−6 · 2 = −12') + '.'),
          opc(11, 'Casi. ' + fx('18 ÷ (−3)') + ' tiene 1 negativo, impar: da ' + N(-6) + '. Luego ' + fx('−6 · 2 = −12') + ' y ' + fx('−1 − 12 = −13') + '.'),
          opc(13, 'Casi. Revisa el signo: ' + fx('−1 + (−12)') + ' son dos deudas. Se juntan en ' + N(-13) + '.')
        ], { enunciado: '2. ' + fx('−1 + 18 ÷ (−3) · 2 = ?'), solucion: fx('18 ÷ (−3) = −6') + ', ' + fx('−6 · 2 = −12') + ', ' + fx('−1 + (−12) = −13') + '.' }),
        pTec('4 − 5 · (−2)', 14, E([
          [['2'], 'Casi. El · va antes que el −: primero ' + fx('5 · (−2) = −10') + '. Luego ' + fx('4 − (−10) = 4 + 10 = 14') + '.'],
          [['-6'], 'Casi. Quedó ' + fx('4 − (−10)') + ': signos pegados, iguales dan +. ' + fx('4 + 10 = 14') + '.'],
          [['-14'], 'Casi. Revisa el signo: ' + fx('4 + 10 = 14') + '.']
        ]), { enunciado: '3. ' + fx('4 − 5 · (−2) = ?'), solucion: 'Primero ' + fx('5 · (−2) = −10') + '. Luego ' + fx('4 − (−10) = 4 + 10 = 14') + '.' })
      ],
      segundo: [
        pOpc('(−7)²', [
          opc(-49, 'Casi. Con paréntesis, el menos entra: ' + fx('(−7)(−7) = 49') + '.'),
          opc(-14, 'Casi. ² no es «por 2»: ' + t('7 · 7 = 49') + '.'),
          opc(14, 'Casi. ² no es «por 2»: ' + t('7 · 7 = 49') + '.'),
          okc(49)
        ], { enunciado: '1. ' + fx('(−7)² = ?'), solucion: fx('(−7)² = (−7)(−7) = 49') + '. 2 negativos, par: positivo.' }),
        pOpc('2 − 12 ÷ (−2) · 3', [
          opc(-16, 'Casi. ' + fx('12 ÷ (−2)') + ' tiene 1 negativo, impar: da ' + N(-6) + '. Luego ' + fx('−6 · 3 = −18') + ' y ' + fx('2 − (−18) = 20') + '.'),
          opc(4, 'Casi. ÷ y · están en el mismo escalón: de izquierda a derecha. ' + fx('12 ÷ (−2) = −6') + ', luego ' + fx('−6 · 3 = −18') + '.'),
          opc(15, 'Casi. El − va al final: ÷ y · están en un escalón más alto. ' + fx('12 ÷ (−2) · 3 = −18') + '.'),
          okc(20)
        ], { enunciado: '2. ' + fx('2 − 12 ÷ (−2) · 3 = ?'), solucion: fx('12 ÷ (−2) = −6') + ', ' + fx('−6 · 3 = −18') + ', ' + fx('2 − (−18) = 2 + 18 = 20') + '.' }),
        pTec('6 − 4 · (−3)', 18, E([
          [['-6'], 'Casi. El · va antes que el −: ' + fx('4 · (−3) = −12') + '. Luego ' + fx('6 − (−12)') + ': iguales dan +. ' + fx('6 + 12 = 18') + '.'],
          [['-18'], 'Casi. Revisa el signo: ' + fx('6 + 12 = 18') + '.']
        ]), { enunciado: '3. ' + fx('6 − 4 · (−3) = ?'), solucion: 'Primero ' + fx('4 · (−3) = −12') + '. Luego ' + fx('6 − (−12) = 6 + 12 = 18') + '.' })
      ]
    }]
  });

  LAMINAS.push({
    id: 'L38b', num: 38.5, cap: 4,
    titulo: (c) => '¡Capítulo 4 listo, ' + c.nombre + '!',
    html: cierreCap(4,
      'Ya sabes qué es una potencia, cuándo el menos entra y cuándo espera afuera, y cómo subir la escalera.',
      'volvemos al ejercicio del inicio, te llevas tu resumen en una foto y empieza el juego.')
  });

  // ---------------- CIERRE ----------------
  function ganchoNorm(g) {
    if (g == null || g === '') return null;
    const s = String(g).trim().replace(/[−–]/g, '-');
    if (['-14', '-4', '4', '14'].indexOf(s) >= 0) return s;
    return 'nose';
  }
  LAMINAS.push({
    id: 'L39', num: 39, cap: 5,
    entrada: 'Cierre · Volvamos al inicio, tu resumen y ¡a jugar!',
    titulo: 'Volvamos al inicio',
    html: () => '<p>Al inicio te preguntamos cuánto es <b>' + fx('−5 − 9') + '</b>.</p><p>Ahora escríbelo tú, sin opciones.</p>',
    bloques: [
      pTec('−5 − 9', -14, E([
        [['14'], 'Casi. Hay un 5 entre los signos: son dos deudas y se juntan. Queda ' + N(-14) + '. ' +
          '<button type="button" class="btn-txt" onclick="window.LS&&LS.laminas&&LS.laminas.verLamina(12)">Ver la lámina 12</button>'],
        [['-4', '4'], 'Casi. Las dos son deudas, con el mismo signo: se juntan. ' + t('5 + 9 = 14') + ', queda ' + N(-14) + '.']
      ]), {
        okFb: (c) => '¡Eso, ' + c.nombre + '! ' + fx('−5 − 9 = −14') + '.',
        solucion: 'Debes 5 y debes 9 más: las deudas se juntan. ' + fx('−5 − 9 = −14') + '.'
      }),
      {
        tipo: 'revelar',
        html: (c) => {
          const g = ganchoNorm(c.gancho);
          let antes = '', msg;
          if (g === 'nose') antes = '<span class="lsb-antes-txt">No tenías idea</span>';
          else if (g) antes = '<span class="lsb-antes">' + N(parseInt(g, 10)) + '</span>';
          const x = g && g !== 'nose' ? N(parseInt(g, 10)) : '';
          if (g === '14') msg = 'Al inicio pusiste ' + x + ': es el error más común. Ahora sabes que es ' + N(-14) + ', y que contar negativos es solo para multiplicar y dividir.';
          else if (g === '-4' || g === '4') msg = 'Al inicio pusiste ' + x + ': restaste en vez de juntar. Ahora ya lo sabes: dos deudas se juntan en ' + N(-14) + '.';
          else if (g === '-14') msg = 'Le atinaste desde el inicio. Ahora además sabes <b>por qué</b>.';
          else if (g === 'nose') msg = 'Al inicio no tenías idea. Mira todo lo que aprendiste, ' + c.nombre + '.';
          else msg = 'Ahora ya sabes resolverlo tú solo: ' + fx('−5 − 9 = −14') + '.';
          return '<div class="lsb-antes-ahora">' +
            (antes ? '<div class="lsb-aa lsb-aa-antes"><span class="peq">Antes</span>' + antes + '</div>' : '') +
            '<div class="sello lsb-aa-sello">' + svg().sello('Logro') + '</div>' +
            '<div class="lsb-aa"><span class="peq">Ahora</span><span class="lsb-ahora">' + N(-14) + '</span></div></div>' +
            '<p class="caja-nota">' + msg + '</p>';
        }
      }
    ]
  });

  // Resumen: las 7 reglas con su texto exacto + «Ojo» con la trampa.
  const ORDEN_RES = ['LECTURA', 'SE JUNTAN', 'SE CANCELAN', 'SIGNOS PEGADOS', 'CUENTA LOS NEGATIVOS', 'POTENCIA', 'ESCALERA'];
  function resumenHtml() {
    return '<ol class="lsb-resumen">' +
      ORDEN_RES.map(c => '<li>' + chip(c) + ' ' + TXT[c] + '</li>').join('') +
      '<li class="lsb-res-ojo"><b>Ojo:</b> ' + fx('−5 − 9 = −14') + ', pero ' + fx('(−5)(−9) = 45') + '. ' +
      fx('(−2)² = 4') + ', pero ' + fx('−2² = −4') + '. No se divide entre ' + N(0) + '.</li>' +
      '</ol>';
  }
  LAMINAS.push({
    id: 'L40', num: 40, cap: 5,
    titulo: 'Tu resumen en una foto',
    html: () => resumenHtml(),
    bloques: [{
      tipo: 'custom',
      render(el, api) {
        el.innerHTML = '<button class="btn btn-pri btn-ancho" data-noswipe>Guardar en mi galería</button>' +
          '<p class="peq tinta-2 lsb-nota">En iPhone: mantén presionada la imagen y elige <b>Guardar en Fotos</b>. También te llega en el PDF de tus resultados.</p>' +
          '<div class="lsb-foto-zona"></div>';
        const bt = el.querySelector('button'), zona = el.querySelector('.lsb-foto-zona');
        bt.addEventListener('click', () => {
          bt.disabled = true;
          Promise.resolve(LS.resumen.descargar(zona)).catch(() => {
            zona.innerHTML = api.fb('miss', 'Casi. No se pudo crear la imagen en este navegador. Toma una captura de pantalla del resumen.');
          }).then(() => { bt.disabled = false; });
        });
        api.completar(true);
      }
    }]
  });

  LAMINAS.push({
    id: 'L41', num: 41, cap: 5,
    titulo: '¡A jugar!',
    html: (c) =>
      '<p>¡Listo, ' + c.nombre + '! Ya tienes todas las reglas.</p>' +
      '<p>Ahora practícalas en el juego: <b>6 paradas</b>, desde sumar y restar hasta el jefe final.</p>' +
      '<div class="dibujo">' + svgParadas41() + '</div>' +
      '<p>Si te trabas, el botón <b>«¿Qué regla era?»</b> te trae la lámina que necesitas. Tu avance ya está guardado.</p>',
    bloques: [{ tipo: 'boton', texto: 'Ir al juego', avanzar: true }]
  });

  LS.LAMINAS = (LS.LAMINAS || []).concat(LAMINAS);

  // =====================================================================
  // «Tu resumen en una foto»: PNG 1080×1350, tema claro, signo − siempre escrito.
  // Mismos textos exactos que la lámina 40.
  // =====================================================================
  LS.resumen = (function () {
    const W = 1080, H = 1350, MX = 60;
    const C = {
      bg: '#FFFFFF', ink: '#3C3C3C', ink2: '#6F6F6F', ink3: '#8A8A8A', neg: '#B35C00', pos: '#0A76B3',
      negFill: '#FF9600', posFill: '#1CB0F6', negSoft: '#FFF0D6', posSoft: '#DDF4FF', chip: '#F6EAFF',
      line: '#E5E5E5', prize: '#FFC800', surface: '#FFFFFF'
    };
    function familia() {
      try { if (document.fonts && document.fonts.check('800 30px Nunito')) return 'Nunito, Arial, sans-serif'; } catch (e) { }
      return 'Arial, sans-serif';
    }
    let FAM = 'Arial, sans-serif';
    const fnt = (peso, px) => peso + ' ' + px + 'px ' + FAM;

    // Texto enriquecido: {−14} número con color según signo · *negrita* · [[CHIP]]
    function piezas(str) {
      const out = [], re = /\{([^}]+)\}|\*([^*]+)\*|\[\[([^\]]+)\]\]/g;
      let last = 0, m;
      const txt = (s, b) => out.push({ s, c: C.ink, b: !!b });
      while ((m = re.exec(str))) {
        if (m.index > last) txt(str.slice(last, m.index));
        if (m[1] != null) { const v = m[1]; out.push({ s: v, c: /^−/.test(v) ? C.neg : (v === '0' ? C.ink : C.pos), b: true }); }
        else if (m[2] != null) txt(m[2], true);
        else out.push({ s: m[3], chip: true });
        last = re.lastIndex;
      }
      if (last < str.length) txt(str.slice(last));
      return out;
    }
    function palabras(ps) {
      const words = []; let cur = [];
      ps.forEach(p => {
        if (p.chip) { cur.push(p); return; }
        p.s.split(/( +)/).forEach(q => {
          if (!q) return;
          if (/^ +$/.test(q)) { if (cur.length) { words.push(cur); cur = []; } }
          else cur.push({ s: q, c: p.c, b: p.b });
        });
      });
      if (cur.length) words.push(cur);
      return words;
    }
    function rr(x, px, py, w, h, r) {
      x.beginPath();
      x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r);
      x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath();
    }
    function anchoPieza(x, p, size) {
      if (p.chip) { x.font = fnt(900, Math.round(size * 0.72)); return x.measureText(p.s).width + size * 0.9; }
      x.font = fnt(p.b ? 900 : 700, size); return x.measureText(p.s).width;
    }
    function dibujarPieza(x, p, px, base, size) {
      if (p.chip) {
        const cs = Math.round(size * 0.72), w = anchoPieza(x, p, size), h = size * 1.12;
        rr(x, px, base - size * 0.86, w, h, h / 2); x.fillStyle = C.chip; x.fill();
        x.font = fnt(900, cs); x.fillStyle = C.ink; x.fillText(p.s, px + size * 0.45, base - size * 0.08);
        return w;
      }
      x.font = fnt(p.b ? 900 : 700, size); x.fillStyle = p.c; x.fillText(p.s, px, base);
      return x.measureText(p.s).width;
    }
    // Devuelve la y final (debajo de la última línea).
    function parrafo(x, str, px, py, maxW, size, lh, dib) {
      const ws = palabras(piezas(str));
      x.font = fnt(700, size);
      const esp = x.measureText(' ').width;
      let lineas = [[]], anchoL = 0;
      ws.forEach(w => {
        const aw = w.reduce((a, p) => a + anchoPieza(x, p, size), 0);
        const falta = lineas[lineas.length - 1].length ? esp : 0;
        if (anchoL + falta + aw > maxW && lineas[lineas.length - 1].length) { lineas.push([]); anchoL = 0; }
        const l = lineas[lineas.length - 1];
        anchoL += (l.length ? esp : 0) + aw;
        l.push(w);
      });
      if (dib) {
        lineas.forEach((l, i) => {
          let cx = px; const base = py + i * lh + size;
          l.forEach((w, j) => { if (j) cx += esp; w.forEach(p => { cx += dibujarPieza(x, p, cx, base, size); }); });
        });
      }
      return py + lineas.length * lh;
    }

    const PUNTOS = ORDEN_RES.map(c => '[[' + c + ']] ' + TXT[c]).concat([
      '*Ojo:* {−5} − {9} = {−14}, pero ({−5})({−9}) = {45}. ({−2})² = {4}, pero −{2}² = {−4}. No se divide entre {0}.'
    ]);
    const ULT = PUNTOS.length - 1;

    function fichaC(x, cx, cy, r, neg) {
      x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2);
      if (neg) {
        x.fillStyle = C.negSoft; x.fill(); x.setLineDash([7, 5]); x.lineWidth = 3; x.strokeStyle = C.negFill; x.stroke(); x.setLineDash([]);
        x.beginPath(); x.moveTo(cx - r * 0.45, cy); x.lineTo(cx + r * 0.45, cy); x.strokeStyle = C.neg; x.lineWidth = 4; x.lineCap = 'round'; x.stroke();
      } else {
        x.fillStyle = C.posFill; x.fill();
        x.beginPath(); x.moveTo(cx - r * 0.45, cy); x.lineTo(cx + r * 0.45, cy); x.moveTo(cx, cy - r * 0.45); x.lineTo(cx, cy + r * 0.45);
        x.strokeStyle = '#FFFFFF'; x.lineWidth = 4; x.lineCap = 'round'; x.stroke();
      }
    }

    function componer(x, s, dib, nombre) {
      const w = W - 2 * MX;
      let y = 48;
      if (dib) {
        x.fillStyle = C.bg; x.fillRect(0, 0, W, H);
        x.font = fnt(900, 54); x.fillStyle = C.ink; x.fillText('Ley de signos: tu resumen', MX, y + 50);
        x.font = fnt(700, 28); x.fillStyle = C.ink2;
        x.fillText((nombre ? nombre + ', guarda' : 'Guarda') + ' esta foto y mírala antes del examen.', MX, y + 92);
      }
      y += 112;
      // Leyenda de colores
      if (dib) {
        fichaC(x, MX + 18, y + 20, 17, false);
        parrafo(x, '{+3} = tienes (positivo)', MX + 46, y + 2, 300, 26, 34, true);
        fichaC(x, MX + 368, y + 20, 17, true);
        parrafo(x, '{−3} = debes (negativo)', MX + 396, y + 2, 300, 26, 34, true);
        parrafo(x, '{0}: ni tienes ni debes', MX + 720, y + 2, 260, 26, 34, true);
      }
      y += 52;
      if (dib) { x.fillStyle = C.line; x.fillRect(MX, y, w, 3); }
      y += 24;
      // Las 7 reglas + «Ojo»
      const lh = Math.round(s * 1.34);
      PUNTOS.forEach((p, i) => {
        const r = s * 0.66, ult = i === ULT;
        if (dib) {
          x.beginPath(); x.arc(MX + r, y + s * 0.62, r, 0, Math.PI * 2);
          x.fillStyle = ult ? C.prize : C.ink; x.fill();
          if (ult) { x.lineWidth = 3; x.strokeStyle = C.ink; x.stroke(); }
          x.font = fnt(900, Math.round(s * 0.78)); x.fillStyle = ult ? C.ink : '#FFFFFF'; x.textAlign = 'center';
          x.fillText(ult ? '!' : String(i + 1), MX + r, y + s * 0.62 + s * 0.27); x.textAlign = 'left';
        }
        y = parrafo(x, p, MX + r * 2 + 16, y, w - r * 2 - 16, s, lh, dib) + Math.round(s * 0.5);
      });
      if (dib) {
        x.font = fnt(700, 22); x.fillStyle = C.ink3; x.textAlign = 'center';
        x.fillText('Ley de signos y operaciones combinadas · láminas, juego y test', W / 2, H - 28); x.textAlign = 'left';
      }
      return y;
    }

    function canvas() {
      FAM = familia();
      const cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      const x = cv.getContext('2d');
      x.textBaseline = 'alphabetic';
      let nombre = '';
      try { nombre = ((LS.st && LS.st.usuario && LS.st.usuario.nombre) || '').trim().split(/\s+/)[0] || ''; } catch (e) { }
      if (nombre) nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1);
      let s = 36;
      while (s > 20 && componer(x, s, false, nombre) > H - 70) s--;
      componer(x, s, true, nombre);
      return cv;
    }

    function esIOS() {
      const ua = navigator.userAgent || '';
      return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }
    function mostrarImagen(url, dest, ios) {
      const html = '<figure class="lsb-foto"><img src="' + url + '" alt="Tu resumen de ley de signos en una imagen" width="1080" height="1350">' +
        '<figcaption class="peq tinta-2">' + (ios ? 'Mantén presionada la imagen y elige <b>Guardar en Fotos</b>.' : '¿No se descargó? Mantén presionada la imagen (o clic derecho) y elige <b>Guardar imagen</b>.') + '</figcaption></figure>';
      if (dest) { dest.innerHTML = html; return; }
      if (LS.ui && LS.ui.hoja) LS.ui.hoja({ tipo: 'info', icono: 'foco', titulo: 'Tu resumen en una foto', html, botones: [{ t: 'Listo', cls: 'btn-pri' }] });
    }
    function esperarFuente() {
      try {
        if (!document.fonts || !document.fonts.load) return Promise.resolve();
        return Promise.race([
          Promise.all([document.fonts.load('900 40px Nunito'), document.fonts.load('700 30px Nunito')]),
          new Promise(r => setTimeout(r, 1500))
        ]).catch(() => { });
      } catch (e) { return Promise.resolve(); }
    }
    function descargar(dest) {
      return esperarFuente().then(() => {
        const cv = canvas();
        const url = cv.toDataURL('image/png');
        const ios = esIOS();
        mostrarImagen(url, dest, ios);
        if (ios) return 'imagen';
        return new Promise(res => {
          const bajar = (href, revocar) => {
            const a = document.createElement('a');
            a.href = href; a.download = 'resumen-ley-de-signos.png'; a.rel = 'noopener';
            document.body.appendChild(a); a.click(); a.remove();
            if (revocar) setTimeout(() => URL.revokeObjectURL(href), 5000);
            res('descarga');
          };
          if (cv.toBlob && window.URL && URL.createObjectURL) cv.toBlob(b => { if (b) bajar(URL.createObjectURL(b), true); else bajar(url, false); }, 'image/png');
          else bajar(url, false);
        });
      });
    }
    return { canvas, descargar };
  })();
})();
