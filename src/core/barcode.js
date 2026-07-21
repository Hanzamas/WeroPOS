// zbar-wasm wrapper lazy
let scanner=null;
export async function initBarcode(){
  if(scanner) return scanner;
  try{
    const mod=await import('zbar.wasm'); // check api
    scanner=mod;
    return scanner;
  }catch(e){ console.warn('zbar load fail',e); return null; }
}
// use native BarcodeDetector if available + fallback zbar
export async function scanFromVideo(video){
  // Try BarcodeDetector
  if('BarcodeDetector' in window){
    try{
      const det=new BarcodeDetector({formats:['ean_13','ean_8','code_128','qr_code','upc_a','upc_e']});
      const codes=await det.detect(video);
      if(codes?.length) return codes[0].rawValue;
    }catch{}
  }
  // fallback: canvas + zbar
  try{
    const mod=await import('zbar.wasm');
    // rough: zbar-wasm API varies, implement placeholder
    // For MVP use canvas capture and try decode via zbarWasm
  }catch{}
  return null;
}
export function parseStaticQrToStoreId(text){
  try{
    const { parseStoreIdFromUrl }=require?null:null;
  }catch{}
  // implemented in wero.js
  return null;
}
