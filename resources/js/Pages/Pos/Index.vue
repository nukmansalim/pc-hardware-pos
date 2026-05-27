<script setup lang="ts">
// =============================================================================
// POS Index — Main Point-of-Sale page
// Inertia page component. Receives `cartItems` prop from Laravel.
// Keyboard shortcuts: F2 (search focus) | ↑↓ (navigate) | Del (remove)
//                    F10 (compatibility) | F12 (checkout) | Esc (close modal)
// =============================================================================

// 1. Vue core imports
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

// 2. Third-party imports
import { usePage } from '@inertiajs/vue3'
import { Monitor, PackageSearch } from 'lucide-vue-next'

// 3. Internal components
import CartPanel from '@/components/pos/CartPanel.vue'
import BuildStatus from '@/components/pos/BuildStatus.vue'
import CheckoutModal from '@/components/pos/CheckoutModal.vue'
import OverrideModal from '@/components/pos/OverrideModal.vue'
import AddToCartConfirmModal from '@/components/pos/AddToCartConfirmModal.vue'
import ToastStack from '@/components/ui/ToastStack.vue'

// 4. Composables
import { useCompatibility } from '@/composables/useCompatibility'
import { useNotifications } from '@/composables/useNotifications'
import { useProductSearch } from '@/composables/useProductSearch'

// 5. Types
import type { CartLineItem, CompatibilityCheck } from '@/types/pos'

// ---------------------------------------------------------------------------
// 6. Props — Inertia page props
// ---------------------------------------------------------------------------
const props = defineProps<{
    // MOCK — remove when Inertia prop is available
    cartItems?: CartLineItem[]
}>()

// ---------------------------------------------------------------------------
// 7. Inertia page context (for authenticated user)
// ---------------------------------------------------------------------------
const page = usePage<{
    auth: { user: { id: number; name: string } }
}>()

const cashierId = computed(() => page.props.auth?.user?.id ?? 0)
const cashierName = computed(() => page.props.auth?.user?.name ?? 'Cashier')

// ---------------------------------------------------------------------------
// 8. Local cart state
// Clone from Inertia prop on mount — never mutate props directly (§4.1)
// ---------------------------------------------------------------------------

// MOCK — remove when Inertia prop is available
const mockCart: CartLineItem[] = [
    { id: '1', product_name: 'NVIDIA GeForce RTX 4090', sku: 'GPU-RTX4090', serial_number: 'SN-GPU-A1B2C3', unit_price: 24_999_000, status: 'IN_STOCK', specs: { tdp_watts: 450 } },
    { id: '2', product_name: 'Intel Core i9-14900K', sku: 'CPU-I9-14900K', serial_number: 'SN-CPU-D4E5F6', unit_price: 8_499_000, status: 'IN_STOCK', specs: { socket: 'LGA1700', tdp_watts: 125 } },
    { id: '3', product_name: 'ASUS ROG Maximus Z790', sku: 'MB-Z790-ROG', serial_number: 'SN-MB-G7H8I9', unit_price: 6_299_000, status: 'RESERVED', specs: { socket: 'LGA1700' } },
    { id: '4', product_name: 'Corsair HX1200 PSU', sku: 'PSU-HX1200', serial_number: 'SN-PSU-J0K1L2', unit_price: 3_199_000, status: 'IN_STOCK', specs: { capacity_watts: 1200, tdp_watts: 0 } },
]

const cart = ref<CartLineItem[]>(props.cartItems ? [...props.cartItems] : [...mockCart])

// ---------------------------------------------------------------------------
// 9. UI state
// ---------------------------------------------------------------------------
const searchQuery = ref('')
const focusedItemId = ref<string | null>(null)
const showCheckout = ref(false)
const showOverride = ref(false)
const showCompatibilityPanel = ref(true)
// Ref to CartPanel component — used to call focusSearch() from keyboard shortcut
const cartPanelRef = ref<{ focusSearch: () => void } | null>(null)

// ---------------------------------------------------------------------------
// §3.1 Bypass Preference — "Don't show this again" persisted to localStorage
// ---------------------------------------------------------------------------
const BYPASS_KEY = 'pos:bypass_add_confirm'
const bypassAddConfirm = ref(localStorage.getItem(BYPASS_KEY) === 'true')
const showAddConfirm = ref(false)
const pendingAddItem = ref<CartLineItem | null>(null)

