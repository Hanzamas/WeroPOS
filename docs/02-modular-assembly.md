# Modular Assembly Line - SOLID Efficient

## Structure (Max 25 files MVP)

```
WeroPOS/
├── index.html              # shell, importmap, root #app
├── manifest.json           # PWA
├── css/
│   ├── tokens.css          # warna, spacing, radius, shadow, type — single source truth
│   ├── base.css            # reset, mobile shell, layout
│   └── components.css      # reusable: btn, card, sheet, input, chip
├── src/
│   ├── app.js              # assembly line: init router + store + mount
│   ├── core/
│   │   ├── store.js        # 40 LOC pubsub state: {products, cart, txs, ui, config}
│   │   ├── router.js       # 60 LOC hash router #/beranda etc
│   │   ├── storage.js      # localStorage namespaced wero_pos_ + JSON safe
│   │   ├── db.js           # repository pattern CRUD over storage
│   │   └── wero.js         # pure funcs: buildStaticQrUrl, buildInvoiceQrUrl, validate
│   ├── components/
│   │   ├── layout.js       # header, bottom-nav, shell renderer
│   │   ├── ui.js           # toast, confirm, bottom-sheet, loading tiny helpers
│   │   └── icons.js        # inline svg lucide — 2kb
│   └── features/
│       ├── beranda.js      # render() -> html string, init()
│       ├── kasir.js        # core sale
│       ├── inventory.js
│       ├── laporan.js
│       └── profil.js
└── docs/
```

Rule: features NEVER import each other. Only import core/* and components/*.

## SOLID Simplified untuk Vanilla MVP

S - Single Responsibility:
- `db.js` cuma data, `wero.js` cuma URL, `kasir.js` cuma jualan. No god file.

O - Open Closed:
- Tambah payment method baru = tambah file `src/payments/wero-scan.js` + register array `PAY_METHODS`. Tidak edit kasir core.
- Feature flag via config.

L - Liskov:
- Semua feature module export same interface: `export function render(store) => string html` dan `export function mount(root, store)` untuk event bind. Router bisa tukar.

I - Interface Segregation:
- Component terima props minimal `{product}` bukan whole store.
- db methods granular: `getProducts()`, `addProduct()`, bukan `saveEverything(obj)`

D - Dependency Inversion:
- Features depend on abstractions `db.js`, `store.js`, not direct localStorage.
- Example: 
```js
// bad
localStorage.getItem('products')
// good
import { getProducts } from '../core/db.js'
```

## Assembly Line (Data Flow)

```
User Tap Bottom Nav
  -> router.js set hash #/kasir
  -> app.js -> router resolves feature=kasir
  -> dynamic import('./features/kasir.js')
  -> kasir.render(store.state) returns html
  -> app.js inject to #page
  -> kasir.mount() binds events
  -> event -> store.dispatch({type, payload})
  -> store notifies -> re-render current feature if state slice changed
  -> db.js auto persist to storage.js
```

No two-way sync mess. One direction.

## Store Shape MVP

```js
{
  products: [{id, name, priceCents, category, stock, sku, createdAt}],
  cart: [{productId, qty}],
  transactions: [{id, ref, items, totalCents, method, weroUrl, createdAt}],
  config: { shopName, address, storeId, staticVariant, invoiceVariant },
  ui: { activeNav, toast }
}
```

## Efficiency Rules (Simplicity as fuck)
- HTML string via template literal, not vdom
- Event delegation: satu listener di #app
- Render hanya active feature, bukan whole app
- Debounce search 200ms
- No image optimization v1 — ponytail: compress later dengan canvas
- Qty diff pake splice bukan clone full array

## Extensibility Without Over-Engineer
- Add new bottom tab: 1 file features/x.js + 1 line routes map
- Add new payment: add object ke kasir.js PAYMENTS array
- Variant baru Wero: update wero.js enum only

## Testing Minimal
- `wero.js` harus 100% testable (pure)
- db.js test via console assert
- e2e manual checklist di docs: add product, sell cash, sell wero, report shows, persist after reload
