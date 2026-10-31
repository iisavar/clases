/* Láminas 50–63 (Capítulo 3: los elementos y la tabla periódica) y 70–72 (Cierre).
   Usa los widgets LS.QM.* (qm-tabla-data.js y qm-widgets.js se cargan antes).
   Además: LS.resumen, el generador de la imagen «Tu resumen en una foto» (PNG 1080×1350). */
(function () {
  'use strict';
  const LS = window.LS = window.LS || {};

  const REGLA = (txt, c) => LS.ui.regla(txt, c);
  const OJO = (h) => LS.ui.ojo(h);
  const chip = (x) => LS.ui.chip(x);
  const esc = (s) => LS.ui.esc(s);
  const svg = () => LS.svg;
  const hayQM = () => !!(LS.QM && Array.isArray(LS.QM.ELEMENTOS));
  const val = (x, a) => typeof x === 'function' ? x(a) : (x || '');

  // ---------- Acceso a los datos de la tabla (con respaldo si falta el widget) ----------
  function elem(ref) {
    if (!hayQM()) return null;
    if (typeof ref === 'number') return LS.QM.porZ ? LS.QM.porZ(ref) : LS.QM.ELEMENTOS.find(e => e.z === ref) || null;
    return LS.QM.porSimbolo ? LS.QM.porSimbolo(ref) : LS.QM.ELEMENTOS.find(e => e.simbolo === ref) || null;
  }
  const FAM_RESPALDO = {
    'alcalino': { nombre: 'Metales alcalinos', color: '#FF8A80' },
    'alcalinoterreo': { nombre: 'Metales alcalinotérreos', color: '#FFCC80' },
    'transicion': { nombre: 'Metales de transición', color: '#F3D98B' },
    'post-transicion': { nombre: 'Otros metales', color: '#C5CAE9' },
    'metaloide': { nombre: 'Metaloides', color: '#B2DFDB' },
    'no-metal': { nombre: 'No metales', color: '#C5E1A5' },
    'halogeno': { nombre: 'Halógenos', color: '#81D4FA' },
    'gas-noble': { nombre: 'Gases nobles', color: '#CE93D8' },
    'lantanido': { nombre: 'Lantánidos', color: '#F8BBD0' },
    'actinido': { nombre: 'Actínidos', color: '#E1BEE7' }
  };
  function fam(cat) {
    const f = (LS.QM && LS.QM.FAMILIAS && LS.QM.FAMILIAS[cat]) || FAM_RESPALDO[cat] || { nombre: cat, color: 'var(--zero-soft)' };
    return { nombre: f.nombre || (FAM_RESPALDO[cat] || {}).nombre || cat, color: f.color || (FAM_RESPALDO[cat] || {}).color || 'var(--zero-soft)' };
  }
  // Colores por tipo (mismos en el mapa y en la leyenda de esta parte)
  const TIPO_COL = { 'metal': 'var(--qm-metal, #DCE5EE)', 'no metal': 'var(--qm-nometal, #D7F5BA)', 'metaloide': 'var(--qm-metaloide, #C9EFE6)' };

  function casilla(z, o) {
    if (LS.QM && typeof LS.QM.casilla === 'function') return LS.QM.casilla(z, o || {});
    const e = elem(z);
    return '<div class="qmb-casilla-resp"><span>' + (e ? e.z : z) + '</span><b>' + (e ? e.simbolo : '?') + '</b><span>' + (e ? esc(e.nombre) : '') + '</span><span>' + (e ? e.masaTxt : '') + '</span></div>';
  }
  function grupoTxt(e) {
    if (!e) return '';
    if (e.grupo) return 'grupo ' + e.grupo + (e.grupoAB ? ' (' + e.grupoAB + ')' : '');
    return e.categoria === 'actinido' ? 'fila de los actínidos' : 'fila de los lantánidos';
  }

  // Si la lámina ya se hizo antes (el alumno volvió atrás), el bloque se da por completado.
  function yaHecho(c, id, num) {
    const r = c.st.laminas.respuestas[id];
    if (r && r.hecho) return true;
    const i = LS.laminas && LS.laminas.indicePorNum ? LS.laminas.indicePorNum(num) : -1;
    return i >= 0 && i < c.st.laminas.maxAlcanzada;
  }

  // ---------- Mini mapa de la tabla (SVG estático: también se ve en la hoja de repaso) ----------
  // o: { colorear:'ninguno'|'tipo'|'familia', periodo:n, grupo:n, marcar:[z], aria }
  const MP = { x0: 18, y0: 16, p: 17, s: 15, gap: 6 };
  function celdasMapa() {
    if (hayQM()) {
      const cel = LS.QM.ELEMENTOS.map(e => ({ z: e.z, sim: e.simbolo, fila: e.fila, col: e.col, periodo: e.periodo, grupo: e.grupo, tipo: e.tipo, cat: e.categoria }));
      // Casillas «57–71» y «89–103» del grupo 3
      cel.push({ hueco: true, fila: 6, col: 3 }, { hueco: true, fila: 7, col: 3 });
      return cel;
    }
    // Respaldo: forma de la tabla sin datos
    const NM = ['1-1', '1-18', '2-14', '2-15', '2-16', '2-17', '2-18', '3-15', '3-16', '3-17', '3-18', '4-16', '4-17', '4-18', '5-17', '5-18', '6-18'];
    const MT = ['2-13', '3-14', '4-14', '4-15', '5-15', '5-16'];
    const cel = [];
    for (let p = 1; p <= 7; p++) {
      const gs = p === 1 ? [1, 18] : p <= 3 ? [1, 2, 13, 14, 15, 16, 17, 18] : Array.from({ length: 18 }, (_, i) => i + 1);
      gs.forEach(g => {
        const k = p + '-' + g;
        if (p >= 6 && g === 3) { cel.push({ hueco: true, fila: p, col: 3 }); return; }
        cel.push({ fila: p, col: g, periodo: p, grupo: g, tipo: NM.indexOf(k) >= 0 ? 'no metal' : MT.indexOf(k) >= 0 ? 'metaloide' : 'metal' });
      });
    }
    for (let f = 8; f <= 9; f++) for (let c = 3; c <= 17; c++) cel.push({ fila: f, col: c, periodo: f - 2, grupo: null, tipo: 'metal', cat: f === 8 ? 'lantanido' : 'actinido' });
    return cel;
  }
  function mapa(o) {
    o = o || {};
    const cel = celdasMapa();
    const X = (c) => MP.x0 + (c - 1) * MP.p;
    const Y = (f) => MP.y0 + (f - 1) * MP.p + (f >= 8 ? MP.gap : 0);
    const W = MP.x0 + 18 * MP.p + 2, H = Y(9) + MP.p + 2;
    const aria = o.aria || 'Mapa de la tabla periódica: 7 periodos en filas y 18 grupos en columnas';
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + aria + '"><title>' + aria + '</title>';
    // Franjas resaltadas (debajo de las casillas)
    if (o.periodo) s += '<rect x="' + (MP.x0 - 3) + '" y="' + (Y(o.periodo) - 2.5) + '" width="' + (18 * MP.p + 4) + '" height="' + (MP.s + 5) + '" rx="5" style="fill:var(--qmb-franja-p)"/>';
    if (o.grupo) s += '<rect x="' + (X(o.grupo) - 2.5) + '" y="' + (MP.y0 - 3) + '" width="' + (MP.s + 5) + '" height="' + (7 * MP.p + 4) + '" rx="5" style="fill:var(--qmb-franja-g)"/>';
    // Números de grupo (arriba) y de periodo (izquierda)
    for (let g = 1; g <= 18; g++) {
      const on = o.grupo === g;
      s += '<text x="' + (X(g) + MP.s / 2) + '" y="' + (MP.y0 - 5) + '" text-anchor="middle" font-size="' + (on ? 10 : 8) + '" font-weight="' + (on ? 900 : 700) + '" style="fill:' + (on ? 'var(--ink)' : 'var(--ink-2)') + '">' + g + '</text>';
    }
    for (let p = 1; p <= 7; p++) {
      const on = o.periodo === p;
      s += '<text x="' + (MP.x0 - 6) + '" y="' + (Y(p) + MP.s - 4) + '" text-anchor="end" font-size="' + (on ? 10 : 8) + '" font-weight="' + (on ? 900 : 700) + '" style="fill:' + (on ? 'var(--ink)' : 'var(--ink-2)') + '">' + p + '</text>';
    }
    const marcar = o.marcar || [];
    cel.forEach(c => {
      const x = X(c.col), y = Y(c.fila);
      if (c.hueco) {
        s += '<rect x="' + x + '" y="' + y + '" width="' + MP.s + '" height="' + MP.s + '" rx="3" fill="none" style="stroke:var(--ink-3)" stroke-width="1.2" stroke-dasharray="2 2"/>';
        return;
      }
      let fill = 'var(--surface)';
      if (o.colorear === 'tipo') fill = TIPO_COL[c.tipo] || 'var(--surface)';
      else if (o.colorear === 'familia' && c.cat) fill = fam(c.cat).color;
      const mk = c.z && marcar.indexOf(c.z) >= 0;
      s += '<rect x="' + x + '" y="' + y + '" width="' + MP.s + '" height="' + MP.s + '" rx="3" style="fill:' + fill + ';stroke:' + (mk ? 'var(--ink)' : 'var(--qmb-borde)') + '" stroke-width="' + (mk ? 2.5 : 1) + '"/>';
      if (mk && c.sim) s += '<text x="' + (x + MP.s / 2) + '" y="' + (y + MP.s - 4) + '" text-anchor="middle" font-size="8.5" font-weight="900" style="fill:var(--ink)">' + c.sim + '</text>';
    });
    // Línea de los lantánidos y actínidos: salen del grupo 3
    s += '<path d="M' + (X(3) + MP.s / 2) + ' ' + (Y(7) + MP.s + 1) + ' V' + (Y(8) - 2) + '" style="stroke:var(--ink-3)" stroke-width="1.2" stroke-dasharray="2 2"/>';
    return s + '</svg>';
  }
  function leyendaTipo() {
    return '<div class="qmb-leyenda" aria-hidden="true">' +
      '<span><i style="background:' + TIPO_COL['metal'] + '"></i>Metales</span>' +
      '<span><i style="background:' + TIPO_COL['no metal'] + '"></i>No metales</span>' +
      '<span><i style="background:' + TIPO_COL['metaloide'] + '"></i>Metaloides</span></div>';
  }

  // Dibujo de la lámina 50: 1869 (por masa) y hoy (por Z)
  function svgHistoria50() {
    const aria = '1869: Mendeléiev ordena 63 elementos por su masa. Hoy: 118 elementos ordenados por Z';
    const T = (x, y, t, o) => { o = o || {}; return '<text x="' + x + '" y="' + y + '" text-anchor="middle" font-size="' + (o.size || 14) + '" font-weight="' + (o.peso || 800) + '" style="fill:' + (o.col || 'var(--ink)') + '">' + t + '</text>'; };
    const mini = (x, y, n, hueco) => {
      let s = '';
      for (let i = 0; i < n; i++) {
        const cx = x + (i % 6) * 13, cy = y + Math.floor(i / 6) * 13;
        const h = hueco && hueco.indexOf(i) >= 0;
        s += '<rect x="' + cx + '" y="' + cy + '" width="11" height="11" rx="2" style="fill:' + (h ? 'none' : 'var(--qmb-franja-g)') + ';stroke:var(--ink-3)" stroke-width="1.2"' + (h ? ' stroke-dasharray="2 2"' : '') + '/>';
      }
      return s;
    };
    return '<svg viewBox="0 0 320 150" role="img" aria-label="' + aria + '"><title>' + aria + '</title>' +
      '<rect x="6" y="6" width="130" height="138" rx="14" style="fill:var(--surface);stroke:var(--ink)" stroke-width="2.5"/>' +
      T(71, 30, '1869', { size: 18, peso: 900 }) + mini(33, 42, 18, [8, 13]) +
      T(71, 106, '63 elementos', { size: 13 }) + T(71, 126, 'por su masa', { size: 13, col: 'var(--ink-2)' }) +
      '<path d="M146 75 h26 m-8 -8 l8 8 -8 8" fill="none" style="stroke:var(--ink)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<rect x="184" y="6" width="130" height="138" rx="14" style="fill:var(--surface);stroke:var(--ink)" stroke-width="2.5"/>' +
      T(249, 30, 'Hoy', { size: 18, peso: 900 }) + mini(211, 42, 24) +
      T(249, 106, '118 elementos', { size: 13 }) + T(249, 126, 'por su número Z', { size: 13, col: 'var(--ink-2)' }) +
      '</svg>';
  }

  // Tabla de las dos numeraciones de los grupos
  function tablaAB() {
    const g = ['1', '2', '3–12', '13', '14', '15', '16', '17', '18'];
    const ab = ['IA', 'IIA', 'B', 'IIIA', 'IVA', 'VA', 'VIA', 'VIIA', 'VIIIA'];
    return '<div class="qmb-ab-caja"><table class="qmb-ab" aria-label="Numeración de los grupos: 1 a 18 y A/B">' +
      '<tr><th scope="row">1–18</th>' + g.map(x => '<td>' + x + '</td>').join('') + '</tr>' +
      '<tr><th scope="row">A/B</th>' + ab.map(x => '<td>' + x + '</td>').join('') + '</tr></table></div>';
  }

  // ---------- Tabla interactiva ----------
  function tablaEn(zona, opts) {
    if (!LS.QM || typeof LS.QM.tabla !== 'function') {
      zona.innerHTML = '<p class="caja-nota">No se pudo cargar la tabla. Puedes seguir con la siguiente lámina.</p>';
      return null;
    }
    try { return LS.QM.tabla(zona, opts); } catch (err) {
      zona.innerHTML = '<p class="caja-nota">No se pudo dibujar la tabla en este navegador. Puedes seguir.</p>';
      return null;
    }
  }

  // Retos «toca en la tabla». cfg: { id, num, colorear, numeracion, retos:[{ enunciado, ok(e), okFb(e), miss(e), solZ, solucion, resaltar }], alFinal(ok1) }
  function retosTabla(el, api, cfg) {
    el.classList.add('bloque-preg');
    el.innerHTML = '<div class="qmb-reto-cab"><span class="qmb-reto-n"></span><div class="enunciado qmb-reto-enun" aria-live="polite"></div></div>' +
      '<div class="qmb-tabla" data-noswipe></div><div class="zona-fb" aria-live="polite"></div><div class="qmb-reto-sig"></div>';
    const nEl = el.querySelector('.qmb-reto-n'), enun = el.querySelector('.qmb-reto-enun');
    const zt = el.querySelector('.qmb-tabla'), zfb = el.querySelector('.zona-fb'), zsig = el.querySelector('.qmb-reto-sig');
    const retos = cfg.retos;
    let i = 0, intentos = 0, ok1 = true, activo = false;
    const t = tablaEn(zt, { modo: 'elegir', colorear: cfg.colorear || 'ninguno', mostrarNumeracion: cfg.numeracion || 'iupac', onElegir: elegir });
    if (!t) { api.completar(true); return; }
    if (cfg.id && yaHecho(api.ctx, cfg.id, cfg.num)) api.completar(true);
    mostrar();

    function mostrar() {
      const r = retos[i];
      intentos = 0; activo = true; zfb.innerHTML = ''; zsig.innerHTML = '';
      nEl.textContent = retos.length > 1 ? 'Reto ' + (i + 1) + ' de ' + retos.length : 'Reto';
      enun.innerHTML = r.enunciado;
      try { t.limpiar(); if (r.resaltar) t.resaltar(r.resaltar); } catch (err) { /* sigue */ }
    }
    function elegir(e) {
      if (!activo || !e) return;
      const r = retos[i];
      if (r.ok(e)) {
        activo = false;
        try { t.marcar(e.z, 'ok'); } catch (err) { }
        zfb.innerHTML = api.fb('ok', val(r.okFb, e) || '¡Eso!');
        LS.ui.sonido('ok');
        avanzar();
        return;
      }
      intentos++; ok1 = false; api.fallo();
      try { t.marcar(e.z, 'miss'); } catch (err) { }
      const msg = val(r.miss, e) || 'Casi.';
      if (intentos >= 2) {
        activo = false;
        try { if (r.solZ) t.resaltar(r.solZ); } catch (err) { }
        zfb.innerHTML = api.fb('miss', msg) + (r.solucion ? api.fb('info', '<b>Mira la tabla:</b> ' + r.solucion) : '');
        avanzar();
      } else {
        zfb.innerHTML = api.fb('miss', msg + '<br><span class="peq tinta-2">Intenta otra vez.</span>');
      }
    }
    function avanzar() {
      i++;
      if (i >= retos.length) { if (cfg.alFinal) cfg.alFinal(ok1); api.completar(ok1); return; }
      zsig.innerHTML = '<button class="btn btn-sec btn-ancho" data-noswipe>Siguiente reto</button>';
      zsig.querySelector('button').addEventListener('click', mostrar);
    }
  }

  function cierreCap(n, resumen, viene) {
    return () => '<div class="qmb-cierre"><div class="sello">' + svg().sello('Capítulo ' + n + ' listo') + '</div>' +
      '<p>' + resumen + '</p>' +
      '<p><b>Lo que viene:</b> ' + viene + '</p>' +
      '<p class="caja-nota">Puedes parar aquí: tu avance quedó guardado.</p></div>';
  }

  // =====================================================================
  const LAMINAS = [];

  // ---------------- CAPÍTULO 3 ----------------
  LAMINAS.push({
    id: 'L50', num: 50, cap: 3, chip: 'TABLA',
    entrada: 'Capítulo 3 de 3 · Los elementos y la tabla periódica · unos 10 minutos',
    titulo: 'Un mapa de 118 elementos',
    html: () =>
      REGLA('La tabla periódica ordena los 118 elementos según su número atómico Z.', 'TABLA') +
      '<div class="dibujo">' + svgHistoria50() + '</div>' +
      '<p>En 1869, <b>Mendeléiev</b> ordenó por su masa los 63 elementos que se conocían.</p>' +
      '<p>Dejó huecos para elementos que faltaban. ¡Y acertó! Luego se hallaron el galio y el germanio.</p>' +
      '<p>Hoy se ordenan por <b>Z</b>, el número de protones: 1, 2, 3… hasta 118.</p>',
    mas: () =>
      '<p><b>Otro ejemplo:</b> el telurio (Te, Z = 52) y el yodo (I, Z = 53).</p>' +
      '<p>Por masa, el yodo (126,90) iría antes que el telurio (127,60). Por Z, el telurio va primero.</p>' +
      '<p>Así el yodo queda junto al cloro, al que se parece. Mendeléiev ya los había cambiado de lugar por eso.</p>',
    bloques: [{
      tipo: 'opciones',
      enunciado: '¿Cómo se ordenan hoy los elementos en la tabla?',
      opciones: [
        { t: 'Por su masa atómica', fb: 'Casi. Así lo hizo Mendeléiev en 1869. Hoy se ordenan por Z, el número de protones.' },
        { t: 'Por su número atómico Z', ok: true, fb: '¡Eso! Por Z, el número de protones. Cada Z es un elemento distinto.' },
        { t: 'Por orden alfabético', fb: 'Casi. Los nombres cambian en cada idioma. Se ordenan por Z, el número de protones.' },
        { t: 'Por el año en que se descubrieron', fb: 'Casi. La fecha no importa. Se ordenan por Z, el número de protones.' }
      ],
      solucion: 'Hoy los elementos van en orden de Z: 1, 2, 3… hasta 118.'
    }]
  });

  LAMINAS.push({
    id: 'L51', num: 51, cap: 3,
    titulo: 'Toca y descubre',
    html: () =>
      '<p>Aquí está la tabla completa. Cada casilla es un <b>elemento</b>: un tipo de átomo.</p>' +
      '<p>Toca los que te suenen y mira qué sale. En el celular, mueve la tabla hacia los lados.</p>',
    mas: () =>
      '<p><b>Otro ejemplo:</b> busca el mercurio (Hg). Está en la fila 6, casi al centro.</p>' +
      '<p>Es el único metal líquido a 25 °C. Por eso se usaba en los termómetros antiguos.</p>',
    bloques: [{
      tipo: 'custom',
      render(el, api) {
        el.innerHTML = '<div class="enunciado">Toca 3 elementos que te suenen.</div>' +
          '<p class="qmb-cuenta peq tinta-2" aria-live="polite">Llevas 0 de 3</p>' +
          '<div class="qmb-tabla" data-noswipe></div>';
        const cuenta = el.querySelector('.qmb-cuenta');
        const vistos = [];
        let listo = false;
        // En modo 'explorar' la tabla muestra su propio panel con la casilla y los datos.
        const t = tablaEn(el.querySelector('.qmb-tabla'), {
          modo: 'explorar', colorear: 'ninguno', mostrarNumeracion: 'iupac', leyenda: false,
          onElegir: (e) => {
            if (!e) return;
            if (vistos.indexOf(e.z) < 0) vistos.push(e.z);
            if (!listo && vistos.length >= 3) {
              listo = true;
              cuenta.innerHTML = '<b>¡Bien!</b> Sigue tocando los que quieras, o pasa a la siguiente lámina.';
              LS.ui.sonido('ok');
              api.completar(true);
            } else if (!listo) cuenta.textContent = 'Llevas ' + vistos.length + ' de 3';
          }
        });
        if (!t || yaHecho(api.ctx, 'L51', 51)) api.completar(true);
      }
    }]
  });

  LAMINAS.push({
    id: 'L52', num: 52, cap: 3, chip: 'CASILLA', masAlFallar: true,
    titulo: 'Leer una casilla',
    html: () =>
      REGLA('Cada casilla trae 4 datos: número atómico Z, símbolo, nombre y masa atómica.', 'CASILLA') +
      '<div class="dibujo qmb-cas-grande">' + casilla(17, { etiquetas: true, grande: true }) + '</div>' +
      '<ul class="qmb-lista">' +
      '<li><b>17 es Z.</b> El cloro tiene 17 protones. Si es neutro, también 17 electrones.</li>' +
      '<li><b>35,45 es la masa atómica.</b> Es el promedio de sus isótopos: por eso tiene decimales.</li></ul>' +
      OJO('La masa atómica (35,45) <b>no</b> es el número de masa A. A es un entero, va en cada isótopo (³⁵Cl, ³⁷Cl) y no está en la tabla.'),
    mas: () =>
      '<p><b>Otro ejemplo:</b> el calcio.</p>' +
      '<div class="dibujo qmb-cas-peq">' + casilla(20, {}) + '</div>' +
      '<p>Z = 20: tiene 20 protones. Su masa atómica es 40,078.</p>' +
      '<p>¿Por qué decimales? En la naturaleza hay varios isótopos del calcio. La tabla trae su masa promedio.</p>',
    bloques: [
      {
        tipo: 'opciones', columnas: 2,
        enunciado: '1. ¿Cuántos protones tiene un átomo de cloro?',
        opciones: [
          { t: '35', fb: 'Casi. 35,45 es la masa atómica. Los protones los da Z: 17.' },
          { t: '17', ok: true, fb: '¡Eso! Z = 17: el cloro tiene 17 protones.' },
          { t: '18', fb: 'Casi. 18 es el Z del argón, la casilla vecina. El cloro tiene Z = 17.' },
          { t: '52', fb: 'Casi. No se suman los números. Z = 17 ya es la cantidad de protones.' }
        ],
        solucion: 'Busca el número de arriba, Z = 17: son los protones.'
      },
      {
        tipo: 'opciones',
        enunciado: '2. Un amigo dice: «El número de masa A del cloro es 35,45». ¿Tiene razón?',
        opciones: [
          { t: 'Sí, es el número de abajo de la casilla', fb: 'Casi. Ese número es la masa atómica, un promedio con decimales. A es entero: protones más neutrones.' },
          { t: 'No: 35,45 es la masa atómica. A es entero, como 35 o 37', ok: true, fb: '¡Eso! El ³⁵Cl tiene A = 35 y el ³⁷Cl tiene A = 37. La tabla trae el promedio.' },
          { t: 'No: el número de masa es 17', fb: 'Casi. 17 es Z, los protones. A = protones + neutrones, y es entero.' }
        ],
        solucion: 'La masa atómica (35,45) es un promedio. A es entero y depende del isótopo.'
      }
    ]
  });

  LAMINAS.push({
    id: 'L53', num: 53, cap: 3, chip: 'SÍMBOLO',
    titulo: 'Los símbolos',
    html: () =>
      REGLA('Un símbolo tiene 1 o 2 letras: la primera va en mayúscula y la segunda, en minúscula.', 'SÍMBOLO') +
      '<div class="qmb-simbolos">' +
      [['C', 'carbono'], ['Ca', 'calcio'], ['Cl', 'cloro'], ['Co', 'cobalto']].map(p => '<div class="qmb-sim-caja"><b class="qmb-sim">' + p[0] + '</b><span>' + p[1] + '</span></div>').join('') +
      '</div>' +
      '<div class="qmb-vs"><div><b class="qmb-sim">Co</b><span>cobalto: <b>1 elemento</b></span></div>' +
      '<div><b class="qmb-sim">CO</b><span>C + O: <b>un compuesto</b> (monóxido de carbono)</span></div></div>' +
      OJO('Cada mayúscula empieza un símbolo nuevo. Por eso <b>Co</b> y <b>CO</b> no son lo mismo.'),
    mas: () =>
      '<p><b>Otro ejemplo:</b> <b>No</b> es el nobelio, el elemento 102. <b>NO</b>, con dos mayúsculas, es un gas hecho de nitrógeno y oxígeno.</p>' +
      '<p>Cuenta las mayúsculas y sabrás cuántos elementos hay escritos.</p>',
    bloques: [{
      tipo: 'opciones', columnas: 2,
      enunciado: '¿Cómo se escribe el símbolo del magnesio?',
      opciones: [
        { t: 'MG', fb: 'Casi. La segunda letra va en minúscula: Mg. Con dos mayúsculas parecerían dos elementos.' },
        { t: 'mg', fb: 'Casi. «mg» es miligramo. El símbolo empieza con mayúscula: Mg.' },
        { t: 'Mg', ok: true, fb: '¡Eso! Mayúscula y luego minúscula: Mg.' },
        { t: 'mG', fb: 'Casi. Es al revés: la primera en mayúscula y la segunda en minúscula. Mg.' }
      ],
      solucion: 'Primera letra en mayúscula y segunda en minúscula: Mg.'
    }]
  });

  LAMINAS.push({
    id: 'L54', num: 54, cap: 3, chip: 'TABLA', masAlFallar: true,
    titulo: 'Periodos y grupos',
    html: () =>
      REGLA('Las filas se llaman periodos: hay 7. Las columnas se llaman grupos: hay 18.', 'TABLA') +
      '<div class="dibujo qmb-mapa">' + mapa({ periodo: 4, grupo: 2, marcar: [20], aria: 'Mapa de la tabla: el calcio está donde se cruzan la fila del periodo 4 y la columna del grupo 2' }) + '</div>' +
      '<p class="qmb-pie">El calcio (Ca) está en el <b>periodo 4</b> (fila) y en el <b>grupo 2</b> (columna).</p>' +
      '<p>Los grupos tienen <b>dos numeraciones</b>, y las dos salen en los exámenes:</p>' +
      tablaAB() +
      '<p class="peq">Los grupos del 3 al 12 son los <b>B</b>. Truco para los A del 13 al 18: quita el 1 de adelante. El 17 queda 7: VIIA.</p>' +
      OJO('Algunos libros dicen «grupos = filas». Es al revés: los grupos son <b>columnas</b> y los periodos, <b>filas</b>.'),
    mas: () =>
      '<p><b>Otro ejemplo:</b> el potasio (K) está en el periodo 4 y en el grupo 1 (IA).</p>' +
      '<div class="dibujo qmb-mapa qmb-mapa-peq">' + mapa({ periodo: 4, grupo: 1, marcar: [19], aria: 'El potasio está en el periodo 4 y en el grupo 1' }) + '</div>' +
      '<p>Los periodos no miden lo mismo: tienen 2, 8, 8, 18, 18, 32 y 32 elementos. En total suman 118.</p>',
    bloques: [{
      tipo: 'custom',
      render(el, api) {
        retosTabla(el, api, {
          id: 'L54', num: 54, colorear: 'ninguno', numeracion: 'ambas',
          retos: [
            {
              enunciado: 'Toca un elemento del <b>periodo 2</b>.',
              ok: (e) => e.periodo === 2,
              okFb: (e) => '¡Eso! ' + esc(e.nombre) + ' está en la fila 2: el periodo 2.',
              miss: (e) => 'Casi. ' + esc(e.nombre) + ' está en el periodo ' + e.periodo + (e.grupo === 2 ? ', pero en la columna 2' : '') + '. El periodo 2 es la <b>fila</b> 2: va del litio (Li) al neón (Ne).',
              solZ: (e) => e.periodo === 2,
              solucion: 'la fila 2 va del litio (Li) al neón (Ne).'
            },
            {
              enunciado: 'Ahora toca uno del <b>grupo 2 (IIA)</b>.',
              ok: (e) => e.grupo === 2,
              okFb: (e) => '¡Eso! ' + esc(e.nombre) + ' está en la columna 2: el grupo 2 (IIA).',
              miss: (e) => 'Casi. ' + esc(e.nombre) + ' está en el ' + grupoTxt(e) + '. El grupo 2 es la <b>columna</b> 2: berilio, magnesio, calcio…',
              solZ: (e) => e.grupo === 2,
              solucion: 'la columna 2 empieza con el berilio (Be) y baja hasta el radio (Ra).'
            }
          ]
        });
      }
    }]
  });

  // Tarjetas de familias (lámina 55)
  const FAMS55 = [
    ['alcalino', 'Grupo 1 (IA), sin el H', 'Li, Na, K', 'Metales blandos que reaccionan con el agua.'],
    ['alcalinoterreo', 'Grupo 2 (IIA)', 'Be, Mg, Ca', 'Aquí está el calcio de tus huesos.'],
    ['transicion', 'Grupos 3 al 12 (los B)', 'Fe, Cu, Ag, Au', 'Los metales que usas a diario.'],
    ['halogeno', 'Grupo 17 (VIIA)', 'F, Cl, Br, I', 'El cloro de la piscina y el yodo de la sal.'],
    ['gas-noble', 'Grupo 18 (VIIIA)', 'He, Ne, Ar', 'Casi no reaccionan con nada.'],
    ['lantanido', 'Las 2 filas de abajo', 'lantánidos y actínidos', 'Van aparte para que la tabla no sea tan ancha.']
  ];
  LAMINAS.push({
    id: 'L55', num: 55, cap: 3, chip: 'FAMILIAS', masAlFallar: true,
    titulo: 'Las familias',
    html: () =>
      REGLA('Los elementos de un mismo grupo se parecen: forman una familia.', 'FAMILIAS') +
      '<div class="dibujo qmb-mapa">' + mapa({ colorear: 'familia', aria: 'Mapa de la tabla pintado por familias' }) + '</div>' +
      '<ul class="qmb-fams">' + FAMS55.map(f =>
        '<li><span class="qmb-fam-color" style="background:' + fam(f[0]).color + '"></span><div><b>' + (f[0] === 'lantanido' ? 'Lantánidos y actínidos' : fam(f[0]).nombre) + '</b> · ' + f[1] +
        '<br><span class="peq tinta-2">' + f[2] + '. ' + f[3] + '</span></div></li>').join('') + '</ul>' +
      '<p class="peq">Otros nombres que verás: térreos (13), carbonoideos (14), nitrogenoideos (15) y calcógenos o anfígenos (16).</p>' +
      OJO('El hidrógeno (H) está en el grupo 1, pero <b>no</b> es un metal alcalino: es un gas y es no metal.'),
    mas: () =>
      '<p><b>Otro ejemplo:</b> el sodio (Na) y el potasio (K) son de la misma familia, los alcalinos.</p>' +
      '<p>Los dos son metales blandos, reaccionan con el agua y forman sales parecidas: NaCl y KCl.</p>' +
      '<p>Se parecen porque tienen igual el arreglo de sus electrones de afuera. Eso lo verás en la próxima clase.</p>',
    bloques: [{
      tipo: 'custom',
      render(el, api) {
        retosTabla(el, api, {
          id: 'L55', num: 55, colorear: 'familia', numeracion: 'ambas',
          retos: [
            {
              enunciado: 'Toca un <b>metal alcalino</b>.',
              ok: (e) => e.categoria === 'alcalino',
              okFb: (e) => '¡Eso! ' + esc(e.nombre) + ' es un metal alcalino, del grupo 1.',
              miss: (e) => e.z === 1 ? 'Casi. El H está en el grupo 1, pero no es alcalino: es un gas no metal. Los alcalinos están debajo de él.'
                : 'Casi. ' + esc(e.nombre) + ' es de «' + esc(fam(e.categoria).nombre.toLowerCase()) + '». Los alcalinos están en el grupo 1, debajo del H.',
              solZ: (e) => e.categoria === 'alcalino',
              solucion: 'los alcalinos son Li, Na, K, Rb, Cs y Fr. El H no cuenta.'
            },
            {
              enunciado: 'Ahora toca un <b>halógeno</b>.',
              ok: (e) => e.categoria === 'halogeno',
              okFb: (e) => '¡Eso! ' + esc(e.nombre) + ' es un halógeno, del grupo 17 (VIIA).',
              miss: (e) => 'Casi. ' + esc(e.nombre) + ' es de «' + esc(fam(e.categoria).nombre.toLowerCase()) + '». Los halógenos están en el grupo 17 (VIIA): flúor, cloro, bromo, yodo…',
              solZ: (e) => e.categoria === 'halogeno',
              solucion: 'los halógenos están en la penúltima columna, el grupo 17.'
            }
          ]
        });
      }
    }]
  });

  function tarjetaSim(sim, nombre) { return '<span class="qmb-sim">' + sim + '</span> <span class="qmb-sim-nom">' + nombre + '</span>'; }
  LAMINAS.push({
    id: 'L56', num: 56, cap: 3, chip: 'METALES', masAlFallar: true,
    titulo: 'Metales, no metales y metaloides',
    html: () =>
      REGLA('Metales, a la izquierda y al centro. No metales, a la derecha. Metaloides, en la escalera entre ellos.', 'METALES') +
      '<div class="dibujo qmb-mapa">' + mapa({ colorear: 'tipo', aria: 'Mapa de la tabla: metales a la izquierda y al centro, no metales a la derecha y metaloides en una escalera entre ellos' }) + '</div>' +
      leyendaTipo() +
      '<div class="qmb-tipos">' +
      '<div class="qmb-tipo"><b>Metales</b><span>Brillan y conducen el calor y la electricidad. Se estiran en hilos y láminas. Son sólidos, menos el mercurio (Hg), que es líquido.</span></div>' +
      '<div class="qmb-tipo"><b>No metales</b><span>En general no brillan y conducen mal. Muchos son gases, como O, N y Cl. El bromo (Br) es líquido.</span></div>' +
      '<div class="qmb-tipo"><b>Metaloides</b><span>Son 6: B, Si, Ge, As, Sb y Te. Tienen propiedades intermedias. El silicio va en los chips.</span></div>' +
      '</div>' +
      OJO('El hidrógeno (H) está arriba a la izquierda, pero es un <b>no metal</b>.'),
    mas: () =>
      '<p><b>Otro ejemplo:</b> el grupo 14 (IVA) tiene los 3 tipos. El carbono (C) es no metal; el silicio (Si) y el germanio (Ge), metaloides; el estaño (Sn) y el plomo (Pb), metales.</p>' +
      '<p>Algunos libros dicen que C, Sn y Pb son metaloides. No es así: fíjate en el color de cada casilla.</p>',
    bloques: [{
      tipo: 'clasificar',
      enunciado: 'Clasifica cada elemento. Si dudas, mira el mapa.',
      botones: ['METAL', 'NO METAL', 'METALOIDE'],
      tarjetas: [
        { html: tarjetaSim('Fe', 'hierro'), correcta: 'METAL', fb: 'Casi. El hierro brilla y conduce: es un metal de transición (grupo 8).', okFb: '¡Eso! El hierro es un metal.' },
        { html: tarjetaSim('O', 'oxígeno'), correcta: 'NO METAL', fb: 'Casi. El oxígeno está a la derecha y es un gas: es un no metal.', okFb: '¡Eso! El oxígeno es un no metal.' },
        { html: tarjetaSim('Si', 'silicio'), correcta: 'METALOIDE', fb: 'Casi. El silicio está en la escalera: es un metaloide. Por eso sirve para los chips.', okFb: '¡Eso! El silicio es un metaloide.' },
        { html: tarjetaSim('H', 'hidrógeno'), correcta: 'NO METAL', fb: 'Casi. El H está en el grupo 1, pero es un gas no metal.', okFb: '¡Eso! Aunque está a la izquierda, el H es un no metal.' }
      ]
    }]
  });

  // Símbolos que vienen del latín: tarjetas que se abren al tocarlas
  const LATIN = [
    ['Na', 'sodio', 'natrium', 'Viene de «natrón», una sal que usaban los antiguos egipcios.'],
    ['K', 'potasio', 'kalium', 'Viene del árabe «al-qali»: cenizas de plantas.'],
    ['Fe', 'hierro', 'ferrum', 'De ahí viene la palabra «ferretería».'],
    ['Cu', 'cobre', 'cuprum', 'Por Chipre, una isla famosa por sus minas de cobre.'],
    ['Ag', 'plata', 'argentum', 'Argentina se llama así por la plata.'],
    ['Au', 'oro', 'aurum', '¡No es O! La O es del oxígeno.'],
    ['Hg', 'mercurio', 'hydrargyrum', 'Quiere decir «agua plateada»: es un metal líquido.'],
    ['Pb', 'plomo', 'plumbum', 'Los romanos hacían tuberías de plomo. De ahí viene «plomero».'],
    ['Sn', 'estaño', 'stannum', 'Se usa para soldar los circuitos.']
  ];
  LAMINAS.push({
    id: 'L57', num: 57, cap: 3, chip: 'SÍMBOLO',
    titulo: 'Símbolos que vienen del latín',
    html: () =>
      REGLA('Algunos símbolos vienen del nombre en latín. Por eso el hierro es Fe.', 'SÍMBOLO') +
      '<p>Toca cada tarjeta para ver su historia:</p>' +
      '<div class="qmb-latin">' + LATIN.map(l =>
        '<details class="qmb-lat"><summary><b class="qmb-sim">' + l[0] + '</b><span>' + l[1] + '</span></summary>' +
        '<p><i>' + l[2] + '</i>. ' + l[3] + '</p></details>').join('') + '</div>' +
      OJO('Potasio es <b>K</b>, no P. La P es del fósforo.'),
    mas: () =>
      '<p><b>Otro ejemplo:</b> el azufre es <b>S</b>, de <i>sulfur</i>, su nombre en latín.</p>' +
      '<p>No necesitas saber latín. Basta con estos 9 símbolos, que son los que más confunden.</p>',
    bloques: [
      {
        tipo: 'opciones', columnas: 2,
        enunciado: '1. ¿Cuál es el símbolo del potasio?',
        opciones: [
          { t: 'P', fb: 'Casi. P es el fósforo. El potasio es K, de «kalium».' },
          { t: 'Po', fb: 'Casi. Po es el polonio. El potasio es K, de «kalium».' },
          { t: 'K', ok: true, fb: '¡Eso! K, de «kalium».' },
          { t: 'Pt', fb: 'Casi. Pt es el platino. El potasio es K, de «kalium».' }
        ],
        solucion: 'Potasio viene del latín «kalium»: K.'
      },
      {
        tipo: 'opciones', columnas: 2,
        enunciado: '2. ¿Qué elemento es Ag?',
        opciones: [
          { t: 'Oro', fb: 'Casi. El oro es Au, de «aurum». Ag viene de «argentum»: la plata.' },
          { t: 'Plata', ok: true, fb: '¡Eso! Ag, de «argentum». Como Argentina.' },
          { t: 'Argón', fb: 'Casi. El argón es Ar. Ag viene de «argentum»: la plata.' },
          { t: 'Mercurio', fb: 'Casi. El mercurio es Hg. Ag viene de «argentum»: la plata.' }
        ],
        solucion: 'Ag viene de «argentum»: la plata.'
      }
    ]
  });

  LAMINAS.push({
    id: 'L58', num: 58, cap: 3,
    titulo: 'Explora a tu gusto',
    html: () =>
      '<p>Cambia los colores y mira cómo se agrupan los elementos.</p>' +
      '<p>Toca una casilla para ver sus datos. Toca un color de la leyenda para resaltar esos elementos.</p>',
    mas: () =>
      '<p><b>Otro ejemplo:</b> pon «Metales y no metales» y busca el bromo (Br), en el grupo 17.</p>' +
      '<p>Es un no metal líquido: junto con el mercurio, los dos únicos elementos líquidos a 25 °C.</p>',
    bloques: [{
      tipo: 'custom',
      render(el, api) {
        const MODOS = [['familia', 'Familias'], ['tipo', 'Metales y no metales'], ['ninguno', 'Sin colores']];
        el.innerHTML = '<div class="qmb-modos" data-noswipe><span class="seg-ctrl" role="group" aria-label="Colores de la tabla">' +
          MODOS.map((m, i) => '<button type="button" data-col="' + m[0] + '" aria-pressed="' + (i === 0) + '">' + m[1] + '</button>').join('') +
          '</span></div><div class="qmb-tabla" data-noswipe></div>';
        const zona = el.querySelector('.qmb-tabla');
        let t = null;
        const pintar = (col) => {
          if (t && t.destruir) t.destruir();
          t = tablaEn(zona, { modo: 'explorar', colorear: col, mostrarNumeracion: 'ambas' });
        };
        el.querySelectorAll('[data-col]').forEach(b => b.addEventListener('click', () => {
          el.querySelectorAll('[data-col]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
          pintar(b.getAttribute('data-col'));
        }));
        pintar('familia');
        api.completar(true);
      }
    }]
  });

  LAMINAS.push({
    id: 'L59', num: 59, cap: 3,
    titulo: '¡Retos en la tabla!',
    html: () =>
      '<p>Tres retos para usar lo que ya sabes: símbolos, familias, grupos y periodos.</p>' +
      '<p class="peq tinta-2">Pista: el periodo es la fila (número a la izquierda) y el grupo es la columna (número de arriba).</p>',
    mas: () =>
      '<p><b>Otro ejemplo:</b> el yodo (I) está en el periodo 5 y en el grupo 17 (VIIA).</p>' +
      '<p>Para leer la posición, sigue la fila hasta el número de la izquierda. Luego sube por la columna hasta el número de arriba.</p>',
    bloques: [
      {
        tipo: 'custom',
        render(el, api) {
          retosTabla(el, api, {
            id: 'L59', num: 59, colorear: 'ninguno', numeracion: 'ambas',
            retos: [
              {
                enunciado: 'Toca el <b>oro</b>.',
                ok: (e) => e.z === 79,
                okFb: '¡Eso! Au, de «aurum». Está en el periodo 6, grupo 11.',
                miss: (e) => e.simbolo === 'O' ? 'Casi. O es el oxígeno. El oro es Au, de «aurum».'
                  : 'Casi. Tocaste ' + esc(e.nombre) + ' (' + e.simbolo + '). El oro es Au, de «aurum».',
                solZ: [79],
                solucion: 'el oro (Au) está en el periodo 6, grupo 11 (IB).'
              },
              {
                enunciado: 'Encuentra un <b>gas noble</b>.',
                ok: (e) => e.categoria === 'gas-noble',
                okFb: (e) => '¡Eso! ' + esc(e.nombre) + ' es un gas noble: casi no reacciona con nada.',
                miss: (e) => e.z === 1 ? 'Casi. El H es un gas, pero no es noble. Los gases nobles están en la última columna, el grupo 18.'
                  : 'Casi. ' + esc(e.nombre) + ' es de «' + esc(fam(e.categoria).nombre.toLowerCase()) + '». Los gases nobles están en la última columna: grupo 18 (VIIIA).',
                solZ: (e) => e.categoria === 'gas-noble',
                solucion: 'toda la última columna, el grupo 18: He, Ne, Ar, Kr, Xe, Rn y Og.'
              },
              {
                enunciado: 'Toca el <b>calcio</b> (Ca).',
                ok: (e) => e.z === 20,
                okFb: '¡Eso! Ahí está el calcio. Mira los números de su fila y de su columna.',
                miss: (e) => e.simbolo === 'C' ? 'Casi. C es el carbono. El calcio es Ca: está a la izquierda, debajo del magnesio (Mg).'
                  : 'Casi. Tocaste ' + esc(e.nombre) + ' (' + e.simbolo + '). Busca Ca: está a la izquierda, debajo del magnesio (Mg).',
                solZ: [20],
                solucion: 'el calcio (Ca) está a la izquierda, debajo del magnesio.'
              }
            ]
          });
        }
      },
      {
        tipo: 'opciones',
        enunciado: '¿En qué grupo y en qué periodo está el calcio?',
        opciones: [
          { t: 'Grupo 4, periodo 2', fb: 'Casi. Los cambiaste: el periodo es la fila y el grupo es la columna. El calcio está en la fila 4 y la columna 2.' },
          { t: 'Grupo 2 (IIA), periodo 4', ok: true, fb: '¡Eso! Columna 2, fila 4. Es un alcalinotérreo, como el magnesio.' },
          { t: 'Grupo 20, periodo 4', fb: 'Casi. 20 es su número atómico Z. El grupo es la columna: 2.' },
          { t: 'Grupo 2 (IIB), periodo 4', fb: 'Casi. El grupo 2 es IIA. Los grupos B son los del centro, del 3 al 12.' }
        ],
        solucion: 'El calcio está en la columna 2 (grupo 2, IIA) y en la fila 4 (periodo 4).'
      }
    ]
  });

  LAMINAS.push({
    id: 'L60', num: 60, cap: 3, chip: 'TABLA',
    titulo: 'La tabla no se memoriza: se usa',
    html: () =>
      REGLA('La tabla no se memoriza: se usa. Con el periodo y el grupo encuentras cualquier elemento.', 'TABLA') +
      '<ol class="qmb-pasos"><li>Busca la <b>fila</b> del periodo.</li><li>Busca la <b>columna</b> del grupo.</li><li>Donde se cruzan, está el elemento.</li></ol>' +
      '<div class="dibujo qmb-mapa">' + mapa({ periodo: 4, grupo: 8, marcar: [26], aria: 'La fila del periodo 4 y la columna del grupo 8 se cruzan en el hierro' }) + '</div>' +
      '<p class="qmb-pie">Periodo 4 y grupo 8: se cruzan en el hierro (Fe).</p>' +
      '<p>Lo que sí conviene recordar: los nombres de las familias y dónde están los metales.</p>',
    mas: () =>
      '<p><b>Otro ejemplo:</b> periodo 2 y grupo 16 (VIA). Se cruzan en el oxígeno (O).</p>' +
      '<p>El periodo y el grupo son como la calle y el número de una casa: con los dos llegas.</p>',
    bloques: [
      {
        tipo: 'custom',
        render(el, api) {
          retosTabla(el, api, {
            id: 'L60', num: 60, colorear: 'ninguno', numeracion: 'ambas',
            retos: [{
              enunciado: 'Toca el elemento del <b>periodo 3</b> y el <b>grupo 17 (VIIA)</b>.',
              ok: (e) => e.z === 17,
              okFb: '¡Eso! Es el cloro (Cl), un halógeno: el de la piscina.',
              miss: (e) => e.grupo === 17 ? 'Casi. La columna está bien, pero estás en el periodo ' + e.periodo + '. Busca la fila 3.'
                : e.periodo === 3 ? 'Casi. La fila está bien. Ahora avanza hasta la columna 17, la penúltima.'
                  : 'Casi. ' + esc(e.nombre) + ' está en el periodo ' + e.periodo + ' y en el ' + grupoTxt(e) + '. Busca la fila 3 y la columna 17.',
              solZ: [17],
              solucion: 'la fila 3 y la columna 17 se cruzan en el cloro (Cl).'
            }]
          });
        }
      },
      {
        tipo: 'opciones',
        enunciado: 'El yodo (I) está en el mismo grupo que el cloro. ¿Qué puedes decir del yodo?',
        opciones: [
          { t: 'Es un gas noble', fb: 'Casi. Los gases nobles están en el grupo 18. El yodo está en el 17, con el cloro: es un halógeno.' },
          { t: 'Tiene los mismos protones que el cloro', fb: 'Casi. Cada elemento tiene su propio Z: el cloro 17 y el yodo 53. Se parecen porque son de la misma familia.' },
          { t: 'Es un halógeno y se parece al cloro', ok: true, fb: '¡Eso! Misma columna, misma familia. Por eso el yodo también desinfecta heridas.' },
          { t: 'Es un metal alcalino', fb: 'Casi. Los alcalinos están en el grupo 1. El yodo está en el 17: es un halógeno.' }
        ],
        solucion: 'Mismo grupo quiere decir misma familia: el yodo es un halógeno, como el cloro.'
      }
    ]
  });

  // Barras: los 6 elementos que más hay en tu cuerpo (por masa, valores aproximados)
  const CUERPO = [['O', 'oxígeno', 65], ['C', 'carbono', 18], ['H', 'hidrógeno', 10], ['N', 'nitrógeno', 3], ['Ca', 'calcio', 1.5], ['P', 'fósforo', 1]];
  function svgCuerpo61() {
    const aria = 'De cada 100 kg de cuerpo: oxígeno 65, carbono 18, hidrógeno 10, nitrógeno 3, calcio 1,5 y fósforo 1 (aproximado)';
    let s = '<svg viewBox="0 0 320 172" role="img" aria-label="' + aria + '"><title>' + aria + '</title>';
    CUERPO.forEach((c, i) => {
      const y = 8 + i * 27, w = Math.max(3, c[2] / 65 * 160);
      s += '<text x="4" y="' + (y + 15) + '" font-size="15" font-weight="900" style="fill:var(--ink)">' + c[0] + '</text>' +
        '<text x="30" y="' + (y + 15) + '" font-size="12.5" font-weight="700" style="fill:var(--ink-2)">' + c[1] + '</text>' +
        '<rect x="104" y="' + (y + 2) + '" width="' + w.toFixed(1) + '" height="17" rx="5" style="fill:var(--primary)"/>' +
        '<text x="' + (104 + w + 6).toFixed(1) + '" y="' + (y + 15) + '" font-size="13" font-weight="800" style="fill:var(--ink)">' + String(c[2]).replace('.', ',') + ' %</text>';
    });
    return s + '</svg>';
  }
  LAMINAS.push({
    id: 'L61', num: 61, cap: 3, chip: 'SALUD',
    titulo: 'Los elementos de tu cuerpo',
    html: () =>
      REGLA('Seis elementos forman casi el 99 % de tu cuerpo: O, C, H, N, Ca y P.', 'SALUD') +
      '<div class="dibujo">' + svgCuerpo61() + '</div>' +
      '<p class="peq tinta-2 centro">Porcentaje de tu masa, aproximado. Mucho O y H: tu cuerpo es casi dos tercios agua.</p>' +
      '<p>Otros van en poca cantidad, pero sin ellos no vives:</p>' +
      '<ul class="qmb-lista">' +
      '<li><b>Fe</b> (hierro): en la hemoglobina lleva el oxígeno. Si falta, hay anemia.</li>' +
      '<li><b>Na</b> y <b>K</b> (sodio y potasio): hacen funcionar tus nervios y tu corazón.</li>' +
      '<li><b>I</b> (yodo): lo usa la tiroides. Por eso la sal es yodada.</li></ul>',
    mas: () =>
      '<p><b>Otro ejemplo:</b> el calcio (Ca). El 99 % del calcio de tu cuerpo está en tus huesos y dientes.</p>' +
      '<p>Por eso la leche, el queso y los granos importan en la adolescencia: es cuando más hueso se forma.</p>',
    bloques: [
      {
        tipo: 'custom',
        render(el, api) {
          retosTabla(el, api, {
            id: 'L61', num: 61, colorear: 'ninguno', numeracion: 'ambas',
            retos: [{
              enunciado: 'Toca el elemento de la hemoglobina, el que lleva el oxígeno en tu sangre.',
              ok: (e) => e.z === 26,
              okFb: '¡Eso! El hierro (Fe), de «ferrum». Hay hierro en las lentejas, el fréjol y la carne.',
              miss: (e) => e.z === 8 ? 'Casi. El oxígeno es lo que se lleva. El que lo lleva es el hierro, Fe.'
                : 'Casi. Tocaste ' + esc(e.nombre) + '. Es el hierro, Fe (de «ferrum»): periodo 4, grupo 8.',
              solZ: [26],
              solucion: 'el hierro (Fe) está en el periodo 4, grupo 8.'
            }]
          });
        }
      },
      {
        tipo: 'opciones',
        enunciado: 'Con la diarrea pierdes agua y sales. El suero oral repone sobre todo dos elementos. ¿Cuáles?',
        opciones: [
          { t: 'Hierro (Fe) y calcio (Ca)', fb: 'Casi. Son importantes, pero el suero repone las sales que se pierden: sodio (Na) y potasio (K).' },
          { t: 'Helio (He) y neón (Ne)', fb: 'Casi. Son gases nobles: casi no reaccionan. El suero repone sodio (Na) y potasio (K).' },
          { t: 'Sodio (Na) y potasio (K)', ok: true, fb: '¡Eso! Na y K. Por eso el suero oral sabe un poco salado.' },
          { t: 'Oro (Au) y plata (Ag)', fb: 'Casi. Son metales preciosos, no nutrientes. El suero repone sodio (Na) y potasio (K).' }
        ],
        solucion: 'El suero oral repone sodio (Na) y potasio (K), además de agua y glucosa.'
      }
    ]
  });

  LAMINAS.push({
    id: 'L62', num: 62, cap: 3,
    titulo: 'Minichequeo 3',
    html: '<p>Tres preguntas para cerrar el capítulo. Si dudas, piensa en la tabla: para eso está.</p>',
    bloques: [{
      tipo: 'chequeo',
      repaso: [52, 54, 56],
      salida: '¡Minichequeo 3 superado! Ya sabes leer y usar la tabla periódica.',
      preguntas: [
        {
          tipo: 'opciones',
          enunciado: '1. En la casilla del calcio aparecen 20 y 40,078. ¿Qué es el 20?',
          opciones: [
            { t: 'La masa atómica', fb: 'Casi. La masa atómica es 40,078, el número con decimales. 20 es Z: los protones.' },
            { t: 'El número atómico Z: 20 protones', ok: true, fb: '¡Eso! Z = 20: el calcio tiene 20 protones.' },
            { t: 'El número de masa A', fb: 'Casi. A no está en la casilla. 20 es Z: los protones.' },
            { t: 'El número de neutrones', fb: 'Casi. Los neutrones no aparecen en la casilla. 20 es Z: los protones.' }
          ],
          solucion: 'El número de arriba es Z, el número atómico: 20 protones.'
        },
        {
          tipo: 'opciones', columnas: 2,
          enunciado: '2. El cloro está en el grupo 17. ¿Cómo se escribe en la numeración A/B?',
          opciones: [
            { t: 'VIIB', fb: 'Casi. Los grupos B son los del centro, del 3 al 12. El 17 es A: VIIA.' },
            { t: 'IA', fb: 'Casi. IA es el grupo 1. Para el 17, quita el 1 de adelante: 7, VIIA.' },
            { t: 'XVIIA', fb: 'Casi. En A/B no se pasa de VIII. Quita el 1 de adelante: VIIA.' },
            { t: 'VIIA', ok: true, fb: '¡Eso! 17 es VIIA: la familia de los halógenos.' }
          ],
          solucion: 'Del 13 al 18, quita el 1 de adelante: 17 queda 7, VIIA.'
        },
        {
          tipo: 'opciones', columnas: 2,
          enunciado: '3. ¿Cuál de estos es un metaloide?',
          opciones: [
            { t: 'Carbono (C)', fb: 'Casi. El carbono es no metal, aunque algunos libros digan otra cosa. Aquí el metaloide es el silicio.' },
            { t: 'Silicio (Si)', ok: true, fb: '¡Eso! El silicio es un metaloide: el de los chips.' },
            { t: 'Estaño (Sn)', fb: 'Casi. El estaño es un metal. Metaloides: B, Si, Ge, As, Sb y Te.' },
            { t: 'Sodio (Na)', fb: 'Casi. El sodio es un metal alcalino. Aquí el metaloide es el silicio.' }
          ],
          solucion: 'Los metaloides son B, Si, Ge, As, Sb y Te: aquí, el silicio.'
        }
      ],
      segundo: [
        {
          tipo: 'opciones',
          enunciado: '1. En la casilla del hierro aparecen 26 y 55,845. ¿Qué es el 26?',
          opciones: [
            { t: 'El número atómico Z: 26 protones', ok: true, fb: '¡Eso! Z = 26: el hierro tiene 26 protones.' },
            { t: 'La masa atómica', fb: 'Casi. La masa atómica es 55,845, el número con decimales. 26 es Z: los protones.' },
            { t: 'El número de masa A', fb: 'Casi. A no está en la casilla. 26 es Z: los protones.' },
            { t: 'El número de neutrones', fb: 'Casi. Los neutrones no aparecen en la casilla. 26 es Z: los protones.' }
          ],
          solucion: 'El número de arriba es Z, el número atómico: 26 protones.'
        },
        {
          tipo: 'opciones', columnas: 2,
          enunciado: '2. El oxígeno está en el grupo 16. ¿Cómo se escribe en la numeración A/B?',
          opciones: [
            { t: 'VIA', ok: true, fb: '¡Eso! 16 es VIA.' },
            { t: 'VIB', fb: 'Casi. Los grupos B son los del centro, del 3 al 12. El 16 es A: VIA.' },
            { t: 'VIIA', fb: 'Casi. VIIA es el grupo 17, el del cloro. El oxígeno está en el 16: VIA.' },
            { t: 'XVIA', fb: 'Casi. En A/B no se pasa de VIII. Quita el 1 de adelante: VIA.' }
          ],
          solucion: 'Del 13 al 18, quita el 1 de adelante: 16 queda 6, VIA.'
        },
        {
          tipo: 'opciones', columnas: 2,
          enunciado: '3. ¿Cuál de estos es un metaloide?',
          opciones: [
            { t: 'Plomo (Pb)', fb: 'Casi. El plomo es un metal, aunque algunos libros digan otra cosa. Aquí el metaloide es el boro.' },
            { t: 'Aluminio (Al)', fb: 'Casi. El aluminio, vecino del boro, es un metal. Metaloides: B, Si, Ge, As, Sb y Te.' },
            { t: 'Oxígeno (O)', fb: 'Casi. El oxígeno es un no metal. Aquí el metaloide es el boro.' },
            { t: 'Boro (B)', ok: true, fb: '¡Eso! El boro es un metaloide.' }
          ],
          solucion: 'Los metaloides son B, Si, Ge, As, Sb y Te: aquí, el boro.'
        }
      ]
    }]
  });

  LAMINAS.push({
    id: 'L63', num: 63, cap: 3,
    titulo: (c) => '¡Capítulo 3 listo, ' + c.nombre + '!',
    html: cierreCap(3,
      'Ya sabes leer una casilla, ubicar periodos y grupos con sus dos numeraciones, y reconocer familias, metales, no metales y metaloides.',
      'volvemos a la pregunta del inicio, te llevas tu resumen en una foto y empieza el juego.')
  });

  // ---------------- CIERRE ----------------
  const GANCHOS = ['nada', 'mitad', 'casi-todo', 'nose'];
  function ganchoNorm(g) {
    if (g == null || g === '') return null;
    const s = String(g).trim().toLowerCase();
    if (GANCHOS.indexOf(s) >= 0) return s;
    if (/casi todo/.test(s)) return 'casi-todo';
    if (/mitad/.test(s)) return 'mitad';
    if (/nada/.test(s)) return 'nada';
    return 'nose';
  }
  const GANCHO_TXT = { 'nada': '«Casi nada»', 'mitad': '«La mitad»', 'casi-todo': '«Casi todo»', 'nose': '«No sé»' };

  function svgAtomo70() {
    const aria = 'Un átomo: un núcleo diminuto en el centro, electrones lejos, y todo lo demás es espacio vacío';
    let s = '<svg viewBox="0 0 320 170" role="img" aria-label="' + aria + '"><title>' + aria + '</title>' +
      '<circle cx="110" cy="85" r="76" style="fill:var(--zero-soft);stroke:var(--ink-3)" stroke-width="2" stroke-dasharray="5 5"/>' +
      '<circle cx="110" cy="85" r="44" fill="none" style="stroke:var(--ink-3)" stroke-width="1.5" stroke-dasharray="4 5"/>';
    [[110, 41], [66, 85], [164, 51], [56, 120]].forEach(p => {
      s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="5.5" style="fill:var(--neg)"/>';
    });
    s += '<circle cx="110" cy="85" r="3" style="fill:var(--pos)"/>' +
      '<path d="M114 83 C150 70 190 60 214 52" fill="none" style="stroke:var(--ink)" stroke-width="2" stroke-linecap="round"/>' +
      '<text x="218" y="46" font-size="14" font-weight="900" style="fill:var(--ink)">núcleo</text>' +
      '<text x="218" y="63" font-size="12" font-weight="700" style="fill:var(--ink-2)">diminuto, con casi</text>' +
      '<text x="218" y="78" font-size="12" font-weight="700" style="fill:var(--ink-2)">toda la masa</text>' +
      '<path d="M150 118 C180 126 200 128 214 128" fill="none" style="stroke:var(--ink)" stroke-width="2" stroke-linecap="round"/>' +
      '<text x="218" y="126" font-size="14" font-weight="900" style="fill:var(--ink)">todo esto:</text>' +
      '<text x="218" y="143" font-size="12" font-weight="700" style="fill:var(--ink-2)">espacio vacío</text>';
    return s + '</svg>';
  }

  LAMINAS.push({
    id: 'L70', num: 70, cap: 4,
    entrada: 'Cierre · Volvamos al inicio, tu resumen y ¡a jugar!',
    titulo: 'Volvamos al inicio',
    html: () =>
      '<p>Al inicio te preguntamos: <b>¿cuánto de un átomo es espacio vacío?</b></p>' +
      '<div class="dibujo">' + svgAtomo70() + '</div>' +
      '<p>Rutherford lo descubrió con la lámina de oro: casi todas las partículas la atravesaban sin chocar.</p>',
    bloques: [
      {
        tipo: 'opciones',
        enunciado: '¿Y ahora qué respondes? ¿Cuánto de un átomo es espacio vacío?',
        opciones: [
          { t: 'Casi nada', fb: 'Casi. Casi todas las partículas atravesaban el oro sin chocar: el átomo es casi todo vacío.' },
          { t: 'La mitad', fb: 'Casi. Es mucho más que la mitad. El núcleo es diminuto y el resto es vacío.' },
          { t: 'Casi todo', ok: true, fb: '¡Eso! Casi todo el átomo es espacio vacío.' }
        ],
        solucion: 'Casi todo el átomo es vacío: el núcleo es diminuto y los electrones andan lejos.'
      },
      {
        tipo: 'revelar',
        html: (c) => {
          const g = ganchoNorm(c.gancho);
          let msg;
          if (g === 'casi-todo') msg = '¡Le atinaste desde el inicio, ' + c.nombre + '! Ahora además sabes cómo se descubrió y qué hay en el núcleo.';
          else if (g === 'nada') msg = 'Al inicio pensaste «casi nada», como casi todos: las cosas se ven llenas. Ahora sabes que el átomo es casi todo vacío.';
          else if (g === 'mitad') msg = 'Al inicio dijiste «la mitad». Es mucho más: más del 99,9 % del átomo es vacío.';
          else if (g === 'nose') msg = 'Al inicio no lo sabías. Mira todo lo que aprendiste, ' + c.nombre + '.';
          else msg = 'Ahora ya lo sabes: casi todo el átomo es espacio vacío.';
          return '<div class="qmb-antes-ahora">' +
            (g ? '<div class="qmb-aa qmb-aa-antes' + (g === 'casi-todo' ? ' qmb-aa-bien' : '') + '"><span class="peq">Antes</span><span class="qmb-aa-txt">' + GANCHO_TXT[g] + '</span></div>' : '') +
            '<div class="sello qmb-aa-sello">' + svg().sello('Logro') + '</div>' +
            '<div class="qmb-aa"><span class="peq">Ahora</span><span class="qmb-aa-txt qmb-aa-ya">«Casi todo»</span></div></div>' +
            '<p class="caja-nota">' + msg + '</p>';
        }
      },
      {
        tipo: 'opciones',
        enunciado: 'Pregunta final: si casi todo el átomo es vacío, ¿dónde está casi toda su masa?',
        opciones: [
          { t: 'En los electrones', fb: 'Casi. Cada electrón tiene unas 1836 veces menos masa que un protón. La masa está en el núcleo.' },
          { t: 'Repartida por todo el átomo', fb: 'Casi. Así pensaba Thomson. Rutherford mostró que la masa está en un núcleo diminuto.' },
          { t: 'En el núcleo, que es diminuto', ok: true, fb: (c) => '¡Eso, ' + c.nombre + '! Protones y neutrones están en el núcleo: ahí está más del 99,9 % de la masa.' },
          { t: 'En el espacio vacío', fb: 'Casi. El vacío no tiene masa. Casi toda la masa está en el núcleo.' }
        ],
        solucion: 'Protones y neutrones están en el núcleo: ahí está casi toda la masa.'
      }
    ]
  });

  // Resumen de toda la clase (mismos textos en la lámina 71 y en la foto).
  // Marcas: *negrita* · {+protón} en azul (positivo) · {-electrón} en naranja (negativo) · {=neutrón} en gris.
  const RESUMEN = [
    {
      titulo: 'La materia', clave: 'materia',
      puntos: [
        'Materia: todo lo que tiene *masa* y ocupa un lugar en el espacio.',
        '*3 estados:* sólido, líquido y gaseoso. Cambios en parejas opuestas: fusión y solidificación; vaporización y condensación; sublimación y sublimación inversa.',
        'Sustancias puras: *elementos* y *compuestos*. Mezclas: *homogéneas* y *heterogéneas*. Una mezcla no es un compuesto.',
        'Cambio *químico*: se forma una sustancia nueva (gas, color, luz, olor). En el cambio *físico*, no.'
      ]
    },
    {
      titulo: 'El átomo', clave: 'atomo',
      puntos: [
        '{+Protón} (+1) y {=neutrón} (0) en el núcleo; {-electrón} (−1) alrededor. Casi todo el átomo es vacío.',
        '*Z* = protones: define el elemento. *A* = protones + neutrones. Neutrones = A − Z.',
        '*Isótopos:* mismo Z y distinto A, como ¹²C y ¹⁴C.',
        '{+Catión}: perdió electrones. {-Anión}: ganó electrones. Los protones no cambian.'
      ]
    },
    {
      titulo: 'La tabla periódica', clave: 'tabla',
      puntos: [
        '118 elementos ordenados por Z: *7 periodos* (filas) y *18 grupos* (columnas).',
        'Dos numeraciones: 1 = IA, 2 = IIA, del 3 al 12 = B, 17 = VIIA, 18 = VIIIA.',
        'Casilla: Z, símbolo, nombre y *masa atómica* (un promedio con decimales: no es A).',
        'Familias: alcalinos (1, sin el H), alcalinotérreos (2), transición (3 al 12), halógenos (17) y gases nobles (18).',
        'Metales a la izquierda y al centro; no metales a la derecha. Metaloides: B, Si, Ge, As, Sb y Te.',
        '*Ojo:* la tabla no se memoriza: se usa.'
      ]
    }
  ];
  function marcasHtml(str) {
    return esc(str)
      .replace(/\{([+\-=])([^}]+)\}/g, (m, k, t) => '<b class="' + (k === '+' ? 'qmb-pos' : k === '-' ? 'qmb-neg' : 'qmb-neu') + '">' + t + '</b>')
      .replace(/\*([^*]+)\*/g, '<b>$1</b>');
  }
  function resumenHtml() {
    return '<div class="qmb-resumen">' + RESUMEN.map((sec, i) =>
      '<section class="qmb-res-sec qmb-res-' + sec.clave + '"><h3><span>' + (i + 1) + '</span>' + sec.titulo + '</h3><ul>' +
      sec.puntos.map(p => '<li>' + marcasHtml(p) + '</li>').join('') + '</ul></section>').join('') + '</div>';
  }

  LAMINAS.push({
    id: 'L71', num: 71, cap: 4,
    titulo: 'Tu resumen en una foto',
    html: () => resumenHtml(),
    bloques: [{
      tipo: 'custom',
      render(el, api) {
        el.innerHTML = '<button class="btn btn-pri btn-ancho" data-noswipe>Guardar en mi galería</button>' +
          '<p class="peq tinta-2 qmb-nota">En iPhone: mantén presionada la imagen y elige <b>Guardar en Fotos</b>.</p>' +
          '<div class="qmb-foto-zona"></div>';
        const bt = el.querySelector('button'), zona = el.querySelector('.qmb-foto-zona');
        bt.addEventListener('click', () => {
          bt.disabled = true;
          Promise.resolve().then(() => LS.resumen.descargar(zona)).catch(() => {
            zona.innerHTML = api.fb('miss', 'Casi. No se pudo crear la imagen en este navegador. Toma una captura de pantalla del resumen.');
          }).then(() => { bt.disabled = false; });
        });
        api.completar(true);
      }
    }]
  });

  function svgTemas72() {
    const aria = 'El juego tiene 3 temas: A, la materia; B, el átomo; C, la tabla periódica';
    const T = [['A', 'La materia', 'var(--primary)'], ['B', 'El átomo', 'var(--accent)'], ['C', 'La tabla', 'var(--prize)']];
    let s = '<svg viewBox="0 0 320 110" role="img" aria-label="' + aria + '"><title>' + aria + '</title>';
    T.forEach((t, i) => {
      const x = 55 + i * 105;
      s += '<circle cx="' + x + '" cy="42" r="32" style="fill:' + t[2] + ';stroke:var(--ink)" stroke-width="2.5"/>' +
        '<text x="' + x + '" y="53" text-anchor="middle" font-size="30" font-weight="900" style="fill:#3C3C3C">' + t[0] + '</text>' +
        '<text x="' + x + '" y="98" text-anchor="middle" font-size="14" font-weight="800" style="fill:var(--ink)">' + t[1] + '</text>';
    });
    return s + '</svg>';
  }
  LAMINAS.push({
    id: 'L72', num: 72, cap: 4,
    titulo: '¡A jugar!',
    html: (c) =>
      '<p>¡Listo, ' + c.nombre + '! Terminaste las láminas.</p>' +
      '<p>Ahora practica en el juego. Tiene preguntas de los 3 temas:</p>' +
      '<div class="dibujo">' + svgTemas72() + '</div>' +
      '<p>Si te trabas, te da pistas y te muestra la lámina que necesitas. Tu avance ya está guardado.</p>',
    bloques: [{ tipo: 'boton', texto: 'Ir al juego', avanzar: true }]
  });

  LS.LAMINAS = (LS.LAMINAS || []).concat(LAMINAS);

  // =====================================================================
  // «Tu resumen en una foto»: PNG 1080×1350, tema claro. Mismos textos que la lámina 71.
  // =====================================================================
  LS.resumen = (function () {
    const W = 1080, H = 1350, MX = 60;
    const C = {
      bg: '#FFFFFF', ink: '#3C3C3C', ink2: '#626A5C', ink3: '#7F877A', line: '#DCE8D2',
      pos: '#0A76B3', neg: '#B35C00', neu: '#6F6F6F', casilla: '#D8E2FF'
    };
    const SEC = {
      materia: { fuerte: '#58CC02', suave: '#D7FFB8' },
      atomo: { fuerte: '#CE82FF', suave: '#F6EAFF' },
      tabla: { fuerte: '#FFC800', suave: '#FFF4CC' }
    };
    function familia() {
      try { if (document.fonts && document.fonts.check('800 30px Nunito')) return 'Nunito, Arial, sans-serif'; } catch (e) { }
      return 'Arial, sans-serif';
    }
    let FAM = 'Arial, sans-serif';
    const fnt = (peso, px) => peso + ' ' + px + 'px ' + FAM;

    // Texto con marcas: *negrita* · {+x} azul · {-x} naranja · {=x} gris
    function piezas(str) {
      const out = [], re = /\{([+\-=])([^}]+)\}|\*([^*]+)\*/g;
      let last = 0, m;
      const txt = (s, b) => out.push({ s, c: C.ink, b: !!b });
      while ((m = re.exec(str))) {
        if (m.index > last) txt(str.slice(last, m.index));
        if (m[1] != null) out.push({ s: m[2], c: m[1] === '+' ? C.pos : m[1] === '-' ? C.neg : C.neu, b: true });
        else txt(m[3], true);
        last = re.lastIndex;
      }
      if (last < str.length) txt(str.slice(last));
      return out;
    }
    function palabras(ps) {
      const words = []; let cur = [];
      ps.forEach(p => {
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
    function anchoPieza(x, p, size) { x.font = fnt(p.b ? 900 : 700, size); return x.measureText(p.s).width; }
    // Devuelve la y final (debajo de la última línea).
    function parrafo(x, str, px, py, maxW, size, lh, dib) {
      const ws = palabras(piezas(str));
      x.font = fnt(700, size);
      const esp = x.measureText(' ').width;
      const lineas = [[]]; let anchoL = 0;
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
          l.forEach((w, j) => {
            if (j) cx += esp;
            w.forEach(p => { x.font = fnt(p.b ? 900 : 700, size); x.fillStyle = p.c; x.fillText(p.s, cx, base); cx += x.measureText(p.s).width; });
          });
        });
      }
      return py + lineas.length * lh;
    }

    // Casilla del cloro, como en la lámina 52
    function casillaC(x, px, py) {
      const w = 170, h = 196;
      rr(x, px, py, w, h, 22); x.fillStyle = C.casilla; x.fill(); x.lineWidth = 4; x.strokeStyle = C.ink; x.stroke();
      x.textAlign = 'center'; x.fillStyle = C.ink;
      x.font = fnt(900, 32); x.fillText('17', px + w / 2, py + 44);
      x.font = fnt(900, 76); x.fillText('Cl', px + w / 2, py + 122);
      x.font = fnt(800, 24); x.fillText('Cloro', px + w / 2, py + 154);
      x.font = fnt(700, 24); x.fillStyle = C.ink2; x.fillText('35,45', px + w / 2, py + 184);
      x.textAlign = 'left';
    }

    function componer(x, s, dib, nombre) {
      const w = W - 2 * MX;
      let y = 44;
      if (dib) {
        x.fillStyle = C.bg; x.fillRect(0, 0, W, H);
        x.font = fnt(900, 60); x.fillStyle = C.ink; x.fillText('Química desde cero', MX, y + 58);
        x.font = fnt(800, 32); x.fillStyle = C.ink2; x.fillText('Tu resumen: materia, átomo y tabla', MX, y + 108);
        x.font = fnt(700, 26); x.fillStyle = C.ink3;
        x.fillText((nombre ? nombre + ', guarda' : 'Guarda') + ' esta foto y mírala antes del examen.', MX, y + 150);
        x.font = fnt(700, 22);
        x.fillText('Casilla: Z arriba · símbolo · nombre · masa atómica abajo', MX, y + 188);
        casillaC(x, W - MX - 170, 30);
      }
      y = 250;
      const lh = Math.round(s * 1.3);
      RESUMEN.forEach((sec, i) => {
        const col = SEC[sec.clave];
        const hh = Math.round(s * 1.6);
        if (dib) {
          rr(x, MX, y, w, hh, hh / 2); x.fillStyle = col.suave; x.fill();
          x.beginPath(); x.arc(MX + hh / 2, y + hh / 2, hh / 2 - 6, 0, Math.PI * 2); x.fillStyle = col.fuerte; x.fill();
          x.font = fnt(900, Math.round(s * 0.9)); x.fillStyle = C.ink; x.textAlign = 'center';
          x.fillText(String(i + 1), MX + hh / 2, y + hh / 2 + s * 0.32); x.textAlign = 'left';
          x.font = fnt(900, Math.round(s * 1.02)); x.fillText(sec.titulo, MX + hh + 12, y + hh / 2 + s * 0.36);
        }
        y += hh + Math.round(s * 0.45);
        sec.puntos.forEach(p => {
          if (dib) { x.beginPath(); x.arc(MX + 16, y + s * 0.6, s * 0.2, 0, Math.PI * 2); x.fillStyle = col.fuerte; x.fill(); }
          y = parrafo(x, p, MX + 38, y, w - 38, s, lh, dib) + Math.round(s * 0.28);
        });
        y += Math.round(s * 0.5);
      });
      if (dib) {
        x.font = fnt(700, 22); x.fillStyle = C.ink3; x.textAlign = 'center';
        x.fillText('Química desde cero · láminas, juego y test', W / 2, H - 28); x.textAlign = 'left';
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
      let s = 34;
      while (s > 18 && componer(x, s, false, nombre) > H - 70) s--;
      componer(x, s, true, nombre);
      return cv;
    }

    function esIOS() {
      const ua = navigator.userAgent || '';
      return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }
    function mostrarImagen(url, dest, ios) {
      const html = '<figure class="qmb-foto"><img src="' + url + '" alt="Tu resumen de química en una imagen" width="1080" height="1350">' +
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
            a.href = href; a.download = 'resumen-quimica.png'; a.rel = 'noopener';
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

