# Gemini implementation plan: review against the real codebase

**Date:** 13 October 2026
**Source reviewed:** `Let implement this.pdf` (18 pages, Gemini). The text was extracted and read in full. It contains five code steps: design tokens, a client-side success page, a client-side order tracker, a dashboard publish gate and a Mobile Money waiting modal.
**Codebase:** branch `claude/hastech-commerce-platform-n2svks` at `f190bed`, before any change in this review.

## How the PDF's assumptions differ from the code

The PDF was written without seeing the repository. Its main wrong assumptions:

| PDF assumes | What actually exists |
|---|---|
| Client components that `fetch()` new JSON endpoints: `/api/store/[slug]/payment/verify`, `/api/order/tracking-secure`, `/api/payments/verify-instant` | None of these exist, and none are needed. Verification already runs on the server in `verifyAndProcessPayment` (`src/lib/payments/process.ts`), called by the success page (a server component) and the Paystack webhook. Order lookup is a server action (`src/app/store/[slug]/order/actions.ts`). Adding parallel endpoints would duplicate payment logic. |
| Verify responses shaped `{ payment_status, order_number, tracking_token, download_items[{id,name,fileSize,downloadUrl}] }` | The real shapes are `PaymentVerificationResult` and `DigitalDownload` (`orderItemId`, `productName`, `fileName`, `url`). There is no `tracking_token` column and no file size on order items. |
| The success URL carries `?reference=…&orderId=…` | Paystack appends `reference`/`trxref`. The app's callback adds `?order=<uuid>`, which the page doesn't need. |
| Hex colour tokens (`--primary-default`, `--accent-gold`, Inter font) | A complete token system already exists in `src/app/globals.css` (`--color-ink`, `--color-brand`, `--color-warning-subtle`, …) with dark mode, using the Geist font. |
| The dashboard page is a client component with `useState` demo flags | `src/app/dashboard/[slug]/page.tsx` is a server component that already reads real setup state (`isPaymentProviderConfigured`, product count, `published_at`). |
| The app takes Mobile Money directly (provider choice, USSD prompt) | The app redirects to **Paystack's hosted checkout**, where Paystack collects card and MoMo details and sends the approval prompt. The app never knows the carrier. |
| The order tracker shows "Processing → Shipped → Delivered" | The real fulfilment statuses are `pending, confirmed, processing, ready, completed, cancelled, refunded`. "Shipped" and "Delivered" don't exist. |

## Classification of each proposal

| # | PDF proposal | Classification | Relevant files | Reason |
|---|---|---|---|---|
| 1 | New design tokens and shimmer animation in `globals.css` | **UNSAFE OR INCORRECT** | `src/app/globals.css` | It would add a second, conflicting palette and font on top of the existing system. Skeleton loaders already exist (`src/components/ui/skeleton.tsx`). Any new UI should use the existing tokens. |
| 2a | Success page shows downloads only when payment is confirmed (fixes S1) | **NEEDS ADAPTATION** | `src/lib/payments/process.ts`, `src/app/store/[slug]/checkout/success/page.tsx`, `src/lib/digital-downloads.ts` | The intent is right, and S1 is real: `verifyAndProcessPayment` returned `already_processed` for a *repeated failed* check, and the page treated that as paid and released download links. The fix belongs in the existing server function and page, not a new client poller and endpoint. |
| 2b | Poll while payment is pending (Mobile Money delay) | **NEEDS ADAPTATION** | `src/lib/payments/paystack.ts`, `process.ts`, success page | Real gap: Paystack's `ongoing`/`pending`/`processing`/`queued` statuses were mapped to `failed`. Fix: a `pending` status that is never written as failed, plus a small client refresher that re-runs the *server* page. There is no client-side source of truth. |
| 2c | "Retry payment check" / "Return to cart & try again" | **NEEDS ADAPTATION** | `src/app/store/[slug]/checkout/actions.ts` | The cart is converted when the order is created, so "return to cart" leads to an empty cart. Instead, add a server action that starts a new Paystack transaction for the same unpaid order. Holding the payment reference is the authorisation, the same model as the success page. |
| 2d | Show a "Security Token" on the success page | **BLOCKED BY MISSING INFORMATION** | — | There is no token column. Adding one needs a migration plus a decision on how shoppers receive it (email is currently not configured in production). Deferred; see #3b. |
| 3a | Exact email match in order lookup, not `ILIKE` (fixes S2) | **SAFE TO IMPLEMENT** (server side) | `src/lib/orders.ts` `getOrderForTracking` | Real bug: `.ilike()` makes `_` a wildcard. Checkout already stores emails lowercased (`createOrderFromCart`), and a read-only check of the live database found 0 mixed-case emails. An exact `eq` on the trimmed, lowercased email is correct and needs no migration. |
| 3b | Require a 12-character tracking token in the form | **BLOCKED BY MISSING INFORMATION** | — | It needs a new column and a delivery channel. It would also lock out every shopper who only has their order number. The PDF's own sample token `bK9_2xL_8pQ1` contains the `_` its regex blocks. Exact email matching plus the existing rate limit (10 lookups per 15 minutes per IP, `src/lib/rate-limit.ts`) closes the wildcard hole now. A token can follow once email delivery is live. |
| 3c | Client-side regex blocking `_` and `%` | **UNSAFE OR INCORRECT** | — | It isn't a security boundary (the server action can be called directly), and `_` is legal in real email addresses. The server-side fix replaces it. |
| 3d | New `/api/order/tracking-secure` endpoint | **UNSAFE OR INCORRECT** | — | It duplicates `lookupOrderAction`, which is already rate-limited and server-side. |
| 3e | "Processing → Shipped → Delivered" milestones | **UNSAFE OR INCORRECT** | `src/components/storefront/order-lookup-form.tsx` (`OrderProgress`) | These milestones are invented. The existing progress component already uses the real statuses. |
| 4a | Block publishing without Paystack keys (fixes S3) | **SAFE TO IMPLEMENT** (server side) | `src/app/dashboard/[slug]/actions.ts`, `src/lib/payments/index.ts` | `publishStoreAction` currently has no checks. The real check `isPaymentProviderConfigured` already exists. Also require at least one published product, so a store can't go live empty. |
| 4b | The PDF's dashboard component (`useState` flags, `alert()`, replacing the page) | **UNSAFE OR INCORRECT** | `src/app/dashboard/[slug]/page.tsx` | It uses hard-coded demo state, which the brief forbids, and would replace a working server page. The real checklist already exists. What's missing: `PublishToggle` discards the action's `{ error }`, and nothing warns when a store is **already live without keys**. The live database has 2 such stores. |
| 4c | Stop checkout when the store can't take payment | **SAFE TO IMPLEMENT** | `src/app/store/[slug]/checkout/{page,actions}.ts` | Not in the PDF, but it's the same S3 problem from the shopper's side. Checkout created the order and emptied the cart *before* finding out payments weren't configured. Check first. |
| 5a | Mobile Money modal with carrier USSD codes and an "I have paid" button | **UNSAFE OR INCORRECT** | — | The app doesn't send MoMo prompts or know the carrier (Paystack hosted checkout does). The USSD menu paths are unverified. Any "manual override" implying payment is unacceptable: only a Paystack-verified result can mark an order paid. |
| 5b | Clear waiting message for MoMo approval delays | **NEEDS ADAPTATION** | success page; billing and promote callback pages | Implemented as a generic pending state ("approve the prompt on your phone"), with automatic re-checks against the server. No carrier-specific instructions. |
| 6 | Payment completion order and recovery (from the earlier audit, needed for priority 1) | **SAFE TO IMPLEMENT** | `src/lib/payments/process.ts`, `src/lib/payments/platform.ts`, `src/lib/sponsorships.ts` | (a) The idempotency row was written *before* the order update, so a crash in between left a paid order pending for good. Fix: make the conditional order update the idempotency gate, and keep `payment_events` as an audit log. (b) Billing and sponsorship rows marked `failed` could never recover when Paystack later reported success, and the callbacks said "Payment received" for failed rows. Fix: real statuses, plus re-checking failed or pending rows. No migration needed. |
| 7 | Defence in depth on downloads | **SAFE TO IMPLEMENT** | `src/lib/digital-downloads.ts` | `getDigitalDownloadsForOrder` relied on every caller checking payment first. It now checks `orders.payment_status = 'paid'` itself. |

