# MVP Roadmap - WeroPOS Mobile

## Vision
POS warung mobile-first, no build, Wero QR native. Open browser langsung jualan.

## Bottom Nav (5 item)
```
[ Beranda | Inventory | KASIR (FAB) | Laporan | Profil ]
```
Kasir center prominent, raised, accent color.

## MVP Features Matrix

### Phase 0.1 (Week 1) - Must ship
| Feature | Beranda | Kasir | Inventory | Laporan | Profil |
|---------|---------|-------|-----------|---------|--------|
| list | today cards (omzet, trx, low stock) | product grid search | CRUD produk lokal | harian/mingguan | config toko + Wero storeId |
| action | quick open kasir | cart, qty, bayar | search filter | export CSV | reset/export |
| payment | - | Cash, Wero Invoice, Wero Static | - | filter by method | - |
| persist | localStorage | save transaction | localStorage | read transactions | localStorage |

Done = user tambah produk > kasir > bayar cash/Wero > laporan muncul > reload tetap ada.

### Phase 0.2 (Week 2)
- barcode scanner (html5-qrcode lib)
- thermal printer (web print)
- indexedDB migrate
- promo diskon simple
- PWA installable + offline

### Phase 0.3 (Week 3)
- backend sync optional Firebase/Supabase
- Buckaroo webhook payment status check

## Non-Features MVP (YAGNI)
- login multi-user
- tax complex, split payment
- cloud sync
- chart lib berat (pakai div bar dulu)
- any build tool

## Success Metrics MVP
- TTFJ < 3 detik (time to first jualan) dari fresh install
- Tap max 3x dari beranda ke bayar
- Lighthouse mobile 90+ perf
- Karya offline after first load
- Jumlah file < 30, no node_modules

## Timeline 5 hari
- Day 1: shell, router, store core, tokens css
- Day 2: inventory feature full
- Day 3: kasir core + wero.js + cart + payment
- Day 4: beranda + laporan + profil
- Day 5: polish, empty states, print, a11y, test device, deploy
