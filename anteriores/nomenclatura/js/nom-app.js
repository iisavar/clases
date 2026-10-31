/* Nomenclatura UNEMI — app principal. Router de pantallas + práctica libre. */
(function () {
  'use strict';
  const D = window.NOM.datos, M = window.NOM.motor;
  const CLAVE = 'nom_unemi_v1';

  // ─── Estado persistente ────────────────────────────────────────────
  const S0 = { usuario: { nombre: '', correo: '' }, avance: {}, ajustes: { tema: null } };
  function leer() { try { return Object.assign({}, S0, JSON.parse(localStorage.getItem(CLAVE) || '{}')); } catch (e) { return Object.assign({}, S0); } }
  function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(st)); } catch (e) { } }
  let st = leer();
  function avNiv(k) { st.avance[k] = st.avance[k] || { paso: 0, aciertos: 0, intentos: 0, hecho: false }; return st.avance[k]; }

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const app = $('#app');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pintar = html => { app.innerHTML = html; window.scrollTo(0, 0); };
  const nombre = () => (st.usuario.nombre || '').split(/\s+/)[0] || '';

  // ─── Tema claro/oscuro ─────────────────────────────────────────────
  function fijarTema(t) {
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
    st.ajustes.tema = t || null; guardar();
    $('#btn-tema').textContent = temaEfect() === 'dark' ? '☾' : '☀';
  }
  function temaEfect() {
    const t = document.documentElement.getAttribute('data-theme');
    if (t) return t;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  // =====================================================================
  // MÓDULOS: definición de contenido pedagógico
  // =====================================================================
  const MODULOS = [
    { k: 'val', num: 1, titulo: 'La valencia', sub: 'La base de todo. Sin esto no se puede formular nada.' },
    { k: 'nom', num: 2, titulo: 'Las 3 nomenclaturas', sub: 'IUPAC, Stock y Tradicional: reglas de bolsillo.' },
    { k: 'hm', num: 3, titulo: 'Hidruros metálicos', sub: 'Metal + H. El H aquí es raro: actúa como −1.' },
    { k: 'hv', num: 4, titulo: 'Hidruros volátiles', sub: 'No metal (grupo 13-15) + H. Ojo con los nombres propios.' },
    { k: 'ha', num: 5, titulo: 'Hidrácidos', sub: 'H + no metal (grupo 16-17). Se llaman ácidos.' },
    { k: 'mix', num: 6, titulo: 'Todo mezclado', sub: 'Práctica final: tal como te va a caer en el test de tu clase.' }
  ];

  // Tarjetas de estudio por módulo (antes de la práctica).
  const TARJETAS = {
    val: [
      { h: '¿Qué es la valencia?',
        b: `<p>La <b>valencia</b> es el número que dice <b>con cuántos átomos de otro elemento se puede unir</b>. Se puede pensar como los "brazos" que tiene un elemento para agarrar a otros.</p>
            <p>Por ejemplo, el <b>hidrógeno tiene 1 brazo</b> (valencia 1) y el <b>oxígeno tiene 2</b> (valencia 2). Por eso el agua es H₂O: el oxígeno agarra dos hidrógenos.</p>
            <div class="regla-caja"><b>La regla de oro:</b> los átomos se unen intercambiando sus valencias. Si el Ca es +2 y el H es −1, entonces el compuesto es CaH<sub>2</sub> (el 2 del Ca baja al H).</div>` },
      { h: 'Metales de valencia FIJA',
        b: `<p>Estos metales <b>siempre</b> actúan con la misma valencia. Los memorizas y ya. Los más pedidos en el test son:</p>
            ${tablaValFijos()}
            <p class="tinta-2" style="font-size:13.5px;color:var(--ink-2)"><b>Truco:</b> los grupos 1 y 2 son los más fáciles. El aluminio siempre +3.</p>` },
      { h: 'Metales de valencia VARIABLE',
        b: `<p>Estos son los <b>tramposos</b>: tienen dos (o más) valencias posibles. Debes saber CUÁL usar en cada caso. La fórmula te da la pista.</p>
            ${tablaValVar()}
            <div class="regla-caja"><b>Cómo saber cuál usó:</b> mira el subíndice del H en el compuesto. FeH<sub>2</sub> → valencia 2 (ferroso). FeH<sub>3</sub> → valencia 3 (férrico).</div>` },
      { h: 'No metales (grupo 13 al 17)',
        b: `<p>Los <b>no metales</b> con el hidrógeno actúan con valencia <b>negativa</b>. Depende del grupo en la tabla:</p>
            <ul>
              <li><b>Grupo 17 (halógenos):</b> F, Cl, Br, I → valencia <b>−1</b></li>
              <li><b>Grupo 16 (anfígenos):</b> S, Se, Te → valencia <b>−2</b></li>
              <li><b>Grupo 15 (nitrogenoides):</b> N, P, As, Sb → valencia <b>−3</b></li>
              <li><b>Grupo 13:</b> B → valencia <b>−3</b></li>
              <li><b>Grupo 14 (carbonoides):</b> C, Si → valencia <b>−4</b></li>
            </ul>
            <p><b>Truco rápido:</b> cuentas desde el grupo 18 hacia atrás. Grupo 18 = 0, 17 = 1, 16 = 2, 15 = 3, 14 = 4.</p>` }
    ],

    nom: [
      { h: 'Las 3 formas de nombrar un compuesto',
        b: `<p>Un mismo compuesto se puede nombrar de <b>3 formas distintas</b>. Todas son correctas y las 3 pueden aparecer en el examen. Vamos de la <b>más fácil a la más difícil</b>:</p>
            <ol>
              <li><b>Sistemática (IUPAC):</b> usa prefijos griegos (mono, di, tri…). La más fácil, siempre funciona.</li>
              <li><b>Stock:</b> pone la valencia en <b>números romanos</b> entre paréntesis.</li>
              <li><b>Tradicional:</b> usa sufijos <b>−oso</b> (valencia baja) y <b>−ico</b> (valencia alta).</li>
            </ol>` },
      { h: 'Nomenclatura sistemática (IUPAC)',
        b: `<p>La más sencilla: cuentas los átomos y pones el prefijo griego correspondiente.</p>
            <div class="tabla-val">
              ${['mono·1','di·2','tri·3','tetra·4','penta·5','hexa·6','hepta·7','octa·8','nona·9','deca·10'].map(x=>{const[p,n]=x.split('·');return `<div class="celda"><b>${p}</b><small>${n}</small></div>`}).join('')}
            </div>
            <div class="ej-linea"><b>Ejemplo:</b> FeH<sub>3</sub> → <b>trihidruro de hierro</b> (3 hidrógenos → tri).</div>
            <div class="ej-linea"><b>Ejemplo:</b> CaH<sub>2</sub> → <b>dihidruro de calcio</b> (2 hidrógenos → di).</div>
            <p class="tinta-2" style="font-size:13.5px;color:var(--ink-2)">El prefijo <b>mono</b> a veces se omite en el metal (LiH → hidruro de litio). En este simulador siempre lo escribimos: monohidruro de litio.</p>` },
      { h: 'Nomenclatura Stock',
        b: `<p>Escribes el nombre normal del elemento y <b>al final</b>, entre paréntesis, la valencia en <b>números romanos</b>.</p>
            <div class="tabla-val">
              ${[1,2,3,4,5,6,7].map(n=>`<div class="celda"><b>${D.ROMANOS[n]}</b><small>${n}</small></div>`).join('')}
            </div>
            <div class="ej-linea"><b>Ejemplo:</b> FeH<sub>3</sub> → <b>hidruro de hierro (III)</b> (el hierro actúa con valencia 3).</div>
            <div class="ej-linea"><b>Ejemplo:</b> CuH → <b>hidruro de cobre (I)</b> (el cobre actúa con valencia 1).</div>
            <div class="regla-caja"><b>Ojo:</b> si el elemento tiene <b>una sola valencia</b> (como Na, Ca, Al), <b>no se pone romano</b>. Solo "hidruro de sodio", "hidruro de calcio".</div>` },
      { h: 'Nomenclatura tradicional (la más difícil)',
        b: `<p>Usa sufijos y prefijos según <b>cuántas valencias tiene</b> el elemento:</p>
            <ul>
              <li><b>1 valencia</b> (fijos): sufijo <b>-ico</b>. Ej: sódico, cálcico, alumínico.</li>
              <li><b>2 valencias</b>: menor <b>-oso</b>, mayor <b>-ico</b>. Ej: ferr<b>oso</b> (2), férr<b>ico</b> (3).</li>
              <li><b>3 valencias</b>: hipo…-oso / -oso / -ico</li>
              <li><b>4 valencias</b>: hipo…-oso / -oso / -ico / per…-ico</li>
            </ul>
            <div class="regla-caja"><b>Truco de tildes:</b> el sufijo <b>-oso</b> nunca lleva tilde (ferr<b>oso</b>). El sufijo <b>-ico</b> hace la palabra esdrújula y sí lleva tilde (f<b>é</b>rrico, c<b>ú</b>prico, ál<b>u</b>mnico).</div>
            <div class="ej-linea"><b>Ejemplo:</b> FeH<sub>2</sub> → <b>hidruro ferroso</b> · FeH<sub>3</sub> → <b>hidruro férrico</b>.</div>` }
    ],

    hm: [
      { h: '¿Qué son los hidruros metálicos?',
        b: `<p>Son compuestos de <b>metal + hidrógeno</b>. Lo raro es que aquí el hidrógeno actúa con valencia <b>−1</b> (en casi todos los demás casos actúa +1).</p>
            <div class="ej-formula">M<sup>+n</sup> + H<sup>−1</sup> → MH<sub>n</sub></div>
            <div class="regla-caja"><b>Regla:</b> el metal va <b>primero</b>. La valencia del metal <b>baja como subíndice</b> al hidrógeno (intercambio de valencias).</div>` },
      { h: 'Cómo se formulan paso a paso',
        b: `<p>Paso 1: escribes el metal a la izquierda con su valencia arriba.</p>
            <p>Paso 2: escribes el H a la derecha con −1.</p>
            <p>Paso 3: intercambias los números (el del metal baja al H, el del H baja al metal).</p>
            <div class="ej-formula">Ca<sup>+2</sup> + H<sup>−1</sup> → Ca<sub>1</sub>H<sub>2</sub> → <b>CaH₂</b></div>
            <div class="ej-linea"><b>Ejemplo con hierro (II):</b> Fe<sup>+2</sup> + H<sup>−1</sup> → FeH₂</div>
            <div class="ej-linea"><b>Ejemplo con hierro (III):</b> Fe<sup>+3</sup> + H<sup>−1</sup> → FeH₃</div>` },
      { h: 'Cómo se nombran (las 3 nomenclaturas)',
        b: `<p>Vamos con NaH y FeH₃ como ejemplos:</p>
            <table class="tabla-nom">
              <tr><th></th><th>NaH</th><th>FeH₃</th></tr>
              <tr><td><b>Sistemática</b></td><td>monohidruro de sodio</td><td>trihidruro de hierro</td></tr>
              <tr><td><b>Stock</b></td><td>hidruro de sodio</td><td>hidruro de hierro (III)</td></tr>
              <tr><td><b>Tradicional</b></td><td>hidruro sódico</td><td>hidruro férrico</td></tr>
            </table>
            <style>.tabla-nom{width:100%;border-collapse:collapse;margin:10px 0}.tabla-nom th,.tabla-nom td{padding:8px 10px;border:1px solid var(--line);text-align:left;font-size:14px}.tabla-nom th{background:var(--primario-tinte);color:var(--primario-2);font-weight:900}.tabla-nom td:first-child{font-weight:800;background:var(--surface-2)}</style>
            <div class="regla-caja"><b>Ojo</b> con el sodio: como es valencia fija, en Stock <b>no se pone (I)</b>. Solo "hidruro de sodio", nunca "hidruro de sodio (I)".</div>` }
    ],

    hv: [
      { h: '¿Qué son los hidruros volátiles?',
        b: `<p>Son compuestos de <b>no metal + hidrógeno</b>, pero <b>solo</b> con no metales de los <b>grupos 13, 14 y 15</b> (B, C, Si, N, P, As, Sb).</p>
            <p>Se llaman <b>volátiles</b> porque casi todos son gases a temperatura ambiente.</p>
            <div class="regla-caja"><b>Aquí el hidrógeno vuelve a ser +1</b> (normal). El que actúa con valencia negativa es el no metal: −3 los del grupo 13 y 15, −4 los del grupo 14.</div>` },
      { h: 'Cómo se formulan',
        b: `<p>Igual que antes: intercambias valencias. Como el H es +1, siempre queda con subíndice igual a la valencia del no metal.</p>
            <div class="ej-formula">N<sup>−3</sup> + H<sup>+1</sup> → NH₃</div>
            <div class="ej-linea"><b>Boro (−3):</b> BH₃ · <b>Fósforo (−3):</b> PH₃ · <b>Arsénico (−3):</b> AsH₃ · <b>Antimonio (−3):</b> SbH₃</div>
            <div class="ej-linea"><b>Carbono (−4):</b> CH₄ · <b>Silicio (−4):</b> SiH₄</div>` },
      { h: '⚡ NOMBRES PROPIOS (¡memorizar!)',
        b: `<p>Aquí viene lo que TIENES que saber de memoria. En nomenclatura <b>tradicional</b>, estos compuestos tienen <b>nombres especiales</b>:</p>
            <div class="tabla-val">
              <div class="celda destaca"><b>NH₃</b><small>amoníaco</small></div>
              <div class="celda destaca"><b>PH₃</b><small>fosfina</small></div>
              <div class="celda destaca"><b>AsH₃</b><small>arsina</small></div>
              <div class="celda destaca"><b>SbH₃</b><small>estibina</small></div>
              <div class="celda destaca"><b>CH₄</b><small>metano</small></div>
              <div class="celda destaca"><b>SiH₄</b><small>silano</small></div>
              <div class="celda destaca"><b>BH₃</b><small>borano</small></div>
            </div>
            <div class="regla-caja"><b>¡OJO!</b> Los hidruros volátiles <b>no usan nomenclatura Stock</b>. Solo Sistemática (trihidruro de nitrógeno) o Tradicional (amoníaco).</div>` }
    ],

    ha: [
      { h: '¿Qué son los hidrácidos (haluros de hidrógeno)?',
        b: `<p>Son compuestos de <b>hidrógeno + no metal</b>, pero <b>solo</b> con no metales de los <b>grupos 16 y 17</b> (S, Se, Te, F, Cl, Br, I).</p>
            <div class="regla-caja"><b>La gran diferencia:</b> aquí el <b>hidrógeno va primero</b> en la fórmula. En los hidruros el metal iba primero; en los hidrácidos, el H va primero.</div>
            <p>El H sigue siendo +1. Los no metales actúan con valencia:</p>
            <ul>
              <li><b>Grupo 17</b> (F, Cl, Br, I): <b>−1</b> → HF, HCl, HBr, HI</li>
              <li><b>Grupo 16</b> (S, Se, Te): <b>−2</b> → H₂S, H₂Se, H₂Te</li>
            </ul>` },
      { h: 'Cómo se nombran',
        b: `<p>Solo <b>2 nomenclaturas</b> (los hidrácidos tampoco usan Stock):</p>
            <ul>
              <li><b>Tradicional:</b> <b>ácido</b> + raíz del no metal + <b>hídrico</b>. Ej: ácido clor<b>hídrico</b>, ácido sulf<b>hídrico</b>.</li>
              <li><b>Sistemática:</b> raíz + <b>uro de hidrógeno</b>. Ej: clor<b>uro</b> de hidrógeno, sulf<b>uro</b> de hidrógeno.</li>
            </ul>
            <table class="tabla-nom">
              <tr><th>Fórmula</th><th>Tradicional</th><th>Sistemática</th></tr>
              <tr><td>HCl</td><td>ácido clorhídrico</td><td>cloruro de hidrógeno</td></tr>
              <tr><td>HF</td><td>ácido fluorhídrico</td><td>fluoruro de hidrógeno</td></tr>
              <tr><td>HBr</td><td>ácido bromhídrico</td><td>bromuro de hidrógeno</td></tr>
              <tr><td>HI</td><td>ácido yodhídrico</td><td>yoduro de hidrógeno</td></tr>
              <tr><td>H₂S</td><td>ácido sulfhídrico</td><td>sulfuro de hidrógeno</td></tr>
              <tr><td>H₂Se</td><td>ácido selenhídrico</td><td>seleniuro de hidrógeno</td></tr>
              <tr><td>H₂Te</td><td>ácido telurhídrico</td><td>telururo de hidrógeno</td></tr>
            </table>` }
    ],

    mix: [
      { h: '¡A prueba con todo mezclado!',
        b: `<p>Ya viste los 3 tipos de hidruros. Ahora vas a mezclar todo: te caerá cualquier fórmula al azar y tienes que:</p>
            <ol>
              <li><b>Reconocer</b> qué tipo de compuesto es (metálico / volátil / hidrácido).</li>
              <li><b>Nombrarlo</b> en la nomenclatura que te pida.</li>
              <li><b>O formular</b>: te dan el nombre, escribes la fórmula.</li>
            </ol>
            <div class="regla-caja"><b>Trucos para no confundirte:</b>
            <ul style="margin-top:8px">
              <li>Si empieza con <b>H</b> y sigue un halógeno/anfígeno (F, Cl, Br, I, S, Se, Te) → <b>hidrácido</b>.</li>
              <li>Si empieza con un <b>no metal</b> (B, C, Si, N, P, As, Sb) → <b>hidruro volátil</b>.</li>
              <li>Si empieza con un <b>metal</b> → <b>hidruro metálico</b>.</li>
            </ul></div>
            <p>Cuando te sientas listo, dale a "Empezar". Cada acierto suma. Sin cronómetro: tu ritmo.</p>` }
    ]
  };

  function tablaValFijos() {
    const grp = {};
    D.METALES_FIJOS.forEach(m => { grp[m.v] = grp[m.v] || []; grp[m.v].push(m); });
    return Object.keys(grp).sort().map(v =>
      `<p><b>Valencia +${v}:</b> ${grp[v].map(m => `<span style="display:inline-block;margin:2px 4px;padding:4px 10px;background:var(--surface-2);border:1px solid var(--line);border-radius:8px;font:700 13px var(--font-mono)">${m.s}</span> ${m.nombre}`).join(', ')}</p>`
    ).join('');
  }
  function tablaValVar() {
    return `<table class="tabla-nom" style="margin-top:8px"><tr><th>Símbolo</th><th>Nombre</th><th>Valencias</th><th>Nombres tradicionales</th></tr>` +
      D.METALES_VARIABLES.map(m => {
        const noms = m.vs.map((v, i) => {
          const s = m.vs.length === 2 ? (i === 0 ? 'oso' : 'ico') : '';
          return `+${v}: <b>${(i === 0 ? m.rOso : m.rIco) + s}</b>`;
        }).join(' · ');
        return `<tr><td style="font-family:var(--font-mono);font-weight:800">${m.s}</td><td>${m.nombre}</td><td>+${m.vs.join(', +')}</td><td style="font-size:13px">${noms}</td></tr>`;
      }).join('') + `</table>`;
  }

  // =====================================================================
  // PANTALLA HUB
  // =====================================================================
  function pintarHub() {
    const hechos = MODULOS.filter(m => (st.avance[m.k] || {}).hecho).length;
    pintar(`
      <div class="hub-cab">
        <div class="hub-cab-txt">
          <h1>Nomenclatura inorgánica</h1>
          <p>Práctica libre a tu ritmo. Empieza por el módulo 1 y avanza en orden.</p>
        </div>
        <div class="hub-avance"><b>${hechos}/${MODULOS.length}</b><small>módulos</small></div>
      </div>
      <div class="modulos">
        ${MODULOS.map(m => {
          const av = st.avance[m.k] || {};
          const clases = av.hecho ? 'modulo hecho' : 'modulo';
          const progreso = av.intentos ? `<span class="modulo-progreso">${av.aciertos}/${av.intentos}</span>` : '';
          return `<button class="${clases}" type="button" data-k="${m.k}">
            <span class="modulo-num">${av.hecho ? '✓' : m.num}</span>
            <span class="modulo-txt"><h3>${m.titulo}</h3><p>${m.sub}</p></span>
            <span class="modulo-flecha">${progreso} →</span>
          </button>`;
        }).join('')}
      </div>
      <p class="pie">Tu avance se guarda solo. Puedes dejarlo y seguir cuando quieras.</p>
    `);
    $$('.modulo').forEach(b => b.addEventListener('click', () => abrirModulo(b.getAttribute('data-k'))));
  }

  // =====================================================================
  // MÓDULO: estudio + práctica
  // =====================================================================
  let modAct = null;   // módulo actual
  let paso = 0;        // índice de tarjeta / ejercicio
  function abrirModulo(k) {
    modAct = MODULOS.find(m => m.k === k); if (!modAct) return;
    paso = 0;
    verTarjeta();
  }
  function verTarjeta() {
    const cards = TARJETAS[modAct.k];
    if (paso >= cards.length) return empezarPractica();
    const c = cards[paso];
    pintar(`
      <div class="top-nav">
        <button class="btn-txt" type="button" id="volver">← Módulos</button>
        <h2>Módulo ${modAct.num} · ${esc(modAct.titulo)}</h2>
      </div>
      <div class="pasos" aria-hidden="true">${cards.map((_, i) => `<i class="${i < paso ? 'hecho' : i === paso ? 'actual' : ''}"></i>`).join('')}</div>
      <div class="tarjeta">
        <h3>${c.h}</h3>
        ${c.b}
      </div>
      <div style="display:flex;gap:10px;justify-content:space-between;margin-top:10px">
        ${paso > 0 ? '<button class="btn btn-sec" type="button" id="ant">← Atrás</button>' : '<span></span>'}
        <button class="btn btn-pri" type="button" id="sig">${paso === cards.length - 1 ? '¡A practicar! →' : 'Siguiente →'}</button>
      </div>
    `);
    $('#volver').addEventListener('click', pintarHub);
    $('#sig').addEventListener('click', () => { paso++; verTarjeta(); });
    const ant = $('#ant'); if (ant) ant.addEventListener('click', () => { paso--; verTarjeta(); });
  }

  // =====================================================================
  // PRÁCTICA (generador de ejercicios por módulo)
  // =====================================================================
  const META = 10;   // ejercicios por módulo
  let ejActual = null, respondido = false, contAciertos = 0, contIntentos = 0, racha = 0;

  function empezarPractica() {
    const av = avNiv(modAct.k);
    contAciertos = 0; contIntentos = 0; racha = 0;
    ejActual = null; respondido = false;
    siguienteEj();
  }

  function siguienteEj() {
    if (contIntentos >= META) return terminarPractica();
    ejActual = generarEj(modAct.k, contIntentos);
    respondido = false;
    pintarEj();
  }

  function pintarEj() {
    const ej = ejActual, prog = (contIntentos / META) * 100;
    pintar(`
      <div class="prac-cab">
        <span>Módulo ${modAct.num}</span>
        <span class="prac-progreso"><i style="width:${prog}%"></i></span>
        <span>${contIntentos + 1}/${META}</span>
        ${racha >= 3 ? `<span class="prac-racha">🔥 ${racha}</span>` : ''}
      </div>
      <div class="enun">
        <p class="enun-eti">${ej.eti}</p>
        <p class="enun-txt">${ej.enun}</p>
        ${ej.formula ? `<p class="enun-formula">${ej.formula}</p>` : ''}
      </div>
      <div class="opciones" id="ops">
        ${ej.opciones.map((o, i) => `<button class="op" type="button" data-i="${i}">
          <span class="op-letra">${String.fromCharCode(65 + i)}</span>
          <span>${o.txt}</span>
        </button>`).join('')}
      </div>
      <div id="fb"></div>
    `);
    $$('#ops .op').forEach(b => b.addEventListener('click', () => responder(+b.getAttribute('data-i'))));
  }

  function responder(i) {
    if (respondido) return;
    respondido = true;
    const ej = ejActual, ok = ej.opciones[i].ok;
    contIntentos++;
    if (ok) { contAciertos++; racha++; } else { racha = 0; }
    const av = avNiv(modAct.k);
    av.intentos++; if (ok) av.aciertos++; guardar();

    // Marcar botones
    $$('#ops .op').forEach((b, j) => {
      const o = ej.opciones[j];
      if (o.ok) b.classList.add('ok');
      else if (j === i) b.classList.add('miss');
      b.disabled = true;
    });

    // Feedback
    const cabecera = ok
      ? `<div class="fb-cab"><span class="fb-cab-ico">✓</span>${['¡Eso es!', '¡Bien!', '¡Perfecto!', 'Correcto.'][contIntentos % 4]}</div>`
      : `<div class="fb-cab"><span class="fb-cab-ico">✕</span>Casi. Mira:</div>`;
    const explic = ok ? ej.porqueOk : ej.porqueMiss(ej.opciones[i]);
    $('#fb').innerHTML = `<div class="fb ${ok ? 'ok' : 'miss'}">
      ${cabecera}
      ${ok ? '' : `<p><b>La respuesta correcta es:</b> ${esc(ej.opciones.find(o => o.ok).txt)}</p>`}
      <div class="porque">${explic}</div>
      <div style="margin-top:14px;text-align:right">
        <button class="btn btn-pri" type="button" id="sig-ej">Siguiente →</button>
      </div>
    </div>`;
    $('#sig-ej').addEventListener('click', siguienteEj);
    $('#sig-ej').focus();
  }

  function terminarPractica() {
    const pct = Math.round(contAciertos / META * 100);
    const av = avNiv(modAct.k); av.hecho = true; guardar();
    const emoji = pct >= 90 ? '🏆' : pct >= 70 ? '⭐' : pct >= 50 ? '👏' : '💪';
    const msg = pct >= 90 ? '¡Perfecto!' : pct >= 70 ? '¡Muy bien!' : pct >= 50 ? '¡Bien!' : '¡Sigue así!';
    pintar(`
      <div class="tarjeta sello-fin">
        <div class="estrella">${emoji}</div>
        <h2>${msg}</h2>
        <p>Terminaste el módulo <b>${esc(modAct.titulo)}</b>.</p>
        <div class="stats">
          <div class="stat"><b>${contAciertos}/${META}</b><small>aciertos</small></div>
          <div class="stat"><b>${pct}%</b><small>puntaje</small></div>
        </div>
        <div style="display:flex;gap:10px;justify-content:center;margin-top:20px;flex-wrap:wrap">
          <button class="btn btn-sec" type="button" id="repetir">Volver a practicar</button>
          <button class="btn btn-pri" type="button" id="volver-hub">Elegir otro módulo</button>
        </div>
      </div>
    `);
    $('#repetir').addEventListener('click', empezarPractica);
    $('#volver-hub').addEventListener('click', pintarHub);
  }

  // =====================================================================
  // GENERADOR DE EJERCICIOS POR MÓDULO
  // =====================================================================
  const rnd = arr => arr[Math.floor(Math.random() * arr.length)];
  function mezclar(a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[b[i], b[j]] = [b[j], b[i]]; } return b; }

  function generarEj(k, ordinal) {
    if (k === 'val') return ejValencia();
    if (k === 'nom') return ejNomenclatura();
    if (k === 'hm') return ejHidruro('hm');
    if (k === 'hv') return ejHidruro('hv');
    if (k === 'ha') return ejHidruro('ha');
    if (k === 'mix') return ejHidruro(rnd(['hm', 'hv', 'ha']));
    return null;
  }

  // ── MÓDULO 1: valencia ────────────────────────────────────────────
  function ejValencia() {
    // Pregunto la valencia de un elemento al azar (de metales o no metales)
    const pool = [].concat(D.METALES_FIJOS.map(m => ({ s: m.s, nombre: m.nombre, vs: [m.v], tipo: 'metal fijo' })),
                            D.METALES_VARIABLES.map(m => ({ s: m.s, nombre: m.nombre, vs: m.vs, tipo: 'metal variable' })),
                            D.NO_METALES_VOLATILES.map(m => ({ s: m.s, nombre: m.nombre, vs: [m.valFrenteAH], tipo: 'no metal (grupo 13-15)', neg: true })),
                            D.NO_METALES_HIDRACIDOS.map(m => ({ s: m.s, nombre: m.nombre, vs: [m.valFrenteAH], tipo: 'no metal (grupo 16-17)', neg: true })));
    const el = rnd(pool);
    const val = el.vs.length === 1 ? el.vs[0] : rnd(el.vs);
    const signo = el.neg ? '−' : '+';
    const correcta = signo + val;

    // Genero 3 opciones erróneas plausibles
    const distr = new Set([correcta]);
    while (distr.size < 4) {
      const v = 1 + Math.floor(Math.random() * 6);
      const s = Math.random() < 0.5 ? '+' : '−';
      distr.add(s + v);
    }
    const arr = Array.from(distr);
    const opts = mezclar(arr.map(v => ({ txt: 'Valencia ' + v, ok: v === correcta })));
    return {
      eti: 'Valencia',
      enun: `¿Con qué valencia actúa el <b>${el.nombre}</b> (${el.s})${el.vs.length > 1 ? ' cuando forma el compuesto con valencia' : ''}?`,
      formula: el.vs.length > 1 ? el.s + ' → ' + signo + val : el.s,
      opciones: opts,
      porqueOk: `El <b>${el.nombre}</b> (${el.s}) es un <b>${el.tipo}</b> y actúa con valencia <b>${correcta}</b>.`,
      porqueMiss: (o) => `El <b>${el.nombre}</b> (${el.s}) es un ${el.tipo}. Actúa con valencia <b>${correcta}</b>, no con ${o.txt.replace('Valencia ', '')}.`
    };
  }

  // ── MÓDULO 2: nomenclatura ─────────────────────────────────────────
  function ejNomenclatura() {
    // Doy un compuesto y pregunto su nombre en una nomenclatura al azar (o al revés)
    const todos = M.todos();
    const c = rnd(todos);
    const sistemas = c.stock ? ['tradicional', 'stock', 'sistematica'] : ['tradicional', 'sistematica'];
    const sis = rnd(sistemas);
    const nomCorrecto = c[sis];
    // Distractores: mismas fórmulas parecidas de otros compuestos
    const distr = new Set([nomCorrecto]);
    const pool = todos.filter(x => x.tipo === c.tipo).map(x => x[sis]).filter(Boolean);
    let intentos = 0;
    while (distr.size < 4 && intentos < 30) { distr.add(rnd(pool)); intentos++; }
    const arr = mezclar(Array.from(distr));
    const nomSis = { tradicional: 'tradicional', stock: 'Stock', sistematica: 'sistemática (IUPAC)' }[sis];
    return {
      eti: 'Nomenclatura ' + nomSis,
      enun: `¿Cómo se llama este compuesto en nomenclatura <b>${nomSis}</b>?`,
      formula: c.formula,
      opciones: arr.map(t => ({ txt: t, ok: t === nomCorrecto })),
      porqueOk: `<b>${c.formula}</b> en ${nomSis} es <b>${nomCorrecto}</b>. ${explicaPorNombre(c, sis)}`,
      porqueMiss: (o) => `El compuesto <b>${c.formula}</b> en ${nomSis} se llama <b>${nomCorrecto}</b>. ${explicaPorNombre(c, sis)}`
    };
  }

  function explicaPorNombre(c, sis) {
    const t = c.tipo === 'hm' ? 'hidruro metálico' : c.tipo === 'hv' ? 'hidruro volátil' : 'hidrácido';
    if (sis === 'sistematica') {
      const n = c.valencia;
      return `Es un ${t}. Usamos el prefijo griego de <b>${n}</b> (${D.PREFIJOS_IUPAC[n]}) + hidruro/…uro + del elemento.`;
    }
    if (sis === 'stock') {
      return `Es un ${t} con metal de valencia variable (${c.valencia}). Por eso el (${D.ROMANOS[c.valencia]}) al final.`;
    }
    if (c.tipo === 'hv') return `Es un hidruro volátil. En tradicional usa su <b>nombre propio</b> (${c.tradicional}), no sigue reglas.`;
    if (c.tipo === 'ha') return `Es un hidrácido. En tradicional: <b>ácido + raíz + hídrico</b>.`;
    return `Es un hidruro metálico. Sufijo -${c.valencia === Math.max(...(c.elem.vs || [c.valencia])) ? 'ico' : 'oso'} según la valencia usada.`;
  }

  // ── MÓDULOS 3-6: hidruros (metálicos, volátiles, hidrácidos, mezclado) ─
  function ejHidruro(tipo) {
    const todos = M.todos().filter(c => c.tipo === tipo);
    const c = rnd(todos);
    // 50% fórmula→nombre, 50% nombre→fórmula
    if (Math.random() < 0.5) return ejFormAName(c);
    return ejNameAForm(c, todos);
  }

  function ejFormAName(c) {
    const sistemas = c.stock ? ['tradicional', 'stock', 'sistematica'] : ['tradicional', 'sistematica'];
    const sis = rnd(sistemas);
    const nomCorrecto = c[sis];
    const pool = M.todos().filter(x => x.tipo === c.tipo).map(x => x[sis]).filter(Boolean);
    const distr = new Set([nomCorrecto]);
    let i = 0; while (distr.size < 4 && i < 30) { distr.add(rnd(pool)); i++; }
    const arr = mezclar(Array.from(distr));
    const nomSis = { tradicional: 'tradicional', stock: 'Stock', sistematica: 'sistemática' }[sis];
    return {
      eti: `${tipoLegible(c.tipo)} · fórmula → nombre`,
      enun: `¿Cómo se llama en nomenclatura <b>${nomSis}</b>?`,
      formula: c.formula,
      opciones: arr.map(t => ({ txt: t, ok: t === nomCorrecto })),
      porqueOk: pistaCorrecta(c, sis, nomCorrecto),
      porqueMiss: () => pistaCorrecta(c, sis, nomCorrecto)
    };
  }

  function ejNameAForm(c, todos) {
    const sistemas = c.stock ? ['tradicional', 'stock', 'sistematica'] : ['tradicional', 'sistematica'];
    const sis = rnd(sistemas);
    const nombreDado = c[sis];
    const distr = new Set([c.formula]);
    const pool = M.todos().filter(x => x.tipo === c.tipo).map(x => x.formula);
    let i = 0; while (distr.size < 4 && i < 30) { distr.add(rnd(pool)); i++; }
    const arr = mezclar(Array.from(distr));
    return {
      eti: `${tipoLegible(c.tipo)} · nombre → fórmula`,
      enun: `¿Cuál es la fórmula de <b>${nombreDado}</b>?`,
      formula: null,
      opciones: arr.map(f => ({ txt: f, ok: f === c.formula })),
      porqueOk: pistaFormular(c, nombreDado),
      porqueMiss: () => pistaFormular(c, nombreDado)
    };
  }

  function tipoLegible(t) { return t === 'hm' ? 'Hidruro metálico' : t === 'hv' ? 'Hidruro volátil' : 'Hidrácido'; }

  function pistaCorrecta(c, sis, nom) {
    const t = tipoLegible(c.tipo);
    if (c.tipo === 'hm') {
      const v = c.valencia;
      return `<b>${c.formula}</b> es un ${t}. El ${c.elem.nombre} actúa con valencia <b>+${v}</b> (por eso ${v > 1 ? v + ' hidrógenos' : '1 hidrógeno'}). En ${sis} es <b>${nom}</b>.`;
    }
    if (c.tipo === 'hv') {
      return `<b>${c.formula}</b> es un ${t}. El ${c.elem.nombre} actúa con valencia <b>−${c.valencia}</b> y el H con +1. En ${sis} es <b>${nom}</b>${sis === 'tradicional' ? ' (nombre propio, memorizar)' : ''}.`;
    }
    // hidrácido
    return `<b>${c.formula}</b> es un ${t}. El H va primero (+1), el ${c.elem.nombre} tiene valencia <b>−${c.valencia}</b>. En ${sis} es <b>${nom}</b>.`;
  }

  function pistaFormular(c, nom) {
    if (c.tipo === 'hm') return `${nom} es un hidruro metálico. El ${c.elem.nombre} actúa con valencia +${c.valencia}, y esa valencia baja como subíndice al H: <b>${c.formula}</b>.`;
    if (c.tipo === 'hv') return `${nom} es un hidruro volátil. El ${c.elem.nombre} tiene valencia −${c.valencia}, así que el H aparece ${c.valencia} veces: <b>${c.formula}</b>.`;
    return `${nom} es un hidrácido. El H va primero, y el ${c.elem.nombre} con valencia −${c.valencia}: <b>${c.formula}</b>.`;
  }

  // =====================================================================
  // INICIO
  // =====================================================================
  function iniciar() {
    if (st.ajustes.tema) fijarTema(st.ajustes.tema);
    else $('#btn-tema').textContent = temaEfect() === 'dark' ? '☾' : '☀';
    $('#btn-tema').addEventListener('click', () => {
      const t = temaEfect() === 'dark' ? 'light' : 'dark';
      fijarTema(t);
    });
    // Entrar directo al hub (sin registro).
    pintarHub();
  }
  document.addEventListener('DOMContentLoaded', iniciar);
})();
