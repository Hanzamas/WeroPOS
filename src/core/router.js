export const ROUTES={beranda:()=>import('../features/beranda.js'),inventory:()=>import('../features/inventory.js'),kasir:()=>import('../features/kasir.js'),laporan:()=>import('../features/laporan.js'),profil:()=>import('../features/profil.js')};
export const NAVS=[
{id:'beranda',label:'Home',icon:'M3 13L12 3l9 10v8a1 1 0 0 1-1 1h-4v-5H8v5H4a1 1 0 0 1-1-1z'},
{id:'inventory',label:'Stok',icon:'M20 12V8a2 2 0 0 0-2-2h-1V4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2H6a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2z M6 10V8h12v2'},
{id:'kasir',label:'Kasir',icon:'M12 5v14 M5 12h14',fab:true},
{id:'laporan',label:'Laporan',icon:'M3 3v18h18 M7 16l3-3 3 3 5-5'},
{id:'profil',label:'Profil',icon:'M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'},
];
export function getRoute(){ const h=location.hash.replace('#/','').replace('#','')||'beranda'; return ROUTES[h]?h:'beranda'; }
export function navTo(id){ if(!ROUTES[id]) id='beranda'; if(getRoute()!==id) location.hash='#/'+id; }
export function initRouter(cb){ window.addEventListener('hashchange',()=>cb(getRoute())); if(!location.hash) location.hash='#/beranda'; cb(getRoute()); }
