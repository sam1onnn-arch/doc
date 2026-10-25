/* ---------- helpers ---------- */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const nf=(x,d=1)=>{if(!isFinite(x))return '—';const p=Math.pow(10,d);const v=Math.round(x*p)/p;return v.toLocaleString('ru-RU',{maximumFractionDigits:d})};
const num=v=>{const x=parseFloat(String(v).replace(',','.'));return isFinite(x)?x:NaN};

function fieldHtml(c,f){
  const id=`${c}-${f.id}`;
  if(f.t==='age')return `<label class="f"><span>${f.l}</span><span class="inp"><input type="number" id="${id}" step="any" min="0" inputmode="decimal" placeholder="${f.p||''}"><select id="${c}-au" aria-label="Единица возраста"><option value="y">лет</option><option value="m">мес</option></select></span></label>`;
  if(f.t==='chk')return `<label class="chk"><input type="checkbox" id="${id}"><span><b>${f.l}</b>${f.h?`<small>${f.h}</small>`:''}</span></label>`;
  if(f.t==='sel')return `<label class="f"><span>${f.l}</span><select id="${id}">${f.o.map(([v,l])=>`<option value="${v}"${v===f.d?' selected':''}>${l}</option>`).join('')}</select>${f.h?`<small>${f.h}</small>`:''}</label>`;
  return `<label class="f"><span>${f.l}</span><span class="inp"><input type="number" id="${id}" step="${f.s||'any'}" min="${f.min??0}" inputmode="decimal" placeholder="${f.p||''}"${f.v!=null?` value="${f.v}"`:''}>${f.u?`<u>${f.u}</u>`:''}</span>${f.h?`<small>${f.h}</small>`:''}</label>`;
}
function readVals(c,fields){
  const v={};
  for(const f of fields){const el=$('#'+c+'-'+f.id);if(f.t==='age')v.au=$('#'+c+'-au').value;v[f.id]=f.t==='chk'?el.checked:f.t==='sel'?(/^[\d.,]+$/.test(el.value)?num(el.value):el.value):num(el.value)}
  return v;
}
const lvl=(k,t)=>`<span class="pill ${k}">${t}</span>`;
const rows=a=>a.map(([k,v])=>`<div class="row"><span>${k}</span><b>${v}</b></div>`).join('');

/* ---------- SMART-COP ---------- */
const smart={
  id:'smart',name:'SMART-COP',
  intro:'Прогноз потребности в ИВЛ и вазопрессорах при внебольничной пневмонии. По чек-листу КР: SMART-COP ≥5 — критерий ОРИТ.',
  fields:[
    {id:'age',l:'Возраст',u:'лет'},
    {id:'sbp',l:'Систолическое АД',u:'мм рт. ст.'},
    {id:'ml',t:'chk',l:'Многодолевая инфильтрация на рентгенограмме'},
    {id:'alb',l:'Альбумин',u:'г/л',h:'Ниже 35 г/л — 1 балл'},
    {id:'rr',l:'ЧДД',u:'в мин'},
    {id:'hr',l:'ЧСС',u:'в мин'},
    {id:'conf',t:'chk',l:'Нарушение сознания (новое)'},
    {id:'spo2',l:'SpO₂ на воздухе',u:'%'},
    {id:'pf',l:'PaO₂/FiO₂',u:'мм рт. ст.'},
    {id:'ph',l:'pH артериальной крови',s:'0.01',p:'7.40'}
  ],
  calc(v){
    const old=v.age>50, miss=isNaN(v.age);
    const it=[];let s=0;
    const add=(ok,pts,t)=>{if(ok){s+=pts;it.push(`${t} — ${pts}`)}};
    add(v.sbp<90,2,'АД сист. <90');
    add(v.ml,1,'Многодолевое поражение');
    add(v.alb<35,1,'Альбумин <35 г/л');
    add(v.rr>=(old?30:25),1,`ЧДД ≥${old?30:25}`);
    add(v.hr>=125,1,'ЧСС ≥125');
    add(v.conf,1,'Нарушение сознания');
    add(old?(v.spo2<=90||v.pf<250):(v.spo2<=93||v.pf<333),2,`Оксигенация (${old?'SpO₂ ≤90% или PaO₂/FiO₂ <250':'SpO₂ ≤93% или PaO₂/FiO₂ <333'})`);
    add(v.ph<7.35,2,'pH <7,35');
    let k,t,r;
    if(s<=2){k='ok';t='Низкий риск';r='Потребность в ИВЛ или вазопрессорах маловероятна.'}
    else if(s<=4){k='warn';t='Умеренный риск';r='Примерно у каждого десятого пациента потребуется ИВЛ или вазопрессоры.'}
    else if(s<=6){k='bad';t='Высокий риск';r='Примерно у каждого третьего потребуется ИВЛ или вазопрессоры. Критерий ОРИТ (≥5).'}
    else{k='bad';t='Очень высокий риск';r='Примерно у двух из трёх потребуется ИВЛ или вазопрессоры. Критерий ОРИТ.'}
    return `<div class="score">${s}<small> из 11</small></div>${lvl(k,t)}<p>${r}</p>${it.length?`<ul>${it.map(x=>`<li>${x}</li>`).join('')}</ul>`:''}${miss?'<p class="note">Возраст не указан: пороги ЧДД и оксигенации взяты для возраста старше 50 лет.</p>':''}`+
      `<p class="note">Пороги ЧДД и оксигенации зависят от возраста (до 50 лет и старше). Баллы по PaO₂ отдельно не вводятся: используйте SpO₂ или PaO₂/FiO₂.</p>`;
  }
};
smart.fields[0].v=null;

