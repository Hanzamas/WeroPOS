import { NAVS, getRoute, navTo } from '../core/router.js';
import { t } from '../i18n/index.js';
export function renderNav(cartCount=0){
  const cur=getRoute();
  const el=document.getElementById('bnav');
  el.innerHTML=NAVS.map(n=>{
    const on=cur===n.id?'on':''; 
    const fab=n.fab?'fab':'';
    const label=t(n.id)||n.label;
    const badge=n.id==='kasir'&&cartCount?`<span class="badge">${cartCount}</span>`:'';
    const inner=n.fab?`<i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="${n.icon}"/></svg></i>`:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="${n.icon}"/></svg><span>${label}</span>`;
    return `<a href="#/${n.id}" class="${on} ${fab}" data-nav="${n.id}">${inner}${badge}</a>`;
  }).join('');
}
export function setShopTitle(name){ const e=document.getElementById('shopTitle'); if(e) e.textContent=name||'WeroPOS'; }
