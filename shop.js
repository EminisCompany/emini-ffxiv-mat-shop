/* Emini's FFXIV Mat Shop: public storefront. Reads catalog.json + stock.json, renders, and builds a Discord order message. */
let CAT=[],S={items:[]};const CI={};
let dirty=false,saving=false,uid=0; // shared with admin.js
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const N=n=>Number(n||0).toLocaleString('en-US');
const HANDLE='eminiwells';
const GIL='<img class="gil" src="icons/gil.png" alt="" aria-hidden="true">';
const CATS=["All","Ingots","Fittings","Lumber","Gems","Misc"];
const IC={
 plus:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M8 3v10M3 8h10"/></svg>',
 check:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.5l3 3 6-7"/></svg>',
 x:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>'
};
const LOTUS='<svg class="lotus" viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16 4.5c3.2 3.6 4.6 7.6 4.6 11.4 0 4.2-1.8 7.6-4.6 9.8-2.8-2.2-4.6-5.6-4.6-9.8 0-3.8 1.4-7.8 4.6-11.4z"/><path fill="currentColor" opacity=".72" d="M4.2 11.6c4.4.2 8 2.2 10 5.8 1.3 2.4 1.7 5.2 1.8 8.3-3.9-.2-7.6-1.7-9.8-5.3-1.6-2.6-2.2-5.6-2-8.8zM27.8 11.6c-4.4.2-8 2.2-10 5.8-1.3 2.4-1.7 5.2-1.8 8.3 3.9-.2 7.6-1.7 9.8-5.3 1.6-2.6 2.2-5.6 2-8.8z"/><path fill="currentColor" opacity=".45" d="M3 22.5c3.6 3.2 8 4.6 13 4.6s9.4-1.4 13-4.6c-3.4 1-6.6 1.4-9.6 1.2H12.6c-3 .2-6.2-.2-9.6-1.2z"/></svg>';

const imgOf=i=>i.img||(CI[i.ic]&&CI[i.ic].icon)||'';
const ico=i=>`<span class="tile"><img src="${imgOf(i)}" alt="" loading="lazy" width="40" height="40"></span>`;
const stock=i=>i.qty<=0?'<span class="stock out">Sold out</span>':i.qty<100?`<span class="stock low">Only ${N(i.qty)} left</span>`:`<span class="stock in">${N(i.qty)} in stock</span>`;
const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const ui=Object.assign({cat:'All',sort:'name',view:'grid',stockOnly:false},store.get('emini_ui',{}),{q:''});
let order=store.get('emini_order',{});
const saveUi=()=>store.set('emini_ui',{cat:ui.cat,sort:ui.sort,view:ui.view,stockOnly:ui.stockOnly});
const saveOrder=()=>store.set('emini_order',order);

const visible=()=>S.items.filter(i=>!i.hide);
const byId=id=>S.items.find(i=>i.id===id);
function matches(i,q){return !q||i.name.toLowerCase().includes(q)||i.cat.toLowerCase().includes(q)}
function filtered(){
 const q=ui.q.trim().toLowerCase();
 const sorts={name:(a,b)=>a.name.localeCompare(b.name),low:(a,b)=>a.price-b.price,high:(a,b)=>b.price-a.price,stock:(a,b)=>b.qty-a.qty};
 const by=sorts[ui.sort]||sorts.name;
 return visible().filter(i=>(ui.cat==='All'||i.cat===ui.cat)&&(!ui.stockOnly||i.qty>0)&&matches(i,q))
  .sort((a,b)=>(a.qty>0)===(b.qty>0)?by(a,b):(a.qty>0?-1:1));
}
function hl(name){
 const q=ui.q.trim();if(!q)return esc(name);
 const k=name.toLowerCase().indexOf(q.toLowerCase());if(k<0)return esc(name);
 return esc(name.slice(0,k))+'<mark>'+esc(name.slice(k,k+q.length))+'</mark>'+esc(name.slice(k+q.length));
}
function addBtn(i){
 if(i.qty<=0)return '<button class="add" disabled>Sold out</button>';
 const q=order[i.id];
 return `<div class="buy"><input class="amt" type="number" inputmode="numeric" min="1" max="${i.qty}" placeholder="Amount" value="${q||''}" data-pick="${i.id}" id="pk_${i.id}" aria-label="Amount of ${esc(i.name)}">`
  +`<button class="all" data-all="${i.id}" title="Add all ${N(i.qty)}">All</button>`
  +`<button class="add ${q?'in-order':''}" data-add="${i.id}">${q?IC.check+'Added':IC.plus+'Add'}</button></div>`;
}

