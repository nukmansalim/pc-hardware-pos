<script setup lang="ts">
// 1. Vue core imports
import { computed, ref, nextTick } from 'vue'

// 2. Third-party imports
import { ShoppingCart, Search } from 'lucide-vue-next'

// 3. Internal components
import CartLineItem from '@/components/pos/CartLineItem.vue'

// 4. Types
import type { CartLineItem as CartLineItemType } from '@/types/pos'

// 5. Props
const props = defineProps<{
    items: CartLineItemType[]
    focusedId?: string | null
    searchQuery?: string
}>()

// 6. Emits
const emit = defineEmits<{
    removeItem: [id: string]
    focusItem: [id: string]
    'update:focusedId': [id: string | null]
    'update:searchQuery': [query: string]
    requestCheckout: []
    requestCompatibility: []
}>()

// 7. Reactive state
const listRef = ref<HTMLElement | null>(null)

// 8. Computed
const isEmpty = computed(() => props.items.length === 0)

const hasBlockedItem = computed(() =>
    props.items.some((i) => i.status === 'RMA_PENDING' || i.status === 'SOLD'),
)

const subtotal = computed(() =>
    props.items
        .filter((i) => i.status !== 'RMA_PENDING' && i.status !== 'SOLD')
        .reduce((sum, i) => sum + i.unit_price, 0),
)

const formattedSubtotal = computed(() =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
        subtotal.value,
    ),
)

const focusedIndex = computed(() =>
    props.items.findIndex((i) => i.id === props.focusedId),
)

// 9. Methods
const moveFocus = (direction: 'up' | 'down') => {
    if (props.items.length === 0) return
    let nextIndex = direction === 'down'
        ? Math.min(focusedIndex.value + 1, props.items.length - 1)
        : Math.max(focusedIndex.value - 1, 0)
    if (focusedIndex.value === -1) nextIndex = 0
    const nextId = props.items[nextIndex].id
    emit('update:focusedId', nextId)
    nextTick(() => {
        const el = listRef.value?.querySelector(`[data-item-id="${nextId}"]`) as HTMLElement | null
        el?.focus()
    })
}

const handleRemoveFocused = () => {
    if (props.focusedId) emit('removeItem', props.focusedId)
}
</script>

