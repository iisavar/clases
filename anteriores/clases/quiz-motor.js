/* ============================================================
   quiz-motor.js — quizzes de clase con estilo de examen.
   · No revela si una respuesta está bien o mal mientras se responde
     (así no pueden pasarse las respuestas). La corrección llega en PDF al correo.
   · Se puede ir y volver entre preguntas y cambiar respuestas antes de entregar.
   · Tipos: mc (elegir), vf (verdadero/falso), unir, ordenar, completar, clasificar.

   Cada quiz define ANTES de cargar este archivo:
     window.QUIZ_CFG  = { id, nombre, materia, min }
     window.QUIZ_DATA = [ preguntas ]
   Formato (en mc la PRIMERA opción es la correcta; el motor baraja todo):
     {tipo:'mc', t, b?, o:[correcta, ...], w}
     {tipo:'vf', t, a:true|false, w}
     {tipo:'unir', t, pares:[[izq, der], ...], w}
     {tipo:'ordenar', t, items:[en orden correcto], w}
     {tipo:'completar', t:'texto con ___ huecos', r:[respuestas], extra:[distractores], w}
     {tipo:'clasificar', t, cats:['A','B'], items:[[texto, índiceCat], ...], w}

   Resultados: el link lleva ?api=ID_DEL_APPS_SCRIPT (o #api=). Sin eso, el quiz
   funciona igual pero no envía nada. El ID se recuerda en el dispositivo.
   Solo se acepta un ID de Apps Script (o una URL de script.google.com): ningún
   link puede mandar los datos a otro sitio. Los envíos pasan por
   ../js/cola-envios.js (cola en el dispositivo, confirmación y reintento).
   ============================================================ */
