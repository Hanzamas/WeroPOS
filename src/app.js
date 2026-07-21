import { createStore } from './core/store.js';
import { initRouter, getRoute } from './core/router.js';
import { renderNav, setShopTitle } from './components/layout.js';
import { toast } from './components/ui.js';

const store=createStore();
const pageEl=document.getElementById('page');

function renderLayout(){
  const {totalQty}=store.cartTotal();
  renderNav(totalQty);
  setShopTitle(store.state.config.shopName);
}

async function renderRoute(route){
  renderLayout();
  try{
    const mod=await import(`./features/${route}.js`);
    pageEl.innerHTML=mod.render(store);
    mod.mount&&mod.mount(pageEl,store);
  }catch(e){
    console.error(e);
    pageEl.innerHTML=`<div class="card">Error load ${route}: ${e.message}<pre style="font-size:11px;white-space:pre-wrap">${e.stack}</pre></div>`;
  }
}

// lock screen logic PIN/Passkey/Voice
function initLock(){
  const pinHash=localStorage.getItem('wero_pos_pin_hash');
  const lockScreen=document.getElementById('lockScreen');
  const shouldLock=!!pinHash;
  if(!shouldLock){ lockScreen.style.display='none'; return; }
  lockScreen.style.display='flex';
  document.getElementById('pinOk')?.addEventListener('click',()=>{
    const pin=document.getElementById('pinInput').value.trim();
    const saved=pinHash?atob(pinHash):'';
    if(pin===saved){ lockScreen.style.display='none'; toast('Unlocked'); }
    else { document.getElementById('lockMsg').textContent='PIN salah'; }
  });
  document.getElementById('passkeyBtn')?.addEventListener('click',async()=>{
    try{
      const cred=await navigator.credentials.get({publicKey:{challenge:new Uint8Array(32),timeout:60000,userVerification:'preferred'}});
      if(cred){ lockScreen.style.display='none'; toast('Passkey ok'); }
    }catch(e){ document.getElementById('lockMsg').textContent='Passkey fail '+e.message; }
  });
  document.getElementById('voiceAuthBtn')?.addEventListener('click',()=>{
    // placeholder sherpa voice auth
    toast('Voice auth via Sherpa placeholder -> need enroll');
  });
  document.getElementById('lockBtn')?.addEventListener('click',()=>{ lockScreen.style.display='flex'; });
}

initLock();
initRouter((r)=>renderRoute(r));
store.sub(()=>{ renderLayout(); });
renderLayout();