## What will not be changed

- **No new API routes or database migrations.** Every fix uses existing tables and constraints: the `orders` and `payments` statuses, `payment_events`, and the unique constraint on `platform_commission_ledger.order_id`.
- **No design-token or font changes.** New UI uses the existing tokens and components (`Button`, `LinkButton`, `--color-warning-subtle`, …).
- **No automatic unpublishing of the two live stores without keys.** That's a production state change for the owner to decide. They now see a warning, and their checkout refuses to create orders until keys are added.

## Implementation outcome

| Area | Change | Files |
|---|---|---|
| Payment verification | The conditional `orders` update (pending/failed → paid) is now the only idempotency gate. Paystack's reference must match. Pending statuses are never recorded as failed. Fulfilment is only confirmed if still `pending`. A seller's `refunded` is never overridden. A missed commission entry is backfilled on retry. | `src/lib/payments/process.ts`, `paystack.ts` (`mapStatus`), `types.ts` |
| S1: success page and downloads | Shows paid only for `paid`/`already_paid`, the two statuses that mean the database says paid. Downloads also check `orders.payment_status` themselves. | `src/app/store/[slug]/checkout/success/page.tsx`, `src/lib/digital-downloads.ts` |
| S2: order tracking | Exact `eq` on the lowercased email and trimmed order number; no pattern matching. The existing rate limit is unchanged. | `src/lib/orders.ts` |
| S3: publishing and checkout | Publishing requires Paystack keys and at least one published product. Errors now appear next to the button. Live stores without keys get a dashboard warning. Checkout refuses before creating an order, and shows a notice instead of the form. | `src/app/dashboard/[slug]/actions.ts`, `page.tsx`, `src/components/dashboard/publish-toggle.tsx`, `src/app/store/[slug]/checkout/{page,actions}.ts` |
| Pending and failed recovery | A shared waiting state re-checks the server about every 5 seconds for a minute. "Try paying again" starts a new Paystack transaction for the same unpaid, uncancelled order, after a stock re-check. Billing and sponsorship rows marked failed are re-checked and credited if Paystack later reports success; their callbacks no longer show success for failed rows. | `src/components/payment-pending.tsx`, `src/lib/payments/platform.ts`, `src/lib/sponsorships.ts`, both callback pages |

**Tests added:**
- `tests/unit/payment-verification.test.ts`, 13 tests. 8 of them fail against the previous code, which was confirmed by running them against it.
- `order-tracking.test.ts`, `publish-readiness.test.ts`, `platform-payment-recovery.test.ts`.
- `mapStatus` tests in `paystack.test.ts`.

Supporting fake database: `tests/unit/helpers/fake-db.ts`.

**Not verified:** a real Paystack payment (card or Mobile Money) end to end, and a browser check of the new screens. The sandbox's network policy blocks the Supabase project, so the app can't render live data here.
