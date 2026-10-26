/* Simulador de PSeInt para la clase: editor con colores y una ventana de ejecución que pide los datos de Leer.
   Interpreta un subconjunto: Algoritmo/FinAlgoritmo, Definir … Como, Leer, Escribir, <-, Si/SiNo/FinSi,
   Mientras/FinMientras, Para … Hasta … (Con Paso) … Hacer/FinPara, Repetir/Hasta Que. No es el programa real. */
(function(){
const EJEMPLOS={
  secuencial:`Algoritmo AreaRectangulo
	Definir base, altura, area Como Real
	Escribir "Ingrese la base:"
	Leer base
	Escribir "Ingrese la altura:"
	Leer altura
	area <- base * altura
	Escribir "El área es: ", area
FinAlgoritmo`,
  condicional:`Algoritmo AprobadoReprobado
	Definir nota Como Real
	Escribir "Ingrese la nota (0 a 100):"
	Leer nota
	Si nota >= 70 Entonces
		Escribir "Aprobado"
	SiNo
		Escribir "Reprobado"
	FinSi
FinAlgoritmo`,
  mientras:`Algoritmo SumarHastaCero
	Definir numero, suma Como Entero
	suma <- 0
	Escribir "Ingrese un número (0 para terminar):"
	Leer numero
	Mientras numero <> 0 Hacer
		suma <- suma + numero
		Escribir "Ingrese otro número (0 para terminar):"
		Leer numero
	FinMientras
	Escribir "La suma es: ", suma
FinAlgoritmo`,
  para:`Algoritmo TablaDeMultiplicar
	Definir n, i Como Entero
	Escribir "¿Qué tabla quiere ver?"
	Leer n
	Para i <- 1 Hasta 10 Con Paso 1 Hacer
		Escribir n, " x ", i, " = ", n * i
	FinPara
FinAlgoritmo`
};

const CLAVES=/^(Algoritmo|FinAlgoritmo|Proceso|FinProceso|Definir|Como|Entero|Real|Caracter|Logico|Leer|Escribir|Si|Entonces|SiNo|FinSi|Mientras|Hacer|FinMientras|Para|Hasta|Con|Paso|FinPara|Repetir|Que|Sin|Saltar|Y|O|NO|MOD|Verdadero|Falso)$/i;

function esc(s){return s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}

function colorear(src){
  return src.split('\n').map(l=>{
    let out='',m,r=l;
    while(r.length){
      if((m=r.match(/^\/\/.*/))){out+=`<span class="ps-com">${esc(m[0])}</span>`;}
      else if((m=r.match(/^"[^"]*"?/))){out+=`<span class="ps-str">${esc(m[0])}</span>`;}
      else if((m=r.match(/^\d+(\.\d+)?/))){out+=`<span class="ps-num">${m[0]}</span>`;}
      else if((m=r.match(/^[A-Za-zÁÉÍÓÚáéíóúÑñ_]\w*/))){out+=CLAVES.test(m[0])?`<span class="ps-kw">${m[0]}</span>`:esc(m[0]);}
      else {m=[r[0]];out+=esc(r[0]);}
      r=r.slice(m[0].length);
    }
    return out||' ';
  }).join('\n');
}

/* ---------- Expresiones: de PSeInt a JavaScript, solo con variables conocidas ---------- */
function expr(txt,V,linea){
  const toks=txt.match(/"[^"]*"|\d+(?:\.\d+)?|[A-Za-zÁÉÍÓÚáéíóúÑñ_]\w*|<>|<=|>=|<-|[-+*/^%()=<>,]/g)||[];
  let js='';
  for(const t of toks){
    const u=t.toUpperCase();
    if(t[0]==='"')js+=JSON.stringify(t.slice(1,-1));
    else if(/^\d/.test(t))js+=t;
    else if(u==='Y')js+='&&';
    else if(u==='O')js+='||';
    else if(u==='NO')js+='!';
    else if(u==='MOD')js+='%';
    else if(u==='VERDADERO')js+='true';
    else if(u==='FALSO')js+='false';
    else if(u==='RAIZ'||u==='RC')js+='Math.sqrt';
    else if(u==='ABS')js+='Math.abs';
    else if(u==='TRUNC')js+='Math.trunc';
    else if(u==='REDON')js+='Math.round';
    else if(t==='=')js+='==';
    else if(t==='<>')js+='!=';
    else if(t==='^')js+='**';
    else if(/^[A-Za-zÁÉÍÓÚáéíóúÑñ_]/.test(t)){
      const k=t.toLowerCase();
      if(!(k in V))throw new Error(`Línea ${linea}: la variable «${t}» no tiene valor todavía.`);
      js+=`V[${JSON.stringify(k)}]`;
    }
    else js+=t;
  }
  try{return Function('V','"use strict";return ('+js+');')(V);}
  catch(e){throw new Error(`Línea ${linea}: no entiendo la expresión «${txt.trim()}».`);}
}

/* Parte «a, "b", c» por comas que no están dentro de comillas ni paréntesis */
function partes(s){
  const r=[];let d=0,q=false,cur='';
  for(const c of s){
    if(c==='"')q=!q;
    if(!q&&c==='(')d++;
    if(!q&&c===')')d--;
    if(!q&&d===0&&c===','){r.push(cur);cur='';}else cur+=c;
  }
  if(cur.trim())r.push(cur);
  return r;
}

/* ---------- Árbol del programa ---------- */
function analizar(src){
  const L=src.split('\n').map((t,i)=>({t:t.replace(/\/\/.*$/,'').trim(),n:i+1})).filter(x=>x.t);
  let i=0;
  function bloque(fin){
    const out=[];
    while(i<L.length){
      const {t,n}=L[i];
      if(fin.some(f=>f.test(t)))return out;
      i++;
      let m;
      if(/^(Algoritmo|Proceso)\b/i.test(t)||/^(FinAlgoritmo|FinProceso)$/i.test(t))continue;
      if(/^Definir\b/i.test(t))continue;
      if((m=t.match(/^Leer\s+(.+)$/i))){out.push({k:'leer',vars:m[1].split(',').map(v=>v.trim().toLowerCase()),nombres:m[1].split(',').map(v=>v.trim()),n});continue;}
      if((m=t.match(/^Escribir\s+(.+?)(\s+Sin\s+Saltar)?;?$/i))){out.push({k:'esc',items:partes(m[1]),n});continue;}
      if((m=t.match(/^Si\s+(.+)\s+Entonces$/i))){
        const si=bloque([/^SiNo$/i,/^FinSi$/i]);let no=[];
        if(i<L.length&&/^SiNo$/i.test(L[i].t)){i++;no=bloque([/^FinSi$/i]);}
        if(i>=L.length)throw new Error(`Línea ${n}: falta FinSi.`);
        i++;out.push({k:'si',c:m[1],si,no,n});continue;
      }
      if((m=t.match(/^Mientras\s+(.+)\s+Hacer$/i))){
        const b=bloque([/^FinMientras$/i]);if(i>=L.length)throw new Error(`Línea ${n}: falta FinMientras.`);
        i++;out.push({k:'mientras',c:m[1],b,n});continue;
      }
      if((m=t.match(/^Para\s+(\w+)\s*<-\s*(.+?)\s+Hasta\s+(.+?)(?:\s+Con\s+Paso\s+(.+?))?\s+Hacer$/i))){
        const b=bloque([/^FinPara$/i]);if(i>=L.length)throw new Error(`Línea ${n}: falta FinPara.`);
        i++;out.push({k:'para',v:m[1].toLowerCase(),a:m[2],h:m[3],p:m[4]||'1',b,n});continue;
      }
      if(/^Repetir$/i.test(t)){
        const b=bloque([/^Hasta\s+Que\b/i]);if(i>=L.length)throw new Error(`Línea ${n}: falta Hasta Que.`);
        const c=L[i].t.replace(/^Hasta\s+Que\s+/i,'');i++;out.push({k:'repetir',c,b,n});continue;
      }
      if((m=t.match(/^(\w+)\s*(<-|=)\s*(.+?);?$/))){out.push({k:'asig',v:m[1].toLowerCase(),e:m[3],n});continue;}
      throw new Error(`Línea ${n}: no reconozco «${t}».`);
    }
    return out;
  }
  const prog=bloque([]);
  return prog;
}

function texto(v){
  if(typeof v==='boolean')return v?'VERDADERO':'FALSO';
  if(typeof v==='number'&&!Number.isInteger(v))return String(Math.round(v*1e6)/1e6);
  return String(v);
}

/* ---------- Ventana ---------- */
function montar(host){
  host.innerHTML=`<div class="ps-win">
    <div class="ps-title"><span class="ps-logo"></span>PSeInt<span class="ps-sim">simulación</span></div>
    <div class="ps-tools">
      <select class="ps-sel" aria-label="Ejemplo">
        <option value="secuencial">Secuencial: área del rectángulo</option>
        <option value="condicional">Condicional: aprobado o reprobado</option>
        <option value="mientras">Mientras: sumar hasta cero</option>
        <option value="para">Para: tabla de multiplicar</option>
      </select>
      <button type="button" class="ps-run">▶ Ejecutar</button>
    </div>
    <div class="ps-ed"><pre class="ps-nums"></pre><div class="ps-code"><pre class="ps-hl" aria-hidden="true"></pre><textarea class="ps-ta" spellcheck="false" aria-label="Código"></textarea></div></div>
  </div>
  <div class="ps-cons" hidden>
    <div class="ps-ctitle">PSeInt - Ejecutando proceso<button type="button" class="ps-x" aria-label="Cerrar">✕</button></div>
    <div class="ps-out"></div>
  </div>`;
  const $=s=>host.querySelector(s);
  const ta=$('.ps-ta'),hl=$('.ps-hl'),nums=$('.ps-nums'),cons=$('.ps-cons'),out=$('.ps-out');
  let corrida=0;
  function pintar(){
    hl.innerHTML=colorear(ta.value)+'\n';
    nums.textContent=ta.value.split('\n').map((_,i)=>i+1).join('\n');
  }
  function cargar(k){ta.value=EJEMPLOS[k];pintar();cons.hidden=true;corrida++;}
  ta.addEventListener('input',pintar);
  ta.addEventListener('scroll',()=>{hl.scrollTop=ta.scrollTop;hl.scrollLeft=ta.scrollLeft;nums.scrollTop=ta.scrollTop;});
  ta.addEventListener('keydown',e=>{
    e.stopPropagation();
    if(e.key==='Tab'){e.preventDefault();const s=ta.selectionStart;ta.setRangeText('\t',s,ta.selectionEnd,'end');pintar();}
  });
  $('.ps-sel').addEventListener('change',e=>cargar(e.target.value));
  $('.ps-sel').addEventListener('keydown',e=>e.stopPropagation());
  $('.ps-x').addEventListener('click',()=>{cons.hidden=true;corrida++;});

  function linea(t,cls){const d=document.createElement('div');d.className='ps-l'+(cls?' '+cls:'');d.textContent=t;out.appendChild(d);out.scrollTop=out.scrollHeight;}
  function pedir(nombre,id){
    return new Promise((ok,no)=>{
      const d=document.createElement('div');d.className='ps-l ps-in';
      d.innerHTML='<span>&gt; </span>';const inp=document.createElement('input');inp.setAttribute('aria-label','Valor para '+nombre);
      d.appendChild(inp);out.appendChild(d);inp.focus();out.scrollTop=out.scrollHeight;
      inp.addEventListener('keydown',e=>{
        e.stopPropagation();
        if(e.key!=='Enter')return;
        if(id!==corrida)return no(new Error('cancelado'));
        const v=inp.value.trim();if(v==='')return;
        d.innerHTML='';d.textContent='> '+v;
        const num=Number(v.replace(',','.'));
        ok(isNaN(num)?v:num);
      });
    });
  }

  async function correr(prog,V,id,cuenta){
    for(const s of prog){
      if(id!==corrida)throw new Error('cancelado');
      if(++cuenta.pasos>5000)throw new Error('El programa repitió demasiadas veces. ¿La condición del ciclo llega a cumplirse?');
      if(s.k==='esc')linea(s.items.map(x=>texto(expr(x,V,s.n))).join(''));
      else if(s.k==='leer'){for(let j=0;j<s.vars.length;j++)V[s.vars[j]]=await pedir(s.nombres[j],id);}
      else if(s.k==='asig')V[s.v]=expr(s.e,V,s.n);
      else if(s.k==='si')await correr(expr(s.c,V,s.n)?s.si:s.no,V,id,cuenta);
      else if(s.k==='mientras'){while(expr(s.c,V,s.n)){await correr(s.b,V,id,cuenta);if(++cuenta.pasos>5000)throw new Error('El ciclo Mientras no termina: revise la condición.');}}
      else if(s.k==='repetir'){do{await correr(s.b,V,id,cuenta);if(++cuenta.pasos>5000)throw new Error('El ciclo Repetir no termina: revise la condición.');}while(!expr(s.c,V,s.n));}
      else if(s.k==='para'){
        const a=expr(s.a,V,s.n),h=expr(s.h,V,s.n),p=expr(s.p,V,s.n);
        if(!p)throw new Error(`Línea ${s.n}: el paso no puede ser 0.`);
        for(V[s.v]=a;p>0?V[s.v]<=h:V[s.v]>=h;V[s.v]+=p)await correr(s.b,V,id,cuenta);
      }
    }
  }

  $('.ps-run').addEventListener('click',async()=>{
    const id=++corrida;out.innerHTML='';cons.hidden=false;
    linea('*** Ejecución Iniciada. ***','ps-dim');
    try{
      const prog=analizar(ta.value);
      await correr(prog,{},id,{pasos:0});
      if(id===corrida)linea('*** Ejecución Finalizada. ***','ps-dim');
    }catch(e){
      if(e.message!=='cancelado'&&id===corrida)linea(e.message,'ps-err');
    }
  });
  cargar('secuencial');
}

document.querySelectorAll('.pseint').forEach(montar);
})();
