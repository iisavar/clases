/* Seguimiento del estudiante: tiempo ACTIVO por sección, instantánea del avance y envío de 'progreso'.
   Mismo archivo en ley-de-signos/ y quimica-materia/. No pide datos nuevos: solo avance, tiempos y dispositivo. */
(function () {
  'use strict';
  const LS = window.LS = window.LS || {};

  const TICK = 5000;              // cada 5 s se suma tiempo si hubo actividad
  const INACTIVO = 60000;         // sin tocar nada en 60 s → no cuenta
  const GUARDAR_CADA = 30000;     // LS.guardar() como mucho cada 30 s
  const PROGRESO_CADA = 180000;   // 'progreso' como mucho cada 3 min
  const SECCIONES = ['laminas', 'juego', 'test'];
  const PARADAS = 6;

  let ultimaInteraccion = 0, ultimoGuardado = Date.now(), ultimoProgreso = 0;
  let sinEnviar = false;          // hubo tiempo activo desde el último 'progreso'

  const S = () => LS.st || {};    // LS.st se reemplaza al «Borrar todo»: leerlo siempre de nuevo
  function registrado() { const u = S().usuario || {}; return !!(u.nombre && u.correo); }
  function fijarRegistro() {
    const s = S();
    if (registrado() && !s.registroFecha) { s.registroFecha = new Date().toISOString(); return true; }
    return false;
  }
  function tiempos() {
    const s = S();
    if (!s.tiempos || typeof s.tiempos !== 'object' || Array.isArray(s.tiempos)) s.tiempos = {};
    SECCIONES.forEach(k => { const v = Number(s.tiempos[k]); s.tiempos[k] = isFinite(v) && v > 0 ? v : 0; });
    return s.tiempos;
  }
  function seccion() { try { return LS.app && LS.app.actual ? (LS.app.actual() || '') : ''; } catch (e) { return ''; } }
  function guardar() { try { if (LS.guardar) LS.guardar(); } catch (e) { } ultimoGuardado = Date.now(); }

  // ---------- Dispositivo y navegador (solo para el panel del tutor) ----------
  function dispositivo() {
    const ua = navigator.userAgent || '';
    if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua)) ||
      (/Macintosh/.test(ua) && (navigator.maxTouchPoints || 0) > 1)) return 'tablet';
    if (/Mobi|iPhone|iPod|Android|Windows Phone/i.test(ua)) return 'celular';
    return 'computadora';
  }
  function navegador() {
    const ua = navigator.userAgent || '';
    let n = 'Otro';
    if (/Instagram/i.test(ua)) n = 'Instagram';
    else if (/FBAN|FBAV/i.test(ua)) n = 'Facebook';
    else if (/WhatsApp/i.test(ua)) n = 'WhatsApp';
    else if (/Edg\//.test(ua)) n = 'Edge';
    else if (/OPR\/|Opera/.test(ua)) n = 'Opera';
    else if (/SamsungBrowser/.test(ua)) n = 'Samsung';
    else if (/FxiOS|Firefox\//.test(ua)) n = 'Firefox';
    else if (/CriOS|Chrome\//.test(ua)) n = 'Chrome';
    else if (/Safari\//.test(ua)) n = 'Safari';
    const so = /Android/i.test(ua) ? 'Android' : /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && (navigator.maxTouchPoints || 0) > 1) ? 'iOS'
      : /Windows/.test(ua) ? 'Windows' : /Mac OS X|Macintosh/.test(ua) ? 'Mac' : /CrOS/.test(ua) ? 'ChromeOS' : /Linux/.test(ua) ? 'Linux' : '';
    return so ? n + ' · ' + so : n;
  }

  // ---------- Título legible de la lámina actual ----------
  function textoPlano(html) { return String(html == null ? '' : html).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(); }
  function tituloLamina(l) {
    if (!l) return '';
    try { if (LS.laminas && LS.laminas.tituloDe && l.num != null) return textoPlano(LS.laminas.tituloDe(l.num)); } catch (e) { }
    try {
      const t = typeof l.titulo === 'function' ? l.titulo({ nombre: LS.nombre ? LS.nombre() : '', st: S(), gancho: (S().laminas || {}).gancho }) : l.titulo;
      return textoPlano(t);
    } catch (e) { return ''; }
  }

  // ---------- Instantánea ----------
  function snapshot() {
    const s = S();
    fijarRegistro();
    const t = tiempos();
    const lam = s.laminas || {}, L = LS.LAMINAS || [], total = L.length;
    const idx = total ? Math.max(0, Math.min(Number(lam.actual) || 0, total - 1)) : 0;
    const l = L[idx] || null;
    const laminasPct = lam.completadas ? 100 : total ? Math.max(0, Math.min(100, Math.round((Number(lam.maxAlcanzada) || 0) / total * 100))) : 0;

    const jg = (s.juego && typeof s.juego === 'object') ? s.juego : {};
    const niveles = jg.niveles || {};
    let superadas = 0;
    for (let k = 1; k <= PARADAS; k++) { const e = niveles[k] && niveles[k].estado; if (e === 'superado' || e === 'reforzar') superadas++; }

    const ts = (s.test && typeof s.test === 'object') ? s.test : {};
    let testEstado = 'no';
    if (ts.oficialTerminado) testEstado = 'terminado';
    else if (ts.modo !== 'PRACTICA' && ((Array.isArray(ts.respuestas) && ts.respuestas.some(r => r != null && r !== '')) || ts.fase === 'preg' || ts.fase === 'revision')) testEstado = 'en curso';
    const of = ts.oficialTerminado && ts.oficial ? ts.oficial : null;
    const numONull = (v) => (v == null || v === '' || !isFinite(Number(v))) ? null : Number(v);

    const min = (ms) => Math.round((Number(ms) || 0) / 60000);
    return {
      seccion: seccion(),
      laminaNum: l ? (l.num != null ? l.num : idx + 1) : null,
      laminaTitulo: tituloLamina(l),
      laminaCap: l && l.cap != null ? l.cap : null,
      laminasPct,
      capitulosCerrados: Array.isArray(lam.capsCerrados) ? lam.capsCerrados.length : 0,
      juegoParadaMax: Number(jg.paradaMax) || 0,
      juegoSuperadas: superadas,
      juegoTotal: PARADAS,
      testEstado,
      nota: of ? numONull(of.nota) : null,
      nota10: of ? numONull(of.nota10) : null,
      minLaminas: min(t.laminas), minJuego: min(t.juego), minTest: min(t.test),
      minTotal: min(t.laminas + t.juego + t.test),
      registro: s.registroFecha || null,
      dispositivo: dispositivo(),
      navegador: navegador()
    };
  }

  // ---------- Envío de 'progreso' ----------
  function enviarProgreso() {
    if (!registrado() || !LS.envio) return;
    ultimoProgreso = Date.now(); sinEnviar = false;
    try { LS.envio.evento('progreso', {}); } catch (e) { }   // ls-envio.js le agrega seg: snapshot()
  }
  function nuevoId() { return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10); }
  // Al ocultar o cerrar la página: sendBeacon (sobrevive al cierre). Sin sendBeacon o sin URL → cola normal.
  function alOcultar() {
    guardar();
    if (!registrado() || !sinEnviar) return;
    const url = LS.envio && LS.envio.url ? LS.envio.url() : '';
    if (url && navigator.sendBeacon) {
      const u = S().usuario;
      const cuerpo = { id: nuevoId(), tipo: 'evento', fecha: new Date().toISOString(), nombre: u.nombre, correo: u.correo, evento: 'progreso', seg: snapshot() };
      let ok = false;
      try { ok = navigator.sendBeacon(url, new Blob([JSON.stringify(cuerpo)], { type: 'text/plain;charset=utf-8' })); } catch (e) { ok = false; }
      if (ok) { ultimoProgreso = Date.now(); sinEnviar = false; return; }
    }
    enviarProgreso();
  }

  // ---------- Reloj de tiempo activo ----------
  function tick() {
    const sec = seccion();
    if (SECCIONES.indexOf(sec) < 0) return;
    if (document.visibilityState && document.visibilityState !== 'visible') return;
    if (!ultimaInteraccion || Date.now() - ultimaInteraccion > INACTIVO) return;
    if (!registrado()) return;
    fijarRegistro();
    tiempos()[sec] += TICK;
    sinEnviar = true;
    const ahora = Date.now();
    if (ahora - ultimoGuardado >= GUARDAR_CADA) guardar();
    if (ahora - ultimoProgreso >= PROGRESO_CADA) enviarProgreso();
  }
  function interaccion() { ultimaInteraccion = Date.now(); }

  ['pointerdown', 'keydown', 'touchstart', 'scroll', 'wheel'].forEach(ev =>
    document.addEventListener(ev, interaccion, { capture: true, passive: true }));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') alOcultar(); });
  window.addEventListener('pagehide', alOcultar);
  setInterval(tick, TICK);
  if (fijarRegistro()) guardar();


  // ---------- «En vivo» y avance en la nube (script central de clases) ----------
  if (window.clases && window.clases.activo()) {
    const quimica = /quimica/.test(window.location.pathname);
    function dondeVivo() {
      try {
        const s = snapshot();
        if (s.seccion === 'laminas') return 'Láminas · lámina ' + (s.laminaNum || '?') + (s.laminaTitulo ? ': ' + s.laminaTitulo : '');
        if (s.seccion === 'juego') return 'Juego · parada ' + Math.max(1, s.juegoParadaMax || 1) + ' de ' + s.juegoTotal;
        if (s.seccion === 'test') return s.testEstado === 'terminado' ? 'Terminó el examen' : 'Examen · en curso';
        return 'En el menú de la clase';
      } catch (e) { return ''; }
    }
    window.clases.iniciar({ claves: [quimica ? 'qm_v1' : 'lds_v1'], app: quimica ? 'Química desde cero' : 'Ley de signos', donde: dondeVivo });
  }

  LS.seguimiento = { snapshot, enviarProgreso, tiempos };
})();