/* ---------- rendering ---------- */
function renderChrome(){
 const q=ui.q.trim().toLowerCase();
 const base=visible().filter(i=>(!ui.stockOnly||i.qty>0)&&matches(i,q));
 $('cats').innerHTML=CATS.map(c=>{const n=c==='All'?base.length:base.filter(i=>i.cat===c).length;
  return `<button class="cat ${c===ui.cat?'on':''}" data-cat="${c}" aria-pressed="${c===ui.cat}">${c}<span class="n">${n}</span></button>`}).join('');
 const v=visible();
 $('fIn').textContent=N(v.filter(i=>i.qty>0).length);
 $('fAll').textContent=N(v.length);
 $('fUpd').textContent=S.updated||'–';
 $('sort').value=ui.sort;
 $('stockOnly').checked=ui.stockOnly;
 document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('on',b.dataset.view===ui.view);b.setAttribute('aria-pressed',b.dataset.view===ui.view)});
 const n=Object.keys(order).length;$('orderCount').textContent=n;
}
function renderItems(){
 const it=filtered(),el=$('items'),total=visible().length;
 $('count').textContent=ui.q.trim()?`${it.length} of ${total} materials match “${ui.q.trim()}”`:`Showing ${it.length} of ${total} materials · prices are per unit`;
 if(!it.length){el.innerHTML=`<div class="empty"><p>Nothing here${ui.q.trim()?` for “${esc(ui.q.trim())}”`:''}. Try another name or category.</p><button class="btn" data-reset>Clear search and filters</button></div>`;return}
 if(ui.view==='list'){
  el.innerHTML=`<div class="list">${it.map(i=>`<div class="row ${i.qty<=0?'is-out':''}">${ico(i)}<div class="nm">${hl(i.name)}<small>${i.cat}</small></div>${stock(i)}<div class="price">${GIL}${N(i.price)}</div>${addBtn(i,true)}</div>`).join('')}</div>`;
 }else{
  el.innerHTML=`<div class="grid">${it.map(i=>`<article class="card ${i.qty<=0?'is-out':''}"><div class="card-top">${ico(i)}<div><h3>${hl(i.name)}</h3><span class="kind">${i.cat}</span></div></div><div class="card-mid"><span class="price">${GIL}${N(i.price)}<small> each</small></span>${stock(i)}</div>${addBtn(i)}</article>`).join('')}</div>`;
 }
}
function cleanOrder(){
 for(const id of Object.keys(order)){const i=byId(id);if(!i||i.hide||i.qty<=0)delete order[id];else order[id]=Math.max(1,Math.min(i.qty,Math.floor(order[id])||1))}
}
function orderText(){
 const ids=Object.keys(order);if(!ids.length)return '';
 let t=0;const lines=ids.map(id=>{const i=byId(id),q=order[id],s=q*i.price;t+=s;return `• ${N(q)} × ${i.name} = ${N(s)} gil`});
 return `Hi Emini! I'd like to order:\n${lines.join('\n')}\nTotal: ${N(t)} gil`;
}
function renderDrawer(){
 const ids=Object.keys(order);
 const total=ids.reduce((s,id)=>s+order[id]*byId(id).price,0);
 $('lines').innerHTML=ids.length?ids.map(id=>{const i=byId(id),q=order[id];return `<div class="line">${ico(i)}<div><div class="nm">${esc(i.name)}</div><div class="sub">${GIL}${N(i.price)} each · ${N(i.qty)} available</div></div>
  <div class="line-r"><div class="qtybox"><button data-dec="${id}" aria-label="Fewer ${esc(i.name)}">−</button><input type="number" inputmode="numeric" min="1" max="${i.qty}" value="${q}" data-q="${id}" id="oq_${id}" aria-label="Quantity of ${esc(i.name)}"><button data-inc="${id}" aria-label="More ${esc(i.name)}">+</button></div><div style="display:flex;gap:12px">${q<i.qty?`<button class="rm" data-max="${id}">All ${N(i.qty)}</button>`:''}<button class="rm" data-rm="${id}">Remove</button></div></div></div>`}).join('')
  :`<div class="drawer-empty">${LOTUS}<p>Your order is empty.<br>Add materials from the shop to build a message.</p></div>`;
 $('total').innerHTML=GIL+N(total);
 $('msg').value=orderText();
 $('copyOrder').disabled=!ids.length;$('clearOrder').disabled=!ids.length;
 $('drawerFoot').hidden=!ids.length;
}
function render(){cleanOrder();renderChrome();renderItems();renderDrawer();if(window.onShopRender)window.onShopRender()}

