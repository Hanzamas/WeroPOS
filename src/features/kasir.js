import { t, formatEur } from '../i18n/index.js';
import { openSheet, closeSheet, toast } from '../components/ui.js';
import { buildInvoiceQrUrl, buildStaticQrUrl, normalizeAmountEur, parseStoreIdFromUrl } from '../core/wero.js';
import { hasWebSpeech, startWebSpeech, localeToSpeechLang, parseVoiceToAction } from '../core/voice.js';

let fuse=null;
async function getFuse(products){
  if(fuse) return fuse;
  const { default: Fuse } = await import('fuse.js');
  fuse=new Fuse(products,{keys:['name','sku','barcode'],threshold:0.35}); return fuse;
}

export function render(store){
  const {products,cart,config}=store.state;
  const {totalCents,totalQty}=store.cartTotal();
  return `
  <div class="search"><input id="kasirSearch" class="i" placeholder="Cari produk / scan..."/><button class="btn ghost" id="voiceBtn">🎙️</button><button class="btn ghost" id="barcodeBtn">📷</button></div>
  <div class="scr">
  <div style="display:flex;gap:6px"><input id="manualAmount" class="i" placeholder="Nominal € misal 12.50 untuk QR tanpa produk"/><button class="btn ghost" id="makeQrBtn">${t('makeQr')}</button></div>
  <div id="catChipsKasir" class="chips" style="margin-top:8px">${[...new Set(products.map(p=>p.category))].map(c=>`<button class="pill" data-cat="${c}">${c}</button>`).join('')}<button class="pill on" data-cat="">All</button></div>
  <div class="pgrid" id="kasirGrid">${products.map(p=>`<div class="pcard" data-id="${p.id}"><b style="font-size:13px">${p.name}</b><div class="muted">${p.category} • stok ${p.stock}</div><div style="display:flex;justify-content:space-between;margin-top:6px"><b>${formatEur(p.priceCents)}</b><button class="btn primary sm" data-add="${p.id}">+ Add</button></div></div>`).join('')}</div>
  </div>
  <div style="position:sticky;bottom:0;background:var(--card);border-top:1px solid var(--border);padding:10px 14px;padding-bottom:calc(10px + env(safe-area-inset-bottom));"><div class="row" style="justify-content:space-between"><span>${totalQty} item • <b>${formatEur(totalCents)}</b></span><button class="btn primary" id="bayarBtn" ${totalCents===0?'disabled':''}>${t('bayar')} ${formatEur(totalCents)}</button></div><div id="cartList" style="margin-top:8px;display:${cart.length?'flex':'none'};flex-direction:column;gap:6px">${cart.map(c=>{const p=products.find(x=>x.id===c.productId); return `<div class="row" style="justify-content:space-between;border:1px solid var(--border);padding:6px;border-radius:8px"><span>${p?p.name:c.productId} x${c.qty}</span><div class="row"><button class="btn ghost sm" data-dec="${c.productId}">-</button><span>${c.qty}</span><button class="btn ghost sm" data-inc="${c.productId}">+</button><button class="btn danger sm" data-del="${c.productId}">✕</button></div></div>`}).join('')}</div></div>
  `;
}
export function mount(root,store){
  const grid=document.getElementById('kasirGrid');
  const search=document.getElementById('kasirSearch');
  let activeCat='';
  function refresh(){
    const q=search?.value||'';
    const list=store.search(q,activeCat);
    grid.innerHTML=list.map(p=>`<div class="pcard" data-id="${p.id}"><b style="font-size:13px">${p.name}</b><div class="muted">${p.category} • stok ${p.stock}</div><div style="display:flex;justify-content:space-between;margin-top:6px"><b>${formatEur(p.priceCents)}</b><button class="btn primary sm" data-add="${p.id}">+ Add</button></div></div>`).join('')||'<div class="empty">Tidak ketemu</div>';
    grid.querySelectorAll('[data-add]').forEach(b=>b.addEventListener('click',()=>{ try{ store.addToCart(b.dataset.add); toast('Added'); mount(root,store); }catch(e){ toast(e.message); } }));
  }
  search?.addEventListener('input',refresh);
  root.querySelectorAll('[data-cat]').forEach(b=>b.addEventListener('click',()=>{ activeCat=b.dataset.cat; root.querySelectorAll('[data-cat]').forEach(x=>x.classList.remove('on')); b.classList.add('on'); refresh(); }));
  grid?.querySelectorAll('[data-add]').forEach(b=>b.addEventListener('click',()=>{ try{ store.addToCart(b.dataset.add); toast('Added'); mount(root,store);}catch(e){ toast(e.message);} }));
  document.getElementById('bayarBtn')?.addEventListener('click',()=>openPaySheet(store));
  root.querySelectorAll('[data-inc]').forEach(b=>b.addEventListener('click',()=>{ store.updateCartQty(b.dataset.inc, store.state.cart.find(c=>c.productId===b.dataset.inc).qty+1); mount(root,store);}));
  root.querySelectorAll('[data-dec]').forEach(b=>b.addEventListener('click',()=>{ const c=store.state.cart.find(x=>x.productId===b.dataset.dec); store.updateCartQty(b.dataset.dec,c.qty-1); mount(root,store);}));
  root.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{ store.removeFromCart(b.dataset.del); mount(root,store);}));

  // voice kasir: webspeech primary + webllm fallback json
  document.getElementById('voiceBtn')?.addEventListener('click',async()=>{
    if(!hasWebSpeech()){ toast('Web Speech not supported, coba Sherpa'); return; }
    const lang=localeToSpeechLang(store.state.locale||'en');
    toast('Dengar... silakan bilang "tambah nasi goreng 2"');
    try{
      startWebSpeech({lang,onResult:async (txt)=>{
        toast('Kamu: '+txt);
        // try parse via regex
        let act=parseVoiceToAction(txt);
        // if WebLLM loaded try LLM JSON parse
        try{
          const llmMod=await import('../core/llm.js');
          if(window._llmEngineLoaded){ const j=await llmMod.parseToJSON(`parse "${txt}" to JSON {product, qty, intent}`); if(j.product) act={productName:j.product,qty:j.qty||1}; }
        }catch{}
        if(!act){ toast('Tidak paham'); return; }
        // fuzzy search product
        const {default: Fuse}=await import('fuse.js');
        const fuse=new Fuse(store.state.products,{keys:['name'],threshold:0.4});
        const res=fuse.search(act.productName);
        if(res[0]){ store.addToCart(res[0].item.id, act.qty); toast(`Added ${res[0].item.name} x${act.qty}`); mount(root,store); } else toast('Produk tidak ketemu: '+act.productName);
      }});
    }catch(e){ toast('Voice err '+e.message); }
  });

  // barcode to cart
  document.getElementById('barcodeBtn')?.addEventListener('click', async()=>{
    const body=`<div class="qr-box" style="background:#000;flex-direction:column"><video id="barVideo" autoplay playsinline style="width:100%"></video><div class="muted" style="color:#fff;margin-top:8px">Arahkan barcode / QR static</div></div><div style="margin-top:8px"><button class="btn ghost full" id="scanStaticToDynamicBtn">Scan QR Static -> Generate Dynamic with total cart</button></div>`;
    openSheet({title:t('scanBarcode'),body,foot:`<button class="btn ghost full" onclick="closeSheet()">Tutup</button>`});
    try{
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});
      const v=document.getElementById('barVideo'); v.srcObject=stream; v.play();
      if('BarcodeDetector' in window){
        const det=new BarcodeDetector({formats:['ean_13','ean_8','upc_a','upc_e','code_128','qr_code']});
        const iv=setInterval(async()=>{
          try{
            const codes=await det.detect(v);
            if(codes[0]){
              clearInterval(iv); stream.getTracks().forEach(t=>t.stop());
              const raw=codes[0].rawValue;
              // try parse as storeId static QR -> dynamic
              try{ const sid=parseStoreIdFromUrl(raw); store.setConfig({storeId:sid}); toast('StoreId '+sid+' dari scan static'); openPaySheet(store); return; }catch{}
              // try as product barcode
              const prod=store.state.products.find(p=>p.barcode===raw||p.sku===raw);
              if(prod){ store.addToCart(prod.id,1); toast('Scanned '+prod.name); closeSheet(); mount(root,store); }
              else { toast('Barcode '+raw+' tidak ada produk'); closeSheet();}
            }
          }catch{}
        },400);
      }
    }catch{ toast('Camera no access'); }

    document.getElementById('scanStaticToDynamicBtn')?.addEventListener('click',()=>{
      // without camera: if storeId exists build dynamic now
      closeSheet(); openPaySheet(store);
    });
  });

  // manual amount to dynamic QR without cart
  document.getElementById('makeQrBtn')?.addEventListener('click',()=>{
    const val=document.getElementById('manualAmount')?.value; if(!val) { toast('Masukkan nominal'); return; }
    try{ const cents=normalizeAmountEur(val); openPaySheet(store,cents); }catch(e){ toast(e.message); }
  });
}

