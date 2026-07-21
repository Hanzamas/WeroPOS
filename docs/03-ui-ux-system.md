# UI/UX System - Simple As Fuck, Emphatic, Intuitive

## Principle
- Mobile first 360-430 width, desktop centered 420 max-width shell with blurred bg
- 1 hand operable: bottom nav, FAB kasir thumb zone
- Every tap < 100ms feedback (active scale 0.98)
- No page reload nav, hash router
- Empty state > spinner > skeleton (spinner hanya >500ms)
- Text: no jargon. "Bayar" bukan "Checkout". "Stok habis" bukan "Out of Stock".

## Bottom Nav Spec

```
[ 🏠 Beranda ] [ 📦 Stok ] [ (+) KASIR ] [ 📊 Laporan ] [ 👤 Profil ]
```
- Height 64px + safe-area
- Beranda, Inventory (Stok), Kasir (center elevated 56px circle), Laporan, Profil
- Center KASIR: accent background, white icon, shadow, badge cart count
- Inactive: gray 500, active: accent + bold
- Tap area min 48px

Implementation:
- fixed bottom 0, z-20
- icons inline svg lucide 20px stroke 2.2
- cart count in kasir FAB via store.cart.reduce

## Design Tokens (tokens.css)

```css
--bg: #0a0a0f (dark) / #f8f7ff (light auto prefers)
--card: #14141f
--card2: #1c1c2b
--border: #26263a
--text: #f5f5ff
--muted: #9aa0b8
--accent: #6c5cff pascal mau bisa ganti via config later
--accent-press: #5948e6
--success: #22c55e
--danger: #ef4444
--warn: #f59e0b
--radius: 16
--radius-lg: 20
--radius-pill: 999
--shadow-card: 0 8px 24px rgba(0,0,0,.2)
--font: Inter / system-ui
--tap: 48px min
```

## Components

1. Card: radius 16, padding 16, border 1px var(--border)
2. Button: primary accent, 44px height, radius 12, font 600 14px, press scale .98
   variants: primary, ghost, danger
3. Input: height 44, radius 12, bg #0f0f18, border, focus accent ring
4. Chip kategori: pill, tap toggle
5. Bottom Sheet: fixed bottom, drag handle 4x32 bar, backdrop blur 8px, radius-top 20
6. Toast: bottom above nav, slide up, 2.5s auto, accent for success
7. Empty: centered illustration text "Belum ada produk" + CTA "Tambah Produk"
8. Search: sticky top under header, 44 height, icon kiri

## Pages Wireframe Mental

### Beranda
```
Header: nama toko + tanggal
Cards row 2x2:
 [Omzet Hari Ini €] [Transaksi N]
 [Produk Terjual] [Stok Menipis !]
Quick:
 [Buka Kasir ->] [Tambah Produk +] [Lihat Laporan]
List: 5 Transaksi terbaru (tap -> detail)
Banner: if storeId kosong => "Setup Wero biar bisa terima QR" CTA ke Profil
```

### Kasir (most important)
```
Top: search + chips kategori scroll-x
Middle: product grid 2 kolom card produk: nama, harga, stok dot
Bottom cart sheet: 
  - handle drag, collapsed shows "2 item • €24.95"
  - expanded: list item qty +/- swipe delete
  - subtotal + button "Bayar €24.95"
Bayar Sheet: 
  - list payment: Cash, Wero Invoice, Wero Static
  - if Cash: input bayar > kembalian live
  - if Wero Invoice: generate QR preview + ref auto TRX-xxx
  - if Wero Static: show static QR
  - CTA "Selesaikan" 
Success Sheet: check animation + print + "Transaksi Baru"
```

### Inventory
```
Search + filter chip
Toggle Grid/List
FAB + Tambah
Card: foto placeholder, nama, harga, stok badge (merah if <5)
Tap card -> edit sheet
Long press -> delete confirm
```

### Laporan
```
Top Tabs: Hari ini | 7d | 30d | Custom date
Metric cards 2x2 same as beranda but period
Bar chart simple divs for omzet per hari
Produk terlaris list rank 1-5
Metode bayar breakdown chips
List transaksi filterable + export
```

### Profil
```
Toko: nama, alamat, logo? (skip v1)
Wero: storeId input, static variant select, invoice variant select, preview QR live
Data: Export JSON, Import, Reset (danger confirm)
About: version, GitHub link
```

## UX Rules Intuitive
- All destructive confirm with bottom sheet "Yakin hapus?" + red button, not alert()
- Qty stepper: tap + hold accelerates
- Search live no button enter
- Form save disabled sampai valid + show inline error bawah input
- Cart empty => kasir shows illustration + "Pilih produk buat jual"
- Offline: toast "Offline mode, tetap bisa jualan" but persist
- No onboarding carousel. Tooltips inline 1 line jika needed.

## A11y & Simple
- All button 44px min, contrast 4.5:1
- Icon + text, jangan icon only kecuali obvious (X close)
- Input label always visible above, placeholder example
- Keyboard: esc close sheet, enter submit

## Evolution Without Breaking
- tokens.css only place warna — ganti tema gak sentuh html
- icons.js only place icons — ganti set tinggal 1 file
- Features isolated — reskin satu tidak jebol lain
