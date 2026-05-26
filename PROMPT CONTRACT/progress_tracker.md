# Progress Tracker — PC Hardware POS (Frontend)

> **AI AGENT INSTRUCTION — READ BEFORE ANYTHING ELSE:**
> After you finish executing one or more TODOs from `project-overview.md`, you **must** update this file.
> Rules:
> 1. Change the status cell of every completed item from `⬜ TODO` → `✅ Done` (or `🚧 In Progress` if partially done).
> 2. Fill in the **Completed** date column with today's date (`YYYY-MM-DD`).
> 3. Update the **Section summary** badge at the top of each section (e.g. `0 / 6` → `3 / 6`).
> 4. Update the **Overall Progress** counter at the very top of this file.
> 5. Append a one-line entry to the **Changelog** at the bottom.
> 6. Do **not** modify any other project files as part of this tracker update.

---

## Overall Progress

| Metric | Value |
|---|---|
| Total deliverables | 22 |
| Completed | 0 |
| In Progress | 0 |
| Remaining | 22 |
| Last updated | — |

---

## Section 3.1 — Serialized Cart & Checkout UI &nbsp;`0 / 6`

| # | Deliverable | File Path | Status | Completed |
|---|---|---|---|---|
| 1.1 | Main POS page (Inertia page component) | `resources/js/pages/Pos/Index.vue` | ⬜ TODO | — |
| 1.2 | Serialized cart list panel | `resources/js/components/pos/CartPanel.vue` | ⬜ TODO | — |
| 1.3 | Single serial-number cart line w/ status badges | `resources/js/components/pos/CartLineItem.vue` | ⬜ TODO | — |
| 1.4 | Checkout / payment modal (F12 trigger) | `resources/js/components/pos/CheckoutModal.vue` | ⬜ TODO | — |
| 1.5 | Keyboard-first navigation (F2 / ↑↓ / Delete / F10 / F12 / Escape) | Implemented inside `Index.vue` + `CartPanel.vue` | ⬜ TODO | — |
| 1.6 | `CartLineItem` TypeScript interface (`CartLineItem`) | Defined in `Index.vue` or shared types file | ⬜ TODO | — |

**Acceptance criteria:**
- Each serial number renders as its own cart line (no grouped quantities).
- Status badges use semantic color tokens: `success` / `warning` / `danger`.
- `RMA_PENDING` and `SOLD` items show strikethrough and block F12.
- All keyboard shortcuts are globally bound and documented via a visible legend.

---

## Section 3.2 — Real-Time Compatibility Dashboard ("Will It Boot?") &nbsp;`0 / 5`

| # | Deliverable | File Path | Status | Completed |
|---|---|---|---|---|
| 2.1 | Build Status panel (always visible while cart has items) | `resources/js/components/pos/BuildStatus.vue` | ⬜ TODO | — |
| 2.2 | Incompatibility override confirmation modal | `resources/js/components/pos/OverrideModal.vue` | ⬜ TODO | — |
| 2.3 | Reactive compatibility composable + Echo listener | `resources/js/composables/useCompatibility.ts` | ⬜ TODO | — |
| 2.4 | Client-side wattage check (sum `tdp_watts` vs `capacity_watts`) | Inside `useCompatibility.ts` | ⬜ TODO | — |
| 2.5 | `CompatibilityReport` + `CompatibilityCheck` TypeScript interfaces | Defined in `useCompatibility.ts` or shared types file | ⬜ TODO | — |

**Acceptance criteria:**
- Panel shows ✔ / ✘ / ⚠ per check with label + detail string.
- Any `fail` check suppresses F12 and flashes a warning banner.
- Override flow shows exact incompatibility strings + requires explicit cashier confirmation.
- Wattage warning fires when total TDP > PSU capacity, or TDP > 0 with no PSU present.

---

## Section 3.3 — Direct Hardware Integration (Browser APIs) &nbsp;`0 / 5`

| # | Deliverable | File Path | Status | Completed |
|---|---|---|---|---|
| 3.1 | HID barcode scanner composable (USB keyboard emulation) | `resources/js/composables/useBarcodeScan.ts` | ⬜ TODO | — |
| 3.2 | Web Serial barcode scanner composable | `resources/js/composables/useWebSerialScanner.ts` | ⬜ TODO | — |
| 3.3 | Raw ESC/POS byte command builder utility | `resources/js/utils/escpos.ts` | ⬜ TODO | — |
| 3.4 | WebUSB / Web Serial printer composable | `resources/js/composables/usePrinter.ts` | ⬜ TODO | — |
| 3.5 | Receipt layout + RMA ticket layout (via ESC/POS commands) | Inside `usePrinter.ts` / `escpos.ts` | ⬜ TODO | — |

**Acceptance criteria:**
- Scanner composable buffers chars < 50 ms apart; emits on `Enter` or 100 ms gap.
- Scanner works globally regardless of focused element.
- `escpos.ts` implements all 7 required byte sequences (Init, Align Center/Left, Bold On/Off, Feed & Cut, Line Feed).
- Receipt includes: store header, transaction ID, itemized SN lines, subtotal/tax/total, payment method, footer.
- RMA ticket includes: RMA ref, product + SN, reason, date, cashier ID.

---

## Section 3.4 — Real-Time WebSocket Notifications &nbsp;`0 / 3`

| # | Deliverable | File Path | Status | Completed |
|---|---|---|---|---|
| 4.1 | Laravel Echo bootstrap (Reverb driver) | `resources/js/plugins/echo.ts` | ⬜ TODO | — |
| 4.2 | Notifications composable (Echo subscriptions + reactive list) | `resources/js/composables/useNotifications.ts` | ⬜ TODO | — |
| 4.3 | Toast stack component | `resources/js/components/ui/ToastStack.vue` | ⬜ TODO | — |

**Acceptance criteria:**
- Echo bootstrapped with `VITE_REVERB_*` env vars; no hardcoded secrets.
- Subscribes to `pos.{cashier_id}` (SpecsImported, LedgerUpdated, CompatibilityResult) and `inventory` (StockLevelLow).
- Toasts auto-dismiss after 6 s; `type: 'error'` or `persistent: true` toasts stay until manually dismissed.
- Toast stack never obscures the cart or checkout button.

---

## Section 4 — Global Coding Standards (Non-Negotiable) &nbsp;`0 / 3`

> These are not individual files — they are quality gates that apply across **all** deliverables above.
> Mark as ✅ Done only after a full audit pass, not file-by-file.

| # | Rule | Status | Audited |
|---|---|---|---|
| 5.1 | All `.vue` files use `<script setup lang="ts">` + typed `defineProps` / `defineEmits` | ⬜ TODO | — |
| 5.2 | Zero Tailwind arbitrary color values; all colors use semantic tokens from `ui-standard.md` | ⬜ TODO | — |
| 5.3 | All interactive elements have `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2` and min `44×44 px` touch target | ⬜ TODO | — |

---

## Changelog

> Append one line per session in the format: `YYYY-MM-DD | Agent | Items completed | Notes`

| Date | Agent | Items Completed | Notes |
|---|---|---|---|
| — | — | — | Project initialized; no work started yet |

---

*This file is auto-maintained by the AI agent. Do not edit manually.*