function openPaySheet(store,overrideCents=null){
  const {totalCents}=store.cartTotal();
  const cents=overrideCents!=null?overrideCents:totalCents;
  if(cents<=0){ toast('Cart kosong'); return; }
  const {config}=store.state;
  if(!config.storeId) { toast('Setup StoreId dulu di Profil atau scan static QR'); return; }
  // build QRs
  const ref=store.genRef();
  let invoiceUrl='';
  let staticUrl='';
  try{ invoiceUrl=buildInvoiceQrUrl({storeId:config.storeId,amountCents:cents,reference:ref,description:`Pembayaran ${ref} di ${config.shopName}`,variant:config.invoiceVariant}); }catch(e){ invoiceUrl='ERR '+e.message; }
  try{ staticUrl=buildStaticQrUrl({storeId:config.storeId,variant:config.staticVariant}); }catch(e){ staticUrl='ERR '+e.message; }
  const body=`
  <div style="display:flex;flex-direction:column;gap:12px">
    <div class="row"><span class="pill on">${formatF(cents)}</span><span class="muted">${ref}</span></div>
    <div class="grid2">
      <button class="btn primary" data-pay="cash">${t('cash')}</button>
      <button class="btn ghost" data-pay="wero_invoice">${t('weroInv')}</button>
    </div>
    <div class="grid2">
      <button class="btn ghost" data-pay="wero_static">${t('weroStatic')}</button>
      <button class="btn ghost" data-pay="debt">${t('debt')}/Hutang</button>
    </div>
    <div id="payDetail"></div>
    <div class="qr-box" id="qrPreview"><span class="muted">Pilih metode</span></div>
  </div>
  `;
  const foot=`<button class="btn ghost full" onclick="closeSheet()">Batal</button>`;
  openSheet({title:t('bayar')+' - '+formatF(cents),body,foot});
  let selected=null; let cashPaid=null; let debtName='';

  function renderDetail(method){
    selected=method; const detailEl=document.getElementById('payDetail'); const qrEl=document.getElementById('qrPreview');
    if(method==='cash'){
      detailEl.innerHTML=`<div class="fld"><label>Bayar €</label><input id="cashInput" class="i" type="number" step="0.01" placeholder="${(cents/100).toFixed(2)}"/></div><div id="changeInfo" class="muted"></div><button class="btn primary full" id="confirmPay" style="margin-top:8px">Selesaikan Cash</button>`;
      qrEl.innerHTML='<span class="muted">Cash tidak perlu QR</span>';
      document.getElementById('cashInput')?.addEventListener('input',e=>{ const v=parseFloat(e.target.value)||0; const paidCents=Math.round(v*100); cashPaid=paidCents; const change=paidCents-cents; document.getElementById('changeInfo').textContent=change>=0?`${t('kembalian')}: ${formatF(change)}`:'Kurang bayar'; });
      document.getElementById('confirmPay')?.addEventListener('click',()=>{ const paid=cashPaid||cents; if(paid<cents){ toast('Bayar kurang'); return; } const tx=store.checkout({method:'cash',cashPaidCents:paid,description:'',weroUrl:null}); toast('Bayar sukses '+tx.ref); closeSheet(); });
    } else if(method==='wero_invoice'){
      detailEl.innerHTML=`<div class="muted">Scan dengan Wero wallet</div><div style="margin-top:6px"><span class="pill">${ref}</span></div><button class="btn primary full" id="confirmPay" style="margin-top:8px">Tandai Lunas Wero</button>`;
      qrEl.innerHTML=`<img src="${invoiceUrl}" style="max-width:100%;border-radius:8px" onerror="this.parentElement.innerHTML='<div class=muted>QR gagal load - cek StoreId</div>'"/>`;
      document.getElementById('confirmPay')?.addEventListener('click',()=>{ const tx=store.checkout({method:'wero_invoice',description:`Invoice ${ref}`,weroUrl:invoiceUrl}); toast('Wero Invoice selesai '+tx.ref); closeSheet(); });
    } else if(method==='wero_static'){
      detailEl.innerHTML=`<div class="muted">Customer scan static & input amount manual</div><button class="btn primary full" id="confirmPay" style="margin-top:8px">Tandai Lunas Static</button>`;
      qrEl.innerHTML=`<img src="${staticUrl}" style="max-width:100%;border-radius:8px"/>`;
      document.getElementById('confirmPay')?.addEventListener('click',()=>{ const tx=store.checkout({method:'wero_static',description:`Static ${ref}`,weroUrl:staticUrl}); toast('Wero Static selesai'); closeSheet(); });
    } else if(method==='debt'){
      detailEl.innerHTML=`<div class="fld"><label>${t('customer')}</label><input id="debtName" class="i" placeholder="Budi"/><input id="debtPhone" class="i" style="margin-top:6px" placeholder="HP optional"/></div><button class="btn primary full" id="confirmPay" style="margin-top:8px">Simpan Hutang</button>`;
      qrEl.innerHTML='<span class="muted">Hutang tanpa QR</span>';
      document.getElementById('confirmPay')?.addEventListener('click',()=>{ const name=document.getElementById('debtName').value.trim(); if(!name){ toast('Nama pelanggan required'); return; } const phone=document.getElementById('debtPhone').value.trim(); const tx=store.checkout({method:'debt',debtCustomer:{name,phone}}); toast('Hutang '+name+' disimpan '+tx.ref); closeSheet(); });
    }
  }
  document.querySelectorAll('[data-pay]').forEach(b=>b.addEventListener('click',()=>{ document.querySelectorAll('[data-pay]').forEach(x=>x.classList.remove('primary')); b.classList.add('primary'); renderDetail(b.dataset.pay); }));
  function formatF(c){ return (c/100).toLocaleString('en-NL',{style:'currency',currency:'EUR'}); }
}
function formatF(c){ return (c/100).toLocaleString('en-NL',{style:'currency',currency:'EUR'}); }
