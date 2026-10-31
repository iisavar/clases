/* Juegos en el celular. Cada clase trae JUEGOS (bancos.js): una lista de juegos, cada uno con su modo.
   Todos terminan igual: palabra secreta y tiempo para escribir en el chat. Nada se guarda en servidor. */
const $=id=>document.getElementById(id);
const azar=a=>a[Math.floor(Math.random()*a.length)];
const mezcla=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;};
const plano=s=>String(s).replace(/<[^>]+>/g,'');

/* ---------- Armazón común ---------- */
let J=null, ini=0, tick=null;
function pantalla(html){$('zona').innerHTML=html;window.scrollTo(0,0);}
function marca(html){$('marca').innerHTML=html;}
function pararReloj(){clearInterval(tick);tick=null;$('reloj').textContent='';$('reloj').classList.remove('poco');}
function relojRegresivo(seg,alAcabar){
  const fin=Date.now()+seg*1000;
  const pinta=()=>{
    const q=Math.max(0,Math.ceil((fin-Date.now())/1000));
    $('reloj').textContent=`${Math.floor(q/60)}:${String(q%60).padStart(2,'0')}`;
    $('reloj').classList.toggle('poco',q<=15);
    if(q<=0){pararReloj();alAcabar();}
  };
  clearInterval(tick);tick=setInterval(pinta,250);pinta();
}
function perder(txt){
  pararReloj();
  pantalla(`<h2>Se acabó el tiempo</h2><p>${txt||'Se puede intentar otra vez.'}</p><button class="btn" id="otra">Intentar de nuevo</button>`);
  $('otra').onclick=()=>abrir(J);
}
function ganar(extra){
  pararReloj();
  const s=Math.floor((Date.now()-ini)/1000);
  pantalla(`<div class="kicker">Lo lograste</div><div class="palabra">${J.palabra}</div>
    <p>Tu tiempo: <b>${Math.floor(s/60)} min ${s%60} s</b>${extra?`<br>${extra}`:''}</p>
    <p>Escribe en el chat <b>${J.palabra}</b> y tu tiempo.</p>
    ${JUEGOS.length>1?'<button class="btn sec" id="volver">Ver los otros juegos</button>':''}`);
  if($('volver'))$('volver').onclick=menu;
}
function pista(html){const p=$('pista');p.hidden=false;p.innerHTML=html;}
function barraAvance(a,t){marca(`<span class="cuenta">${a} de ${t}</span>`);}

function abrir(j){
  J=j;ini=Date.now();pararReloj();$('tope').hidden=false;marca('');
  if(j.minutos)relojRegresivo(j.minutos*60,()=>perder());
  MODOS[j.modo](j);
}
function menu(){
  pararReloj();$('tope').hidden=true;
  if(JUEGOS.length===1){
    const j=JUEGOS[0];
    pantalla(`<h1>${j.titulo}</h1><p>${j.texto}</p><button class="btn" id="b0">Empezar</button>`);
    $('b0').onclick=()=>abrir(j);return;
  }
  pantalla(`<h1>Juegos</h1><div class="menu">${JUEGOS.map((j,i)=>`<button class="tarjeta" data-i="${i}"><b>${j.titulo}</b><span>${j.texto}</span></button>`).join('')}</div>`);
  document.querySelectorAll('.tarjeta').forEach(b=>b.onclick=()=>abrir(JUEGOS[+b.dataset.i]));
}

const MODOS={};

