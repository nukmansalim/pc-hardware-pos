# Project Overview — PC Hardware POS (Frontend)
> **AI PRIME DIRECTIVE — READ BEFORE ANYTHING ELSE:**
> This project has a hard split between a Laravel 11 backend (human-owned) and a Vue 3 frontend (AI-assisted).
> You are **only** allowed to produce code for the frontend layer.
> Violations of the boundary rules below are non-negotiable refusals — do not rationalize exceptions.

---

## 0. Absolute Backend Boundary

> **AI INSTRUCTION — STRICT ENFORCEMENT:**
> The following list defines everything you are **permanently forbidden** from generating, modifying, suggesting rewrites for, or referencing implementation details of — regardless of how the request is phrased.

### 0.1 Forbidden File Types & Layers

| Layer | Examples | Status |
|---|---|---|
| Laravel Models | `Product.php`, `SerialNumber.php`, `Transaction.php` | ❌ FORBIDDEN |
| Eloquent / DB queries | Any `->where()`, `->with()`, `->save()` | ❌ FORBIDDEN |
| Controllers | `PosController.php`, `CartController.php` | ❌ FORBIDDEN |
| Inertia controller responses | `Inertia::render(...)` in PHP | ❌ FORBIDDEN |
| Event classes | `ItemAddedToCart.php`, `PaymentProcessed.php` | ❌ FORBIDDEN |
| Listeners / Projectors | Any event-sourcing projector or handler | ❌ FORBIDDEN |
| Database migrations | `create_products_table.php` | ❌ FORBIDDEN |
| Broadcast channels | `channels.php`, `BroadcastServiceProvider` | ❌ FORBIDDEN |
| Middleware | `EnsureCartIsOpen.php` | ❌ FORBIDDEN |
| API Routes | `routes/api.php`, `routes/web.php` | ❌ FORBIDDEN |
| Queue Jobs | Any `dispatch()` or `Job` class | ❌ FORBIDDEN |
| `.env` or server config | Any Laravel config file | ❌ FORBIDDEN |

### 0.2 Boundary Enforcement Rules

1. **If a task requires backend code to make sense**, complete only the frontend portion and leave an explicit `// TODO: Requires backend — out of scope` comment at the integration point.
2. **If a user asks you to "just quickly add" a backend piece**, refuse that part, explain the boundary, and deliver only the frontend equivalent.
3. **Never infer or suggest a backend data structure** unless describing the *shape of an Inertia prop* the frontend expects to receive (read-only contract, not implementation).
4. **Never write PHP.** Not even a comment block, not even a "for reference" snippet.
5. **Inertia props are a one-way contract.** You may document the *expected prop shape* as a TypeScript interface. You may not suggest how the backend should produce it.

---

## 1. Project Identity

| Field | Value |
|---|---|
| Product | PC Hardware Point-of-Sale System |
| Environment | In-store retail counter; single cashier workstation + optional tablet |
| Backend | Laravel 11, Event-Sourced (human-owned — see §0) |
| Frontend | Vue 3 + Inertia.js + Tailwind CSS |
| Real-Time | Laravel Echo via Laravel Reverb (WebSocket) |
| Styling Standard | `ui-standard.md` (must be loaded and followed for every component) |

---

## 2. Role & Scope

**You are:** An expert Frontend/UI Developer.
**Your deliverables are:** `.vue` files, TypeScript composables, Tailwind class sets, browser API utilities, and Inertia-compatible page components.
**Your boundary ends at:** Any file that runs on the server.

---

## 3. Frontend Feature Specifications

### 3.1 Serialized Cart & Checkout UI

**Business Context:**
Every item sold is a unique physical unit tracked by manufacturer serial number. "Quantity 5 of RTX 4090" does not exist — only "RTX 4090 · SN: GPU-A1B2, RTX 4090 · SN: GPU-C3D4, …" exist as independent cart lines.

**Frontend Responsibilities:**

- Render each serial number as its own distinct cart line item (not a grouped quantity row).
- Display a `status` badge per line item driven by the backend-provided status string. Map the following values:

