/* Widgets de química (LS.QM): casilla, notación, tabla periódica, constructor de átomos,
   partículas (estados), cambios de estado, árbol de la materia y modelos atómicos.
   Colores: tokens de css/ls.css. Carga positiva / protón = var(--pos); negativa / electrón = var(--neg);
   neutrón = var(--ink-3). Colores de familia: variables --qm-* de css/qm-widgets.css.
   Requiere js/qm-tabla-data.js (LS.QM.ELEMENTOS) cargado antes. */
(function () {
  'use strict';
  const LS = window.LS = window.LS || {};
  const QM = LS.QM = LS.QM || {};
  const MENOS = '−';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const menosMov = () => (typeof LS.menosMovimiento === 'function' ? LS.menosMovimiento() :
    !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches));
  let uid = 0;
  const nuevoId = (p) => 'qm' + (p || '') + (++uid);

  // ---------- CSS extra inyectada (una sola vez) para animaciones y hovers ----------
  function inyectarCSS() {
    if (typeof document === 'undefined' || document.getElementById('qm-widgets-inline')) return;
    const st = document.createElement('style');
    st.id = 'qm-widgets-inline';
    st.textContent = ''
      + '.qm-con-dib{overflow:hidden;position:relative;border-radius:16px;}'
      + '.qm-con-dib .qm-atomo{overflow:hidden !important;display:block;max-width:100%;}'
      + '@keyframes qmw-rot{to{transform:rotate(360deg);}}'
      + '.qm-atomo .qm-orb-anim{animation:qmw-rot 8s linear infinite;transform-box:view-box;transform-origin:50% 50%;}'
      + '.qm-atomo .qm-orb-anim.qm-orb-inv{animation-direction:reverse;}'
      + '@keyframes qmw-pop{0%{transform:scale(0);opacity:0}65%{transform:scale(1.35);opacity:1}100%{transform:scale(1);opacity:1}}'
      + '.qm-atomo .qm-nuevo-p,.qm-atomo .qm-nuevo-n{animation:qmw-pop .35s cubic-bezier(.34,1.56,.64,1) both;transform-box:fill-box;transform-origin:center;}'
      + '@keyframes qmw-in-e{0%{opacity:0;transform:scale(0) rotate(-180deg)}70%{opacity:1;transform:scale(1.15) rotate(-20deg)}100%{opacity:1;transform:scale(1) rotate(0)}}'
      + '.qm-atomo .qm-nuevo-e{animation:qmw-in-e .5s cubic-bezier(.2,.8,.2,1) both;transform-box:fill-box;transform-origin:center;}'
      + '@keyframes qmw-flash{0%{opacity:1;transform:none}40%{opacity:.55;transform:scale(.96)}100%{opacity:1;transform:none}}'
      + '.qm-con-dib.qm-quitar .qm-atomo{animation:qmw-flash .22s ease-out;}'
      + '@keyframes qmw-halo{0%{box-shadow:0 0 0 0 rgba(16,185,129,0)}20%{box-shadow:0 0 0 6px rgba(16,185,129,.95),0 0 32px 10px rgba(16,185,129,.7)}60%{box-shadow:0 0 0 5px rgba(16,185,129,.6),0 0 20px 6px rgba(16,185,129,.35)}100%{box-shadow:0 0 0 0 rgba(16,185,129,0)}}'
      + '.qm-con-dib.qm-halo-ok{animation:qmw-halo 1.1s ease-out;}'
      + '@media (prefers-reduced-motion: reduce){.qm-atomo .qm-orb-anim,.qm-atomo .qm-nuevo-p,.qm-atomo .qm-nuevo-n,.qm-atomo .qm-nuevo-e,.qm-con-dib.qm-quitar .qm-atomo,.qm-con-dib.qm-halo-ok{animation:none !important;}}'
      // Botones + / − del constructor: más grandes y con color por partícula
      + '.qm-con-fila .qm-pm{min-width:52px;min-height:52px;width:52px;height:52px;font-size:1.75rem;font-weight:900;border-radius:14px;border:2px solid rgba(0,0,0,.08);cursor:pointer;transition:transform .1s ease,box-shadow .12s ease,filter .12s ease;box-shadow:0 3px 0 rgba(0,0,0,.08);}'
      + '.qm-con-fila .qm-pm:hover:not(:disabled){transform:translateY(-1px);filter:brightness(1.03);}'
      + '.qm-con-fila .qm-pm:active:not(:disabled){transform:translateY(2px);box-shadow:0 1px 0 rgba(0,0,0,.08);}'
      + '.qm-con-fila .qm-pm:disabled{opacity:.38;cursor:not-allowed;box-shadow:none;}'
      + '.qm-con-fila.qm-k-p .qm-pm{background:#DBEAFE;color:#1E3A8A;border-color:#93C5FD;box-shadow:0 3px 0 #93C5FD;}'
      + '.qm-con-fila.qm-k-n .qm-pm{background:#E5E7EB;color:#374151;border-color:#9CA3AF;box-shadow:0 3px 0 #9CA3AF;}'
      + '.qm-con-fila.qm-k-e .qm-pm{background:#FFEDD5;color:#9A3412;border-color:#FDBA74;box-shadow:0 3px 0 #FDBA74;}'
      // Tabla periódica: hover levantado + brillo al acertar + tinte por familia (modo juego)
      + '.qm-tabla-caja .qm-el{transition:transform .16s ease,box-shadow .16s ease,filter .16s ease;}'
      + '.qm-tabla-caja .qm-el:hover:not(:disabled){transform:translateY(-3px);box-shadow:0 10px 20px rgba(0,0,0,.18);z-index:3;filter:brightness(1.04);}'
      + '@keyframes qmw-brillo{0%,100%{box-shadow:0 0 0 0 rgba(250,204,21,0);transform:none}40%{box-shadow:0 0 0 4px rgba(250,204,21,.9),0 0 24px 6px rgba(250,204,21,.6);transform:translateY(-4px) scale(1.08)}}'
      + '.qm-tabla-caja .qm-el.qm-brilla{animation:qmw-brillo .7s ease-out;z-index:5;}'
      + '@media (prefers-reduced-motion: reduce){.qm-tabla-caja .qm-el,.qm-tabla-caja .qm-el.qm-brilla{transition:none !important;animation:none !important;}}';
    document.head.appendChild(st);
  }

  // ---------- Datos y búsqueda ----------
  const ELEM = () => QM.ELEMENTOS || [];
  let _porSim = null;
  function porZ(z) { return ELEM()[(z | 0) - 1] || null; }
  function porSimbolo(s) {
    if (!_porSim) { _porSim = {}; ELEM().forEach(e => { _porSim[e.simbolo] = e; _porSim[e.simbolo.toLowerCase()] = _porSim[e.simbolo.toLowerCase()] || e; }); }
    s = String(s == null ? '' : s).trim();
    return _porSim[s] || _porSim[s.toLowerCase()] || null;
  }

  // categoria → nombre para mostrar y color (variable CSS; hex = valor en modo claro)
  const FAMILIAS = {
    'alcalino': { nombre: 'Metales alcalinos', corto: 'Alcalinos', color: 'var(--qm-alcalino)', hex: '#FFD3D1' },
    'alcalinoterreo': { nombre: 'Metales alcalinotérreos', corto: 'Alcalinotérreos', color: 'var(--qm-alcalinoterreo)', hex: '#FFE0BD' },
    'transicion': { nombre: 'Metales de transición', corto: 'Transición', color: 'var(--qm-transicion)', hex: '#FFF0B3' },
    'post-transicion': { nombre: 'Otros metales', corto: 'Otros metales', color: 'var(--qm-post-transicion)', hex: '#DCE5EE' },
    'metaloide': { nombre: 'Metaloides', corto: 'Metaloides', color: 'var(--qm-metaloide)', hex: '#C9EFE6' },
    'no-metal': { nombre: 'Otros no metales', corto: 'No metales', color: 'var(--qm-no-metal)', hex: '#D7F5BA' },
    'halogeno': { nombre: 'Halógenos', corto: 'Halógenos', color: 'var(--qm-halogeno)', hex: '#D8E2FF' },
    'gas-noble': { nombre: 'Gases nobles', corto: 'Gases nobles', color: 'var(--qm-gas-noble)', hex: '#ECDDFF' },
    'lantanido': { nombre: 'Lantánidos', corto: 'Lantánidos', color: 'var(--qm-lantanido)', hex: '#FCDDF0' },
    'actinido': { nombre: 'Actínidos', corto: 'Actínidos', color: 'var(--qm-actinido)', hex: '#EADFD3' }
  };
  // Extra: colores por tipo (metal / no metal / metaloide)
  const TIPOS = {
    'metal': { nombre: 'Metales', color: 'var(--qm-metal)', hex: '#DCE5EE' },
    'no metal': { nombre: 'No metales', color: 'var(--qm-nometal)', hex: '#D7F5BA' },
    'metaloide': { nombre: 'Metaloides', color: 'var(--qm-metaloide)', hex: '#C9EFE6' }
  };
  const catClase = (e) => 'qm-f-' + e.categoria;
  const tipoClase = (e) => 'qm-t-' + e.tipo.replace(' ', '');
  const nombreCorto = (e) => e.nombreCorto || e.nombre;
  const fmtCarga = (c) => !c ? '' : (Math.abs(c) === 1 ? '' : Math.abs(c)) + (c > 0 ? '+' : MENOS);
  const cargaTxt = (c) => c === 0 ? '0' : (c > 0 ? '+' : MENOS) + Math.abs(c);

  // ---------- Casilla ----------
  // casilla(z, {grande:false, etiquetas:false}) → HTML (o SVG con etiquetas)
  function casilla(z, o) {
    o = o || {};
    const e = typeof z === 'object' && z ? z : porZ(z);
    if (!e) return '';
    if (o.etiquetas) return casillaEtiquetas(e);
    const aria = e.nombre + ', símbolo ' + e.simbolo + ', número atómico ' + e.z + ', masa atómica ' + e.masaTxt;
    return '<div class="qm-casilla ' + catClase(e) + (o.grande ? ' qm-grande' : '') + '" role="img" aria-label="' + esc(aria) + '">' +
      '<span class="qm-cz" aria-hidden="true">' + e.z + '</span>' +
      '<span class="qm-cs" aria-hidden="true">' + e.simbolo + '</span>' +
      '<span class="qm-cn" aria-hidden="true">' + esc(nombreCorto(e)) + '</span>' +
      '<span class="qm-cm" aria-hidden="true">' + e.masaTxt + '</span></div>';
  }
  function casillaEtiquetas(e) {
    const W = 340, H = 186;
    const x = 12, y = 10, w = 132, h = 166, cx = x + w / 2;
    const filas = [
      { y: y + 26, t: 'Número atómico (Z)', s: 'cuántos protones tiene' },
      { y: y + 78, t: 'Símbolo', s: 'mayúscula + minúscula' },
      { y: y + 116, t: 'Nombre', s: '' },
      { y: y + 146, t: 'Masa atómica', s: 'promedio, con decimales' }
    ];
    const fam = FAMILIAS[e.categoria] || {};
    let s = '<svg class="qm-casilla-et" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc('Casilla del ' + e.nombre + ': arriba el número atómico ' + e.z + ', en el centro el símbolo ' + e.simbolo + ', debajo el nombre y abajo la masa atómica ' + e.masaTxt) + '">';
    s += '<title>Cómo leer una casilla</title>';
    s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="16" style="fill:' + (fam.color || 'var(--surface)') + ';stroke:var(--ink)" stroke-width="2.5"/>';
    s += '<text x="' + cx + '" y="' + (y + 32) + '" text-anchor="middle" font-size="22" font-weight="800" style="fill:var(--ink)">' + e.z + '</text>';
    s += '<text x="' + cx + '" y="' + (y + 94) + '" text-anchor="middle" font-size="54" font-weight="900" style="fill:var(--ink)">' + e.simbolo + '</text>';
    s += '<text x="' + cx + '" y="' + (y + 121) + '" text-anchor="middle" font-size="' + (nombreCorto(e).length > 10 ? 13 : 16) + '" font-weight="800" style="fill:var(--ink)">' + esc(nombreCorto(e)) + '</text>';
    s += '<text x="' + cx + '" y="' + (y + 151) + '" text-anchor="middle" font-size="17" font-weight="700" style="fill:var(--ink-2)">' + e.masaTxt + '</text>';
    filas.forEach(f => {
      const ty = f.s ? f.y - 4 : f.y;
      s += '<circle cx="' + (x + w - 10) + '" cy="' + (f.y - 5) + '" r="3.5" style="fill:var(--ink)"/>';
      s += '<path d="M' + (x + w - 10) + ' ' + (f.y - 5) + 'H' + (x + w + 34) + '" style="stroke:var(--ink)" stroke-width="2" stroke-dasharray="3 3"/>';
      s += '<text x="' + (x + w + 40) + '" y="' + ty + '" font-size="14.5" font-weight="800" style="fill:var(--ink)">' + f.t + '</text>';
      if (f.s) s += '<text x="' + (x + w + 40) + '" y="' + (ty + 16) + '" font-size="12" font-weight="700" style="fill:var(--ink-2)">' + f.s + '</text>';
    });
    return s + '</svg>';
  }

  // ---------- Notación ᴬ_Z X ----------
  // notacion(A, Z, simbolo, carga) → HTML  (A o Z pueden ser null para omitirlos)
  function notacion(A, Z, simbolo, carga) {
    carga = carga | 0;
    const hayA = A != null && A !== '', hayZ = Z != null && Z !== '';
    const c = fmtCarga(carga);
    const aria = (simbolo || '') + (hayA ? ', número de masa ' + A : '') + (hayZ ? ', número atómico ' + Z : '') +
      (carga ? ', carga ' + Math.abs(carga) + (carga > 0 ? ' positiva' : ' negativa') : '');
    return '<span class="qm-not" role="img" aria-label="' + esc(aria) + '">' +
      '<span class="qm-not-iz" aria-hidden="true"><span class="qm-not-a">' + (hayA ? esc(A) : '&nbsp;') + '</span><span class="qm-not-z">' + (hayZ ? esc(Z) : '&nbsp;') + '</span></span>' +
      '<span class="qm-not-s" aria-hidden="true">' + esc(simbolo || '?') + '</span>' +
      '<span class="qm-not-de" aria-hidden="true">' + (c ? '<span class="qm-not-c ' + (carga > 0 ? 'pos' : 'neg') + '">' + c + '</span>' : '') + '<span class="qm-not-vacio">&nbsp;</span></span>' +
      '</span>';
  }

  // ---------- Tabla periódica ----------
  const AB = [null, 'IA', 'IIA', 'IIIB', 'IVB', 'VB', 'VIB', 'VIIB', 'VIIIB', 'VIIIB', 'VIIIB', 'IB', 'IIB', 'IIIA', 'IVA', 'VA', 'VIA', 'VIIA', 'VIIIA'];
  const NOTAS = {
    H: 'Está en el grupo 1, pero no es un metal alcalino: es un no metal y es gas.',
    He: 'Es más liviano que el aire: por eso los globos con helio suben.',
    C: 'Es la base de todas las moléculas de la vida.',
    N: 'Es casi el 78 % del aire que respiras.',
    O: 'Es el elemento más abundante de tu cuerpo (por masa).',
    F: 'Está en la pasta dental (fluoruro) y cuida tus dientes.',
    Ne: 'Brilla en los letreros luminosos de neón.',
    Na: 'Con el cloro forma la sal de mesa. Está en el suero oral.',
    Mg: 'Tus músculos y nervios lo necesitan.',
    P: 'Está en tus huesos, en tus dientes y en el ADN.',
    S: 'Está en algunas proteínas de tu cuerpo.',
    Cl: 'Desinfecta el agua de la piscina y del grifo.',
    K: 'Tus nervios y tu corazón lo necesitan. Hay mucho en el guineo.',
    Ca: 'Forma tus huesos y tus dientes.',
    Fe: 'Está en la hemoglobina: lleva el oxígeno en tu sangre.',
    Cu: 'Conduce muy bien la electricidad: se usa en los cables.',
    Zn: 'Ayuda a tus defensas y a cicatrizar heridas.',
    Br: 'Es el único no metal líquido a 25 °C.',
    I: 'Tu tiroides lo necesita: por eso la sal de mesa es yodada.',
    Ag: 'Su símbolo viene del latín «argentum».',
    Sn: 'Su símbolo viene del latín «stannum».',
    Au: 'Su símbolo viene del latín «aurum».',
    Hg: 'Es el único metal líquido a 25 °C.',
    Pb: 'Su símbolo viene del latín «plumbum». Es tóxico.',
    U: 'Se usa como combustible en las centrales nucleares.',
    Og: 'Es el último elemento de la tabla (el 118).'
  };
  function notaDe(e) {
    const n = [];
    if (NOTAS[e.simbolo]) n.push(NOTAS[e.simbolo]);
    if (e.categoria === 'metaloide') n.push('Los metaloides tienen propiedades intermedias entre metal y no metal.');
    if (e.grupo == null) n.push('Va en la fila de abajo para que la tabla no sea tan ancha.');
    if (/^\[/.test(e.masaTxt)) n.push('No tiene isótopos estables: entre corchetes va el número de masa de su isótopo más estable.');
    return n.join(' ');
  }
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  function datosHtml(e) {
    const fam = FAMILIAS[e.categoria];
    const fila = (t, v) => '<div><dt>' + t + '</dt><dd>' + v + '</dd></div>';
    const nota = notaDe(e);
    return '<div class="qm-panel-in">' + casilla(e, { grande: true }) +
      '<div class="qm-datos"><p class="qm-dn">' + esc(e.nombre) + ' <span>(' + e.simbolo + ')</span></p><dl>' +
      fila('Protones (Z)', e.z) +
      fila('Grupo', e.grupo ? e.grupo + ' <span class="tinta-2">(' + e.grupoAB + ')</span>' : '<span class="tinta-2">sin número (fila de abajo)</span>') +
      fila('Periodo', e.periodo) +
      fila('Familia', '<span class="qm-pill ' + catClase(e) + '">' + fam.nombre + '</span>') +
      fila('Tipo', cap(e.tipo)) +
      fila('A 25 °C', cap(e.estado) + (e.estadoPrevisto ? ' <span class="tinta-2">(previsto)</span>' : '')) +
      '</dl>' + (nota ? '<p class="qm-nota">' + esc(nota) + '</p>' : '') + '</div></div>';
  }

  // Paleta suave para modo juego (colorearPorFamilia)
  const FAM_TINTE = {
    'alcalino': '#FDE2E4',
    'alcalinoterreo': '#FFE8CC',
    'transicion': '#D1FAE5',
    'post-transicion': '#E5E7EB',
    'metaloide': '#FEF3C7',
    'no-metal': '#DBEAFE',
    'halogeno': '#FEF9C3',
    'gas-noble': '#EDE9FE',
    'lantanido': '#F3F4F6',
    'actinido': '#F3F4F6'
  };
  // tabla(el, {modo, colorear, resaltar, soloResaltados, onElegir, mostrarNumeracion, colorearPorFamilia})
  // Extra opcionales: leyenda (true), panel (true en 'explorar').
  function tabla(el, o) {
    const _o = o || {};
    // Por defecto, en modo 'elegir' (juego) activamos el tinte de familias para que la tabla no se vea toda blanca.
    const defColFam = (_o.modo === 'elegir');
    o = Object.assign({ modo: 'explorar', colorear: 'familia', resaltar: null, soloResaltados: false, onElegir: null, mostrarNumeracion: 'ambas', leyenda: true, colorearPorFamilia: defColFam }, _o);
    inyectarCSS();
    const explorar = o.modo !== 'elegir';
    const conPanel = o.panel != null ? !!o.panel : explorar;
    const num = o.mostrarNumeracion;
    // Reglas de cabecera:
    //  - 'ambas' → 1..18 + IA/VIIA/VIIIA (como antes)
    //  - 'ab' o 'romana' → solo IA/VIIA/VIIIA
    //  - cualquier otro (incluido 'iupac', 'moderna', undefined) → solo 1..18
    const conRomana = num === 'ambas' || num === 'ab' || num === 'romana';
    const conModerna = num !== 'ab' && num !== 'romana';
    // Tinte por familia:
    //  - Se pinta si colorearPorFamilia === true o si colorear === 'familia'.
    //  - Excepción "no sobreescribas": si el llamador pidió EXPLÍCITAMENTE colorear:'ninguno' y colorearPorFamilia:false, no se pinta.
    const pidioNinguno = _o.colorear === 'ninguno' && _o.colorearPorFamilia === false;
    const pintarFam = !pidioNinguno && (o.colorearPorFamilia === true || o.colorear === 'familia');
    const fr = (f) => f <= 7 ? f + 1 : f + 2; // fila de datos → fila del grid (fila 1 = encabezado, 9 = separación)
    let h = '<div class="qm-tabla-caja qm-col-' + esc(o.colorear) + (explorar ? '' : ' qm-modo-elegir') + (pintarFam ? ' qm-tinte-fam' : '') + '" data-noswipe>';
    h += '<p class="qm-tabla-pista" hidden>Desliza la tabla a los lados para verla completa.</p>';
    h += '<div class="qm-tabla-marco"><div class="qm-tabla-scroll" role="region" aria-label="Tabla periódica: 7 periodos (filas) y 18 grupos (columnas)" tabindex="-1"><div class="qm-tabla qm-num-' + esc(num) + '">';
    h += '<span class="qm-esq" style="grid-row:1;grid-column:1" aria-hidden="true"><span>G</span><span>P</span></span>';
    for (let g = 1; g <= 18; g++) {
      const t = conModerna && conRomana ? '<b>' + g + '</b><small>' + AB[g] + '</small>'
              : conRomana ? '<b>' + AB[g] + '</b>'
              : '<b>' + g + '</b>';
      h += '<span class="qm-th" style="grid-row:1;grid-column:' + (g + 1) + '" aria-label="Grupo ' + g + ' (' + AB[g] + ')">' + t + '</span>';
    }
    for (let p = 1; p <= 7; p++) h += '<span class="qm-tp" style="grid-row:' + (p + 1) + ';grid-column:1" aria-label="Periodo ' + p + '">' + p + '</span>';
    h += '<span class="qm-ph qm-f-lantanido" style="grid-row:7;grid-column:4" aria-label="Lantánidos, del 57 al 71, en la fila de abajo">57–71</span>';
    h += '<span class="qm-ph qm-f-actinido" style="grid-row:8;grid-column:4" aria-label="Actínidos, del 89 al 103, en la fila de abajo">89–103</span>';
    h += '<span class="qm-fl" style="grid-row:10;grid-column:1 / span 3">Lantánidos</span>';
    h += '<span class="qm-fl" style="grid-row:11;grid-column:1 / span 3">Actínidos</span>';
    ELEM().forEach(e => {
      const tinte = pintarFam ? (FAM_TINTE[e.categoria] || '') : '';
      const estilo = 'grid-row:' + fr(e.fila) + ';grid-column:' + (e.col + 1) + (tinte ? ';background-color:' + tinte : '');
      h += '<button type="button" class="qm-el ' + catClase(e) + ' ' + tipoClase(e) + '" data-z="' + e.z + '" style="' + estilo + '" aria-label="' + esc(e.nombre + ', ' + e.simbolo + ', número atómico ' + e.z) + '">' +
        '<span class="qm-ez" aria-hidden="true">' + e.z + '</span><span class="qm-es" aria-hidden="true">' + e.simbolo + '</span><span class="qm-en" aria-hidden="true">' + esc(nombreCorto(e)) + '</span></button>';
    });
    h += '</div></div></div>';
    if (o.leyenda !== false && o.colorear !== 'ninguno') {
      const L = o.colorear === 'tipo' ? TIPOS : FAMILIAS;
      h += '<div class="qm-leyenda" role="group" aria-label="Colores de la tabla">' + Object.keys(L).map(k => {
        const cls = o.colorear === 'tipo' ? 'qm-t-' + k.replace(' ', '') : 'qm-f-' + k;
        return explorar ? '<button type="button" class="qm-ley ' + cls + '" data-k="' + esc(k) + '" aria-pressed="false"><i></i>' + L[k].nombre + '</button>'
          : '<span class="qm-ley ' + cls + '"><i></i>' + L[k].nombre + '</span>';
      }).join('') + '</div>';
    }
    if (conPanel) h += '<div class="qm-panel" aria-live="polite"><p class="qm-panel-vacio">Toca un elemento para ver sus datos.</p></div>';
    h += '</div>';
    el.innerHTML = h;

    const caja = el.querySelector('.qm-tabla-caja');
    const scroll = caja.querySelector('.qm-tabla-scroll');
    const pista = caja.querySelector('.qm-tabla-pista');
    const panel = caja.querySelector('.qm-panel');
    const btns = {};
    caja.querySelectorAll('.qm-el').forEach(b => { btns[b.dataset.z] = b; });
    let vivo = true;

    function aplicar(sel) {
      let f = null;
      if (typeof sel === 'function') f = sel;
      else if (Array.isArray(sel)) { const s = new Set(sel.map(Number)); f = (e) => s.has(e.z); }
      caja.classList.toggle('qm-hay-res', !!f);
      ELEM().forEach(e => {
        const b = btns[e.z], on = !!f && !!f(e);
        b.classList.toggle('qm-res', on);
        const ocultar = !!f && o.soloResaltados && !on;
        b.classList.toggle('qm-oculto', ocultar);
        b.disabled = ocultar;
        if (ocultar) b.setAttribute('aria-hidden', 'true'); else b.removeAttribute('aria-hidden');
      });
      caja.querySelectorAll('.qm-ley[aria-pressed]').forEach(x => x.setAttribute('aria-pressed', 'false'));
    }
    function seleccionar(z) {
      caja.querySelectorAll('.qm-el.qm-sel').forEach(b => { b.classList.remove('qm-sel'); b.removeAttribute('aria-current'); });
      const b = btns[z]; if (!b) return;
      b.classList.add('qm-sel'); b.setAttribute('aria-current', 'true');
      if (panel) panel.innerHTML = datosHtml(porZ(z));
    }
    function marcar(z, tipo) {
      const b = btns[z]; if (!b) return;
      b.classList.remove('qm-ok', 'qm-miss');
      if (tipo === 'ok' || tipo === 'miss') b.classList.add('qm-' + tipo);
    }
    function limpiar() {
      aplicar(null);
      Object.keys(btns).forEach(z => { btns[z].classList.remove('qm-ok', 'qm-miss', 'qm-sel'); btns[z].removeAttribute('aria-current'); });
      if (panel) panel.innerHTML = '<p class="qm-panel-vacio">Toca un elemento para ver sus datos.</p>';
    }
    function enfocar(z) {
      const b = btns[z]; if (!b) return;
      const x = b.offsetLeft - (scroll.clientWidth - b.offsetWidth) / 2;
      scroll.scrollTo({ left: Math.max(0, x), behavior: menosMov() ? 'auto' : 'smooth' });
    }
    function onClick(ev) {
      const ley = ev.target.closest('.qm-ley[data-k]');
      if (ley) {
        const k = ley.dataset.k, on = ley.getAttribute('aria-pressed') === 'true';
        if (on) aplicar(null);
        else { aplicar(o.colorear === 'tipo' ? (e) => e.tipo === k : (e) => e.categoria === k); ley.setAttribute('aria-pressed', 'true'); }
        return;
      }
      const b = ev.target.closest('.qm-el');
      if (!b || b.disabled) return;
      const e = porZ(+b.dataset.z);
      if (explorar) seleccionar(e.z);
      if (typeof o.onElegir === 'function') o.onElegir(e);
    }
    function sombras() {
      const max = scroll.scrollWidth - scroll.clientWidth;
      const hay = max > 4;
      pista.hidden = !hay;
      caja.classList.toggle('qm-sombra-izq', hay && scroll.scrollLeft > 4);
      caja.classList.toggle('qm-sombra-der', hay && scroll.scrollLeft < max - 4);
    }
    caja.addEventListener('click', onClick);
    scroll.addEventListener('scroll', sombras, { passive: true });
    let ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(sombras); ro.observe(scroll); }
    else window.addEventListener('resize', sombras);
    sombras();
    if (o.resaltar) aplicar(o.resaltar);

    // Timers de brillo para poder limpiarlos al destruir
    const brilloTimers = {};
    function resaltarZ(z, ms) {
      const b = btns[z]; if (!b) return;
      b.classList.remove('qm-brilla');
      void b.offsetWidth;
      b.classList.add('qm-brilla');
      clearTimeout(brilloTimers[z]);
      brilloTimers[z] = setTimeout(() => { if (b) b.classList.remove('qm-brilla'); }, ms || 720);
    }

    return {
      resaltar: (sel) => { if (vivo) aplicar(sel); },
      limpiar: () => { if (vivo) limpiar(); },
      marcar: (z, tipo) => { if (vivo) marcar(z, tipo); },
      destruir: () => {
        if (!vivo) return; vivo = false;
        Object.keys(brilloTimers).forEach(z => clearTimeout(brilloTimers[z]));
        caja.removeEventListener('click', onClick);
        if (ro) ro.disconnect(); else window.removeEventListener('resize', sombras);
        el.innerHTML = '';
      },
      // extras opcionales
      seleccionar: (z) => { if (vivo) seleccionar(z); },
      enfocar: (z) => { if (vivo) enfocar(z); },
      resaltarZ: (z, ms) => { if (vivo) resaltarZ(z, ms); },
      el: caja
    };
  }

  // ---------- Constructor de átomos ----------
  const CAPAS = [2, 8, 8, 2]; // modelo de Bohr simplificado (hasta Z = 20)
  function repartir(e) {
    const r = []; let q = e;
    for (let i = 0; q > 0; i++) { const cap = i < CAPAS.length - 1 ? CAPAS[i] : Infinity; const k = Math.min(q, cap); r.push(k); q -= k; }
    return r;
  }
  const signoMas = (x, y, a, col) => '<path d="M' + (x - a) + ' ' + y + 'h' + (2 * a) + 'M' + x + ' ' + (y - a) + 'v' + (2 * a) + '" style="stroke:' + col + '" stroke-width="1.8" stroke-linecap="round"/>';
  const signoMenos = (x, y, a, col) => '<path d="M' + (x - a) + ' ' + y + 'h' + (2 * a) + '" style="stroke:' + col + '" stroke-width="2" stroke-linecap="round"/>';
  // Extra: dibujo del átomo como SVG suelto → LS.QM.atomoSvg(p, n, e, opt)
  // opt.nuevo: 'p' | 'n' | 'e' → marca la partícula recién agregada para animar su entrada.
  function atomoSvg(p, n, e, opt) {
    opt = opt || {};
    const nuevo = opt.nuevo || null;
    const C = 130, tot = p + n, rp = 6, k = 6.6;
    const R = tot ? k * Math.sqrt(tot - 1) + rp : 0;
    const capas = repartir(e);
    const ini = Math.max(32, R + 17), paso = capas.length > 1 ? Math.min(24, (122 - ini) / Math.max(3, capas.length - 1)) : 0;
    const radios = capas.map((_, i) => ini + i * paso);
    const aria = 'Átomo con ' + p + ' protones, ' + n + ' neutrones y ' + e + ' electrones';
    const ext = Math.max(64, (capas.length ? ini + (capas.length - 1) * paso : R) + 12), vb = (C - ext).toFixed(1) + ' ' + (C - ext).toFixed(1) + ' ' + (2 * ext).toFixed(1) + ' ' + (2 * ext).toFixed(1);
    // detectar la última partícula de cada tipo (para marcar la más reciente)
    let lastP = -1, lastN = -1;
    for (let i = 0; i < tot; i++) {
      const esP = Math.floor((i + 1) * p / tot) > Math.floor(i * p / tot);
      if (esP) lastP = i; else lastN = i;
    }
    let s = '<svg class="qm-atomo" viewBox="' + vb + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="' + aria + '" style="overflow:hidden"><title>' + aria + '</title>';
    // clip por si el navegador ignora overflow:hidden en el SVG
    s += '<defs><clipPath id="qmw-clip-' + (++uid) + '"><rect x="' + (C - ext).toFixed(1) + '" y="' + (C - ext).toFixed(1) + '" width="' + (2 * ext).toFixed(1) + '" height="' + (2 * ext).toFixed(1) + '"/></clipPath></defs>';
    s += '<g clip-path="url(#qmw-clip-' + uid + ')">';
    radios.forEach(r => { s += '<circle cx="' + C + '" cy="' + C + '" r="' + r.toFixed(1) + '" fill="none" style="stroke:var(--ink-3)" stroke-opacity=".45" stroke-width="2"/>'; });
    // núcleo: protones y neutrones intercalados en espiral (girasol)
    for (let i = 0; i < tot; i++) {
      const esP = Math.floor((i + 1) * p / tot) > Math.floor(i * p / tot);
      const rr = k * Math.sqrt(i), a = i * 2.39996;
      const x = C + rr * Math.cos(a), y = C + rr * Math.sin(a);
      const nuevaP = (nuevo === 'p' && i === lastP), nuevaN = (nuevo === 'n' && i === lastN);
      const cls = nuevaP ? ' class="qm-nuevo-p"' : (nuevaN ? ' class="qm-nuevo-n"' : '');
      s += '<g' + cls + '>';
      s += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + rp + '" style="fill:' + (esP ? 'var(--pos)' : 'var(--ink-3)') + ';stroke:var(--surface)" stroke-width="1.3"/>';
      if (esP) s += signoMas(x, y, 3, '#fff');
      s += '</g>';
    }
    if (!tot) s += '<circle cx="' + C + '" cy="' + C + '" r="9" fill="none" style="stroke:var(--ink-3)" stroke-width="2" stroke-dasharray="3 3"/>';
    // electrones (cada capa gira 6–10 s; el retraso negativo mantiene la continuidad al redibujar)
    const t = (window.performance ? performance.now() : Date.now()) / 1000;
    const ultimaCapa = capas.length - 1;
    capas.forEach((cnt, i) => {
      const r = radios[i], dur = 6 + i * 2, off = i * 0.6;
      s += '<g class="qm-orb qm-orb-anim' + (i % 2 ? ' qm-orb-inv' : '') + '" style="animation-duration:' + dur + 's;animation-delay:-' + (t % dur).toFixed(2) + 's">';
      for (let j = 0; j < cnt; j++) {
        const a = off + j * 2 * Math.PI / cnt - Math.PI / 2;
        const x = C + r * Math.cos(a), y = C + r * Math.sin(a);
        const nuevaE = (nuevo === 'e' && i === ultimaCapa && j === cnt - 1);
        s += '<g' + (nuevaE ? ' class="qm-nuevo-e"' : '') + '>';
        s += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="7" style="fill:var(--neg);stroke:var(--surface)" stroke-width="1.5"/>' + signoMenos(x, y, 3.2, '#fff');
        s += '</g>';
      }
      s += '</g>';
    });
    s += '</g>';
    return s + '</svg>';
  }

  const PART = {
    p: { nom: 'Protones', uno: 'protón', carga: '+1', cls: 'qm-k-p' },
    n: { nom: 'Neutrones', uno: 'neutrón', carga: '0', cls: 'qm-k-n' },
    e: { nom: 'Electrones', uno: 'electrón', carga: MENOS + '1', cls: 'qm-k-e' }
  };
  // constructor(el, {p, n, e, max:{p,n,e}, mostrar:{elemento, carga, A, notacion}, onCambio(estado), onValido(estado), objetivo:{p,n,e}})
  function constructor(el, o) {
    o = o || {};
    inyectarCSS();
    const max = Object.assign({ p: 20, n: 24, e: 20 }, o.max || {});
    const mostrar = Object.assign({ elemento: true, carga: true, A: true, notacion: true }, o.mostrar || {});
    const lim = (k, v) => Math.max(0, Math.min(max[k], Math.round(+v || 0)));
    const st = { p: lim('p', o.p), n: lim('n', o.n), e: lim('e', o.e) };
    let objetivo = o.objetivo || null;
    let quitarTimer = 0, haloTimer = 0;
    const bloq = new Set();
    let vivo = true;
    let h = '<div class="qm-con" data-noswipe><div class="qm-con-in"><div class="qm-con-dib"></div><div class="qm-con-lect" aria-live="polite"></div><div class="qm-con-ctrl">';
    ['p', 'n', 'e'].forEach(k => {
      const P = PART[k];
      h += '<div class="qm-con-fila ' + P.cls + '"><span class="qm-con-nom"><i aria-hidden="true"></i><span>' + P.nom + '<small>carga ' + P.carga + '</small></span></span>' +
        '<button type="button" class="qm-pm" data-k="' + k + '" data-d="-1" aria-label="Quitar un ' + P.uno + '">' + MENOS + '</button>' +
        '<output class="qm-con-val" data-k="' + k + '" aria-label="' + P.nom + '">0</output>' +
        '<button type="button" class="qm-pm" data-k="' + k + '" data-d="1" aria-label="Agregar un ' + P.uno + '">+</button></div>';
    });
    h += '</div></div></div>';
    el.innerHTML = h;
    const raiz = el.querySelector('.qm-con');
    const dib = raiz.querySelector('.qm-con-dib'), lect = raiz.querySelector('.qm-con-lect');

    function valores() {
      const Z = st.p, A = st.p + st.n, carga = st.p - st.e, elem = st.p ? porZ(st.p) : null;
      return { p: st.p, n: st.n, e: st.e, Z, A, carga, elemento: elem, simbolo: elem ? elem.simbolo : null, nombre: elem ? elem.nombre : null };
    }
    function pintar(nuevoTipo) {
      const v = valores();
      dib.innerHTML = atomoSvg(v.p, v.n, v.e, { nuevo: nuevoTipo || null });
      let l = '';
      if (mostrar.elemento) {
        if (!v.p) l += '<div class="qm-con-el qm-con-nada"><b>Sin protones no hay elemento.</b><span>Agrega protones: su número decide qué elemento es.</span></div>';
        else if (!v.elemento) l += '<div class="qm-con-el qm-con-nada"><b>Ese elemento no existe.</b></div>';
        else l += '<div class="qm-con-el"><span class="qm-con-sim ' + catClase(v.elemento) + '">' + v.elemento.simbolo + '</span><span><b>' + esc(v.elemento.nombre) + '</b><small>' + v.p + ' protones = elemento n.º ' + v.p + '</small></span></div>';
      }
      l += '<dl class="qm-con-datos"><div><dt>Z</dt><dd>' + v.Z + '</dd></div>';
      if (mostrar.A) l += '<div><dt>A</dt><dd>' + v.A + '</dd></div>';
      if (mostrar.carga) l += '<div><dt>Carga</dt><dd class="' + (v.carga > 0 ? 'qm-pos' : v.carga < 0 ? 'qm-neg' : '') + '">' + cargaTxt(v.carga) + '</dd></div>';
      l += '</dl>';
      if (mostrar.carga && v.p) {
        const tipo = v.carga === 0 ? ['qm-neutro', 'Átomo neutro', 'protones = electrones']
          : v.carga > 0 ? ['qm-cation', 'Catión', 'perdió ' + v.carga + ' electr' + (v.carga === 1 ? 'ón' : 'ones')]
            : ['qm-anion', 'Anión', 'ganó ' + (-v.carga) + ' electr' + (v.carga === -1 ? 'ón' : 'ones')];
        l += '<p class="qm-con-tipo ' + tipo[0] + '"><b>' + tipo[1] + '</b> <span>' + tipo[2] + '</span></p>';
      }
      if (mostrar.notacion && v.elemento) l += '<div class="qm-con-not">' + notacion(mostrar.A ? v.A : null, v.Z, v.elemento.simbolo, mostrar.carga ? v.carga : 0) + '</div>';
      lect.innerHTML = l;
      raiz.querySelectorAll('.qm-con-val').forEach(x => { x.textContent = st[x.dataset.k]; });
      raiz.querySelectorAll('.qm-pm').forEach(b => {
        const k = b.dataset.k, d = +b.dataset.d;
        b.disabled = bloq.has(k) || (d < 0 ? st[k] <= 0 : st[k] >= max[k]);
      });
      raiz.querySelectorAll('.qm-con-fila').forEach(f => f.classList.toggle('qm-bloq', bloq.has(f.querySelector('.qm-pm').dataset.k)));
    }
    function coincideObj() {
      if (!objetivo) return false;
      return ['p', 'n', 'e'].every(k => objetivo[k] == null || objetivo[k] === st[k]);
    }
    function brillarOk() {
      if (!vivo || !dib) return;
      dib.classList.remove('qm-halo-ok');
      // reflow para reiniciar la animación
      void dib.offsetWidth;
      dib.classList.add('qm-halo-ok');
      clearTimeout(haloTimer);
      haloTimer = setTimeout(() => { if (dib) dib.classList.remove('qm-halo-ok'); }, 1120);
    }
    function onClick(ev) {
      const b = ev.target.closest('.qm-pm');
      if (!b || b.disabled) return;
      const k = b.dataset.k, antes = st[k], nv = lim(k, antes + (+b.dataset.d));
      if (nv === antes) return;
      const subio = nv > antes;
      st[k] = nv;
      if (!subio) {
        // fade-out corto: parpadea el átomo justo antes/durante el redibujado
        dib.classList.add('qm-quitar');
        clearTimeout(quitarTimer);
        quitarTimer = setTimeout(() => { if (dib) dib.classList.remove('qm-quitar'); }, 240);
      }
      pintar(subio ? k : null);
      const v = valores();
      if (typeof o.onCambio === 'function') o.onCambio(v);
      if (coincideObj()) {
        brillarOk();
        if (typeof o.onValido === 'function') o.onValido(v);
      }
    }
    raiz.addEventListener('click', onClick);
    pintar();
    return {
      valores,
      fijar: (v) => { if (!vivo || !v) return; ['p', 'n', 'e'].forEach(k => { if (v[k] != null) st[k] = lim(k, v[k]); }); pintar(); },
      bloquear: (lista) => { if (!vivo) return; bloq.clear(); (lista || []).forEach(k => bloq.add(k)); pintar(); },
      objetivo: (v) => { if (!vivo) return; objetivo = v || null; },
      marcarOk: () => { if (vivo) brillarOk(); },
      destruir: () => { if (!vivo) return; vivo = false; clearTimeout(quitarTimer); clearTimeout(haloTimer); raiz.removeEventListener('click', onClick); el.innerHTML = ''; },
      el: raiz
    };
  }

  // ---------- Partículas: estados de la materia ----------
  const SUST = { agua: { nombre: 'agua', fusion: 0, ebullicion: 100, min: -20, max: 120 } };
  const EST = {
    solido: { nom: 'Sólido', txt: 'Las partículas están muy juntas y solo vibran en su sitio. Tiene forma y volumen propios.' },
    liquido: { nom: 'Líquido', txt: 'Las partículas están juntas, pero se deslizan unas sobre otras. Toma la forma del recipiente y su volumen no cambia.' },
    gas: { nom: 'Gaseoso', txt: 'Las partículas están muy separadas y se mueven rápido en todas direcciones. Llena todo el recipiente.' }
  };
  const CAMBIO = {
    fusion: '<b>¡Fusión!</b> A 0 °C el hielo se derrite: pasa de sólido a líquido.',
    ebullicion: '<b>¡Ebullición!</b> A 100 °C el agua hierve: pasa de líquido a gas. Es una vaporización.',
    condensacion: '<b>¡Condensación!</b> Bajo 100 °C el vapor vuelve a ser líquido.',
    solidificacion: '<b>¡Solidificación!</b> Bajo 0 °C el agua se congela: pasa de líquido a sólido.'
  };
  const normEstado = (s) => {
    s = String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    return s.indexOf('sol') === 0 ? 'solido' : s.indexOf('liq') === 0 ? 'liquido' : s.indexOf('ga') === 0 ? 'gas' : 'solido';
  };
  const gradosTxt = (t) => (t < 0 ? MENOS : '') + Math.abs(t) + ' °C';

  // particulas(el, {estado:'solido'|'liquido'|'gas', control:true, sustancia:'agua'}) → {fijar(estado), destruir()}
  function particulas(el, o) {
    o = Object.assign({ estado: 'solido', control: true, sustancia: 'agua' }, o || {});
    const S = SUST[o.sustancia] || SUST.agua;
    const TEMP = { solido: -10, liquido: 25, gas: 110 };
    const estadoDe = (t) => t < S.fusion ? 'solido' : t < S.ebullicion ? 'liquido' : 'gas';
    let estado = normEstado(o.estado), T = TEMP[estado];
    const pct = (t) => ((t - S.min) / (S.max - S.min) * 100).toFixed(2) + '%';
    let h = '<div class="qm-part" data-noswipe>' +
      '<div class="qm-part-top"><span class="qm-part-est"></span>' + (o.control ? '<span class="qm-part-t"></span>' : '') + '</div>' +
      '<div class="qm-part-lienzo"><canvas aria-hidden="true"></canvas><div class="qm-part-aviso" aria-live="polite"></div></div>' +
      '<p class="qm-part-txt"></p>';
    if (o.control) {
      const id = nuevoId('t');
      h += '<div class="qm-part-ctrl"><label for="' + id + '">Temperatura del ' + esc(S.nombre) + '</label>' +
        '<input id="' + id + '" type="range" min="' + S.min + '" max="' + S.max + '" step="1" value="' + T + '">' +
        '<div class="qm-part-escala" aria-hidden="true">' +
        [S.fusion, S.ebullicion].map(t => '<span style="left:' + pct(t) + '">' + gradosTxt(t) + '</span>').join('') + '</div></div>';
    }
    h += '</div>';
    el.innerHTML = h;
    const raiz = el.querySelector('.qm-part');
    const cv = raiz.querySelector('canvas'), ctx = cv.getContext('2d');
    const aviso = raiz.querySelector('.qm-part-aviso');
    const rango = raiz.querySelector('input[type=range]');
    const N = 56;
    let W = 300, H = 210, r = 7, caja = null, vivo = true, raf = 0, ultimo = 0, visible = true, tiempo = 0, cuadros = 0, timerAviso = 0;
    let col = { p: '#CE82FF', b: '#8E3FC9', ink: '#3C3C3C', sup: '#FFFFFF', line: '#DCE8D2' };
    const P = [];
    for (let i = 0; i < N; i++) P.push({ x: 0, y: 0, vx: 0, vy: 0, hx: 0, hy: 0, f1: 1.5 + Math.random() * 1.5, f2: 1.5 + Math.random() * 1.5, a1: Math.random() * 6.3, a2: Math.random() * 6.3 });

    function leerColores() {
      const cs = getComputedStyle(raiz), g = (v, d) => (cs.getPropertyValue(v) || '').trim() || d;
      col = { p: g('--accent', col.p), b: g('--accent-text', col.b), ink: g('--ink', col.ink), sup: g('--surface', col.sup), line: g('--line', col.line) };
    }
    function medir() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = Math.max(200, cv.clientWidth || 300); H = Math.max(160, cv.clientHeight || 210);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      r = Math.max(5, Math.min(8, W / 42));
      const ancho = Math.min(W - 24, 176);
      caja = { x0: (W - ancho) / 2 + 3, x1: (W + ancho) / 2 - 3, y0: 16, y1: H - 10 };
      casas();
      P.forEach(p => limitar(p));
    }
    function casas() {
      const cols = 8, d = 2 * r + 1.5, cx = (caja.x0 + caja.x1) / 2;
      // asigna las casas (red del sólido) según la posición actual: abajo primero, de izquierda a derecha
      const orden = P.slice().sort((a, b) => b.y - a.y);
      for (let f = 0; f * cols < N; f++) {
        orden.slice(f * cols, f * cols + cols).sort((a, b) => a.x - b.x).forEach((p, c) => {
          p.hx = cx - (cols - 1) * d / 2 + c * d; p.hy = caja.y1 - r - 1 - f * d;
        });
      }
    }
    function limitar(p) {
      if (p.x < caja.x0 + r) { p.x = caja.x0 + r; p.vx = Math.abs(p.vx); }
      if (p.x > caja.x1 - r) { p.x = caja.x1 - r; p.vx = -Math.abs(p.vx); }
      if (p.y < caja.y0 + r) { p.y = caja.y0 + r; p.vy = Math.abs(p.vy); }
      if (p.y > caja.y1 - r) { p.y = caja.y1 - r; p.vy = -Math.abs(p.vy) * (estado === 'gas' ? 1 : 0.3); }
    }
    function colocar() { // posición inicial según el estado
      P.forEach((p, i) => {
        if (estado === 'gas') { p.x = caja.x0 + r + Math.random() * (caja.x1 - caja.x0 - 2 * r); p.y = caja.y0 + r + Math.random() * (caja.y1 - caja.y0 - 2 * r); }
        else { p.x = caja.x0 + r + Math.random() * (caja.x1 - caja.x0 - 2 * r); p.y = caja.y1 - r - Math.random() * 60; }
        const a = Math.random() * 6.3; p.vx = Math.cos(a); p.vy = Math.sin(a);
      });
      casas();
      if (estado === 'solido') P.forEach(p => { p.x = p.hx; p.y = p.hy; });
    }
    function paso(dt) {
      tiempo += dt / 60;
      if (estado === 'solido') {
        const amp = 0.6 + 1.8 * Math.max(0, Math.min(1, (T - S.min) / (S.fusion - S.min)));
        P.forEach(p => {
          const tx = p.hx + amp * Math.sin(tiempo * p.f1 * 6 + p.a1), ty = p.hy + amp * Math.sin(tiempo * p.f2 * 6 + p.a2);
          p.x += (tx - p.x) * Math.min(1, 0.12 * dt); p.y += (ty - p.y) * Math.min(1, 0.12 * dt);
          p.vx = 0; p.vy = 0;
        });
        return;
      }
      const gas = estado === 'gas';
      const v0 = gas ? 2.2 + Math.max(0, T - S.ebullicion) / 20 : 0.4 + 0.9 * (T - S.fusion) / (S.ebullicion - S.fusion);
      P.forEach(p => {
        p.px = p.x; p.py = p.y;
        if (!gas) { p.vy += 0.22 * dt; p.vx += (Math.random() - 0.5) * v0 * 0.5 * dt; p.vy += (Math.random() - 0.5) * v0 * 0.3 * dt; p.vx *= 0.96; p.vy *= 0.97; }
        else {
          const v = Math.hypot(p.vx, p.vy) || 1, k = 1 + (v0 / v - 1) * 0.05;
          p.vx *= k; p.vy *= k;
        }
        p.x += p.vx * dt; p.y += p.vy * dt;
        limitar(p);
      });
      // choques suaves entre partículas
      const d2 = 4 * r * r, vueltas = gas ? 1 : 3;
      for (let it = 0; it < vueltas; it++) {
        for (let i = 0; i < N; i++) {
          const a = P[i];
          for (let j = i + 1; j < N; j++) {
            const b = P[j], dx = b.x - a.x, dy = b.y - a.y, q = dx * dx + dy * dy;
            if (q >= d2 || q === 0) continue;
            const d = Math.sqrt(q), s = (2 * r - d) / d * 0.5, ox = dx * s, oy = dy * s;
            a.x -= ox; a.y -= oy; b.x += ox; b.y += oy;
            if (gas) { const t1 = a.vx, t2 = a.vy; a.vx = b.vx; a.vy = b.vy; b.vx = t1; b.vy = t2; }
          }
        }
        P.forEach(limitar);
      }
      // líquido: la velocidad sale del movimiento real (sin empujones que se acumulan)
      if (!gas) P.forEach(p => { p.vx = (p.x - p.px) / dt * 0.98; p.vy = (p.y - p.py) / dt * 0.98; });
    }
    function dibujar() {
      ctx.clearRect(0, 0, W, H);
      const { x0, x1, y0, y1 } = caja, m = 5;
      // recipiente cerrado
      ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.strokeStyle = col.ink; ctx.fillStyle = col.sup;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x0 - m, y0 - m, x1 - x0 + 2 * m, y1 - y0 + 2 * m, 14); else ctx.rect(x0 - m, y0 - m, x1 - x0 + 2 * m, y1 - y0 + 2 * m);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = col.line; ctx.fillRect(x0 + 10, y0 - m - 7, x1 - x0 - 20, 6);
      ctx.fillStyle = col.p; ctx.strokeStyle = col.b; ctx.lineWidth = 1.5;
      P.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.2832); ctx.fill(); ctx.stroke(); });
    }
    function asentar() { // dibujo estático (menos movimiento)
      if (estado === 'solido') P.forEach(p => { p.x = p.hx; p.y = p.hy; });
      else if (estado === 'gas') colocar();
      else for (let i = 0; i < 260; i++) paso(1);
      dibujar();
    }
    function bucle(ts) {
      raf = 0;
      if (!vivo) return;
      if (!cv.isConnected) { destruir(); return; }
      if (menosMov()) { asentar(); return; }
      const dt = ultimo ? Math.min(2.5, (ts - ultimo) / 16.67) : 1;
      ultimo = ts;
      if (++cuadros % 45 === 0) leerColores();
      paso(dt); dibujar();
      if (visible) raf = requestAnimationFrame(bucle);
    }
    function arrancar() {
      if (!vivo || raf) return;
      if (menosMov()) { asentar(); return; }
      ultimo = 0; raf = requestAnimationFrame(bucle);
    }
    function textos() {
      raiz.querySelector('.qm-part-est').innerHTML = '<i class="qm-e-' + estado + '"></i>' + EST[estado].nom;
      raiz.querySelector('.qm-part-txt').textContent = EST[estado].txt;
      const tt = raiz.querySelector('.qm-part-t');
      if (tt) tt.textContent = gradosTxt(T);
      if (rango) { rango.value = T; rango.setAttribute('aria-valuetext', gradosTxt(T).replace(MENOS, 'menos ') + ', ' + EST[estado].nom.toLowerCase()); }
      raiz.dataset.estado = estado;
    }
    function avisar(html) {
      aviso.innerHTML = html ? '<span>' + html + '</span>' : '';
      aviso.classList.toggle('on', !!html);
      clearTimeout(timerAviso);
      if (html) timerAviso = setTimeout(() => { aviso.classList.remove('on'); }, 4200);
    }
    function cambiarA(nuevo, conAviso) {
      const antes = estado;
      if (nuevo === antes) return;
      estado = nuevo;
      if (conAviso) {
        const orden = ['solido', 'liquido', 'gas'], sube = orden.indexOf(nuevo) > orden.indexOf(antes);
        let msg;
        if (sube) msg = antes === 'solido' && nuevo === 'gas' ? CAMBIO.fusion + ' Luego: ' + CAMBIO.ebullicion : nuevo === 'liquido' ? CAMBIO.fusion : CAMBIO.ebullicion;
        else msg = antes === 'gas' && nuevo === 'solido' ? CAMBIO.condensacion + ' Luego: ' + CAMBIO.solidificacion : nuevo === 'liquido' ? CAMBIO.condensacion : CAMBIO.solidificacion;
        avisar(msg);
      } else avisar('');
      if (estado === 'solido') casas();
      if (estado === 'gas') P.forEach(p => { p.vy -= 1.5 + Math.random() * 2; p.vx += (Math.random() - 0.5) * 3; });
      if (menosMov()) asentar();
    }
    function onRango() {
      T = Math.round(+rango.value);
      cambiarA(estadoDe(T), true);
      textos();
      if (menosMov()) asentar(); else arrancar();
    }
    if (rango) rango.addEventListener('input', onRango);
    let ro = null, io = null;
    const onResize = () => { if (!vivo) return; medir(); if (menosMov() || !raf) asentar(); };
    if (window.ResizeObserver) { ro = new ResizeObserver(onResize); ro.observe(cv); } else window.addEventListener('resize', onResize);
    if (window.IntersectionObserver) {
      io = new IntersectionObserver(ents => { visible = ents.some(x => x.isIntersecting); if (visible) arrancar(); });
      io.observe(cv);
    }
    leerColores(); medir(); colocar(); textos(); asentar(); arrancar();

    function destruir() {
      if (!vivo) return; vivo = false;
      if (raf) cancelAnimationFrame(raf); raf = 0;
      clearTimeout(timerAviso);
      if (rango) rango.removeEventListener('input', onRango);
      if (ro) ro.disconnect(); else window.removeEventListener('resize', onResize);
      if (io) io.disconnect();
      if (el.contains(raiz)) el.innerHTML = '';
    }
    return {
      fijar: (e) => { if (!vivo) return; const n = normEstado(e); T = TEMP[n]; cambiarA(n, false); textos(); if (menosMov()) asentar(); else arrancar(); },
      destruir,
      // extras opcionales
      temperatura: (t) => { if (!vivo || !rango) return T; if (t != null) { rango.value = t; onRango(); } return T; },
      estado: () => estado,
      el: raiz
    };
  }

  // ---------- Cambios de estado (SVG) ----------
  const CAMBIOS_ID = { 'sublimacion-progresiva': 'sublimacion', 'deposicion': 'sublimacion-regresiva', 'sublimacion-inversa': 'sublimacion-regresiva', 'licuacion': 'condensacion', 'licuefaccion': 'condensacion', 'ebullicion': 'vaporizacion', 'evaporacion': 'vaporizacion' };
  function iconoEstado(tipo, cx, cy) {
    const pts = tipo === 'solido' ? [[-9, -9], [0, -9], [9, -9], [-9, 0], [0, 0], [9, 0], [-9, 9], [0, 9], [9, 9]]
      : tipo === 'liquido' ? [[-10, 9], [-1, 10], [8, 9], [-6, 1], [4, 2], [12, 3], [-13, 2]]
        : [[-14, -8], [6, -11], [15, 4], [-5, 3], [-15, 11], [9, 12]];
    let s = '';
    if (tipo !== 'solido') s += '<path d="M' + (cx - 20) + ' ' + (cy - 14) + 'v24a4 4 0 0 0 4 4h32a4 4 0 0 0 4-4v-24" fill="none" style="stroke:var(--ink-3)" stroke-width="2"/>';
    pts.forEach(p => { s += '<circle cx="' + (cx + p[0]) + '" cy="' + (cy + p[1]) + '" r="4" style="fill:var(--accent);stroke:var(--accent-text)" stroke-width="1.2"/>'; });
    return s;
  }
  function cambiosEstado(activo) {
    activo = CAMBIOS_ID[activo] || activo || null;
    const W = 360, H = 352;
    const nodos = { gas: [180, 44, 'Gaseoso'], solido: [62, 272, 'Sólido'], liquido: [298, 272, 'Líquido'] };
    const id = nuevoId('ce');
    let s = '<svg class="qm-cambios' + (activo ? ' qm-hay-act' : '') + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-labelledby="' + id + '"><title id="' + id + '">Cambios de estado: fusión y solidificación entre sólido y líquido; vaporización y condensación entre líquido y gas; sublimación progresiva y regresiva entre sólido y gas' + (activo ? '. Resaltado: ' + activo.replace('-', ' ') : '') + '</title>';
    function flecha(k, a, b, off, calor, lab) {
      const [x1, y1] = a, [x2, y2] = b;
      const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L, nx = -uy, ny = ux;
      const sx = x1 + nx * off + ux * 4, sy = y1 + ny * off + uy * 4, ex = x2 + nx * off - ux * 6, ey = y2 + ny * off - uy * 6;
      const on = activo === k;
      const colr = on ? 'var(--primary)' : 'var(--ink-2)';
      let g = '<g class="qm-ce-f' + (on ? ' on' : '') + '" data-k="' + k + '">';
      g += '<path d="M' + sx.toFixed(1) + ' ' + sy.toFixed(1) + 'L' + ex.toFixed(1) + ' ' + ey.toFixed(1) + '" style="stroke:' + colr + '" stroke-width="' + (on ? 4 : 2.5) + '" stroke-linecap="round"' + (calor ? '' : ' stroke-dasharray="6 5"') + '/>';
      const hx = ex - ux * 11, hy = ey - uy * 11;
      g += '<path d="M' + (hx + nx * 7).toFixed(1) + ' ' + (hy + ny * 7).toFixed(1) + 'L' + (ex + ux * 2).toFixed(1) + ' ' + (ey + uy * 2).toFixed(1) + 'L' + (hx - nx * 7).toFixed(1) + ' ' + (hy - ny * 7).toFixed(1) + '" fill="none" style="stroke:' + colr + '" stroke-width="' + (on ? 4 : 2.5) + '" stroke-linecap="round" stroke-linejoin="round"/>';
      lab.forEach(t => {
        g += '<text x="' + t[0] + '" y="' + t[1] + '" text-anchor="' + t[3] + '" font-size="14" font-weight="800" style="fill:' + (on ? 'var(--primary-shade)' : 'var(--ink)') + '">' + t[2] + '</text>';
      });
      return g + '</g>';
    }
    // sólido ↔ líquido
    s += flecha('fusion', [120, 258], [240, 258], 0, true, [[180, 248, 'Fusión', 'middle']]);
    s += flecha('solidificacion', [240, 286], [120, 286], 0, false, [[180, 310, 'Solidificación', 'middle']]);
    // sólido ↔ gas (lado izquierdo): afuera la progresiva, adentro la regresiva
    s += flecha('sublimacion', [84, 238], [146, 78], -10, true, [[94, 146, 'Sublimación', 'end'], [94, 163, 'progresiva', 'end']]);
    s += flecha('sublimacion-regresiva', [146, 78], [84, 238], -10, false, [[116, 204, 'Sublimación', 'start'], [116, 221, 'regresiva', 'start']]);
    // líquido ↔ gas (lado derecho): afuera la vaporización, adentro la condensación
    s += flecha('vaporizacion', [276, 238], [214, 78], 10, true, [[268, 154, 'Vaporización', 'start']]);
    s += flecha('condensacion', [214, 78], [276, 238], 10, false, [[229, 170, 'Condensación', 'end']]);
    Object.keys(nodos).forEach(k => {
      const [cx, cy, t] = nodos[k];
      s += '<rect x="' + (cx - 54) + '" y="' + (cy - 30) + '" width="108" height="60" rx="14" style="fill:var(--surface);stroke:var(--ink)" stroke-width="2.5"/>';
      s += iconoEstado(k, cx, cy - 8);
      s += '<text x="' + cx + '" y="' + (cy + 23) + '" text-anchor="middle" font-size="15" font-weight="900" style="fill:var(--ink)">' + t + '</text>';
    });
    // leyenda
    s += '<path d="M40 338h30" style="stroke:var(--ink-2)" stroke-width="2.5" stroke-linecap="round"/><text x="76" y="343" font-size="13" font-weight="700" style="fill:var(--ink-2)">gana calor</text>';
    s += '<path d="M190 338h30" style="stroke:var(--ink-2)" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="6 5"/><text x="226" y="343" font-size="13" font-weight="700" style="fill:var(--ink-2)">pierde calor</text>';
    return s + '</svg>';
  }

  // ---------- Árbol de clasificación de la materia (HTML) ----------
  const ARBOL_ID = { 'sustancias-puras': 'puras', 'sustancias': 'puras', 'pura': 'puras', 'elemento': 'elementos', 'compuesto': 'compuestos', 'mezcla': 'mezclas', 'homogenea': 'homogeneas', 'heterogenea': 'heterogeneas' };
  function arbolMateria(activo) {
    activo = ARBOL_ID[activo] || activo || null;
    const padre = { puras: 'materia', mezclas: 'materia', elementos: 'puras', compuestos: 'puras', homogeneas: 'mezclas', heterogeneas: 'mezclas' };
    const camino = new Set(); for (let k = padre[activo]; k; k = padre[k]) camino.add(k);
    const cls = (k) => 'qm-ar-n' + (activo === k || (activo && padre[k] === activo) ? ' on' : camino.has(k) ? ' camino' : '');
    const nodo = (k, t, sub, ej) => '<div class="' + cls(k) + '" data-k="' + k + '"><b>' + t + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + (ej ? '<em>' + ej + '</em>' : '') + '</div>';
    const rama = (k, t, sub, hijos) => '<li class="qm-ar-rama">' + nodo(k, t, sub) + '<ul class="qm-ar-hojas">' + hijos.map(hh => '<li>' + nodo.apply(null, hh) + '</li>').join('') + '</ul></li>';
    return '<div class="qm-arbol' + (activo ? ' qm-hay-act' : '') + '" role="group" aria-label="Clasificación de la materia: sustancias puras (elementos y compuestos) y mezclas (homogéneas y heterogéneas)">' +
      nodo('materia', 'Materia', 'tiene masa y ocupa espacio') +
      '<ul class="qm-ar-ramas">' +
      rama('puras', 'Sustancias puras', 'composición fija', [
        ['elementos', 'Elementos', 'un solo tipo de átomo', 'oro, hierro, oxígeno'],
        ['compuestos', 'Compuestos', '2 o más elementos unidos químicamente', 'agua, sal, azúcar']]) +
      rama('mezclas', 'Mezclas', 'sustancias juntas, sin unirse', [
        ['homogeneas', 'Homogéneas', 'se ve una sola fase', 'suero, aire, agua con sal'],
        ['heterogeneas', 'Heterogéneas', 'se ven las partes', 'agua con arena, ensalada']]) +
      '</ul></div>';
  }

  // ---------- Modelos atómicos (línea de tiempo) ----------
  const MODELOS = [
    { k: 'dalton', nom: 'Dalton', anio: '1808', idea: 'Esfera maciza que no se puede dividir.' },
    { k: 'thomson', nom: 'Thomson', anio: '1904', idea: 'Esfera positiva con electrones incrustados, como un budín de pasas.' },
    { k: 'rutherford', nom: 'Rutherford', anio: '1911', idea: 'Núcleo pequeño y positivo. Casi todo el átomo es vacío.' },
    { k: 'bohr', nom: 'Bohr', anio: '1913', idea: 'Los electrones giran en niveles de energía fijos.' },
    { k: 'actual', nom: 'Modelo actual', anio: 'desde 1926', idea: 'Orbitales: zonas donde es probable hallar al electrón.' }
  ];
  function dibujoModelo(k) {
    const C = 40, id = nuevoId('m');
    let s = '<svg viewBox="0 0 80 80" aria-hidden="true" focusable="false">';
    const e = (x, y) => '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="4.2" style="fill:var(--neg);stroke:var(--surface)" stroke-width="1"/>';
    const nucleo = (r) => '<circle cx="' + C + '" cy="' + C + '" r="' + r + '" style="fill:var(--pos)"/>';
    if (k === 'dalton') {
      s += '<circle cx="' + C + '" cy="' + C + '" r="30" style="fill:var(--ink-3);stroke:var(--ink)" stroke-width="2.5"/>';
      s += '<ellipse cx="31" cy="30" rx="9" ry="6" fill="#fff" opacity=".35"/>';
    } else if (k === 'thomson') {
      s += '<circle cx="' + C + '" cy="' + C + '" r="31" style="fill:var(--pos-soft);stroke:var(--pos)" stroke-width="2.5"/>';
      [[28, 26], [50, 24], [40, 40], [24, 48], [54, 50], [38, 58]].forEach(p => { s += e(p[0], p[1]); });
      [[38, 24], [22, 36], [58, 36], [48, 62]].forEach(p => { s += signoMas(p[0], p[1], 3, 'var(--pos-text)'); });
    } else if (k === 'rutherford') {
      s += '<ellipse cx="40" cy="40" rx="34" ry="13" fill="none" style="stroke:var(--ink-3)" stroke-opacity=".5" stroke-width="2" transform="rotate(30 40 40)"/>';
      s += '<ellipse cx="40" cy="40" rx="34" ry="13" fill="none" style="stroke:var(--ink-3)" stroke-opacity=".5" stroke-width="2" transform="rotate(-30 40 40)"/>';
      s += nucleo(4.5) + e(69, 57) + e(11, 57);
    } else if (k === 'bohr') {
      [14, 24, 34].forEach(r => { s += '<circle cx="40" cy="40" r="' + r + '" fill="none" style="stroke:var(--ink-3)" stroke-opacity=".5" stroke-width="2"/>'; });
      s += nucleo(6.5) + e(40, 26) + e(40, 54) + e(64, 40) + e(16, 40) + e(57, 57) + e(23, 23) + e(40, 6);
    } else {
      s += '<defs><radialGradient id="' + id + '"><stop offset="0" style="stop-color:var(--neg)" stop-opacity=".75"/><stop offset=".55" style="stop-color:var(--neg)" stop-opacity=".3"/><stop offset="1" style="stop-color:var(--neg)" stop-opacity="0"/></radialGradient></defs>';
      s += '<circle cx="40" cy="40" r="36" fill="url(#' + id + ')"/>';
      s += '<ellipse cx="40" cy="40" rx="36" ry="12" fill="url(#' + id + ')" opacity=".7"/><ellipse cx="40" cy="40" rx="12" ry="36" fill="url(#' + id + ')" opacity=".7"/>';
      s += nucleo(5);
    }
    return s + '</svg>';
  }
  function modelos(activo) {
    activo = activo ? String(activo).toLowerCase() : null;
    return '<div class="qm-modelos-caja"><ol class="qm-modelos' + (activo ? ' qm-hay-act' : '') + '" aria-label="Modelos atómicos en el tiempo">' + MODELOS.map(m =>
      '<li class="qm-mod' + (activo === m.k ? ' on' : '') + '" data-k="' + m.k + '"' + (activo === m.k ? ' aria-current="true"' : '') + '>' +
      '<span class="qm-mod-dib">' + dibujoModelo(m.k) + '</span>' +
      '<span class="qm-mod-txt"><b>' + m.nom + '</b> <span class="qm-mod-anio">' + m.anio + '</span><small>' + m.idea + '</small></span></li>').join('') + '</ol></div>';
  }

  Object.assign(QM, {
    porZ, porSimbolo, FAMILIAS, casilla, notacion, tabla, constructor, particulas, cambiosEstado, arbolMateria, modelos,
    // extras opcionales
    TIPOS, MODELOS, atomoSvg, capas: repartir
  });
})();