/* ---------- Candados: retos en cadena, cada uno da una letra ---------- */
MODOS.candados=j=>{
  const L=[...j.palabra]; let i=0, reto=null;
  const letras=()=>marca(`<div class="letras">${L.map((l,k)=>`<span class="${k<i?'ok':''}">${k<i?l:'?'}</span>`).join('')}</div>`);
  const fallar=()=>pista(`<b>Todavía no.</b> ${reto.pista}`);
  function abierto(){
    i++;letras();
    if(i>=j.retos.length)return ganar();
    pantalla(`<div class="letra">${L[i-1]}</div><h2>¡Candado abierto!</h2><button class="btn" id="sig">Siguiente reto</button>`);
    $('sig').onclick=pintar;
  }
  function pintar(){
    reto={...j.retos[i],...azar(j.retos[i].variantes)};
    const cab=`<div class="kicker">Reto ${i+1} de ${j.retos.length}</div><h2>${reto.q}</h2>`, pie='<p class="pista" id="pista" hidden></p>';
    if(reto.tipo==='opciones'){
      reto.mez=mezcla(reto.ops.map((t,k)=>({t,ok:k===reto.ok})));
      pantalla(cab+`<div class="ops">${reto.mez.map((o,k)=>`<button class="op" data-k="${k}">${o.t}</button>`).join('')}</div>`+pie);
      document.querySelectorAll('.op').forEach(b=>b.onclick=()=>reto.mez[+b.dataset.k].ok?abierto():fallar());
    }else if(reto.tipo==='marcar'){
      reto.mez=mezcla(reto.items);
      pantalla(cab+`<div class="ops">${reto.mez.map((o,k)=>`<button class="op" data-k="${k}" aria-pressed="false">${o.t}</button>`).join('')}</div><button class="btn" id="ok">Comprobar</button>`+pie);
      document.querySelectorAll('.op').forEach(b=>b.onclick=()=>b.setAttribute('aria-pressed',b.getAttribute('aria-pressed')==='true'?'false':'true'));
      $('ok').onclick=()=>[...document.querySelectorAll('.op')].every(b=>(b.getAttribute('aria-pressed')==='true')===reto.mez[+b.dataset.k].si)?abierto():fallar();
    }else if(reto.tipo==='ordenar'){
      reto.mez=mezcla(reto.pasos);reto.va=[];
      pantalla(cab+`<p class="ayuda">Toca los pasos en orden, del primero al último.</p><ol class="orden" id="orden"></ol><div class="ops">${reto.mez.map((t,k)=>`<button class="op" data-k="${k}">${t}</button>`).join('')}</div><button class="btn sec" id="otra">Empezar de nuevo</button>`+pie);
      document.querySelectorAll('.op').forEach(b=>b.onclick=()=>{
        b.disabled=true;reto.va.push(reto.mez[+b.dataset.k]);
        $('orden').innerHTML=reto.va.map(t=>`<li>${t}</li>`).join('');
        if(reto.va.length===reto.pasos.length){reto.va.every((t,k)=>t===reto.pasos[k])?abierto():fallar();}
      });
      $('otra').onclick=()=>{reto.va=[];$('orden').innerHTML='';document.querySelectorAll('.op').forEach(b=>b.disabled=false);};
    }else{
      pantalla(cab+`<div class="fila"><input id="num" inputmode="decimal" autocomplete="off" aria-label="Tu respuesta"><span>${reto.unidad||''}</span></div><button class="btn" id="ok">Comprobar</button>`+pie);
      $('ok').onclick=()=>{const v=parseFloat($('num').value.replace(',','.'));Math.abs(v-reto.r)<=(reto.tol||0)?abierto():fallar();};
    }
  }
  letras();pintar();
};

/* ---------- Clasificar: cada tarjeta va a su canasta ---------- */
MODOS.clasificar=j=>{
  const cola=mezcla(j.cartas), total=cola.length; let hechas=0, errores=0;
  function pintar(msg){
    if(!cola.length)return ganar(`Errores: <b>${errores}</b>`);
    barraAvance(hechas,total);
    const c=cola[0];
    pantalla(`<div class="kicker">¿A dónde va?</div><div class="carta">${c.t}</div>
      <div class="canastas" style="--n:${j.cestas.length}">${j.cestas.map((t,k)=>`<button class="op" data-k="${k}">${t}</button>`).join('')}</div>
      <p class="pista" id="pista" ${msg?'':'hidden'}>${msg||''}</p>`);
    document.querySelectorAll('.canastas .op').forEach(b=>b.onclick=()=>{
      if(+b.dataset.k===c.c){cola.shift();hechas++;pintar();}
      else{errores++;cola.push(cola.shift());pintar(`<b>No era ahí.</b> «${c.t}»: ${c.pq}`);}
    });
  }
  pintar();
};

