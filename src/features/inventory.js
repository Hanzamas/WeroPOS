import { t, formatEur } from '../i18n/index.js';
import { openSheet, closeSheet, toast } from '../components/ui.js';
export function render(store){
  const {products}=store.state;
  return `
  <div class="search"><input id="prodSearch" class="i" placeholder="Search produk..." /><button class="btn ghost" id="catFilterBtn">Cat</button></div>
  <div class="scr">
  <div style="display:flex;gap:8px;overflow-x:auto" class="chips" id="catChips">${[...new Set(products.map(p=>p.category))].map(c=>`<button class="pill" data-cat="${c}">${c}</button>`).join('')}<button class="pill on" data-cat="">All</button></div>
  <div class="pgrid" id="pgrid">${products.map(p=>`<div class="pcard" data-id="${p.id}"><div class="row" style="justify-content:space-between"><b style="font-size:13px">${p.name}</b>${p.stock<=5?'<span style="font-size:10px;background:#ef444422;color:#ef4444;padding:2px 6px;border-radius:6px">low</span>':''}</div><div class="muted">${p.category} • ${p.sku||'-'}</div><div style="margin-top:4px;display:flex;justify-content:space-between;align-items:center"><b>${formatEur(p.priceCents)}</b><span class="muted">stok ${p.stock}</span></div></div>`).join('')}</div>
  <button class="btn primary full" id="addProdBtn" style="margin-top:12px">+ ${t('addProd')}</button>
  </div>
  `;
}
export function mount(root,store){
  const searchEl=document.getElementById('prodSearch');
  const gridEl=document.getElementById('pgrid');
  let activeCat='';
  function refresh(){
    const q=searchEl?.value||'';
    const list=store.search(q,activeCat);
    gridEl.innerHTML=list.map(p=>`<div class="pcard" data-id="${p.id}"><div class="row" style="justify-content:space-between"><b style="font-size:13px">${p.name}</b>${p.stock<=5?'<span style="font-size:10px;background:#ef444422;color:#ef4444;padding:2px 6px;border-radius:6px">low</span>':''}</div><div class="muted">${p.category} • ${p.sku||'-'}</div><div style="margin-top:4px;display:flex;justify-content:space-between;align-items:center"><b>${formatEur(p.priceCents)}</b><span class="muted">stok ${p.stock}</span></div></div>`).join('') || '<div class="empty">Belum ada produk</div>';
    gridEl.querySelectorAll('.pcard').forEach(el=>{ el.addEventListener('click',()=>editProd(el.dataset.id)); });
  }
  searchEl?.addEventListener('input',refresh);
  root.querySelectorAll('[data-cat]').forEach(b=>b.addEventListener('click',()=>{ activeCat=b.dataset.cat; root.querySelectorAll('[data-cat]').forEach(x=>x.classList.remove('on')); b.classList.add('on'); refresh(); }));
  gridEl.querySelectorAll('.pcard').forEach(el=>el.addEventListener('click',()=>editProd(el.dataset.id)));
  document.getElementById('addProdBtn')?.addEventListener('click',()=>addProd());
  function addProd(){
    const body=`<div style="display:flex;flex-direction:column;gap:10px"><div class="fld"><label>Nama</label><input id="f_name" class="i" placeholder="Nasi Goreng"/></div><div class="grid2"><div class="fld"><label>Harga € (contoh 5.95)</label><input id="f_price" class="i" type="number" step="0.01" placeholder="5.95"/></div><div class="fld"><label>Stok</label><input id="f_stock" class="i" type="number" placeholder="20"/></div></div><div class="grid2"><div class="fld"><label>Kategori</label><input id="f_cat" class="i" placeholder="Makanan"/></div><div class="fld"><label>SKU</label><input id="f_sku" class="i" placeholder="NG001"/></div></div><div class="fld"><label>Barcode (optional scan)</label><div class="row"><input id="f_bar" class="i" placeholder="EAN"/><button class="btn ghost" id="scanBarBtn">📷 Scan</button></div></div></div>`;
    const foot=`<button class="btn ghost full" onclick="closeSheet()">Batal</button><button class="btn primary full" id="saveProd">Simpan</button>`;
    openSheet({title:t('addProd'),body,foot});
    document.getElementById('scanBarBtn')?.addEventListener('click',async()=>{
      const { toast }=await import('../components/ui.js');
      if('BarcodeDetector' in window){ try{ const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}); const vid=document.createElement('video'); vid.srcObject=s; vid.play(); const det=new BarcodeDetector({formats:['ean_13','ean_8','code_128','qr_code']}); const iv=setInterval(async()=>{ const c=await det.detect(vid); if(c[0]){ clearInterval(iv); s.getTracks().forEach(t=>t.stop()); document.getElementById('f_bar').value=c[0].rawValue; toast('Barcode '+c[0].rawValue); } },500); }catch{ toast('no cam'); } }else toast('BarcodeDetector not support');
    });
    document.getElementById('saveProd')?.addEventListener('click',()=>{
      try{ const name=document.getElementById('f_name').value; const price=parseFloat(document.getElementById('f_price').value); const cents=Math.round(price*100); const stock=parseInt(document.getElementById('f_stock').value)||0; const cat=document.getElementById('f_cat').value; const sku=document.getElementById('f_sku').value; const bar=document.getElementById('f_bar').value; store.addProduct({name,priceCents:cents,stock,category:cat,sku,barcode:bar}); toast('Produk disimpan'); closeSheet(); render(store); mount(root,store); }catch(e){ toast(e.message); }
    });
  }
  function editProd(id){
    const p=store.state.products.find(x=>x.id===id); if(!p) return;
    const body=`<div style="display:flex;flex-direction:column;gap:10px"><div class="fld"><label>Nama</label><input id="f_name" class="i" value="${p.name}"/></div><div class="grid2"><div class="fld"><label>Harga €</label><input id="f_price" class="i" type="number" step="0.01" value="${(p.priceCents/100).toFixed(2)}"/></div><div class="fld"><label>Stok</label><input id="f_stock" class="i" type="number" value="${p.stock}"/></div></div><div class="fld"><label>Kategori</label><input id="f_cat" class="i" value="${p.category}"/></div></div>`;
    const foot=`<button class="btn danger" id="delProd">Hapus</button><div style="flex:1"></div><button class="btn ghost" onclick="closeSheet()">Batal</button><button class="btn primary" id="updProd">Simpan</button>`;
    openSheet({title:'Edit Produk',body,foot});
    document.getElementById('updProd')?.addEventListener('click',()=>{ const name=document.getElementById('f_name').value; const price=parseFloat(document.getElementById('f_price').value); const cents=Math.round(price*100); const stock=parseInt(document.getElementById('f_stock').value)||0; const cat=document.getElementById('f_cat').value; store.updateProduct(id,{name,priceCents:cents,stock,category:cat}); toast('Updated'); closeSheet(); mount(root,store); });
    document.getElementById('delProd')?.addEventListener('click',()=>{ if(confirm('Hapus?')){ store.deleteProduct(id); toast('Dihapus'); closeSheet(); mount(root,store);} });
  }
}
