/* ---------- Антибиотики: расчёт и интерфейс ---------- */
const fmtN=(x,u)=>{
  if(!isFinite(x))return '—';
  if(u==='МЕ'||u==='ЕД')return Math.round(x).toLocaleString('ru-RU').replace(/ /g,' ');
  const d=x>=100?0:x>=10?1:2;
  let s=nf(x,d).replace(/ /g,' ');
  return s;
};
const rng=(a,b,u='мг')=>{const A=fmtN(a,u),B=fmtN(b,u);let t=(A===B?A:`${A}–${B}`)+' '+u;if(u==='мг'&&b>=1000)t+=A===B?` (${nf(a/1000,2)} г)`:` (${nf(a/1000,2)}–${nf(b/1000,2)} г)`;return t};
const every=n=>n>=1?(24%n===0||Math.abs(24/n-Math.round(24/n))<.01?`каждые ${Math.round(24/n)} ч (${n} р/сут)`:`${nf(n,1)} раза в сутки`):`каждые ${Math.round(24/n)} ч`;
const timesTxt=n=>n===1?'1 раз':(n<5?`${n} раза`:`${n} раз`);

function specOf(d,ageM,kg){return typeof d.spec==='function'?d.spec(ageM,kg):d.spec}

function calcSpec(s,w){
  if(!s||s.k==='tx')return {k:'tx',text:s?s.text:''};
  const u=s.u||'мг';
  const needKg=(s.k==='pk'||s.k==='dk'||s.capKg)&&!(w>0);
  if(needKg)return {needKg:true,k:s.k,u};
  let per=null,daily=null;
  const n=s.n;
  if(s.k==='pd'||s.k==='pk'){
    per=s.k==='pd'?[s.lo,s.hi]:[s.lo*w,s.hi*w];
    if(s.capPer)per=per.map(x=>Math.min(x,s.capPer));
    if(n)daily=[per[0]*n[0],per[1]*n[1]];
  }else{
    daily=s.k==='dk'?[s.lo*w,s.hi*w]:[s.lo,s.hi];
  }
  let capped=false;
  const cap=s.cap||(s.capKg?s.capKg*w:null);
  if(daily&&cap){const c=daily.map(x=>Math.min(x,cap));capped=c[0]!==daily[0]||c[1]!==daily[1];daily=c}
  return {k:s.k,u,per,daily,n,capped,cap,first:s.first,note:s.note,w};
}

function stdLines(r,spec,adult){
  if(r.k==='tx')return `<div>${r.text}</div>`;
  if(r.needKg)return '<div>Введите массу тела для расчёта.</div>';
  const u=r.u,L=[];
  if(r.per)L.push(`<div>Разовая доза: <b>${rng(r.per[0],r.per[1],u)}</b></div>`);
  if(r.n)L.push(`<div>Кратность: <b>${r.n[0]===r.n[1]?timesTxt(r.n[0]):`${r.n[0]}–${r.n[1]} раза`} в сутки</b></div>`);
  else L.push('<div>Кратность: по инструкции</div>');
  if(r.daily)L.push(`<div>Суточная доза: <b>${rng(r.daily[0],r.daily[1],u)}</b>${r.capped?' (ограничено максимумом из таблицы)':''}</div>`);
  if(!r.per&&r.n&&r.daily){
    const a=Math.round(r.n[0]),b=Math.round(r.n[1]);
    if(b>a||true){for(let k=a;k<=b;k++)L.push(`<div>При ${timesTxt(k)} в сутки: ${rng(r.daily[0]/k,r.daily[1]/k,u)} на введение</div>`)}
  }
  if(r.first){
    if(typeof r.first==='string')L.push(`<div>${r.first}</div>`);
    else if(r.w>0)L.push(`<div>В 1-й день: <b>${rng(r.first.lo*r.w,r.first.hi*r.w,u)}</b> в сутки, затем по схеме выше</div>`);
  }
  if(r.note)L.push(`<div class="src">${r.note}</div>`);
  return L.join('');
}