/* ---------- Parejas: memoria de pares ---------- */
MODOS.parejas=j=>{
  const fichas=mezcla(j.pares.flatMap((p,k)=>[{t:p[0],k},{t:p[1],k}]));
  let abierta=null, ok=0, intentos=0, bloqueo=false;
  barraAvance(0,j.pares.length);
  pantalla(`<div class="kicker">Encuentra las parejas</div><div class="memoria">${fichas.map((f,i)=>`<button class="ficha" data-i="${i}" aria-label="Ficha ${i+1}"></button>`).join('')}</div>`);
  document.querySelectorAll('.ficha').forEach(b=>b.onclick=()=>{
    const f=fichas[+b.dataset.i];
    if(bloqueo||b.classList.contains('vista'))return;
    b.classList.add('vista');b.innerHTML=f.t;
    if(!abierta){abierta=b;return;}
    intentos++;
    const a=abierta, g=fichas[+a.dataset.i];abierta=null;
    if(g.k===f.k){
      ok++;a.classList.add('par');b.classList.add('par');barraAvance(ok,j.pares.length);
      if(ok===j.pares.length)setTimeout(()=>ganar(`Intentos: <b>${intentos}</b>`),500);
    }else{bloqueo=true;setTimeout(()=>{[a,b].forEach(x=>{x.classList.remove('vista');x.innerHTML='';});bloqueo=false;},1100);}
  });
};

/* ---------- ¿Quién soy?: menos pistas, más puntos ---------- */
MODOS.quiensoy=j=>{
  const casos=mezcla(j.casos); let i=0, pts=0;
  function pintar(){
    if(i>=casos.length)return ganar(`Puntos: <b>${pts}</b> de ${casos.length*casos[0].pistas.length}`);
    const c=casos[i]; let vistas=1;
    const mez=mezcla(c.ops.map((t,k)=>({t,ok:k===0})));
    marca(`<span class="cuenta">${pts} puntos</span>`);
    const pinta=()=>{
      const vale=c.pistas.length-vistas+1;
      pantalla(`<div class="kicker">Caso ${i+1} de ${casos.length}, vale ${vale} ${vale===1?'punto':'puntos'}</div>
        <div class="pistas">${c.pistas.slice(0,vistas).map(p=>`<p>${p}</p>`).join('')}</div>
        ${vistas<c.pistas.length?'<button class="btn sec" id="mas">Ver otra pista</button>':''}
        <div class="ops" style="margin-top:14px">${mez.map((o,k)=>`<button class="op" data-k="${k}">${o.t}</button>`).join('')}</div>`);
      if($('mas'))$('mas').onclick=()=>{vistas++;pinta();};
      document.querySelectorAll('.op').forEach(b=>b.onclick=()=>{
        if(mez[+b.dataset.k].ok){pts+=vale;i++;pintar();}
        else if(vistas<c.pistas.length){vistas++;pinta();}
        else{b.disabled=true;}
      });
    };
    pinta();
  }
  pintar();
};

/* ---------- Contrarreloj: verdadero o falso, cada error resta segundos ---------- */
MODOS.contrarreloj=j=>{
  let cola=mezcla(j.frases), pts=0, racha=0, fin=Date.now()+j.seg*1000;
  const pinTiempo=()=>{
    const q=Math.max(0,Math.ceil((fin-Date.now())/1000));
    $('reloj').textContent=q+' s';$('reloj').classList.toggle('poco',q<=10);
    if(q<=0){pararReloj();perder(`Hiciste ${pts} de ${j.meta} puntos.`);}
  };
  tick=setInterval(pinTiempo,200);pinTiempo();
  function pintar(msg){
    if(!cola.length)cola=mezcla(j.frases);
    const f=cola.pop();
    marca(`<span class="cuenta">${pts} de ${j.meta}</span>${racha>1?`<span class="racha">Racha ${racha}</span>`:''}`);
    pantalla(`<div class="carta">${f.t}</div><div class="vf"><button class="op" data-v="1">Verdadero</button><button class="op" data-v="0">Falso</button></div><p class="pista" id="pista" ${msg?'':'hidden'}>${msg||''}</p>`);
    document.querySelectorAll('.vf .op').forEach(b=>b.onclick=()=>{
      if((b.dataset.v==='1')===f.v){pts++;racha++;if(pts>=j.meta)return ganar();pintar();}
      else{racha=0;fin-=5000;pintar(`<b>Menos 5 segundos.</b> ${f.pq}`);}
    });
  }
  pintar();
};

