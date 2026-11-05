# SwiftRamp

SwiftRamp is a non-custodial currency conversion app built on the Stellar network. It lets someone send value in one currency and have it arrive in another, with every transfer wrapped in a zero-knowledge proof so the amount and resulting balances are never exposed on-chain.

This README documents how the app is structured today, how the privacy story is implemented in the current codebase, and what each page does.

---

## 1. Core concept

Two things are true about every transfer in SwiftRamp:

1. **Non-custodial.** SwiftRamp never holds funds or private keys. The user connects their own Stellar wallet (Freighter) and signs every transaction themselves.
2. **Shielded.** Before a transfer settles, the app walks through a proof-generation sequence — committing the amount, generating a zk-SNARK, and verifying it — so that only *validity* is checked on-chain, not the amount itself.

Point 1 is real: wallet connection goes through the actual `@stellar/freighter-api` package. Point 2 is currently **simulated in the UI** — see [Section 3](#3-privacy-integration--current-state) for exactly what's real versus presentational.

---

## 2. Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router), TypeScript, React |
| Styling | Plain CSS-in-JS via `<style dangerouslySetInnerHTML>` per page — no CSS framework |
| Fonts | Space Grotesk (display), IBM Plex Sans (body), IBM Plex Mono (data/labels), loaded via Google Fonts `@import` |
| Wallet | [`@stellar/freighter-api`](https://www.npmjs.com/package/@stellar/freighter-api) — browser-extension wallet for Stellar |
| Network (intended) | Stellar |
| Client state | `useState`/`useEffect`, no global store; wallet address persisted to `localStorage` |

Install the one non-default dependency before running the wallet flow:

```bash
npm install @stellar/freighter-api
```

---

## 3. Privacy integration — current state

This is the part worth reading closely before presenting the app as "already private."

### What's real
- **Wallet connection** (`/get-started`) calls the real Freighter API: `isConnected()`, `isAllowed()`, `setAllowed()`, `getAddress()`. If the extension isn't installed or the user declines, the UI reflects that accurately.
- **Non-custody**: there is no backend wallet, no server-side key storage, and no code path that could move funds without the user's own Freighter signature.

### What's simulated (placeholder for the real proof system)
The "zero-knowledge proof" shown during a transfer is a **UI simulation**, not a working zk-SNARK circuit:

- `randomHex(48)` generates a random hex string and displays it as `0x{proofHex}` — this is cosmetic, not a cryptographic commitment or proof.
- The three proof stages (`Committing amount` → `Generating zk-SNARK proof` → `Verifying on-chain`) are advanced on fixed `setTimeout` delays (`480ms + i * 620ms`), not by any actual circuit computation or network round-trip.
- The final "Sent" screen shows a hardcoded placeholder transaction reference (`stellar.expert/tx/a3f...9bc`) — no transaction is actually submitted to Stellar.
- Exchange rates (`rates` object: NGN, KES, GHS, ZAR, USD, EUR, GBP) are hardcoded constants, not fetched from a live rates feed.

**To make the privacy story real**, the pieces that need to be built are:
1. A Pedersen commitment scheme for the transfer amount, computed client-side.
2. A zk-SNARK circuit (e.g. via a library such as `snarkjs`/`circom`, or a Stellar-compatible proving system) that proves the commitment is well-formed and the sender has sufficient balance, without revealing the amount.
3. An on-chain or off-chain verifier that checks the proof before/alongside the Stellar transaction, so the ledger only ever sees "proof valid," not the amount.
4. A real Stellar transaction (via `@stellar/stellar-sdk` or similar), signed through Freighter, replacing the simulated success screen.
5. A live FX rate feed replacing the hardcoded `rates` object.

Everything described in [Section 5](#5-pages) below is accurate to the current UI/UX; just keep the distinction above in mind when describing the product's privacy guarantees externally.

---

## 4. Wallet connection flow

Handled entirely on `/get-started`:

```
idle → checking → (no-wallet | requesting) → (connected | error)
```

- `checking`: calls `isConnected()`. If Freighter isn't installed or not connected, moves to `no-wallet` with an install link.
- `requesting`: calls `isAllowed()`; if not yet allowed, calls `setAllowed()` to trigger the Freighter approval popup.
- `connected`: calls `getAddress()`, stores the address in `localStorage` under `swiftramp_stellar_address`, and auto-redirects to `/swap` after 1.4s.
- `error`: surfaces whatever message Freighter or the catch block returned, with a retry button.

The `/swap` page reads `swiftramp_stellar_address` from `localStorage` on mount to decide whether to show the connect prompt or the transfer form, and provides a `Disconnect` action that clears it.

**Note:** `localStorage` here only stores a public wallet *address* for session convenience — never a key or secret.

---

## 5. Pages

| Route | File (App Router) | Purpose |
|---|---|---|
| `/` | `src/app/page.tsx` | Marketing homepage. Hero, live-style stats, an animated globe/network graphic showing the 7 supported currencies as nodes, and an inline converter card that runs the full simulated send → proof → success flow. |
| `/swap` | `src/app/swap/page.tsx` | The actual transfer screen. Requires a connected wallet (checks `localStorage`); shows a ticker tape of currency pairs, a "celestial dial" background graphic, and the same send → proof → success flow as the homepage card, gated behind wallet connection. |
| `/get-started` | `src/app/get-started/page.tsx` | Wallet connection flow described in [Section 4](#4-wallet-connection-flow). Redirects to `/swap` on success. |
| `/how-it-works` | `src/app/how-it-works/page.tsx` | Explains the 5-step transfer process (connect → set amount → proof generated → verified on-chain → settled) as a horizontal numbered pipeline, plus an FAQ accordion covering what the proof hides, custody, and why Stellar. |
| `/rates` | `src/app/rates/page.tsx` | A live-style rate board (all supported currencies against USD), a 3-up fee/spread/settlement-time summary, and a small conversion previewer that links into `/get-started`. |
| `/company` | `src/app/company/page.tsx` | Mission statement, a "where we operate" map (the homepage's globe graphic repurposed with named cities), four stated product principles, and a closing CTA. |

Shared component:

| Component | File | Purpose |
|---|---|---|
| `Navbar` | `components/Navbar.tsx` | Fixed top nav used on every page except `/swap` (which has its own minimal top bar). Links to How it works / Rates / Company, plus a persistent "Get started" CTA. Responsive: collapses to a burger menu under 760px. |

---

## 6. Shared data model

Defined redundantly per-page today (candidate for extraction into a shared `lib/` module):

```ts
const rates: Record<string, number> = {
  NGN: 1580, KES: 130, GHS: 15.6, ZAR: 18.9, USD: 1, EUR: 0.93, GBP: 0.79
}
const flags: Record<string, string> = {
  NGN: '🇳🇬', KES: '🇰🇪', GHS: '🇬🇭', ZAR: '🇿🇦', USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧'
}
```

All rates are USD-relative constants. Converting `A → B` is computed as `amount * rates[B] / rates[A]`.

**Recommended refactor:** move `rates`, `flags`, and currency metadata into a single shared module (e.g. `lib/currencies.ts`) so `/`, `/swap`, and `/rates` don't drift out of sync — they currently each define their own copy.

---

## 7. Design system notes

- Colors and spacing are defined as CSS custom properties inside each page's own `<style>` block rather than a global stylesheet or Tailwind config. Core tokens repeated across pages: `--ink`, `--paper`, `--accent` (mint green, used for the "trusted/settlement" side of the story), `--privacy` (violet, used specifically for anything related to the zk-proof/shielding story), `--line`, `--muted`, `--fill`.
- The mint/violet split is intentional: mint = network/settlement/trust, violet = privacy/proof. Keep this convention if adding new UI.
- Motion (`fade-up`, pulsing dots, animated proof spinner) is used to signal "live" and "in progress" states — none of it is purely decorative.

---

## 8. Known gaps / next steps

- [ ] Replace simulated proof generation with a real commitment + zk-SNARK pipeline.
- [ ] Replace the hardcoded transaction hash on the success screen with a real Stellar transaction submission and explorer link.
- [ ] Replace static `rates` with a live FX feed.
- [ ] Extract `rates`/`flags`/currency metadata into a shared module.
- [ ] Add a `/public/images/logo.png` asset — `Navbar.tsx` references it via `next/image` and will 404 without it.
- [ ] Wire real anchors/routes for the mobile nav panel's "Get started" button (currently just closes the panel).

<!-- Verified for issue #37: feat(identity): display queue membership information on identity detail view -->