/* ---------- CURB-65 ---------- */
const curb={
  id:'curb',name:'CURB-65',
  intro:'Тяжесть внебольничной пневмонии и место лечения. По чек-листу КР: 0 баллов — можно амбулаторно, больше 3 — срочно в ОРИТ.',
  fields:[
    {id:'conf',t:'chk',l:'Нарушение сознания (C)'},
    {id:'urea',l:'Мочевина (U)',u:'ммоль/л',h:'Больше 7 ммоль/л — 1 балл'},
    {id:'rr',l:'ЧДД (R)',u:'в мин',h:'30 и больше — 1 балл'},
    {id:'sbp',l:'АД систолическое (B)',u:'мм рт. ст.'},
    {id:'dbp',l:'АД диастолическое (B)',u:'мм рт. ст.',h:'САД <90 или ДАД ≤60 — 1 балл'},
    {id:'age',l:'Возраст (65)',u:'лет'}
  ],
  calc(v){
    const it=[];let s=0,crb=0;
    const add=(ok,t,urea)=>{if(ok){s++;if(!urea)crb++;it.push(t)}};
    add(v.conf,'Нарушение сознания');
    add(v.urea>7,'Мочевина >7 ммоль/л',true);
    add(v.rr>=30,'ЧДД ≥30');
    add(v.sbp<90||v.dbp<=60,'САД <90 или ДАД ≤60');
    add(v.age>=65,'Возраст ≥65 лет');
    const mort=['0,6%','2,7%','6,8%','14%','27,8%','57%'][s];
    let k,t,r;
    if(s<=1){k='ok';t='Низкий риск';r=s===0?'Можно лечить амбулаторно.':'Амбулаторное лечение возможно, оцените сопутствующие болезни.'}
    else if(s===2){k='warn';t='Умеренный риск';r='Рассмотрите госпитализацию.'}
    else if(s===3){k='bad';t='Тяжёлая пневмония';r='Госпитализация, наблюдение за признаками тяжёлого течения.'}
    else{k='bad';t='Тяжёлая пневмония';r='По чек-листу КР: больше 3 баллов — срочно в ОРИТ.'}
    return `<div class="score">${s}<small> из 5</small></div>${lvl(k,t)}<p>${r}</p>`+rows([['30-дневная летальность (ориентир)',mort],['CRB-65 (без мочевины)',crb+' из 4']])+(it.length?`<ul>${it.map(x=>`<li>${x}</li>`).join('')}</ul>`:'');
  }
};