/* ---------- El vaso: adivina la palabra antes de que se vacíe ---------- */
MODOS.vaso=j=>{
  const VIDAS=6, lista=mezcla(j.palabras); let i=0;
  function pintar(){
    if(i>=lista.length)return ganar();
    barraAvance(i,lista.length);
    const w=lista[i], p=w.p; let vistas=new Set(), fallos=0;
    const pinta=()=>{
      const nivel=Math.round((VIDAS-fallos)/VIDAS*100);
      pantalla(`<div class="kicker">No dejes que se vacíe el vaso</div>
        <div class="vaso"><i style="height:${nivel}%"></i></div>
        <p class="ayuda" style="text-align:center">${w.pista}</p>
        <div class="oculta">${[...p].map(l=>`<span>${vistas.has(l)?l:''}</span>`).join('')}</div>
        <div class="teclas">${[...'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'].map(l=>`<button data-l="${l}" ${vistas.has(l)||vistas.has('-'+l)?'disabled':''}>${l}</button>`).join('')}</div>`);
      document.querySelectorAll('.teclas button').forEach(b=>b.onclick=()=>{
        const l=b.dataset.l;
        if(p.includes(l)){vistas.add(l);if([...p].every(c=>vistas.has(c))){i++;return setTimeout(pintar,350),pinta();}}
        else{vistas.add('-'+l);fallos++;if(fallos>=VIDAS){pantalla(`<h2>Se vació el vaso</h2><p>La palabra era <b>${p}</b>.</p><button class="btn" id="otra">Otra palabra</button>`);lista.push(lista.splice(i,1)[0]);$('otra').onclick=pintar;return;}}
        pinta();
      });
    };
    pinta();
  }
  pintar();
};

/* ---------- Sopa de letras: toca la primera y la última letra ---------- */
MODOS.sopa=j=>{
  const N=j.lado||10, DIR=[[0,1],[1,0],[1,1],[-1,1]];
  const g=Array.from({length:N},()=>Array(N).fill(''));
  const lista=[...j.palabras].sort((a,b)=>b.p.length-a.p.length);
  lista.forEach(w=>{
    for(let t=0;t<500;t++){
      const [df,dc]=azar(DIR), f=Math.floor(Math.random()*N), c=Math.floor(Math.random()*N);
      const celdas=[...w.p].map((l,k)=>[f+df*k,c+dc*k,l]);
      if(celdas.every(([a,b,l])=>a>=0&&b>=0&&a<N&&b<N&&(!g[a][b]||g[a][b]===l))){celdas.forEach(([a,b,l])=>g[a][b]=l);return;}
    }
    throw new Error('No cupo '+w.p);
  });
  const ABC='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  g.forEach(r=>r.forEach((v,c)=>{if(!v)r[c]=azar([...ABC]);}));
  let ini1=null, hallas=new Set();
  const lineas=(a,b)=>{
    const df=Math.sign(b[0]-a[0]), dc=Math.sign(b[1]-a[1]), n=Math.max(Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]));
    if(!(a[0]===b[0]||a[1]===b[1]||Math.abs(b[0]-a[0])===Math.abs(b[1]-a[1])))return null;
    return Array.from({length:n+1},(_,k)=>[a[0]+df*k,a[1]+dc*k]);
  };
  barraAvance(0,lista.length);
  pantalla(`<div class="kicker">Toca la primera letra y luego la última</div>
    <div class="sopa" style="--n:${N}">${g.map((r,f)=>r.map((l,c)=>`<button data-f="${f}" data-c="${c}">${l}</button>`).join('')).join('')}</div>
    <ol class="pistas-sopa">${j.palabras.map((w,k)=>`<li data-k="${k}">${w.pista}</li>`).join('')}</ol>`);
  const celda=(f,c)=>document.querySelector(`.sopa [data-f="${f}"][data-c="${c}"]`);
  document.querySelectorAll('.sopa button').forEach(b=>b.onclick=()=>{
    const p=[+b.dataset.f,+b.dataset.c];
    if(!ini1){ini1=p;b.classList.add('sel');return;}
    celda(...ini1).classList.remove('sel');
    const cs=lineas(ini1,p);ini1=null;if(!cs)return;
    const txt=cs.map(([f,c])=>g[f][c]).join(''), rev=[...txt].reverse().join('');
    const k=j.palabras.findIndex(w=>w.p===txt||w.p===rev);
    if(k>=0&&!hallas.has(k)){
      hallas.add(k);cs.forEach(([f,c])=>celda(f,c).classList.add('hallada'));
      const li=document.querySelector(`.pistas-sopa [data-k="${k}"]`);li.classList.add('hecha');li.innerHTML=`<b>${j.palabras[k].p}</b>`;
      barraAvance(hallas.size,lista.length);
      if(hallas.size===lista.length)setTimeout(ganar,500);
    }
  });
};