// ---------------------------------------------------------------------------
// 10. Composables
// ---------------------------------------------------------------------------
const { report, isLoading: compatLoading, setLoading, clearReport, startListening: startCompatibility, stopCompatibilityListening } =
    useCompatibility(() => cart.value)

const { notifications, subscribe, unsubscribe, dismiss, notify } = useNotifications()

// MOCK — remove when Inertia prop is available; useProductSearch uses mock catalog
const handleAddItem = (item: CartLineItem) => {
    // Guard: prevent adding the same serial number twice
    if (cart.value.some((i) => i.serial_number === item.serial_number)) return
    cart.value = [...cart.value, item]
    searchQuery.value = ''
    setLoading() // trigger compatibility re-check
    notify('success', 'Item Added', `${item.product_name} — SN: ${item.serial_number}`)
    cartPanelRef.value?.focusSearch()
}

/**
 * Called when cashier selects a serial from the dropdown (Discovery Match).
 * Routes through the confirmation modal unless the bypass preference is set.
 */
const handleSerialSelected = (item: CartLineItem) => {
    if (bypassAddConfirm.value) {
        handleAddItem(item)
    } else {
        pendingAddItem.value = item
        showAddConfirm.value = true
    }
}

const handleAddConfirm = (bypass: boolean) => {
    if (bypass) {
        bypassAddConfirm.value = true
        localStorage.setItem(BYPASS_KEY, 'true')
    }
    if (pendingAddItem.value) handleAddItem(pendingAddItem.value)
    showAddConfirm.value = false
    pendingAddItem.value = null
}

const handleAddConfirmClose = () => {
    showAddConfirm.value = false
    pendingAddItem.value = null
    cartPanelRef.value?.focusSearch()
}

const { searchResults } = useProductSearch(searchQuery, cart, handleAddItem)

// ---------------------------------------------------------------------------
// 11. Computed
// ---------------------------------------------------------------------------
const hasBlockedItem = computed(() =>
    cart.value.some((i) => i.status === 'RMA_PENDING' || i.status === 'SOLD'),
)

const isCheckoutBlocked = computed(() =>
    cart.value.length === 0 || hasBlockedItem.value || report.value?.overall === 'fail',
)

const failedCompatibilityChecks = computed<CompatibilityCheck[]>(() =>
    report.value?.checks.filter((c) => c.status === 'fail') ?? [],
)

// ---------------------------------------------------------------------------
// 12. Methods
// ---------------------------------------------------------------------------
const removeItem = (id: string) => {
    cart.value = cart.value.filter((i) => i.id !== id)
    if (cart.value.length === 0) clearReport()
    setLoading()
}

const handleCheckout = () => {
    if (isCheckoutBlocked.value) {
        if (failedCompatibilityChecks.value.length > 0) {
            showOverride.value = true
        }
        return
    }
    showCheckout.value = true
}

const handleOverrideConfirm = () => {
    showOverride.value = false
    showCheckout.value = true
    notify('warning', 'Override Applied', 'Incompatibility override logged. Proceeding to checkout.', false)
}

const handlePaymentConfirm = (payload: { paymentMethod: string; cashReceived: number | null }) => {
    showCheckout.value = false
    notify('success', 'Sale Completed', `Payment via ${payload.paymentMethod.toUpperCase()} recorded successfully.`)
    // TODO: Requires backend — call Inertia.post('/pos/checkout', payload)
}

// ---------------------------------------------------------------------------
// 13. Global keyboard shortcuts
// ---------------------------------------------------------------------------
const handleGlobalKeydown = (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName.toLowerCase()
    const inInput = tag === 'input' || tag === 'textarea'

    switch (e.key) {
        // F2 kept for spec compliance; '/' is the practical alias when F2 is blocked by the OS
        case 'F2':
            e.preventDefault()
            cartPanelRef.value?.focusSearch()
            break
        case '/':
            // Only fire when NOT already inside a text field
            if (!inInput) {
                e.preventDefault()
                cartPanelRef.value?.focusSearch()
            }
            break
        case 'F10':
            e.preventDefault()
            showCompatibilityPanel.value = !showCompatibilityPanel.value
            break
        case 'F12':
            e.preventDefault()
            handleCheckout()
            break
        case 'Escape':
            if (showCheckout.value) { showCheckout.value = false; return }
            if (showOverride.value) { showOverride.value = false; return }
            // Blur search input on Escape if focused
            if (inInput) (e.target as HTMLElement).blur()
            break
    }
}