/* ---------- SOFA ---------- */
const sofa={
  id:'sofa',name:'SOFA',
  intro:'Органная дисфункция при сепсисе. Острое повышение на 2 балла и больше относительно исходного уровня соответствует критерию сепсиса.',
  fields:[
    {id:'pf',l:'PaO₂/FiO₂',u:'мм рт. ст.'},
    {id:'vent',t:'chk',l:'Респираторная поддержка (ИВЛ, ВПО, CPAP)'},
    {id:'plt',l:'Тромбоциты',u:'×10⁹/л'},
    {id:'bili',l:'Билирубин',u:'мкмоль/л'},
    {id:'map',l:'Среднее АД',u:'мм рт. ст.'},
    {id:'dop',l:'Допамин',u:'мкг/кг/мин'},
    {id:'dob',l:'Добутамин',u:'мкг/кг/мин',h:'Любая доза'},
    {id:'epi',l:'Адреналин',u:'мкг/кг/мин'},
    {id:'nor',l:'Норадреналин',u:'мкг/кг/мин'},
    {id:'gcs',l:'Шкала комы Глазго',u:'баллов',min:3,p:'3–15'},
    {id:'cr',l:'Креатинин',u:'мкмоль/л'},
    {id:'uo',l:'Диурез',u:'мл/сут'}
  ],
  calc(v){
    const r=[];let s=0;
    let a=0;if(v.pf<400)a=1;if(v.pf<300)a=2;if(v.pf<200)a=v.vent?3:2;if(v.pf<100&&v.vent)a=4;r.push(['Дыхание',a]);
    let b=0;if(v.plt<150)b=1;if(v.plt<100)b=2;if(v.plt<50)b=3;if(v.plt<20)b=4;r.push(['Свёртывание',b]);
    let c=0;if(v.bili>=20)c=1;if(v.bili>=33)c=2;if(v.bili>=102)c=3;if(v.bili>204)c=4;r.push(['Печень',c]);
    let d=v.map<70?1:0;if(v.dob>0||v.dop>0)d=Math.max(d,2);if(v.dop>5||v.epi>0||v.nor>0)d=Math.max(d,3);if(v.dop>15||v.epi>0.1||v.nor>0.1)d=4;r.push(['Сердечно-сосудистая',d]);
    let e=0;if(v.gcs<15)e=1;if(v.gcs<13)e=2;if(v.gcs<10)e=3;if(v.gcs<6)e=4;r.push(['ЦНС',e]);
    let f=0;if(v.cr>=110)f=1;if(v.cr>=171)f=2;if(v.cr>=300)f=3;if(v.cr>440)f=4;if(v.uo<200)f=4;else if(v.uo<500)f=Math.max(f,3);r.push(['Почки',f]);
    s=a+b+c+d+e+f;
    let k=s<2?'ok':s<6?'warn':'bad';
    const t=s<2?'Органной дисфункции нет':s<6?'Органная дисфункция':'Выраженная органная дисфункция';
    const m=s<=6?'<10%':s<=9?'15–20%':s<=12?'40–50%':s<=14?'50–60%':s===15?'>80%':'>90%';
    return `<div class="score">${s}<small> из 24</small></div>${lvl(k,t)}${rows(r.map(([n,x])=>[n,x]))}`+
      `<p class="note">Летальность по общему баллу (ориентир): ${m}. Для критерия сепсиса сравните с исходным баллом пациента.</p>`;
  }
};

/* ---------- CDS ---------- */
const cds={
  id:'cds',name:'CDS (обезвоживание)',
  intro:'Клиническая шкала дегидратации для детей от 1 до 36 месяцев при гастроэнтерите. Четыре признака по 0–2 балла.',
  fields:[
    {id:'gen',t:'sel',l:'Общий вид',d:'0',o:[['0','Нормальный'],['1','Жажда, беспокоен или вял, но раздражается при осмотре'],['2','Сонлив, вял, холодный, потеет, возможна кома']]},
    {id:'eyes',t:'sel',l:'Глаза',d:'0',o:[['0','Нормальные'],['1','Слегка запавшие'],['2','Очень запавшие']]},
    {id:'mm',t:'sel',l:'Слизистые оболочки (язык)',d:'0',o:[['0','Влажные'],['1','«Липкие»'],['2','Сухие']]},
    {id:'tears',t:'sel',l:'Слёзы',d:'0',o:[['0','Есть'],['1','Уменьшены'],['2','Отсутствуют']]}
  ],
  calc(v){
    const s=v.gen+v.eyes+v.mm+v.tears;
    let k,t,d;
    if(s===0){k='ok';t='Обезвоживания нет';d='менее 3% массы тела'}
    else if(s<=4){k='warn';t='Лёгкое или среднее обезвоживание';d='3–9% массы тела'}
    else{k='bad';t='Тяжёлое обезвоживание';d='10% массы тела и больше'}
    return `<div class="score">${s}<small> из 8</small></div>${lvl(k,t)}${rows([['Дефицит жидкости',d]])}`+
      `<p class="note">${s===0?'Достаточно обычного питья и наблюдения.':s<=4?'Показана оральная регидратация, оцените эффективность через 3–4 часа.':'Нужна инфузионная терапия и госпитализация.'} Объём жидкости посчитайте на вкладке «Жидкость у детей».</p>`;
  }
};

