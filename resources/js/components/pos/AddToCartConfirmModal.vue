<script setup lang="ts">
// =============================================================================
// AddToCartConfirmModal — Spec §3.1 Confirmation Modal
// Shown when cashier selects a Serial Number from the search dropdown.
// Includes a "Don't show this again" checkbox that persists to localStorage
// so that subsequent selections bypass this modal entirely.
// =============================================================================

// 1. Vue core imports
import { ref, watch } from 'vue'

// 2. Third-party imports
import { PackagePlus, X } from 'lucide-vue-next'

// 3. Types
import type { CartLineItem } from '@/types/pos'

// 4. Props
const props = defineProps<{
    open: boolean
    item: CartLineItem | null
}>()

// 5. Emits
const emit = defineEmits<{
    close: []
    confirm: [bypass: boolean]
}>()

// 6. Reactive state
const bypassFuture = ref(false)

// Reset checkbox state whenever the modal opens fresh
watch(() => props.open, (isOpen) => {
    if (isOpen) bypassFuture.value = false
})

// 7. Methods
const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price)

const handleConfirm = () => {
    emit('confirm', bypassFuture.value)
}

const handleClose = () => {
    bypassFuture.value = false
    emit('close')
}

const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') handleClose()
    if (e.key === 'Enter') handleConfirm()
}
</script>

<template>
    <!-- Overlay -->
    <Teleport to="body">
        <div
            v-if="open && item"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-confirm-title"
            @keydown="handleKeydown"
        >
            <!-- Panel -->
            <div class="w-full max-w-sm rounded-2xl bg-pos-surface-raised border border-pos-border shadow-xl p-6 mx-4">

                <!-- Header -->
                <div class="flex items-start justify-between mb-5">
                    <div class="flex items-center gap-3">
                        <div class="flex items-center justify-center w-10 h-10 rounded-full bg-pos-primary-subtle shrink-0">
                            <PackagePlus class="w-5 h-5 text-pos-primary" aria-hidden="true" />
                        </div>
                        <h2 id="add-confirm-title" class="text-base font-semibold text-pos-text-primary leading-snug">
                            Add to Cart?
                        </h2>
                    </div>
                    <button
                        type="button"
                        aria-label="Cancel and close"
                        class="text-pos-text-muted hover:text-pos-text-primary transition-colors duration-150
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pos-primary focus-visible:ring-offset-2
                               rounded-lg p-1"
                        @click="handleClose"
                    >
                        <X class="w-4 h-4" aria-hidden="true" />
                    </button>
                </div>

                <!-- Item summary -->
                <div class="rounded-lg border border-pos-border bg-pos-surface-sunken p-4 mb-5 space-y-1.5">
                    <p class="text-sm font-semibold text-pos-text-primary">{{ item.product_name }}</p>
                    <p class="text-xs font-mono text-pos-text-secondary">SKU: {{ item.sku }}</p>
                    <p class="text-xs font-mono text-pos-text-accent font-medium">SN: {{ item.serial_number }}</p>
                    <p class="text-base font-bold text-pos-text-primary pt-1">{{ formatPrice(item.unit_price) }}</p>
                </div>

                <!-- "Don't show this again" preference -->
                <label
                    for="bypass-confirm-checkbox"
                    class="flex items-center gap-2.5 mb-5 cursor-pointer group"
                >
                    <input
                        id="bypass-confirm-checkbox"
                        v-model="bypassFuture"
                        type="checkbox"
                        class="w-4 h-4 rounded border-pos-border-strong accent-pos-primary cursor-pointer
                               focus-visible:ring-2 focus-visible:ring-pos-primary focus-visible:ring-offset-2"
                    />
                    <span class="text-sm text-pos-text-secondary group-hover:text-pos-text-primary transition-colors duration-150">
                        Don't show this again
                    </span>
                </label>

                <!-- Actions -->
                <div class="flex gap-3">
                    <button
                        type="button"
                        class="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-lg
                               bg-pos-surface border border-pos-border text-pos-text-primary text-sm font-medium
                               transition-colors duration-150 hover:bg-pos-surface-sunken
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pos-border-strong focus-visible:ring-offset-2
                               min-h-[44px]"
                        @click="handleClose"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        autofocus
                        class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                               bg-pos-primary text-pos-on-primary text-sm font-semibold
                               transition-colors duration-150 hover:bg-pos-primary-hover
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pos-primary focus-visible:ring-offset-2
                               min-h-[44px]"
                        @click="handleConfirm"
                    >
                        <PackagePlus class="w-4 h-4" aria-hidden="true" />
                        Add to Cart
                    </button>
                </div>

                <!-- Keyboard hint -->
                <p class="text-xs text-pos-text-muted text-center mt-3">
                    <kbd class="font-mono px-1 py-0.5 rounded bg-pos-surface-sunken text-pos-text-secondary">Enter</kbd>
                    to confirm &nbsp;·&nbsp;
                    <kbd class="font-mono px-1 py-0.5 rounded bg-pos-surface-sunken text-pos-text-secondary">Esc</kbd>
                    to cancel
                </p>
            </div>
        </div>
    </Teleport>
</template>
