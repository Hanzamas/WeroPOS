// WebLLM MLC 2026 Q4F16 models <1B /1B /2B - all ON
// Config latest from surf search issue #683 and config.ts
export const WEBLLM_MODELS=[
  // <1B
  {id:'SmolLM2-135M-Instruct-q4f16_1-MLC', label:'SmolLM2 135M (376MB)', vram:376, size:'<1B', lang:'en/fr/de/nl', best:'ultra low'},
  {id:'SmolLM2-360M-Instruct-q4f16_1-MLC', label:'SmolLM2 360M (376MB)', vram:376, size:'<1B', lang:'en/fr/de', best:'phone low'},
  {id:'Qwen2.5-0.5B-Instruct-q4f16_1-MLC', label:'Qwen2.5 0.5B Q4F16 (945MB)', vram:945, size:'<1B', lang:'multilingual termasuk EU', best:'tiny multi'},
  // ~1B
  {id:'Llama-3.2-1B-Instruct-q4f16_1-MLC', label:'Llama 3.2 1B Q4F16 879MB', vram:879, size:'1B', lang:'multi EU', best:'default phone'},
  {id:'TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC', label:'TinyLlama 1.1B Q4F16 697MB', vram:697, size:'1B', lang:'en', best:'fastest'},
  // ~1.5-2B
  {id:'SmolLM2-1.7B-Instruct-q4f16_1-MLC', label:'SmolLM2 1.7B Q4F16 1774MB', vram:1774, size:'2B', lang:'en/fr/de/es', best:'recommended phone'},
  {id:'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', label:'Qwen2.5 1.5B Q4F16 1630MB', vram:1630, size:'2B', lang:'multi Europe', best:'balanced'},
  {id:'gemma-2-2b-it-q4f16_1-MLC', label:'Gemma2 2B Q4F16 1895MB', vram:1895, size:'2B', lang:'multi', best:'quality'},
];
let engine=null; let curModel=null;
export async function loadLLM(modelId, onProg){
  const mod=await import('@mlc-ai/web-llm'); // dynamic
  const { CreateMLCEngine }=mod;
  if(engine && curModel===modelId) return engine;
  if(engine){ try{ await engine.unload(); }catch{} }
  curModel=modelId;
  engine=await CreateMLCEngine(modelId,{initProgressCallback:onProg});
  return engine;
}
export async function parseToJSON(prompt){
  if(!engine) throw new Error('LLM not loaded');
  const res=await engine.chat.completions.create({
    messages:[{role:'system',content:'You are POS parser. Output JSON only {product, qty, intent}. No explanation.'},{role:'user',content:prompt}],
    temperature:0.2, max_tokens:120,
  });
  const txt=res.choices[0].message.content||'{}';
  try{ return JSON.parse(txt.match(/\{.*\}/s)?.[0]||'{}'); }catch{ return {raw:txt}; }
}
