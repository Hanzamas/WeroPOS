let sheetCb=null;
export function toast(msg){
  const wrap=document.getElementById('toasts'); const el=document.createElement('div'); el.className='toast'; el.textContent=msg; wrap.appendChild(el); setTimeout(()=>el.remove(),2600);
}
export function openSheet({title,body,foot}){
  document.getElementById('sheetTitle').textContent=title||'';
  document.getElementById('sheetBody').innerHTML=body||'';
  document.getElementById('sheetFoot').innerHTML=foot||'';
  document.getElementById('backdrop').classList.add('show');
  document.getElementById('sheet').classList.add('show');
}
export function closeSheet(){
  document.getElementById('backdrop').classList.remove('show');
  document.getElementById('sheet').classList.remove('show');
}
window.closeSheet=closeSheet;
document.getElementById('backdrop')?.addEventListener('click',closeSheet);
