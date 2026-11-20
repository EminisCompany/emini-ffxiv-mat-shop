/* Admin editor. Loaded only by admin-lotus.html. It can edit stock on screen, but it can only
   publish when a GitHub token with write access to the repo is entered. The token is kept in this browser only. */
let aq=null;
const LS={get(k){try{return localStorage.getItem(k)||''}catch(e){return ''}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const cfg=()=>({repo:LS.get('emini_repo'),branch:LS.get('emini_branch')||'main',path:LS.get('emini_path')||'stock.json',token:LS.get('emini_token')});
window.onShopRender=renderAdmin;
function catOf(n){return /Topaz|Rhodonite|Celestine|Larimar|Triphane/.test(n)?"Gems":/Lumber/.test(n)?"Lumber":/Ingot|Nugget/.test(n)?"Ingots":/Rivets|Nails|Plate/.test(n)?"Fittings":"Misc"}
function renderAdmin(){
 const a=$('admin');a.hidden=false;
 const used=new Set(S.items.map(i=>i.ic).filter(Boolean));
 const free=CAT.filter(c=>!used.has(c.id));
 const fid=document.activeElement&&document.activeElement.id;
 const c=cfg();
 a.innerHTML=`<div class="adminbar"><b>✿ Admin · changes show on the public shop after you save</b><span id="dirtyTag" class="sm" style="margin:0">${dirty?'Unsaved changes':'All saved'}</span><button id="dlBtn">Download stock.json</button><button class="go" id="saveBtn" ${dirty&&!saving?'':'disabled'}>${saving?'Saving…':'Save & publish'}</button></div>
 <div class="adm"><h3>Stock</h3>${S.items.map(i=>`<div class="arow ${i.hide?'hid':''}" data-id="${i.id}">${ico(i)}<div class="nm">${esc(i.name)}</div>
  <div class="step"><button data-a="dec" aria-label="Minus 100">−</button><input class="q" type="number" min="0" step="1" value="${i.qty}" data-a="qty" id="q_${i.id}" aria-label="Quantity of ${esc(i.name)}"><button data-a="inc" aria-label="Plus 100">+</button></div>
  <div class="pr"><input class="p" type="number" min="0" step="1" value="${i.price}" data-a="price" id="p_${i.id}" aria-label="Price of ${esc(i.name)}"></div>
  <div style="display:flex;gap:6px"><button data-a="hide">${i.hide?'Show':'Hide'}</button><button data-a="del">Remove</button></div></div>`).join('')||'<p class="sm">No items yet. Add one below.</p>'}
  <p class="sm">The +/− buttons move quantity by 100. Hidden items stay in this list but customers can't see them.</p></div>
 <div class="adm"><h3>Add an item</h3><div class="addrow"><select id="addSel" aria-label="Catalog item">${free.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')||'<option value="">All catalog items added</option>'}</select><input class="q" id="addQty" type="number" min="0" value="1000" aria-label="Starting quantity"><input class="p" id="addPrice" type="number" min="0" placeholder="gil" aria-label="Price"><button id="addBtn" ${free.length?'':'disabled'}>Add</button></div>
  <div class="addrow"><input id="cName" type="text" placeholder="Custom item name" aria-label="Custom item name" style="flex:1;min-width:140px"><input id="cImg" type="file" accept="image/*" aria-label="Custom item image"><button id="cBtn">Add custom item</button></div>
  <p class="sm">Catalog items use the real in-game icon. A custom item uses an image you upload.</p></div>
 <div class="adm"><h3>Publishing setup (one time)</h3>
  <div class="addrow"><input id="cfgRepo" type="text" placeholder="github-user/repo-name" value="${esc(c.repo)}" aria-label="GitHub repo" style="flex:1;min-width:180px"><input id="cfgBranch" type="text" placeholder="main" value="${esc(c.branch)}" aria-label="Branch" style="width:90px"></div>
  <div class="addrow"><input id="cfgToken" type="password" placeholder="GitHub token" value="${esc(c.token)}" aria-label="GitHub token" autocomplete="off" style="flex:1;min-width:180px"><button id="cfgSave">Remember on this device</button></div>
  <p class="sm">Use a fine-grained token limited to this one repo with "Contents: read and write". It stays in this browser and is never in the site files. Without it you can still edit and use Download stock.json, then commit that file yourself.</p></div>`;
 if(fid){const f=$(fid);if(f)f.focus()}
}
function mark(){dirty=true;const t=$('dirtyTag'),b=$('saveBtn');if(t)t.textContent='Unsaved changes';if(b&&!saving)b.disabled=false}
document.addEventListener('input',e=>{
 const t=e.target;if(!t.dataset||!t.dataset.a)return;
 const row=t.closest('.arow');if(!row)return;
 const it=S.items.find(i=>i.id===row.dataset.id);if(!it)return;
 const n=Math.max(0,Math.floor(+t.value)||0);
 if(t.dataset.a==='qty')it.qty=n;if(t.dataset.a==='price')it.price=n;
 mark();clearTimeout(aq);aq=setTimeout(()=>{$('views').innerHTML=VIEWS[view][1]()},250);
});
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 const row=b.closest('.arow');
 if(row&&b.dataset.a){
  const it=S.items.find(i=>i.id===row.dataset.id);if(!it)return;
  if(b.dataset.a==='inc')it.qty+=100;
  if(b.dataset.a==='dec')it.qty=Math.max(0,it.qty-100);
  if(b.dataset.a==='hide')it.hide=!it.hide;
  if(b.dataset.a==='del')S.items=S.items.filter(i=>i!==it);
  mark();render();return}
 if(b.id==='addBtn'){const c=CI[$('addSel').value];if(!c)return;
  S.items.push({id:'i'+Date.now()+(uid++),name:c.name,ic:c.id,qty:Math.max(0,+$('addQty').value||0),price:Math.max(0,+$('addPrice').value||c.price||0),cat:catOf(c.name)});mark();render();toast('Added '+c.name)}
 if(b.id==='cBtn'){const n=$('cName').value.trim(),f=$('cImg').files[0];if(!n||!f){toast('Add a name and an image first');return}
  const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=c.height=96;const x=c.getContext('2d');const k=Math.min(96/im.width,96/im.height);x.drawImage(im,(96-im.width*k)/2,(96-im.height*k)/2,im.width*k,im.height*k);
   S.items.push({id:'i'+Date.now()+(uid++),name:n,img:c.toDataURL('image/png'),qty:100,price:50,cat:'Misc'});mark();render();toast('Added '+n)};im.src=r.result};r.readAsDataURL(f)}
 if(b.id==='cfgSave'){LS.set('emini_repo',$('cfgRepo').value.trim());LS.set('emini_branch',$('cfgBranch').value.trim()||'main');LS.set('emini_token',$('cfgToken').value.trim());toast('Saved on this device ♡')}
 if(b.id==='dlBtn'){const bl=new Blob([json()],{type:'application/json'});const u=URL.createObjectURL(bl);const l=document.createElement('a');l.href=u;l.download='stock.json';document.body.appendChild(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(u),1000)}
 if(b.id==='saveBtn')save();
});
function json(){S.updated=new Date().toLocaleDateString(undefined,{month:'short',day:'numeric'});return JSON.stringify(S,null,1)+'\n'}
const b64=s=>{const by=new TextEncoder().encode(s);let o='';by.forEach(x=>o+=String.fromCharCode(x));return btoa(o)};
async function save(){
 const c=cfg();
 if(!c.repo||!c.token){toast('Fill in Publishing setup first, or use Download stock.json');return}
 saving=true;renderAdmin();
 const url=`https://api.github.com/repos/${c.repo}/contents/${c.path}`;
 const H={Authorization:'Bearer '+c.token,Accept:'application/vnd.github+json'};
 try{
  const g=await fetch(url+'?ref='+encodeURIComponent(c.branch),{headers:H});
  const sha=g.ok?(await g.json()).sha:undefined;
  if(!g.ok&&g.status!==404)throw new Error('read '+g.status);
  const p=await fetch(url,{method:'PUT',headers:H,body:JSON.stringify({message:'Update stock',content:b64(json()),branch:c.branch,sha})});
  if(!p.ok)throw new Error('write '+p.status);
  dirty=false;toast('Published! The shop updates in about a minute ♡');
 }catch(err){toast('Could not publish ('+err.message+'). Check repo, branch and token.')}
 saving=false;renderAdmin();
}
window.onShopReady=renderAdmin;