/* ---------- Carrera: cada acierto avanza; el rival avanza con el tiempo ---------- */
MODOS.carrera=j=>{
  const cola=mezcla(j.preguntas), total=j.meta||cola.length; let a=0;
  const fin=Date.now()+j.seg*1000, base=Date.now();
  const pistaC=()=>{
    const r=Math.min(1,(Date.now()-base)/(fin-base));
    const q=$('rival');if(q)q.style.left=`calc(${r*100}% - ${r*30}px)`;
    if(r>=1){pararReloj();perder(`El rival llegó primero. Tú ibas en ${a} de ${total}.`);}
  };
  tick=setInterval(pistaC,200);
  function pintar(msg){
    const p=cola[0], mez=mezcla(p.ops.map((t,k)=>({t,ok:k===0})));
    barraAvance(a,total);
    pantalla(`<div class="pista-carrera"><div class="carril"><span class="auto yo" style="left:calc(${a/total*100}% - ${a/total*30}px)"></span></div><div class="carril"><span class="auto" id="rival"></span></div></div>
      <h2>${p.q}</h2><div class="ops">${mez.map((o,k)=>`<button class="op" data-k="${k}">${o.t}</button>`).join('')}</div>
      <p class="pista" id="pista" ${msg?'':'hidden'}>${msg||''}</p>`);
    pistaC();
    document.querySelectorAll('.op').forEach(b=>b.onclick=()=>{
      if(mez[+b.dataset.k].ok){cola.shift();a++;if(a>=total)return ganar();pintar();}
      else{cola.push(cola.shift());pintar(`<b>Pierdes tiempo.</b> ${p.pq||'Esa no era.'}`);}
    });
  }
  pintar();
};