/* ---------- Eufillin ---------- */
const euf={
  id:'euf',name:'Расчёт дозы эуфиллина',
  intro:'Сколько раствора эуфиллина набрать и разбавить 0,9% NaCl, чтобы при скорости инфузии 1 мл/ч пациент получил заданную суточную дозу.',
  fields:[
    {id:'kg',l:'Масса тела',u:'кг',v:10},
    {id:'dose',l:'Суточная доза',u:'мг/кг/сут',v:10},
    {id:'conc',l:'Раствор эуфиллина',u:'%',v:2.4,h:'2,4% — это 24 мг в 1 мл'},
    {id:'vol',l:'Объём шприца',u:'мл',v:20},
    {id:'rate',l:'Скорость инфузии',u:'мл/ч',v:1}
  ],
  calc(v){
    const W=v.kg,D=v.dose,C=v.conc*10,V=v.vol,R=v.rate;
    if(!(W>0&&D>0&&C>0&&V>0&&R>0))return '<p class="note">Введите массу, дозу, объём шприца и скорость.</p>';
    const day=W*D, h=day/24, perMl=h/R, tot=perMl*V, ml=tot/C, nacl=V-ml, hrs=V/R;
    const warn=ml>V?`<div class="banner" style="background:var(--bad-soft);color:var(--bad)">Нужное количество эуфиллина (${nf(ml,2)} мл) больше объёма шприца. Увеличьте скорость или объём шприца, либо возьмите более концентрированный раствор.</div>`:'';
    return `<div class="big">${nf(ml,2)} мл эуфиллина</div><div class="big" style="margin-top:4px">+ ${nf(Math.max(nacl,0),2)} мл 0,9% NaCl</div>`+
      `<p class="note" style="margin-top:6px">Всего ${nf(V,0)} мл в шприце, скорость ${nf(R,1)} мл/ч.</p>${warn}`+
      rows([['Суточная доза',`${nf(day,1)} мг`],['Доза в час',`${nf(h,2)} мг/ч`],['Концентрация в шприце',`${nf(perMl,2)} мг/мл`],['Эуфиллина в шприце',`${nf(tot,1)} мг`],['Шприц закончится через',`${nf(hrs,1)} ч`]])+
      `<p class="note">Расчёт: доза за сутки делится на 24 часа и на скорость, затем умножается на объём шприца.</p>`;
  }
};

