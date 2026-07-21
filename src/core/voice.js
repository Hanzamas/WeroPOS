// Web Speech API primary (online, multi-lang EU), Sherpa fallback offline
export function hasWebSpeech(){ return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window; }
export function startWebSpeech({lang='id-ID', onResult, onEnd}){
  const Rec=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!Rec) throw new Error('no webspeech');
  const rec=new Rec(); rec.lang=lang; rec.interimResults=false; rec.maxAlternatives=1; rec.continuous=false;
  rec.onresult=e=>{ const txt=e.results[0][0].transcript; onResult&&onResult(txt); };
  rec.onerror=e=>{ console.warn('webspeech err',e); onEnd&&onEnd(e); };
  rec.onend=()=>{ onEnd&&onEnd(); };
  rec.start(); return rec;
}
// minimal locale map for Wero countries
export function localeToSpeechLang(locale){
  const map={en:'en-US',fr:'fr-FR','fr-BE':'fr-BE',de:'de-DE',nl:'nl-NL','nl-BE':'nl-BE',lb:'de-DE'}; return map[locale]||'en-US';
}
// parse voice transcript to cart action via regex simple + optional WebLLM fallback later
export function parseVoiceToAction(text){
  text=text.toLowerCase().trim();
  // qty detection
  let qty=1; const qm=text.match(/(\d+)\s*(buah|pcs|stuk|pièce|stück|item)?/); if(qm) qty=parseInt(qm[1])||1;
  const qtyWords={satu:1,dua:2,tiga:3,empat:4,lima:5,un:1,deux:2,trois:3,zwei:2,drei:3,twee:2,drie:3}; for(const [w,n] of Object.entries(qtyWords)){ if(text.includes(' '+w+' ')||text.startsWith(w+' ')||text.endsWith(' '+w)) qty=n; }
  // product name: remove command words
  const cmdWords=['tambah','tambahkan','add','ajoute','hinzufügen','toevoegen','plus','beli']; let prod=text; for(const c of cmdWords) prod=prod.replace(c,''); prod=prod.replace(/\d+/g,'').replace(/buah|pcs|stuk|pièce|stück/g,'').trim();
  if(!prod) return null;
  return {productName:prod,qty};
}