(function () {
  'use strict';
  var CFG = window.QUIZ_CFG, DATA = window.QUIZ_DATA, N = DATA.length;
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function plano(h) { var d = document.createElement('div'); d.innerHTML = h; return (d.textContent || '').replace(/\s+/g, ' ').trim(); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function rango(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; }
  function distinta(n) { var p = shuffle(rango(n)), k = 0; while (n > 1 && k++ < 20 && p.every(function (v, i) { return v === i; })) p = shuffle(rango(n)); return p; }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function coma(x) { return String(Math.round(x * 10) / 10).replace('.', ','); }
  var LETRAS = 'ABCDEFGH';

  // ---------- Apps Script ----------
  // Solo un ID de Apps Script (letras, números, - y _) o una URL https://script.google.com/macros/s/ID/exec.
  function idApi(p) {
    p = String(p || '').trim();
    var m = /^https:\/\/script\.google\.com\/macros\/s\/([\w-]{20,})\/exec$/.exec(p);
    if (m) return m[1];
    return /^[\w-]{20,}$/.test(p) ? p : '';
  }
  var API = (function () {
    var p = '', guardado = '';
    try { p = idApi(new URLSearchParams(location.search).get('api') || new URLSearchParams(location.hash.slice(1)).get('api')); } catch (e) {}
    try { guardado = idApi(localStorage.getItem('quizApi')); } catch (e) {}
    try { if (p) localStorage.setItem('quizApi', p); else if (!guardado) localStorage.removeItem('quizApi'); } catch (e) {}
    p = p || guardado;
    return p ? 'https://script.google.com/macros/s/' + p + '/exec' : '';
  })();
  var COLA = API && window.ColaEnvios ? window.ColaEnvios.crear({ clave: 'cola_quiz_motor', url: API }) : null;
  // Devuelve una promesa: 'confirmado' | 'sin-confirmar' | 'pendiente' | 'sin-configurar'
  function enviar(o, keep, opciones) {
    if (!API) return Promise.resolve('sin-configurar');
    o.ts = new Date().toISOString();
    if (COLA) return COLA.enviar(o, opciones);
    // Página vieja en caché sin cola-envios.js: envío simple como antes.
    try { fetch(API, { method: 'POST', mode: 'no-cors', keepalive: !!keep, headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(o) }); } catch (e) {}
    return Promise.resolve('sin-confirmar');
  }

  var TIPO = { mc: 'Opción múltiple', vf: 'Verdadero o falso', unir: 'Unir', ordenar: 'Ordenar', completar: 'Completar', clasificar: 'Clasificar' };
  var AYUDA = { unir: 'Toca un concepto y luego su pareja. Toca de nuevo para deshacer.', ordenar: 'Toca en orden, del primero al último. Toca uno elegido para quitarlo.',
    completar: 'Toca las palabras para llenar los espacios. Toca un espacio para vaciarlo.', clasificar: 'Elige la categoría de cada uno.' };

  // ---------- preguntas (barajadas) ----------
  var Q = shuffle(DATA).map(function (it) {
    var p = Object.assign({}, it);
    if (it.tipo === 'mc') p.orden = shuffle(rango(it.o.length));
    if (it.tipo === 'unir') { p.izq = shuffle(rango(it.pares.length)); p.der = distinta(it.pares.length); }
    if (it.tipo === 'ordenar') p.pool = distinta(it.items.length);
    if (it.tipo === 'completar') p.banco = shuffle(it.r.concat(it.extra || []));
    if (it.tipo === 'clasificar') p.orden = shuffle(rango(it.items.length));
    return p;
  });
  var A = Q.map(function (it) {   // respuesta de cada pregunta
    if (it.tipo === 'unir') return {};
    if (it.tipo === 'ordenar') return [];
    if (it.tipo === 'completar') return it.r.map(function () { return null; });
    if (it.tipo === 'clasificar') return {};
    return null;
  });
  function completa(k) {
    var it = Q[k], a = A[k];
    switch (it.tipo) {
      case 'mc': case 'vf': return a !== null;
      case 'unir': return Object.keys(a).length === it.pares.length;
      case 'ordenar': return a.length === it.items.length;
      case 'completar': return a.indexOf(null) < 0;
      case 'clasificar': return Object.keys(a).length === it.items.length;
    }
  }
  function nResp() { var c = 0; for (var k = 0; k < N; k++) if (completa(k)) c++; return c; }

  // ---------- pantalla ----------
  document.body.innerHTML =
    '<div class="wrap" id="wrap">' +
    '<section id="intro" class="intro"><div class="eyebrow">' + esc(CFG.materia || 'Quiz') + '</div>' +
    '<h1>' + esc(CFG.nombre) + '</h1><div class="meta">' + N + ' preguntas · ' + CFG.min + ' minutos</div>' +
    '<div class="panel"><ul class="reglas">' +
    '<li>Puedes avanzar, volver y cambiar tus respuestas antes de entregar.</li>' +
    '<li>Al terminar el tiempo, el quiz se entrega solo.</li>' +
    '<li>No salgas de esta página.</li>' +
    (API ? '<li>Al entregar, tu nota y la corrección completa en PDF se envían a tu correo.</li>' : '') +
    '</ul>' +
    '<label class="campo" for="nom">Nombre y apellido</label><input class="input" id="nom" autocomplete="name">' +
        '<div class="err" id="err"></div><button class="btn btn-1 full" id="go">Comenzar</button></div></section>' +
    '<section id="exam" class="hidden"><div class="top"><div class="top-row"><span>Pregunta <b id="qn"></b> de ' + N + '</span>' +
    '<button class="ver" id="ver">Ver todas</button><span class="reloj" id="reloj"></span></div><div class="prog"><i id="prog"></i></div></div>' +
    '<div class="card" id="card"></div></section>' +
    '<section id="mapa" class="hidden"><div class="top"><div class="top-row"><span><b>Revisar respuestas</b></span><span class="reloj" id="reloj2"></span></div></div>' +
    '<div class="card"><div class="leyenda" id="ley"></div><div class="mapa" id="mq"></div><button class="btn btn-1 full" id="entregar">Entregar quiz</button>' +
    '<button class="btn btn-2 full" id="volver" style="margin-top:10px">Seguir respondiendo</button></div></section>' +
    '<section id="final" class="final hidden"></section></div>' +
    '<nav class="nav hidden" id="nav"><div class="nav-in"><button class="btn btn-2" id="ant">Anterior</button><button class="btn btn-1" id="sig">Siguiente</button></div></nav>' +
    '<div class="aviso" id="aviso"></div>';

  var ALUM = { nombre: '', correo: '' }, ID = '', cur = 0, timeLeft = CFG.min * 60, tick = null, t0 = 0, enJuego = false, salidas = 0;
  var base = function () { return { id: ID, quiz: CFG.id, quizNombre: CFG.nombre, nombre: ALUM.nombre, correo: ALUM.correo, total: N }; };
  function avisar(t) { var a = $('aviso'); a.textContent = t; a.classList.add('on'); clearTimeout(avisar.t); avisar.t = setTimeout(function () { a.classList.remove('on'); }, 3200); }
  function progreso() { var o = base(); o.evento = 'progreso'; o.respondidas = nResp(); o.salidas = salidas; enviar(o, true, { reemplaza: 'progreso|' + ID }); }

  // ---------- dibujar una pregunta ----------
  function ir(k) {
    cur = k;
    $('mapa').classList.add('hidden'); $('exam').classList.remove('hidden'); $('nav').classList.remove('hidden');
    pintar(); window.scrollTo(0, 0);
  }
  function pintar() {
    var it = Q[cur], card = $('card');
    $('qn').textContent = cur + 1;
    $('prog').style.width = (nResp() / N * 100) + '%';
    var enun = it.tipo === 'completar' ? (it.enunciado || 'Completa la frase') : it.t;
    card.innerHTML = '<div class="tipo">' + TIPO[it.tipo] + '</div>' +
      '<div class="enun">' + (it.b ? '<span class="dato">' + it.b + '</span>' : '') + enun + '</div>' +
      (AYUDA[it.tipo] ? '<div class="ayuda">' + AYUDA[it.tipo] + '</div>' : '');
    var area = el('div', 'area'); card.appendChild(area);
    ({ mc: rMc, vf: rVf, unir: rUnir, ordenar: rOrdenar, completar: rCompletar, clasificar: rClasificar })[it.tipo](it, A[cur], area);
    $('ant').disabled = cur === 0;
    $('sig').textContent = cur === N - 1 ? 'Revisar y entregar' : 'Siguiente';
  }
  function cambio() { $('prog').style.width = (nResp() / N * 100) + '%'; }

  function rMc(it, a, area) {
    var box = el('div', 'ops');
    it.orden.forEach(function (k, j) {
      var b = el('button', 'op' + (A[cur] === k ? ' on' : ''), '<span class="l">' + LETRAS[j] + '</span><span>' + it.o[k] + '</span>');
      b.onclick = function () { A[cur] = k; pintar(); };
      box.appendChild(b);
    });
    area.appendChild(box);
  }
  function rVf(it, a, area) {
    var box = el('div', 'ops vf');
    [true, false].forEach(function (v) {
      var b = el('button', 'op' + (A[cur] === v ? ' on' : ''), v ? 'Verdadero' : 'Falso');
      b.onclick = function () { A[cur] = v; pintar(); };
      box.appendChild(b);
    });
    area.appendChild(box);
  }
  var selIzq = null;
  function rUnir(it, a, area) {
    var w = el('div', 'unir'), L = el('div', 'col'), R = el('div', 'col');
    L.appendChild(el('div', 'cab', 'CONCEPTO')); R.appendChild(el('div', 'cab', 'PAREJA'));
    var num = {}; it.izq.forEach(function (k, pos) { num[k] = pos + 1; });
    it.izq.forEach(function (k) {
      var b = el('button', 'it' + (a[k] != null ? ' par' : '') + (selIzq === k ? ' sel' : ''), it.pares[k][0] + (a[k] != null ? '<span class="n">' + num[k] + '</span>' : ''));
      b.onclick = function () { if (a[k] != null) { delete a[k]; selIzq = null; } else selIzq = (selIzq === k ? null : k); pintar(); };
      L.appendChild(b);
    });
    it.der.forEach(function (r) {
      var dueno = null; Object.keys(a).forEach(function (l) { if (a[l] === r) dueno = +l; });
      var b = el('button', 'it' + (dueno != null ? ' par' : ''), it.pares[r][1] + (dueno != null ? '<span class="n">' + num[dueno] + '</span>' : ''));
      b.onclick = function () {
        if (selIzq == null) { if (dueno != null) delete a[dueno]; pintar(); return; }
        if (dueno != null) delete a[dueno];
        a[selIzq] = r; selIzq = null; pintar();
      };
      R.appendChild(b);
    });
    w.appendChild(L); w.appendChild(R); area.appendChild(w);
  }
  function rOrdenar(it, a, area) {
    var seq = el('div', 'seq'), pool = el('div', 'pool');
    a.forEach(function (k, pos) {
      var b = el('button', 'it', '<span class="pos">' + (pos + 1) + '</span><span>' + it.items[k] + '</span>');
      b.onclick = function () { a.splice(pos, 1); pintar(); };
      seq.appendChild(b);
    });
    it.pool.forEach(function (k) {
      if (a.indexOf(k) >= 0) return;
      var b = el('button', 'it', it.items[k]);
      b.onclick = function () { a.push(k); pintar(); };
      pool.appendChild(b);
    });
    area.appendChild(seq); area.appendChild(pool);
  }
  function rCompletar(it, a, area) {
    var frase = el('div', 'frase'), partes = it.t.split('___');
    partes.forEach(function (p, k) {
      frase.appendChild(document.createTextNode(plano(p)));
      if (k < it.r.length) {
        var h = el('button', 'hueco', a[k] == null ? '&nbsp;' : esc(it.banco[a[k]]));
        h.onclick = function () { a[k] = null; pintar(); };
        frase.appendChild(h);
      }
    });
    var banco = el('div', 'banco');
    it.banco.forEach(function (w, j) {
      var c = el('button', 'ficha' + (a.indexOf(j) >= 0 ? ' usada' : ''), esc(w));
      c.onclick = function () { var h = a.indexOf(null); if (h >= 0) { a[h] = j; pintar(); } };
      banco.appendChild(c);
    });
    area.appendChild(frase); area.appendChild(banco);
  }
  function rClasificar(it, a, area) {
    var box = el('div', 'clas');
    it.orden.forEach(function (k) {
      var f = el('div', 'fila'); f.appendChild(el('div', 't', it.items[k][0]));
      var cs = el('div', 'cats');
      it.cats.forEach(function (c, ci) {
        var b = el('button', 'cat' + (a[k] === ci ? ' on' : ''), esc(c));
        b.onclick = function () { a[k] = ci; pintar(); };
        cs.appendChild(b);
      });
      f.appendChild(cs); box.appendChild(f);
    });
    area.appendChild(box);
  }

  // ---------- navegación ----------
  $('ant').onclick = function () { if (cur > 0) { selIzq = null; ir(cur - 1); progreso(); } };
  $('sig').onclick = function () { selIzq = null; if (cur < N - 1) { ir(cur + 1); progreso(); } else verMapa(); };
  $('ver').onclick = verMapa;
  $('volver').onclick = function () { ir(cur); };
  function verMapa() {
    $('exam').classList.add('hidden'); $('nav').classList.add('hidden'); $('mapa').classList.remove('hidden');
    var faltan = N - nResp();
    $('ley').textContent = faltan ? 'Te faltan ' + faltan + ' pregunta' + (faltan > 1 ? 's' : '') + '. Toca un número para ir a esa pregunta.' : 'Respondiste todas. Puedes revisar alguna o entregar.';
    var m = $('mq'); m.innerHTML = '';
    for (var k = 0; k < N; k++) (function (k) {
      var b = el('button', 'mq' + (completa(k) ? ' ok' : '') + (k === cur ? ' cur' : ''), k + 1);
      b.onclick = function () { ir(k); };
      m.appendChild(b);
    })(k);
    window.scrollTo(0, 0);
  }
  $('entregar').onclick = function () {
    var faltan = N - nResp();
    if (faltan && !confirm('Te faltan ' + faltan + ' preguntas sin responder. ¿Entregar de todas formas?')) return;
    fin(false);
  };

  // ---------- tiempo ----------
  function reloj() {
    var m = Math.floor(timeLeft / 60), s = timeLeft % 60, t = m + ':' + String(s).padStart(2, '0');
    [$('reloj'), $('reloj2')].forEach(function (r) { r.textContent = t; r.classList.toggle('poco', timeLeft <= 120); });
  }

  // ---------- salidas de la página ----------
  document.addEventListener('visibilitychange', function () {
    if (!enJuego) return;
    if (document.hidden) { salidas++; avisar.pend = true; progreso(); }
    else if (avisar.pend) avisar.pend = false, avisar('Saliste del quiz (' + salidas + (salidas === 1 ? ' vez' : ' veces') + '). Queda registrado.');
  });

  // ---------- inicio ----------
  try { var g = JSON.parse(localStorage.getItem('alumno') || 'null'); if (g && g.correo) { $('nom').value = g.nombre || ''; $('cor').value = g.correo || ''; } } catch (e) {}
  $('go').onclick = function () {
    var nombre = $('nom').value.trim(), correo = '';
    if (nombre.length < 3 || nombre.indexOf(' ') < 0) { $('err').textContent = 'Escribe tu nombre y apellido.'; return; }
    ALUM = { nombre: nombre, correo: correo };
    try { localStorage.setItem('alumno', JSON.stringify(ALUM)); } catch (e) {}
    ID = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    var o = base(); o.evento = 'registro'; o.dispositivo = /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'Celular' : 'Computadora';
    enviar(o, true);
    $('intro').classList.add('hidden');
    enJuego = true; t0 = Date.now(); reloj();
    tick = setInterval(function () { timeLeft--; reloj(); if (timeLeft <= 0) fin(true); }, 1000);
    ir(0);
  };
  // También avisa si la entrega todavía no salió del dispositivo.
  window.addEventListener('beforeunload', function (e) { if (enJuego || (COLA && COLA.pendientes())) { e.preventDefault(); e.returnValue = ''; } });

  // ---------- calificar ----------
  function puntos(k) {
    var it = Q[k], a = A[k], ok = 0;
    switch (it.tipo) {
      case 'mc': return a === 0 ? 1 : 0;
      case 'vf': return a === it.a ? 1 : 0;
      case 'unir': it.pares.forEach(function (p, i) { if (a[i] === i) ok++; }); return ok / it.pares.length;
      case 'ordenar': it.items.forEach(function (x, i) { if (a[i] === i) ok++; }); return ok / it.items.length;
      case 'completar': it.r.forEach(function (r, i) { if (a[i] != null && it.banco[a[i]] === r) ok++; }); return ok / it.r.length;
      case 'clasificar': it.items.forEach(function (x, i) { if (a[i] === x[1]) ok++; }); return ok / it.items.length;
    }
    return 0;
  }
  function llenar(t, vals) { var k = 0; return plano(t.replace(/___/g, function () { var v = vals[k++]; return v == null ? '___' : '[' + v + ']'; })); }
  function txtTu(k) {
    var it = Q[k], a = A[k];
    if (!completa(k) && !(it.tipo === 'ordenar' && a.length) && !(it.tipo === 'unir' && Object.keys(a).length) &&
      !(it.tipo === 'clasificar' && Object.keys(a).length) && !(it.tipo === 'completar' && a.some(function (x) { return x != null; }))) return '(sin responder)';
    switch (it.tipo) {
      case 'mc': return plano(it.o[a]);
      case 'vf': return a ? 'Verdadero' : 'Falso';
      case 'unir': return it.pares.map(function (p, i) { return plano(p[0]) + ' → ' + (a[i] != null ? plano(it.pares[a[i]][1]) : '—'); }).join(' · ');
      case 'ordenar': return a.map(function (x, i) { return (i + 1) + '. ' + plano(it.items[x]); }).join(' · ');
      case 'completar': return llenar(it.t, a.map(function (j) { return j == null ? null : it.banco[j]; }));
      case 'clasificar': return it.items.map(function (x, i) { return plano(x[0]) + ': ' + (a[i] != null ? it.cats[a[i]] : '—'); }).join(' · ');
    }
  }
  function txtOk(it) {
    switch (it.tipo) {
      case 'mc': return plano(it.o[0]);
      case 'vf': return it.a ? 'Verdadero' : 'Falso';
      case 'unir': return it.pares.map(function (p) { return plano(p[0]) + ' → ' + plano(p[1]); }).join(' · ');
      case 'ordenar': return it.items.map(function (x, i) { return (i + 1) + '. ' + plano(x); }).join(' · ');
      case 'completar': return llenar(it.t, it.r);
      case 'clasificar': return it.items.map(function (x) { return plano(x[0]) + ': ' + it.cats[x[1]]; }).join(' · ');
    }
  }
  function fin(porTiempo) {
    if (!enJuego) return; enJuego = false;
    clearInterval(tick);
    var total = 0, correctas = 0, R = [];
    for (var k = 0; k < N; k++) {
      var it = Q[k], p = Math.round(puntos(k) * 100) / 100;
      total += p; if (p >= 1) correctas++;
      R.push({ n: k + 1, tipo: it.tipo, pregunta: (it.b ? plano(it.b) + ' · ' : '') + (it.tipo === 'completar' ? plano(it.t) : plano(it.t)),
        tu: txtTu(k), correcta: txtOk(it), puntos: p, explicacion: plano(it.w || '') });
    }
    var nota = Math.round(total / N * 100) / 10, seg = Math.round((Date.now() - t0) / 1000);
    var o = base(); o.evento = 'fin'; o.respondidas = nResp(); o.puntos = Math.round(total * 100) / 100; o.nota = nota; o.correctas = correctas;
    o.salidas = salidas; o.segundos = seg; o.porTiempo = !!porTiempo; o.respuestas = R; o.fecha = new Date().toISOString();
    var envio = enviar(o, false, { alFinal: function (estado) { mensajeEnvio(estado); } });
    ['exam', 'mapa', 'nav'].forEach(function (x) { $(x).classList.add('hidden'); });
    var f = $('final'); f.classList.remove('hidden');
    f.innerHTML = '<div class="eyebrow">' + (porTiempo ? 'Se acabó el tiempo' : 'Quiz entregado') + '</div>' +
      '<h1 style="font-size:1.6rem;margin-top:8px">' + esc(CFG.nombre) + '</h1>' +
      '<div class="nota">' + coma(nota) + '<small> / 10</small></div>' +
      '<p>' + correctas + ' de ' + N + ' preguntas correctas</p>' +
      (API ? '<p id="estado-envio">Enviando tu entrega…</p>' : '');
    window.scrollTo(0, 0);
    if (API) envio.then(mensajeEnvio);
  }
  // Lo que se le dice al estudiante depende de lo que respondió el Apps Script.
  function mensajeEnvio(estado) {
    var p = $('estado-envio'); if (!p) return;
    var correo = '<b style="color:var(--ink)">' + esc(ALUM.correo) + '</b>';
    if (estado === 'confirmado') p.innerHTML = 'Tu entrega quedó registrada. La corrección completa llegará en PDF a<br>' + correo + ' (revisa también Spam).';
    else if (estado === 'sin-confirmar') p.innerHTML = 'Tu entrega se envió, pero no pudimos confirmar que llegó. Si en 15 minutos no ves el correo en ' + correo + ', avísale a tu profesor.';
    else if (estado === 'descartado') p.innerHTML = 'No se pudo registrar tu entrega. Avísale a tu profesor y muéstrale esta pantalla.';
    else p.innerHTML = 'Todavía no se pudo enviar tu entrega (sin internet o servidor ocupado). Quedó guardada en este dispositivo y se reintenta sola: no cierres esta página hasta que cambie este mensaje, o vuelve a abrir el quiz cuando tengas internet.';
  }
})();
