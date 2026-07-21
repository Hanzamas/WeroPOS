const BASE='https://wero-qr.buckaroo.io';
export const STATIC_VARIANTS=['qr','sticker'];
export const INVOICE_VARIANTS=['card','banner_wide','banner_dual_qr','banner_square'];
export function parseStoreIdFromUrl(input){
  if(!input) throw new Error('empty QR');
  input=String(input).trim();
  // if numeric alone assume storeId
  if(/^\d{2,20}$/.test(input)) return input;
  // try URL param
  try{
    const u=new URL(input);
    const sid=u.searchParams.get('storeId')||u.searchParams.get('store')||u.searchParams.get('store_id');
    if(sid) return sid.trim();
    // path /static?storeId case covered, also check path contains id?
    // try custom WERO:STORE:123
  }catch{}
  // WERO:STORE:123 pattern
  const m1=input.match(/STORE[:=]\s*([A-Za-z0-9_-]+)/i);
  if(m1) return m1[1];
  // try extract digits from end
  const m2=input.match(/storeId=([A-Za-z0-9_-]+)/i);
  if(m2) return m2[1];
  throw new Error('Cannot parse storeId from QR');
}
export function buildStaticQrUrl({storeId, variant='qr'}){
  if(!storeId?.trim()) throw new Error('storeId required');
  if(!STATIC_VARIANTS.includes(variant)) throw new Error('invalid static variant');
  let u=`${BASE}/static?storeId=${encodeURIComponent(storeId.trim())}`;
  if(variant!=='qr') u+=`&variant=${encodeURIComponent(variant)}`;
  return u;
}
export function buildInvoiceQrUrl({storeId, amountCents, reference, description='', variant='card'}){
  if(!storeId?.trim()) throw new Error('storeId required');
  if(!Number.isInteger(amountCents)||amountCents<=0) throw new Error('amountCents int >0');
  if(!reference?.trim()) throw new Error('reference required');
  if(reference.trim().length>255) throw new Error('reference max 255');
  if(description&&description.length>140) throw new Error('description max 140');
  if(!INVOICE_VARIANTS.includes(variant)) throw new Error('invalid variant');
  let u=`${BASE}/invoice?storeId=${encodeURIComponent(storeId.trim())}&amount=${amountCents}&reference=${encodeURIComponent(reference.trim())}`;
  if(description?.trim()) u+=`&description=${encodeURIComponent(description.trim())}`;
  if(variant!=='card') u+=`&variant=${encodeURIComponent(variant)}`;
  return u;
}
export function normalizeAmountEur(v){
  if(v===''||v==null) throw new Error('amount required');
  let s=String(v).trim().replace(',','.'); let n=Number(s); if(!isFinite(n)||n<=0) throw new Error('amount >0'); return Math.round(n*100);
}
