import { t, formatEur } from '../i18n/index.js';
export function render(store){
  const {products, transactions, config}=store.state;
  const today=new Date().toISOString().slice(0,10);
  const todayTx=transactions.filter(tr=>tr.dateKey===today);
  const omzet=todayTx.reduce((s,tr)=>s+tr.totalCents,0);
  const low=products.filter(p=>p.stock<=5).slice(0,3);
  return `
  <div class="card"><b>${config.shopName||'WeroPOS'} — ${t('beranda')}</b><p class="muted">${today}</p>
  ${!config.storeId?`<div style="margin-top:8px;padding:8px;border-radius:10px;background:#f59e0b16;border:1px solid #f59e0b33;font-size:12px">⚠️ ${t('setupWero')} — <a href="#/profil">Setup</a> <button class="pill" id="scanStaticBtn">📷 ${t('scanStore')}</button></div>`:''}
  </div>
  <div class="metrics">
    <div class="metric"><small>${t('today')}</small><b>${formatEur(omzet)}</b></div>
    <div class="metric"><small>${t('trx')}</small><b>${todayTx.length}</b></div>
    <div class="metric"><small>${t('stok')}</small><b>${products.length}</b></div>
    <div class="metric"><small>${t('low')}</small><b>${low.length}</b></div>
  </div>
  <div class="grid2"><button class="btn primary full" onclick="location.hash='#/kasir'">🛒 ${t('openKasir')}</button><button class="btn ghost full" onclick="location.hash='#/inventory'">📦 ${t('addProd')}</button></div>
  <div class="card"><b>${t('recent')}</b><div style="margin-top:8px;display:flex;flex-direction:column;gap:6px">${transactions.slice(0,5).map(tr=>`<div class="row" style="justify-content:space-between;border:1px solid var(--border);padding:8px;border-radius:10px"><span>${tr.ref} • ${tr.items.length} item</span><b>${formatEur(tr.totalCents)}</b></div>`).join('')||'<div class="muted">Empty</div>'}</div></div>
  <div class="card"><b>Low Stock</b><div style="margin-top:6px">${low.map(p=>`<div class="row" style="justify-content:space-between;padding:6px 0"><span>${p.name} (${p.stock})</span><span class="pill" style="background:#ef444422;color:var(--danger)">low</span></div>`).join('')||'<div class="muted">Aman</div>'}</div></div>
  `;
}
export function mount(el,store){
  document.getElementById('scanStaticBtn')?.addEventListener('click',async()=>{
    // scanning static QR to get storeId seamless
    const { openSheet, toast } = await import('../components/ui.js');
    const body=`<div id="scanArea"><div class="qr-box" style="background:#000;color:#fff;min-height:260px;flex-direction:column"><video id="camVideo" autoplay playsinline style="width:100%;border-radius:10px"></video><div style="padding:10px;font-size:12px">${t('scanStore')}</div><canvas id="scanCanvas" style="display:none"></canvas></div><div style="margin-top:10px"><input id="manualStoreId" class="i" placeholder="Paste storeId if no camera"/><button class="btn primary full" id="saveStoreId" style="margin-top:8px">Simpan</button></div></div>`;
    openSheet({title:t('scanStore'),body,foot:`<button class="btn ghost full" onclick="closeSheet()">Tutup</button>`});
    try{
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});
      const v=document.getElementById('camVideo'); if(v){ v.srcObject=stream; v.play(); }
      // try BarcodeDetector for qr
      if('BarcodeDetector' in window){
        const det=new BarcodeDetector({formats:['qr_code']});
        const interval=setInterval(async()=>{ try{ const codes=await det.detect(v); if(codes[0]){ clearInterval(interval); stream.getTracks().forEach(t=>t.stop()); handleQr(codes[0].rawValue); } }catch{} },500);
      }
    }catch{ console.log('no cam'); }
    async function handleQr(text){
      try{
        const { parseStoreIdFromUrl }=await import('../core/wero.js');
        const sid=parseStoreIdFromUrl(text);
        store.setConfig({storeId:sid}); toast('StoreId '+sid+' saved'); closeSheet(); render(store); mount(el,store);
      }catch(e){ toast('Gagal parse QR: '+e.message); }
    }
    document.getElementById('saveStoreId')?.addEventListener('click',()=>{ const v=document.getElementById('manualStoreId').value.trim(); if(!v) return; store.setConfig({storeId:v}); toast('StoreId saved'); closeSheet(); });
  });
}
