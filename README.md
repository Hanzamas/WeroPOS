# WeroPOS — Buckaroo Wero QR Documentation

> Wero documentation scaffolding for POS build. Source: Buckaroo Wero QR Service.

## Stack
- Backend: Buckaroo QR image service `https://wero-qr.buckaroo.io`
- No API key for QR image itself, StoreId based
- Wallet: Wero-compatible (standalone app / bank-integrated)
- Payment type: A2A instant, account-to-account (EPI)

---

## 1. Concepts

### Wero
European digital wallet by EPI. Instant payments directly from bank account. Merchant gets instant settlement infra.

### QR Types Overview

| Type | Contains amount? | Reusable? | API call at gen? | Use case |
|------|------------------|-----------|------------------|----------|
| **Static QR** | No | Yes | No | POS display, sticker on counter, fixed location |
| **Invoice / Offline QR** | Yes (in URL) | No (per payment) | No | Invoice PDF, email, offline payment request |

### Which to use when
- Customer at physical store, amount varies → **Static QR**
- Customer gets invoice / pay later / amount fixed → **Invoice QR**

---

## 2. Static QR

### Flow
```
1. Merchant prints/displays static QR (linked to Store)
2. Customer scans with Wero wallet
3. Wero opens registered pre-payment page (hosted by Buckaroo/integration)
4. Customer enters/confirms amount on that page
5. Wero payment flow starts
```

Security: must be scanned via Wero wallet, not generic camera.

### URL Spec

```
https://wero-qr.buckaroo.io/static?storeId={storeId}&variant={variant}
```

Implementation: embed directly as `<img src="...">` — Buckaroo generates branded QR image.

#### Parameters

| Param | Location | Required | Description |
|-------|----------|----------|-------------|
| storeId | query | Yes | Buckaroo Store ID |
| variant | query | No | `qr` (default) or `sticker`. Default: `qr` |

#### Variants — Static

- `qr` : Default Wero branded QR code
- `sticker` : Printable Wero branded sticker (for print materials)

#### Notes
- Reusable, no fixed payment details inside QR
- Linked to store → redirect to pre-payment page
- Payment details handled on payment page, not QR

#### Example

```html
<img src="https://wero-qr.buckaroo.io/static?storeId=YOUR_STORE_ID" />
<img src="https://wero-qr.buckaroo.io/static?storeId=YOUR_STORE_ID&variant=sticker" />
```

---

## 3. Invoice QR (Offline QR)

### Concept
Merchant generates Wero payment QR without real-time API call. Details are encoded in URL.

Use for: invoices, payment requests, any offline communication where customer pays later by scanning.

### Flow
```
1. Merchant builds Invoice QR URL with amount+reference+desc+storeId
2. Embeds image URL on invoice PDF / print / email
3. Customer scans with Wero wallet
4. Wero parses URL params → creates payment request instantly
5. Customer confirms → paid
```

### URL Spec

```
https://wero-qr.buckaroo.io/invoice?storeId={storeId}&amount={amount}&reference={reference}&description={description}&variant={variant}
```

#### Parameters

| Param | Location | Required | Description | Constraints |
|-------|----------|----------|-------------|-------------|
| storeId | query | Yes | Store ID | - |
| amount | query | Yes | Amount in **euro cents**. 2495 = €24.95 | Integer >0 |
| reference | query | Yes | Merchant order/invoice reference for reconciliation. Must be UTF-8 URL encoded | Max 255 chars, unique per payment recommended |
| description | query | No | Payment description shown in Wero flow. Must be UTF-8 URL encoded | Max 140 chars |
| variant | query | No | Visual variant | `card`, `banner_wide`, `banner_dual_qr`, `banner_square`. Default: `card` |

#### URL Encoding — CRITICAL
`reference` and `description` MUST be UTF-8 URL encoded.

```
Invoice 2026-0001 → Invoice%202026-0001
Order #42 / Test → Order%20%2342%20%2F%20Test
```

Fail to encode → broken QR / Wero rejects.

#### Variants — Invoice

- `card` : Default Wero branded QR card
- `banner_wide` : Wide banner, Wero only — invoice header
- `banner_dual_qr` : Dual QR banner Wero + Payconiq — used during Payconiq→Wero migration
- `banner_square` : Square banner, Wero only

Banners mention Payconiq during transition, will be removed after migration complete.

#### Examples

```html
<!-- Basic -->
<img src="https://wero-qr.buckaroo.io/invoice?storeId=123&amount=2495&reference=INV-2026-0001&description=Invoice%202026-0001" />

<!-- With variant -->
<img src="https://wero-qr.buckaroo.io/invoice?storeId=123&amount=10000&reference=ORDER-99&variant=banner_wide" />
<img src="https://wero-qr.buckaroo.io/invoice?storeId=123&amount=10000&reference=ORDER-99&variant=banner_dual_qr" />
```

#### Notes
- Generated without live Buckaroo connection
- Wero creates payment request only after scan
- Unique reference strongly recommended for reconciliation

---

## 4. Branding & Requirements

- Use Buckaroo hosted QR image service to satisfy Wero branding requirements (don't render QR yourself)
- Wero branding assets handled by Buckaroo image endpoint
- For security, instruct customers to scan using Wero-compatible wallet, not generic QR scanner

---

## 5. Implementation Plan for WeroPOS

### Phase 1 — Docs (now)
- [x] This doc
- [ ] Store config spec
- [ ] API wrapper spec (if we need payment status via Buckaroo API)

### Phase 2 — Core Library (next)
- [ ] `src/wero.js` — pure functions:
  - `buildStaticQrUrl({storeId, variant})` — validates storeId, variant enum
  - `buildInvoiceQrUrl({storeId, amount, reference, description, variant})`
    - amount handling: accept euro float or cents int, normalize to cents
    - reference/description: auto encode, length validation 255/140
    - amount >0 validation
    - variant enum validation
  - `parseAmount()` helper

### Phase 3 — POS App (after core)
- [ ] Simple UI for generating both QR types
- [ ] Invoice PDF generation with QR embedded
- [ ] Print styles
- [ ] Local storage for storeId

### Phase 4 — Optional Backend
- [ ] Webhook handling for payment status (Buckaroo push)
- [ ] Payment lookup by reference

---

## 6. Reference

- Base URL: `https://wero-qr.buckaroo.io`
- Docs: Buckaroo Wero integration
- Wero: European Payments Initiative (EPI)
- Transition: Payconiq → Wero (dual QR temporary)
