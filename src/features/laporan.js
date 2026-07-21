import { formatEur, t } from '../i18n/index.js';
import { toast, openSheet, closeSheet } from '../components/ui.js';

function getReport(transactions, period='today'){
  const now=new Date(); let from;
  if(period==='today') from=new Date(now.toISOString().slice(0,10));
  else if(period==='7d'){ from=new Date(); from.setDate(from.getDate()-7); }
  else if(period==='30d'){ from=new Date(); from.setDate(from.getDate()-30); }
  else from=new Date(0);
  const list=transactions.filter(tr=>tr.createdAt>=from.getTime());
  const omzet=list.reduce((s,tr)=>s+tr.totalCents,0);
  const cash=list.filter(tr=>tr.paymentMethod==='cash').reduce((s,tr)=>s+tr.totalCents,0);
  const wero=list.filter(tr=>tr.paymentMethod.startsWith('wero')).reduce((s,tr)=>s+tr.totalCents,0);
  const debt=list.filter(tr=>tr.paymentMethod==='debt').reduce((s,tr)=>s+tr.totalCents,0);
  const topMap={}; list.forEach(tr=>tr.items.forEach(it=>{ topMap[it.name]=(topMap[it.name]||0)+it.qty; }));
  const top=Object.entries(topMap).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const byDay={}; list.forEach(tr=>{ const d=tr.dateKey; byDay[d]=(byDay[d]||0)+tr.totalCents; });
  return {list,omzet,cash,wero,debt,top,byDay};
}

