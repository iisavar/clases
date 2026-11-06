/* Tablita de flechas (orden de llenado) que se ilumina sola.
   Cada <div class="tablita"> se dibuja aquí. En la misma lámina, cada elemento .step con data-sub="2p" data-n="6"
   enciende ese subnivel cuando aparece (al tocar «Avanzar») y se apaga al retroceder. */
(function(){
  const L={s:0,p:1,d:2,f:3}, W=70, H=48, FIL=5;
  const css=document.createElement('style');
  css.textContent=`
  .tablita{position:relative;margin:4px auto 0}
  .tablita svg{position:absolute;inset:0;pointer-events:none;overflow:visible}
  .tablita .c{position:absolute;width:58px;height:36px;border-radius:10px;display:grid;place-items:center;font-weight:900;font-size:18px;background:var(--panel);border:2px solid var(--line);color:var(--gris);transition:all .35s}
  .tablita .c.on{background:var(--green);border-color:var(--green-t);color:#fff;transform:scale(1.08);box-shadow:0 0 18px rgba(43,174,102,.55)}
  .tablita .c.medio{background:var(--gold);border-color:var(--gold);color:var(--ink)}
  .tablita .c i{position:absolute;top:-9px;right:-9px;width:22px;height:22px;border-radius:50%;background:var(--gold);color:var(--ink);font-style:normal;font-size:12px;display:none;place-items:center}
  .tablita .c.on i,.tablita .c.medio i{display:grid}
  .tablita-pie{text-align:center;color:var(--muted);font-size:.85em;margin-top:6px}`;
  document.head.appendChild(css);
  const ORDEN=[];
  for(let k=1;k<=6;k++)for(let n=1;n<=FIL;n++){const l=k-n;if(l>=0&&l<n&&l<=3)ORDEN.push(n+'spdf'[l]);}
  function pos(sub){const n=+sub[0],l=L[sub[1]];return [l*W,(n-1)*H];}
  document.querySelectorAll('.tablita').forEach(t=>{
    t.style.width=(3*W+58)+'px'; t.style.height=((FIL-1)*H+36)+'px';
    let svg='<svg viewBox="0 0 '+(3*W+58)+' '+((FIL-1)*H+36)+'"><defs><marker id="pt" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#FFC800"/></marker></defs>';
    for(let k=1;k<=6;k++){
      const d=ORDEN.filter(s=>+s[0]+L[s[1]]===k); if(!d.length)continue;
      const [x1,y1]=pos(d[0]), [x2,y2]=pos(d[d.length-1]);
      const a=[x1+29+14,y1+18-12], b=[x2+29-14,y2+18+12];
      svg+=`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#FFC800" stroke-width="2.5" stroke-dasharray="6 5" opacity=".75" marker-end="url(#pt)"/>`;
    }
    t.innerHTML=svg+'</svg>'+ORDEN.map(s=>{const [x,y]=pos(s);return `<div class="c" data-c="${s}" style="left:${x}px;top:${y}px">${s}<i></i></div>`}).join('');
    const lam=t.closest('section'); if(!lam)return;
    const pasos=[...lam.querySelectorAll('[data-sub]')];
    function pintar(){
      t.querySelectorAll('.c').forEach(c=>{c.classList.remove('on','medio');c.innerHTML=c.dataset.c+'<i></i>';});
      let k=0;
      pasos.forEach(p=>{if(!p.classList.contains('vis'))return;const c=t.querySelector(`[data-c="${p.dataset.sub}"]`);if(!c)return;
        const n=+p.dataset.n,tope={s:2,p:6,d:10,f:14}[p.dataset.sub[1]];k++;
        c.classList.add(n===tope?'on':'medio');c.innerHTML=p.dataset.sub+'<sup>'+n+'</sup><i>'+k+'</i>';});
    }
    const ob=new MutationObserver(pintar); pasos.forEach(p=>ob.observe(p,{attributes:true,attributeFilter:['class']}));
    pintar();
  });
})();
