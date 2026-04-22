# C-HELL Extractor V2 // Operator Edition

A rebuilt operator-focused version of the user's original concept: a dark generative music extractor with lane control, pattern mutation, freemium export logic and paid recording download unlock.

## Run

1. `npm install`
2. Add `GEMINI_API_KEY` to `.env.local` if you want AI direction
3. `npm run dev`

## Business rules

- App usage: free
- JSON exports: first 3 free
- Then €3 unlocks 4 more exports
- Recording download: €9.99 unlock

## Notes

- Payment flows are prepared in-product and simulated locally via storage.
- Replace the local unlock handlers with Stripe/Lemon checkout when wiring real billing.
