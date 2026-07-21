import { getLocale } from '../i18n/index.js';
const P='wero_pos_';
function sget(k,fb){ try{ const v=localStorage.getItem(P+k); return v?JSON.parse(v):fb; }catch{ return fb; } }
function sset(k,v){ try{ localStorage.setItem(P+k,JSON.stringify(v)); }catch{} }
function uid(){ return Math.random().toString(36).slice(2,8); }
const seed=[{id:'p_seed1',name:'Nasi Goreng',priceCents:595,stock:20,category:'Makanan',sku:'NG001',barcode:'',createdAt:Date.now()},{id:'p_seed2',name:'Es Teh Manis',priceCents:150,stock:50,category:'Minuman',sku:'ET001',barcode:'',createdAt:Date.now()}];
export function createStore(){
  const state={
    products:sget('products',seed),
    transactions:sget('transactions',[]),
    debts:sget('debts',[]),
    customers:sget('customers',[]),
    cart:[],
    config:{shopName:'WeroPOS Toko',address:'',storeId:sget('storeId','')||'',staticVariant:'qr',invoiceVariant:'card',descTpl:'Pembayaran {ref} di {shopName}',...sget('config',{})},
    locale:getLocale(),
  };
  const subs=new Set();
  function notify(p){ subs.forEach(fn=>fn(state,p)); persist(p); }
  function persist(p){
    if(!p||p.startsWith('prod')) sset('products',state.products);
    if(!p||p.startsWith('trans')) sset('transactions',state.transactions);
    if(!p||p.startsWith('debt')) sset('debts',state.debts);
    if(!p||p.startsWith('cust')) sset('customers',state.customers);
    if(!p||p.startsWith('conf')) { sset('config',state.config); sset('storeId',state.config.storeId); }
  }
  return{
    state, uid,
    sub(fn){ subs.add(fn); return ()=>subs.delete(fn); },
    addProduct(p){ if(!p.name?.trim()||p.name.trim().length<2) throw new Error('nama min 2'); if(!Number.isInteger(p.priceCents)||p.priceCents<=0) throw new Error('harga invalid'); const pr={id:'p_'+uid(),name:p.name.trim().slice(0,80),priceCents:p.priceCents,stock:Math.max(0,Math.floor(+p.stock||0)),category:(p.category||'Umum').slice(0,30),sku:(p.sku||'').slice(0,30),barcode:(p.barcode||'').slice(0,40),createdAt:Date.now(),updatedAt:Date.now()}; state.products.unshift(pr); notify('prod'); return pr; },
    updateProduct(id,pt){ const i=state.products.findIndex(x=>x.id===id); if(i<0) throw new Error('not found'); state.products[i]={...state.products[i],...pt,updatedAt:Date.now()}; notify('prod'); return state.products[i]; },
    deleteProduct(id){ state.products=state.products.filter(x=>x.id!==id); notify('prod'); },
    search(q,cat){ q=(q||'').toLowerCase().trim(); cat=(cat||'').trim(); return state.products.filter(p=>{ const mq=!q||p.name.toLowerCase().includes(q)||(p.sku&&p.sku.toLowerCase().includes(q))||(p.barcode&&p.barcode.includes(q)); const mc=!cat||p.category===cat; return mq&&mc; }); },
    addToCart(pid,qty=1){ const prod=state.products.find(p=>p.id===pid); if(!prod) throw new Error('prod not found'); const ex=state.cart.find(c=>c.productId===pid); const cur=ex?ex.qty:0; if(prod.stock>0&&(cur+qty)>prod.stock) throw new Error(`stok cuma ${prod.stock}`); if(ex) ex.qty+=qty; else state.cart.push({productId:pid,qty,priceCentsAtSale:prod.priceCents}); notify('cart'); },
    updateCartQty(id,q){ q=Math.floor(q); if(q<=0) return this.removeFromCart(id); const c=state.cart.find(x=>x.productId===id); if(c) c.qty=q; notify('cart'); },
    removeFromCart(id){ state.cart=state.cart.filter(c=>c.productId!==id); notify('cart'); },
    clearCart(){ state.cart=[]; notify('cart'); },
    cartTotal(){ let tot=0,q=0; for(const c of state.cart){ tot+=c.priceCentsAtSale*c.qty; q+=c.qty; } return {totalCents:tot,totalQty:q}; },
    genRef(){ const d=new Date(); const day=d.toISOString().slice(0,10).replace(/-/g,''); const r=Math.floor(Math.random()*9000)+1000; return `TRX-${day}-${r}`; },
    checkout({method,cashPaidCents,description,weroUrl,debtCustomer}){
      const {totalCents,totalQty}=this.cartTotal();
      if(totalCents<=0) throw new Error('cart kosong');
      const ref=this.genRef();
      const items=state.cart.map(c=>{ const p=state.products.find(x=>x.id===c.productId); return {productId:c.productId,name:p?p.name:c.productId,qty:c.qty,priceCents:c.priceCentsAtSale,subtotalCents:c.priceCentsAtSale*c.qty}; });
      const tx={id:'t_'+uid(),ref,items,totalCents,totalQty,paymentMethod:method,cashPaidCents:cashPaidCents||null,changeCents:method==='cash'&&cashPaidCents?cashPaidCents-totalCents:null,weroUrl:weroUrl||null,weroReference:method!=='cash'&&method!=='debt'?ref:null,weroAmountCents:method.startsWith('wero')?totalCents:null,description:description||'',debtCustomer:debtCustomer||null,createdAt:Date.now(),dateKey:new Date().toISOString().slice(0,10)};
      // deduct stock
      for(const it of items){ const p=state.products.find(x=>x.id===it.productId); if(p&&p.stock>0) p.stock=Math.max(0,p.stock-it.qty); }
      state.transactions.unshift(tx);
      if(method==='debt'){
        const debt={id:'d_'+uid(),customerName:debtCustomer?.name||'Unknown',phone:debtCustomer?.phone||'',totalCents,paidCents:0,remainCents:totalCents,ref,createdAt:Date.now(),dueAt:debtCustomer?.dueAt||Date.now()+7*86400000,status:'belum_lunas',txId:tx.id};
        state.debts.unshift(debt);
        if(debtCustomer?.name && !state.customers.find(c=>c.name.toLowerCase()===debtCustomer.name.toLowerCase())){ state.customers.push({name:debtCustomer.name,phone:debtCustomer.phone||''}); notify('cust'); }
      }
      state.cart=[]; notify('trans'); notify('prod'); notify('cart'); notify('debt'); return tx;
    },
    payDebt(debtId,paidCents,method){
      const d=state.debts.find(x=>x.id===debtId); if(!d) throw new Error('debt not found'); d.paidCents+=paidCents; d.remainCents=Math.max(0,d.totalCents-d.paidCents); if(d.remainCents===0) d.status='lunas'; notify('debt');
    },
    setConfig(p){ state.config={...state.config,...p}; notify('conf'); },
  };
}
