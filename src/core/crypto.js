export async function deriveKeyFromPin(pin,salt){
  const enc=new TextEncoder(); const keyMat=await crypto.subtle.importKey('raw',enc.encode(pin),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:100000,hash:'SHA-256'},{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
export async function genSalt(){ return crypto.getRandomValues(new Uint8Array(16)); }
export async function encJSON(obj,key){
  const iv=crypto.getRandomValues(new Uint8Array(12)); const enc=new TextEncoder(); const data=enc.encode(JSON.stringify(obj));
  const buf=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,data); return {iv:Array.from(iv), data:Array.from(new Uint8Array(buf))};
}
export async function decJSON(wrapped,key){
  try{ const iv=new Uint8Array(wrapped.iv); const data=new Uint8Array(wrapped.data); const buf=await crypto.subtle.decrypt({name:'AES-GCM',iv},key,data); return JSON.parse(new TextDecoder().decode(buf)); }catch{ return null; }
}
export function bufToB64(a){ return btoa(String.fromCharCode(...a)); }
export function b64ToBuf(s){ return Uint8Array.from(atob(s),c=>c.charCodeAt(0)); }
