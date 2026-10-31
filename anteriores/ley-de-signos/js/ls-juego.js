/* «Signo a Signo» — interfaz del juego: mapa, tarjeta «Antes de jugar», ejercicio con teclado propio,
   feedback «Casi…», barra de dominio/escudo/racha, rescate, fin de nivel, puerta «¿Qué regla uso?»,
   jefe final por fases A/B/C, reto relámpago y calentamientos. Usa LS.juegoGen (lógica pura).
   Expone LS.juego = { abrir(root, opts), atras(), resumen() }. */
(function () {
  'use strict';
  const LS = window.LS = window.LS || {};
  const G = () => LS.juegoGen, M = () => LS.M, ui = () => LS.ui, svg = () => LS.svg;
  const esc = (s) => LS.ui.esc(s);
  const ic = (id, cls) => LS.ui.icon(id, cls);

  // ---------- Paradas ----------
  const NIV = {
    1: { nombre: 'Se juntan', chip: 'SE JUNTAN', que: 'Mismo signo: −5 − 9', lam: [12], regla: 'Si los dos signos son iguales, suma los tamaños y deja ese signo.', bien: 'Juntaste bien las deudas y la plata.' },
    2: { nombre: 'Se cancelan', chip: 'SE CANCELAN', que: 'Signos distintos: pagas lo que puedes', lam: [13, 14, 17], regla: 'Si los signos son distintos, resta los tamaños (grande menos chico) y deja el signo del que tiene más tamaño.', bien: 'Cancelaste bien la plata y las deudas.' },
    3: { nombre: 'Signos pegados', chip: 'SIGNOS PEGADOS', que: '5 − (−2) y sus primos', lam: [21], regla: 'Si dos signos quedan pegados, júntalos en uno: iguales dan +, distintos dan −.', bien: 'Fundiste bien los signos pegados.' },
    4: { nombre: 'Cuenta los negativos', chip: 'CUENTA LOS NEGATIVOS', que: 'Multiplicar y dividir', lam: [26], regla: 'Cuenta los negativos: si son par (2, 4…) el resultado es positivo; si son impar (1, 3…) es negativo. Luego multiplica o divide los tamaños.', bien: 'Contaste bien los negativos.' },
    5: { nombre: 'Potencia', chip: 'POTENCIA', que: '(−3)² no es lo mismo que −3²', lam: [31, 32], regla: 'El exponente solo multiplica lo que tiene pegado. Con paréntesis el menos entra; sin paréntesis el menos espera afuera.', bien: 'Viste bien hasta dónde llega el exponente.' },
    6: { nombre: 'Jefe final', chip: 'ESCALERA', que: 'Operaciones combinadas por pasos', lam: [34, 35], regla: 'Primero paréntesis, luego potencias, luego · y ÷, al final + y −. Si están en el mismo escalón, de izquierda a derecha.', bien: 'Subiste la ESCALERA en orden.' }
  };
  const LAM_PUERTA = [28, 29], LAM_RESUMEN = 40;
  const ELOGIO_NIV = {
    1: ['Juntaste las deudas perfecto.', 'Mismo signo, se juntan: bien visto.', 'Sumaste los tamaños y dejaste el signo.'],
    2: ['Pagaste lo que podías: perfecto.', 'Viste quién tenía más tamaño.', 'Cancelaste bien la plata y las deudas.'],
    3: ['Fundiste bien los signos pegados.', 'Leíste bien los dos signos.', 'Primero fundir, después calcular: así es.'],
    4: ['Contaste bien los negativos.', 'Par o impar: lo viste bien.', 'Primero el signo, luego los tamaños.'],
    5: ['Viste hasta dónde llega el exponente.', 'Buen ojo con el paréntesis.', 'Repetiste el número las veces justas.'],
    6: ['Subiste la ESCALERA en orden.', 'Cada paso en su escalón.', 'Paso a paso, sin saltarte nada.']
  };
  const LOGROS = {
    detective: 'Detective: corregiste tu error en el gemelo',
    sintrampa: 'Sin trampa: 5 gemelos trampa acertados',
    potencia: 'Potencia sin paréntesis: 3 pares (−a)² / −a² bien',
    escalador: 'Escalador: pasaste la fase C sin rescate'
  };
  function ejemplo(k) {
    const b = M().b, n = M().n;
    if (k === 1) return { expr: b('-', n(-5), n(9)) };
    if (k === 2) return { expr: b('+', n(-9), n(5)) };
    if (k === 3) return { expr: b('-', n(5), n(-2)) };
    if (k === 4) return { expr: b('*', n(-6), n(-4), { imp: true }) };
    if (k === 5) return { expr: M().o(M().p(n(3), 2)) };
    return { expr: b('-', n(3), b('*', n(2), n(-4), { imp: true })), cods: ['E16'] };
  }

  // ---------- Estado persistente (LS.st.juego) ----------
  function J() {
    const j = LS.st.juego || (LS.st.juego = {});
    if (!j.v) {
      Object.assign(j, {
        v: 1, nivelActual: 1, niveles: {}, puertaReglaOk: false, itemEnCurso: null, gemeloPendiente: null,
        recientes: [], racha: 0, mejorRachaGlobal: 0, errores: {}, erroresSesion: {}, pistasUsadas: 0, logros: [],
        tiempoActivoMs: 0, ultimaSesion: null, relampagoRecord: 0, testDesbloqueado: false, avisos: {},
        cont: { trampasOk: 0, paresOk: 0 }, paradaMax: 1
      });
    }
    j.avisos = j.avisos || {}; j.cont = j.cont || { trampasOk: 0, paresOk: 0 }; j.errores = j.errores || {}; j.erroresSesion = j.erroresSesion || {};
    for (let k = 1; k <= 6; k++) {
      if (!j.niveles[k]) j.niveles[k] = { estado: k === 1 ? 'abierto' : 'bloqueado' };
      const nv = j.niveles[k];
      ['barra', 'items', 'itemsEval', 'aciertos1', 'estrellas', 'rescates', 'mejorRacha', 'erroresSeguidos', 'ciclo'].forEach(c => { if (typeof nv[c] !== 'number') nv[c] = 0; });
      nv.subtiposOk = nv.subtiposOk || []; nv.fallosSub = nv.fallosSub || {}; nv.errores = nv.errores || {};
      if (k === 6) { nv.fase = nv.fase || 'A'; nv.combinadas = nv.combinadas || []; }
    }
    return j;
  }
  const NV = (k) => J().niveles[k];
  const hecho = (k) => { const e = NV(k).estado; return e === 'superado' || e === 'reforzar'; };
  function guardar() { LS.guardar(); }
  function estrellasTotales() { let s = 0; for (let k = 1; k <= 6; k++) s += NV(k).estrellas || 0; return s; }
  function topErrores(obj, n) { return Object.keys(obj || {}).filter(c => c !== 'E12c').sort((a, b) => obj[b] - obj[a]).slice(0, n || 2); }

  // ---------- Tiempo activo e inactividad ----------
  let ultimoToque = 0, tInact = null, enJuego = false;
  function toque() {
    const ahora = Date.now();
    if (enJuego && ultimoToque) {
      const d = ahora - ultimoToque;
      if (d > 0 && d <= 120000) J().tiempoActivoMs += d;
      if (J().tiempoActivoMs >= 45 * 60000 && !J().testDesbloqueado) { J().testDesbloqueado = true; guardar(); }
    }
    ultimoToque = ahora;
    clearTimeout(tInact);
    if (enJuego) tInact = setTimeout(inactivo, 120000);
  }
  function inactivo() {
    if (!enJuego || !root || !document.body.contains(root)) return;
    ultimoToque = 0; // se pausa el tiempo activo
    ui().hoja({ tipo: 'info', icono: 'foco', titulo: 'Tu avance está guardado. ¿Sigues?', html: '<p>Cuando quieras, seguimos donde ibas.</p>', botones: [{ t: 'Sigo aquí', cls: 'btn-pri' }] });
  }

  // ---------- Pantallas: navegación interna ----------
  let root = null, vista = 'mapa', limpiezas = [];
  function limpiar() {
    limpiezas.forEach(fn => { try { fn(); } catch (e) { } });
    limpiezas = [];
    enJuego = false; clearTimeout(tInact);
    if (ui() && ui().hayHoja()) ui().cerrarHoja(true);
  }
  function pintar(html, v) {
    limpiar();
    vista = v;
    acc = {};
    root.innerHTML = html;
    window.scrollTo(0, 0);
  }
  function irApp(dest, o) { if (LS.app && LS.app.ir) LS.app.ir(dest, o); }
  function verLamina(num) {
    if (LS.laminas && LS.laminas.verLamina) LS.laminas.verLamina(num);
    else irApp('laminas', { num });
  }
  function chips(reglas) { return '<span class="chips">' + reglas.map(r => ui().chip(r)).join('') + '</span>'; }

  // ---------- Abrir ----------
  let primeraVez = true;
  function abrir(r, opts) {
    root = r; opts = opts || {};
    J();
    if (primeraVez) { J().erroresSesion = {}; primeraVez = false; }
    enlazarRaiz();
    LS.setColor('full');
    if (opts.nivel && !bloqueado(opts.nivel)) { antesDeJugar(opts.nivel); return; }
    mapa();
  }
  function atras() {
    if (vista === 'mapa') return false;
    if (ui().hayHoja()) { ui().cerrarHoja(); return true; }
    mapa();
    return true;
  }
  function bloqueado(k) { return NV(k).estado === 'bloqueado'; }
  function puertaAbierta() { return hecho(3); }

  // Delegación de clics: cada pantalla define sus acciones en `acc` (atributo data-j)
  let acc = {};
  function delegar(e) {
    if (!root || !root.querySelector('.jg')) return;
    const a = e.target.closest('[data-j]');
    if (!a || !root.contains(a)) return;
    const f = acc[a.getAttribute('data-j')] || BASE[a.getAttribute('data-j')];
    if (f) { e.preventDefault(); f(a, e); }
  }
  const BASE = {
    mapa: () => mapa(),
    hub: () => irApp('hub'),
    ajustes: () => hojaAjustes(),
    regla: () => hojaRegla(J().nivelActual),
    resumen: () => verLamina(LAM_RESUMEN)
  };
  function enlazarRaiz() {
    if (root._jgEnlazado) return;
    root._jgEnlazado = true;
    root.addEventListener('click', delegar);
    root.addEventListener('pointerdown', () => toque());
    root.addEventListener('keydown', () => toque());
  }

  function topBar(titulo, sub) {
    return '<header class="jg-top"><button class="btn-ico" data-j="mapa" aria-label="Volver al mapa">' + ic('atras') + '</button>' +
      '<div class="jg-top-t"><b>' + titulo + '</b>' + (sub ? '<span>' + sub + '</span>' : '') + '</div>' +
      '<button class="btn-ico" data-j="ajustes" aria-label="Ajustes del juego">' + ic('ajustes') + '</button></header>';
  }

  // ---------- Hojas: ajustes y «¿Qué regla era?» ----------
  function hojaAjustes() {
    const a = LS.st.ajustes;
    const sw = (id, on, txt) => '<div class="ajuste"><span>' + txt + '</span><button class="switch" role="switch" data-sw="' + id + '" aria-checked="' + (on ? 'true' : 'false') + '" aria-label="' + txt + '"></button></div>';
    const h = ui().hoja({
      tipo: 'info', icono: 'ajustes', titulo: 'Ajustes del juego',
      html: sw('sonido', a.sonido, 'Sonido') + sw('mov', a.menosAnimaciones, 'Menos animaciones') +
        '<div class="col" style="margin-top:12px">' +
        '<button class="btn btn-sec btn-ancho" data-h="resumen">Ver el resumen (hoja final)</button>' +
        (LS.app && LS.app.glosario ? '<button class="btn btn-sec btn-ancho" data-h="glosario">Glosario de palabras</button>' : '') +
        (LS.app && LS.app.ajustes ? '<button class="btn btn-txt" data-h="mas">Más ajustes (tema claro u oscuro)</button>' : '') + '</div>',
      botones: [{ t: 'Listo', cls: 'btn-pri' }]
    });
    h.addEventListener('click', e => {
      const s = e.target.closest('[data-sw]');
      if (s) {
        const on = s.getAttribute('aria-checked') !== 'true';
        s.setAttribute('aria-checked', on ? 'true' : 'false');
        if (s.getAttribute('data-sw') === 'sonido') { LS.st.ajustes.sonido = on; if (on) ui().sonido('ok'); }
        else { LS.st.ajustes.menosAnimaciones = on; if (LS.aplicarAjustes) LS.aplicarAjustes(); }
        guardar(); return;
      }
      const b = e.target.closest('[data-h]'); if (!b) return;
      const q = b.getAttribute('data-h');
      ui().cerrarHoja(true);
      if (q === 'resumen') verLamina(LAM_RESUMEN);
      else if (q === 'glosario') LS.app.glosario();
      else if (q === 'mas') LS.app.ajustes();
    });
  }
  function hojaRegla(k) {
    k = k || 1;
    const m = NIV[k], inf = G().info(ejemplo(k));
    ui().hoja({
      tipo: 'info', icono: 'foco', titulo: '¿Qué regla era?',
      html: chips([m.chip]) + '<p class="jg-regla">' + esc(m.regla) + '</p>' + solHtml(inf) + dibujoHtml(inf.dibujo, k),
      botones: [{ t: 'Seguir jugando', cls: 'btn-pri' }, { t: 'Ver la lámina', cls: 'btn-sec', fn: () => setTimeout(() => verLamina(m.lam[0]), 0) }]
    });
  }

  // ---------- Solución, dibujos ----------
  function solHtml(inf) {
    const s = inf.sol;
    let h = '<div class="jg-sol">' + chips(s.reglas);
    if (s.filas) {
      h += '<ol class="jg-filas">' + s.filas.map(f => '<li>' + ui().fx(f.txt, { clase: 'fx-medio' }) +
        (f.op ? '<span class="jg-filas-op">escalón ' + f.esc + ' · ' + esc(f.op) + '</span>' : '') + '</li>').join('') + '</ol>';
    } else {
      const p = s.partes, ult = p.length - 1;
      h += '<p class="jg-linea">' + p.map((x, i) => (i === 0 || i === ult) && /^[−\d(]/.test(x) && !/[a-z]/i.test(x) ? ui().fx(x) : '<span>' + esc(x) + '</span>').join(' <span class="jg-flecha">→</span> ') + '</p>';
    }
    return h + '</div>';
  }
  function dibujoHtml(d, nivel) {
    if (!d) return '';
    let h = '';
    if (d.fusion) h += '<p class="jg-fusion">' + ui().fx(d.fusion.antes) + ' <span class="jg-flecha">→</span> ' + ui().fx(d.fusion.despues) + '</p>';
    if (d.recta && nivel <= 3) h += '<div class="dibujo jg-dib">' + svg().recta(d.recta) + '</div>';
    if (d.fichas && nivel === 2) h += '<div class="dibujo jg-dib">' + svg().fichas(d.fichas) + '</div>';
    if (d.tabla != null) h += '<div class="jg-dib">' + svg().tablaSignos(d.tabla) + '</div>';
    if (d.contador) h += '<p class="jg-contador">' + esc(d.contador) + '</p>';
    if (d.expansion) {
      const e = d.expansion;
      h += '<div class="jg-exp">' + (e.afuera ? '<span class="jg-afuera">−</span>' : '') +
        '<span class="jg-alc"><span class="jg-arco">' + ui().fx(e.base) + '</span><sup>' + e.e + '</sup></span>' +
        '<p class="jg-nota">' + (e.afuera ? 'El arco muestra lo que toca el exponente. El menos espera afuera.' : 'El exponente toca todo lo que está bajo el arco.') + '</p>' +
        '<p>' + ui().fx(e.fila) + '</p></div>';
    }
    if (d.escalera) h += '<div class="dibujo jg-dib jg-esc-mini">' + svg().escalera(d.escalera) + '</div>';
    return h;
  }

  // ---------- Mapa «Tu camino» ----------
  function mapa() {
    const j = J();
    LS.setColor('full');
    acc = {};
    const vuelve = j.ultimaSesion && j.ultimaSesion !== LS.hoy() && [1, 2, 3, 4, 5, 6].some(hecho);
    const nodoNivel = (k) => {
      const nv = NV(k), e = nv.estado, act = k === j.nivelActual && e === 'abierto';
      const circ = e === 'bloqueado' ? ic('candado') : e === 'superado' ? ic('check') : '<b>' + k + '</b>';
      const extra = e === 'superado' ? svg().estrellas(nv.estrellas || 0, 3) : e === 'reforzar' ? '<em class="jg-reforzar">por reforzar</em>' : e === 'abierto' && nv.items ? '<em>casilla ' + nv.barra + '/5</em>' : '';
      return '<li class="jg-paso est-' + e + (act ? ' actual' : '') + '"><button class="jg-nodo" data-j="nodo" data-k="' + k + '" aria-label="Parada ' + k + ': ' + NIV[k].nombre + ', ' + (e === 'reforzar' ? 'por reforzar' : e) + '">' +
        '<span class="jg-circ">' + circ + '</span><span class="jg-nodo-txt"><b>' + k + ' · ' + NIV[k].nombre + '</b><span>' + esc(NIV[k].que) + '</span>' + extra + '</span></button></li>';
    };
    const pe = puertaAbierta() ? (j.puertaReglaOk ? 'superado' : 'abierto') : 'bloqueado';
    const re = hecho(6) ? 'abierto' : 'bloqueado';
    const te = j.testDesbloqueado ? 'abierto' : 'bloqueado';
    const esp = (e, id, circ, t1, t2, lbl) => '<li class="jg-paso jg-esp est-' + e + '"><button class="jg-nodo" data-j="' + id + '" aria-label="' + lbl + '"><span class="jg-circ">' + circ + '</span><span class="jg-nodo-txt"><b>' + t1 + '</b><span>' + t2 + '</span></span></button></li>';
    pintar('<div class="pantalla jg jg-mapa">' +
      '<header class="jg-top"><button class="btn-ico" data-j="hub" aria-label="Volver al inicio">' + ic('atras') + '</button>' +
      '<div class="jg-top-t"><b>Tu camino</b><span>Signo a Signo · ' + esc(LS.nombre()) + '</span></div>' +
      '<button class="btn-ico" data-j="ajustes" aria-label="Ajustes del juego">' + ic('ajustes') + '</button></header>' +
      '<div class="jg-marcador"><span class="jg-pill">' + svg().estrellas(1, 1) + ' Estrellas ' + estrellasTotales() + '/18</span>' +
      '<span class="jg-pill jg-pill-rayo">' + ic('rayo', 'jg-rayo') + ' Mejor racha ' + (j.mejorRachaGlobal || 0) + '</span></div>' +
      (vuelve ? '<div class="tarjeta jg-vuelta"><p><b>¡Bienvenido de vuelta, ' + esc(LS.nombre()) + '!</b> Ibas en la parada ' + j.nivelActual + ', casilla ' + NV(j.nivelActual).barra + '/5.</p>' +
        '<p class="peq tinta-2">Primero calentamos con 5 ejercicios de lo que ya hiciste. No cuentan para la barra.</p>' +
        '<div class="col"><button class="btn btn-pri btn-ancho" data-j="regreso">Calentar (5 ejercicios)</button>' +
        '<button class="btn btn-txt" data-j="sincalentar">Seguir sin calentar</button></div></div>' : '') +
      (j.testDesbloqueado && ![1, 2, 3, 4, 5, 6].every(hecho) ? '<div class="caja-nota jg-nota-test">Puedes ir al test ahora o seguir practicando la parada ' + j.nivelActual + '.</div>' : '') +
      '<ol class="jg-camino">' + nodoNivel(1) + nodoNivel(2) + nodoNivel(3) +
      esp(pe, 'puerta', '<b>◆</b>', 'Puerta · ¿Qué regla uso?', 'Elige la regla sin calcular (4 de 5)', 'Puerta ¿Qué regla uso?, ' + pe) +
      nodoNivel(4) + nodoNivel(5) + nodoNivel(6) +
      esp(re, 'relampago', re === 'bloqueado' ? ic('candado') : ic('rayo'), 'Reto relámpago', re === 'bloqueado' ? 'Se abre al terminar la parada 6' : '90 segundos · récord: ' + (j.relampagoRecord || 0), 'Reto relámpago, ' + re) +
      esp(te, 'test', te === 'bloqueado' ? ic('candado') : ic('sig'), 'Test final (25 preguntas)', te === 'bloqueado' ? 'Se abre al terminar las 6 paradas (o tras 45 min de juego)' : 'Sin tiempo límite. ¡Ya puedes!', 'Test final, ' + te) +
      '</ol></div>', 'mapa');
    acc = {
      nodo: (b) => {
        const k = +b.getAttribute('data-k');
        if (bloqueado(k)) return aviso(k === 4 && hecho(3) && !J().puertaReglaOk ? 'Primero cruza la puerta «¿Qué regla uso?».' : 'Termina la parada anterior para abrir esta.');
        antesDeJugar(k);
      },
      puerta: () => pe === 'bloqueado' ? aviso('La puerta se abre al terminar la parada 3.') : puerta(),
      relampago: () => re === 'bloqueado' ? aviso('El reto relámpago se abre al terminar la parada 6. Es opcional.') : relampagoIntro(),
      test: () => te === 'bloqueado' ? aviso('El test se abre cuando las 6 paradas estén superadas o «por reforzar», o después de 45 minutos de juego.') : irApp('test'),
      regreso: () => { J().ultimaSesion = LS.hoy(); guardar(); calentamiento('regreso'); },
      sincalentar: () => { J().ultimaSesion = LS.hoy(); guardar(); mapa(); }
    };
  }
  function aviso(txt) { ui().hoja({ tipo: 'info', icono: 'candado', titulo: 'Todavía no', html: '<p>' + esc(txt) + '</p>', botones: [{ t: 'Entendido', cls: 'btn-pri' }] }); }

  // ---------- Tarjeta «Antes de jugar» ----------
  function antesDeJugar(k) {
    const nv = NV(k), m = NIV[k], inf = G().info(ejemplo(k));
    const yaHecho = hecho(k);
    LS.setColor('full');
    pintar('<div class="pantalla jg">' + topBar('Parada ' + k + ' de 6', m.nombre) +
      '<div class="tarjeta jg-antes"><p class="jg-kicker">Antes de jugar</p><h2>' + m.nombre + '</h2>' + chips([m.chip]) +
      '<p class="jg-regla">' + esc(m.regla) + '</p>' +
      '<h3 class="jg-h3">Ejemplo resuelto</h3>' + solHtml(inf) + dibujoHtml(inf.dibujo, k) +
      (k === 6 ? '<p class="caja-nota">Fase A: te marco el paso que toca. Fase B: tú tocas la operación que va primero. Fase C: solo el resultado final.</p>' : '') +
      '<ul class="jg-criterio">' +
      '<li>' + ic('escudo', 'jg-escudo-ico') + '<span>Tu escudo te protege de 1 error en este nivel.</span></li>' +
      '<li><span class="jg-dom-mini" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span><span>Llena la barra: acierto a la primera +1, error −1 (nunca baja de 0). Pasas con la barra llena y al menos 8 ejercicios.</span></li>' +
      '<li>' + svg().estrellas(3, 3) + '<span>3 con 85 % o más a la primera · 2 con 65 % · 1 al superar la parada. Nunca por tiempo.</span></li></ul></div>' +
      '<div class="jg-acciones"><button class="btn btn-pri btn-ancho" data-j="jugar">' + (yaHecho ? 'Repetir por más estrellas' : (nv.items ? 'Seguir jugando' : 'Jugar')) + '</button>' +
      '<button class="btn btn-sec btn-ancho" data-j="lamina">Repasar la lámina</button></div></div>', 'antes');
    acc = { jugar: () => entrarNivel(k, yaHecho), lamina: () => verLamina(m.lam[0]) };
  }

  // ---------- Entrar a un nivel ----------
  let logrosSesion = [];
  function entrarNivel(k, repetir) {
    const j = J(), nv = NV(k);
    j.nivelActual = k; j.paradaMax = Math.max(j.paradaMax || 1, k);
    if (repetir && !(j.itemEnCurso && j.itemEnCurso.nivel === k && nv.repitiendo)) {
      Object.assign(nv, { barra: 0, items: 0, itemsEval: 0, aciertos1: 0, subtiposOk: [], erroresSeguidos: 0, rescate: null, rescate15: false, cola: null, repitiendo: true, fallosSub: {} });
      if (k === 6) { nv.fase = 'C'; nv.combinadas = []; }
      if (j.itemEnCurso && j.itemEnCurso.nivel === k) j.itemEnCurso = null;
    }
    nv.escudo = true;
    j.ultimaSesion = LS.hoy();
    logrosSesion = [];
    guardar();
    if (!j.avisos.signo) {
      j.avisos.signo = true; guardar();
      ui().hoja({
        tipo: 'info', icono: 'foco', titulo: 'Antes de empezar', cerrable: false,
        html: '<p>Para escribir un número negativo, toca <span class="tecla-signo jg-tecla-demo" aria-hidden="true"><span class="s-pos">+</span><span class="s-bar">/</span><span class="s-neg">−</span></span>. El número se pondrá naranja.</p><p class="peq tinta-2">Si no lo tocas, el número es positivo.</p>',
        botones: [{ t: 'Entendido', cls: 'btn-pri', fn: () => siguienteItemNivel(k) }]
      });
      return;
    }
    siguienteItemNivel(k);
  }

  function registrarReciente(it) {
    const r = J().recientes; r.push(it.id); if (r.length > 15) r.splice(0, r.length - 15);
  }
  function itemFijo155() {
    const b = M().b, n = M().n;
    return { id: '1a:−5 − 9', sub: '1a', nivel: 1, expr: b('-', n(-5), n(9)), C: -14, patron: '1a::-', nums: [5, 9], cods: null, regla: 'PLATA' };
  }
  function planItem(k) {
    const j = J(), nv = NV(k), g = G();
    const base = { modo: 'nivel', nivel: k, pistaNivel: 0 };
    const fase = k === 6 ? nv.fase : undefined;
    const rec = j.recientes;
    if (j.gemeloPendiente) {
      const gp = j.gemeloPendiente; j.gemeloPendiente = null;
      const it = g.gemelo(gp.item, { recientes: rec, fase: gp.faseA ? 'A' : (gp.item.nivel === 6 ? fase : undefined) });
      if (it) return Object.assign(base, { item: it, gemelo: true, previo: !!gp.previo, faseItem: gp.faseA ? 'A' : fase });
    }
    if (nv.rescate && nv.rescate.restantes > 0) {
      const it = g.crear(nv.rescate.sub, { facil: true, recientes: rec, fase: 'A' }) || g.crear(g.SUBS[k][0], { facil: true, fase: 'A' });
      return Object.assign(base, { item: it, rescate: true, faseItem: 'A' });
    }
    if (k === 1 && nv.items === 0 && !nv.repitiendo) return Object.assign(base, { item: itemFijo155() });
    const est = { items: nv.items, subtiposOk: nv.subtiposOk, barra: nv.barra, ultimoSub: nv.ultimoSub, ultimo: nv.ultimo, fase, ciclo: nv.ciclo, cola: nv.cola };
    let plan = g.elegirSub(k, est), it = null;
    const extra = {};
    if (plan.trampa) {
      it = g.trampa(nv.ultimo, {});
      if (it && rec.indexOf(it.id) < 0) { extra.trampa = true; extra.previo = true; }
      else { it = null; plan = g.elegirSub(k, Object.assign({}, est, { ultimo: null })); }
    }
    if (!it) {
      it = g.crear(plan.sub, Object.assign({ recientes: rec, fase }, plan.opts));
      extra.previo = !!plan.previo;
      if (plan.contraste) { nv.cola = null; extra.contraste = true; }
    }
    if (!it) { it = g.crear(g.SUBS[k][0], { fase: k === 6 ? 'A' : undefined }); extra.previo = false; }
    nv.ciclo++;
    // paso previo «¿qué regla uso?»: 1 de cada 3 ítems del nivel 4, y siempre en los gemelos trampa
    const tocaPrevio = !!extra.trampa || (k === 4 && nv.ciclo % 3 === 0);
    if (tocaPrevio && g.BTN_REGLA.indexOf(it.regla) >= 0) extra.previoRegla = true;
    if (k === 5 && !extra.contraste && !extra.previo) {
      const pc = g.parContraste(it);
      if (pc && !nv.cola) nv.cola = { sub: pc.sub, base: pc.base, en: nv.items + 2 + (Math.random() < 0.5 ? 0 : 1) };
    }
    return Object.assign(base, extra, { item: it, faseItem: fase });
  }
  function siguienteItemNivel(k) {
    const j = J();
    let ec = j.itemEnCurso;
    if (!(ec && ec.modo === 'nivel' && ec.nivel === k && ec.item)) { ec = planItem(k); j.itemEnCurso = ec; guardar(); }
    if (ec.item.nivel === 6 && ec.item.cods && (ec.faseItem === 'A' || ec.faseItem === 'B')) pantallaJefe(ec);
    else pantallaNivel(ec);
  }

  // ---------- Piezas del ejercicio ----------
  function estadoHtml(k) {
    const nv = NV(k), j = J();
    let dom = '<span class="jg-dom" role="img" aria-label="Barra de dominio: ' + nv.barra + ' de 5">';
    for (let i = 0; i < 5; i++) dom += '<i class="' + (i < nv.barra ? 'llena' : '') + '"></i>';
    dom += '</span>';
    const esc_ = '<span class="jg-escudo' + (nv.escudo ? '' : ' roto') + '" role="img" aria-label="' + (nv.escudo ? 'Escudo activo: te protege de 1 error' : 'Escudo usado') + '">' + ic('escudo') + '</span>';
    const racha = '<span class="jg-racha' + (j.racha >= 5 ? ' grande' : '') + '" aria-label="Racha de ' + j.racha + '">' + ic('rayo') + '×' + j.racha + '</span>';
    return '<div class="jg-estado">' + dom + esc_ + '<span class="esp"></span>' + racha + '</div>';
  }
  function herramientas(conPista) {
    return '<div class="jg-herr"><button class="btn-txt" data-j="regla">' + ic('ayuda') + ' ¿Qué regla era?</button>' +
      '<button class="btn-txt" data-j="resumen">Resumen</button>' +
      (conPista ? '<button class="btn btn-sec jg-btn-pista" data-j="pista">' + ic('foco') + ' Pista</button>' : '') + '</div>';
  }
  function montarTeclado(zona, onOk) {
    zona.innerHTML = '';
    const t = ui().teclado(zona, { max: 4, onOk: (v, info) => { t.bloquear(true); onOk(v, info || {}); } });
    limpiezas.push(() => { try { t.destruir(); } catch (e) { } });
    return t;
  }
  function pistaHtml(nivelP, inf, stepTxt) {
    let h = '';
    if (nivelP >= 1) h += '<div class="jg-pista"><b>Pista 1.</b> ' + ui().chip(inf.pistas[0].regla.split(' + ')[0]) + ' <span>Regla: ' + esc(inf.pistas[0].regla) + '. ' + esc(inf.pistas[0].txt) + '</span></div>';
    if (nivelP >= 2) h += '<div class="jg-pista"><b>Pista 2.</b> ' + esc(inf.pistas[1]) + '</div>';
    if (nivelP >= 3) h += '<div class="jg-pista"><b>Pista 3.</b> ' + (stepTxt ? esc(stepTxt) : solHtml(inf)) + '</div>';
    if (nivelP >= 2) h += '<p class="peq tinta-3">Con esta pista el ejercicio no suma a la barra (tampoco resta).</p>';
    return h;
  }
  function pedirPista(ec, zona, inf, stepTxt) {
    if (ec.pistaNivel >= 3) return;
    ec.pistaNivel++; J().pistasUsadas++; guardar();
    zona.innerHTML = pistaHtml(ec.pistaNivel, inf, stepTxt);
    const b = root.querySelector('[data-j="pista"]');
    if (b && ec.pistaNivel >= 3) { b.disabled = true; b.classList.add('desact'); }
  }
  function tarjetaBien(titulo, texto, extraHtml, botones) {
    return '<div class="jg-fb ok" role="status" aria-live="polite"><div class="jg-fb-cab">' + ic('check') + '<b>' + titulo + '</b></div>' +
      (texto ? '<p>' + texto + '</p>' : '') + (extraHtml || '') + '<div class="jg-fb-bot">' + botones + '</div></div>';
  }
  function tarjetaCasi(it, r, d, opts) {
    opts = opts || {};
    const inf = G().info(it);
    const sinCod = !d.cod;
    let cuerpo = '<p class="jg-tuya"><span>Tu respuesta: ' + ui().num(r) + '</span><span>Respuesta: ' + ui().num(it.C) + '</span></p>' +
      '<p class="jg-pista-txt">' + esc((opts.prefijo || '') + d.msg) + '</p>';
    if (sinCod) {
      const p = inf.sol.filas ? inf.sol.filas.map(f => f.txt + (f.op ? '   (' + f.op + ')' : '')) : inf.sol.partes;
      cuerpo += chips(inf.sol.reglas) + '<ol class="jg-revela">' + p.map((x, i) => '<li' + (i ? ' hidden' : '') + '>' + (/[a-záéíóúñ]/i.test(x) ? esc(x) : ui().fx(x)) + '</li>').join('') + '</ol>' +
        (p.length > 1 ? '<button class="btn btn-sec" data-j="revela">Ver siguiente paso</button>' : '');
    } else cuerpo += solHtml(inf);
    cuerpo += dibujoHtml(inf.dibujo, it.nivel);
    return '<div class="jg-fb miss" role="status" aria-live="polite"><div class="jg-fb-cab">' + ic('x') + '<b>Casi…</b></div>' + cuerpo +
      '<div class="jg-fb-bot">' + (opts.botones || '') + '</div></div>';
  }
  function revelarPaso() {
    const li = root.querySelector('.jg-revela li[hidden]');
    if (li) li.hidden = false;
    if (!root.querySelector('.jg-revela li[hidden]')) { const b = root.querySelector('[data-j="revela"]'); if (b) b.remove(); }
  }
  function enfocarFb() {
    const fb = root.querySelector('.jg-fb');
    if (!fb) return;
    fb.scrollIntoView({ behavior: LS.menosMovimiento() ? 'auto' : 'smooth', block: 'nearest' });
    const b = fb.querySelector('.jg-fb-bot .btn-pri');
    if (b) setTimeout(() => b.focus({ preventScroll: true }), 60);
  }
  function darLogro(id) {
    const j = J();
    if (j.logros.indexOf(id) >= 0) return;
    j.logros.push(id); logrosSesion.push(id);
  }
  function contarError(cod, k) {
    if (!cod) return;
    const j = J();
    j.errores[cod] = (j.errores[cod] || 0) + 1;
    j.erroresSesion[cod] = (j.erroresSesion[cod] || 0) + 1;
    if (k) { const e = NV(k).errores; e[cod] = (e[cod] || 0) + 1; }
  }
  function tituloLam(num) { try { return LS.laminas && LS.laminas.tituloDe ? LS.laminas.tituloDe(num) : 'lámina ' + num; } catch (e) { return 'lámina ' + num; } }
  let iElog = 0;
  function elogioDe(nivel) { const l = ELOGIO_NIV[nivel]; return l ? l[(iElog++) % l.length] : ui().elogio(); }
  function refrescarEstado(k) { const e = root.querySelector('.jg-estado'); if (e) e.outerHTML = estadoHtml(k); }
  function celebrarRacha() {
    const j = J();
    if (!j.racha || j.racha % 5 !== 0 || LS.menosMovimiento()) return;
    const r = root.querySelector('.jg-racha'); if (r) r.classList.add('pulso');
  }

  // ---------- Paso previo «¿Qué regla uso?» (nivel 4) ----------
  function botonesRegla() {
    return '<div class="jg-reglas">' + G().BTN_REGLA.map(r => '<button class="btn btn-sec jg-regla-btn" data-j="elige" data-r="' + r + '">' + ic(ui().REGLAS[r] || 'foco') + '<span>' + r + '</span></button>').join('') + '</div>';
  }
  function pasoPrevio(it, zona, k, fin) {
    zona.innerHTML = '<p class="jg-q">Antes de calcular: ¿qué regla uso?</p>' + botonesRegla() + '<div class="jg-previo-fb" aria-live="polite"></div>';
    acc.elige = (b) => {
      if (b.disabled) return;
      const r = b.getAttribute('data-r'), d = G().diagRegla(it.expr, r);
      zona.querySelectorAll('[data-r]').forEach(x => { x.disabled = true; if (x.getAttribute('data-r') === it.regla) x.classList.add('ok'); });
      const fb = zona.querySelector('.jg-previo-fb');
      if (d.cod === 'OK') fb.innerHTML = '<div class="fb ok">' + ic('check') + '<div class="fb-cuerpo">Sí: <b>' + r + '</b>. Ahora calcula.</div></div>';
      else { contarError(d.cod, k); guardar(); b.classList.add('miss'); fb.innerHTML = '<div class="fb miss">' + ic('x') + '<div class="fb-cuerpo"><b>Casi…</b> ' + esc(d.msg) + '</div></div>'; }
      fin();
    };
  }

  // ---------- Ejercicio de nivel (respuesta única) ----------
  function pantallaNivel(ec) {
    const it = ec.item, k = ec.nivel, nv = NV(k), inf = G().info(it);
    LS.setColor(k <= 3 ? 'full' : 'answer');
    let aviso = '';
    if (ec.rescate) aviso = '<div class="caja-nota"><b>Modo rescate.</b> Primer paso ya hecho: ' + esc(inf.pistas[1]) + '</div>';
    else if (ec.gemelo) aviso = '<p class="jg-etq">Uno parecido, con otros números</p>';
    else if (ec.previo) aviso = '<p class="jg-etq">Repaso de una parada anterior</p>';
    if (k === 6 && !ec.previo) aviso += '<p class="jg-etq">Fase C · escribe solo el resultado final</p>';
    pintar('<div class="pantalla jg jg-ej">' + topBar('Parada ' + k + ' · ' + NIV[k].nombre, k === 6 ? 'Fase ' + nv.fase : '') + estadoHtml(k) + herramientas(true) +
      '<div class="jg-aviso">' + aviso + '</div>' +
      '<div class="enunciado jg-enun">' + M().html(it.expr, { clase: 'fx-grande' }) + '</div>' +
      '<div class="jg-previo"></div><div class="jg-pistas" aria-live="polite"></div><div class="jg-resp"></div></div>', 'ej');
    enJuego = true; toque();
    const zP = root.querySelector('.jg-pistas'), zR = root.querySelector('.jg-resp'), zV = root.querySelector('.jg-previo');
    if (ec.pistaNivel) zP.innerHTML = pistaHtml(ec.pistaNivel, inf);
    acc.pista = () => pedirPista(ec, zP, inf);
    const teclear = () => montarTeclado(zR, (v, info) => responderNivel(ec, v, info));
    if (ec.previoRegla && !ec.previoHecho) pasoPrevio(it, zV, k, () => { ec.previoHecho = true; guardar(); teclear(); });
    else teclear();
  }

  function responderNivel(ec, r, info) {
    const it = ec.item, k = ec.nivel, j = J(), nv = NV(k);
    const d = G().diagItem(it, r);
    const ok = d.cod === 'OK', fuerte = ec.pistaNivel >= 2, delNivel = !ec.previo && it.nivel === k;
    let escudoUsado = false;
    nv.ultimoSub = it.sub; nv.ultimo = it;
    registrarReciente(it);
    if (delNivel) { nv.items++; if (!ec.rescate) nv.itemsEval++; }
    if (ok) {
      j.racha++;
      if (j.racha > (j.mejorRachaGlobal || 0)) j.mejorRachaGlobal = j.racha;
      if (j.racha > nv.mejorRacha) nv.mejorRacha = j.racha;
      if (delNivel) {
        nv.erroresSeguidos = 0;
        if (!fuerte) {
          if (nv.barra < 5) nv.barra++;
          if (!ec.rescate) nv.aciertos1++;
          if (nv.subtiposOk.indexOf(it.sub) < 0) nv.subtiposOk.push(it.sub);
        }
      }
      if (ec.gemelo && !fuerte) darLogro('detective');
      if (ec.trampa) { j.cont.trampasOk++; if (j.cont.trampasOk >= 5) darLogro('sintrampa'); }
      if (it.sub === '5a' || it.sub === '5b') {
        const pu = nv.parUlt;
        if (ec.contraste && pu && pu.ok && pu.base === it.nums[0]) { j.cont.paresOk++; if (j.cont.paresOk >= 3) darLogro('potencia'); }
        nv.parUlt = { base: it.nums[0], ok: true };
      }
    } else {
      contarError(d.cod, k);
      if (!fuerte) j.racha = 0;
      if (delNivel) {
        nv.fallosSub[it.sub] = (nv.fallosSub[it.sub] || 0) + 1;
        nv.erroresSeguidos++;
        if (!ec.rescate && !fuerte) { if (nv.escudo) { nv.escudo = false; escudoUsado = true; } else nv.barra = Math.max(0, nv.barra - 1); }
      }
      if (it.sub === '5a' || it.sub === '5b') nv.parUlt = { base: it.nums[0], ok: false };
      if (!ec.rescate) j.gemeloPendiente = { item: it, previo: !!ec.previo };
    }
    if (ec.rescate && nv.rescate) { nv.rescate.restantes--; if (nv.rescate.restantes <= 0) nv.rescate = null; }
    j.itemEnCurso = null;
    guardar();
    refrescarEstado(k);
    const zR = root.querySelector('.jg-resp');
    if (ok) {
      ui().sonido('ok');
      const tit = ec.gemelo ? '¡Eso, ' + esc(LS.nombre()) + '! Corregiste tu error' : '¡Bien, ' + esc(LS.nombre()) + '!';
      let txt = esc(elogioDe(it.nivel));
      if (info.cero_con_signo) txt += '<br><span class="peq">El 0 no es positivo ni negativo: se escribe solo 0.</span>';
      const d0 = G().info(it).dibujo;
      const extra = it.nivel <= 2 && d0.recta ? dibujoHtml({ recta: d0.recta }, it.nivel) : '';
      zR.innerHTML = tarjetaBien(tit, txt, extra, '<button class="btn btn-pri btn-ancho" data-j="sig">Siguiente' + ic('sig') + '</button>');
      const en = root.querySelector('.jg-enun'); if (en && !LS.menosMovimiento()) en.classList.add('pop');
      celebrarRacha();
    } else {
      const ERR = M().ERR;
      const botones = '<button class="btn btn-pri btn-ancho" data-j="sig">Entendido</button>' +
        (d.cod && j.erroresSesion[d.cod] >= 2 && ERR[d.cod] ? '<button class="btn btn-sec btn-ancho" data-j="lamerr">Ver la lámina «' + esc(tituloLam(ERR[d.cod].lamina)) + '»</button>' : '') +
        (d.porPasos ? '<button class="btn btn-sec btn-ancho" data-j="porpasos">Resolver por pasos</button>' : '');
      zR.innerHTML = (escudoUsado ? '<p class="jg-escudo-msg">' + ic('escudo') + ' Tu escudo te protegió de este error: la barra no bajó.</p>' : '') + tarjetaCasi(it, r, d, { botones });
      const fb = zR.querySelector('.jg-fb'); if (fb && !LS.menosMovimiento()) fb.classList.add('sacudir');
      acc.lamerr = () => verLamina(ERR[d.cod].lamina);
      acc.porpasos = () => { J().gemeloPendiente = { item: it, faseA: true }; guardar(); despuesNivel(k, d); };
      acc.revela = revelarPaso;
    }
    acc.sig = () => despuesNivel(k, ok ? null : d);
    enfocarFb();
  }

  function despuesNivel(k, d) {
    const j = J(), nv = NV(k);
    const req = G().subtiposRequeridos(k);
    if (nv.barra >= 5 && nv.items >= 8 && req.every(s => nv.subtiposOk.indexOf(s) >= 0) && (k !== 6 || nv.fase === 'C')) return finNivel(k, 'superado');
    if (nv.items >= 25) return finNivel(k, 'reforzar');
    const porCodigo = !!(d && d.cod && j.erroresSesion[d.cod] >= 3);
    if (!nv.rescate && (nv.erroresSeguidos >= 3 || porCodigo || (nv.items >= 15 && !nv.rescate15))) return iniciarRescate(k, porCodigo ? d.cod : null);
    siguienteItemNivel(k);
  }

  function iniciarRescate(k, cod) {
    const j = J(), nv = NV(k);
    if (nv.items >= 15) nv.rescate15 = true;
    nv.rescates++; nv.erroresSeguidos = 0;
    if (cod) j.erroresSesion[cod] = 0;
    if (k === 6 && nv.fase === 'C') nv.rescateEnC = true;
    const subs = G().SUBS[k];
    let sub = cod && nv.ultimo && subs.indexOf(nv.ultimo.sub) >= 0 ? nv.ultimo.sub
      : subs.slice().sort((a, b) => (nv.fallosSub[b] || 0) - (nv.fallosSub[a] || 0))[0];
    if (sub === 'T5') sub = 'T1';
    nv.rescate = { sub, restantes: 3 };
    j.gemeloPendiente = null;
    if (j.itemEnCurso && j.itemEnCurso.nivel === k) j.itemEnCurso = null;
    guardar();
    const ej = G().crear(sub, { facil: true, fase: 'A' }), inf = G().info(ej);
    LS.setColor(k <= 3 ? 'full' : 'answer');
    pintar('<div class="pantalla jg">' + topBar('Vamos más despacio', 'Parada ' + k) +
      '<div class="tarjeta jg-rescate"><p>Tranquilo, ' + esc(LS.nombre()) + ': esto le pasa a mucha gente. Mira uno resuelto completo y luego haces 3 más fáciles, con el primer paso ya hecho. Aquí los errores no restan.</p>' +
      '<div class="jg-enun">' + M().html(ej.expr, { clase: 'fx-grande' }) + '</div>' + solHtml(inf) + dibujoHtml(inf.dibujo, ej.nivel) + '</div>' +
      '<div class="jg-acciones"><button class="btn btn-pri btn-ancho" data-j="practicar">Practicar 3 fáciles</button>' +
      '<button class="btn btn-sec btn-ancho" data-j="lamina">Ver la lámina</button></div></div>', 'rescate');
    acc = { practicar: () => siguienteItemNivel(k), lamina: () => verLamina(NIV[k].lam[0]) };
  }

  // ---------- Jefe final: fases A y B (paso a paso) ----------
  function pantallaJefe(ec) {
    const it = ec.item, nv = NV(6), fase = ec.faseItem;
    const ps = M().pasos(it.expr);
    let i = 0, fallados = 0, penalizado = false;
    LS.setColor('answer');
    pintar('<div class="pantalla jg jg-ej jg-jefe">' + topBar('Parada 6 · Jefe final', 'Fase ' + fase) + estadoHtml(6) + herramientas(true) +
      '<div class="jg-aviso">' + (ec.rescate ? '<div class="caja-nota"><b>Modo rescate.</b> Números más chicos; aquí los errores no restan.</div>' : ec.gemelo ? '<p class="jg-etq">Uno parecido, paso a paso</p>' : '') +
      '<p class="jg-etq">' + (fase === 'A' ? 'Fase A · resuelve lo que está marcado' : 'Fase B · toca la operación que va primero') + '</p></div>' +
      '<div class="jg-vida" role="img"></div>' +
      '<div class="jg-jefe-cuerpo"><ol class="jg-filas-jefe enunciado"></ol><div class="jg-esc-lado" aria-hidden="true"></div></div>' +
      '<p class="jg-q" aria-live="polite"></p><div class="jg-pistas" aria-live="polite"></div><div class="jg-resp"></div></div>', 'jefe');
    enJuego = true; toque();
    const filas = root.querySelector('.jg-filas-jefe'), lado = root.querySelector('.jg-esc-lado'), q = root.querySelector('.jg-q');
    const zR = root.querySelector('.jg-resp'), zP = root.querySelector('.jg-pistas');
    const F = G().F;
    filas.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.getAttribute && e.target.getAttribute('data-j') === 'toca') { e.preventDefault(); e.target.click(); }
    });
    function vida() {
      const v = root.querySelector('.jg-vida');
      v.setAttribute('aria-label', 'Vida del jefe: ' + (ps.length - i) + ' de ' + ps.length);
      v.innerHTML = '<span class="jg-vida-t">Jefe</span>' + ps.map((_, x) => '<i class="' + (x < i ? 'hecha' : '') + '"></i>').join('');
    }
    function pintarFilas() {
      let h = '';
      for (let x = 0; x < i; x++) h += '<li class="hecho">' + M().html(ps[x].antes, { clase: 'fx-medio' }) + '<span class="jg-filas-op">' + esc(M().texto(ps[x].sub) + ' = ' + F(ps[x].valor)) + '</span></li>';
      h += i < ps.length ? '<li class="actual">' + M().html(ps[i].antes, { clase: 'fx-medio' }) + '</li>'
        : '<li class="final">' + M().html(ps[ps.length - 1].despues, { clase: 'fx-medio' }) + '</li>';
      filas.innerHTML = h;
      vida();
    }
    function marcar(path) { const s = filas.querySelector('li.actual .sub[data-p="' + path + '"]'); if (s) s.classList.add('marco'); }
    function infoPaso() { return G().info({ expr: ps[i].sub }); }
    function fallo(cod) {
      contarError(cod, 6);
      fallados++;
      const j = J();
      if (ec.pistaNivel < 2) j.racha = 0;
      if (!penalizado) {
        penalizado = true;
        if (!ec.rescate && ec.pistaNivel < 2) { if (nv.escudo) nv.escudo = false; else nv.barra = Math.max(0, nv.barra - 1); }
      }
      guardar(); refrescarEstado(6);
    }
    function paso() {
      pintarFilas();
      zR.innerHTML = '';
      if (i >= ps.length) return terminar();
      const st = ps[i];
      zP.innerHTML = ec.pistaNivel ? pistaHtml(ec.pistaNivel, infoPaso(), M().texto(st.sub) + ' = ' + F(st.valor)) : '';
      acc.pista = () => pedirPista(ec, zP, infoPaso(), M().texto(st.sub) + ' = ' + F(st.valor));
      if (fase === 'A') {
        marcar(st.path);
        lado.innerHTML = svg().escalera(st.escalon);
        q.textContent = 'Paso ' + (i + 1) + ' de ' + ps.length + ': ¿cuánto da lo marcado?';
        teclear();
      } else {
        lado.innerHTML = svg().escalera(0);
        q.textContent = 'Paso ' + (i + 1) + ' de ' + ps.length + ': toca la operación que va primero.';
        tocables(st);
      }
    }
    function tocables(st) {
      const fila = filas.querySelector('li.actual');
      G().candidatos(st.antes).forEach(c => {
        const el = (c.tipo === 'p' || c.imp) ? fila.querySelector('.sub[data-p="' + c.path + '"]') : fila.querySelector('.op[data-p="' + c.path + '"]');
        if (!el) return;
        el.classList.add('tocable'); el.setAttribute('role', 'button'); el.setAttribute('tabindex', '0');
        el.setAttribute('data-j', 'toca'); el.setAttribute('data-path', c.path);
        el.setAttribute('aria-label', 'Tocar: ' + G().OP_NOM[c.tipo]);
      });
      const primero = fila.querySelector('.tocable'); if (primero) primero.focus({ preventScroll: true });
      acc.toca = (el) => {
        const res = G().evaluarToque(st.antes, el.getAttribute('data-path'), st.path);
        fila.querySelectorAll('[data-j="toca"]').forEach(x => { x.classList.remove('tocable'); ['data-j', 'tabindex', 'role', 'aria-label'].forEach(a => x.removeAttribute(a)); });
        marcar(st.path);
        lado.innerHTML = svg().escalera(st.escalon);
        if (res === 'ok') q.innerHTML = ic('check', 'jg-ok-ico') + ' ¡Esa va primero! Ahora, ¿cuánto da?';
        else if (res === 'equiv') q.innerHTML = 'Esa está en el mismo escalón, pero se va de izquierda a derecha: empieza por la marcada. ¿Cuánto da?';
        else { fallo('E32'); q.innerHTML = '<span class="jg-casi-txt">' + ic('x') + ' Casi… ' + esc(res.msg) + '</span> Empieza por la marcada: ¿cuánto da?'; }
        teclear();
      };
    }
    function teclear() {
      montarTeclado(zR, (v) => {
        const st = ps[i];
        if (v === st.valor) { ui().sonido('ok'); i++; paso(); return; }
        const d = G().diagnosticar(st.sub, v);
        fallo(d.cod || null);
        const ERR = M().ERR, j = J();
        zR.innerHTML = '<div class="jg-fb miss" role="status" aria-live="polite"><div class="jg-fb-cab">' + ic('x') + '<b>Casi…</b></div>' +
          '<p class="jg-tuya"><span>Tu respuesta: ' + ui().num(v) + '</span><span>Este paso da: ' + ui().num(st.valor) + '</span></p>' +
          '<p class="jg-pista-txt">' + esc('En el paso ' + (i + 1) + ': ' + d.msg) + '</p>' +
          '<div class="jg-sol">' + chips([st.regla]) + '<p class="jg-linea">' + ui().fx(M().texto(st.sub) + ' = ' + F(st.valor)) + '</p></div>' +
          '<div class="jg-fb-bot"><button class="btn btn-pri btn-ancho" data-j="sigpaso">Entendido</button>' +
          (d.cod && j.erroresSesion[d.cod] >= 2 && ERR[d.cod] ? '<button class="btn btn-sec btn-ancho" data-j="lamerr">Ver la lámina «' + esc(tituloLam(ERR[d.cod].lamina)) + '»</button>' : '') + '</div></div>';
        acc.lamerr = () => verLamina(ERR[d.cod].lamina);
        acc.sigpaso = () => { i++; paso(); };
        enfocarFb();
      });
    }
    function terminar() {
      const j = J(), exito = fallados === 0 && ec.pistaNivel < 2;
      lado.innerHTML = svg().escalera(0); q.textContent = ''; zP.innerHTML = '';
      nv.items++; if (!ec.rescate) nv.itemsEval++;
      nv.ultimoSub = it.sub; nv.ultimo = it; registrarReciente(it);
      if (exito) {
        j.racha++; if (j.racha > (j.mejorRachaGlobal || 0)) j.mejorRachaGlobal = j.racha; if (j.racha > nv.mejorRacha) nv.mejorRacha = j.racha;
        nv.erroresSeguidos = 0;
        if (nv.barra < 5) nv.barra++;
        if (!ec.rescate) nv.aciertos1++;
        if (nv.subtiposOk.indexOf(it.sub) < 0) nv.subtiposOk.push(it.sub);
        if (ec.gemelo) darLogro('detective');
      } else {
        nv.erroresSeguidos++; nv.fallosSub[it.sub] = (nv.fallosSub[it.sub] || 0) + 1;
        if (!ec.rescate) j.gemeloPendiente = { item: it, faseA: fase === 'A' };
      }
      let sube = null;
      if (!ec.rescate && fase === nv.fase) {
        nv.combinadas.push(fallados <= 1);
        if (nv.combinadas.length > 4) nv.combinadas.shift();
        if (nv.combinadas.filter(Boolean).length >= 3) { nv.fase = fase === 'A' ? 'B' : 'C'; nv.combinadas = []; sube = nv.fase; }
      }
      if (ec.rescate && nv.rescate) { nv.rescate.restantes--; if (nv.rescate.restantes <= 0) nv.rescate = null; }
      j.itemEnCurso = null;
      guardar(); refrescarEstado(6); vida();
      const msgFase = sube ? '<p class="caja-nota"><b>¡Subes a la fase ' + sube + '!</b> ' + (sube === 'B' ? 'Ahora tú tocas la operación que va primero.' : 'Ahora escribes solo el resultado final.') + '</p>' : '';
      if (exito) {
        ui().sonido('ok');
        zR.innerHTML = tarjetaBien('¡Jefe derrotado, ' + esc(LS.nombre()) + '!', esc(elogioDe(6)), msgFase, '<button class="btn btn-pri btn-ancho" data-j="sig">Siguiente' + ic('sig') + '</button>');
        celebrarRacha();
      } else {
        zR.innerHTML = '<div class="jg-fb info" role="status" aria-live="polite"><div class="jg-fb-cab">' + ic('foco') + '<b>Combinada terminada</b></div>' +
          '<p>Te equivocaste en ' + fallados + (fallados === 1 ? ' paso' : ' pasos') + '. Así queda completa:</p>' + solHtml(G().info(it)) + msgFase +
          '<div class="jg-fb-bot"><button class="btn btn-pri btn-ancho" data-j="sig">Seguir con uno parecido</button></div></div>';
      }
      acc.sig = () => despuesNivel(6, null);
      enfocarFb();
    }
    paso();
  }

  // ---------- Fin de nivel ----------
  function finNivel(k, estado) {
    const j = J(), nv = NV(k);
    const pct = nv.itemsEval ? nv.aciertos1 / nv.itemsEval : 0;
    const est = estado === 'superado' ? (pct >= 0.85 ? 3 : pct >= 0.65 ? 2 : 1) : 0;
    nv.estado = (estado === 'superado' || nv.estado === 'superado') ? 'superado' : 'reforzar';
    nv.estrellas = Math.max(nv.estrellas || 0, est);
    nv.rescate = null; nv.cola = null; nv.repitiendo = false;
    if (j.itemEnCurso && j.itemEnCurso.nivel === k) j.itemEnCurso = null;
    j.gemeloPendiente = null;
    if (k === 6 && estado === 'superado' && !nv.rescateEnC) darLogro('escalador');
    if (k < 6) {
      if (k === 3) { if (j.puertaReglaOk && NV(4).estado === 'bloqueado') NV(4).estado = 'abierto'; }
      else if (NV(k + 1).estado === 'bloqueado') NV(k + 1).estado = 'abierto';
      j.nivelActual = k === 3 && !j.puertaReglaOk ? 3 : k + 1;
      j.paradaMax = Math.max(j.paradaMax || 1, j.nivelActual);
    }
    if ([1, 2, 3, 4, 5, 6].every(hecho)) j.testDesbloqueado = true;
    guardar();
    try {
      if (LS.envio) LS.envio.evento('nivel', { nivel: k, estado: nv.estado, estrellas: est, items: nv.items, aciertos1: nv.aciertos1, rescates: nv.rescates, erroresTop: topErrores(nv.errores) });
    } catch (e) { }
    pantallaFin(k, estado, est, pct);
  }
  function pantallaFin(k, estado, est, pct) {
    const nv = NV(k), nom = esc(LS.nombre()), ERR = M().ERR;
    const top = topErrores(nv.errores, 1)[0];
    let h = '<div class="pantalla jg jg-fin">' + topBar('Parada ' + k, NIV[k].nombre) + '<div class="tarjeta jg-fin-t" role="status" aria-live="polite">';
    if (estado === 'superado') {
      h += '<div class="sello">' + svg().sello('Parada superada') + '</div>' +
        '<h2 class="centro">¡Parada ' + k + ' superada, ' + nom + '!</h2><p class="centro">' + svg().estrellas(est, 3) + '</p>' +
        '<p>Hiciste ' + nv.items + ' ejercicios · ' + nv.aciertos1 + ' a la primera (' + Math.round(pct * 100) + ' %) · Mejor racha: ' + nv.mejorRacha + '</p>' +
        '<p><b>Lo que hiciste bien:</b> «' + esc(NIV[k].bien) + '»</p>';
      ui().confeti(); ui().sonido('nivel');
    } else {
      h += '<h2>Seguimos, ' + nom + '</h2><p>Este tema lo reforzamos juntos. Tu avance quedó guardado.</p>' +
        '<p>Vamos a seguir. Este tema lo repasamos al final; tu profe también lo verá.</p>';
    }
    if (top && ERR[top]) h += '<p><b>Para cuidar:</b> ' + esc(ERR[top].txt) + '</p>';
    logrosSesion.forEach(id => { h += '<p class="jg-logro">' + ic('estrella') + ' Logro nuevo: ' + esc(LOGROS[id] || id) + '</p>'; });
    logrosSesion = [];
    h += '<p class="peq tinta-2">Puedes parar aquí: tu avance quedó guardado.</p></div>';
    if (k === 6) {
      h += '<div class="tarjeta jg-ignacio"><p class="jg-kicker">Buen trabajo</p><p>Llegaste al final del camino por tu cuenta. Eso ya es mucho. Ahora demuestra lo que sabes en el test (25 preguntas, sin tiempo). Puedes hacerlo ahora o mañana: se guarda solo.</p></div>' +
        '<div class="jg-acciones"><button class="btn btn-sec btn-ancho" data-j="calent">Calentamiento de 6 ejercicios</button>' +
        '<button class="btn btn-pri btn-ancho" data-j="test">Ir al test</button>' +
        '<button class="btn btn-premio btn-ancho" data-j="relampago">' + ic('rayo') + ' Reto relámpago</button>' +
        '<button class="btn btn-txt" data-j="mapa">Volver al mapa</button></div>';
    } else if (estado === 'superado') {
      h += '<div class="jg-acciones"><button class="btn btn-pri btn-ancho" data-j="seguir">' + (k === 3 && !J().puertaReglaOk ? 'Ir a la puerta «¿Qué regla uso?»' : 'Siguiente parada') + ic('sig') + '</button>' +
        '<button class="btn btn-sec btn-ancho" data-j="repetir">Repetir por más estrellas</button>' +
        '<button class="btn btn-txt" data-j="regla">Ver la regla</button></div>';
    } else {
      h += '<div class="jg-acciones"><button class="btn btn-pri btn-ancho" data-j="seguir">Seguir' + ic('sig') + '</button></div>';
    }
    pintar(h + '</div>', 'fin');
    acc = {
      seguir: () => { if (k === 3 && !J().puertaReglaOk) puerta(); else if (k < 6) antesDeJugar(k + 1); else mapa(); },
      repetir: () => antesDeJugar(k),
      regla: () => hojaRegla(k),
      calent: () => calentamiento('test'),
      test: () => irApp('test'),
      relampago: () => relampagoIntro()
    };
  }

  // ---------- Puerta «¿Qué regla uso?» ----------
  function puerta() {
    const cola = G().PUERTA.map((c, i) => ({ i, expr: c.expr, fallos: 0 }));
    let aciertos = 0;
    function tarjeta() {
      if (!cola.length) return finPuerta();
      const c = cola[0], correcta = G().reglaBtn(c.expr);
      LS.setColor('full');
      pintar('<div class="pantalla jg jg-puerta">' + topBar('Puerta · ¿Qué regla uso?', 'Quedan ' + cola.length + ' · a la primera: ' + aciertos) +
        '<div class="tarjeta"><p class="jg-q">No calcules: ¿qué regla usas aquí?</p>' +
        '<div class="jg-enun">' + M().html(c.expr, { clase: 'fx-grande' }) + '</div>' + botonesRegla() +
        '<p class="peq tinta-2">Para abrir la puerta, acierta 4 de 5 a la primera.</p></div><div class="jg-resp" aria-live="polite"></div></div>', 'puerta');
      acc.elige = (b) => {
        if (b.disabled) return;
        const r = b.getAttribute('data-r'), d = G().diagRegla(c.expr, r);
        root.querySelectorAll('[data-r]').forEach(x => { x.disabled = true; if (x.getAttribute('data-r') === correcta) x.classList.add('ok'); });
        const z = root.querySelector('.jg-resp');
        if (d.cod === 'OK') {
          if (!c.fallos) aciertos++;
          cola.shift();
          ui().sonido('ok');
          z.innerHTML = tarjetaBien('¡Bien, ' + esc(LS.nombre()) + '!', 'Es ' + esc(correcta) + '.', '', '<button class="btn btn-pri btn-ancho" data-j="sig">Siguiente' + ic('sig') + '</button>');
        } else {
          contarError(d.cod, null);
          c.fallos++;
          b.classList.add('miss');
          if (c.fallos < 2) cola.push(cola.shift()); else cola.shift();
          z.innerHTML = '<div class="jg-fb miss" role="status"><div class="jg-fb-cab">' + ic('x') + '<b>Casi…</b></div><p class="jg-pista-txt">' + esc(d.msg) + '</p>' + chips([correcta]) +
            '<p class="peq tinta-2">' + (c.fallos < 2 ? 'Esta tarjeta vuelve al final de la ronda.' : '') + '</p>' +
            '<div class="jg-fb-bot"><button class="btn btn-pri btn-ancho" data-j="sig">Entendido</button></div></div>';
        }
        guardar();
        acc.sig = tarjeta;
        enfocarFb();
      };
    }
    function finPuerta() {
      const j = J();
      if (aciertos >= 4) {
        j.puertaReglaOk = true;
        if (NV(4).estado === 'bloqueado') NV(4).estado = 'abierto';
        j.nivelActual = 4; j.paradaMax = Math.max(j.paradaMax || 1, 4);
        guardar();
        try { if (LS.envio) LS.envio.evento('nivel', { nivel: 'puerta', estado: 'superado', aciertos }); } catch (e) { }
        ui().sonido('sello');
        pintar('<div class="pantalla jg jg-fin">' + topBar('Puerta abierta') + '<div class="tarjeta" role="status"><div class="sello">' + svg().sello('Puerta abierta') + '</div>' +
          '<h2 class="centro">¡Puerta abierta, ' + esc(LS.nombre()) + '!</h2><p>Acertaste ' + aciertos + ' de 5 a la primera. Ya sabes elegir la regla antes de calcular.</p></div>' +
          '<div class="jg-acciones"><button class="btn btn-pri btn-ancho" data-j="p4">Ir a la parada 4' + ic('sig') + '</button><button class="btn btn-txt" data-j="mapa">Volver al mapa</button></div></div>', 'fin');
        acc = { p4: () => antesDeJugar(4) };
      } else {
        pintar('<div class="pantalla jg jg-fin">' + topBar('Puerta') + '<div class="tarjeta" role="status"><h2>Casi, ' + esc(LS.nombre()) + '</h2>' +
          '<p>Acertaste ' + aciertos + ' de 5 a la primera. Para abrir la puerta hacen falta 4.</p><p class="tinta-2">Repasa cómo se elige la regla y vuelve a intentarlo.</p></div>' +
          '<div class="jg-acciones"><button class="btn btn-pri btn-ancho" data-j="otra">Otra ronda</button>' +
          LAM_PUERTA.map(n => '<button class="btn btn-sec btn-ancho" data-j="lam" data-n="' + n + '">Repasar: ' + esc(tituloLam(n)) + '</button>').join('') + '</div></div>', 'fin');
        acc = { otra: () => puerta(), lam: (b) => verLamina(+b.getAttribute('data-n')) };
      }
    }
    tarjeta();
  }

  // ---------- Ítems mezclados (relámpago y calentamientos) ----------
  function itemMezcla(k, r) {
    const subs = k === 6 ? ['T1', 'T2', 'T3', 'T4', 'T6'] : G().SUBS[k];
    const it = G().crear(M().pick(r, subs), { r, fase: 'A', recientes: J().recientes });
    return it || G().crear(G().SUBS[k][0], { r, fase: 'A' });
  }

  // ---------- Reto relámpago (90 s, opcional) ----------
  function relampagoIntro() {
    LS.setColor('answer');
    pintar('<div class="pantalla jg">' + topBar('Reto relámpago', 'Opcional') +
      '<div class="tarjeta jg-antes"><p class="jg-kicker">' + ic('rayo', 'jg-rayo') + ' 90 segundos</p><h2>Reto relámpago</h2>' +
      '<p>Ejercicios mezclados de las 6 paradas, sin pistas. Un error no resta: te muestro la respuesta y sigues.</p>' +
      '<p>Solo compites contigo. Tu récord: <b>' + (J().relampagoRecord || 0) + '</b>.</p><p class="peq tinta-2">No cambia tus estrellas ni tu avance.</p></div>' +
      '<div class="jg-acciones"><button class="btn btn-premio btn-ancho" data-j="empezar">Empezar</button><button class="btn btn-txt" data-j="mapa">Volver al mapa</button></div></div>', 'relampago');
    acc = { empezar: () => relampago() };
  }
  function relampago() {
    const DUR = 90000, t0 = Date.now(), r = M().rng(M().semillaNueva());
    let puntos = 0, vivo = true, tFlash = null;
    LS.setColor('answer');
    pintar('<div class="pantalla jg jg-ej jg-rel">' + topBar('Reto relámpago') +
      '<div class="jg-estado"><span class="jg-reloj" role="timer" aria-live="off">90 s</span><span class="esp"></span><span class="jg-pill">Aciertos: <b class="jg-puntos">0</b></span></div>' +
      '<div class="enunciado jg-enun"></div><div class="jg-flash" aria-live="polite"></div><div class="jg-resp"></div></div>', 'relampago');
    enJuego = true; toque();
    const reloj = root.querySelector('.jg-reloj'), enun = root.querySelector('.jg-enun'), flash = root.querySelector('.jg-flash'), zR = root.querySelector('.jg-resp');
    const iv = setInterval(() => {
      const q = Math.max(0, DUR - (Date.now() - t0));
      reloj.textContent = Math.ceil(q / 1000) + ' s';
      if (q <= 0) fin();
    }, 250);
    limpiezas.push(() => { clearInterval(iv); clearTimeout(tFlash); vivo = false; });
    function nuevo() {
      if (!vivo) return;
      const it = itemMezcla(M().ri(r, 1, 6), r);
      registrarReciente(it);
      enun.innerHTML = M().html(it.expr, { clase: 'fx-grande' });
      flash.innerHTML = '';
      montarTeclado(zR, (v) => {
        if (!vivo) return;
        if (v === it.C) { puntos++; root.querySelector('.jg-puntos').textContent = puntos; ui().sonido('ok'); nuevo(); }
        else {
          flash.innerHTML = '<div class="fb miss">' + ic('x') + '<div class="fb-cuerpo"><b>Casi…</b> Respuesta: ' + ui().num(it.C) + '</div></div>';
          tFlash = setTimeout(nuevo, 1500);
        }
      });
    }
    function fin() {
      if (!vivo) return;
      vivo = false; clearInterval(iv); clearTimeout(tFlash);
      const j = J(), antes = j.relampagoRecord || 0, record = puntos > antes;
      if (record) j.relampagoRecord = puntos;
      guardar();
      if (record && puntos) ui().sonido('nivel');
      pintar('<div class="pantalla jg jg-fin">' + topBar('Reto relámpago') + '<div class="tarjeta" role="status"><h2>¡Tiempo!</h2>' +
        '<p class="jg-grande">' + puntos + ' aciertos</p>' +
        '<p>' + (record && puntos ? '¡Nuevo récord personal, ' + esc(LS.nombre()) + '!' : 'Tu récord: ' + antes + '. Solo compites contigo.') + '</p></div>' +
        '<div class="jg-acciones"><button class="btn btn-premio btn-ancho" data-j="otra">Otra vez</button>' +
        (J().testDesbloqueado ? '<button class="btn btn-pri btn-ancho" data-j="test">Ir al test</button>' : '') +
        '<button class="btn btn-txt" data-j="mapa">Volver al mapa</button></div></div>', 'fin');
      acc = { otra: () => relampago(), test: () => irApp('test') };
    }
    nuevo();
  }

  // ---------- Calentamientos: antes del test (6) y al volver otro día (5) ----------
  function calentamiento(tipo) {
    const r = M().rng(M().semillaNueva());
    const hechos = [1, 2, 3, 4, 5, 6].filter(hecho);
    let cola = tipo === 'test' ? [1, 2, 3, 4, 5, 6].map(k => ({ k })) : Array.from({ length: 5 }, () => ({ k: M().pick(r, hechos.length ? hechos : [1]) }));
    const fallosNiv = {}, recs = [];
    let n = 0;
    function uno() {
      if (!cola.length) return fin();
      const c = cola.shift(); n++;
      const it = c.item || itemMezcla(c.k, r);
      LS.setColor(tipo === 'test' || c.k > 3 ? 'answer' : 'full');
      pintar('<div class="pantalla jg jg-ej">' + topBar(tipo === 'test' ? 'Calentamiento para el test' : 'Calentamiento', 'Ejercicio ' + n + ' · sin puntaje') + herramientas(false) +
        '<div class="jg-aviso"><p class="jg-etq">Parada ' + c.k + ' · ' + NIV[c.k].nombre + (c.item ? ' · uno parecido' : '') + '</p></div>' +
        '<div class="enunciado jg-enun">' + M().html(it.expr, { clase: 'fx-grande' }) + '</div><div class="jg-resp"></div></div>', 'calent');
      enJuego = true; toque();
      const zR = root.querySelector('.jg-resp');
      montarTeclado(zR, (v, info) => {
        const d = G().diagItem(it, v), j = J();
        registrarReciente(it);
        if (d.cod === 'OK') {
          j.racha++; if (j.racha > (j.mejorRachaGlobal || 0)) j.mejorRachaGlobal = j.racha;
          ui().sonido('ok');
          zR.innerHTML = tarjetaBien('¡Bien, ' + esc(LS.nombre()) + '!', esc(elogioDe(it.nivel)) + (info.cero_con_signo ? '<br><span class="peq">El 0 no es positivo ni negativo: se escribe solo 0.</span>' : ''), '',
            '<button class="btn btn-pri btn-ancho" data-j="sig">Siguiente' + ic('sig') + '</button>');
        } else {
          contarError(d.cod, null); j.racha = 0;
          fallosNiv[c.k] = (fallosNiv[c.k] || 0) + 1;
          if (fallosNiv[c.k] === 1) { const gm = G().gemelo(it, { r, fase: 'A' }); if (gm) cola.unshift({ k: c.k, item: gm }); }
          else if (recs.indexOf(c.k) < 0) recs.push(c.k);
          zR.innerHTML = tarjetaCasi(it, v, d, { botones: '<button class="btn btn-pri btn-ancho" data-j="sig">Entendido</button>' });
          acc.revela = revelarPaso;
        }
        guardar();
        acc.sig = uno;
        enfocarFb();
      });
    }
    function fin() {
      const j = J(), nom = esc(LS.nombre());
      if (tipo === 'test') {
        if (recs.length) {
          pintar('<div class="pantalla jg jg-fin">' + topBar('Calentamiento') + '<div class="tarjeta" role="status"><h2>Casi listo, ' + nom + '</h2>' +
            '<p>Te conviene repasar ' + (recs.length === 1 ? 'la parada ' + recs[0] + ' (' + NIV[recs[0]].nombre + ')'
              : 'las paradas ' + recs.slice(0, -1).join(', ') + ' y ' + recs[recs.length - 1]) + ' antes del test.</p></div>' +
            '<div class="jg-acciones"><button class="btn btn-pri btn-ancho" data-j="repasar">Repasar</button><button class="btn btn-sec btn-ancho" data-j="test">Ir igual al test</button></div></div>', 'fin');
          acc = { repasar: () => antesDeJugar(recs[0]), test: () => irApp('test') };
        } else {
          pintar('<div class="pantalla jg jg-fin">' + topBar('Calentamiento') + '<div class="tarjeta" role="status"><h2>¡En forma, ' + nom + '!</h2><p>Estás listo para el test: 25 preguntas, sin tiempo.</p></div>' +
            '<div class="jg-acciones"><button class="btn btn-pri btn-ancho" data-j="test">Ir al test' + ic('sig') + '</button><button class="btn btn-txt" data-j="mapa">Volver al mapa</button></div></div>', 'fin');
          acc = { test: () => irApp('test') };
        }
      } else {
        const k = j.nivelActual;
        pintar('<div class="pantalla jg jg-fin">' + topBar('Calentamiento') + '<div class="tarjeta" role="status"><h2>¡Listo, ' + nom + '!</h2>' +
          '<p>Ibas en la parada ' + k + ', casilla ' + NV(k).barra + '/5. Sigamos.</p></div>' +
          '<div class="jg-acciones"><button class="btn btn-pri btn-ancho" data-j="seguir">Seguir' + ic('sig') + '</button></div></div>', 'fin');
        acc = { seguir: () => (bloqueado(k) || hecho(k)) ? mapa() : antesDeJugar(k) };
      }
    }
    uno();
  }

  // ---------- Resumen para el correo del test ----------
  function resumen() {
    const j = J(), niveles = {};
    for (let k = 1; k <= 6; k++) {
      const nv = NV(k);
      niveles[k] = { estado: nv.estado, estrellas: nv.estrellas || 0, items: nv.items || 0, aciertos1: nv.aciertos1 || 0, rescates: nv.rescates || 0 };
    }
    return {
      niveles,
      erroresTop: topErrores(j.errores, 2),
      pistasUsadas: j.pistasUsadas || 0,
      tiempoActivoMin: Math.round((j.tiempoActivoMs || 0) / 60000),
      paradaMax: j.paradaMax || 1,
      estrellas: estrellasTotales(),
      porReforzar: [1, 2, 3, 4, 5, 6].filter(k => NV(k).estado === 'reforzar'),
      puertaOk: !!j.puertaReglaOk,
      relampagoRecord: j.relampagoRecord || 0,
      logros: (j.logros || []).slice()
    };
  }

  LS.juego = { abrir, atras, resumen, _gen: LS.juegoGen };
})();