/* ---------- Balanza: coeficientes hasta igualar los átomos ---------- */
MODOS.balanza=j=>{
  const lista=mezcla(j.ecuaciones); let i=0;
  const mcd=(a,b)=>b?mcd(b,a%b):a;
  function pintar(){
    if(i>=lista.length)return ganar();
    barraAvance(i,lista.length);
    const e=lista[i], todos=[...e.reactivos,...e.productos], co=todos.map(()=>1);
    const cuenta=lado=>{
      const off=lado===e.reactivos?0:e.reactivos.length, t={};
      lado.forEach((s,k)=>Object.entries(s.at).forEach(([el,n])=>t[el]=(t[el]||0)+n*co[off+k]));return t;
    };
    const parte=(lado,off)=>lado.map((s,k)=>`<span class="sust"><span class="pasos-c"><button data-m="-1" data-i="${off+k}" aria-label="Quitar">−</button><b>${co[off+k]}</b><button data-m="1" data-i="${off+k}" aria-label="Sumar">+</button></span><span class="fm">${s.f}</span></span>`).join('<span class="mas">+</span>');
    const pinta=()=>{
      const r=cuenta(e.reactivos), p=cuenta(e.productos), els=Object.keys(r);
      const igual=els.every(x=>r[x]===p[x]);
      const max=Math.max(...els.flatMap(x=>[r[x],p[x]]));
      pantalla(`<div class="kicker">Equilibra la ecuación</div>
        <div class="ecuacion">${parte(e.reactivos,0)}<span class="mas">→</span>${parte(e.productos,e.reactivos.length)}</div>
        <div class="atomos">${els.map(x=>`<div class="fila-at${r[x]===p[x]?' igual':''}"><span class="b izq"><i style="width:${r[x]/max*100}%"></i></span><b>${r[x]} ${x} ${p[x]}</b><span class="b"><i style="width:${p[x]/max*100}%"></i></span></div>`).join('')}</div>
        <button class="btn" id="ok" ${igual?'':'disabled'}>Comprobar</button><p class="pista" id="pista" hidden></p>`);
      document.querySelectorAll('.pasos-c button').forEach(b=>b.onclick=()=>{const k=+b.dataset.i;co[k]=Math.max(1,Math.min(12,co[k]+ +b.dataset.m));pinta();});
      $('ok').onclick=()=>{
        if(co.reduce(mcd)>1)return pista('<b>Casi.</b> Está igualada, pero hay que usar los números más pequeños posibles.');
        i++;pintar();
      };
    };
    pinta();
  }
  pintar();
};

/* ---------- Deslizador: mueve las perillas hasta dar en la meta ---------- */
MODOS.deslizador=j=>{
  let i=0;
  function pintar(){
    if(i>=j.misiones.length)return ganar();
    barraAvance(i,j.misiones.length);
    const m=j.misiones[i], val={};m.vars.forEach(v=>val[v.n]=v.ini);
    const f=new Function(...m.vars.map(v=>v.n),'return '+m.expr);
    pantalla(`<div class="kicker">Misión ${i+1} de ${j.misiones.length}</div><h2>${m.q}</h2>
      ${m.vars.map(v=>`<label class="perilla"><span>${v.et}: <b id="v-${v.n}"></b> ${v.u||''}</span><input type="range" data-n="${v.n}" min="${v.min}" max="${v.max}" step="${v.paso}" value="${v.ini}"></label>`).join('')}
      <div class="lectura"><span>${m.salida}</span><b id="sal"></b></div><button class="btn" id="ok">Comprobar</button><p class="pista" id="pista" hidden></p>`);
    const coma=x=>String(x).replace('.',',');
    const act=()=>{m.vars.forEach(v=>$('v-'+v.n).textContent=coma(val[v.n]));$('sal').textContent=`${coma(f(...m.vars.map(v=>val[v.n])).toFixed(m.dec??2))} ${m.u||''}`;};
    document.querySelectorAll('.perilla input').forEach(r=>r.oninput=()=>{val[r.dataset.n]=+r.value;act();});
    $('ok').onclick=()=>{const y=f(...m.vars.map(v=>val[v.n]));(y>=m.min&&y<=m.max)?(i++,pintar()):pista(`<b>Todavía no.</b> ${m.pista}`);};
    act();
  }
  pintar();
};

/* ---------- Armar: tocar piezas en orden, algunas sobran ---------- */
MODOS.armar=j=>{
  const lista=mezcla(j.retos); let i=0;
  function pintar(){
    if(i>=lista.length)return ganar();
    barraAvance(i,lista.length);
    const r=lista[i], mez=mezcla(r.piezas); let va=[];
    pantalla(`<div class="kicker">Reto ${i+1} de ${lista.length}</div><h2>${r.q}</h2>
      <div class="armado" id="armado"></div>
      <div class="piezas">${mez.map((t,k)=>`<button class="pieza" data-k="${k}">${t}</button>`).join('')}</div>
      <button class="btn sec" id="otra">Borrar</button><p class="pista" id="pista" hidden></p>`);
    document.querySelectorAll('.pieza').forEach(b=>b.onclick=()=>{
      b.disabled=true;va.push(mez[+b.dataset.k]);
      $('armado').innerHTML=va.map(t=>`<span>${t}</span>`).join('');
      if(va.length===r.sol.length){
        if(va.every((t,k)=>t===r.sol[k])){i++;setTimeout(pintar,450);}
        else pista(`<b>Todavía no.</b> ${r.pista}`);
      }
    });
    $('otra').onclick=()=>{va=[];$('armado').innerHTML='';$('pista').hidden=true;document.querySelectorAll('.pieza').forEach(b=>b.disabled=false);};
  }
  pintar();
};