/* ---------- Fluids in children ---------- */
const fl={
  id:'fl',name:'Расчёт гидробаланса',
  intro:'Суточная потребность в жидкости у детей двумя способами: по площади поверхности тела и по формуле Холлидея — Сегара. При пневмонии и нейроинфекции потребность снижается до 80% от исходной.',
  fields:[
    {id:'age',t:'age',l:'Возраст',p:'число'},
    {id:'kg',l:'Масса тела',u:'кг',p:'например, 12'},
    {id:'h',l:'Рост',u:'см',h:'Необязательно: с ростом площадь считается по Мостеллеру'},
    {id:'m',t:'sel',l:'Способ расчёта',d:'hs',o:[['hs','Холлидей — Сегар'],['bsa','По площади тела']]},
    {id:'k',l:'Норма на 1 м²',u:'мл/сут',v:1500,h:'Обычно 1500–2000, для способа по площади'},
    {id:'pn',t:'chk',l:'Пневмония',h:'80% от исходной'},
    {id:'ni',t:'chk',l:'Нейроинфекция',h:'80% от исходной'},
    {id:'def',l:'Дефицит жидкости',u:'% массы',p:'например, 5',h:'Степень можно оценить на вкладке CDS'},
    {id:'loss',l:'Текущие потери',u:'мл/сут',h:'Рвота, диарея, лихорадка — по учёту'}
  ],
  calc(v){
    const w=v.kg;
    if(!(w>0))return '<p class="note">Введите массу тела ребёнка.</p>';
    const ageM=isNaN(v.age)?NaN:(v.au==='y'?v.age*12:v.age);
    const hs=w<=10?100*w:w<=20?1000+50*(w-10):1500+20*(w-20);
    const bsa=v.h>0?Math.sqrt(v.h*w/3600):(4*w+7)/(w+90);
    const area=bsa*(v.k>0?v.k:1500);
    const useHs=v.m!=='bsa';
    const base=useHs?hs:area;
    const other=useHs?area:hs;
    const restr=v.pn||v.ni;
    const maint=restr?base*0.8:base;
    const deficit=(v.def>0?v.def:0)*10*w, loss=v.loss>0?v.loss:0;
    const total=maint+deficit+loss;
    const warn=!isNaN(ageM)&&ageM<1?'<div class="banner">Ребёнку меньше месяца: обе формулы для новорождённых не подходят, нужна возрастная таблица.</div>':(!isNaN(ageM)&&ageM>=216?'<div class="banner">Пациент старше 18 лет: формулы рассчитаны на детей.</div>':'');
    return `<div class="big">${nf(total,0)} мл/сут</div>`+
      `<p class="note" style="margin-top:4px">Это ${nf(total/24,0)} мл/ч, или ${nf(total/w,0)} мл/кг в сутки.</p>${warn}`+
      rows([[useHs?'Холлидей — Сегар':'По площади тела',`${nf(base,0)} мл`],...(restr?[['80% от исходной',`${nf(maint,0)} мл`]]:[]),['Дефицит',`${nf(deficit,0)} мл`],['Текущие потери',`${nf(loss,0)} мл`],['Площадь поверхности',`${nf(bsa,2)} м²`],[useHs?'Для сравнения, по площади':'Для сравнения, Холлидей — Сегар',`${nf(restr?other*0.8:other,0)} мл`]])+
      `<p class="note">Холлидей — Сегар: 100 мл/кг на первые 10 кг, 50 мл/кг на следующие 10 кг, 20 мл/кг на каждый кг сверх 20. Площадь без роста считается по формуле (4 × масса + 7) / (масса + 90), с ростом — по Мостеллеру. Снижение до 80% применяется к исходной потребности, дефицит и потери добавляются сверху. Дефицит обычно восполняют оральной регидратацией, инфузия — при её неэффективности.</p>`;
  }
};

const CALCS=[smart,curb,sofa,cds,fl,euf];
function initCalcs(){
  const tabs=$('#calc-tabs'),box=$('#calc-box');
  tabs.innerHTML=CALCS.map((c,i)=>`<button role="tab" data-c="${c.id}" aria-selected="${i===0}">${c.name}</button>`).join('');
  box.innerHTML=CALCS.map((c,i)=>`<div class="calc${i===0?' on':''}" id="calc-${c.id}"><div class="calc-grid"><div class="card"><p class="lead" style="margin-bottom:14px">${c.intro}</p><div class="fields ${c.fields.filter(f=>f.t!=='chk').length>4?'two':''}">${c.fields.filter(f=>f.t!=='chk').map(f=>fieldHtml(c.id,f)).join('')}</div>${c.fields.some(f=>f.t==='chk')?`<div class="checks">${c.fields.filter(f=>f.t==='chk').map(f=>fieldHtml(c.id,f)).join('')}</div>`:''}</div><div class="res" id="res-${c.id}" aria-live="polite"></div></div></div>`).join('');
  const run=c=>{const v=readVals(c.id,c.fields);$('#res-'+c.id).innerHTML=c.calc(v)};
  CALCS.forEach(c=>{
    c.fields.forEach(f=>{
      const el=$('#'+c.id+'-'+f.id);
      if(f.id==='cr'||f.id==='bili'){}
      el.addEventListener('input',()=>run(c));el.addEventListener('change',()=>run(c));
      if(f.t==='age')$('#'+c.id+'-au').addEventListener('change',()=>run(c));
    });
    run(c);
  });
  tabs.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    $$('button',tabs).forEach(x=>x.setAttribute('aria-selected',x===b));
    $$('.calc',box).forEach(x=>x.classList.toggle('on',x.id==='calc-'+b.dataset.c));
  });
}