function bandFor(key,gfr){
  const arr=REN[key];if(!Array.isArray(arr))return {missing:true};
  for(const b of arr){if(gfr<b.lt)return b}
  return {normal:true,lt:arr[arr.length-1].lt};
}

function renalBlock(d,spec,r,gfr,adult){
  if(d.ren===NONE)return {html:'<div>Коррекции по СКФ не требуется.</div>'};
  const b=bandFor(d.ren,gfr);
  if(b.missing)return {vk:'Схема коррекции по СКФ для этого препарата не включена в справочник. Нужна консультация клинического фармаколога.'};
  if(b.normal)return {html:`<div>При СКФ ≥${b.lt} мл/мин коррекция не требуется.</div>`};
  if(b.vk)return {vk:b.w||'Применение при такой СКФ не рекомендуется.',c:!!b.c};
  let L=[];
  if(adult&&b.t)L.push(`<div><b>${b.t}</b></div>`);
  else if(b.noNum||(!b.f&&b.t))L.push(`<div><b>${b.t||''}</b></div>`);
  else if(r.k==='tx')L.push('<div>Расчёт не выполняется для этого препарата.</div>');
  else if(r.needKg)L.push('<div>Введите массу тела для расчёта.</div>');
  else{
    const u=r.u;
    let per=r.per?r.per:(r.daily&&r.n?r.daily.map(x=>x/r.n[0]):null);
    if(per){
      const p2=per.map(x=>x*b.f);
      L.push(`<div>Разовая доза: <b>${rng(p2[0],p2[1],u)}</b></div>`);
      if(b.n!=null){
        L.push(`<div>Кратность: <b>${every(b.n)}</b></div>`);
        if(b.n>=1)L.push(`<div>Суточная доза: <b>${rng(p2[0]*b.n,p2[1]*b.n,u)}</b></div>`);
      }else if(r.n){
        L.push(`<div>Кратность: <b>как обычно, ${r.n[0]===r.n[1]?timesTxt(r.n[0]):r.n[0]+'–'+r.n[1]+' раза'} в сутки</b></div>`);
        L.push(`<div>Суточная доза: <b>${rng(p2[0]*r.n[0],p2[1]*r.n[1],u)}</b></div>`);
      }
    }else if(r.daily){
      L.push(`<div>Суточная доза: <b>${rng(r.daily[0]*b.f,r.daily[1]*b.f,u)}</b>${b.n!=null?`, ${every(b.n)}`:', кратность по инструкции'}</div>`);
    }
    if(b.t&&!adult)L.push(`<div class="src">Для сравнения, ориентир для взрослых: ${b.t}.</div>`);
  }
  if(adult&&b.nomo&&gfr>=10)L.push(`<div class="src">Вариант с уменьшением разовой дозы: суточная доза около ${nf(15.45*gfr,0)} мг (по таблице инструкции).</div>`);
  if(b.w)L.push(`<div class="src">${b.w}</div>`);
  return {html:L.join(''),warn:true};
}

function vkBox(msg,c){return `<div class="vk"><b>${c?'Противопоказан. Делай ВК!!!':'Решает ВК. Делай ВК!!!'}</b><span>${msg}</span><span>Не зли Безуглую Т.В.</span></div>`}

