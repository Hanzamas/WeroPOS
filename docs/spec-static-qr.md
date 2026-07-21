# Static QR Spec

## Endpoint
`GET https://wero-qr.buckaroo.io/static?storeId={storeId}&variant={variant}`

Returns: `image/*` Wero branded QR

## Params
- storeId: string, required, Buckaroo Store ID
- variant: enum, optional, `qr` | `sticker`, default `qr`

## Behavior
- Reusable
- No amount in QR
- Redirects to pre-payment page registered for store
- Customer enters amount on page
- Then Wero flow starts

## Validations for our impl
- storeId required, non-empty
- variant must be in allowlist else fallback default or throw
- Build URL with URLSearchParams or manual encode

## UI Needs
- Input storeId
- Select variant
- Preview img + copy URL/img tag
- Print button