/* ---------- Cacería en la tabla: toca el elemento que cumple la pista ---------- */
MODOS.tabla=j=>{
  const T=[['H','','','','','','','He'],['Li','Be','B','C','N','O','F','Ne'],['Na','Mg','Al','Si','P','S','Cl','Ar'],['K','Ca','Ga','Ge','As','Se','Br','Kr'],['Rb','Sr','In','Sn','Sb','Te','I','Xe'],['Cs','Ba','Tl','Pb','Bi','Po','At','Rn']];
  const G=[1,2,13,14,15,16,17,18], lista=mezcla(j.retos); let i=0, err=0;
  function pintar(msg){
    if(i>=lista.length)return ganar(`Errores: <b>${err}</b>`);
    barraAvance(i,lista.length);
    const r=lista[i];
    pantalla(`<h2>${r.q}</h2><div class="periodica"><span></span>${G.map(g=>`<span class="eje">${g}</span>`).join('')}
      ${T.map((f,n)=>`<span class="eje">${n+1}</span>`+f.map(s=>s?`<button data-s="${s}">${s}</button>`:'<span></span>').join('')).join('')}</div>
      <p class="pista" id="pista" ${msg?'':'hidden'}>${msg||''}</p>`);
    document.querySelectorAll('.periodica button').forEach(b=>b.onclick=()=>{
      if(b.dataset.s===r.r){i++;pintar();}else{err++;pintar(`<b>${b.dataset.s} no es.</b> ${r.pista}`);}
    });
  }
  pintar();
};

/* ---------- Bingo: el celular trae su cartón; el profesor canta desde ?cantar ---------- */
MODOS.bingo=j=>{
  const c=mezcla(j.fichas).slice(0,9), marcadas=new Set();
  const LIN=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  pantalla(`<div class="kicker">Marca lo que se cante. Tres en línea es bingo.</div>
    <div class="carton">${c.map((f,i)=>`<button data-i="${i}">${f.f}</button>`).join('')}</div>`);
  document.querySelectorAll('.carton button').forEach(b=>b.onclick=()=>{
    const i=+b.dataset.i;marcadas.has(i)?marcadas.delete(i):marcadas.add(i);b.classList.toggle('on');
    const lin=LIN.find(l=>l.every(x=>marcadas.has(x)));
    if(lin)ganar(`Tu línea: <b>${lin.map(x=>plano(c[x].f)).join(', ')}</b><br>Escríbela también: el profesor la comprobará.`);
  });
};
function cantar(j){
  $('tope').hidden=true;
  const cola=mezcla(j.fichas), dichas=[];
  function pinta(){
    pantalla(`<div class="kicker">Bingo: pantalla para cantar</div>
      <div class="carta">${dichas.length?dichas[dichas.length-1].n:'Toca Siguiente para empezar'}</div>
      <button class="btn" id="sig" ${cola.length?'':'disabled'}>Siguiente</button>
      <p class="ayuda" style="margin-top:16px">Van ${dichas.length} de ${j.fichas.length}</p>
      <div class="cantadas">${dichas.map(d=>`<span>${d.f}</span>`).join('')}</div>`);
    $('sig').onclick=()=>{dichas.push(cola.shift());pinta();};
  }
  pinta();
}

const bingo=JUEGOS.find(j=>j.modo==='bingo');
if(bingo&&new URLSearchParams(location.search).has('cantar'))cantar(bingo);else menu();