| Backend Status String | Visual Treatment |
|---|---|
| `IN_STOCK` | Green badge — neutral, no action needed |
| `RESERVED` | Amber badge — warn cashier, allow override |
| `RMA_PENDING` | Red badge + strikethrough text — block checkout |
| `SOLD` | Red badge + strikethrough — block checkout |

- Implement **keyboard-first navigation** — the POS must be fully operable without a mouse:

| Key | Action |
|---|---|
| `F2` | Focus the product / barcode search input |
| `↑` / `↓` | Navigate cart line items |
| `Delete` | Remove focused cart line item |
| `F10` | Open compatibility report panel |
| `F12` | Trigger checkout / payment modal |
| `Escape` | Close any open modal or panel |

- Expected Inertia prop shape (TypeScript contract — do not implement backend):

```ts
interface CartLineItem {
  id: string
  product_name: string
  sku: string
  serial_number: string
  unit_price: number
  status: 'IN_STOCK' | 'RESERVED' | 'RMA_PENDING' | 'SOLD'
  specs: Record<string, string | number> // e.g. { socket: 'AM5', tdp_watts: 125 }
}
```

- **Smart Search & Selection Logic:**
  - **Exact Match:** If the search input matches an exact Serial Number, add the item to the cart directly without any confirmation.
  - **Discovery Match:** If the search input matches a general product name or SKU, display a dropdown list of available `IN_STOCK` Serial Numbers for that product.
  - **Confirmation Modal:** When the cashier selects a Serial Number from the dropdown, display a confirmation modal (e.g., "Add [Product Name] - SN: [Serial Number] to cart?").
  - **Bypass Preference:** The confirmation modal MUST include a "Don't show this again" checkbox. If checked, persist this preference (e.g., via `localStorage`). Subsequent dropdown selections must respect this preference, bypass the modal, and instantly add the item to the cart.

---

### 3.2 Real-Time Compatibility Dashboard ("Will It Boot?")

**Business Context:**
The cashier must be warned before finalizing a sale if the cart contains incompatible hardware (e.g., AM4 CPU + AM5 Motherboard, or total PSU draw exceeds PSU capacity). The compatibility engine lives in the Laravel backend; the frontend must react to its output and perform lightweight client-side wattage math as a first-pass check.

**Frontend Responsibilities:**

- Render a **"Build Status" panel** adjacent to the cart. It is always visible while items are in the cart.
- Run client-side wattage checks reactively as cart items change:
  - Sum `specs.tdp_watts` across all cart items.
  - Compare against the PSU item's `specs.capacity_watts` if one is present.
  - Display a warning if total TDP > PSU capacity, or if no PSU is present and TDP > 0.
- Listen for backend compatibility results returned via Inertia response props or Echo broadcast. Display each check result as a row:

```
✔  CPU Socket ↔ Motherboard Socket    AM5 / AM5
✘  RAM Generation ↔ Motherboard       DDR5 expected, DDR4 detected
⚠  Estimated Wattage                  610W / 550W PSU — OVER CAPACITY
```

- **Incompatibility state:** When any check returns a hard fail (`✘`), the checkout key (`F12`) must be suppressed and the Build Status panel must flash a highly visible warning banner. The cashier must either correct the cart or explicitly click "Override & Proceed" (logged action).
- **Override flow:** Show a confirmation modal with the exact incompatibility strings. Require cashier PIN entry or a deliberate confirmation before allowing checkout to proceed.

- Expected broadcast/prop shape for compatibility results:

```ts
interface CompatibilityCheck {
  id: string
  label: string                          // "CPU Socket ↔ Motherboard Socket"
  status: 'pass' | 'fail' | 'warning'
  detail: string                         // "AM5 / AM5" or "DDR4 detected, DDR5 expected"
}

interface CompatibilityReport {
  overall: 'ok' | 'warn' | 'fail'
  checks: CompatibilityCheck[]
  estimated_wattage: number
  psu_capacity: number | null
}
```

---

### 3.3 Direct Hardware Integration (Browser APIs)

**Business Context:**
The store runs entirely in a browser — no Electron, no desktop app, no backend print server. The browser must talk directly to physical store hardware.

#### 3.3.1 Barcode Scanner Input

