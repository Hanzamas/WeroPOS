import { t, getLocale, setLocale, locales, formatEur } from '../i18n/index.js';
import { buildStaticQrUrl, buildInvoiceQrUrl, parseStoreIdFromUrl } from '../core/wero.js';
import { WEBLLM_MODELS, loadLLM } from '../core/llm.js';
import { toast, openSheet, closeSheet } from '../components/ui.js';
export function render(store){
  const {config}=store.state;
  const loc=getLocale();
  let staticUrl='', invUrl='';
  try{ staticUrl=config.storeId?buildStaticQrUrl({storeId:config.storeId,variant:config.staticVariant}):''; }catch{}
  try{ invUrl=config.storeId?buildInvoiceQrUrl({storeId:config.storeId,amountCents:100,reference:'TEST-'+Date.now(),description:'Preview',variant:config.invoiceVariant}):''; }catch{}
  return `
  <div class="scr">
  <div class="card"><b>Toko</b><div style="margin-top:8px;display:flex;flex-direction:column;gap:8px">
  <div class="fld"><label>Nama Toko</label><input id="shopName" class="i" value="${config.shopName}"/></div>
  <div class="fld"><label>Alamat</label><input id="shopAddr" class="i" value="${config.address||''}"/></div>
  <div class="fld"><label>Bahasa / Language (Wero EU)</label><select id="localeSel" class="i">${locales.map(l=>`<option value="${l}" ${l===loc?'selected':''}>${l}</option>`).join('')}</select></div>
  </div></div>

  <div class="card"><b>Wero Config - Seamless via Scan</b><p class="muted" style="margin-top:4px">${t('scanStore')} = no friction</p>
  <div style="margin-top:10px;display:flex;flex-direction:column;gap:8px">
  <div class="fld"><label>Store ID Buckaroo</label><div class="row"><input id="storeId" class="i" value="${config.storeId}" placeholder="123456 / scan static QR"/><button class="btn ghost" id="scanStoreBtn">📷 Scan</button></div></div>
  <div class="grid2"><div class="fld"><label>Static Variant</label><select id="staticVar" class="i"><option value="qr" ${config.staticVariant==='qr'?'selected':''}>qr</option><option value="sticker" ${config.staticVariant==='sticker'?'selected':''}>sticker</option></select></div><div class="fld"><label>Invoice Variant</label><select id="invVar" class="i">${['card','banner_wide','banner_dual_qr','banner_square'].map(v=>`<option value="${v}" ${config.invoiceVariant===v?'selected':''}>${v}</option>`).join('')}</select></div></div>
  <div class="grid2">${staticUrl?`<div><div class="muted">Static Preview</div><div class="qr-box"><img src="${staticUrl}" style="max-width:100%"/></div></div>`:''}${invUrl?`<div><div class="muted">Invoice Preview</div><div class="qr-box"><img src="${invUrl}" style="max-width:100%"/></div></div>`:''}</div>
  </div></div>

  <div class="card"><b>Security & PIN</b><div style="margin-top:8px;display:flex;flex-direction:column;gap:8px"><div class="fld"><label>Set/Update PIN 4-6 digit</label><div class="row"><input id="pinSet" class="i" type="password" placeholder="****"/><button class="btn primary" id="savePinBtn">Set</button></div></div><button class="btn ghost full" id="passkeyRegBtn">🔐 Register Passkey (FaceID/TouchID)</button><button class="btn ghost full" id="voiceRegBtn">🎙️ Enroll Voice (Sherpa)</button></div></div>

  <div class="card"><b>Local LLM - Web MLC 2026 <1B/1B/2B Q4F16</b><p class="muted">No halu, model list from surf</p><div style="margin-top:8px"><select id="llmModel" class="i">${WEBLLM_MODELS.map(m=>`<option value="${m.id}">${m.label} - ${m.best}</option>`).join('')}</select><button class="btn primary full" id="loadLlmBtn" style="margin-top:8px">Load Model</button><div id="llmProgress" class="muted" style="margin-top:6px"></div></div></div>

  <div class="card"><b>Data</b><div class="grid2" style="margin-top:8px"><button class="btn ghost" id="exportBtn">Export JSON</button><button class="btn ghost" id="importBtn">Import JSON</button></div><button class="btn danger full" id="resetBtn" style="margin-top:8px">Reset Semua Data</button></div>

  <div class="card muted" style="font-size:11px">WeroPOS All ON • PIN/Passkey/Voice • Dexie encrypted (soon) • Yjs P2P • zbar-wasm barcode • Fuse.js fuzzy • Web Speech API + WebLLM MLC SmolLM2/Qwen/Gemma • jsPDF • i18n 6 negara • No face rec</div>
  </div>
  `;
}
export function mount(root,store){
  root.querySelectorAll('input,select').forEach(el=>{
    el.addEventListener('change',()=>{
      const cfg={
        shopName:document.getElementById('shopName')?.value||store.state.config.shopName,
        address:document.getElementById('shopAddr')?.value||'',
        storeId:document.getElementById('storeId')?.value||'',
        staticVariant:document.getElementById('staticVar')?.value||'qr',
        invoiceVariant:document.getElementById('invVar')?.value||'card',
      };
      store.setConfig(cfg);
      const loc=document.getElementById('localeSel')?.value;
      if(loc){ setLocale(loc); }
    });
  });
  document.getElementById('scanStoreBtn')?.addEventListener('click', async()=>{
    try{
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});
      const body=`<div class="qr-box" style="background:#000"><video id="scanVid" autoplay playsinline style="width:100%"></video></div><div class="muted" style="margin-top:8px">Scan static Wero sticker</div>`;
      openSheet({title:'Scan StoreId',body,foot:`<button class="btn ghost full" onclick="closeSheet()">Tutup</button>`});
      const vid=document.getElementById('scanVid'); vid.srcObject=stream; vid.play();
      if('BarcodeDetector' in window){
        const det=new BarcodeDetector({formats:['qr_code']});
        const iv=setInterval(async()=>{ try{ const cs=await det.detect(vid); if(cs[0]){ clearInterval(iv); stream.getTracks().forEach(t=>t.stop()); const text=cs[0].rawValue; try{ const sid=parseStoreIdFromUrl(text); document.getElementById('storeId').value=sid; store.setConfig({storeId:sid}); toast('StoreId '+sid); closeSheet(); }catch(e){ toast('Parse fail '+e.message); } } }catch{} },500);
      }
    }catch{ toast('No camera'); }
  });

  document.getElementById('savePinBtn')?.addEventListener('click',()=>{
    const pin=document.getElementById('pinSet')?.value.trim(); if(!pin||pin.length<4){ toast('PIN min 4'); return; }
    localStorage.setItem('wero_pos_pin_hash', btoa(pin)); // simple placeholder, later PBKDF2
    toast('PIN saved (simplified)');
  });

  document.getElementById('passkeyRegBtn')?.addEventListener('click', async()=>{
    try{
      const {startRegistration}=await import('https://esm.run/@simplewebauthn/browser@9.0.1').catch(()=>({}));
      if(!window.PublicKeyCredential){ toast('Passkey not supported'); return; }
      const cred=await navigator.credentials.create({publicKey:{challenge:new Uint8Array(32),rp:{name:'WeroPOS'},user:{id:new Uint8Array(8),name:'owner',displayName:'Owner'},pubKeyCredParams:[{type:'public-key',alg:-7}],authenticatorSelection:{userVerification:'preferred'},timeout:60000}});
      if(cred){ localStorage.setItem('wero_pos_passkey','1'); toast('Passkey registered'); }
    }catch(e){ toast('Passkey err '+e.message); }
  });

  document.getElementById('voiceRegBtn')?.addEventListener('click', async()=>{
    // placeholder: sherpa enroll would need wasm model ~30MB
    toast('Voice enroll via Sherpa ONNX WASM -> 3 sample needed (model download). Placeholder open');
    // future: load sherpa wasm and enroll
  });

  document.getElementById('loadLlmBtn')?.addEventListener('click', async()=>{
    const id=document.getElementById('llmModel').value;
    const prog=document.getElementById('llmProgress');
    prog.textContent='Loading '+id+' ...';
    try{
      const engine=await loadLLM(id, (p)=>{ prog.textContent=p.text||JSON.stringify(p).slice(0,200); });
      window._llmEngine=engine; window._llmEngineLoaded=true;
      prog.textContent='Loaded '+id;
      toast('LLM '+id+' loaded');
    }catch(e){ prog.textContent='Error '+e.message; toast('LLM fail '+e.message); }
  });

  document.getElementById('exportBtn')?.addEventListener('click',()=>{
    const data={products:store.state.products,transactions:store.state.transactions,debts:store.state.debts,config:store.state.config,exportedAt:Date.now()};
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='weropos-export.json'; a.click(); URL.revokeObjectURL(url);
  });
  document.getElementById('resetBtn')?.addEventListener('click',()=>{
    if(confirm('Reset semua?')){ localStorage.clear(); location.reload(); }
  });
}
