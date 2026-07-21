# Wero Branding & Implementation Notes

Source: Buckaroo docs provided by user + Wero brand guidelines.

## Must Do
- Use Buckaroo hosted QR image service (`wero-qr.buckaroo.io`) — it meets Wero branding requirements automatically.
- Don't generate QR image yourself (e.g. qrcode.js) for Wero payments — use hosted service to guarantee compliant branding.
- If you must custom render, follow Wero brand book (not included here) — but we skip for now.

## Variants Explained

### Static
- `qr` : default
- `sticker` : printable sticker format for counter/window

### Invoice
- `card` : default card layout
- `banner_wide` : wide banner for invoice top/bottom
- `banner_dual_qr` : dual Wero + Payconiq QR — transition period, helps Payconiq users migrate
- `banner_square` : square banner

Note: Payconiq mention in banners will disappear after migration done.

## Security Guidance (from Buckaroo)
- Customers should scan Wero QR codes using Wero-compatible wallet (standalone Wero app or bank-integrated Wero app).
- Warn against generic camera scanner for security.

## UX Guidance
- For Static: place sticker visible, near checkout, explain "Pay with Wero — scan, enter amount"
- For Invoice: place QR near total amount, with reference visible

## Reconciliation
- Use unique reference per Invoice QR (e.g. INV-2026-0001)
- Reference shown in Buckaroo dashboard / webhook
