/* Router de secciones, registro, mapa general, ajustes, glosario y aviso de navegador interno. */
(function () {
  'use strict';
  const LS = window.LS = window.LS || {};
  const ui = () => LS.ui;
  let actual = null, editando = false;
  const root = () => document.getElementById('app');

  // ---------- Router ----------
  function ir(pantalla, opts, desdeHistorial) {
    opts = opts || {};
    const u = LS.st.usuario;
    if (!u.nombre || !u.correo) pantalla = 'registro';
    if (pantalla === 'juego' && !LS.st.laminas.completadas && !opts.forzar) pantalla = 'hub';
    if (pantalla === 'test' && !(LS.st.juego && LS.st.juego.testDesbloqueado) && !opts.forzar) pantalla = 'hub';
    ui().cerrarHoja(true); ui().callar();
    actual = pantalla;
    const r = root();
    r.innerHTML = '';
    if (pantalla === 'registro') pintarRegistro(r);
    else if (pantalla === 'hub') pintarHub(r);
    else if (pantalla === 'laminas') LS.laminas.abrir(r, opts);
    else if (pantalla === 'juego') LS.juego ? LS.juego.abrir(r, opts) : falta(r, 'el juego');
    else if (pantalla === 'test') LS.test ? LS.test.abrir(r, opts) : falta(r, 'el test');
    else if (pantalla === 'herramienta' && LS.HERRAMIENTAS && LS.HERRAMIENTAS[opts.tipo]) LS.HERRAMIENTAS[opts.tipo](r);
    if (pantalla !== 'laminas' && pantalla !== 'juego' && pantalla !== 'test') LS.setColor('full');
    if (!desdeHistorial) {
      try { history.pushState({ s: pantalla }, '', location.pathname + location.search); } catch (e) { }
    }
    window.scrollTo(0, 0);
  }
  function falta(r, que) { r.innerHTML = '<div class="pantalla"><p>No se pudo cargar ' + que + '. Recarga la página.</p></div>'; }

  // Botón Atrás del celular: primero retrocede dentro de la sección (lámina, pregunta, pantalla del juego)
  window.addEventListener('popstate', (e) => {
    if (ui().hayHoja()) { ui().cerrarHoja(); guardia(); return; }
    const mod = actual === 'laminas' ? LS.laminas : actual === 'juego' ? LS.juego : actual === 'test' ? LS.test : null;
    if (mod && mod.atras && mod.atras()) { guardia(); return; }
    const destino = (e.state && e.state.s && e.state.s !== actual) ? e.state.s : (actual === 'hub' || actual === 'registro' ? null : 'hub');
    if (destino) { ir(destino, {}, true); guardia(); }
  });
  function guardia() { try { history.pushState({ s: actual }, '', location.pathname + location.search); } catch (e) { } }

  // ---------- Registro ----------
  const DOMINIOS = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'live.com', 'yahoo.es', 'hotmail.es', 'outlook.es'];
  function distancia(a, b) {
    const m = a.length, n = b.length, d = Array.from({ length: m + 1 }, (_, i) => [i].concat(Array(n).fill(0)));
    for (let j = 1; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n];
  }
  function sugerirCorreo(c) {
    const at = c.lastIndexOf('@'); if (at < 1) return null;
    const dom = c.slice(at + 1).toLowerCase(); if (!dom || DOMINIOS.indexOf(dom) >= 0) return null;
    let mejor = null, dist = 3;
    DOMINIOS.forEach(d => { const x = distancia(dom, d); if (x < dist) { dist = x; mejor = d; } });
    return mejor ? c.slice(0, at + 1) + mejor : null;
  }
  const correoValido = (c) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c);

  function pintarRegistro(r) {
    const u = LS.st.usuario;
    r.innerHTML =
      '<div class="pantalla"><div class="reg"><div class="reg-izq">' +
      '<div class="marca"><div class="marca-logo">±</div><div class="marca-txt"><b>Ley de signos</b><span>y operaciones combinadas</span></div></div>' +
      '<div style="margin:22px 0 18px">' +
      '<h1>Aprende a tu ritmo, paso a paso</h1>' +
      '<p class="tinta-2" style="margin-top:8px">Esto sale siempre en el examen de admisión. Al final vas a poder resolverlo tú solo.</p>' +
      '</div>' +
      '<ol class="estaciones" style="list-style:none;margin-bottom:18px">' +
      est('1', 'Láminas', 'Te lo explicamos todo · unos 25 min') +
      est('2', 'Juego', 'Practicas las reglas · unos 30 min') +
      est('3', 'Test de 25', 'Demuestras lo que sabes · unos 25 min') +
      '</ol>' +
      '<p class="peq tinta-2" style="margin-bottom:14px">Se guarda solo: puedes dejarlo y seguir mañana.</p>' +
      '</div><div class="reg-der">' +
      '<form class="col" id="f-reg" novalidate>' +
      '<div class="campo"><label for="r-nombre">Tus nombres y apellidos</label><input id="r-nombre" autocomplete="name" required minlength="3" value="' + ui().esc(u.nombre) + '" placeholder="María Fernanda López"></div>' +
      '<div class="campo"><label for="r-correo">Tu correo</label><input id="r-correo" type="email" autocomplete="email" inputmode="email" required value="' + ui().esc(u.correo) + '" placeholder="maria.lopez@gmail.com">' +
      '<p class="sugerencia" hidden></p><p class="error" hidden></p><p class="peq tinta-3">Aquí te llegarán tus resultados y un PDF.</p></div>' +
      '<button class="btn btn-pri btn-ancho" type="submit">Empezar ' + ui().icon('sig') + '</button>' +
      '</form></div></div></div>';
    const f = r.querySelector('#f-reg'), inN = r.querySelector('#r-nombre'), inC = r.querySelector('#r-correo');
    const sug = r.querySelector('.sugerencia'), err = r.querySelector('.error');
    function revisar() {
      const s = sugerirCorreo(inC.value.trim());
      if (s) { sug.hidden = false; sug.innerHTML = '¿Quisiste decir <b>' + ui().esc(s) + '</b>? <button type="button" class="btn-txt" style="min-height:36px">Sí, corregir</button>'; sug.querySelector('button').onclick = () => { inC.value = s; sug.hidden = true; }; }
      else sug.hidden = true;
      err.hidden = true;
    }
    inC.addEventListener('blur', revisar);
    inC.addEventListener('input', () => { err.hidden = true; });
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const nombre = inN.value.trim().replace(/\s+/g, ' '), correo = 'sin-correo@local.invalid';
      if (nombre.length < 3) { err.hidden = false; err.textContent = 'Escribe tu nombre para continuar.'; inN.focus(); return; }
      if (!correoValido(correo)) { err.hidden = false; err.textContent = 'Revisa tu correo: debe verse como nombre@gmail.com'; inC.focus(); return; }
      LS.st.usuario = { nombre, correo };
      LS.guardar();
      if (editando) { editando = false; ir('hub'); return; }
      if (LS.envio) LS.envio.evento('registro', {});
      ir('laminas');
    });
  }
  function est(n, t, s) {
    return '<li class="estacion hecha" style="padding:10px 12px"><span class="est-ico">' + n + '</span><span class="est-txt"><b>' + t + '</b><span>' + s + '</span></span></li>';
  }

  // ---------- Mapa general (regreso) ----------
  function pintarHub(r) {
    const st = LS.st, lam = st.laminas, jg = st.juego || {}, ts = st.test || {};
    const totalL = LS.laminas.total();
    const lamHecha = !!lam.completadas;
    const juegoHecho = !!jg.testDesbloqueado;
    const testHecho = !!ts.oficialTerminado;
    let dondeIba = '';
    const l = (LS.LAMINAS || [])[lam.actual];
    if (!lamHecha && l) dondeIba = l.cap >= 1 && l.cap <= 4 ? 'Ibas en el capítulo ' + l.cap + ' de las láminas.' : 'Ibas en las láminas.';
    else if (!juegoHecho) dondeIba = 'Ibas en el juego.';
    else if (!testHecho) dondeIba = 'Ya puedes hacer el test.';
    else dondeIba = 'Terminaste todo. Puedes repasar cuando quieras.';
    const destino = !lamHecha ? 'laminas' : !juegoHecho ? 'juego' : !testHecho ? 'test' : 'test';
    const pctL = totalL ? Math.round((lamHecha ? totalL : lam.maxAlcanzada) / totalL * 100) : 0;
    r.innerHTML =
      '<div class="pantalla hub">' +
      '<a class="campus-volver" href="../../temas/">← Clases por tema</a>' +
      '<div class="fila"><div class="marca esp"><div class="marca-logo">±</div><div class="marca-txt"><b>Ley de signos</b><span>' + ui().esc(st.usuario.nombre) + '</span></div></div>' +
      '<button class="btn-ico" data-a="glosario" aria-label="Glosario">' + ui().icon('ayuda') + '</button>' +
      '<button class="btn-ico" data-a="ajustes" aria-label="Ajustes">' + ui().icon('ajustes') + '</button></div>' +
      '<h1 style="margin:20px 0 6px">Hola, ' + ui().esc(LS.nombre()) + '</h1>' +
      '<p class="tinta-2" style="margin-bottom:16px">' + dondeIba + '</p>' +
      '<div class="estaciones">' +
      estacion('laminas', lamHecha ? 'hecha' : 'curso', 'Láminas', lamHecha ? 'Listas ✓ · puedes repasarlas' : 'Avance ' + pctL + '% · unos 25 min', lamHecha ? ui().icon('check') : '1') +
      estacion('juego', juegoHecho ? 'hecha' : lamHecha ? 'curso' : 'bloq', 'Juego: Signo a Signo', juegoHecho ? 'Camino terminado ✓' : lamHecha ? 'Practica las reglas · unos 30 min' : 'Se abre al terminar las láminas', juegoHecho ? ui().icon('check') : lamHecha ? '2' : ui().icon('candado')) +
      estacion('test', testHecho ? 'hecha' : juegoHecho ? 'curso' : 'bloq', 'Test de 25', testHecho ? 'Enviado ✓ · ver resultados' : juegoHecho ? '25 preguntas, sin tiempo' : 'Se abre al terminar el juego', testHecho ? ui().icon('check') : juegoHecho ? '3' : ui().icon('candado')) +
      '</div>' +
      '<div class="esp"></div>' +
      '<button class="btn btn-pri btn-ancho" data-ir="' + destino + '" style="margin-top:20px">' + (testHecho ? 'Ver mis resultados' : 'Continuar donde iba') + ' ' + ui().icon('sig') + '</button>' +
      '</div>';
    r.querySelectorAll('[data-ir]').forEach(b => b.addEventListener('click', () => {
      const d = b.getAttribute('data-ir');
      if (b.classList.contains('bloq')) return;
      if (d === 'laminas' && lamHecha) ir('laminas', { irA: 0 });
      else ir(d);
    }));
    r.querySelector('[data-a="glosario"]').onclick = glosario;
    r.querySelector('[data-a="ajustes"]').onclick = ajustes;
  }
  function estacion(dest, estado, t, s, ico) {
    return '<button class="estacion ' + estado + (estado === 'bloq' ? ' bloq' : '') + '" data-ir="' + dest + '"' + (estado === 'bloq' ? ' aria-disabled="true"' : '') + '>' +
      '<span class="est-ico">' + ico + '</span><span class="est-txt"><b>' + t + '</b><span>' + s + '</span></span>' + (estado === 'bloq' ? '' : ui().icon('sig', 'est-flecha')) + '</button>';
  }

  // ---------- Ajustes ----------
  function ajustes() {
    const a = LS.st.ajustes;
    const tema = a.tema || 'auto';
    const h = ui().hoja({
      tipo: 'info', icono: 'ajustes', titulo: 'Ajustes',
      html:
        '<div class="ajuste"><span>Tema</span><span class="seg-ctrl" role="group" aria-label="Tema">' +
        ['auto', 'light', 'dark'].map(t => '<button data-tema="' + t + '" aria-pressed="' + (tema === t) + '">' + ({ auto: 'Auto', light: 'Claro', dark: 'Oscuro' })[t] + '</button>').join('') + '</span></div>' +
        '<div class="ajuste"><span>Sonido</span><button class="switch" role="switch" data-sw="sonido" aria-checked="' + !!a.sonido + '" aria-label="Sonido"></button></div>' +
        '<div class="ajuste"><span>Menos animaciones</span><button class="switch" role="switch" data-sw="menosAnimaciones" aria-checked="' + !!a.menosAnimaciones + '" aria-label="Menos animaciones"></button></div>' +
        '<div class="ajuste"><span class="peq tinta-2">Estudiante: ' + ui().esc(LS.st.usuario.nombre) + '<br>' + ui().esc(LS.st.usuario.correo) + '</span><button class="btn-txt" data-a="correo">Cambiar</button></div>' +
        '<div class="ajuste"><span class="peq tinta-2">Empezar de cero (borra tu avance)</span><button class="btn-txt" data-a="borrar">Borrar</button></div>',
      botones: [{ t: 'Listo', cls: 'btn-pri' }]
    });
    h.querySelectorAll('[data-tema]').forEach(b => b.addEventListener('click', () => {
      const t = b.getAttribute('data-tema'); a.tema = t === 'auto' ? null : t; LS.guardar(); LS.aplicarAjustes();
      h.querySelectorAll('[data-tema]').forEach(x => x.setAttribute('aria-pressed', x === b));
    }));
    h.querySelectorAll('[data-sw]').forEach(b => b.addEventListener('click', () => {
      const k = b.getAttribute('data-sw'); a[k] = !a[k]; LS.guardar(); LS.aplicarAjustes(); b.setAttribute('aria-checked', !!a[k]);
      if (k === 'sonido' && a[k]) ui().sonido('ok');
    }));
    h.querySelector('[data-a="correo"]').addEventListener('click', () => { ui().cerrarHoja(true); editando = true; ir('registro'); });
    h.querySelector('[data-a="borrar"]').addEventListener('click', () => {
      ui().hoja({
        tipo: 'info', icono: 'reintentar', titulo: '¿Borrar todo tu avance?',
        html: '<p>Se borran tus láminas, tu juego y tu test en este celular. No se puede deshacer.</p>',
        botones: [{ t: 'Sí, borrar todo', cls: 'btn-sec', fn: () => { LS.borrarTodo(); LS.aplicarAjustes(); ir('registro'); } }, { t: 'No, volver', cls: 'btn-pri' }]
      });
    });
  }

  // ---------- Glosario ----------
  const GLOSARIO = [
    ['Positivo', 'Un número mayor que 0. Es plata que tienes. Ej.: 5 o +5.', '+5'],
    ['Negativo', 'Un número menor que 0. Lleva el signo − pegado. Es plata que debes. Ej.: −5.', '−5'],
    ['Signo', 'El + o el − que va pegado a un número y dice de qué lado del 0 está.', '−3'],
    ['Tamaño', 'El número sin su signo. El tamaño de −9 es 9. En los libros: «valor absoluto».', '−9'],
    ['Opuestos', 'Dos números con el mismo tamaño y distinto signo. Juntos dan 0.', '3 + (−3) = 0'],
    ['Paréntesis', 'Los signos ( ) o [ ]. Lo de adentro se resuelve primero.', '7 − (3 − 5)'],
    ['Multiplicar', 'Se escribe con · o con un número pegado a un paréntesis.', '2(−4) = −8'],
    ['Dividir', 'Se escribe con ÷. Nunca se divide entre 0.', '(−12) ÷ 3 = −4'],
    ['Potencia', 'Multiplicar un número por sí mismo varias veces.', '2^3 = 8'],
    ['Base', 'El número grande de una potencia: el que se multiplica.', '(−2)^3'],
    ['Exponente', 'El numerito de arriba: dice cuántas veces se multiplica la base.', '5^2'],
    ['Operación combinada', 'Un ejercicio con varias operaciones mezcladas. Se resuelve con la ESCALERA.', '3 − 2(−4) + 1']
  ];
  function glosario() {
    ui().hoja({
      tipo: 'info', icono: 'ayuda', titulo: 'Glosario',
      html: '<dl class="glosario">' + GLOSARIO.map(g => '<dt>' + g[0] + '</dt><dd>' + g[1] + ' <span style="white-space:nowrap">' + ui().fx(g[2]) + '</span></dd>').join('') + '</dl>',
      botones: [{ t: 'Cerrar', cls: 'btn-pri' }]
    });
  }

  // ---------- Aviso de navegador interno (Instagram, Facebook, WhatsApp…) ----------
  function avisoNavegador() {
    const ua = navigator.userAgent || '';
    if (!/FBAN|FBAV|Instagram|; wv\)|WhatsApp/i.test(ua)) return;
    const a = document.getElementById('aviso-navegador');
    a.hidden = false;
    a.innerHTML = '<span>Para no perder tu avance, ábrelo en Chrome o Safari (toca ⋮ → Abrir en Chrome).</span><button type="button">' + ui().icon('copiar') + ' Copiar link</button>';
    a.querySelector('button').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(location.href); a.querySelector('button').textContent = 'Copiado ✓'; }
      catch (e) { prompt('Copia este link:', location.href); }
    });
  }

  // ---------- Inicio ----------
  function iniciar() {
    avisoNavegador();
    // Registro único: si el estudiante ya se registró en el Campus, se usan esos datos
    try {
      const c = JSON.parse(localStorage.getItem('campus_v1') || 'null');
      const u0 = LS.st.usuario;
      if ((!u0.nombre || !u0.correo) && c && c.usuario && c.usuario.nombre && c.usuario.correo) {
        LS.st.usuario = { nombre: c.usuario.nombre, correo: c.usuario.correo };
        LS.guardar();
      }
    } catch (e) { }
    const u = LS.st.usuario;
    let destino = 'hub', opts = {};
    if (!u.nombre || !u.correo) destino = 'registro';
    else if (!LS.st.laminas.completadas && LS.st.laminas.maxAlcanzada === 0) destino = 'laminas';
    // Enlaces directos desde el Campus: ?ir=juego|test|hub|laminas · ?lamina=34 · ?herramienta=tabla
    if (destino !== 'registro') {
      const q = new URLSearchParams(location.search);
      const her = q.get('herramienta'), lam = parseFloat(q.get('lamina')), a = q.get('ir');
      if (her && LS.HERRAMIENTAS && LS.HERRAMIENTAS[her]) { destino = 'herramienta'; opts = { tipo: her }; }
      else if (!isNaN(lam)) { destino = 'laminas'; opts = { num: lam }; }
      else if (['juego', 'test', 'hub', 'laminas'].indexOf(a) >= 0) destino = a;
    }
    try { history.replaceState({ s: destino }, '', location.pathname); } catch (e) { }
    ir(destino, opts, true);
    guardia();
  }

  LS.app = { ir, ajustes, glosario, actual: () => actual };
  document.addEventListener('DOMContentLoaded', iniciar);
})();
