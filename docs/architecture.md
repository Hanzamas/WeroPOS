# WeroPOS Architecture Doc

## Goal
POS web app to generate Wero QRs for small merchants using Buckaroo Wero.

## Non-Goals (YAGNI for now)
- No backend required for QR generation (hosted image service)
- No auth for v1
- No DB for v1

## Structure Planned
```
/ (root = WeroPOS/)
- README.md (main doc)
- docs/
  - spec-static-qr.md
  - spec-invoice-qr.md
  - architecture.md (this)
  - branding.md (Wero branding rules)
- src/
  - wero.js (core url builder, pure functions, no deps)
  - wero.test.js (one small assert test)
- index.html (POS UI, after docs approved)
- package.json? Only if needed. Prefer no build for v1.
```

## Core Library API (planned)
```js
// wero.js
export function buildStaticQrUrl({ storeId, variant = 'qr' }): string
export function buildInvoiceQrUrl({ storeId, amount, reference, description?, variant = 'card' }): string
// amount accepts number (euros float) or integer cents via {amountEur} | {amountCents} overload
export function normalizeAmount(input): number // -> cents
```

Input validation at trust boundary: all builders throw on invalid.

## Security
- All inputs validated
- encodeURIComponent for ref/desc
- No XSS via URL because image src only
- StoreId is public? It's ID, not secret, but warn not to expose? It's in QR anyway.

## Deploy
- Static hosting (GitHub Pages, Vercel, etc)
- index.html only needs internet for QR images

## Future Upgrades
- Add backend proxy if need hide storeId? ponytail: current exposes storeId in img src by design (Buckaroo's model). If need hide, add server that proxies.
- PDF invoice generation: add jspdf + QR image embed, but keep optional.
```

