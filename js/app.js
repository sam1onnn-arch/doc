/* ---------- Чек-листы ---------- */
function initKr(){
  const box=$('#kr-list');
  box.innerHTML=KR.map((d,i)=>{
    const total=d.secs.reduce((a,s)=>a+s.items.length,0);
    const src=(d.foot.match(/клиническиерекомендации\.рф\/kr\/[\w-]+/)||[''])[0];
    const foot=d.foot.replace(/Источник:.*$/,'').trim();
    return `<details class="kr" id="kr${i}"><summary><h2>${d.title.replace('Чек-лист: ','').replace(/^./,m=>m.toUpperCase())}</h2><span class="cnt">0 / ${total}</span></summary>
    <div class="kr-body"><p class="kr-meta">${d.meta}</p><div class="bartrack"><i></i></div>
    ${d.secs.map((s,si)=>`<div class="sec${/^Не назначать/.test(s.h)?' no':''}"><h3><em>(${String(si+1).padStart(2,'0')})</em>${s.h}</h3><div class="items">${s.items.map(t=>`<label><input type="checkbox"><span>${t}</span></label>`).join('')}</div></div>`).join('')}
    ${d.note?`<p class="kr-foot">${d.note}</p>`:''}
    ${foot?`<p class="kr-foot">${foot}</p>`:''}
    ${src?`<p class="kr-foot">Источник: <a href="https://${src}" target="_blank" rel="noopener">${src}</a></p>`:''}
    <div class="kr-tools"><button class="btn" type="button" data-reset>Снять все отметки</button></div></div></details>`;
  }).join('');
  $$('details.kr',box).forEach(dt=>{
    const upd=()=>{const all=$$('input',dt),on=all.filter(x=>x.checked).length;$('.cnt',dt).textContent=`${on} / ${all.length}`;$('.bartrack i',dt).style.width=(all.length?on/all.length*100:0)+'%'};
    dt.addEventListener('change',upd);
    $('[data-reset]',dt).addEventListener('click',()=>{$$('input',dt).forEach(x=>x.checked=false);upd()});
  });
}

/* ---------- Звуковая волна ---------- */
function waveSvg(seed){
  let x=seed*9301+49297,r=()=>{x=(x*9301+49297)%233280;return x/233280};
  const W=1400,H=60,B=30,BEAT=140;let d=`M0 ${B}`;
  for(let i=0;i<W;i+=BEAT){
    const k=0.85+r()*0.3;
    d+=`H${i+16}Q${i+27} ${B-8*k} ${i+38} ${B}H${i+48}L${i+52} ${B+5}L${i+58} ${B-26*k}L${i+64} ${B+16*k}L${i+68} ${B}H${i+84}Q${i+102} ${B-14*k} ${i+120} ${B}H${i+BEAT}`;
  }
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><path d="${d}" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`;
}
function initWaves(){
  $$('.page>h1').forEach((el,i)=>el.insertAdjacentHTML('afterend',`<div class="wave" data-wave="34"></div>`));
  $$('[data-wave]').forEach((el,i)=>{el.innerHTML=waveSvg(i+3)});
}

/* ---------- Роутер ---------- */
const PAGES=['home','kr','calc','abt'];
function route(){
  let h=(location.hash||'#home').slice(1);if(!PAGES.includes(h))h='home';
  PAGES.forEach(p=>{$('#p-'+p).hidden=p!==h});
  $$('[data-nav]').forEach(a=>{if(a.dataset.nav===h)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
  window.scrollTo(0,0);
}
window.addEventListener('hashchange',route);
initKr();initCalcs();initAbt();initWaves();route();
