# Invoice QR Spec (Offline QR)

## Endpoint
`GET https://wero-qr.buckaroo.io/invoice?storeId=&amount=&reference=&description=&variant=`

Returns: image/*

## Required
- storeId: string non-empty
- amount: int euro cents >0. Example: EUR 24.95 = 2495
- reference: string url-encoded, max 255 chars, unique recommended

## Optional
- description: string url-encoded, max 140 chars, shown in Wero flow
- variant: enum `card` (default) | `banner_wide` | `banner_dual_qr` | `banner_square`

## Critical Encoding
Both reference and description MUST be UTF-8 URL encoded before added to URL.
Implementation must auto-encode using encodeURIComponent.

Examples:
- "Invoice 2026-0001" -> "Invoice%202026-0001"
- "Pay & Go #1" -> "Pay%20%26%20Go%20%231"

## Validations for our impl
1. amount normalization:
   - If input float euro (e.g. 24.95), convert to cents: Math.round(euro*100)
   - If input int cents, must be integer >0
   - Handle comma decimal? EU uses comma, normalize.
2. reference: trim, check length <=255 after decode, required
3. description: trim, length <=140, optional
4. variant enum check
5. storeId required

## Edge Cases
- Amount 0 or negative -> throw
- Large amount: check Buckaroo limits (not documented, assume >0, we cap at e.g. 9999999 cents = 99999.99)
- Empty desc -> omit param
- Special chars in ref/desc -> encodeURIComponent handles

## UI Needs
- Amount euro input + auto cents preview
- Reference input
- Description input
- Variant select with preview images description
- Copy URL / img tag
- Print / PDF embed

## Future Backend
- Store reference -> payment status webhook
- Buckaroo API for transaction lookup by reference