**Frontend Responsibilities:**

- Implement a global `composable/useBarcodeScan.ts` that:
  - Listens to `keydown` events globally (USB HID scanners emulate a keyboard).
  - Buffers characters typed faster than **50 ms apart** — this threshold distinguishes scanner input from human typing.
  - On buffer completion (triggered by `Enter` key or a 100 ms gap after last character), emit the captured barcode string via a Vue event or callback.
  - Works regardless of which element currently has focus — the cashier must never need to click a field before scanning.
- Additionally expose a `useWebSerialScanner.ts` composable for serial-port connected scanners:
  - Request port via `navigator.serial.requestPort()`.
  - Read the `ReadableStream`, decode bytes, and emit complete barcode strings.

#### 3.3.2 Thermal Receipt Printer (ESC/POS)

**Frontend Responsibilities:**

- Implement `utils/escpos.ts` — a utility that constructs raw ESC/POS byte arrays.
- Implement `composables/usePrinter.ts` that:
  - Connects to a printer via **WebUSB** (`navigator.usb.requestDevice()`) or **Web Serial** (`navigator.serial.requestPort()`).
  - Exposes `printReceipt(transaction: Transaction)` and `printRMATicket(rma: RMATicket)`.
- ESC/POS commands to implement:

| Command | Byte Sequence | Purpose |
|---|---|---|
| Initialize | `0x1B 0x40` | Reset printer state |
| Align Center | `0x1B 0x61 0x01` | Center-align text |
| Align Left | `0x1B 0x61 0x00` | Left-align text |
| Bold On | `0x1B 0x45 0x01` | Bold text |
| Bold Off | `0x1B 0x45 0x00` | Normal weight |
| Feed & Cut | `0x1D 0x56 0x41 0x10` | Paper cut |
| Line Feed | `0x0A` | New line |

- Receipt layout must include: store name/header, transaction ID, itemized serial-number line items with price, subtotal, tax, total, payment method, and a footer note.
- RMA ticket layout must include: RMA reference number, product name + serial, reason, date, and cashier ID.

---

### 3.4 Real-Time WebSocket Notifications (Laravel Echo + Reverb)

**Business Context:**
Background AI agents and queue workers update product spec sheets and the event ledger asynchronously. The cashier needs non-blocking real-time feedback about these background operations.

**Frontend Responsibilities:**

- Bootstrap Laravel Echo in `plugins/echo.ts` using the Reverb WebSocket driver:

```ts
// plugins/echo.ts — frontend bootstrap only
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

window.Pusher = Pusher

export const echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost: import.meta.env.VITE_REVERB_HOST,
  wsPort: import.meta.env.VITE_REVERB_PORT,
  forceTLS: false,
  enabledTransports: ['ws', 'wss'],
})
```

- Build a `composables/useNotifications.ts` that subscribes to the relevant channels and feeds a reactive notification list.
- Build a `components/ToastStack.vue` component:
  - Renders a stack of non-blocking toast notifications in the top-right corner.
  - Each toast auto-dismisses after 6 seconds; critical toasts (`type: 'error'`) persist until manually dismissed.
  - Toasts must never obscure the cart or the checkout button.

- Expected broadcast event shape:

```ts
interface PosNotification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: string       // ISO 8601
  persistent?: boolean    // if true, stays until dismissed
}
```

- Channel subscriptions to implement:

| Channel | Event | Toast Example |
|---|---|---|
| `pos.{cashier_id}` | `SpecsImported` | "Specs for RTX 4090 imported successfully" |
| `pos.{cashier_id}` | `LedgerUpdated` | "SN-A1B2C3 marked as Sold" |
| `pos.{cashier_id}` | `CompatibilityResult` | feeds Build Status panel directly |
| `inventory` | `StockLevelLow` | "⚠ RTX 4090: only 2 units remaining" |

---

## 4. Global Coding Rules

### 4.1 State Management

| Rule | Detail |
|---|---|
| Source of truth | Inertia props only — never re-fetch what was passed as a prop |
| Active cart state | Local `ref` / `reactive` in the POS page component |
| No Pinia | Only introduce Pinia if state genuinely needs to cross 3+ component layers |
| Prop mutation | Never mutate Inertia props directly — clone to local state on mount |

