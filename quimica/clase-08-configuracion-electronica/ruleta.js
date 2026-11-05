/* Ruleta de la clase 8: elige a quién le toca y, si se quiere, le da una frase de «¿bien o mal?». Tecla R. */
(function(){
  const CLAVE='quimica-8-ruleta';
  const FRASES=(typeof CASOS!=='undefined'?CASOS:[]).map(c=>({t:c.e,ok:c.ok,w:c.w}));
  const COLORES=['#2BAE66','#4FB3E8','#FFC800','#FF6B6B','#A78BFA','#3BC97A','#F59E0B','#22D3EE'];
  const css=document.createElement('style');
  css.textContent=`
  .rl-btn{position:fixed;top:14px;right:14px;z-index:60;background:var(--gold);color:var(--ink);border:0;border-radius:16px;padding:10px 16px;font:900 16px Nunito,sans-serif;cursor:pointer;box-shadow:0 4px 0 #B38C00}
  .rl{position:fixed;inset:0;z-index:70;background:rgba(9,16,19,.94);display:none;align-items:center;justify-content:center;padding:20px}
  .rl.on{display:flex}
  .rl-box{display:grid;grid-template-columns:minmax(260px,460px) minmax(240px,380px);gap:28px;align-items:center;max-width:960px;width:100%}
  .rl-rueda{position:relative;aspect-ratio:1}
  .rl-rueda canvas{width:100%;height:100%;transition:transform 4.2s cubic-bezier(.12,.8,.16,1)}
  .rl-punta{position:absolute;top:-6px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:18px solid transparent;border-right:18px solid transparent;border-top:34px solid var(--text);filter:drop-shadow(0 2px 2px #000)}
  .rl-lado h2{margin:0 0 8px}
  .rl-lado textarea{width:100%;min-height:150px;background:var(--panel);color:var(--text);border:2px solid var(--line);border-radius:12px;padding:10px;font:700 16px Nunito,sans-serif}
  .rl-lado .fila{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px}
  .rl-lado button{border:0;border-radius:14px;padding:10px 16px;font:900 16px Nunito,sans-serif;cursor:pointer}
  .rl-girar{background:var(--green);color:#fff;box-shadow:0 4px 0 var(--green-d)}
  .rl-sec{background:var(--panel2);color:var(--text)}
  .rl-res{margin-top:14px;font-size:1.6em;font-weight:900;color:var(--gold);min-height:1.3em}
  .rl-frase{margin-top:10px;background:var(--panel);border-left:6px solid var(--gold);border-radius:12px;padding:12px 14px;display:none}
  .rl-frase.on{display:block}
  .rl-frase .r{display:none;margin-top:8px;color:var(--muted)} .rl-frase.ver .r{display:block}
  @media (max-width:760px){.rl-box{grid-template-columns:1fr}}`;
  document.head.appendChild(css);

  const btn=document.createElement('button');
  btn.className='rl-btn'; btn.type='button'; btn.textContent='Ruleta'; btn.title='Ruleta (tecla R)';
  document.body.appendChild(btn);
  const ov=document.createElement('div'); ov.className='rl';
  ov.innerHTML=`<div class="rl-box">
    <div class="rl-rueda"><div class="rl-punta"></div><canvas width="600" height="600"></canvas></div>
    <div class="rl-lado">
      <h2>¿A quién le toca?</h2>
      <p style="margin:0 0 6px;color:var(--muted)">Un nombre por línea. Se guarda en este navegador.</p>
      <textarea spellcheck="false"></textarea>
      <div class="fila"><button class="rl-girar" type="button">Girar</button>
        <button class="rl-sec rl-quitar" type="button" title="Quita de la rueda al que ya salió">Sacar al elegido</button>
        <button class="rl-sec rl-cerrar" type="button">Cerrar</button></div>
      <div class="rl-res"></div>
      <div class="rl-frase"><b>¿Está bien o está mal?</b><div class="t"></div><div class="r"></div>
        <div class="fila"><button class="rl-sec rl-ver" type="button">Ver respuesta</button></div></div>
    </div></div>`;
  document.body.appendChild(ov);
  const cv=ov.querySelector('canvas'), ctx=cv.getContext('2d'), ta=ov.querySelector('textarea');
  const res=ov.querySelector('.rl-res'), fr=ov.querySelector('.rl-frase');
  let giro=0, elegido=-1, girando=false;

  function nombresIniciales(){
    try{const g=localStorage.getItem(CLAVE); if(g)return g;}catch(e){}
    try{const m=JSON.parse(localStorage.getItem('quimica-8-marcador')||'[]'); if(m.length)return m.map(j=>j.n).join('\n');}catch(e){}
    return '';
  }
  function nombres(){return ta.value.split('\n').map(s=>s.trim()).filter(Boolean);}
  function dibujar(){
    const L=nombres(), n=Math.max(L.length,1), R=290, c=300;
    ctx.clearRect(0,0,600,600);
    for(let i=0;i<n;i++){
      const a0=-Math.PI/2+i*2*Math.PI/n, a1=a0+2*Math.PI/n;
      ctx.beginPath(); ctx.moveTo(c,c); ctx.arc(c,c,R,a0,a1); ctx.closePath();
      ctx.fillStyle=L.length?COLORES[i%COLORES.length]:'#22363F'; ctx.fill();
      ctx.strokeStyle='#131F24'; ctx.lineWidth=4; ctx.stroke();
      ctx.save(); ctx.translate(c,c); ctx.rotate((a0+a1)/2);
      ctx.fillStyle='#0E1A1F'; ctx.font='900 '+(n>10?22:30)+'px Nunito,sans-serif'; ctx.textAlign='right'; ctx.textBaseline='middle';
      const txt=L[i]||'Escribe nombres'; ctx.fillText(txt.length>14?txt.slice(0,13)+'…':txt,R-18,0); ctx.restore();
    }
    ctx.beginPath(); ctx.arc(c,c,34,0,2*Math.PI); ctx.fillStyle='#F1F5F7'; ctx.fill();
  }
  function tono(f,d){try{const a=window.__rlAudio||(window.__rlAudio=new (window.AudioContext||window.webkitAudioContext)());
    const o=a.createOscillator(),g=a.createGain();o.frequency.value=f;o.connect(g);g.connect(a.destination);
    g.gain.setValueAtTime(.15,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+d);o.start();o.stop(a.currentTime+d);}catch(e){}}
  function girar(){
    const L=nombres(); if(L.length<1||girando)return;
    girando=true; res.textContent=''; fr.classList.remove('on','ver');
    elegido=Math.floor(Math.random()*L.length);
    const seg=360/L.length, centro=elegido*seg+seg/2;
    // La flecha está arriba: hay que llevar el centro del sector elegido a 0 grados.
    const actual=((giro%360)+360)%360;
    giro+= (360-actual) + 360*5 + (360-centro) + (Math.random()-.5)*seg*.6;
    cv.style.transform=`rotate(${giro}deg)`;
    let k=0; const tic=setInterval(()=>{tono(500+(k++%2)*120,.05)},140);
    setTimeout(()=>{clearInterval(tic); girando=false; tono(880,.25); setTimeout(()=>tono(1175,.35),180);
      res.textContent='Le toca a '+L[elegido];
      if(FRASES.length){const f=FRASES[Math.floor(Math.random()*FRASES.length)];
        fr.querySelector('.t').innerHTML=f.t; fr.querySelector('.r').innerHTML='<b>'+(f.ok?'Está bien.':'Está mal.')+'</b> '+f.w; fr.classList.add('on');}
    },4300);
  }
  ta.value=nombresIniciales(); dibujar();
  ta.addEventListener('input',()=>{try{localStorage.setItem(CLAVE,ta.value)}catch(e){} dibujar();});
  ov.querySelector('.rl-girar').onclick=girar;
  ov.querySelector('.rl-ver').onclick=()=>fr.classList.add('ver');
  ov.querySelector('.rl-quitar').onclick=()=>{const L=nombres(); if(elegido<0||!L[elegido])return; L.splice(elegido,1); ta.value=L.join('\n'); elegido=-1; ta.dispatchEvent(new Event('input'));};
  function abrir(){ov.classList.toggle('on'); if(ov.classList.contains('on')&&!ta.value)ta.focus();}
  ov.querySelector('.rl-cerrar').onclick=abrir;
  btn.onclick=abrir;
  document.addEventListener('keydown',e=>{
    if(e.target.closest('input,textarea'))return;
    if(e.key==='r'||e.key==='R'){e.preventDefault();e.stopImmediatePropagation();abrir();}
    else if(ov.classList.contains('on')){
      if(e.key===' '||e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();girar();}
      else if(e.key==='Escape'){ov.classList.remove('on');}
      else if(['ArrowRight','ArrowLeft','PageDown','PageUp'].includes(e.key)){e.stopImmediatePropagation();}
    }
  },true);
})();
