/* Motor de cada clase: arma las pantallas desde CLASE, DUELO, CASOS y TAREA, y maneja marcador, reloj, pizarra y navegación. */
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const SEG=20;

/* ---------- Pantallas ---------- */
function seccion(titulo,html,extra){
  const s=document.createElement('section');
  s.className='slide'; s.dataset.titulo=titulo;
  if(extra)Object.assign(s.dataset,extra);
  s.innerHTML=html;
  $('deck').appendChild(s);
  return s;
}
function portada(){
  const c=CLASE;
  seccion('Portada',`${c.portada?`<div class="portada-img" style="background-image:url('${c.portada}')"></div>`:''}
    <div class="portada"><div>
      <p class="num-clase">Clase ${c.num}</p>
      <h1>${c.titulo} <span>${c.subtitulo}</span></h1>
      <p class="lead" style="margin:0 auto">${c.lead}</p>
    </div></div>`);
}
function retoma(){
  const r=CLASE.retoma; if(!r)return;
  seccion('Lo que viene de antes',`<div class="inner">
    <div class="kicker">Antes de empezar</div>
    <h2>${r.titulo}</h2>
    <div class="puente">
      <div class="card"><h3>${r.antesT}</h3><p style="margin:0">${r.antes}</p></div>
      <div class="flecha">▶</div>
      <div class="card"><h3>Hoy</h3><p style="margin:0">${r.hoy}</p></div>
    </div></div>`);
}
function reglasDuelo(){
  seccion('Duelo: cómo se juega',`<div class="inner">
    <div class="kicker">Duelo en el chat</div>
    <h2>El primero que escribe la letra correcta se lleva el punto</h2>
    <div class="grid2">
      <div class="card"><h3>Reglas</h3>
        <p>Sale una pregunta con cuatro opciones y ${SEG} segundos. Escriban en el chat solo la letra: A, B, C o D.</p>
        <p>Gana el punto el <b>primer mensaje correcto</b>. Si alguien cambia su respuesta, vale la primera.</p>
        <p style="margin:0">Hay dos rondas: una ahora y otra al final de la clase.</p></div>
      <div class="card"><h3>Jugadores</h3>
        <div class="alta"><input id="nuevo" placeholder="Nombre o equipo" maxlength="24" autocomplete="off"><button class="btn" id="bAgregar" type="button">Agregar</button></div>
        <div class="lista-alta" id="listaAlta"></div>
        <p style="margin:14px 0 0"><button class="btn sec" id="bReiniciar" type="button">Poner puntos en cero</button></p></div>
    </div></div>`);
}
function ronda(r){
  const lote=DUELO.filter(d=>d.r===r);
  lote.forEach((d,i)=>{
    seccion(`Duelo ${r}: pregunta ${i+1}`,`<div class="duelo"><div class="zona">
      <div class="kicker">Duelo, ronda ${r}, pregunta ${i+1} de ${lote.length}</div>
      <div class="pregunta">${d.q}</div>
      <div class="dops">${d.ops.map((o,k)=>`<div class="dop${k===d.ok?' ok':''}"><span class="l">${'ABCD'[k]}</span><span>${o}</span></div>`).join('')}</div>
      <div class="reloj"><div class="barra"><i></i></div><span class="seg">${SEG} s</span></div>
      <p class="chat">Escriban en el chat solo la letra. Avanzar muestra la respuesta.</p>
      <div class="clave porque step"><b>Respuesta: ${'ABCD'[d.ok]}.</b> ${d.pq}</div>
    </div><div class="marcador-host"></div></div>`,{duelo:'1'});
  });
}
function laminas(){
  const t=$('laminas'); if(!t)return;
  [...t.content.querySelectorAll('section')].forEach(s=>{s.classList.add('slide');$('deck').appendChild(s);});
}
function juego(){
  const j=CLASE.juego; if(!j)return;
  seccion(j.titulo,`<div class="inner">
    <div class="kicker">Cada uno en su celular</div>
    <h2>${j.titulo}</h2>
    <p>${j.texto}</p>
    <div class="enlace"><code class="url" data-ruta="juego/"></code><button class="btn sec copiar" type="button">Copiar enlace</button><a class="btn" data-abre="juego/" target="_blank" rel="noopener">Abrir</a>${j.cantar?'<a class="btn sec" data-abre="juego/?cantar" target="_blank" rel="noopener">Cantar el bingo</a>':''}</div>
    <div class="clave"><b>Cuando terminen:</b> escriban en el chat la palabra secreta y su tiempo. El primero gana 3 puntos, el segundo 2 y el tercero 1.</div>
  </div>`);
}
function casos(){
  seccion('¿Está bien o está mal?',`<div class="inner">
    <h2>¿Está bien o está mal?</h2>
    <p class="lead">Antes de tocar cada tarjeta, decidan si lo que está escrito es correcto.</p>
    <div class="casos" id="casos">${CASOS.map((c,i)=>`<div class="caso" data-i="${i}"><div class="expr">${c.e}</div>
      <button type="button">Ver respuesta</button><div class="ver"><b>${c.ok?'Está bien.':'Está mal.'}</b> ${c.w}</div></div>`).join('')}</div></div>`);
}
function podio(){
  seccion('Podio',`<div class="inner" style="text-align:center">
    <div class="kicker">Resultado final</div><h2>Podio del duelo</h2>
    <div class="podio" id="podio"></div>
    <div class="marcador-host" style="max-width:520px;margin:0 auto;text-align:left"></div></div>`);
}
function sigue(){
  const s=CLASE.sigue;
  seccion('Lo que sigue',`<div class="inner">
    <div class="kicker">Para cerrar</div><h2>${s.titulo}</h2>
    <div class="puente">
      <div class="card"><h3>Hoy aprendimos</h3><p style="margin:0">${s.hoy}</p></div>
      <div class="flecha">▶</div>
      <div class="card"><h3>La próxima clase</h3><p style="margin:0">${s.proxima}</p></div>
    </div></div>`);
}
function tarea(){
  seccion('Tarea',`<div class="inner">
    <h2>Tarea: ${TAREA.length} ejercicios</h2>
    <p>Resuelve en tu cuaderno, escribe en cada uno cómo llegaste a la respuesta, marca la opción correcta y envía la foto hoy.</p>
    <p><a class="btn" href="${CLASE.pdf}" download>Descargar la tarea en PDF</a></p>
    <div class="tarea">${TAREA.map((t,i)=>`<div class="t"><div class="q"><span class="n">${i+1}.</span>${t.enun}</div>
      <div class="o">${t.ops.map((o,k)=>`<span><b>${'abcd'[k]})</b>${o}</span>`).join('')}</div></div>`).join('')}</div></div>`);
}
portada(); retoma(); reglasDuelo(); ronda(1); laminas(); juego(); ronda(2); casos(); podio(); sigue(); tarea();