/* ---------- interactions ---------- */
let tt;function toast(t){const e=$('toast');e.textContent=t;e.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>e.classList.remove('show'),3000)}
async function copy(text,ok,fallbackEl){
 try{await navigator.clipboard.writeText(text);toast(ok)}
 catch(e){if(fallbackEl){fallbackEl.focus();fallbackEl.select()}toast('Copy blocked here. The text is selected, press Ctrl+C (⌘C on Mac).')}
}
let lastFocus=null;
function openDrawer(){lastFocus=document.activeElement;$('drawer').hidden=false;$('scrim').hidden=false;document.body.style.overflow='hidden';$('closeDrawer').focus()}
function closeDrawer(){$('drawer').hidden=true;$('scrim').hidden=true;document.body.style.overflow='';if(lastFocus&&lastFocus.focus)lastFocus.focus()}
function setQty(id,v){const i=byId(id);if(!i)return;order[id]=Math.max(1,Math.min(i.qty,Math.floor(v)||1));saveOrder()}

document.addEventListener('click',e=>{
 const t=e.target.closest('button,[data-cat]');if(!t)return;
 if(t.dataset.cat){ui.cat=t.dataset.cat;saveUi();renderChrome();renderItems();return}
 if(t.dataset.view){ui.view=t.dataset.view;saveUi();renderChrome();renderItems();return}
 if(t.dataset.add){addFromInput(t.dataset.add);return}
 if(t.dataset.all){const i=byId(t.dataset.all);order[i.id]=i.qty;saveOrder();renderAll();toast(`Added all ${N(i.qty)} × ${i.name}`);return}
 if(t.dataset.max){const i=byId(t.dataset.max);setQty(i.id,i.qty);renderAll();return}
 if('open' in t.dataset||t.id==='orderBtn'){openDrawer();return}
 if(t.id==='closeDrawer'){closeDrawer();return}
 if(t.dataset.inc){setQty(t.dataset.inc,order[t.dataset.inc]+1);renderAll();return}
 if(t.dataset.dec){setQty(t.dataset.dec,order[t.dataset.dec]-1);renderAll();return}
 if(t.dataset.rm){delete order[t.dataset.rm];saveOrder();renderAll();return}
 if(t.id==='clearOrder'){order={};saveOrder();renderAll();return}
 if(t.id==='copyOrder'){copy(orderText(),`Order copied! Paste it in a DM to @${HANDLE} on Discord`,$('msg'));return}
 if(t.id==='contactBtn'){copy(HANDLE,`Copied @${HANDLE}. Find Emini on Discord ♡`);return}
 if('reset' in t.dataset){ui.q='';ui.cat='All';ui.stockOnly=false;$('q').value='';saveUi();renderChrome();renderItems();return}
});
function renderAll(){renderChrome();renderItems();renderDrawer()}
function addFromInput(id){
 const i=byId(id),inp=$('pk_'+id),v=Math.floor(+(inp&&inp.value));
 if(!v||v<1){toast('Type an amount first, or tap All');if(inp)inp.focus();return}
 const q=Math.min(v,i.qty);order[id]=q;saveOrder();renderAll();
 toast(v>i.qty?`Only ${N(i.qty)} in stock, added all of them`:`${N(q)} × ${i.name} in your order`);
}
document.addEventListener('keydown',e=>{const id=e.target.dataset&&e.target.dataset.pick;if(id&&e.key==='Enter'){e.preventDefault();addFromInput(id)}});
$('scrim').addEventListener('click',closeDrawer);
$('q').addEventListener('input',e=>{ui.q=e.target.value;renderChrome();renderItems()});
$('sort').addEventListener('change',e=>{ui.sort=e.target.value;saveUi();renderItems()});
$('stockOnly').addEventListener('change',e=>{ui.stockOnly=e.target.checked;saveUi();renderChrome();renderItems()});
document.addEventListener('change',e=>{
 const d=e.target.dataset||{};
 if(d.q){setQty(d.q,+e.target.value);renderAll()}
 if(d.pick&&order[d.pick]){const v=Math.floor(+e.target.value);if(v>=1){setQty(d.pick,v);renderAll()}}
});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&!$('drawer').hidden){closeDrawer();return}
 const typing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
 if(e.key==='/'&&!typing){e.preventDefault();$('q').focus()}
});

async function boot(){
 try{
  const [c,st]=await Promise.all([fetch('catalog.json',{cache:'no-cache'}).then(r=>r.json()),fetch('stock.json',{cache:'no-cache'}).then(r=>r.json())]);
  CAT=c;CAT.forEach(x=>CI[x.id]=x);S=st;
 }catch(e){$('items').innerHTML='<div class="empty"><p>The shelves are being restocked. Please check back in a moment.</p></div>';return}
 render();if(window.onShopReady)window.onShopReady();
}
boot();
