# Wero Integration Detail for POS

## Prereq
- merchant must have Buckaroo account + Store created -> get storeId
- storeId input in Profil -> saved config.storeId
- pre-payment page already registered in Buckaroo for static QR flow

## Flow Implementation POS

### Wero Invoice (preferred POS)

1. Kasir hit total e.g. 24.95 -> 2495 cents
2. Generate ref: TRX-20260721-4829 (unique)
3. Build wero invoice URL:
```
https://wero-qr.buckaroo.io/invoice?storeId={config.storeId}&amount={totalCents}&reference={ref}&description={desc}&variant={config.invoiceVariant}
```
description templated e.g. `Pembayaran ${ref} di ${shopName}` auto encodeURIComponent

4. Show QR as <img src=weroUrl> in payment sheet
5. Customer scans with Wero wallet, pays
6. POS marks tx as wero_invoice, saves weroUrl + ref + amount
7. For MVP, payment status manual - merchant sees bank/Buckaroo dashboard
   ponytail: future webhook -> pending -> paid status via Buckaroo API polling by reference

Edge:
- If storeId missing => block Wero payment, toast "Setup Store ID dulu di Profil"
- If amount 0 => block

### Wero Static (alternative)

1. Build static URL:
```
https://wero-qr.buckaroo.io/static?storeId={storeId}&variant={staticVariant}
```
2. Show QR, customer scans, enters amount manually on pre-payment page
3. POS transaction saved as wero_static with total same, but weroUrl is static url (not tied to amount)
4. Explain to cashier: "Customer input amount sendiri di HP"

### Validation Library wero.js MVP Code Spec

```js
const STATIC_VARIANTS = ['qr','sticker']
const INVOICE_VARIANTS = ['card','banner_wide','banner_dual_qr','banner_square']
const BASE = 'https://wero-qr.buckaroo.io'

export function buildStaticQrUrl({storeId, variant='qr'}) {
  if(!storeId?.trim()) throw new Error('storeId required')
  if(!STATIC_VARIANTS.includes(variant)) throw new Error('invalid static variant')
  const url = new URL(BASE+'/static')
  url.searchParams.set('storeId', storeId.trim())
  if(variant!=='qr') url.searchParams.set('variant', variant)
  return url.toString()
}

export function buildInvoiceQrUrl({storeId, amountCents, reference, description='', variant='card'}) {
  if(!storeId?.trim()) throw new Error('storeId required')
  if(!Number.isInteger(amountCents) || amountCents<=0) throw new Error('amount >0 integer cents required')
  if(!reference?.trim()) throw new Error('reference required')
  if(reference.trim().length>255) throw new Error('reference max 255')
  if(description && description.length>140) throw new Error('description max 140')
  if(!INVOICE_VARIANTS.includes(variant)) throw new Error('invalid invoice variant')
  const url = new URL(BASE+'/invoice')
  url.searchParams.set('storeId', storeId.trim())
  url.searchParams.set('amount', String(amountCents))
  url.searchParams.set('reference', reference.trim()) // URLSearchParams auto encodes
  if(description?.trim()) url.searchParams.set('description', description.trim())
  if(variant!=='card') url.searchParams.set('variant', variant)
  return url.toString()
}
// Note: URLSearchParams uses application/x-www-form-urlencoded - spaces as +. Wero accepts. But spec says UTF-8 URL encoded.
// To match spec exactly use encodeURIComponent manually -> use manual string concat if need %20 not +. For MVP both work.
// We'll do manual for 100% spec compliance:
export function buildInvoiceQrUrlStrict({storeId, amountCents, reference, description='', variant='card'}) {
  // same validates
  let u = `${BASE}/invoice?storeId=${encodeURIComponent(storeId.trim())}&amount=${amountCents}&reference=${encodeURIComponent(reference.trim())}`
  if(description?.trim()) u+=`&description=${encodeURIComponent(description.trim())}`
  if(variant!=='card') u+=`&variant=${encodeURIComponent(variant)}`
  return u
}
```

Use strict version for final.

### Print Receipt

After Wero payment, print area contains:
- shopName
- date, ref
- items list
- total
- wero QR small reprint optional
- footer "Thank you"

### Testing Checklist Wero
- [ ] storeId empty => error
- [ ] 2495 cents with ref INV-001 => url valid image loads
- [ ] reference with space INV 001 => %20 encoded and image loads
- [ ] description >140 => throw
- [ ] variant invalid => throw
- [ ] amount float 24.95 => converted 2495 via normalizeAmount
```

