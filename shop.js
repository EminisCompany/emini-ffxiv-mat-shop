
let CAT=[],S={items:[]};const CI={};
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CATS=["All","Ingots","Fittings","Lumber","Gems","Misc"];
const imgOf=i=>i.img||(CI[i.ic]&&CI[i.ic].icon)||"";
const ico=i=>`<div class="ico"><img src="${imgOf(i)}" alt="${esc(i.name)}"></div>`;
const cls=i=>i.qty<=0?"out":i.qty<100?"low":"";
const fmt=i=>i.qty>0?"x"+i.qty.toLocaleString():"sold out";
const gil=n=>Number(n).toLocaleString()+' gil';
const shown=()=>S.items.filter(i=>!i.hide);
let view=0,filt="All",sel=0,dirty=false,saving=false,uid=0;
let tt;function toast(t){const e=$('toast');e.textContent=t;e.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>e.classList.remove('show'),2800)}
function dm(name){const m=`Hi Emini! I'd like to buy: ${name}`;try{navigator.clipboard.writeText(m).then(()=>toast('Message copied! Now DM @eminiwells on Discord ♡'),()=>toast('DM @eminiwells on Discord and ask for '+name))}catch(e){toast('DM @eminiwells on Discord and ask for '+name)}}
document.addEventListener('click',e=>{const b=e.target.closest('[data-dm]');if(b)dm(S.items.find(i=>i.id===b.dataset.dm).name)});
const buy=i=>`<button class="btn" ${i.qty>0?'':'disabled'} data-dm="${i.id}">${i.qty>0?'DM to buy ♡':'out of stock'}</button>`;

function head(t,sub){return `<div class="hero"><h1>${t}</h1><p>${sub}</p><span class="pill">DM @eminiwells on Discord to buy</span><div class="upd">Updated ${esc(S.updated||'')}</div></div>`}
function vCards(){
 const items=shown().filter(i=>filt==="All"||i.cat===filt);
 return head('✿ Emini\'s Mat Shop ✿','Bulk submarine mats, stocked fresh~')+
 `<div class="chips">${CATS.map(c=>`<span class="${c===filt?'on':''}" data-f="${c}">${c}</span>`).join('')}</div>`+
 (items.length?`<div class="grid1">${items.map(i=>`<div class="card">${ico(i)}<h3>${esc(i.name)}</h3><div class="row"><span class="qty ${cls(i)}">${fmt(i)}</span><span class="price">${gil(i.price)}</span></div>${buy(i)}</div>`).join('')}</div>`:'<div class="empty">Nothing in this shelf right now. Check back soon ♡</div>')}
function vList(){
 const it=shown(),mx=Math.max(1,...it.map(i=>i.qty));
 return head('♡ Emini\'s Mat Shop ♡','The full stock list')+(it.length?`<div class="list">${it.map(i=>`<div class="lr">${ico(i)}<div class="nm">${esc(i.name)}<small>${esc(i.cat)}</small></div><span class="qty ${cls(i)}" style="justify-self:start">${fmt(i)}</span><div class="meter"><i style="width:${Math.max(0,i.qty)/mx*100}%"></i></div><button class="btn" ${i.qty>0?'':'disabled'} data-dm="${i.id}">DM ♡</button></div>`).join('')}</div>`:'<div class="empty">Restocking soon ♡</div>')}
function vSlots(){
 const it=shown();if(sel>=it.length)sel=0;const i=it[sel];
 return `<div class="wrap3"><div class="hero" style="margin-top:0"><h1>✧ Emini's Stockroom ✧</h1><p>Tap a slot to peek inside</p></div><div class="slots">${it.map((x,k)=>`<div class="slot ${k===sel?'sel':''}" data-s="${k}" title="${esc(x.name)}">${ico(x)}<span class="n">${x.qty>999?(x.qty/1000).toFixed(1)+'k':x.qty||''}</span></div>`).join('')}${Array(8).fill('<div class="slot blank"></div>').join('')}</div>`+
 (i?`<div class="detail">${ico(i)}<div style="flex:1;min-width:0"><h3>${esc(i.name)}</h3><p>${esc(i.cat)} · ${fmt(i)} · ${gil(i.price)} ea</p>${buy(i)}</div></div>`:'')+`</div>`}
function vPoster(){
 const it=shown().filter(i=>i.qty>0);
 return `<div class="poster"><div class="hd"><h2>✿ Emini's Mat Shop ✿</h2><p>SUBMARINE MATS · UPDATED ${esc((S.updated||'').toUpperCase())}</p></div>${it.map(i=>`<div class="it">${ico(i)}<div class="nm">${esc(i.name)}</div><div class="x">${fmt(i)}</div></div>`).join('')}<div class="ft">DM <b>@eminiwells</b> on Discord to order ♡</div></div>`}
const VIEWS=[["Cards",vCards],["List",vList],["Slots",vSlots],["Poster",vPoster]];
function render(){
 $('tabs').innerHTML=VIEWS.map((v,k)=>`<button class="${k===view?'on':''}" data-v="${k}">${v[0]}</button>`).join('');
 $('views').innerHTML=VIEWS[view][1]();
 if(window.onShopRender)window.onShopRender();
}
document.addEventListener('click',e=>{
 const v=e.target.closest('[data-v]');if(v){view=+v.dataset.v;render()}
 const f=e.target.closest('[data-f]');if(f){filt=f.dataset.f;render()}
 const s=e.target.closest('[data-s]');if(s){sel=+s.dataset.s;render()}
});


async function boot(){
 try{
  const [c,st]=await Promise.all([fetch('catalog.json',{cache:'no-cache'}).then(r=>r.json()),fetch('stock.json',{cache:'no-cache'}).then(r=>r.json())]);
  CAT=c;CAT.forEach(x=>CI[x.id]=x);S=st;
 }catch(e){document.getElementById('views').innerHTML='<div class="empty">Shop is restocking. Please check back in a moment ♡</div>';return}
 render();if(window.onShopReady)window.onShopReady();
}
boot();
