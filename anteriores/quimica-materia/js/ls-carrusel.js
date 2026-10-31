/* Carrusel guiado de láminas. Los datos viven en LS.LAMINAS (ls-laminas-data-a.js y -b.js). */
(function () {
  'use strict';
  const LS = window.LS = window.LS || {};
  const ui = () => LS.ui;

  LS.CAPITULOS = {
    0: { titulo: 'Inicio' },
    1: { titulo: 'La materia y sus cambios', min: 10 },
    2: { titulo: 'El átomo', min: 10 },
    3: { titulo: 'Los elementos y la tabla periódica', min: 10 },
    4: { titulo: 'Cierre' }
  };

  const NCAP = 3; // capítulos numerados; el cierre es NCAP + 1
  let root = null, idx = 0, dir = 0, hechoActual = false;

  function L() { return LS.LAMINAS || []; }
  function ctx() {
    return { nombre: LS.nombre(), gancho: LS.st.laminas.gancho, st: LS.st, M: LS.M, ui: LS.ui, svg: LS.svg, fx: LS.ui.fx, num: LS.ui.num };
  }
  const val = (x, c) => typeof x === 'function' ? x(c) : (x || '');
  function resp(id) { const r = LS.st.laminas.respuestas; return r[id] || (r[id] = {}); }
  function necesitaResponder(lam) { return (lam.bloques || []).some(b => b.tipo !== 'revelar'); }
  function indicePorNum(num) { return L().findIndex(l => l.num === num); }

  // ---------- Abrir ----------
  function abrir(r, o) {
    root = r; o = o || {};
    LS.setColor('full');
    idx = o.irA != null ? o.irA : (LS.st.laminas.actual || 0);
    if (o.num != null) { const i = indicePorNum(o.num); if (i >= 0) idx = i; }
    idx = Math.max(0, Math.min(idx, L().length - 1));
    dir = 0;
    pintar();
  }

  function progreso(lam) {
    const cap = lam.cap;
    const delCap = L().filter(l => l.cap === cap);
    const pos = delCap.indexOf(lam) + 1;
    let txt;
    if (cap >= 1 && cap <= NCAP) txt = 'Cap. ' + cap + ' de ' + NCAP + ' · lámina ' + pos + ' de ' + delCap.length;
    else txt = (cap === 0 ? 'Inicio' : 'Cierre') + ' · lámina ' + pos + ' de ' + delCap.length;
    let segs = '<div class="segs" aria-hidden="true">';
    for (let c = 1; c <= NCAP; c++) {
      let w = 0;
      if (cap > c) w = 100; else if (cap === c) w = Math.round(pos / delCap.length * 100);
      segs += '<span class="seg"><i style="width:' + w + '%"></i></span>';
    }
    return segs + '</div><div class="fila"><span class="progreso-txt">' + txt + '</span>' +
      (ui().hayVoz() ? '<button class="btn-ico" data-acc="escuchar" aria-label="Escuchar la lámina">' + ui().icon('altavoz') + '</button>' : '') +
      '<button class="btn-ico" data-acc="glosario" aria-label="Glosario de palabras">' + ui().icon('ayuda') + '</button>' +
      '<button class="btn-ico" data-acc="ajustes" aria-label="Ajustes">' + ui().icon('ajustes') + '</button>' +
      '<button class="btn-ico" data-acc="mapa" aria-label="Ir al mapa">' + ui().icon('mapa') + '</button></div>';
  }

  function pintar() {
    ui().callar(); ui().cerrarHoja(true);
    const lam = L()[idx];
    if (!lam) { root.innerHTML = '<div class="pantalla"><p>No se encontraron las láminas.</p></div>'; return; }
    // Abrir una lámina más adelante por enlace directo (repaso) no cuenta como avance
    if (idx <= LS.st.laminas.maxAlcanzada + 1) {
      LS.st.laminas.actual = idx;
      if (idx > LS.st.laminas.maxAlcanzada) LS.st.laminas.maxAlcanzada = idx;
      LS.guardar();
    }
    const c = ctx();
    const r = resp(lam.id);
    hechoActual = !necesitaResponder(lam) || !!r.hecho || idx < LS.st.laminas.maxAlcanzada;
    const total = L().length;
    const htmlLam = val(lam.html, c);
    const chipArriba = lam.chip && htmlLam.indexOf('regla-caja') < 0;
    root.innerHTML =
      '<div class="lam" role="group" aria-roledescription="lámina" aria-label="Lámina ' + (idx + 1) + ' de ' + total + '">' +
      '<header class="lam-top">' + progreso(lam) + '</header>' +
      '<div class="lam-body ' + (dir > 0 ? 'lam-anim-der' : dir < 0 ? 'lam-anim-izq' : '') + '">' +
      (lam.entrada ? '<div class="lam-entrada">' + val(lam.entrada, c) + '</div>' : '') +
      (chipArriba ? '<div class="lam-chip">' + ui().chip(lam.chip) + '</div>' : '') +
      '<h2 class="lam-titulo" tabindex="-1">' + val(lam.titulo, c) + '</h2>' +
      '<div class="lam-contenido">' + htmlLam + '</div>' +
      (lam.desliza ? '<p class="desliza" aria-hidden="true">Desliza →</p>' : '') +
      '<div class="lam-inter"></div>' +
      (lam.mas ? '<details class="lam-mas"><summary>Explícame más despacio</summary><div class="mas-cuerpo">' + val(lam.mas, c) + '</div></details>' : '') +
      '</div>' +
      '<footer class="lam-nav">' +
      '<button class="pista-abajo" data-acc="bajar" hidden>↓ Responde aquí abajo</button>' +
      '<button class="btn btn-sec" data-acc="atras" aria-label="Lámina anterior"' + (idx === 0 ? ' disabled' : '') + '>' + ui().icon('atras') + '</button>' +
      '<button class="btn btn-pri" data-acc="sig">' + (idx === total - 1 ? 'Terminar' : 'Siguiente') + ui().icon('sig') + '</button>' +
      '<p class="motivo" aria-live="polite"></p>' +
      '</footer></div>';

    const inter = root.querySelector('.lam-inter');
    correrBloques(inter, lam.bloques || [], lam, () => { marcarHecho(lam); });
    actualizarNav();
    enlazar();
    const t = root.querySelector('.lam-titulo');
    if (t && dir !== 0) t.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  function marcarHecho(lam) {
    resp(lam.id).hecho = true;
    LS.guardar();
    hechoActual = true;
    actualizarNav();
  }

  function actualizarNav() {
    const sig = root.querySelector('[data-acc="sig"]'), mot = root.querySelector('.motivo');
    if (!sig) return;
    sig.classList.toggle('desact', !hechoActual);
    sig.setAttribute('aria-disabled', hechoActual ? 'false' : 'true');
    mot.textContent = hechoActual ? '' : 'Responde la pregunta para seguir';
    revisarPista();
  }

  // Si la pregunta quedó debajo de la pantalla, avisa con «↓ Responde aquí abajo»
  function preguntaPendiente() {
    const bs = root && root.querySelectorAll('.lam-inter > .bloque');
    return bs && bs.length ? bs[bs.length - 1] : null;
  }
  function revisarPista() {
    const p = root && root.querySelector('.pista-abajo');
    if (!p) return;
    const q = preguntaPendiente();
    if (hechoActual || !q) { p.hidden = true; return; }
    const nav = root.querySelector('.lam-nav');
    const limite = (nav ? nav.getBoundingClientRect().top : innerHeight) - 60;
    p.hidden = q.getBoundingClientRect().top < limite;
  }
  window.addEventListener('scroll', () => { if (root && root.querySelector('.lam')) revisarPista(); }, { passive: true });
  window.addEventListener('resize', () => { if (root && root.querySelector('.lam')) revisarPista(); });

  // ---------- Navegación ----------
  function ir(nuevo, d) {
    if (nuevo < 0 || nuevo >= L().length) return;
    const antes = L()[idx], despues = L()[nuevo];
    if (d > 0 && antes && despues && despues.cap !== antes.cap && antes.cap >= 1 && antes.cap <= NCAP) {
      const cerr = LS.st.laminas.capsCerrados;
      if (cerr.indexOf(antes.cap) < 0) {
        cerr.push(antes.cap); LS.guardar();
        if (LS.envio) LS.envio.evento('capitulo', { capitulo: antes.cap });
      }
    }
    idx = nuevo; dir = d; pintar();
  }
  function siguiente() {
    if (!hechoActual) {
      const mot = root.querySelector('.motivo');
      if (mot) { mot.textContent = 'Responde la pregunta para seguir'; mot.classList.remove('sacudir'); void mot.offsetWidth; mot.classList.add('sacudir'); }
      const q = root.querySelector('.lam-inter .bloque:last-child');
      if (q) q.scrollIntoView({ behavior: LS.menosMovimiento() ? 'auto' : 'smooth', block: 'center' });
      return;
    }
    if (idx === L().length - 1) { terminar(); return; }
    ir(idx + 1, 1);
  }
  function anterior() { if (idx > 0) ir(idx - 1, -1); }
  function terminar() {
    LS.st.laminas.completadas = true; LS.guardar();
    if (LS.app) LS.app.ir('juego');
  }
  function atras() { if (idx > 0) { anterior(); return true; } return false; }

  function enlazar() {
    root.querySelector('.lam').addEventListener('click', e => {
      const a = e.target.closest('[data-acc]'); if (!a) return;
      const acc = a.getAttribute('data-acc');
      if (acc === 'bajar') { const q = preguntaPendiente(); if (q) q.scrollIntoView({ behavior: LS.menosMovimiento() ? 'auto' : 'smooth', block: 'center' }); }
      else if (acc === 'sig') siguiente();
      else if (acc === 'atras') anterior();
      else if (acc === 'glosario') LS.app.glosario();
      else if (acc === 'ajustes') LS.app.ajustes();
      else if (acc === 'mapa') LS.app.ir('hub');
      else if (acc === 'escuchar') {
        const b = root.querySelector('.lam-body');
        const partes = [b.querySelector('.lam-titulo'), b.querySelector('.lam-contenido')];
        const det = b.querySelector('.lam-mas'); if (det && det.open) partes.push(det.querySelector('.mas-cuerpo'));
        ui().hablar(partes.filter(Boolean).map(ui().textoDe).join('. '));
      }
    });
    const cuerpo = root.querySelector('.lam-body');
    let x0 = null, y0 = null;
    cuerpo.addEventListener('touchstart', e => {
      if (e.target.closest('[data-noswipe], .lam-mas[open], input, button')) { x0 = null; return; }
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
    }, { passive: true });
    cuerpo.addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      x0 = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > 1.5 * Math.abs(dy)) { if (dx < 0) siguiente(); else anterior(); }
    }, { passive: true });
  }
  document.addEventListener('keydown', e => {
    if (!root || !document.body.contains(root) || !root.querySelector('.lam') || ui().hayHoja()) return;
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key === 'ArrowRight') { siguiente(); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { anterior(); e.preventDefault(); }
  });

  // ---------- Bloques interactivos ----------
  function correrBloques(cont, bloques, lam, alTerminar, recoger) {
    let i = 0;
    const resultados = [];
    (function siguienteBloque() {
      if (i >= bloques.length) { alTerminar(resultados); return; }
      const b = bloques[i++];
      const el = document.createElement('div');
      el.className = 'bloque';
      cont.appendChild(el);
      setTimeout(revisarPista, 60);
      pintarBloque(el, b, lam, (ok1) => { resultados.push(ok1 !== false); if (recoger) recoger(ok1); siguienteBloque(); });
    })();
  }

  function fbHtml(tipo, html) {
    const ico = tipo === 'ok' ? ui().icon('check') : tipo === 'miss' ? ui().icon('x') : ui().icon('foco');
    return '<div class="fb ' + tipo + '" role="status">' + ico + '<div class="fb-cuerpo">' + html + '</div></div>';
  }
  function abrirMas(lam) {
    if (!lam || !lam.masAlFallar) return;
    const d = root && root.querySelector('.lam-mas');
    if (d && !d.open) d.open = true;
  }

  function pintarBloque(el, b, lam, fin) {
    const c = ctx();
    switch (b.tipo) {
      case 'revelar': el.innerHTML = val(b.html, c); fin(true); return;
      case 'boton': {
        el.innerHTML = '<button class="btn ' + (b.clase || 'btn-pri') + ' btn-ancho">' + val(b.texto, c) + '</button>';
        el.querySelector('button').addEventListener('click', () => {
          if (b.alTocar) b.alTocar(c);
          fin(true);
          if (b.avanzar !== false) setTimeout(siguiente, 0);
        });
        return;
      }
      case 'opciones': return bOpciones(el, b, lam, fin, c);
      case 'teclado': return bTeclado(el, b, lam, fin, c);
      case 'pasos': return bPasos(el, b, lam, fin, c);
      case 'clasificar': return bClasificar(el, b, lam, fin, c);
      case 'chequeo': return bChequeo(el, b, lam, fin, c);
      case 'custom': {
        let listo = false;
        b.render(el, {
          ctx: c,
          completar: (ok1) => { if (!listo) { listo = true; fin(ok1 !== false); } },
          fallo: () => abrirMas(lam),
          abrirMas: () => { const d = root.querySelector('.lam-mas'); if (d) d.open = true; },
          fb: fbHtml
        });
        return;
      }
    }
    fin(true);
  }

  function bOpciones(el, b, lam, fin, c) {
    el.classList.add('bloque-preg');
    el.innerHTML = (b.enunciado ? '<div class="enunciado">' + val(b.enunciado, c) + '</div>' : '') +
      '<div class="opciones' + (b.columnas === 2 ? ' dos-col' : '') + '" data-noswipe></div><div class="zona-fb" aria-live="polite"></div>';
    const cont = el.querySelector('.opciones'), zfb = el.querySelector('.zona-fb');
    let intentos = 0, listo = false;
    const botones = b.opciones.map((op, i) => {
      const bt = document.createElement('button');
      bt.className = 'opt';
      bt.innerHTML = '<span class="opt-txt">' + val(op.t, c) + '</span><span class="opt-ico"></span>';
      bt.addEventListener('click', () => elegir(i, bt));
      cont.appendChild(bt);
      return bt;
    });
    function cerrar() { listo = true; botones.forEach(x => x.disabled = true); }
    function elegir(i, bt) {
      if (listo) return;
      const op = b.opciones[i];
      if (b.prediccion) {
        bt.classList.add('elegida');
        cerrar();
        if (b.guardar === 'gancho') LS.st.laminas.gancho = op.valor != null ? op.valor : ui().textoDe(bt);
        resp(lam.id)[b.guardar || 'eleccion'] = op.valor != null ? op.valor : ui().textoDe(bt);
        LS.guardar();
        zfb.innerHTML = fbHtml('info', val(b.fbComun || op.fb || 'Guardado.', c));
        fin(true);
        return;
      }
      if (op.ok) {
        bt.classList.add('ok'); bt.querySelector('.opt-ico').innerHTML = ui().icon('check');
        cont.classList.add('revelada'); cerrar();
        zfb.innerHTML = fbHtml('ok', val(op.fb || b.okFb || ('¡Bien, ' + c.nombre + '! ' + ui().elogio()), c));
        ui().sonido('ok');
        fin(intentos === 0);
        return;
      }
      intentos++;
      bt.classList.add('miss'); bt.disabled = true; bt.querySelector('.opt-ico').innerHTML = ui().icon('x');
      bt.classList.remove('sacudir'); void bt.offsetWidth; bt.classList.add('sacudir');
      abrirMas(lam);
      if (intentos >= 2) {
        const bien = botones[b.opciones.findIndex(x => x.ok)];
        if (bien) { bien.classList.add('ok'); bien.querySelector('.opt-ico').innerHTML = ui().icon('check'); }
        cont.classList.add('revelada'); cerrar();
        zfb.innerHTML = fbHtml('miss', val(op.fb || 'Casi.', c)) +
          fbHtml('info', '<b>Así se hace:</b> ' + val(b.solucion || (b.opciones.find(x => x.ok) || {}).fb || b.okFb || '', c));
        fin(false);
      } else {
        zfb.innerHTML = fbHtml('miss', val(op.fb || 'Casi. Intenta otra vez.', c) + '<br><span class="peq tinta-2">Puedes intentar otra vez.</span>');
      }
    }
  }

  function bTeclado(el, b, lam, fin, c) {
    el.classList.add('bloque-preg');
    el.innerHTML = '<div class="enunciado">' + val(b.enunciado, c) + '</div><div class="zona-fb" aria-live="polite"></div><div class="zona-tec"></div>';
    const zfb = el.querySelector('.zona-fb');
    let intentos = 0;
    const tec = ui().teclado(el.querySelector('.zona-tec'), {
      onOk: (v, info) => {
        if (v === b.correcta) {
          tec.bloquear(true);
          zfb.innerHTML = fbHtml('ok', 'Tu respuesta: ' + ui().num(v) + '. ' + val(b.okFb || ('¡Bien, ' + c.nombre + '! ' + ui().elogio()), c) +
            (info && info.cero_con_signo ? '<br><span class="peq">El 0 no es positivo ni negativo: se escribe solo 0.</span>' : ''));
          ui().sonido('ok');
          fin(intentos === 0);
          return;
        }
        intentos++;
        abrirMas(lam);
        const clave = String(v);
        const conocido = b.errores && b.errores[clave];
        const msg = conocido ? val(conocido, c) : 'Casi. Mira cómo se hace:';
        const tu = 'Tu respuesta: ' + ui().num(v) + '. ';
        el.querySelector('.visor').classList.remove('sacudir'); void el.offsetWidth; el.querySelector('.visor').classList.add('sacudir');
        if (intentos >= 2) {
          tec.bloquear(true);
          zfb.innerHTML = fbHtml('miss', tu + msg) + fbHtml('info', '<b>Respuesta: ' + ui().num(b.correcta) + '.</b> ' + val(b.solucion || '', c));
          fin(false);
        } else {
          zfb.innerHTML = fbHtml('miss', tu + msg + (!conocido && b.solucion ? '<br>' + val(b.solucion, c) : '') + '<br><span class="peq tinta-2">Intenta otra vez.</span>');
          tec.limpiar();
        }
      }
    });
  }

  function bPasos(el, b, lam, fin, c) {
    el.innerHTML = (b.titulo ? '<div class="enunciado" style="font-weight:800;margin-bottom:8px">' + val(b.titulo, c) + '</div>' : '') +
      '<div class="pasos"></div><div class="zona-preg"></div><button class="btn btn-sec btn-ancho btn-paso" data-noswipe style="margin-top:10px">' + (b.textoBoton || 'Ver siguiente paso') + '</button>';
    const cont = el.querySelector('.pasos'), btn = el.querySelector('.btn-paso'), zp = el.querySelector('.zona-preg');
    let k = 0, ok1 = true;
    function mostrar() {
      const f = b.filas[k];
      cont.querySelectorAll('.paso.actual').forEach(x => x.classList.remove('actual'));
      const d = document.createElement('div');
      d.className = 'paso actual';
      d.innerHTML = '<span class="paso-n">' + (f.n != null ? f.n : 'Paso ' + (k + (b.sinPasoCero ? 1 : 0))) + '</span><div class="paso-cuerpo">' + val(f.html, c) + (f.regla ? '<div>' + ui().chip(f.regla) + '</div>' : '') + (f.nota ? '<div class="peq tinta-2">' + val(f.nota, c) + '</div>' : '') + '</div>';
      cont.appendChild(d);
      k++;
      const preg = b.pregunta && b.pregunta.despuesDe === k - 1 ? b.pregunta : null;
      if (preg) {
        btn.hidden = true;
        const pe = document.createElement('div'); pe.className = 'bloque'; zp.appendChild(pe);
        pintarBloque(pe, Object.assign({ tipo: preg.tipoPreg || 'opciones' }, preg), lam, (r) => { ok1 = ok1 && r !== false; seguir(); });
      } else seguir();
    }
    function seguir() {
      if (k >= b.filas.length) { btn.hidden = true; fin(ok1); }
      else { btn.hidden = false; }
    }
    btn.addEventListener('click', mostrar);
    if (b.autoPrimero !== false) mostrar();
  }

  function bClasificar(el, b, lam, fin, c) {
    const botones = b.botones || ['PLATA', 'SIGNOS PEGADOS', 'CUENTA LOS NEGATIVOS'];
    el.classList.add('bloque-preg');
    el.innerHTML = (b.enunciado ? '<div class="enunciado">' + val(b.enunciado, c) + '</div>' : '') + '<div class="clasif"></div>';
    const cont = el.querySelector('.clasif');
    let t = 0, ok1 = true;
    (function tarjeta() {
      if (t >= b.tarjetas.length) { fin(ok1); return; }
      const tj = b.tarjetas[t++];
      const d = document.createElement('div');
      d.className = 'bloque';
      d.style.marginTop = '12px';
      d.innerHTML = '<div class="centro fx-medio">' + val(tj.html, c) + '</div><div class="opciones" data-noswipe>' +
        botones.map(x => '<button class="opt" data-r="' + x + '"><span class="opt-txt">' + ui().chip(x) + '</span><span class="opt-ico"></span></button>').join('') + '</div><div class="zona-fb"></div>';
      cont.appendChild(d);
      let intentos = 0, listo = false;
      d.querySelectorAll('.opt').forEach(bt => bt.addEventListener('click', () => {
        if (listo) return;
        const r = bt.getAttribute('data-r');
        const zfb = d.querySelector('.zona-fb');
        if (r === tj.correcta) {
          listo = true; bt.classList.add('ok'); bt.querySelector('.opt-ico').innerHTML = ui().icon('check');
          d.querySelectorAll('.opt').forEach(x => x.disabled = true);
          zfb.innerHTML = fbHtml('ok', val(tj.okFb || '¡Eso!', c)); ui().sonido('ok');
          setTimeout(tarjeta, 250);
          return;
        }
        intentos++; ok1 = false; abrirMas(lam);
        bt.classList.add('miss'); bt.disabled = true; bt.querySelector('.opt-ico').innerHTML = ui().icon('x');
        if (intentos >= 2) {
          listo = true;
          const bien = d.querySelector('[data-r="' + tj.correcta + '"]'); if (bien) bien.classList.add('ok');
          d.querySelectorAll('.opt').forEach(x => x.disabled = true);
          zfb.innerHTML = fbHtml('miss', val(tj.fb || 'Casi.', c));
          setTimeout(tarjeta, 250);
        } else zfb.innerHTML = fbHtml('miss', val(tj.fb || 'Casi.', c));
      }));
    })();
  }

  function bChequeo(el, b, lam, fin, c) {
    el.innerHTML = (b.titulo ? '<h3 style="margin-bottom:8px">' + val(b.titulo, c) + '</h3>' : '') + '<div class="chq"></div>';
    const cont = el.querySelector('.chq');
    correrBloques(cont, b.preguntas, lam, (res) => {
      const fallos = res.filter(x => !x).length;
      if (fallos >= 2 && b.segundo && b.segundo.length) {
        const d = document.createElement('div');
        d.className = 'bloque';
        d.innerHTML = fbHtml('info', '<b>Repasemos un momento.</b> Fallaste ' + fallos + ' de ' + res.length + '. Mira estas láminas y luego intenta con otros números.' +
          '<div class="col" style="margin-top:10px">' + (b.repaso || []).map(num => '<button class="btn btn-sec btn-ancho" data-ver="' + num + '">Ver: ' + tituloDe(num) + '</button>').join('') +
          '<button class="btn btn-pri btn-ancho" data-seg="1">Hacer el segundo intento</button></div>');
        cont.appendChild(d);
        d.querySelectorAll('[data-ver]').forEach(x => x.addEventListener('click', () => verLamina(+x.getAttribute('data-ver'))));
        d.querySelector('[data-seg]').addEventListener('click', (e) => {
          e.target.remove();
          const s = document.createElement('div'); cont.appendChild(s);
          correrBloques(s, b.segundo, lam, () => {
            if (b.salida) { const d2 = document.createElement('div'); d2.className = 'bloque'; d2.innerHTML = fbHtml('ok', val(b.salida, c)); cont.appendChild(d2); }
            fin(false);
          });
        }, { once: true });
      } else {
        if (b.salida) { const d = document.createElement('div'); d.className = 'bloque'; d.innerHTML = fbHtml('ok', val(b.salida, c)); cont.appendChild(d); }
        fin(fallos === 0);
      }
    });
  }

  // ---------- Ver una lámina en una hoja (desde el juego, test o repaso) ----------
  function tituloDe(num) {
    const l = L().find(x => x.num === num);
    if (!l) return 'lámina ' + num;
    const d = document.createElement('div'); d.innerHTML = val(l.titulo, ctx());
    return d.textContent;
  }
  function verLamina(num) {
    const l = L().find(x => x.num === num);
    if (!l) return;
    const c = ctx();
    ui().hoja({
      tipo: 'info', icono: 'foco',
      titulo: val(l.titulo, c),
      html: (l.chip ? '<div style="margin-bottom:8px">' + ui().chip(l.chip) + '</div>' : '') +
        '<div class="lam-contenido">' + val(l.html, c) + '</div>' +
        (l.mas ? '<div class="lam-mas" style="border:0"><div class="mas-cuerpo">' + val(l.mas, c) + '</div></div>' : ''),
      botones: [{ t: 'Entendido', cls: 'btn-pri' }]
    });
  }

  LS.laminas = { abrir, atras, verLamina, tituloDe, indicePorNum, total: () => L().length };
})();