/* ---------- Marcador del duelo (solo en este navegador) ---------- */
const CLAVE_M='quimica-'+CLASE.num+'-marcador';
let jugadores=[];
try{jugadores=JSON.parse(localStorage.getItem(CLAVE_M))||[]}catch(e){}
function guardar(){try{localStorage.setItem(CLAVE_M,JSON.stringify(jugadores))}catch(e){}}
let ultimo=-1;
function marcadorHTML(){
  if(!jugadores.length)return '<div class="marcador"><h3>Marcador</h3><p class="vacio">Agreguen jugadores en la lámina «Duelo: cómo se juega».</p></div>';
  const max=Math.max(...jugadores.map(j=>j.p));
  return `<div class="marcador"><h3>Marcador</h3><p class="ayuda">Toquen el nombre del que ganó la pregunta.</p>${
    jugadores.map((j,i)=>`<div class="jug${max>0&&j.p===max?' lider':''}${i===ultimo?' pop':''}"><button class="sumar" type="button" data-i="${i}"><span>${esc(j.n)}</span><span class="pts">${j.p}</span></button><button class="menos" type="button" data-m="${i}" aria-label="Quitar un punto a ${esc(j.n)}">−1</button></div>`).join('')}</div>`;
}
function pintarMarcador(){
  document.querySelectorAll('.marcador-host').forEach(h=>h.innerHTML=marcadorHTML());
  $('listaAlta').innerHTML=jugadores.length?jugadores.map((j,i)=>`<span>${esc(j.n)}<button type="button" data-q="${i}" aria-label="Quitar a ${esc(j.n)}">✕</button></span>`).join(''):'<p class="vacio" style="margin:0">Todavía no hay jugadores.</p>';
  const orden=[...jugadores].sort((a,b)=>b.p-a.p);
  const puesto=[[1,'#C0C9CE',110],[0,'#FFC800',150],[2,'#D08C55',80]];
  $('podio').innerHTML=orden.length?puesto.filter(([k])=>orden[k]).map(([k,c,h])=>
    `<div><div class="nom">${esc(orden[k].n)}</div><div class="p">${orden[k].p} ${orden[k].p===1?'punto':'puntos'}</div><div class="bloque" style="background:${c};height:${h}px">${k+1}</div></div>`).join(''):'';
  ultimo=-1;
}
document.addEventListener('click',e=>{
  const s=e.target.closest('.sumar'), m=e.target.closest('.menos'), q=e.target.closest('[data-q]');
  if(s){jugadores[+s.dataset.i].p++;ultimo=+s.dataset.i;tono(660,.12);setTimeout(()=>tono(880,.15),110);guardar();pintarMarcador();}
  else if(m){const j=jugadores[+m.dataset.m];j.p=Math.max(0,j.p-1);guardar();pintarMarcador();}
  else if(q){jugadores.splice(+q.dataset.q,1);guardar();pintarMarcador();}
});
function agregar(){const v=$('nuevo').value.trim(); if(!v)return; jugadores.push({n:v,p:0}); $('nuevo').value=''; guardar(); pintarMarcador(); $('nuevo').focus();}
$('bAgregar').onclick=agregar;
$('nuevo').addEventListener('keydown',e=>{if(e.key==='Enter')agregar();});
$('bReiniciar').onclick=()=>{if(confirm('¿Poner todos los puntos en cero?')){jugadores.forEach(j=>j.p=0);guardar();pintarMarcador();}};

