# Data Schema - Local First

## Storage Key Prefix
`wero_pos_`

Keys:
- `wero_pos_products`
- `wero_pos_transactions`
- `wero_pos_config`
- `wero_pos_cart_draft` (optional auto save)

## Product
```ts
type Product = {
  id: string // nanoid 8 chars
  name: string // required max 80
  priceCents: number // int >0 euro cents e.g. 2495
  stock: number // int >=0 default 0
  category: string // "Makanan" | etc max 30
  sku?: string // optional max 30
  barcode?: string // optional ean
  image?: string // dataURL or https url, optional
  createdAt: number // epoch ms
  updatedAt: number
}
```

Validation:
- name required trim length 2-80
- priceCents >0 integer
- stock integer >=0
- category required default "Umum"

## Cart Item (runtime, not persisted except draft)
```ts
type CartItem = {
  productId: string
  qty: number // >=1 <= stock if stock>0
  priceCentsAtSale: number // snapshot product.priceCents
}
```

## Transaction
```ts
type Transaction = {
  id: string // trx_ + nanoid
  ref: string // human ref e.g. TRX-20260721-0001 = unique for reconciliation Wero
  items: Array<{
    productId: string
    name: string // denormalized for history
    qty: number
    priceCents: number // at time
    subtotalCents: number
  }>
  totalCents: number // sum items
  totalQty: number
  paymentMethod: 'cash' | 'wero_invoice' | 'wero_static'
  // cash specific
  cashPaidCents?: number
  changeCents?: number
  // wero specific
  weroUrl?: string // full buckaroo qr image url generated
  weroReference?: string // same as ref for Wero invoice reference param
  weroAmountCents?: number // same as totalCents
  // meta
  createdAt: number
  dateKey: string // YYYY-MM-DD for fast filter
}
```

Ref generation:
```js
function genRef() {
  const d = new Date()
  const day = d.toISOString().slice(0,10).replace(/-/g,'')
  const rand = Math.floor(Math.random()*9000)+1000
  return `TRX-${day}-${rand}` // e.g. TRX-20260721-4829
}
```
Unique enough MVP, ponytail: use nanoid if collide check.

## Config
```ts
type Config = {
  shopName: string // default "WeroPOS"
  address?: string
  storeId: string // required for Wero QR, validated non-empty
  staticVariant: 'qr' | 'sticker' // default qr
  invoiceVariant: 'card' | 'banner_wide' | 'banner_dual_qr' | 'banner_square' // default card
  invoiceDescriptionTpl: string // default "Pembayaran {ref} di {shopName}"
  currency: 'EUR' // later IDR etc but wero = EUR, keep €
  createdAt: number
}
```

## DB API Proposal (db.js)

```js
// products
getProducts(): Product[]
getProduct(id): Product|undefined
addProduct(p: Partial<Product>): Product // validate + generate id + persist
updateProduct(id, patch): Product
deleteProduct(id): void
searchProducts(q: string, cat?: string): Product[]

// cart (in-memory + draft persist)
getCart(): CartItem[]
addToCart(productId, qty=1)
updateCartQty(productId, qty)
removeFromCart(productId)
clearCart()
getCartTotal(): {totalCents, totalQty}

// transactions
getTransactions(filter?: {from, to, method, q}): Transaction[]
addTransaction(tx): Transaction
getTransaction(id): Transaction
getTodayStats(): {omzet, count, qty, lowStock: Product[]}
getReport(period): metrics

// config
getConfig(): Config
setConfig(patch)
```

All write ops auto persist + notify store.

## Migration Plan LocalStorage -> IndexedDB
MVP JSON.stringify array 500 products ~ 200KB okay.
When >1MB or lag, switch to idb-keyval lib 600 bytes replacement, same API.

## Export/Import Format
```json
{
  "version": 1,
  "exportedAt": 123456,
  "config": {...},
  "products": [...],
  "transactions": [...]
}
```

Validation import: zod-like manual check, max 10MB.
