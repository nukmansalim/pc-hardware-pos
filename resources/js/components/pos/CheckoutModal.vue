<script setup lang="ts">
// 1. Vue core imports
import { ref, computed, watch } from 'vue'

// 2. Third-party imports
import { X, CreditCard, Banknote, Smartphone } from 'lucide-vue-next'

// 3. Types
import type { CartLineItem } from '@/types/pos'

// 4. Props
const props = defineProps<{
    open: boolean
    items: CartLineItem[]
}>()

// 5. Emits
const emit = defineEmits<{
    close: []
    confirm: [payload: { paymentMethod: string; cashReceived: number | null }]
}>()

// 6. Reactive state
type PaymentMethod = 'cash' | 'card' | 'qris'

const paymentMethod = ref<PaymentMethod>('cash')
const cashReceived = ref<number | null>(null)
const isConfirming = ref(false)

// 7. Computed
const eligibleItems = computed(() =>
    props.items.filter((i) => i.status !== 'RMA_PENDING' && i.status !== 'SOLD'),
)

const subtotal = computed(() =>
    eligibleItems.value.reduce((sum, i) => sum + i.unit_price, 0),
)

const tax = computed(() => Math.round(subtotal.value * 0.11)) // PPN 11%

const total = computed(() => subtotal.value + tax.value)

const change = computed(() => {
    if (paymentMethod.value !== 'cash' || cashReceived.value === null) return null
    return cashReceived.value - total.value
})

const isValid = computed(() => {
    if (paymentMethod.value === 'cash') {
        return cashReceived.value !== null && cashReceived.value >= total.value
    }
    return true
})

const fmt = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

// 8. Methods
const handleConfirm = () => {
    if (!isValid.value) return
    isConfirming.value = true
    emit('confirm', {
        paymentMethod: paymentMethod.value,
        cashReceived: paymentMethod.value === 'cash' ? cashReceived.value : null,
    })
}

const handleClose = () => {
    paymentMethod.value = 'cash'
    cashReceived.value = null
    isConfirming.value = false
    emit('close')
}

// Reset when closed
watch(() => props.open, (val) => {
    if (!val) {
        paymentMethod.value = 'cash'
        cashReceived.value = null
        isConfirming.value = false
    }
})

// Escape key to close
const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') handleClose()
}
</script>

