/* Piezas de interfaz compartidas: fichas de número, expresiones escritas a mano (fx),
   chips de regla, íconos, teclado propio, hojas inferiores, confeti, sonido, voz. */
(function () {
  'use strict';
  const LS = window.LS = window.LS || {};
  const M = LS.M;
  const MENOS = '−';

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const icon = (id, cls) => '<svg class="' + (cls || '') + '" aria-hidden="true" focusable="false"><use href="#i-' + id + '"/></svg>';

  // Ficha de un número suelto: num(-5) → −5 naranja
  function num(v, opt) {
    opt = opt || {};
    return M.numHtml(v, !!opt.plus, !!opt.par);
  }

  // Expresión escrita como texto: fx('−5 − (−9)'), fx('(−3)^2'), fx('−3²'), fx('2(−4)')
  // Un − es SIGNO del número si va al inicio o justo después de ( [ = y pegado a un dígito.
  // Excepción: −3² (el menos queda afuera, en tinta).
  const SUPS = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  function fx(src, opt) {
    opt = opt || {};
    const s = String(src).replace(/-/g, MENOS).replace(/\*/g, '·');
    let out = '', i = 0, prev = null; // prev: tipo del último token significativo
    const unarioOk = () => prev === null || prev === '(' || prev === '=';
    while (i < s.length) {
      const c = s[i];
      if (c === ' ') { out += ' '; i++; continue; }
      if ((c === MENOS || c === '+') && /\d/.test(s[i + 1] || '') && unarioOk()) {
        let j = i + 1; while (j < s.length && /\d/.test(s[j])) j++;
        const tras = s[j] || '';
        const esPot = tras === '^' || (tras !== '' && SUPS.indexOf(tras) >= 0);
        if (c === MENOS && esPot && prev !== '(') {
          out += '<span class="op">' + MENOS + '</span>'; i++; prev = 'op'; continue;
        }
        const v = parseInt(s.slice(i + 1, j), 10) * (c === MENOS ? -1 : 1);
        out += M.numHtml(v, c === '+', false); i = j; prev = 'num'; continue;
      }
      if (/\d/.test(c)) {
        let j = i; while (j < s.length && /\d/.test(s[j])) j++;
        out += M.numHtml(parseInt(s.slice(i, j), 10), false, false, prev === 'resta'); i = j; prev = 'num'; continue;
      }
      if (c === '^') {
        let j = i + 1; while (j < s.length && /\d/.test(s[j])) j++;
        out += '<sup>' + s.slice(i + 1, j) + '</sup>'; i = j; prev = 'num'; continue;
      }
      if (SUPS.indexOf(c) >= 0) { out += '<sup>' + SUPS.indexOf(c) + '</sup>'; i++; prev = 'num'; continue; }
      if (c === '(' || c === '[' || c === '{') { out += '<span class="par">' + c + '</span>'; i++; prev = '('; continue; }
      if (c === ')' || c === ']' || c === '}') { out += '<span class="par">' + c + '</span>'; i++; prev = 'num'; continue; }
      if (c === '=') { out += '<span class="op">=</span>'; i++; prev = '='; continue; }
      if ('+−·×÷/'.indexOf(c) >= 0) { out += '<span class="op">' + c + '</span>'; i++; prev = c === MENOS ? 'resta' : 'op'; continue; }
      out += esc(c); i++; prev = 'txt';
    }
    const cls = 'fx' + (opt.clase ? ' ' + opt.clase : '');
    const aria = s.replace(/−/g, ' menos ').replace(/\^2|²/g, ' al cuadrado').replace(/\^3|³/g, ' al cubo').replace(/·|×/g, ' por ').replace(/÷/g, ' entre ');
    return '<span class="' + cls + '" aria-label="' + esc(aria) + '">' + out + '</span>';
  }

  // Chips de regla (vocabulario único)
  const REGLAS = {
    'LECTURA': 'lectura', 'PLATA': 'plata', 'SE JUNTAN': 'juntan', 'SE CANCELAN': 'cancelan',
    'SIGNOS PEGADOS': 'pegados', 'CUENTA LOS NEGATIVOS': 'cuenta', 'POTENCIA': 'potencia', 'ESCALERA': 'escalera'
  };
  function chip(nombre) {
    return '<span class="chip">' + icon(REGLAS[nombre] || 'foco') + esc(nombre) + '</span>';
  }

  // ---------- Formato fijo de las láminas ----------
  // regla('Si los dos signos son iguales, …', 'SE JUNTAN')
  function regla(html, nombre) {
    return '<div class="regla-caja"><span class="regla-et">' + (nombre ? chip(nombre) : '<b>Regla</b>') + '</span><p>' + html + '</p></div>';
  }
  function ojo(html) { return '<div class="caja-ojo"><b>Ojo:</b> ' + html + '</div>'; }
  // Los 3 pasos que se usan en TODOS los cálculos
  const PASOS = ['Mira los signos', 'Elige la regla', 'Calcula'];
  function metodo(activo) {
    return '<ol class="metodo" aria-label="Los 3 pasos">' + PASOS.map((p, i) => '<li class="' + (activo === i + 1 ? 'on' : '') + '"><span>' + (i + 1) + '</span>' + p + '</li>').join('') + '</ol>';
  }
  // ejemplo({ expr:'−5 − 9', pasos:[{t:'Mira los signos', html:'…', regla:'SE JUNTAN'}, …], resultado:'−5 − 9 = −14', titulo:'Ejemplo' })
  // Si un paso no trae t, se usa el nombre del método según su posición.
  function ejemplo(o) {
    const pasos = (o.pasos || []).map((p, i) =>
      '<li><span class="ej-n">' + (i + 1) + '</span><div class="ej-c"><b>' + (p.t || PASOS[i] || '') + '</b>' +
      (p.html ? '<div>' + p.html + '</div>' : '') + (p.regla ? '<div>' + chip(p.regla) + '</div>' : '') + '</div></li>').join('');
    return '<div class="ejemplo"><div class="ej-cab"><span class="ej-et">' + (o.titulo || 'Ejemplo resuelto') + '</span>' +
      (o.expr ? fx(o.expr, { clase: 'fx-medio' }) : '') + '</div>' +
      (pasos ? '<ol class="ej-pasos">' + pasos + '</ol>' : '') +
      (o.resultado ? '<div class="ej-res">' + fx(o.resultado, { clase: 'fx-medio' }) + '</div>' : '') + '</div>';
  }

  function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }

  // ---------- Hoja inferior ----------
  // hoja({tipo:'ok'|'miss'|'info', titulo, html, botones:[{t, fn, cls:'btn-pri'|'btn-sec'|'btn-txt', cerrar:true}], velo:true, alCerrar})
  let hojaActual = null;
  function hoja(o) {
    cerrarHoja(true);
    const capa = document.getElementById('capa-hoja');
    const cont = document.createElement('div');
    const tipo = o.tipo || 'info';
    const ico = tipo === 'ok' ? icon('check') : tipo === 'miss' ? icon('x') : (o.icono ? icon(o.icono) : '');
    cont.innerHTML =
      (o.velo === false ? '' : '<div class="velo"></div>') +
      '<section class="hoja ' + tipo + '" role="dialog" aria-modal="true" aria-live="polite">' +
      '<div class="hoja-cab">' + ico + '<h3>' + (o.titulo || '') + '</h3>' +
      (o.cerrable === false ? '' : '<button class="btn-ico hoja-x" aria-label="Cerrar">' + icon('cerrar') + '</button>') + '</div>' +
      '<div class="hoja-cuerpo">' + (o.html || '') + '</div>' +
      '<div class="hoja-botones"></div></section>';
    const zona = cont.querySelector('.hoja-botones');
    (o.botones || []).forEach(bt => {
      const b = document.createElement('button');
      b.className = 'btn ' + (bt.cls || 'btn-pri') + ' btn-ancho';
      b.innerHTML = bt.t;
      b.addEventListener('click', () => { if (bt.cerrar !== false) cerrarHoja(); if (bt.fn) bt.fn(); });
      zona.appendChild(b);
    });
    const x = cont.querySelector('.hoja-x');
    if (x) x.addEventListener('click', () => cerrarHoja());
    const velo = cont.querySelector('.velo');
    if (velo && o.cerrable !== false) velo.addEventListener('click', () => cerrarHoja());
    capa.appendChild(cont);
    hojaActual = { cont, alCerrar: o.alCerrar };
    if (o.alAbrir) o.alAbrir(cont.querySelector('.hoja'));
    const primero = zona.querySelector('button') || x;
    if (primero) setTimeout(() => primero.focus({ preventScroll: true }), 30);
    return cont.querySelector('.hoja');
  }
  function cerrarHoja(silencioso) {
    if (!hojaActual) return;
    const h = hojaActual; hojaActual = null;
    h.cont.remove();
    if (!silencioso && h.alCerrar) h.alCerrar();
  }
  function hayHoja() { return !!hojaActual; }

  // ---------- Teclado propio ----------
  // const t = teclado(contenedor, { onOk(valor:number), max:4, ayuda:true })
  // t.limpiar(), t.bloquear(bool), t.valor(), t.destruir()
  let tecladoActivo = null;
  function teclado(cont, o) {
    o = o || {};
    const max = o.max || 4;
    let neg = false, dig = '', bloqueado = false, ultimo = 0;
    const raiz = document.createElement('div');
    raiz.className = 'teclado';
    raiz.setAttribute('data-noswipe', '');
    raiz.innerHTML =
      '<div class="visor" role="textbox" aria-live="polite" aria-label="Tu respuesta"></div>' +
      '<div class="visor-ayuda"></div>' +
      '<div class="teclas">' +
      [1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => '<button class="tecla" data-k="' + d + '">' + d + '</button>').join('') +
      '<button class="tecla tecla-signo" data-k="±" aria-label="Cambiar signo"><span class="s-pos">+</span><span class="s-bar">/</span><span class="s-neg">' + MENOS + '</span></button>' +
      '<button class="tecla" data-k="0">0</button>' +
      '<button class="tecla" data-k="del" aria-label="Borrar">⌫</button>' +
      '</div>' +
      '<button class="btn btn-pri btn-comprobar">Comprobar</button>';
    cont.appendChild(raiz);
    const visor = raiz.querySelector('.visor'), ayuda = raiz.querySelector('.visor-ayuda'), btn = raiz.querySelector('.btn-comprobar');

    function pintar() {
      if (!dig) {
        visor.innerHTML = '<span class="signo-caja">' + (neg ? MENOS : '+') + '</span><span class="vacio">?</span>';
        ayuda.textContent = neg ? 'Signo negativo puesto: ahora escribe el número' : 'Sin signo = positivo. Para negativo toca ±';
      } else {
        const v = parseInt(dig, 10) * (neg ? -1 : 1);
        visor.innerHTML = M.numHtml(neg && v === 0 ? 0 : v, false, false).replace('class="num zero"', 'class="num zero"');
        if (neg && v === 0) visor.innerHTML = '<span class="num zero">' + MENOS + '0</span>';
        ayuda.textContent = '';
      }
      btn.disabled = !dig || bloqueado;
      btn.classList.toggle('desact', !dig);
    }
    function tecla(k) {
      if (bloqueado) return;
      if (k === '±') neg = !neg;
      else if (k === 'del') { if (dig) dig = dig.slice(0, -1); else neg = false; }
      else if (/^\d$/.test(k)) { if (dig.length < max) dig = (dig === '0' ? '' : dig) + k; }
      ultimo = Date.now();
      pintar();
    }
    function comprobar() {
      if (bloqueado || !dig) return;
      if (Date.now() - ultimo < 300) return;
      const v = parseInt(dig, 10) * (neg ? -1 : 1);
      vibrar(30);
      if (o.onOk) o.onOk(v === 0 ? 0 : v, { cero_con_signo: neg && v === 0 });
    }
    raiz.addEventListener('click', e => {
      const t = e.target.closest('[data-k]');
      if (t) { tecla(t.getAttribute('data-k')); return; }
      if (e.target.closest('.btn-comprobar')) comprobar();
    });
    const api = {
      limpiar() { neg = false; dig = ''; pintar(); },
      bloquear(x) { bloqueado = !!x; raiz.classList.toggle('bloqueado', bloqueado); pintar(); },
      valor() { return dig ? parseInt(dig, 10) * (neg ? -1 : 1) : null; },
      destruir() { raiz.remove(); if (tecladoActivo === api) tecladoActivo = null; },
      raiz, _tecla: tecla, _comprobar: comprobar
    };
    tecladoActivo = api;
    raiz.addEventListener('pointerdown', () => { tecladoActivo = api; });
    pintar();
    return api;
  }
  document.addEventListener('keydown', e => {
    const t = tecladoActivo;
    if (!t || !document.body.contains(t.raiz) || hayHoja() || e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (/^\d$/.test(e.key)) { t._tecla(e.key); e.preventDefault(); }
    else if (e.key === '-' || e.key === '−') { t._tecla('±'); e.preventDefault(); }
    else if (e.key === '+') { if (t.valor() !== null && t.valor() < 0) t._tecla('±'); e.preventDefault(); }
    else if (e.key === 'Backspace') { t._tecla('del'); e.preventDefault(); }
    else if (e.key === 'Enter') { t._comprobar(); e.preventDefault(); }
  });

  // ---------- Efectos ----------
  function vibrar(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { } }

  let actx = null;
  function sonido(tipo) {
    if (!LS.st.ajustes.sonido) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const notas = tipo === 'ok' ? [660, 880] : tipo === 'nivel' ? [523, 659, 784, 1046] : tipo === 'sello' ? [440, 660] : [330];
      notas.forEach((f, i) => {
        const os = actx.createOscillator(), ga = actx.createGain();
        os.type = 'triangle'; os.frequency.value = f;
        const t0 = actx.currentTime + i * 0.09;
        ga.gain.setValueAtTime(0.0001, t0); ga.gain.exponentialRampToValueAtTime(0.15, t0 + 0.02); ga.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
        os.connect(ga); ga.connect(actx.destination); os.start(t0); os.stop(t0 + 0.2);
      });
    } catch (e) { }
  }

  function confeti() {
    if (LS.menosMovimiento()) return;
    const c = document.createElement('canvas');
    c.className = 'confeti'; c.width = innerWidth; c.height = innerHeight;
    document.body.appendChild(c);
    const x = c.getContext('2d');
    const css = getComputedStyle(document.documentElement);
    const cols = [css.getPropertyValue('--prize'), css.getPropertyValue('--ok'), css.getPropertyValue('--primary')].map(s => s.trim());
    const ps = Array.from({ length: 60 }, () => ({ x: Math.random() * c.width, y: -20 - Math.random() * c.height * .3, vx: (Math.random() - .5) * 3, vy: 2 + Math.random() * 4, r: Math.random() * 6, w: 6 + Math.random() * 6, c: cols[Math.floor(Math.random() * 3)] }));
    const t0 = performance.now();
    (function paso(t) {
      x.clearRect(0, 0, c.width, c.height);
      ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .08; p.r += .1; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.w / 2, -3, p.w, 6); x.restore(); });
      if (t - t0 < 1200) requestAnimationFrame(paso); else c.remove();
    })(t0);
  }

  // ---------- Voz ----------
  let vozEs = null;
  function buscarVoz() {
    try { vozEs = (speechSynthesis.getVoices() || []).find(v => /^es/i.test(v.lang)) || null; } catch (e) { vozEs = null; }
    return vozEs;
  }
  if ('speechSynthesis' in window) { buscarVoz(); try { speechSynthesis.onvoiceschanged = buscarVoz; } catch (e) { } }
  function hayVoz() { return !!(vozEs || buscarVoz()); }
  function hablar(texto) {
    if (!hayVoz()) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(texto.replace(/−/g, ' menos ').replace(/·/g, ' por ').replace(/÷/g, ' entre ').replace(/²/g, ' al cuadrado').replace(/³/g, ' al cubo'));
      u.voice = vozEs; u.lang = vozEs.lang; u.rate = 0.95;
      speechSynthesis.speak(u);
    } catch (e) { }
  }
  function callar() { try { speechSynthesis.cancel(); } catch (e) { } }

  // Texto plano de un nodo HTML (para leer en voz alta)
  function textoDe(nodo) { return (nodo.innerText || nodo.textContent || '').replace(/\s+/g, ' ').trim(); }

  // Frases que elogian el proceso (rotan)
  const ELOGIOS = ['Usaste bien la regla.', 'Leíste bien los signos.', 'Paso a paso, así se hace.', 'Tu proceso fue el correcto.', 'Elegiste la regla correcta.', 'Buen ojo con el signo.', 'Eso es pensar antes de calcular.'];
  let iElogio = 0;
  function elogio() { return ELOGIOS[(iElogio++) % ELOGIOS.length]; }

  LS.ui = { esc, icon, num, fx, chip, regla, ojo, metodo, ejemplo, PASOS, el, hoja, cerrarHoja, hayHoja, teclado, vibrar, sonido, confeti, hayVoz, hablar, callar, textoDe, elogio, REGLAS };
})();