/* Sonido corto (solo se oye si se comparte el audio de la pestaña) */
let actx=null;
function tono(f,d){try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();
  const o=actx.createOscillator(),g=actx.createGain();o.frequency.value=f;o.type='triangle';
  g.gain.setValueAtTime(.18,actx.currentTime);g.gain.exponentialRampToValueAtTime(.001,actx.currentTime+d);
  o.connect(g).connect(actx.destination);o.start();o.stop(actx.currentTime+d);}catch(e){}}

/* ---------- Reloj del duelo ---------- */
let relojId=null;
function arrancarReloj(s){
  clearInterval(relojId);
  const r=s.querySelector('.reloj'); if(!r)return;
  if(s.querySelector('.porque.vis'))return;
  const ini=Date.now(), i=r.querySelector('i'), seg=r.querySelector('.seg');
  r.classList.remove('fin');
  relojId=setInterval(()=>{
    const q=Math.max(0,SEG-(Date.now()-ini)/1000);
    i.style.transform=`scaleX(${q/SEG})`; seg.textContent=Math.ceil(q)+' s';
    if(q<=0){clearInterval(relojId);r.classList.add('fin');seg.textContent='¡Tiempo!';tono(330,.4);}
  },200);
}

/* ---------- Enlace al juego ---------- */
document.querySelectorAll('.url').forEach(c=>{c.textContent=new URL(c.dataset.ruta,location.href).href;});
document.querySelectorAll('[data-abre]').forEach(a=>{a.href=new URL(a.dataset.abre,location.href).href;});
document.querySelectorAll('.copiar').forEach(b=>b.addEventListener('click',()=>{
  const t=b.parentElement.querySelector('.url').textContent;
  (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>{b.textContent='¡Copiado!';setTimeout(()=>b.textContent='Copiar enlace',1500);},()=>prompt('Copia el enlace:',t));
}));