export function render(store){
  const {transactions,debts}=store.state;
  const r=getReport(transactions,'today');
  return `
  <div class="search"><div class="chips"><button class="pill on" data-period="today">Hari ini</button><button class="pill" data-period="7d">7 hari</button><button class="pill" data-period="30d">30 hari</button></div><button class="btn ghost sm" id="exportCsvBtn">CSV</button></div>
  <div class="scr">
  <div class="metrics">
    <div class="metric"><small>Omzet</small><b id="mOmzet">${formatEur(r.omzet)}</b><div class="bar" style="margin-top:6px"><i style="width:100%"></i></div></div>
    <div class="metric"><small>Transaksi</small><b id="mCount">${r.list.length}</b></div>
    <div class="metric"><small>Cash</small><b>${formatEur(r.cash)}</b></div>
    <div class="metric"><small>Wero</small><b>${formatEur(r.wero)}</b></div>
  </div>
  <div class="card"><b>Metode Bayar</b><div style="margin-top:8px;display:flex;gap:6px"><span class="pill">Cash ${formatEur(r.cash)}</span><span class="pill">Wero ${formatEur(r.wero)}</span><span class="pill" style="background:#f59e0b22">Hutang ${formatEur(r.debt)}</span></div></div>
  <div class="card"><b>Produk Terlaris</b><div id="topList" style="margin-top:8px">${r.top.map(([n,q])=>`<div class="row" style="justify-content:space-between;padding:4px 0"><span>${n}</span><b>${q}</b></div>`).join('')||'<div class=muted>Kosong</div>'}</div></div>
  <div class="card"><b>Omzet Harian (bar)</b><div id="byDay" style="margin-top:8px;display:flex;flex-direction:column;gap:6px">${Object.entries(r.byDay).map(([d,v])=>`<div class="row" style="justify-content:space-between"><span class="muted">${d}</span><div style="flex:1;margin:0 8px"><div class="bar"><i style="width:${Math.min(100,(v/(r.omzet||1))*100)}%"></i></div></div><b>${formatEur(v)}</b></div>`).join('')||'<div class=muted>no data</div>'}</div></div>
  <div class="card"><div class="row" style="justify-content:space-between"><b>Hutang Belum Lunas</b><span class="pill">${debts.filter(d=>d.status!=='lunas').length}</span></div><div id="debtList" style="margin-top:8px;display:flex;flex-direction:column;gap:6px">${debts.filter(d=>d.status!=='lunas').map(d=>`<div class="row" style="justify-content:space-between;border:1px solid var(--border);padding:8px;border-radius:8px"><div><b>${d.customerName}</b><div class="muted">${d.ref} • sisa ${formatEur(d.remainCents)}</div></div><button class="btn primary sm" data-pay-debt="${d.id}">Bayar</button></div>`).join('')||'<div class=muted>Tidak ada hutang</div>'}</div></div>
  <div class="card"><b>Transaksi List</b><div style="margin-top:8px;display:flex;flex-direction:column;gap:6px">${transactions.slice(0,20).map(tr=>`<div class="row" style="justify-content:space-between;border:1px solid var(--border);padding:8px;border-radius:8px"><div><b>${tr.ref}</b><div class="muted">${tr.dateKey} • ${tr.paymentMethod} • ${tr.items.length} item</div></div><b>${formatEur(tr.totalCents)}</b></div>`).join('')||'<div class=muted>Kosong</div>'}</div></div>
  <button class="btn primary full" id="printPdfBtn">${t('printPdf')}</button>
  </div>
  `;
}
export function mount(root,store){
  let period='today';
  function refresh(){
    const {transactions}=store.state; const r=getReport(transactions,period);
    document.getElementById('mOmzet').textContent=formatEur(r.omzet);
    document.getElementById('mCount').textContent=r.list.length;
    document.getElementById('topList').innerHTML=r.top.map(([n,q])=>`<div class="row" style="justify-content:space-between;padding:4px 0"><span>${n}</span><b>${q}</b></div>`).join('')||'<div class=muted>Kosong</div>';
    document.getElementById('byDay').innerHTML=Object.entries(r.byDay).map(([d,v])=>`<div class="row" style="justify-content:space-between"><span class="muted">${d}</span><div style="flex:1;margin:0 8px"><div class="bar"><i style="width:${Math.min(100,(v/(r.omzet||1))*100)}%"></i></div></div><b>${formatEur(v)}</b></div>`).join('')||'<div class=muted>no data</div>';
  }
  root.querySelectorAll('[data-period]').forEach(b=>b.addEventListener('click',()=>{ root.querySelectorAll('[data-period]').forEach(x=>x.classList.remove('on')); b.classList.add('on'); period=b.dataset.period; refresh(); }));
  document.getElementById('exportCsvBtn')?.addEventListener('click',()=>{
    const {transactions}=store.state; const csv=['ref,date,total,method,items'].concat(transactions.map(tr=>`${tr.ref},${tr.dateKey},${tr.totalCents/100},${tr.paymentMethod},"${tr.items.map(i=>i.name+' x'+i.qty).join(';')}"`)).join('\n'); const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='laporan.csv'; a.click(); URL.revokeObjectURL(url); toast('CSV exported');
  });
  document.getElementById('printPdfBtn')?.addEventListener('click',async()=>{
    try{
      const { default: jsPDF } = await import('jspdf');
      // dynamic import jspdf auto, but use esm version
      const doc=new jsPDF(); const {transactions}=store.state; const r=getReport(transactions,period);
      doc.text(`WeroPOS Laporan - ${period}`,10,10);
      doc.text(`Omzet: ${formatEur(r.omzet)} | Trx: ${r.list.length}`,10,18);
      doc.text(`Cash: ${formatEur(r.cash)} Wero: ${formatEur(r.wero)} Hutang: ${formatEur(r.debt)}`,10,26);
      let y=34; doc.text('Top Produk:',10,y); y+=8; r.top.forEach(([n,q])=>{ doc.text(`${n} - ${q}`,12,y); y+=6; });
      y+=6; doc.text('Harian:',10,y); y+=8; Object.entries(r.byDay).forEach(([d,v])=>{ doc.text(`${d}: ${formatEur(v)}`,12,y); y+=6; });
      doc.save(`laporan-${period}.pdf`); toast('PDF saved');
    }catch(e){
      // fallback print
      window.print(); toast('Print fallback');
    }
  });
  root.querySelectorAll('[data-pay-debt]').forEach(b=>b.addEventListener('click',()=>{
    const id=b.dataset.payDebt; const debt=store.state.debts.find(d=>d.id===id); if(!debt) return;
    const body=`<div class="fld"><label>Bayar € sisa ${formatEur(debt.remainCents)}</label><input id="debtPay" class="i" type="number" step="0.01" value="${(debt.remainCents/100).toFixed(2)}"/></div>`;
    const foot=`<button class="btn ghost full" onclick="closeSheet()">Batal</button><button class="btn primary full" id="confirmDebtPay">Bayar Lunas</button>`;
    openSheet({title:'Bayar Hutang '+debt.customerName,body,foot});
    document.getElementById('confirmDebtPay')?.addEventListener('click',()=>{ const v=parseFloat(document.getElementById('debtPay').value)||0; const cents=Math.round(v*100); if(cents<=0){ toast('invalid'); return; } store.payDebt(id,cents,'cash'); toast('Hutang dibayar'); closeSheet(); render(store); mount(root,store); });
  }));
}