function drugCard(d,P,open){
  const {ageM,kg,gfr,adult}=P;
  const spec=specOf(d,ageM,kg);
  const r=calcSpec(spec,kg);
  let vk=null,ref=false,body='',badge='',sum='';
  const msgC=d.contra?d.contra(ageM,kg):null;
  const gap=d.gap?d.gap(ageM):null;
  if(msgC){vk=msgC;ref=!!d.ref}
  else if(gap){vk=gap}
  else if(!spec){vk='В таблице СКАТ нет дозы для этого возраста.'}
  const blocks=[];
  if(vk)blocks.push(vkBox(vk,!!(msgC||ref)));
  const showStd=spec&&(!vk||ref);
  if(showStd){
    blocks.push(`<div class="blk${vk?' dim':''}"><h4>${vk?'Справочно, только по решению ВК':'Стандартный режим'} (${d.src})</h4>${stdLines(r,spec,adult)}</div>`);
    if(d.note)blocks.push(`<div class="src">${d.note}</div>`);
  }
  let ren=null;
  if(P.useGfr&&isFinite(gfr)&&!vk){
    ren=renalBlock(d,spec,r,gfr,adult);
    if(ren.vk){blocks.push(vkBox(ren.vk,ren.c));vk=ren.vk}
    else blocks.push(`<div class="blk ren"><h4>С поправкой на СКФ ${nf(gfr,0)} мл/мин</h4>${ren.html}</div>`);
  }else if(P.useGfr&&!isFinite(gfr)&&!vk){
    blocks.push('<div class="src">Введите СКФ, чтобы увидеть коррекцию дозы.</div>');
  }
  if(vk)badge='<span class="pill bad">ВК</span>';
  else if(ren&&ren.warn)badge='<span class="pill warn">коррекция</span>';
  else if(ren)badge='<span class="pill ok">без коррекции</span>';
  if(!vk&&showStd){
    const rr=ren&&ren.html&&ren.warn?null:null;
    if(r.k==='tx')sum='см. внутри';
    else if(r.needKg)sum='нужна масса тела';
    else sum=(r.per?rng(r.per[0],r.per[1],r.u)+(r.n?' × '+(r.n[0]===r.n[1]?r.n[0]:r.n[0]+'–'+r.n[1]):''):(r.daily?rng(r.daily[0],r.daily[1],r.u)+' в сутки':''));
  }else if(vk)sum='не применять без ВК';
  return `<details class="drug${vk?' isvk':''}"${open?' open':''}><summary><span class="nm">${d.name}</span><span class="sm">${sum}</span><span>${badge}</span></summary><div class="drug-body">${blocks.join('')}<div class="src">${d.rt}</div></div></details>`;
}