/* ---------- Casos ---------- */
$('casos').addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b)return;
  const card=b.closest('.caso'); const c=CASOS[card.dataset.i];
  card.classList.add(c.ok?'si':'no'); b.remove();
});

/* ---------- Pizarra libre ---------- */
function crearPizarra(host){
  const COLORES=['#F4F1E8','#FFC800','#3BC97A','#4FB3E8','#FF6B6B'];
  const box=document.createElement('div'); box.className='pz';
  box.innerHTML=`<div class="pz-bar">
    ${COLORES.map((c,i)=>`<button class="col${i?'':' on'}" data-c="${c}" style="background:${c}" aria-label="Color ${i+1}"></button>`).join('')}
    <span class="sep"></span>
    <button data-g="3">Fino</button><button data-g="5" class="on">Medio</button><button data-g="9">Grueso</button>
    <span class="sep"></span>
    <button data-borr>Borrador</button>
    <span class="der"><button data-undo>Deshacer</button><button data-clear>Limpiar</button></span>
  </div><canvas></canvas>`;
  host.appendChild(box);
  const cv=box.querySelector('canvas'), ctx=cv.getContext('2d');
  const st={color:COLORES[0],g:5,borr:false,trazos:[],actual:null};
  function ajustar(){
    const r=cv.getBoundingClientRect(); if(!r.width)return;
    const dpr=window.devicePixelRatio||1;
    cv.width=Math.round(r.width*dpr); cv.height=Math.round(r.height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0); dibujar();
  }
  function trazo(t,w){
    ctx.globalCompositeOperation=t.borr?'destination-out':'source-over';
    ctx.strokeStyle=t.color; ctx.lineWidth=t.borr?t.g*5:t.g; ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.beginPath();
    t.p.forEach(([x,y],k)=>k?ctx.lineTo(x*w,y*w):ctx.moveTo(x*w,y*w));
    if(t.p.length===1)ctx.lineTo(t.p[0][0]*w+.1,t.p[0][1]*w);
    ctx.stroke();
  }
  function dibujar(){
    const w=cv.getBoundingClientRect().width;
    ctx.clearRect(0,0,cv.width,cv.height);
    st.trazos.forEach(t=>trazo(t,w));
    ctx.globalCompositeOperation='source-over';
  }
  function pos(e){const r=cv.getBoundingClientRect();return[(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.width];}
  cv.addEventListener('pointerdown',e=>{if(e.button>0)return;cv.setPointerCapture(e.pointerId);
    st.actual={color:st.color,g:st.g,borr:st.borr,p:[pos(e)]};st.trazos.push(st.actual);dibujar();});
  cv.addEventListener('pointermove',e=>{if(!st.actual)return;
    (e.getCoalescedEvents?e.getCoalescedEvents():[e]).forEach(ev=>st.actual.p.push(pos(ev)));dibujar();});
  const fin=()=>{st.actual=null};
  cv.addEventListener('pointerup',fin); cv.addEventListener('pointercancel',fin);
  box.querySelector('.pz-bar').addEventListener('click',e=>{
    const b=e.target.closest('button'); if(!b)return;
    if(b.dataset.c){st.color=b.dataset.c;st.borr=false;
      box.querySelectorAll('[data-c],[data-borr]').forEach(x=>x.classList.remove('on'));b.classList.add('on');}
    else if(b.dataset.g){st.g=+b.dataset.g;box.querySelectorAll('[data-g]').forEach(x=>x.classList.remove('on'));b.classList.add('on');}
    else if('borr' in b.dataset){st.borr=true;box.querySelectorAll('[data-c]').forEach(x=>x.classList.remove('on'));b.classList.add('on');}
    else if('undo' in b.dataset){st.trazos.pop();dibujar();}
    else if('clear' in b.dataset){if(st.trazos.length&&confirm('¿Borrar toda la pizarra?')){st.trazos=[];dibujar();}}
  });
  new ResizeObserver(ajustar).observe(cv);
  return {ajustar};
}
let libre=null;
function toggleLibre(){
  const L=$('libre');
  if(!libre)libre=crearPizarra(L);
  L.classList.toggle('on');
  $('bLibre').textContent=L.classList.contains('on')?'Cerrar pizarra':'Pizarra';
  libre.ajustar();
}
$('bLibre').onclick=toggleLibre;
function toggleFull(){
  if(document.fullscreenElement)document.exitFullscreen();
  else document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen();
}
$('bFull').onclick=toggleFull;
document.addEventListener('fullscreenchange',()=>{$('bFull').textContent=document.fullscreenElement?'Salir de pantalla completa':'Pantalla completa';});

/* ---------- Navegación ---------- */
pintarMarcador();
const slides=[...document.querySelectorAll('.slide')];
let cur=0;
function ir(n){
  cur=Math.max(0,Math.min(slides.length-1,n));
  slides.forEach((s,i)=>s.classList.toggle('on',i===cur));
  slides[cur].scrollTop=0;
  $('cnt').textContent=`${cur+1} / ${slides.length}`;
  $('prog').style.width=(cur/(slides.length-1)*100)+'%';
  $('bAnt').disabled=cur===0;
  $('bSig').disabled=cur===slides.length-1 && !slides[cur].querySelector('.step:not(.vis)');
  [...$('indice').children].forEach((b,i)=>b.classList.toggle('act',i===cur));
  clearInterval(relojId);
  if(slides[cur].dataset.duelo)arrancarReloj(slides[cur]);
  try{history.replaceState(null,'','#'+(cur+1))}catch(e){}
}
function avanzar(){
  const oculto=slides[cur].querySelector('.step:not(.vis)');
  if(oculto){oculto.classList.add('vis');
    if(oculto.classList.contains('porque')){clearInterval(relojId);slides[cur].querySelector('.zona').classList.add('revelada');}
    oculto.scrollIntoView({block:'nearest',behavior:'smooth'});return;}
  ir(cur+1);
}
function retroceder(){
  const vistos=slides[cur].querySelectorAll('.step.vis');
  if(vistos.length){const v=vistos[vistos.length-1];v.classList.remove('vis');
    if(v.classList.contains('porque'))slides[cur].querySelector('.zona').classList.remove('revelada');return;}
  ir(cur-1);
}
$('bSig').onclick=avanzar; $('bAnt').onclick=retroceder;
$('indice').innerHTML=slides.map((s,i)=>`<button type="button" data-i="${i}">${i+1}. ${esc(s.dataset.titulo||'')}</button>`).join('');
$('indice').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;ir(+b.dataset.i);$('indice').classList.remove('on');});
$('bInd').onclick=()=>$('indice').classList.toggle('on');
document.addEventListener('keydown',e=>{
  if(e.target.closest('input,textarea'))return;
  if(['ArrowRight','PageDown'].includes(e.key)){e.preventDefault();avanzar();}
  else if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();retroceder();}
  else if(e.key==='p'||e.key==='P')toggleLibre();
  else if(e.key==='f'||e.key==='F')toggleFull();
  else if(e.key==='Escape'){$('indice').classList.remove('on');if($('libre').classList.contains('on'))toggleLibre();}
});
const h=parseInt(location.hash.slice(1));
ir(h>0?h-1:0);