<template>
    <Teleport to="body">
        <Transition
            enter-active-class="transition-opacity duration-200 ease-in-out"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition-opacity duration-150 ease-in-out"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div
                v-if="open"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="checkout-modal-title"
                @keydown="handleKeydown"
                @click.self="handleClose"
            >
                <Transition
                    enter-active-class="transition-all duration-200 ease-out"
                    enter-from-class="opacity-0 scale-95 translate-y-2"
                    enter-to-class="opacity-100 scale-100 translate-y-0"
                >
                    <div
                        v-if="open"
                        class="w-full max-w-lg rounded-2xl bg-pos-surface-raised border border-pos-border shadow-xl overflow-hidden"
                    >
                        <!-- Header -->
                        <div class="flex items-center justify-between px-6 py-4 bg-pos-surface-panel border-b border-pos-border-panel">
                            <h2
                                id="checkout-modal-title"
                                class="text-base font-semibold text-pos-surface-panel-fg flex items-center gap-2"
                            >
                                <CreditCard class="w-5 h-5" aria-hidden="true" />
                                Checkout
                            </h2>
                            <button
                                type="button"
                                class="flex items-center justify-center w-8 h-8 rounded-lg text-pos-border-panel
                                       hover:text-pos-surface-panel-fg hover:bg-pos-terminal-700
                                       transition-colors duration-150
                                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pos-primary focus-visible:ring-offset-1"
                                aria-label="Close checkout modal"
                                @click="handleClose"
                            >
                                <X class="w-4 h-4" aria-hidden="true" />
                            </button>
                        </div>

                        <!-- Body -->
                        <div class="px-6 py-4 space-y-5">
                            <!-- Itemized list -->
                            <div>
                                <h3 class="text-xs font-semibold text-pos-text-secondary uppercase tracking-wide mb-2">
                                    Items ({{ eligibleItems.length }})
                                </h3>
                                <div class="space-y-1 max-h-40 overflow-y-auto pr-1">
                                    <div
                                        v-for="item in eligibleItems"
                                        :key="item.id"
                                        class="flex items-center justify-between text-sm py-1"
                                    >
                                        <div>
                                            <span class="text-pos-text-primary font-medium">{{ item.product_name }}</span>
                                            <span class="ml-2 text-xs font-mono text-pos-text-muted">{{ item.serial_number }}</span>
                                        </div>
                                        <span class="font-mono text-pos-text-primary font-semibold">{{ fmt(item.unit_price) }}</span>
                                    </div>
                                </div>
                            </div>

                            <hr class="border-pos-border" />

                            <!-- Totals -->
                            <div class="space-y-1.5">
                                <div class="flex justify-between text-sm">
                                    <span class="text-pos-text-secondary">Subtotal</span>
                                    <span class="font-mono text-pos-text-primary">{{ fmt(subtotal) }}</span>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span class="text-pos-text-secondary">PPN 11%</span>
                                    <span class="font-mono text-pos-text-primary">{{ fmt(tax) }}</span>
                                </div>
                                <div class="flex justify-between text-base font-bold mt-1 pt-1 border-t border-pos-border">
                                    <span class="text-pos-text-primary">Total</span>
                                    <span class="font-mono text-pos-primary">{{ fmt(total) }}</span>
                                </div>
                            </div>

                            <!-- Payment method -->
                            <div>
                                <h3 class="text-xs font-semibold text-pos-text-secondary uppercase tracking-wide mb-2">
                                    Payment Method
                                </h3>
                                <div class="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Payment method">
                                    <button
                                        v-for="method in (['cash', 'card', 'qris'] as const)"
                                        :key="method"
                                        type="button"
                                        :id="`payment-${method}`"
                                        :role="'radio'"
                                        :aria-checked="paymentMethod === method"
                                        :class="[
                                            'flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border text-sm font-medium transition-all duration-150 min-h-[44px]',
                                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pos-primary focus-visible:ring-offset-2',
                                            paymentMethod === method
                                                ? 'bg-pos-primary text-pos-on-primary border-pos-primary'
                                                : 'bg-pos-surface border-pos-border text-pos-text-secondary hover:bg-pos-surface-sunken hover:text-pos-text-primary',
                                        ]"
                                        @click="paymentMethod = method"
                                    >
                                        <Banknote v-if="method === 'cash'" class="w-4 h-4" aria-hidden="true" />
                                        <CreditCard v-else-if="method === 'card'" class="w-4 h-4" aria-hidden="true" />
                                        <Smartphone v-else class="w-4 h-4" aria-hidden="true" />
                                        <span class="capitalize">{{ method === 'qris' ? 'QRIS' : method }}</span>
                                    </button>
                                </div>
                            </div>

                            <!-- Cash received input -->
                            <div v-if="paymentMethod === 'cash'" class="flex flex-col gap-1.5">
                                <label for="cash-received" class="text-sm font-medium text-pos-text-primary">
                                    Cash Received
                                </label>
                                <input
                                    id="cash-received"
                                    type="number"
                                    :min="total"
                                    :placeholder="`Min ${fmt(total)}`"
                                    v-model.number="cashReceived"
                                    class="w-full px-3 py-2 rounded-lg bg-pos-surface-sunken border border-pos-border text-pos-text-primary text-sm
                                           placeholder:text-pos-text-muted font-mono
                                           transition-colors duration-150 hover:border-pos-border-strong
                                           focus:outline-none focus:ring-2 focus:ring-pos-primary focus:border-transparent"
                                />
                                <!-- Change display -->
                                <div
                                    v-if="change !== null"
                                    :class="[
                                        'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium',
                                        change >= 0 ? 'bg-pos-success-subtle text-pos-success' : 'bg-pos-danger-subtle text-pos-danger',
                                    ]"
                                >
                                    <span>{{ change >= 0 ? 'Change' : 'Insufficient' }}</span>
                                    <span class="font-mono font-bold">{{ fmt(Math.abs(change)) }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div class="px-6 py-4 border-t border-pos-border flex justify-end gap-3 bg-pos-surface-sunken">
                            <button
                                type="button"
                                id="btn-checkout-cancel"
                                class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                                       bg-pos-surface border border-pos-border text-pos-text-secondary text-sm font-medium
                                       transition-colors duration-150 hover:bg-pos-surface-sunken hover:text-pos-text-primary
                                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pos-border-strong focus-visible:ring-offset-2
                                       min-h-[44px]"
                                @click="handleClose"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                id="btn-checkout-confirm"
                                :disabled="!isValid || isConfirming"
                                class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg
                                       bg-pos-primary text-pos-on-primary text-sm font-semibold
                                       transition-colors duration-150 hover:bg-pos-primary-hover
                                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pos-primary focus-visible:ring-offset-2
                                       disabled:opacity-50 disabled:cursor-not-allowed
                                       min-h-[44px]"
                                @click="handleConfirm"
                            >
                                <CreditCard class="w-4 h-4" aria-hidden="true" />
                                {{ isConfirming ? 'Processing…' : 'Confirm Payment' }}
                            </button>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>
    </Teleport>
</template>