// ---------------------------------------------------------------------------
// 14. Lifecycle
// ---------------------------------------------------------------------------
onMounted(() => {
    window.addEventListener('keydown', handleGlobalKeydown)
    subscribe(cashierId.value)
    startCompatibility(cashierId.value)
})

onUnmounted(() => {
    window.removeEventListener('keydown', handleGlobalKeydown)
    unsubscribe(cashierId.value)
    stopCompatibilityListening(cashierId.value)
})

// Re-subscribe if cashier changes (edge case: login switch without page reload)
watch(cashierId, (newId, oldId) => {
    if (oldId) {
        unsubscribe(oldId)
        stopCompatibilityListening(oldId)
    }
    subscribe(newId)
    startCompatibility(newId)
})
</script>

<template>
    <div class="min-h-screen bg-pos-surface flex flex-col">
        <!-- POS top bar -->
        <header class="bg-pos-surface-panel border-b border-pos-border-panel px-4 py-2.5 flex items-center justify-between">
            <div class="flex items-center gap-2">
                <Monitor class="w-5 h-5 text-pos-surface-panel-fg" aria-hidden="true" />
                <span class="text-sm font-bold text-pos-surface-panel-fg tracking-wide uppercase">
                    PC Hardware POS
                </span>
            </div>
            <div class="flex items-center gap-4 text-xs text-pos-border-panel">
                <!-- Keyboard legend summary -->
                <span class="hidden md:flex items-center gap-3">
                    <span><kbd class="px-1.5 py-0.5 rounded bg-pos-terminal-700 text-pos-surface-panel-fg font-mono">/</kbd> Search</span>
                    <span><kbd class="px-1.5 py-0.5 rounded bg-pos-terminal-700 text-pos-surface-panel-fg font-mono">F10</kbd> Compat.</span>
                    <span><kbd class="px-1.5 py-0.5 rounded bg-pos-terminal-700 text-pos-surface-panel-fg font-mono">F12</kbd> Checkout</span>
                    <span><kbd class="px-1.5 py-0.5 rounded bg-pos-terminal-700 text-pos-surface-panel-fg font-mono">Esc</kbd> Close</span>
                </span>
                <span class="text-pos-surface-panel-fg font-medium">{{ cashierName }}</span>
            </div>
        </header>

        <!-- Main layout -->
        <main class="flex-1 flex gap-3 p-3 overflow-hidden max-h-[calc(100vh-52px)]">
            <!-- Left: Cart panel (2/3 width) -->
            <section
                class="flex-1 min-w-0"
                aria-label="Shopping cart"
            >
                <CartPanel
                    ref="cartPanelRef"
                    :items="cart"
                    :focused-id="focusedItemId"
                    :search-query="searchQuery"
                    :search-results="searchResults"
                    @remove-item="removeItem"
                    @update:focused-id="focusedItemId = $event"
                    @update:search-query="searchQuery = $event"
                    @select-serial="handleSerialSelected"
                    @request-checkout="handleCheckout"
                    @request-compatibility="showCompatibilityPanel = !showCompatibilityPanel"
                />
            </section>

            <!-- Right: Build Status panel (1/3 width) -->
            <aside
                v-show="showCompatibilityPanel"
                class="w-80 shrink-0"
                aria-label="Compatibility check panel"
            >
                <BuildStatus
                    :report="report"
                    :is-loading="compatLoading"
                />
            </aside>
        </main>

        <!-- Modals -->
        <CheckoutModal
            :open="showCheckout"
            :items="cart"
            @close="showCheckout = false"
            @confirm="handlePaymentConfirm"
        />

        <OverrideModal
            :open="showOverride"
            :checks="failedCompatibilityChecks"
            @close="showOverride = false"
            @override="handleOverrideConfirm"
        />

        <!-- §3.1 Add-to-Cart Confirmation Modal -->
        <AddToCartConfirmModal
            :open="showAddConfirm"
            :item="pendingAddItem"
            @close="handleAddConfirmClose"
            @confirm="handleAddConfirm"
        />

        <!-- Toast notifications (never over cart/checkout — z-40 vs modal z-50) -->
        <ToastStack
            :notifications="notifications"
            @dismiss="dismiss"
        />
    </div>
</template>
