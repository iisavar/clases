/* Láminas del Inicio (1–3), Capítulo 1 «La materia y sus cambios» (10–22) y Capítulo 2 «El átomo» (30–43).
   Solo datos: el motor que las pinta es ls-carrusel.js. Estilos propios en css/qm-laminas-a.css (prefijo qma-).
   Los simuladores LS.QM.* (qm-widgets.js) se llaman siempre dentro de funciones, al momento de pintar.
   Convención de color: protón y catión = --pos; electrón y anión = --neg; neutrón = --ink-3. */
(function () {
  'use strict';
  const LS = window.LS = window.LS || {};

  // ---------- Ayudas ----------
  const esc = (s) => LS.ui.esc(s);
  const regla = (h, n) => LS.ui.regla(h, n);
  const ojo = (h) => LS.ui.ojo(h);
  const ejemplo = (o) => LS.ui.ejemplo(o);
  const dib = (svg, cls) => '<div class="dibujo' + (cls ? ' ' + cls : '') + '">' + svg + '</div>';
  const sabias = (h) => '<div class="qma-sabias"><b>¿Sabías que…?</b>' + h + '</div>';
  const nota = (h) => '<p class="caja-nota">' + h + '</p>';
  const tarj = (h) => '<span class="qma-tarj">' + h + '</span>';
  const hecho = (c, id) => { try { const r = c.st.laminas.respuestas[id]; return !!(r && r.hecho); } catch (e) { return false; } };
  const MENOS = '−';
  // texto con color de carga
  const pos = (t) => '<span class="qma-pos">' + t + '</span>';
  const neg = (t) => '<span class="qma-neg">' + t + '</span>';
  const neu = (t) => '<span class="qma-neu">' + t + '</span>';
  const PROTON = pos('protones'), NEUTRON = neu('neutrones'), ELECTRON = neg('electrones');

  // Simuladores (si aún no cargaron, no rompen la lámina)
  const QM = () => LS.QM || {};
  function wid(nombre) {
    const f = QM()[nombre];
    if (typeof f !== 'function') return '';
    try { return f.apply(QM(), Array.prototype.slice.call(arguments, 1)) || ''; } catch (e) { return ''; }
  }
  // Carga como texto: 1 → «+», −2 → «2−»
  const cargaTxt = (q) => !q ? '' : (Math.abs(q) > 1 ? Math.abs(q) : '') + (q > 0 ? '+' : MENOS);
  // Notación ᴬ_Z X con carga. Usa LS.QM.notacion; si falta, un respaldo propio.
  function nt(A, Z, s, q, grande) {
    const f = QM().notacion;
    let h = '';
    if (typeof f === 'function') { try { h = f(A, Z, s, q || 0); } catch (e) { h = ''; } }
    if (!h) {
      const qq = cargaTxt(q);
      h = '<span class="qma-nota-f" aria-label="' + s + ' con número de masa ' + A + ' y número atómico ' + Z + (qq ? ', carga ' + qq : '') + '">' +
        '<span class="qma-az"><span>' + A + '</span><span>' + Z + '</span></span>' + s +
        (qq ? '<span class="qma-q ' + (q > 0 ? 'qma-pos' : 'qma-neg') + '">' + qq + '</span>' : '') + '</span>';
    }
    return '<span class="qma-nota' + (grande ? ' qma-nota-grande' : '') + '">' + h + '</span>';
  }
  function tabla(cab, filas) {
    return '<div class="qma-tabla-caja"><table class="qma-tabla">' +
      (cab ? '<thead><tr>' + cab.map(x => '<th scope="col">' + x + '</th>').join('') + '</tr></thead>' : '') +
      '<tbody>' + filas.map(f => '<tr>' + f.map((x, i) => i === 0 ? '<th scope="row">' + x + '</th>' : '<td>' + x + '</td>').join('') + '</tr>').join('') +
      '</tbody></table></div>';
  }
  const lista = (items) => '<ul class="qma-lista">' + items.map(x => '<li>' + x + '</li>').join('') + '</ul>';

  // Caja de un bloque con simulador: enunciado + zona del simulador + zona de mensajes
  function cajaSim(el, enunciado) {
    el.classList.add('bloque-preg');
    el.innerHTML = (enunciado ? '<div class="enunciado">' + enunciado + '</div>' : '') +
      '<div class="qma-sim" data-noswipe></div><div class="zona-fb" aria-live="polite"></div>';
    return { sim: el.querySelector('.qma-sim'), zfb: el.querySelector('.zona-fb') };
  }

  // ---------- Dibujos propios (SVG plano, trazo 2,5, tokens de color) ----------
  const T = (x, y, txt, o) => { o = o || {}; return '<text x="' + x + '" y="' + y + '" text-anchor="' + (o.a || 'middle') + '" font-size="' + (o.fs || 13) + '" font-weight="' + (o.fw || 800) + '" style="fill:' + (o.col || 'var(--ink)') + '">' + txt + '</text>'; };
  // molécula de agua: O grande (acento) y dos H chicos (premio)
  function molAgua(x, y, ang, r) {
    r = r || 11;
    const h = r * 0.62, d = r * 1.05;
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + (ang || 0) + ')">' +
      '<circle cx="' + (-d) + '" cy="' + (d * 0.8) + '" r="' + h + '" style="fill:var(--prize);stroke:var(--ink)" stroke-width="2"/>' +
      '<circle cx="' + d + '" cy="' + (d * 0.8) + '" r="' + h + '" style="fill:var(--prize);stroke:var(--ink)" stroke-width="2"/>' +
      '<circle cx="0" cy="0" r="' + r + '" style="fill:var(--accent);stroke:var(--ink)" stroke-width="2"/></g>';
  }

  // Portada: una gota y, en la lupa, sus moléculas
  function svgPortada() {
    let s = '<svg viewBox="0 0 340 190" role="img" aria-label="Una gota de agua y, vista con lupa, las partículas que la forman"><title>¿De qué está hecho todo?</title>';
    s += '<path d="M70 28C58 52 34 78 34 110a36 36 0 0072 0c0-32-24-58-36-82z" style="fill:var(--zero-soft);stroke:var(--ink)" stroke-width="2.5" stroke-linejoin="round"/>';
    s += '<path d="M52 108a18 18 0 0012 18" fill="none" style="stroke:var(--ink-3)" stroke-width="2.5" stroke-linecap="round"/>';
    s += T(70, 172, 'una gota');
    s += '<path d="M118 100h42M151 92l9 8-9 8" fill="none" style="stroke:var(--ink)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
    s += '<circle cx="245" cy="92" r="72" style="fill:var(--surface);stroke:var(--ink)" stroke-width="3"/>';
    s += '<path d="M296 143l26 26" style="stroke:var(--ink)" stroke-width="7" stroke-linecap="round"/>';
    s += molAgua(215, 58, -15) + molAgua(272, 70, 30) + molAgua(228, 112, 160) + molAgua(282, 122, -40) + molAgua(196, 92, 70);
    s += T(245, 184, 'por dentro: partículas');
    return s + '</svg>';
  }

  // Cómo es una lámina (lámina 2)
  function svgMiniLamina() {
    return '<svg viewBox="0 0 340 250" role="img" aria-label="Así es una lámina: un simulador para tocar, el botón Explícame más despacio y abajo Atrás y Siguiente"><title>Cómo es una lámina</title>' +
      '<rect x="96" y="8" width="148" height="232" rx="16" style="fill:var(--surface);stroke:var(--ink)" stroke-width="2.5"/>' +
      '<rect x="110" y="24" width="90" height="10" rx="5" style="fill:var(--line)"/>' +
      '<rect x="110" y="44" width="120" height="7" rx="3.5" style="fill:var(--line)"/>' +
      '<rect x="110" y="76" width="120" height="58" rx="8" fill="none" style="stroke:var(--ink-3)" stroke-width="2" stroke-dasharray="5 4"/>' +
      '<circle cx="136" cy="96" r="7" style="fill:var(--accent)"/><circle cx="170" cy="112" r="7" style="fill:var(--accent)"/><circle cx="204" cy="94" r="7" style="fill:var(--accent)"/>' +
      '<rect x="102" y="146" width="136" height="24" rx="6" style="fill:var(--zero-soft);stroke:var(--ink)" stroke-width="2"/>' +
      '<text x="170" y="162" text-anchor="middle" font-size="9.5" font-weight="800" style="fill:var(--ink)">Explícame más despacio ▾</text>' +
      '<line x1="96" y1="188" x2="244" y2="188" style="stroke:var(--line)" stroke-width="2"/>' +
      '<rect x="106" y="198" width="30" height="30" rx="8" style="fill:var(--surface);stroke:var(--ink)" stroke-width="2"/>' +
      '<path d="M124 205l-7 8 7 8" fill="none" style="stroke:var(--ink)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<rect x="144" y="198" width="90" height="30" rx="8" style="fill:var(--primary)"/>' +
      '<text x="189" y="218" text-anchor="middle" font-size="12" font-weight="800" style="fill:var(--on-primary)">Siguiente ›</text>' +
      T(6, 96, 'Simulador:', { a: 'start' }) + T(6, 112, 'tócalo', { a: 'start' }) +
      '<path d="M84 104h16M93 97l7 7-7 7" fill="none" style="stroke:var(--ink)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      T(6, 150, '¿No', { a: 'start' }) + T(6, 166, 'entendiste?', { a: 'start' }) +
      '<path d="M84 158h16M93 151l7 7-7 7" fill="none" style="stroke:var(--ink)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      T(334, 200, 'Siguiente', { a: 'end' }) + T(334, 216, '(o desliza)', { a: 'end', fs: 11, fw: 700, col: 'var(--ink-2)' }) +
      '<path d="M270 206h-22M255 199l-7 7 7 7" fill="none" style="stroke:var(--ink)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>';
  }

  // Lupa sobre las partículas: entre ellas hay vacío (lámina 12)
  function svgVacio() {
    const pts = [[112, 52], [168, 40], [208, 70], [128, 104], [186, 110], [150, 142], [100, 146], [214, 138], [240, 100]];
    let s = '<svg viewBox="0 0 340 190" role="img" aria-label="Con lupa: partículas separadas que se mueven; entre ellas hay espacio vacío"><title>Partículas y vacío</title>';
    s += '<circle cx="170" cy="95" r="88" style="fill:var(--surface);stroke:var(--ink)" stroke-width="3"/>';
    pts.forEach((p, i) => {
      s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="11" style="fill:var(--accent);stroke:var(--ink)" stroke-width="2"/>';
      if (i % 3 === 0) s += '<path d="M' + (p[0] - 20) + ' ' + (p[1] - 6) + 'q-4 6 0 12" fill="none" style="stroke:var(--ink-3)" stroke-width="2.5" stroke-linecap="round"/>';
    });
    s += '<path d="M296 30L156 70" fill="none" style="stroke:var(--ink-2)" stroke-width="2" stroke-dasharray="4 4"/>';
    s += '<circle cx="152" cy="71" r="4" style="fill:var(--ink-2)"/>';
    s += T(306, 22, 'vacío', { a: 'middle' });
    return s + '</svg>';
  }

  // Modelos sencillos de Dalton y Thomson (lámina 30)
  function svgDalton() {
    return '<svg viewBox="0 0 120 100" role="img" aria-label="Modelo de Dalton: una esfera maciza"><title>Modelo de Dalton</title>' +
      '<circle cx="60" cy="50" r="38" style="fill:var(--zero-soft);stroke:var(--ink)" stroke-width="2.5"/>' +
      '<path d="M38 34a26 26 0 0116-12" fill="none" style="stroke:var(--ink-3)" stroke-width="3" stroke-linecap="round"/></svg>';
  }
  function svgThomson() {
    const es = [[44, 36], [74, 30], [84, 58], [58, 70], [36, 60], [62, 48]];
    let s = '<svg viewBox="0 0 120 100" role="img" aria-label="Modelo de Thomson: una esfera positiva con electrones negativos incrustados"><title>Modelo de Thomson</title>' +
      '<circle cx="60" cy="50" r="38" style="fill:var(--pos-soft);stroke:var(--pos)" stroke-width="2.5"/>';
    es.forEach(p => { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="7" style="fill:var(--neg)"/><path d="M' + (p[0] - 3.5) + ' ' + p[1] + 'h7" style="stroke:var(--surface)" stroke-width="2" stroke-linecap="round"/>'; });
    return s + '</svg>';
  }

  // Experimento de la lámina de oro (lámina 31). Las partículas alfa son positivas: color --pos.
  function svgRutherford() {
    const fl = (d) => '<path d="' + d + '" fill="none" style="stroke:var(--pos)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#qma-fl)"/>';
    let s = '<svg viewBox="0 0 340 200" role="img" aria-label="Experimento de Rutherford: casi todas las partículas alfa atraviesan la lámina de oro; pocas se desvían y muy pocas rebotan"><title>La lámina de oro</title>';
    s += '<defs><marker id="qma-fl" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M1 1l8 4-8 4" fill="none" style="stroke:var(--pos)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>';
    s += '<rect x="6" y="52" width="40" height="96" rx="8" style="fill:var(--surface);stroke:var(--ink)" stroke-width="2.5"/>';
    s += T(26, 106, 'α', { fs: 22, fw: 900, col: 'var(--pos-text)' });
    s += T(4, 170, 'partículas α (+)', { a: 'start', fs: 12 });
    s += fl('M48 82H316') + fl('M48 100H316') + fl('M48 118H316');
    s += fl('M48 136H168L300 180');
    s += fl('M48 64H166L84 24');
    s += '<rect x="168" y="40" width="8" height="120" rx="2" style="fill:var(--prize);stroke:var(--ink)" stroke-width="2"/>';
    s += T(172, 196, 'lámina de oro', { fs: 12 });
    s += T(250, 74, 'casi todas pasan', { fs: 12 });
    s += T(262, 142, 'pocas se desvían', { fs: 12 });
    s += T(96, 16, 'muy pocas rebotan', { fs: 12 });
    return s + '</svg>';
  }

  // Átomo de helio de juguete: 2 protones, 2 neutrones, 2 electrones (lámina 33)
  function svgAtomo() {
    const p = (x, y) => '<circle cx="' + x + '" cy="' + y + '" r="10" style="fill:var(--pos);stroke:var(--ink)" stroke-width="2"/><path d="M' + (x - 4.5) + ' ' + y + 'h9M' + x + ' ' + (y - 4.5) + 'v9" style="stroke:var(--surface)" stroke-width="2.2" stroke-linecap="round"/>';
    const n = (x, y) => '<circle cx="' + x + '" cy="' + y + '" r="10" style="fill:var(--ink-3);stroke:var(--ink)" stroke-width="2"/>';
    const e = (x, y) => '<circle cx="' + x + '" cy="' + y + '" r="8" style="fill:var(--neg);stroke:var(--ink)" stroke-width="2"/><path d="M' + (x - 4) + ' ' + y + 'h8" style="stroke:var(--surface)" stroke-width="2.2" stroke-linecap="round"/>';
    let s = '<svg viewBox="0 0 340 190" role="img" aria-label="Átomo de helio: en el núcleo 2 protones y 2 neutrones; alrededor 2 electrones"><title>Átomo de helio</title>';
    s += '<circle cx="120" cy="95" r="70" fill="none" style="stroke:var(--line)" stroke-width="2.5" stroke-dasharray="6 5"/>';
    s += n(111, 86) + p(129, 86) + p(111, 104) + n(129, 104);
    s += e(120, 25) + e(120, 165);
    s += '<path d="M142 95H236" fill="none" style="stroke:var(--ink-2)" stroke-width="2" stroke-dasharray="4 4"/>';
    s += T(240, 90, 'núcleo:', { a: 'start' }) + T(240, 108, '2 protones', { a: 'start', col: 'var(--pos-text)' }) + T(240, 126, '2 neutrones', { a: 'start', col: 'var(--ink-2)' });
    s += '<path d="M132 25H236" fill="none" style="stroke:var(--ink-2)" stroke-width="2" stroke-dasharray="4 4"/>';
    s += T(240, 30, '2 electrones', { a: 'start', col: 'var(--neg-text)' });
    return s + '</svg>';
  }

  // Elemento, compuesto y mezcla vistos por dentro (lámina 18)
  function svgSustancias() {
    const caja = (x, t) => '<rect x="' + x + '" y="8" width="100" height="100" rx="12" style="fill:var(--surface);stroke:var(--ink)" stroke-width="2.5"/>' + T(x + 50, 128, t);
    const a = (x, y) => '<circle cx="' + x + '" cy="' + y + '" r="9" style="fill:var(--accent);stroke:var(--ink)" stroke-width="2"/>';
    const b = (x, y) => '<circle cx="' + x + '" cy="' + y + '" r="6" style="fill:var(--prize);stroke:var(--ink)" stroke-width="2"/>';
    const o2 = (x, y) => a(x - 7, y) + a(x + 7, y);
    let s = '<svg viewBox="0 0 340 136" role="img" aria-label="Elemento: un solo tipo de átomo. Compuesto: moléculas iguales hechas de dos elementos. Mezcla: dos sustancias distintas juntas sin unirse"><title>Elemento, compuesto y mezcla</title>';
    s += caja(4, 'Elemento') + o2(34, 36) + o2(76, 44) + o2(40, 82) + o2(78, 88);
    s += caja(120, 'Compuesto') + molAgua(148, 36, 0, 9) + molAgua(190, 42, 30, 9) + molAgua(150, 84, -20, 9) + molAgua(192, 86, 10, 9);
    s += caja(236, 'Mezcla') + molAgua(262, 34, 0, 9) + o2(308, 40) + molAgua(306, 84, 20, 9) + o2(262, 88);
    return s + '</svg>';
  }

  // Mensaje del gancho, que se revela en la lámina de Rutherford (31)
  function cajaGancho(c) {
    const g = c.gancho;
    let t = null;
    if (g === 'casi-todo') t = 'Al inicio dijiste «casi todo». ¡Le atinaste! Y ahora sabes cómo se descubrió.';
    else if (g === 'nada') t = 'Al inicio dijiste «casi nada». Es lo que casi todos piensan, porque las cosas se ven llenas. Pero el átomo es casi todo vacío.';
    else if (g === 'mitad') t = 'Al inicio dijiste «la mitad». Es mucho más que eso: casi todo el átomo es vacío.';
    else if (g === 'nose') t = 'Al inicio no lo sabías. Ahora sí: casi todo el átomo es espacio vacío.';
    return t ? '<div class="caja-nota qma-gancho">' + t + '</div>' : '';
  }
  function revelaRutherford(c) {
    return regla('Casi toda la masa del átomo está en un núcleo diminuto y positivo. El resto es casi todo espacio vacío.', 'NÚCLEO') +
      '<p>Si el átomo fuera un estadio de fútbol, el núcleo sería como una arveja en el centro de la cancha. Los ' + ELECTRON + ' andan por las graderías.</p>' +
      cajaGancho(c) +
      ojo('El núcleo del átomo no es el núcleo de la célula. Solo comparten el nombre.');
  }

  // ---------- Bloques con simulador ----------

  // Lámina 13: botones Sólido / Líquido / Gaseoso sobre LS.QM.particulas. Se completa al ver los 3.
  const ESTADOS = [
    ['solido', 'Sólido', '<b>Sólido:</b> las partículas están muy juntas y solo vibran en su sitio. Por eso tiene forma fija.'],
    ['liquido', 'Líquido', '<b>Líquido:</b> siguen juntas, pero se deslizan unas sobre otras. Por eso toma la forma del recipiente.'],
    ['gas', 'Gaseoso', '<b>Gaseoso:</b> están muy separadas y vuelan rápido en todas direcciones. Por eso llena todo el recipiente.']
  ];
  function explorarEstados(el, api) {
    const z = cajaSim(el, 'Toca los 3 estados y mira cómo se mueven las partículas del agua.');
    const bar = document.createElement('div');
    bar.className = 'qma-estados';
    bar.setAttribute('data-noswipe', '');
    bar.innerHTML = ESTADOS.map(x => '<button class="btn btn-sec" data-est="' + x[0] + '" aria-pressed="false">' + x[1] + '</button>').join('');
    el.insertBefore(bar, z.sim);
    let w = null, listo = false;
    const vistos = {};
    try { w = LS.QM.particulas(z.sim, { estado: 'solido', control: false, sustancia: 'agua' }); } catch (e) { w = null; }
    function elegir(k) {
      const x = ESTADOS.find(e => e[0] === k);
      if (!x) return;
      vistos[k] = true;
      bar.querySelectorAll('[data-est]').forEach(b => b.setAttribute('aria-pressed', b.getAttribute('data-est') === k ? 'true' : 'false'));
      if (w && w.fijar) { try { w.fijar(k); } catch (e) { /* sin simulador */ } }
      const falta = ESTADOS.filter(e => !vistos[e[0]]).map(e => e[1].toLowerCase());
      // el simulador ya escribe su propia explicación; sin simulador, la ponemos aquí
      const txt = (w ? '' : x[2] + '<br>') + (falta.length ? 'Te falta: ' + falta.join(' y ') + '.' : '¡Listo! Ya viste los 3 estados.');
      z.zfb.innerHTML = listo ? '' : api.fb('info', txt);
      if (!falta.length && !listo) { listo = true; api.completar(true); }
    }
    bar.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-est]'); if (b) elegir(b.getAttribute('data-est')); });
    elegir('solido');
    if (!w) { listo = true; api.completar(true); }
  }

  // Lámina 14: el simulador con termómetro (deslizador de temperatura)
  function simTermometro(el, api) {
    const z = cajaSim(el, 'Mueve el termómetro de ' + MENOS + '20 °C a 120 °C. Mira el nombre de cada cambio.');
    try { LS.QM.particulas(z.sim, { estado: 'solido', control: true, sustancia: 'agua' }); } catch (e) { /* sin simulador */ }
    api.completar(true);
  }

  // Lámina 32: línea de tiempo de los modelos (LS.QM.modelos) con un botón por modelo
  const MODELOS = [
    ['dalton', 'Dalton', '<b>Dalton (1808):</b> esfera maciza que no se puede dividir.'],
    ['thomson', 'Thomson', '<b>Thomson (1904):</b> esfera positiva con ' + ELECTRON + ' incrustados, como pasas en un budín.'],
    ['rutherford', 'Rutherford', '<b>Rutherford (1911):</b> núcleo diminuto y positivo; los ' + ELECTRON + ' giran alrededor. Casi todo es vacío.'],
    ['bohr', 'Bohr', '<b>Bohr (1913):</b> los ' + ELECTRON + ' giran en niveles de energía fijos, como pisos alrededor del núcleo.'],
    ['actual', 'Actual', '<b>Modelo actual:</b> el electrón no sigue una trayectoria fija. Está en orbitales: regiones donde es más probable encontrarlo.']
  ];
  function explorarModelos(el, api) {
    el.classList.add('bloque-preg');
    el.innerHTML = '<div class="enunciado">Toca cada modelo de la línea de tiempo.</div>' +
      '<div class="qma-modelos-bts" data-noswipe>' + MODELOS.map(m => '<button class="btn btn-sec" data-mod="' + m[0] + '" aria-pressed="false">' + m[1] + '</button>').join('') + '</div>' +
      '<div class="dibujo qma-sim"></div><p class="qma-modelo-txt" aria-live="polite"></p>';
    const d = el.querySelector('.qma-sim'), txt = el.querySelector('.qma-modelo-txt');
    function elegir(k) {
      const m = MODELOS.find(x => x[0] === k);
      if (!m) return;
      el.querySelectorAll('[data-mod]').forEach(b => b.setAttribute('aria-pressed', b.getAttribute('data-mod') === k ? 'true' : 'false'));
      d.innerHTML = wid('modelos', k);
      txt.innerHTML = m[2];
    }
    el.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-mod]'); if (b) elegir(b.getAttribute('data-mod')); });
    elegir('bohr');
    api.completar(true);
  }

  // Reto con el constructor de átomos (LS.QM.constructor).
  // o: { enunciado, inicio:{p,n,e}, max, mostrar, bloquear:[...], meta(v)→bool, pista(v)→html|'', okFb, solucion, final:{p,n,e} }
  function retoAtomo(o) {
    return function (el, api) {
      const z = cajaSim(el, o.enunciado);
      let w = null, listo = false;
      function revisar(s) {
        if (listo) return;
        let v = s;
        if (!v || v.p == null) { try { v = w && w.valores ? w.valores() : null; } catch (e) { v = null; } }
        if (!v) return;
        if (o.meta(v)) {
          listo = true;
          z.zfb.innerHTML = api.fb('ok', o.okFb);
          LS.ui.sonido('ok');
          if (btn.parentNode) btn.parentNode.removeChild(btn);
          api.completar(true);
          return;
        }
        const p = o.pista ? o.pista(v) : '';
        z.zfb.innerHTML = p ? api.fb('info', p) : '';
      }
      const btn = document.createElement('button');
      btn.className = 'btn btn-sec btn-ancho qma-ayuda';
      btn.textContent = 'Muéstrame cómo';
      btn.addEventListener('click', () => {
        if (listo) return;
        listo = true;
        if (w && w.fijar) { try { w.fijar(o.final); } catch (e) { /* nada */ } }
        z.zfb.innerHTML = api.fb('info', '<b>Así se hace:</b> ' + o.solucion);
        if (btn.parentNode) btn.parentNode.removeChild(btn);
        api.fallo();
        api.completar(false);
      });
      el.appendChild(btn);
      try {
        w = LS.QM.constructor(z.sim, {
          p: o.inicio.p, n: o.inicio.n, e: o.inicio.e,
          max: o.max || { p: 20, n: 24, e: 20 },
          mostrar: o.mostrar || { elemento: true, carga: true, A: true, notacion: true },
          onCambio: revisar
        });
        if (o.bloquear && w && w.bloquear) w.bloquear(o.bloquear);
      } catch (e) { w = null; }
      if (!w) {
        listo = true;
        if (btn.parentNode) btn.parentNode.removeChild(btn);
        z.zfb.innerHTML = api.fb('info', o.solucion);
        api.completar(true);
      }
    };
  }

  // =====================================================================
  const LAMINAS = [

    // ======================= INICIO =======================
    {
      id: 'Q1', num: 1, cap: 0, desliza: true,
      titulo: c => 'Hola, ' + esc(c.nombre) + '. ¿De qué está hecho todo?',
      html: () => dib(svgPortada(), 'qma-portada') +
        '<p>Tu cuerpo, el aire, el agua, tu celular… Todo está hecho de partículas diminutas: los <b>átomos</b>.</p>' +
        '<p>Vas a ver la materia, el átomo por dentro y la tabla periódica.</p>' +
        '<p class="peq tinta-2">3 capítulos de unos 10 minutos. Tu avance se guarda solo.</p>',
      bloques: [{ tipo: 'boton', texto: 'Empezar' }]
    },
    {
      id: 'Q2', num: 2, cap: 0,
      titulo: 'Cómo usar estas láminas',
      html: () => '<ol class="lista-num">' +
        '<li>Lee con calma. Cada lámina tiene una sola idea.</li>' +
        '<li>Juega con los <b>simuladores</b>: tócalos y muévelos.</li>' +
        '<li>¿No entendiste? Toca <b>«Explícame más despacio»</b>.</li>' +
        '<li>Responde la pregunta para seguir. Equivocarte aquí no resta nada.</li></ol>' +
        dib(svgMiniLamina()),
      bloques: [{ tipo: 'boton', texto: 'Entendido' }]
    },
    {
      id: 'Q3', num: 3, cap: 0,
      titulo: 'Adivina primero',
      html: '<p>Aún no te explicamos nada. <b>Solo adivina: no cuenta para nada.</b></p>' +
        '<p>Imagina un átomo tan grande como un estadio.</p>',
      bloques: [{
        tipo: 'opciones', prediccion: true, guardar: 'gancho',
        enunciado: '¿Cuánto del átomo es espacio vacío?',
        opciones: [
          { t: 'Casi nada: está lleno', valor: 'nada' },
          { t: 'Más o menos la mitad', valor: 'mitad' },
          { t: 'Casi todo', valor: 'casi-todo' },
          { t: 'No sé', valor: 'nose' }
        ],
        fbComun: 'Guardado. En el capítulo 2 lo descubres con un experimento famoso.'
      }]
    },

    // ======================= CAPÍTULO 1 =======================
    {
      id: 'Q10', num: 10, cap: 1,
      entrada: 'Capítulo 1 de 3 · La materia y sus cambios · unos 10 minutos',
      titulo: '¿Qué es la materia?',
      html: () => regla('Materia es todo lo que tiene masa y ocupa un lugar en el espacio.', 'MATERIA') +
        lista([
          '<b>Sí es materia:</b> el agua, tu cuerpo, una piedra, el aire.',
          '<b>No es materia:</b> la luz y el sonido. Son formas de energía.'
        ]) +
        ojo('El aire sí es materia. No lo ves, pero tiene masa: un balón inflado pesa más que desinflado.'),
      mas: '<p><b>Otro ejemplo:</b> tapa con el dedo la punta de una jeringa sin aguja y empuja. El émbolo no llega al fondo: el aire de adentro ocupa lugar.</p>' +
        '<p>¿Por qué importa? Los gases también son materia. Por eso un tanque de oxígeno lleno pesa más que uno vacío.</p>',
      bloques: [{
        tipo: 'clasificar', botones: ['Es materia', 'No es materia'],
        enunciado: '¿Es materia o no?',
        tarjetas: [
          { html: tarj('El aire dentro de un balón'), correcta: 'Es materia', fb: 'Casi. El aire tiene masa y ocupa lugar: es materia, aunque no lo veas.' },
          { html: tarj('La luz de un foco'), correcta: 'No es materia', fb: 'Casi. La luz no tiene masa ni ocupa lugar: es energía.' },
          { html: tarj('Una gota de suero'), correcta: 'Es materia', fb: 'Casi. El suero tiene masa y ocupa lugar: es materia.' },
          { html: tarj('El sonido de un parlante'), correcta: 'No es materia', fb: 'Casi. El sonido es energía que viaja por el aire. No es materia.' }
        ]
      }]
    },
    {
      id: 'Q11', num: 11, cap: 1,
      titulo: 'Propiedades de la materia',
      html: () => regla('Las propiedades generales las tiene toda la materia. Las específicas sirven para reconocer una sustancia.', 'PROPIEDADES') +
        '<div class="qma-dos"><div><b>Generales</b>masa y volumen</div>' +
        '<div><b>Específicas</b>densidad, color, olor, dureza, punto de fusión, punto de ebullición, solubilidad, conductividad</div></div>' +
        '<p><b>Ejemplo:</b> un litro de agua y un litro de aceite tienen el mismo volumen. Eso no dice cuál es cuál. La densidad sí: el aceite flota porque es menos denso.</p>' +
        nota('En otros libros se llaman <b>extensivas</b> (dependen de cuánto hay: masa, volumen) e <b>intensivas</b> (no dependen: densidad, punto de ebullición).'),
      mas: '<p><b>Otro ejemplo:</b> ¿un anillo es de oro de verdad? La masa no te lo dice: todo tiene masa. La densidad sí: el oro tiene 19,3 g/cm³, más del doble que el cobre o el hierro.</p>' +
        '<p>¿Por qué? La masa depende de cuánto hay. La densidad depende de qué sustancia es.</p>',
      bloques: [{
        tipo: 'clasificar', botones: ['General', 'Específica'],
        enunciado: '¿Es una propiedad general o específica?',
        tarjetas: [
          { html: tarj('La masa de una manzana'), correcta: 'General', fb: 'Casi. Todo tiene masa. No te dice qué sustancia es: es general.' },
          { html: tarj('El agua hierve a 100 °C a nivel del mar'), correcta: 'Específica', fb: 'Casi. Cada sustancia hierve a su propia temperatura. Sirve para reconocerla: es específica.' },
          { html: tarj('El volumen de un vaso de colada'), correcta: 'General', fb: 'Casi. Todo ocupa un volumen. No te dice qué sustancia es: es general.' },
          { html: tarj('El cobre conduce la electricidad'), correcta: 'Específica', fb: 'Casi. No todo conduce la electricidad. Ayuda a reconocer el cobre: es específica.' }
        ]
      }]
    },
    {
      id: 'Q12', num: 12, cap: 1,
      titulo: 'Todo está hecho de partículas',
      html: () => regla('Toda la materia está hecha de partículas diminutas que no dejan de moverse. Entre ellas hay espacio vacío.', 'PARTÍCULAS') +
        dib(svgVacio(), 'qma-dib-chico') +
        '<p>Son tan pequeñas que una sola gota de agua tiene miles de trillones de átomos.</p>' +
        ojo('Entre las partículas no hay aire ni agua: hay vacío.'),
      mas: '<p><b>Otro ejemplo:</b> pon una gota de colorante en un vaso de agua, sin mover. Poco a poco se reparte sola: las partículas se mueven todo el tiempo.</p>' +
        '<p>Y una partícula de cobre no es rojiza ni brilla. El color y el brillo son del conjunto, no de cada partícula.</p>',
      bloques: [{
        tipo: 'opciones',
        enunciado: '¿Qué hay entre las partículas del agua?',
        opciones: [
          { t: 'Aire', fb: 'Casi. El aire también está hecho de partículas. Entre las partículas no hay nada: hay vacío.' },
          { t: 'Espacio vacío', ok: true, fb: '¡Eso! Entre las partículas hay vacío.' },
          { t: 'Más agua', fb: 'Casi. El agua son esas mismas partículas. Entre ellas hay vacío.' },
          { t: 'Nada de espacio: están pegadas', fb: 'Casi. Aun en un sólido hay espacio entre las partículas. Ese espacio está vacío.' }
        ]
      }]
    },
    {
      id: 'Q13', num: 13, cap: 1,
      titulo: 'Los 3 estados de la materia',
      html: () => regla('La materia se presenta en 3 estados: sólido, líquido y gaseoso. Se diferencian en cómo se mueven sus partículas.', 'ESTADOS') +
        tabla(['', 'Sólido', 'Líquido', 'Gaseoso'], [
          ['Forma', 'fija', 'la del recipiente', 'la del recipiente'],
          ['Volumen', 'fijo', 'fijo', 'llena todo el recipiente'],
          ['Partículas', 'muy juntas, vibran', 'juntas, se deslizan', 'separadas, vuelan']
        ]) +
        '<p><b>Ejemplos:</b> hielo, hueso y sal son sólidos. Agua, suero y aceite son líquidos. Aire, vapor y oxígeno son gases.</p>',
      mas: '<p><b>Otro ejemplo:</b> aprieta una funda de suero. Cambia de forma, pero sigue siendo la misma cantidad: el líquido tiene volumen fijo.</p>' +
        '<p>Un gas, en cambio, se puede comprimir porque sus partículas están separadas. Por eso cabe tanto oxígeno en un tanque.</p>',
      bloques: [
        { tipo: 'custom', render: explorarEstados },
        {
          tipo: 'opciones',
          enunciado: '¿En qué estado las partículas están más separadas y se mueven más rápido?',
          opciones: [
            { t: 'Sólido', fb: 'Casi. En el sólido están muy juntas y solo vibran. Las más separadas y rápidas están en el gas.' },
            { t: 'Líquido', fb: 'Casi. En el líquido siguen juntas y se deslizan. Las más separadas están en el gas.' },
            { t: 'Gaseoso', ok: true, fb: '¡Eso! Por eso un gas llena todo el recipiente.' }
          ]
        }
      ]
    },
    {
      id: 'Q14', num: 14, cap: 1,
      titulo: 'Cambios de estado',
      html: () => regla('Al calentar o enfriar, la materia cambia de estado. Cada cambio tiene su nombre.', 'CAMBIOS DE ESTADO') +
        dib(wid('cambiosEstado')) +
        lista([
          '<b>Fusión</b>, de sólido a líquido: el hielo se derrite.',
          '<b>Solidificación</b>, de líquido a sólido: el agua se congela en la cubeta.',
          '<b>Vaporización</b>, de líquido a gas: el agua hierve en la olla.',
          '<b>Condensación</b>, de gas a líquido: el rocío sobre el pasto.',
          '<b>Sublimación progresiva</b>, de sólido a gas: el hielo seco.',
          '<b>Sublimación regresiva</b>, de gas a sólido: la escarcha.'
        ]),
      mas: '<p><b>Otra forma de recordarlos:</b> fusión, vaporización y sublimación progresiva necesitan calor. Solidificación, condensación y sublimación regresiva sueltan calor.</p>' +
        '<p>El gas de cocina (GLP) está líquido dentro del cilindro porque se comprimió. A la condensación de un gas así también se le llama <b>licuación</b> o licuefacción.</p>',
      bloques: [
        { tipo: 'custom', render: simTermometro },
        {
          tipo: 'opciones',
          enunciado: 'En la mañana hay gotitas de rocío sobre el pasto. ¿Qué cambio es?',
          opciones: [
            { t: 'Fusión', fb: 'Casi. La fusión es de sólido a líquido. El rocío viene del vapor del aire, que es gas: condensación.' },
            { t: 'Vaporización', fb: 'Casi. Esa es de líquido a gas. Aquí el vapor del aire se vuelve líquido: condensación.' },
            { t: 'Condensación', ok: true, fb: '¡Eso! El vapor de agua del aire se enfría y pasa a líquido.' },
            { t: 'Solidificación', fb: 'Casi. Esa es de líquido a sólido. El rocío es líquido que viene de un gas: condensación.' }
          ]
        },
        {
          tipo: 'opciones',
          enunciado: 'Dejas agua en la cubeta del congelador y sale hielo. ¿Qué cambio es?',
          opciones: [
            { t: 'Fusión', fb: 'Casi. La fusión es al revés: de sólido a líquido. De líquido a sólido es solidificación.' },
            { t: 'Solidificación', ok: true, fb: '¡Bien! De líquido a sólido.' },
            { t: 'Sublimación regresiva', fb: 'Casi. Esa empieza en un gas. Aquí empiezas con agua líquida: solidificación.' }
          ]
        }
      ]
    },
    {
      id: 'Q15', num: 15, cap: 1,
      titulo: 'Evaporación y ebullición',
      html: () => regla('La vaporización tiene dos formas. La evaporación pasa solo en la superficie y a cualquier temperatura. La ebullición pasa en todo el líquido, a su punto de ebullición.', 'VAPORIZACIÓN') +
        '<div class="qma-dos"><div><b>Evaporación</b>La ropa se seca al sol. Un charco desaparece.</div>' +
        '<div><b>Ebullición</b>El agua de la olla hierve y hace burbujas.</div></div>' +
        ojo('Las burbujas del agua que hierve no son aire: son vapor de agua. Y la «nube» blanca sobre la olla ya son gotitas: el vapor no se ve.'),
      mas: '<p><b>Otro ejemplo:</b> en Quito el agua hierve a unos 90 °C, no a 100 °C. Arriba hay menos aire que empuje sobre el agua.</p>' +
        '<p>Por eso en la Sierra los granos tardan más en cocinarse. La olla de presión ayuda: sube el punto de ebullición.</p>',
      bloques: [
        {
          tipo: 'opciones',
          enunciado: '¿Qué hay dentro de las burbujas del agua que hierve?',
          opciones: [
            { t: 'Aire', fb: 'Casi. Es la respuesta más común, pero no. Las burbujas son agua que pasó a gas: vapor de agua.' },
            { t: 'Vapor de agua', ok: true, fb: '¡Exacto! El agua pasa a gas dentro del líquido y sube en burbujas.' },
            { t: 'Hidrógeno y oxígeno separados', fb: 'Casi. Al hervir, el agua no se rompe: sigue siendo H₂O, ahora como gas. Es vapor de agua.' },
            { t: 'Calor', fb: 'Casi. El calor no es materia: no forma burbujas. Las burbujas son vapor de agua.' }
          ]
        },
        {
          tipo: 'opciones',
          enunciado: 'La ropa mojada se seca al sol sin hervir. ¿Qué pasa con el agua?',
          opciones: [
            { t: 'Ebullición', fb: 'Casi. La ropa no llega a 100 °C ni hace burbujas. El agua se va poco a poco por la superficie: evaporación.' },
            { t: 'Evaporación', ok: true, fb: '¡Bien! Pasa en la superficie y a cualquier temperatura.' },
            { t: 'Sublimación progresiva', fb: 'Casi. La sublimación empieza en un sólido. Aquí el agua es líquida: evaporación.' }
          ]
        }
      ]
    },
    {
      id: 'Q16', num: 16, cap: 1,
      titulo: 'Sublimación: saltarse el líquido',
      html: () => regla('Algunas sustancias pasan de sólido a gas sin volverse líquidas: es la sublimación progresiva. De gas a sólido es la sublimación regresiva.', 'SUBLIMACIÓN') +
        dib(wid('cambiosEstado', 'sublimacion')) +
        lista([
          '<b>Hielo seco</b> (dióxido de carbono sólido): pasa directo a gas y no deja charco.',
          '<b>Naftalina</b> del clóset: se achica sin derretirse.',
          '<b>Escarcha:</b> en las noches heladas del páramo, el vapor del aire se vuelve hielo sobre la paja.'
        ]) +
        '<p class="peq tinta-2">Algunos libros llaman <b>deposición</b> a la sublimación regresiva.</p>' +
        sabias('Existe un cuarto estado: el <b>plasma</b>. Es un gas con tanta energía que sus átomos pierden electrones. Lo ves en el Sol, en los rayos y en los letreros de neón. Casi toda la materia visible del universo es plasma.'),
      mas: '<p><b>Otro ejemplo:</b> en las paredes del congelador se forma escarcha. Es vapor del aire que se vuelve hielo sin pasar por agua líquida.</p>' +
        '<p>¿Por qué no hay charco? Las partículas saltan de un estado al otro sin pasar por el líquido.</p>',
      bloques: [{
        tipo: 'opciones',
        enunciado: 'La naftalina del clóset se hace cada vez más pequeña y nunca deja charco. ¿Qué cambio es?',
        opciones: [
          { t: 'Fusión', fb: 'Casi. La fusión deja líquido, y aquí no hay charco. Pasa de sólido a gas: sublimación progresiva.' },
          { t: 'Evaporación', fb: 'Casi. La evaporación es de un líquido. La naftalina es sólida y pasa directo a gas: sublimación progresiva.' },
          { t: 'Sublimación progresiva', ok: true, fb: '¡Eso! De sólido a gas, sin pasar por líquido.' },
          { t: 'Sublimación regresiva', fb: 'Casi. La regresiva va de gas a sólido. La naftalina va de sólido a gas: progresiva.' }
        ]
      }]
    },
    {
      id: 'Q17', num: 17, cap: 1,
      titulo: 'Clasificación de la materia',
      html: () => regla('La materia puede ser una sustancia pura o una mezcla.', 'CLASIFICACIÓN') +
        dib(wid('arbolMateria')) +
        lista([
          '<b>Sustancia pura:</b> composición fija y definida. Puede ser un <b>elemento</b> (oro, oxígeno) o un <b>compuesto</b> (agua, sal).',
          '<b>Mezcla:</b> dos o más sustancias juntas, sin formar una nueva. Puede ser <b>homogénea</b> (suero) o <b>heterogénea</b> (agua con arena).'
        ]) +
        ojo('En química, «pura» no es «limpia» ni «natural». El agua de la llave es una mezcla: lleva sales y cloro disueltos.'),
      mas: '<p><b>Otro ejemplo:</b> un anillo de oro de 24 quilates es oro puro: una sustancia pura. Uno de 18 quilates es oro con cobre o plata: una mezcla.</p>' +
        '<p>¿Cómo saberlo? En una mezcla puedes cambiar la cantidad de cada parte y sigue siendo esa mezcla. En una sustancia pura, no.</p>',
      bloques: [{
        tipo: 'clasificar', botones: ['Sustancia pura', 'Mezcla'],
        enunciado: '¿Sustancia pura o mezcla?',
        tarjetas: [
          { html: tarj('Agua destilada (solo H₂O)'), correcta: 'Sustancia pura', fb: 'Casi. El agua destilada tiene un solo tipo de partícula, H₂O. Es una sustancia pura.' },
          { html: tarj('El aire'), correcta: 'Mezcla', fb: 'Casi. El aire lleva nitrógeno, oxígeno, argón y otros gases. Es una mezcla.' },
          { html: tarj('Sal de mesa (cloruro de sodio)'), correcta: 'Sustancia pura', fb: 'Casi. El cloruro de sodio es un solo compuesto, NaCl. Es una sustancia pura.' },
          { html: tarj('Suero oral'), correcta: 'Mezcla', fb: 'Casi. El suero oral es agua con sales y azúcar. Aunque se vea igual por todos lados, es una mezcla.' }
        ]
      }]
    },
    {
      id: 'Q18', num: 18, cap: 1,
      titulo: 'Elemento o compuesto',
      html: () => regla('Un elemento tiene un solo tipo de átomo. Un compuesto tiene dos o más elementos unidos en una proporción fija.', 'SUSTANCIAS PURAS') +
        dib(svgSustancias()) +
        '<div class="qma-dos"><div><b>Elementos</b>hierro (Fe), oxígeno (O₂), oro (Au), calcio (Ca)</div>' +
        '<div><b>Compuestos</b>agua (H₂O), sal (NaCl), dióxido de carbono (CO₂), glucosa (C₆H₁₂O₆)</div></div>' +
        ojo('Un compuesto sí se puede separar en sus elementos, pero solo con una reacción química. Filtrar o hervir no alcanza.'),
      mas: '<p><b>Otro ejemplo:</b> el agua siempre tiene 2 átomos de hidrógeno por cada átomo de oxígeno. Si cambias esa proporción, ya no es agua.</p>' +
        '<p>Un compuesto tiene propiedades nuevas. El sodio es un metal peligroso y el cloro un gas tóxico, pero juntos forman la sal de mesa.</p>',
      bloques: [{
        tipo: 'clasificar', botones: ['Elemento', 'Compuesto'],
        enunciado: '¿Elemento o compuesto?',
        tarjetas: [
          { html: tarj('Hierro (Fe)'), correcta: 'Elemento', fb: 'Casi. Fe es un solo tipo de átomo: hierro. Es un elemento.' },
          { html: tarj('Agua (H₂O)'), correcta: 'Compuesto', fb: 'Casi. H₂O tiene dos elementos: hidrógeno y oxígeno. Es un compuesto.' },
          { html: tarj('Oxígeno (O₂)'), correcta: 'Elemento', fb: 'Casi. O₂ tiene dos átomos, pero los dos son de oxígeno. Un solo tipo de átomo: es un elemento.' },
          { html: tarj('Dióxido de carbono (CO₂)'), correcta: 'Compuesto', fb: 'Casi. CO₂ tiene carbono y oxígeno: dos elementos. Es un compuesto.' }
        ]
      }]
    },
    {
      id: 'Q19', num: 19, cap: 1,
      titulo: 'Mezclas homogéneas y heterogéneas',
      html: () => regla('En una mezcla homogénea no distingues sus partes: se ve igual por todos lados. En una heterogénea sí las distingues.', 'MEZCLAS') +
        '<div class="qma-dos"><div><b>Homogéneas</b>suero, aire, agua con azúcar, vinagre</div>' +
        '<div><b>Heterogéneas</b>agua con aceite, arena con agua, arroz con menestra</div></div>' +
        ojo('Una mezcla no es un compuesto. En la mezcla cada sustancia sigue siendo la misma, y puedes cambiar las cantidades.') +
        nota('<b>¿Cómo se separan?</b> Con métodos físicos: filtración (arena y agua), decantación (agua y aceite), evaporación (sal del agua de mar), destilación (líquidos que hierven a distinta temperatura), imantación (limaduras de hierro y arena) y tamizado (piedritas y arena).'),
      mas: '<p><b>Otro ejemplo:</b> en el arroz con menestra ves el arroz y la menestra por separado: heterogénea. En un vaso de agua con azúcar bien disuelta no ves el azúcar: homogénea.</p>' +
        '<p>¿Por qué? En la homogénea las partículas se reparten tan bien que no se ve dónde está cada sustancia.</p>',
      bloques: [
        {
          tipo: 'clasificar', botones: ['Elemento', 'Compuesto', 'Mezcla homogénea', 'Mezcla heterogénea'],
          enunciado: 'Junta todo lo que viste: ¿qué es cada uno?',
          tarjetas: [
            { html: tarj('Agua con aceite'), correcta: 'Mezcla heterogénea', fb: 'Casi. Ves dos capas: el aceite flota sobre el agua. Es una mezcla heterogénea.' },
            { html: tarj('Suero fisiológico (agua con sal)'), correcta: 'Mezcla homogénea', fb: 'Casi. Son dos sustancias, agua y sal, y se ve igual por todos lados: mezcla homogénea.' },
            { html: tarj('Calcio (Ca)'), correcta: 'Elemento', fb: 'Casi. Ca es un solo tipo de átomo. Es un elemento.' },
            { html: tarj('Glucosa (C₆H₁₂O₆)'), correcta: 'Compuesto', fb: 'Casi. La glucosa tiene carbono, hidrógeno y oxígeno unidos en proporción fija: es un compuesto.' }
          ]
        },
        {
          tipo: 'opciones',
          enunciado: '¿Con qué método separas la arena del agua?',
          opciones: [
            { t: 'Filtración', ok: true, fb: '¡Bien! El agua pasa por el filtro y la arena se queda.' },
            { t: 'Imantación', fb: 'Casi. El imán atrae el hierro, no la arena. Pasa la mezcla por un filtro: la arena se queda.' },
            { t: 'Destilación', fb: 'Casi. La destilación separa líquidos que hierven a distinta temperatura. Para la arena basta un filtro.' }
          ]
        }
      ]
    },
    {
      id: 'Q20', num: 20, cap: 1,
      titulo: 'Cambio físico o cambio químico',
      html: () => regla('En un cambio físico la sustancia sigue siendo la misma. En un cambio químico se forma una sustancia nueva.', 'FÍSICO O QUÍMICO') +
        '<div class="qma-dos"><div><b>Físicos</b>el hielo se derrite, cortar papel, disolver azúcar, romper un vaso</div>' +
        '<div><b>Químicos</b>quemar el gas de la cocina, tostar pan, un clavo que se oxida, digerir la comida</div></div>' +
        '<p><b>Señales de un cambio químico:</b> cambia el color, salen burbujas de un gas nuevo, se produce luz o calor, aparece un olor nuevo o se forma un sólido dentro de un líquido (precipitado).</p>' +
        ojo('Los cambios de estado son físicos: hielo, agua y vapor son la misma sustancia, H₂O. Disolver también es físico: si evaporas el agua, recuperas el azúcar.'),
      mas: '<p><b>Otro ejemplo:</b> masticar la comida es un cambio físico: solo la partes. Digerirla es químico: los jugos digestivos la transforman en sustancias nuevas.</p>' +
        '<p>La pregunta clave: ¿al final hay una sustancia que antes no estaba? Si la hay, es químico.</p>',
      bloques: [
        {
          tipo: 'clasificar', botones: ['Cambio físico', 'Cambio químico'],
          enunciado: '¿Físico o químico?',
          tarjetas: [
            { html: tarj('Se derrite el chocolate'), correcta: 'Cambio físico', fb: 'Casi. El chocolate derretido sigue siendo chocolate: solo cambió de estado. Es físico.' },
            { html: tarj('La chicha fermenta'), correcta: 'Cambio químico', fb: 'Casi. Al fermentar, el azúcar se transforma en alcohol y gas: sustancias nuevas. Es químico.' },
            { html: tarj('Disuelves suero oral en agua'), correcta: 'Cambio físico', fb: 'Casi. Las sales y el azúcar siguen siendo los mismos, solo se reparten en el agua. Es físico.' },
            { html: tarj('Un clavo se oxida'), correcta: 'Cambio químico', fb: 'Casi. El óxido es una sustancia nueva, de otro color. Es químico.' }
          ]
        },
        {
          tipo: 'opciones',
          enunciado: 'Pones una pastilla efervescente en agua y salen muchas burbujas. ¿Qué tipo de cambio es?',
          opciones: [
            { t: 'Físico: la pastilla solo se disuelve', fb: 'Casi. Además de disolverse, reacciona: sale un gas nuevo, dióxido de carbono. Es químico.' },
            { t: 'Químico: se forma un gas nuevo', ok: true, fb: '¡Eso! Las burbujas son dióxido de carbono, un gas que antes no estaba.' },
            { t: 'Físico: es un cambio de estado', fb: 'Casi. La pastilla no pasa a gas: se forma un gas nuevo, dióxido de carbono. Es químico.' }
          ]
        }
      ]
    },
    {
      id: 'Q21', num: 21, cap: 1,
      titulo: 'Minichequeo 1',
      html: '<p>Tres preguntas rápidas. Equivocarte aquí no resta nada.</p>',
      bloques: [{
        tipo: 'chequeo',
        repaso: [14, 17, 20],
        preguntas: [
          {
            tipo: 'opciones',
            enunciado: 'En las noches frías del páramo aparece escarcha: el vapor del aire se vuelve hielo. ¿Qué cambio es?',
            opciones: [
              { t: 'Solidificación', fb: 'Casi. La solidificación es de líquido a sólido. Aquí el vapor, que es gas, pasa directo a hielo: sublimación regresiva.' },
              { t: 'Condensación', fb: 'Casi. La condensación deja líquido. Aquí el gas pasa directo a sólido: sublimación regresiva.' },
              { t: 'Sublimación regresiva', ok: true, fb: '¡Bien! De gas a sólido, sin pasar por líquido.' },
              { t: 'Sublimación progresiva', fb: 'Casi. La progresiva va de sólido a gas. Aquí es de gas a sólido: regresiva.' }
            ]
          },
          {
            tipo: 'opciones',
            enunciado: 'El aire que respiras es…',
            opciones: [
              { t: 'Un elemento', fb: 'Casi. El aire tiene varios gases: nitrógeno, oxígeno, argón… Es una mezcla, y se ve igual por todos lados: homogénea.' },
              { t: 'Un compuesto', fb: 'Casi. Sus gases no están unidos en proporción fija: solo están mezclados. Es una mezcla homogénea.' },
              { t: 'Una mezcla homogénea', ok: true, fb: '¡Bien! Varios gases que no se distinguen entre sí.' },
              { t: 'Una mezcla heterogénea', fb: 'Casi. En el aire no distingues sus partes: es una mezcla homogénea.' }
            ]
          },
          {
            tipo: 'opciones',
            enunciado: '¿Cuál es un cambio químico?',
            opciones: [
              { t: 'El hielo se derrite', fb: 'Casi. Es un cambio de estado: sigue siendo agua. Busca dónde se forma una sustancia nueva.' },
              { t: 'El azúcar se disuelve en el café', fb: 'Casi. El azúcar sigue siendo azúcar, repartida en el café. Busca dónde se forma una sustancia nueva.' },
              { t: 'La leche se agria', ok: true, fb: '¡Bien! Cambian el olor y el sabor: se formaron sustancias nuevas.' },
              { t: 'Un vaso se rompe', fb: 'Casi. El vidrio sigue siendo vidrio, en pedazos. Busca dónde se forma una sustancia nueva.' }
            ]
          }
        ],
        segundo: [
          {
            tipo: 'opciones',
            enunciado: 'Un trozo de hielo seco desaparece sin dejar charco. ¿Qué cambio es?',
            opciones: [
              { t: 'Fusión', fb: 'Casi. La fusión deja líquido, y aquí no hay charco. Pasa de sólido a gas: sublimación progresiva.' },
              { t: 'Sublimación progresiva', ok: true, fb: '¡Bien! De sólido a gas, sin pasar por líquido.' },
              { t: 'Sublimación regresiva', fb: 'Casi. La regresiva va de gas a sólido. El hielo seco va de sólido a gas: progresiva.' },
              { t: 'Vaporización', fb: 'Casi. La vaporización empieza en un líquido. El hielo seco es sólido: sublimación progresiva.' }
            ]
          },
          {
            tipo: 'opciones',
            enunciado: 'El agua con aceite es…',
            opciones: [
              { t: 'Un compuesto', fb: 'Casi. El agua y el aceite no se unen: solo están juntos. Es una mezcla, y ves dos capas: heterogénea.' },
              { t: 'Una mezcla homogénea', fb: 'Casi. Ves dos capas: el aceite flota. Si distingues sus partes, es heterogénea.' },
              { t: 'Una mezcla heterogénea', ok: true, fb: '¡Bien! Distingues sus dos partes.' },
              { t: 'Una sustancia pura', fb: 'Casi. Son dos sustancias distintas juntas: es una mezcla heterogénea.' }
            ]
          },
          {
            tipo: 'opciones',
            enunciado: '¿Cuál es un cambio físico?',
            opciones: [
              { t: 'Se quema una vela', fb: 'Casi. Al quemarse se forman gases nuevos: es químico. Busca dónde la sustancia sigue siendo la misma.' },
              { t: 'Se tuesta el pan', fb: 'Casi. Cambian el color y el olor: es químico. Busca dónde la sustancia sigue siendo la misma.' },
              { t: 'El agua hierve', ok: true, fb: '¡Bien! El vapor sigue siendo agua: solo cambió de estado.' },
              { t: 'Un clavo se oxida', fb: 'Casi. El óxido es una sustancia nueva: es químico. Busca dónde la sustancia sigue siendo la misma.' }
            ]
          }
        ],
        salida: '¡Muy bien! Ya sabes los estados, sus cambios y cómo se clasifica la materia.'
      }]
    },
    {
      id: 'Q22', num: 22, cap: 1,
      titulo: c => '¡Capítulo 1 listo, ' + esc(c.nombre) + '!',
      html: () => '<div class="sello">' + LS.svg.sello('Capítulo 1 superado') + '</div>' +
        '<p>Ya sabes qué es la materia, sus 3 estados, sus cambios y cómo se clasifica.</p>' +
        '<p><b>Lo que viene:</b> el átomo por dentro. Y la respuesta a tu apuesta del inicio.</p>' +
        '<p class="caja-nota">Puedes parar aquí: tu avance quedó guardado.</p>'
    },

    // ======================= CAPÍTULO 2 =======================
    {
      id: 'Q30', num: 30, cap: 2,
      entrada: 'Capítulo 2 de 3 · El átomo · unos 10 minutos',
      titulo: 'Primeros modelos: Dalton y Thomson',
      html: () => regla('Un modelo atómico es una idea de cómo es el átomo. Cambia cuando un experimento muestra algo nuevo.', 'MODELOS') +
        '<p>Hace unos 2400 años, el griego <b>Demócrito</b> imaginó partículas que ya no se pueden dividir. Las llamó átomos. Era solo una idea, sin experimentos.</p>' +
        '<div class="qma-dos"><div><b>Dalton (1808)</b>' + svgDalton() + 'Todo está hecho de átomos: esferas macizas que no se dividen. Los átomos de un mismo elemento son iguales.</div>' +
        '<div><b>Thomson (1904)</b>' + svgThomson() + 'Descubrió el ' + neg('electrón') + '. Su átomo: una esfera positiva con electrones incrustados, como pasas en un budín.</div></div>' +
        ojo('Algunos libros dicen que Demócrito habló de 4 elementos: fuego, tierra, agua y aire. Esa idea es de Empédocles y Aristóteles, no de Demócrito.'),
      mas: '<p><b>Otra forma de verlo:</b> el átomo de Thomson es como una sandía. La pulpa es la parte positiva y las pepas son los electrones negativos.</p>' +
        '<p>¿Por qué cambió el modelo? Dalton creía que el átomo no tenía partes. Thomson encontró partes más pequeñas: los electrones (1897).</p>',
      bloques: [
        {
          tipo: 'opciones',
          enunciado: '¿Qué descubrió Thomson?',
          opciones: [
            { t: 'El núcleo', fb: 'Casi. El núcleo lo descubrió Rutherford, años después. Thomson encontró una partícula negativa.' },
            { t: 'El electrón', ok: true, fb: '¡Eso! Por eso su modelo tiene electrones incrustados.' },
            { t: 'El neutrón', fb: 'Casi. El neutrón llegó en 1932, con Chadwick. Thomson encontró una partícula negativa.' },
            { t: 'Que el átomo es una esfera maciza', fb: 'Casi. Esa es la idea de Dalton. Thomson encontró que el átomo tiene partes.' }
          ]
        },
        {
          tipo: 'opciones',
          enunciado: 'Según Dalton, ¿cómo es el átomo?',
          opciones: [
            { t: 'Una esfera positiva con electrones incrustados', fb: 'Casi. Ese es el modelo de Thomson. Dalton no conocía los electrones: para él era una esfera maciza.' },
            { t: 'Una esfera maciza que no se divide', ok: true, fb: '¡Bien! Así era el primer modelo científico del átomo.' },
            { t: 'Un núcleo con electrones alrededor', fb: 'Casi. Ese es el modelo de Rutherford. Para Dalton era una esfera maciza.' }
          ]
        }
      ]
    },
    {
      id: 'Q31', num: 31, cap: 2, masAlFallar: true,
      titulo: 'Rutherford y la lámina de oro',
      html: c => '<p>En 1911, Rutherford lanzó partículas alfa, que son positivas, contra una lámina de oro muy delgada.</p>' +
        dib(svgRutherford()) +
        '<p>Casi todas pasaron derecho. Unas pocas se desviaron. Muy pocas, más o menos 1 de cada 8000, rebotaron.</p>' +
        (hecho(c, 'Q31') ? revelaRutherford(c) : ''),
      mas: '<p><b>Otro ejemplo:</b> patea pelotas contra la red de un arco de fútbol. Casi todas pasan por los huecos. Muy pocas chocan con un hilo y rebotan.</p>' +
        '<p>Así razonó Rutherford: si casi todo pasa, el átomo es casi vacío. Si algo rebota, adentro hay algo pequeño, pesado y positivo: el núcleo.</p>',
      bloques: [
        {
          tipo: 'opciones',
          enunciado: 'Casi todas las partículas pasaron derecho. ¿Qué nos dice eso?',
          opciones: [
            { t: 'Que la lámina tenía huecos', fb: 'Casi. La lámina era de oro macizo, sin huecos. Los «huecos» están dentro de cada átomo.' },
            { t: 'Que el átomo es casi todo espacio vacío', ok: true, fb: '¡Exacto! Mira lo que descubrió:' },
            { t: 'Que las partículas eran muy pequeñas', fb: 'Casi. Si el átomo estuviera lleno, hasta algo pequeño chocaría. Pasaron porque adentro casi no hay nada.' },
            { t: 'Que el oro es muy blando', fb: 'Casi. No depende de lo blando. Pasaron porque dentro de cada átomo casi no hay nada.' }
          ],
          solucion: 'Casi todas pasaron porque el átomo es casi todo espacio vacío. Mira lo que descubrió:'
        },
        { tipo: 'revelar', html: c => hecho(c, 'Q31') ? '' : revelaRutherford(c) }
      ]
    },
    {
      id: 'Q32', num: 32, cap: 2,
      titulo: 'Bohr y el modelo actual',
      html: () => regla('En el modelo de Bohr, los electrones giran en niveles de energía fijos alrededor del núcleo, como los pisos de un edificio.', 'BOHR') +
        '<p><b>Hoy</b> se usa el modelo actual, llamado mecánico-cuántico. El electrón no sigue un camino fijo: está en <b>orbitales</b>, regiones donde es más probable encontrarlo.</p>' +
        ojo('El átomo no es un sistema solar en miniatura. El modelo de Bohr es útil, pero es una simplificación.') +
        '<p class="peq tinta-2">Los orbitales y cómo se llenan los verás en la próxima clase.</p>',
      mas: '<p><b>Otro ejemplo:</b> en una escalera te paras en un escalón, nunca entre dos. Así ve Bohr al electrón: solo en ciertos niveles de energía.</p>' +
        '<p>¿Por qué cambió? Bohr explicó la luz que emite el hidrógeno. Luego se vio que no se puede saber el camino exacto del electrón: solo dónde es probable hallarlo.</p>',
      bloques: [
        { tipo: 'custom', render: explorarModelos },
        {
          tipo: 'clasificar', botones: ['Dalton', 'Thomson', 'Rutherford', 'Bohr'],
          enunciado: '¿De quién es cada modelo?',
          tarjetas: [
            { html: tarj('Esfera maciza que no se divide'), correcta: 'Dalton', fb: 'Casi. La esfera maciza es el primer modelo, de 1808. Es de Dalton.' },
            { html: tarj('Electrones en niveles de energía'), correcta: 'Bohr', fb: 'Casi. Los niveles de energía llegaron en 1913, con Bohr.' },
            { html: tarj('Núcleo diminuto y positivo'), correcta: 'Rutherford', fb: 'Casi. El núcleo salió del experimento de la lámina de oro: Rutherford.' },
            { html: tarj('Esfera positiva con electrones incrustados'), correcta: 'Thomson', fb: 'Casi. El «budín de pasas» es de Thomson, el que descubrió el electrón.' }
          ]
        }
      ]
    },
    {
      id: 'Q33', num: 33, cap: 2,
      titulo: 'Las 3 partículas del átomo',
      html: () => regla('El núcleo tiene ' + PROTON + ' (+) y ' + NEUTRON + ' (sin carga). Los ' + ELECTRON + ' (' + MENOS + ') se mueven alrededor del núcleo.', 'PARTÍCULAS') +
        dib(svgAtomo(), 'qma-dib-chico') +
        tabla(['Partícula', 'Carga', 'Masa', 'Dónde está'], [
          [pos('Protón'), '+1', '≈ 1 u', 'en el núcleo'],
          [neu('Neutrón'), '0', '≈ 1 u', 'en el núcleo'],
          [neg('Electrón'), MENOS + '1', 'casi 0 (1836 veces menos que el protón)', 'alrededor del núcleo']
        ]) +
        '<p>El protón pesa unas <b>1836 veces</b> más que el electrón. Por eso casi toda la masa del átomo está en el núcleo.</p>' +
        '<p class="peq tinta-2">El neutrón lo descubrió Chadwick en 1932. La «u» es la unidad de masa atómica.</p>',
      mas: '<p><b>Otro ejemplo:</b> si un electrón pesara lo que un grano de arroz, un protón pesaría lo que 1836 granos juntos.</p>' +
        '<p>El neutrón pesa un poquito más que el protón. Para contar, a los dos les damos 1 u.</p>',
      bloques: [
        {
          tipo: 'opciones',
          enunciado: '¿Dónde está casi toda la masa del átomo?',
          opciones: [
            { t: 'En los electrones', fb: 'Casi. El electrón pesa unas 1836 veces menos que el protón. La masa está en el núcleo.' },
            { t: 'En el núcleo', ok: true, fb: '¡Bien! Ahí están los protones y los neutrones, que son los que pesan.' },
            { t: 'Repartida por todo el átomo', fb: 'Casi. El átomo es casi vacío y los electrones casi no pesan. La masa está en el núcleo.' }
          ]
        },
        {
          tipo: 'opciones',
          enunciado: '¿Qué partícula no tiene carga?',
          opciones: [
            { t: 'El protón', fb: 'Casi. El protón es positivo, +1. Busca la partícula neutra.' },
            { t: 'El neutrón', ok: true, fb: '¡Eso! Neutrón viene de «neutro».' },
            { t: 'El electrón', fb: 'Casi. El electrón es negativo, ' + MENOS + '1. Busca la partícula neutra.' }
          ]
        }
      ]
    },
    {
      id: 'Q34', num: 34, cap: 2, masAlFallar: true,
      titulo: 'El número atómico Z',
      html: () => regla('El número atómico Z es el número de ' + PROTON + '. Z dice qué elemento es.', 'Z') +
        '<p><b>Ejemplos:</b> hidrógeno Z = 1, carbono Z = 6, oxígeno Z = 8, sodio Z = 11, calcio Z = 20, hierro Z = 26.</p>' +
        '<p>Todo átomo con 6 protones es carbono. Si tiene 7, ya es nitrógeno.</p>' +
        '<p>En un átomo <b>neutro</b> hay tantos ' + ELECTRON + ' como protones: electrones = Z.</p>',
      mas: '<p><b>Otro ejemplo:</b> el oxígeno tiene Z = 8: todos sus átomos tienen 8 protones. Si es neutro, también tiene 8 electrones.</p>' +
        '<p>¿Por qué los protones y no los electrones? Los electrones se ganan o se pierden con facilidad. Los protones no cambian en las reacciones químicas.</p>',
      bloques: [
        {
          tipo: 'custom',
          render: retoAtomo({
            enunciado: 'Reto: construye un átomo <b>neutro de carbono</b> (Z = 6). De paso, mira qué pasa al cambiar los protones.',
            inicio: { p: 1, n: 0, e: 1 },
            max: { p: 10, n: 12, e: 10 },
            meta: v => v.p === 6 && v.e === 6,
            pista: v => v.p === 6 ? 'Ya tienes 6 protones: es carbono. Ahora iguala los electrones para que sea neutro.'
              : v.e === 6 ? 'Tienes 6 electrones. Pero el elemento lo deciden los protones: pon 6.'
                : v.p > 0 && v.p !== 1 ? 'Con ' + v.p + ' protones es otro elemento. El carbono tiene Z = 6.' : '',
            okFb: '¡Bien! 6 protones: carbono. 6 electrones: neutro. Los neutrones no cambian el elemento.',
            solucion: 'Pon 6 protones (Z = 6) y 6 electrones, así las cargas se anulan. Los neutrones no cambian el elemento.',
            final: { p: 6, n: 6, e: 6 }
          })
        },
        {
          tipo: 'opciones',
          enunciado: '¿Qué pasa si a un átomo le cambias el número de protones?',
          opciones: [
            { t: 'Se vuelve un ion', fb: 'Casi. Un ion cambia electrones, no protones. Si cambian los protones, cambia Z.' },
            { t: 'Se vuelve otro elemento', ok: true, fb: '¡Eso! Z cambia, y Z dice qué elemento es.' },
            { t: 'Se vuelve un isótopo', fb: 'Casi. Un isótopo cambia neutrones. Si cambian los protones, cambia Z: es otro elemento.' },
            { t: 'No cambia nada', fb: 'Casi. Los protones son Z, y Z dice qué elemento es. Cambia todo.' }
          ]
        }
      ]
    },
    {
      id: 'Q35', num: 35, cap: 2, masAlFallar: true,
      titulo: 'Número de masa A y neutrones',
      html: () => regla('El número de masa A es la suma de protones y neutrones. Para hallar los neutrones: n = A ' + MENOS + ' Z.', 'A') +
        ejemplo({
          titulo: 'Ejemplo: sodio con A = 23 y Z = 11',
          pasos: [
            { t: 'Protones', html: 'p = Z = 11' },
            { t: 'Neutrones', html: 'n = A ' + MENOS + ' Z = 23 ' + MENOS + ' 11 = 12' },
            { t: 'Comprueba', html: '11 + 12 = 23. Da A.' }
          ]
        }) +
        nota('A siempre es un número entero: cuenta las partículas del núcleo. Los electrones no entran en A.'),
      mas: ejemplo({
        titulo: 'Otro ejemplo: calcio con A = 40 y Z = 20',
        pasos: [
          { t: 'Protones', html: 'p = Z = 20' },
          { t: 'Neutrones', html: 'n = 40 ' + MENOS + ' 20 = 20' }
        ]
      }) +
        '<p>¿Por qué se llama «de masa»? Protones y neutrones pesan casi 1 u cada uno. Así, A es casi la masa del átomo en u.</p>',
      bloques: [
        {
          tipo: 'teclado',
          enunciado: 'El cloro-35 tiene A = 35 y Z = 17. ¿Cuántos neutrones tiene?',
          correcta: 18,
          errores: {
            '52': 'Casi. Sumaste. Para los neutrones se resta: n = A ' + MENOS + ' Z.',
            '17': 'Casi. 17 son los protones (Z). Los neutrones son A ' + MENOS + ' Z.',
            '35': 'Casi. 35 es A: protones y neutrones juntos. Quita los protones.'
          },
          okFb: '¡Bien! 35 ' + MENOS + ' 17 = 18 neutrones.',
          solucion: 'n = A ' + MENOS + ' Z = 35 ' + MENOS + ' 17 = 18.'
        },
        {
          tipo: 'teclado',
          enunciado: 'Un átomo de flúor tiene 9 protones y 10 neutrones. ¿Cuál es su número de masa A?',
          correcta: 19,
          errores: {
            '1': 'Casi. Restaste. A es la suma de protones y neutrones.',
            '9': 'Casi. 9 es Z, los protones. A suma protones y neutrones.',
            '10': 'Casi. 10 son los neutrones. A suma protones y neutrones.'
          },
          okFb: '¡Bien! A = 9 + 10 = 19.',
          solucion: 'A = p + n = 9 + 10 = 19.'
        }
      ]
    },
    {
      id: 'Q36', num: 36, cap: 2,
      titulo: 'Cómo se escribe un átomo',
      html: () => regla('El número de masa A va arriba a la izquierda del símbolo. El número atómico Z va abajo a la izquierda.', 'NOTACIÓN') +
        '<div class="centro">' + nt(23, 11, 'Na', 0, true) + '</div>' +
        '<p class="centro">A = 23, arriba · Z = 11, abajo · Na = sodio</p>' +
        '<p>Si el átomo tiene carga, va arriba a la <b>derecha</b>: ' + nt(23, 11, 'Na', 1) + '.</p>' +
        nota('También se escribe con el nombre: sodio-23, carbono-14. A veces no se pone Z, porque el símbolo ya dice qué elemento es: ¹⁴C.'),
      mas: () => '<p><b>Otro ejemplo:</b> ' + nt(127, 53, 'I') + ' es yodo, el que necesita tu tiroides. Tiene 53 protones y 127 ' + MENOS + ' 53 = 74 neutrones.</p>' +
        '<p>¿Por qué dos números? Z dice qué elemento es. A dice qué tan pesado es ese átomo.</p>',
      bloques: [
        {
          tipo: 'opciones',
          enunciado: () => 'En ' + nt(39, 19, 'K') + ', ¿qué significa el 39?',
          opciones: [
            { t: 'El número atómico Z', fb: 'Casi. Z va abajo: es el 19. El número de arriba a la izquierda es otro.' },
            { t: 'El número de masa A', ok: true, fb: '¡Bien! Arriba a la izquierda va A: protones más neutrones.' },
            { t: 'El número de neutrones', fb: 'Casi. Los neutrones no se escriben: se calculan, 39 ' + MENOS + ' 19 = 20.' },
            { t: 'La carga', fb: 'Casi. La carga va arriba a la derecha. Arriba a la izquierda va otra cosa.' }
          ]
        },
        {
          tipo: 'opciones', columnas: 2,
          enunciado: () => '¿Cuántos neutrones tiene ' + nt(56, 26, 'Fe') + ', el hierro de tu hemoglobina?',
          opciones: [
            { t: '26', fb: 'Casi. 26 es Z, los protones. Los neutrones son A ' + MENOS + ' Z.' },
            { t: '30', ok: true, fb: '¡Bien! 56 ' + MENOS + ' 26 = 30.' },
            { t: '56', fb: 'Casi. 56 es A: protones y neutrones juntos. Resta Z.' },
            { t: '82', fb: 'Casi. Sumaste. Los neutrones son A ' + MENOS + ' Z.' }
          ]
        }
      ]
    },
    {
      id: 'Q37', num: 37, cap: 2, masAlFallar: true,
      titulo: 'Isótopos',
      html: () => regla('Los isótopos son átomos del mismo elemento (mismo Z) con distinto número de neutrones (distinto A).', 'ISÓTOPOS') +
        tabla(['Hidrógeno', 'Protones', 'Neutrones', 'A'], [
          [nt(1, 1, 'H') + ' protio', '1', '0', '1'],
          [nt(2, 1, 'H') + ' deuterio', '1', '1', '2'],
          [nt(3, 1, 'H') + ' tritio', '1', '2', '3']
        ]) +
        '<p>Los tres son hidrógeno: todos tienen 1 protón.</p>' +
        sabias('El <b>carbono-14</b> sirve para calcular la edad de restos antiguos. El <b>yodo-131</b> se usa en medicina para tratar enfermedades de la tiroides.') +
        ojo('Un isótopo no es un ion. El isótopo cambia neutrones; el ion cambia electrones.'),
      mas: '<p><b>Otro ejemplo:</b> el oxígeno-16 y el oxígeno-18 son oxígeno: los dos tienen 8 protones. El primero tiene 8 neutrones y el segundo, 10.</p>' +
        '<p>¿Por qué siguen siendo el mismo elemento? El elemento lo decide Z, y los neutrones no cambian Z.</p>',
      bloques: [
        {
          tipo: 'custom',
          render: retoAtomo({
            enunciado: 'Reto: este es un átomo de <b>carbono-12</b>. Conviértelo en <b>carbono-14</b>.',
            inicio: { p: 6, n: 6, e: 6 },
            max: { p: 10, n: 12, e: 10 },
            bloquear: ['p', 'e'],
            meta: v => v.p === 6 && v.n === 8,
            pista: v => v.p !== 6 ? 'Si cambias los protones, cambias de elemento. Deja 6.'
              : v.n > 8 ? 'Te pasaste: ahora A = ' + (v.p + v.n) + '. El carbono-14 tiene A = 14.'
                : v.n === 7 ? 'Vas bien: ya es carbono-13. Falta uno.'
                  : v.n < 6 ? 'Así A baja. Para llegar a 14, agrega neutrones.' : '',
            okFb: '¡Bien! 6 protones y 8 neutrones: A = 14. Sigue siendo carbono: es un isótopo.',
            solucion: 'El carbono-14 tiene A = 14. Como Z = 6, necesita 14 ' + MENOS + ' 6 = 8 neutrones: agrega 2.',
            final: { p: 6, n: 8, e: 6 }
          })
        },
        {
          tipo: 'opciones',
          enunciado: '¿Qué tienen igual el carbono-12 y el carbono-14?',
          opciones: [
            { t: 'El número de neutrones', fb: 'Casi. Justo eso cambia: tienen 6 y 8 neutrones. Mira qué número define al carbono.' },
            { t: 'El número de masa A', fb: 'Casi. A es 12 y 14: distinto. Mira qué número define al carbono.' },
            { t: 'El número de protones (Z)', ok: true, fb: '¡Eso! Los dos tienen Z = 6: son carbono.' },
            { t: 'Nada: son elementos distintos', fb: 'Casi. Los dos tienen 6 protones: los dos son carbono. Son isótopos.' }
          ]
        }
      ]
    },
    {
      id: 'Q38', num: 38, cap: 2, masAlFallar: true,
      titulo: 'Iones: cationes y aniones',
      html: () => regla('Un ion es un átomo que ganó o perdió electrones. Si pierde electrones, queda positivo: ' + pos('catión') + '. Si gana, queda negativo: ' + neg('anión') + '.', 'IONES') +
        '<div class="qma-dos"><div><b class="qma-pos">Catión (+)</b>perdió electrones. Na⁺ en la sal y el suero, Ca²⁺ en tus huesos, Fe²⁺ en tu hemoglobina.</div>' +
        '<div><b class="qma-neg">Anión (' + MENOS + ')</b>ganó electrones. Cl⁻ en la sal, F⁻ en la pasta dental, O²⁻ en muchos minerales.</div></div>' +
        ojo('Los protones nunca cambian en un ion. Si cambian los protones, ya es otro elemento.') +
        '<p class="peq tinta-2">Truco: la «t» de ca<b>t</b>ión parece un signo +.</p>',
      mas: '<p><b>Otro ejemplo:</b> el calcio tiene 20 protones y 20 electrones. Si pierde 2 electrones, quedan 20 protones y 18 electrones: sobran 2 cargas +. Es el ion Ca²⁺.</p>' +
        '<p>¿Por qué perder electrones deja carga positiva? Porque ahora hay más protones (+) que electrones (' + MENOS + ').</p>',
      bloques: [
        {
          tipo: 'custom',
          render: retoAtomo({
            enunciado: 'Reto: este es un átomo de sodio (11 protones). Conviértelo en el ion <b>Na⁺</b> del suero.',
            inicio: { p: 11, n: 12, e: 11 },
            max: { p: 20, n: 24, e: 20 },
            bloquear: ['p', 'n'],
            meta: v => v.p === 11 && v.e === 10,
            pista: v => v.p !== 11 ? 'Si cambias los protones, cambias de elemento. Deja 11.'
              : v.e > 11 ? 'Así ganó electrones y quedó negativo: un anión. Na⁺ es positivo.'
                : v.e < 10 ? 'Quitaste de más: la carga ya es mayor que 1+. Na⁺ perdió solo 1 electrón.' : '',
            okFb: '¡Bien! 11 protones y 10 electrones: sobra una carga +. Es el catión Na⁺.',
            solucion: 'Na⁺ perdió 1 electrón: quita uno. Quedan 11 protones y 10 electrones.',
            final: { p: 11, n: 12, e: 10 }
          })
        },
        {
          tipo: 'opciones',
          enunciado: 'Un átomo de cloro gana 1 electrón. ¿Qué se forma?',
          opciones: [
            { t: 'Un catión: Cl⁺', fb: 'Casi. Ganar un electrón deja una carga ' + MENOS + ' de más. Se forma un anión.' },
            { t: 'Un anión: Cl⁻', ok: true, fb: '¡Bien! Ganó un electrón: queda negativo.' },
            { t: 'Otro elemento', fb: 'Casi. Los protones no cambiaron: sigue siendo cloro. Cambió un electrón: es un ion.' },
            { t: 'Un isótopo del cloro', fb: 'Casi. El isótopo cambia neutrones. Aquí cambió un electrón: es un ion.' }
          ]
        }
      ]
    },
    {
      id: 'Q39', num: 39, cap: 2, masAlFallar: true,
      titulo: 'Contar protones, neutrones y electrones',
      html: () => regla('Protones = Z. Neutrones = A ' + MENOS + ' Z. Electrones: a Z le restas la carga si es catión, o se la sumas si es anión.', 'CONTAR') +
        ejemplo({
          titulo: 'Ejemplo resuelto: ' + nt(40, 20, 'Ca', 2),
          pasos: [
            { t: 'Protones', html: 'p = Z = 20' },
            { t: 'Neutrones', html: 'n = A ' + MENOS + ' Z = 40 ' + MENOS + ' 20 = 20' },
            { t: 'Electrones', html: 'Es catión 2+: perdió 2. e = 20 ' + MENOS + ' 2 = 18' }
          ]
        }) +
        ojo('En un anión se suma: ' + nt(16, 8, 'O', -2) + ' ganó 2 electrones, así que tiene 8 + 2 = 10.'),
      mas: () => ejemplo({
        titulo: 'Otro ejemplo: ' + nt(56, 26, 'Fe', 2) + ', el hierro de la hemoglobina',
        pasos: [
          { t: 'Protones', html: 'p = Z = 26' },
          { t: 'Neutrones', html: 'n = 56 ' + MENOS + ' 26 = 30' },
          { t: 'Electrones', html: 'Es catión 2+: e = 26 ' + MENOS + ' 2 = 24' }
        ]
      }) +
        '<p>¿Por qué funciona? La carga es la diferencia entre protones y electrones. Con 2 electrones menos, sobran 2 cargas +.</p>',
      bloques: [
        {
          tipo: 'teclado',
          enunciado: () => '¿Cuántos electrones tiene ' + nt(35, 17, 'Cl', -1) + '?',
          correcta: 18,
          errores: {
            '16': 'Casi. Restaste, pero es un anión: ganó 1 electrón. Súmalo a Z.',
            '17': 'Casi. 17 tendría el átomo neutro. Este es un anión: ganó 1 electrón.',
            '35': 'Casi. 35 es A: protones más neutrones. Los electrones salen de Z y la carga.'
          },
          okFb: '¡Bien! Anión: 17 + 1 = 18 electrones.',
          solucion: 'Z = 17. Es anión 1' + MENOS + ': ganó 1 electrón. e = 17 + 1 = 18.'
        },
        {
          tipo: 'teclado',
          enunciado: () => '¿Cuántos electrones tiene ' + nt(27, 13, 'Al', 3) + '?',
          correcta: 10,
          errores: {
            '16': 'Casi. Sumaste, pero es un catión: perdió 3 electrones. Réstalos a Z.',
            '13': 'Casi. 13 tendría el átomo neutro. Es catión 3+: perdió 3.',
            '14': 'Casi. 14 son los neutrones (27 ' + MENOS + ' 13). La pregunta es por electrones.'
          },
          okFb: '¡Bien! Catión: 13 ' + MENOS + ' 3 = 10 electrones.',
          solucion: 'Z = 13. Es catión 3+: perdió 3 electrones. e = 13 ' + MENOS + ' 3 = 10.'
        }
      ]
    },
    {
      id: 'Q40', num: 40, cap: 2,
      titulo: 'Trampa: ¿qué partícula cambió?',
      html: () => regla('Si cambian los protones, es otro elemento. Si cambian los neutrones, es un isótopo. Si cambian los electrones, es un ion.', 'QUÉ CAMBIÓ') +
        tabla(['Si cambian…', 'Resultado', 'Ejemplo'], [
          [PROTON, 'otro elemento', '6 protones: carbono. 7: nitrógeno'],
          [NEUTRON, 'isótopo', 'carbono-12 y carbono-14'],
          [ELECTRON, 'ion', 'Na y Na⁺']
        ]) +
        ojo('Los electrones no cambian el elemento. El Na⁺ del suero sigue siendo sodio.'),
      mas: '<p><b>Otro ejemplo:</b> el hierro de tu sangre está como Fe²⁺. Perdió 2 electrones, pero tiene 26 protones: sigue siendo hierro.</p>' +
        '<p>¿Por qué? Solo Z define el elemento. Los neutrones cambian la masa; los electrones, la carga.</p>',
      bloques: [{
        tipo: 'clasificar', botones: ['Otro elemento', 'Isótopo', 'Ion'],
        enunciado: '¿Qué se forma en cada caso?',
        tarjetas: [
          { html: tarj('Un átomo de carbono gana 2 neutrones'), correcta: 'Isótopo', fb: 'Casi. Cambiaron los neutrones: sigue siendo carbono, con otra masa. Es un isótopo.' },
          { html: tarj('Un átomo de sodio pierde 1 electrón'), correcta: 'Ion', fb: 'Casi. Cambiaron los electrones: es un ion, el catión Na⁺. Sigue siendo sodio.' },
          { html: tarj('Un núcleo gana 1 protón'), correcta: 'Otro elemento', fb: 'Casi. Cambió Z, así que ahora es otro elemento.' },
          { html: tarj('Un átomo de oxígeno gana 2 electrones'), correcta: 'Ion', fb: 'Casi. Cambiaron los electrones: es un ion, el anión O²⁻.' }
        ]
      }]
    },
    {
      id: 'Q41', num: 41, cap: 2,
      titulo: 'Trampa: la masa atómica no es A',
      html: () => regla('La masa atómica de la tabla es un decimal: el promedio de los isótopos. El número de masa A es un entero: es de un solo isótopo.', 'MASA ATÓMICA') +
        '<div class="qma-casilla">' + wid('casilla', 17, { grande: true }) + '</div>' +
        '<p>El cloro tiene dos isótopos: ' + nt(35, 17, 'Cl') + ' y ' + nt(37, 17, 'Cl') + '. La tabla da su promedio: <b>35,45</b>.</p>' +
        ojo('Ningún átomo tiene 35,45 partículas en el núcleo. Para contar neutrones usa A, que es entero.') +
        nota('Si un ejercicio solo te da la tabla y te pide redondear, redondea la masa atómica: sodio 22,99 da A = 23. Es una aproximación.'),
      mas: '<p><b>Otro ejemplo:</b> en la tabla, el carbono dice 12,011. Casi todo el carbono es carbono-12, con un poquito de carbono-13. Por eso el promedio pasa apenas de 12.</p>' +
        '<p>¿Por qué un promedio? En la naturaleza, cada elemento viene con sus isótopos mezclados.</p>',
      bloques: [{
        tipo: 'opciones',
        enunciado: 'En la tabla, el cloro dice 35,45. ¿Qué es ese número?',
        opciones: [
          { t: 'Su número de masa A', fb: 'Casi. A es entero: 35 o 37, según el isótopo. El decimal sale de juntar los dos.' },
          { t: 'Su número de protones', fb: 'Casi. Los protones son Z = 17, un entero. El decimal es una masa.' },
          { t: 'El promedio de las masas de sus isótopos', ok: true, fb: '¡Exacto! Por eso tiene decimales.' },
          { t: 'Su número de neutrones', fb: 'Casi. Los neutrones son un entero que se cuenta. El decimal es una masa.' }
        ]
      }]
    },
    {
      id: 'Q42', num: 42, cap: 2,
      titulo: 'Minichequeo 2',
      html: '<p>Tres preguntas para ver cómo vas. Equivocarte aquí no resta nada.</p>',
      bloques: [{
        tipo: 'chequeo',
        repaso: [34, 38, 39],
        preguntas: [
          {
            tipo: 'opciones', columnas: 2,
            enunciado: '¿Qué modelo propuso que los electrones giran en niveles de energía?',
            opciones: [
              { t: 'Dalton', fb: 'Casi. Dalton no conocía los electrones: su átomo era una esfera maciza.' },
              { t: 'Thomson', fb: 'Casi. Thomson puso los electrones incrustados en una esfera, sin niveles.' },
              { t: 'Rutherford', fb: 'Casi. Rutherford descubrió el núcleo. Los niveles llegaron después.' },
              { t: 'Bohr', ok: true, fb: '¡Bien! Bohr, en 1913.' }
            ]
          },
          {
            tipo: 'teclado',
            enunciado: () => '¿Cuántos electrones tiene ' + nt(23, 11, 'Na', 1) + '?',
            correcta: 10,
            errores: {
              '12': 'Casi. Sumaste, pero es un catión: perdió 1 electrón. Réstalo a Z.',
              '11': 'Casi. 11 tendría el átomo neutro. Es catión: perdió 1.',
              '23': 'Casi. 23 es A. Los electrones salen de Z y la carga.'
            },
            okFb: '¡Bien! Catión: 11 ' + MENOS + ' 1 = 10 electrones.',
            solucion: 'Z = 11. Es catión 1+: perdió 1 electrón. e = 11 ' + MENOS + ' 1 = 10.'
          },
          {
            tipo: 'opciones',
            enunciado: 'El carbono-12 y el carbono-14 son…',
            opciones: [
              { t: 'Iones del carbono', fb: 'Casi. Los iones cambian electrones. Aquí cambia A, o sea, los neutrones.' },
              { t: 'Isótopos del carbono', ok: true, fb: '¡Bien! Mismo Z, distinto número de neutrones.' },
              { t: 'Dos elementos distintos', fb: 'Casi. Los dos tienen 6 protones: los dos son carbono.' },
              { t: 'Un compuesto', fb: 'Casi. Un compuesto une elementos distintos. Aquí son dos formas del mismo elemento.' }
            ]
          }
        ],
        segundo: [
          {
            tipo: 'opciones', columnas: 2,
            enunciado: '¿Quién descubrió que el átomo tiene un núcleo diminuto?',
            opciones: [
              { t: 'Dalton', fb: 'Casi. Para Dalton el átomo era una esfera maciza, sin partes.' },
              { t: 'Thomson', fb: 'Casi. Thomson descubrió el electrón. El núcleo salió de la lámina de oro.' },
              { t: 'Rutherford', ok: true, fb: '¡Bien! Con la lámina de oro, en 1911.' },
              { t: 'Bohr', fb: 'Casi. Bohr usó un núcleo que ya se conocía y le agregó niveles de energía.' }
            ]
          },
          {
            tipo: 'teclado',
            enunciado: () => '¿Cuántos electrones tiene ' + nt(19, 9, 'F', -1) + '?',
            correcta: 10,
            errores: {
              '8': 'Casi. Restaste, pero es un anión: ganó 1 electrón. Súmalo a Z.',
              '9': 'Casi. 9 tendría el átomo neutro. Es anión: ganó 1.',
              '19': 'Casi. 19 es A. Los electrones salen de Z y la carga.'
            },
            okFb: '¡Bien! Anión: 9 + 1 = 10 electrones.',
            solucion: 'Z = 9. Es anión 1' + MENOS + ': ganó 1 electrón. e = 9 + 1 = 10.'
          },
          {
            tipo: 'opciones',
            enunciado: '¿Qué partícula cambia cuando un átomo se vuelve ion?',
            opciones: [
              { t: 'Los protones', fb: 'Casi. Si cambian los protones, es otro elemento.' },
              { t: 'Los neutrones', fb: 'Casi. Si cambian los neutrones, es un isótopo.' },
              { t: 'Los electrones', ok: true, fb: '¡Bien! Ganar o perder electrones cambia la carga.' }
            ]
          }
        ],
        salida: '¡Muy bien! Ya sabes cómo es un átomo por dentro y cómo contar sus partículas.'
      }]
    },
    {
      id: 'Q43', num: 43, cap: 2,
      titulo: c => '¡Capítulo 2 listo, ' + esc(c.nombre) + '!',
      html: () => '<div class="sello">' + LS.svg.sello('Capítulo 2 superado') + '</div>' +
        '<p>Ya sabes los modelos del átomo, sus 3 partículas, Z, A, los isótopos y los iones.</p>' +
        '<p><b>Lo que viene:</b> la tabla periódica, el mapa de los 118 elementos.</p>' +
        '<p class="caja-nota">Puedes parar aquí: tu avance quedó guardado.</p>'
    }
  ];

  LS.LAMINAS = (LS.LAMINAS || []).concat(LAMINAS);
})();
