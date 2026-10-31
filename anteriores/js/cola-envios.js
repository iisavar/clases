/* ============================================================
   cola-envios.js — envíos a Google Apps Script que no se pierden.
   (Auditoría 2026-10-09, hallazgos B02 y S07.)

   · Cada envío se guarda primero en localStorage (cola) con un envioId único.
   · Se envía con CORS para LEER la respuesta del script:
       {status:'ok'}            → confirmado, sale de la cola
       {status:'busy'|'error'}  → queda en la cola y se reintenta
   · Si el navegador no deja leer la respuesta (CORS), se manda una vez en modo
     'no-cors': si llega al servidor se da por "enviado sin confirmar".
   · Reintenta solo: con espera creciente, al volver internet y al abrir de nuevo
     cualquier página que use la misma cola.
   · Solo acepta URLs de script.google.com/macros/s/…/exec (no manda datos a otros sitios).
   · El orden se respeta: un envío que falla bloquea a los siguientes hasta que salga
     (así un "terminado" nunca queda pisado por un "en progreso" viejo).

   Uso:
     var cola = ColaEnvios.crear({ clave: 'cola_x', url: 'https://script.google.com/macros/s/ID/exec' });
     cola.enviar(datos, { reemplaza: 'progreso-quiz1', alFinal: function (estado) {} })
       → Promise con el primer resultado: 'confirmado' | 'sin-confirmar' | 'pendiente' | 'sin-configurar'
     alFinal(estado) se llama cuando el envío sale de la cola ('confirmado' | 'sin-confirmar' | 'descartado').
   ============================================================ */
(function () {
  'use strict';
  var URL_VALIDA = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]{20,}\/exec$/;
  var MAX_ERRORES = 8;          // respuestas {status:'error'} seguidas antes de apartar el envío
  var ESPERA_MIN = 5000, ESPERA_MAX = 5 * 60000;

  function urlValida(u) { return typeof u === 'string' && URL_VALIDA.test(u); }
  function nuevoId() { return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10); }
  function leer(clave) {
    try { var v = JSON.parse(localStorage.getItem(clave) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; }
  }
  function escribir(clave, lista) {
    try { localStorage.setItem(clave, JSON.stringify(lista.slice(-300))); } catch (e) { /* sin espacio: queda en memoria */ }
  }

  function crear(op) {
    op = op || {};
    var clave = op.clave || 'cola_envios';
    var urlBase = urlValida(op.url) ? op.url : '';
    var memoria = null;                 // por si localStorage no funciona
    var primeros = {};                  // envioId → resolve del primer resultado
    var finales = {};                   // envioId → callback alFinal
    var enCurso = false, timer = null, espera = ESPERA_MIN;

    function cola() { var l = leer(clave); if (!l.length && memoria && memoria.length) l = memoria; return l; }
    function guardar(l) { memoria = l.slice(); escribir(clave, l); }
    function resolverPrimero(id, estado) { if (primeros[id]) { var r = primeros[id]; delete primeros[id]; r(estado); } }
    function terminar(id, estado) {
      resolverPrimero(id, estado);
      if (finales[id]) { var f = finales[id]; delete finales[id]; try { f(estado); } catch (e) { } }
    }
    function quitar(id) { guardar(cola().filter(function (x) { return x.envioId !== id; })); }
    function programar() {
      clearTimeout(timer);
      timer = setTimeout(vaciar, espera);
      espera = Math.min(espera * 2, ESPERA_MAX);
    }

    function enviar(datos, opciones) {
      opciones = opciones || {};
      if (!urlBase) return Promise.resolve('sin-configurar');
      var item = { envioId: nuevoId(), url: urlBase, datos: datos, reemplaza: opciones.reemplaza || '', errores: 0 };
      var l = cola();
      // 'progreso' solo importa el último: se quitan los anteriores del mismo tipo que sigan esperando
      if (item.reemplaza) l = l.filter(function (x, i) { return x.reemplaza !== item.reemplaza || (enCurso && i === 0); });
      l.push(item);
      guardar(l);
      if (typeof opciones.alFinal === 'function') finales[item.envioId] = opciones.alFinal;
      var p = new Promise(function (res) { primeros[item.envioId] = res; });
      vaciar();
      return p;
    }

    function intentar(item) {
      var cuerpo = JSON.stringify(Object.assign({}, item.datos, { envioId: item.envioId }));
      var base = { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: cuerpo, keepalive: cuerpo.length < 60000 };
      return fetch(item.url, Object.assign({ redirect: 'follow' }, base)).then(function (r) {
        if (!r.ok) return 'reintentar';
        return r.text().then(function (t) {
          var j = null; try { j = JSON.parse(t); } catch (e) { }
          if (!j || !j.status) return 'sin-confirmar';
          if (j.status === 'ok') return 'confirmado';
          if (j.status === 'error') return 'error';
          return 'reintentar';                       // 'busy' u otro: el servidor no lo guardó
        });
      }, function () {
        // CORS o red. Si en modo 'no-cors' sale, el servidor lo recibió aunque no podamos leer la respuesta.
        return fetch(item.url, Object.assign({ mode: 'no-cors' }, base)).then(function () { return 'sin-confirmar'; }, function () { return 'reintentar'; });
      });
    }

    function vaciar() {
      if (enCurso) return;
      var l = cola();
      if (!l.length) return;
      if (typeof navigator !== 'undefined' && navigator.onLine === false) { l.forEach(function (x) { resolverPrimero(x.envioId, 'pendiente'); }); return; }
      enCurso = true;
      (function siguiente() {
        var l2 = cola();
        if (!l2.length) { enCurso = false; espera = ESPERA_MIN; return; }
        var item = l2[0];
        if (!urlValida(item.url)) { quitar(item.envioId); terminar(item.envioId, 'descartado'); siguiente(); return; }
        intentar(item).then(function (res) {
          if (res === 'confirmado' || res === 'sin-confirmar') {
            quitar(item.envioId); terminar(item.envioId, res); espera = ESPERA_MIN; siguiente(); return;
          }
          if (res === 'error') {
            var l3 = cola(), k = -1;
            l3.forEach(function (x, i) { if (x.envioId === item.envioId) k = i; });
            if (k >= 0) {
              l3[k].errores = (l3[k].errores || 0) + 1;
              if (l3[k].errores >= MAX_ERRORES) {
                // El servidor lo rechaza siempre: se aparta (no se borra) para no trabar a los demás.
                var apartados = leer(clave + '_apartados'); apartados.push(l3[k]); escribir(clave + '_apartados', apartados);
                l3.splice(k, 1); guardar(l3); terminar(item.envioId, 'descartado'); siguiente(); return;
              }
              guardar(l3);
            }
          }
          // No salió: todo lo que espera queda pendiente y se reintenta más tarde.
          cola().forEach(function (x) { resolverPrimero(x.envioId, 'pendiente'); });
          enCurso = false;
          programar();
        });
      })();
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('online', function () { espera = ESPERA_MIN; vaciar(); });
      setTimeout(vaciar, 1500);          // lo que quedó de otra visita
    }

    return {
      activo: function () { return !!urlBase; },
      enviar: enviar,
      vaciar: vaciar,
      pendientes: function () { return cola().length; }
    };
  }

  window.ColaEnvios = { crear: crear, urlValida: urlValida };
})();