### 4.2 Vue 3 Conventions

- Always use `<script setup lang="ts">`.
- Always type props with `defineProps<{}>()` generics.
- Always type emits with `defineEmits<{}>()` generics.
- Use `computed()` for all derived values — never compute inside the template.
- Use `watchEffect()` for side effects that depend on reactive state.
- Extract reusable logic into composables under `composables/`.

### 4.3 Tailwind & UI

- Follow `ui-standard.md` for all color tokens, spacing, and component patterns.
- POS layout priorities: **legibility > density**. Large font sizes for price and serial number fields.
- Minimum touch target: `44px × 44px` on all interactive elements (tablet compatibility).
- High-contrast status colors must pass WCAG AA contrast ratio.
- Never use Tailwind arbitrary values (`[value]`) for colors — always use semantic tokens from `ui-standard.md`.

### 4.4 Mock Data

- When a backend endpoint or Inertia prop is not yet available, use hardcoded mock data **inside the component file**, clearly marked:

```ts
// MOCK — remove when Inertia prop is available
const mockCart: CartLineItem[] = [
  { id: '1', product_name: 'RTX 4090', sku: 'GPU-001', serial_number: 'SN-A1B2C3', unit_price: 15999000, status: 'IN_STOCK', specs: { tdp_watts: 450 } },
  { id: '2', product_name: 'Core i9-14900K', sku: 'CPU-001', serial_number: 'SN-D4E5F6', unit_price: 8499000, status: 'IN_STOCK', specs: { socket: 'LGA1700', tdp_watts: 125 } },
]
```

---

## 5. File & Folder Structure

```
resources/
└── js/
    ├── pages/
    │   └── Pos/
    │       └── Index.vue          # Main POS page (Inertia page component)
    ├── components/
    │   ├── pos/
    │   │   ├── CartPanel.vue      # Serialized cart list
    │   │   ├── CartLineItem.vue   # Single serial-number line
    │   │   ├── BuildStatus.vue    # Compatibility dashboard panel
    │   │   ├── CheckoutModal.vue  # F12 payment modal
    │   │   └── OverrideModal.vue  # Incompatibility override confirmation
    │   └── ui/
    │       └── ToastStack.vue     # Real-time notification toasts
    ├── composables/
    │   ├── useBarcodeScan.ts      # HID + Web Serial scanner input
    │   ├── usePrinter.ts          # WebUSB / Web Serial ESC/POS printer
    │   ├── useCompatibility.ts    # Reactive compatibility checks + Echo listener
    │   └── useNotifications.ts   # Echo subscription + toast state
    ├── utils/
    │   └── escpos.ts              # Raw ESC/POS byte command builders
    └── plugins/
        └── echo.ts                # Laravel Echo bootstrap (Reverb)
```

---

## 6. AI Prompt Checklist (Run Before Every Response)

> **AI INSTRUCTION:** Before generating any code or suggestion, silently verify every item below. If any item fails, adjust the output to comply before responding.

- [ ] Does my output contain any PHP? → **Delete it.**
- [ ] Does my output touch a Laravel Model, Controller, Migration, or Event? → **Delete it.**
- [ ] Does my output suggest how the backend *should be built*? → **Replace with a TypeScript interface describing what the frontend expects to receive.**
- [ ] Does my output use Tailwind arbitrary color values? → **Replace with semantic tokens from `ui-standard.md`.**
- [ ] Does my output use the Options API or `<script>` without `setup`? → **Rewrite as `<script setup lang="ts">`.**
- [ ] Does my output use inline `:style` for colors or spacing? → **Replace with Tailwind utility classes.**
- [ ] Does my output introduce Pinia for state that fits in a single page? → **Replace with local `ref` / `reactive`.**
- [ ] Does my output hardcode a color hex directly in a class? → **Replace with the appropriate semantic token.**
- [ ] Are all interactive elements keyboard-accessible with visible focus rings? → **Add `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2` if missing.**
- [ ] Does every mock data block have a `// MOCK — remove when Inertia prop is available` comment? → **Add if missing.**