function initAbt(){
  const el={age:$('#a-age'),unit:$('#a-unit'),kg:$('#a-kg'),on:$('#a-gfr-on'),gfr:$('#a-gfr'),renal:$('#a-renal'),note:$('#a-gfr-note'),who:$('#a-who'),route:$('#a-route'),out:$('#a-out'),foot:$('#a-foot'),din:$('#a-drug-in'),list:$('#a-list'),clear:$('#a-clear')};
  let sel=null,cat=null,open=false,act=-1,shown=[];
  const srcOf=a=>a?ADULT:KIDS;
  const labelOf=(d,adult)=>d.name+(adult?'':' ('+d.rt+')');
  const state=()=>{
    const ageIn=num(el.age.value),kg=num(el.kg.value);
    const ageM=isNaN(ageIn)?NaN:(el.unit.value==='y'?ageIn*12:ageIn);
    return {ageM,kg,adult:ageM>=216,gfr:num(el.gfr.value)};
  };
  const closeList=()=>{open=false;el.list.hidden=true;el.din.setAttribute('aria-expanded','false');act=-1};
  const buildList=(filter)=>{
    const {adult}=state();const SRC=srcOf(adult);
    const f=(filter||'').toLowerCase().trim();
    shown=SRC.map((d,i)=>({d,i})).filter(({d})=>(el.route.value==='all'||el.route.value===d.route)&&(!f||d.name.toLowerCase().includes(f)));
    let h='',g='';
    shown.forEach(({d,i},k)=>{
      if(d.g!==g){g=d.g;h+=`<li class="grp" role="presentation">${g}</li>`}
      h+=`<li class="opt${sel&&sel.i===i?' cur':''}" role="option" id="a-o${k}" data-k="${k}">${labelOf(d,adult)}</li>`;
    });
    el.list.innerHTML=h||'<li class="grp" role="presentation">Ничего не найдено</li>';
  };
  const openList=(filter)=>{buildList(filter);open=true;el.list.hidden=false;el.din.setAttribute('aria-expanded','true');act=-1};
  const choose=k=>{
    const {adult}=state();const it=shown[k];if(!it)return;
    sel={adult,i:it.i};el.din.value=labelOf(it.d,adult);closeList();render();
  };
  const setAct=n=>{
    const opts=$$('.opt',el.list);if(!opts.length)return;
    act=(n+opts.length)%opts.length;
    opts.forEach((o,i)=>o.classList.toggle('act',i===act));
    opts[act].scrollIntoView({block:'nearest'});el.din.setAttribute('aria-activedescendant',opts[act].id);
  };
  function render(){
    const P0=state(),{ageM,kg,gfr,adult}=P0;
    el.renal.classList.toggle('on',el.on.checked);
    el.note.innerHTML='';
    const opts=adult?[['all','Внутривенно (взрослые)']]:[['all','Все пути'],['po','Внутрь'],['iv','Парентерально']];
    const m=isNaN(ageM)?'':(adult?'a':'k');
    if(el.route.dataset.m!==m){el.route.innerHTML=opts.map(([v,l])=>`<option value="${v}">${l}</option>`).join('');el.route.dataset.m=m}
    if(sel&&(isNaN(ageM)||sel.adult!==adult)){sel=null;el.din.value=''}
    el.clear.hidden=!sel;
    if(isNaN(ageM)){
      el.who.innerHTML='';
      el.out.innerHTML='<div class="empty card">Введите возраст пациента, затем массу тела и выберите препарат.</div>';
      el.foot.textContent='';return;
    }
    el.who.innerHTML=adult?`<span class="pill info">Взрослый</span> дозы из приложения 11 СКАТ (в/в, нормальная функция почек)`:`<span class="pill info">Ребёнок, ${ageM<24?nf(ageM,1)+' мес':nf(ageM/12,1)+' лет'}</span> дозы из приложений 12А и 12Б СКАТ${kg>0?'':' · укажите массу тела'}`;
    if(!sel){
      el.out.innerHTML='<div class="empty card">Нажмите на поле «Препарат» и выберите препарат из списка. Здесь появятся доза, кратность и коррекция по СКФ.</div>';
      el.foot.textContent='';return;
    }
    const d=srcOf(adult)[sel.i];
    el.out.innerHTML=drugCard(d,{ageM,kg,gfr,adult,useGfr:el.on.checked},true);
    el.foot.textContent='Источник доз: Программа СКАТ, приложения 11, 12А, 12Б.';
  }
  /* поле выбора препарата */
  el.din.addEventListener('focus',()=>{el.din.select();openList('')});
  el.din.addEventListener('click',()=>{if(!open)openList('');el.din.select()});
  el.din.addEventListener('input',()=>{openList(el.din.value)});
  el.din.addEventListener('keydown',e=>{
    if(e.key==='ArrowDown'){e.preventDefault();if(!open)openList('');setAct(act+1)}
    else if(e.key==='ArrowUp'){e.preventDefault();if(!open)openList('');setAct(act-1)}
    else if(e.key==='Enter'){if(open){e.preventDefault();choose(act>=0?act:0)}}
    else if(e.key==='Escape'){closeList();restore()}
  });
  const restore=()=>{const {adult}=state();el.din.value=sel?labelOf(srcOf(adult)[sel.i],adult):''};
  el.list.addEventListener('mousedown',e=>{const li=e.target.closest('.opt');if(li){e.preventDefault();choose(+li.dataset.k)}});
  el.din.addEventListener('blur',()=>{closeList();restore()});
  el.clear.addEventListener('click',()=>{sel=null;el.din.value='';render();el.din.focus()});
  el.route.addEventListener('change',()=>{if(open)buildList(el.din.value)});
  ['input','change'].forEach(ev=>[el.age,el.unit,el.kg,el.on,el.gfr,el.route].forEach(x=>x.addEventListener(ev,render)));
  render();
}