<template>
    <div class="flex flex-col h-full bg-pos-surface border border-pos-border rounded-2xl overflow-hidden shadow-sm">
        <!-- Panel header -->
        <div class="flex items-center justify-between px-4 py-3 bg-pos-surface-panel border-b border-pos-border-panel">
            <div class="flex items-center gap-2">
                <ShoppingCart class="w-5 h-5 text-pos-surface-panel-fg" aria-hidden="true" />
                <h2 class="text-sm font-semibold text-pos-surface-panel-fg tracking-wide uppercase">
                    Cart
                    <span
                        v-if="items.length > 0"
                        class="ml-1 px-1.5 py-0.5 rounded-full bg-pos-accent text-pos-on-accent text-xs font-bold"
                    >
                        {{ items.length }}
                    </span>
                </h2>
            </div>
            <!-- Keyboard legend -->
            <div class="hidden lg:flex items-center gap-3 text-xs text-pos-border-panel">
                <span class="flex items-center gap-1">
                    <kbd class="px-1.5 py-0.5 rounded bg-pos-terminal-700 text-pos-surface-panel-fg font-mono text-xs">↑↓</kbd>
                    Navigate
                </span>
                <span class="flex items-center gap-1">
                    <kbd class="px-1.5 py-0.5 rounded bg-pos-terminal-700 text-pos-surface-panel-fg font-mono text-xs">Del</kbd>
                    Remove
                </span>
            </div>
        </div>

        <!-- Search bar -->
        <div class="px-3 py-2 border-b border-pos-border bg-pos-surface-sunken">
            <div class="relative">
                <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pos-text-muted" aria-hidden="true" />
                <input
                    id="cart-search"
                    type="text"
                    placeholder="Scan barcode or search product… (F2)"
                    :value="searchQuery"
                    @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
                    class="w-full pl-8 pr-3 py-2 rounded-lg bg-pos-surface-raised border border-pos-border text-pos-text-primary text-sm
                           placeholder:text-pos-text-muted
                           transition-colors duration-150 hover:border-pos-border-strong
                           focus:outline-none focus:ring-2 focus:ring-pos-primary focus:border-transparent"
                    aria-label="Search products or scan barcode"
                />
            </div>
        </div>

        <!-- Cart items list -->
        <div
            ref="listRef"
            class="flex-1 overflow-y-auto px-3 py-2 space-y-1.5"
            role="list"
            aria-label="Cart items"
            @keydown.up.prevent="moveFocus('up')"
            @keydown.down.prevent="moveFocus('down')"
            @keydown.delete.prevent="handleRemoveFocused"
        >
            <!-- Empty state -->
            <div
                v-if="isEmpty"
                class="flex flex-col items-center justify-center py-16 text-center"
            >
                <ShoppingCart class="w-12 h-12 text-pos-text-muted mb-3" aria-hidden="true" />
                <p class="text-sm font-medium text-pos-text-secondary">Cart is empty</p>
                <p class="text-xs text-pos-text-muted mt-1">Scan a barcode or search for a product</p>
            </div>

            <!-- Items -->
            <CartLineItem
                v-for="item in items"
                :key="item.id"
                :item="item"
                :is-focused="focusedId === item.id"
                role="listitem"
                @remove="emit('removeItem', $event)"
                @focus="emit('update:focusedId', $event)"
            />
        </div>

        <!-- Blocked items warning -->
        <div
            v-if="hasBlockedItem"
            class="mx-3 mb-2 flex items-start gap-2 rounded-lg border border-pos-danger/40 bg-pos-danger-subtle p-3"
            role="alert"
        >
            <span class="text-pos-danger text-sm font-semibold">⚠</span>
            <p class="text-xs text-pos-danger leading-snug">
                One or more items are blocked (RMA Pending or Sold). Remove them before checkout.
            </p>
        </div>

        <!-- Footer — subtotal + checkout -->
        <div class="px-4 py-3 border-t border-pos-border bg-pos-surface-raised">
            <div class="flex items-center justify-between mb-3">
                <span class="text-sm text-pos-text-secondary font-medium">Subtotal</span>
                <span class="text-lg font-bold text-pos-text-primary font-mono">{{ formattedSubtotal }}</span>
            </div>
            <div class="flex gap-2">
                <!-- Compatibility button (F10) -->
                <button
                    type="button"
                    id="btn-compatibility"
                    class="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg
                           bg-pos-surface border border-pos-border text-pos-text-secondary text-sm font-medium
                           transition-colors duration-150 hover:bg-pos-surface-sunken hover:text-pos-text-primary
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pos-border-strong focus-visible:ring-offset-2
                           min-h-[44px]"
                    :aria-label="`Check compatibility (F10). ${items.length} items in cart`"
                    @click="emit('requestCompatibility')"
                >
                    <span class="text-xs font-mono text-pos-text-muted">F10</span>
                    <span>Will It Boot?</span>
                </button>
                <!-- Checkout button (F12) -->
                <button
                    type="button"
                    id="btn-checkout"
                    :disabled="hasBlockedItem || isEmpty"
                    class="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg
                           bg-pos-primary text-pos-on-primary text-sm font-semibold
                           transition-colors duration-150 hover:bg-pos-primary-hover
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pos-primary focus-visible:ring-offset-2
                           disabled:opacity-50 disabled:cursor-not-allowed
                           min-h-[44px]"
                    :aria-label="`Checkout (F12)${hasBlockedItem ? ' — blocked by incompatible items' : ''}`"
                    @click="emit('requestCheckout')"
                >
                    <span class="text-xs font-mono opacity-75">F12</span>
                    <span>Checkout</span>
                </button>
            </div>
        </div>
    </div>
</template>
