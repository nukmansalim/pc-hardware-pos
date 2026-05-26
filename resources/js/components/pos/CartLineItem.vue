<script setup lang="ts">
// 1. Vue core imports
import { computed } from 'vue'

// 2. Third-party imports
import { Trash2 } from 'lucide-vue-next'

// 3. Types
import type { CartLineItem } from '@/types/pos'

// 4. Props
const props = defineProps<{
    item: CartLineItem
    isFocused?: boolean
}>()

// 5. Emits
const emit = defineEmits<{
    remove: [id: string]
    focus: [id: string]
}>()

// 6. Computed — status badge styling (using pos semantic tokens)
const statusBadge = computed(() => {
    switch (props.item.status) {
        case 'IN_STOCK':
            return {
                classes: 'bg-pos-success-subtle text-pos-success border-pos-success/30',
                label: 'In Stock',
            }
        case 'RESERVED':
            return {
                classes: 'bg-pos-warning-subtle text-pos-warning border-pos-warning/30',
                label: 'Reserved',
            }
        case 'RMA_PENDING':
            return {
                classes: 'bg-pos-danger-subtle text-pos-danger border-pos-danger/30',
                label: 'RMA Pending',
            }
        case 'SOLD':
            return {
                classes: 'bg-pos-danger-subtle text-pos-danger border-pos-danger/30',
                label: 'Sold',
            }
        default:
            return {
                classes: 'bg-pos-surface-sunken text-pos-text-secondary border-pos-border',
                label: props.item.status,
            }
    }
})

// 7. Computed — whether this item blocks checkout
const isBlocked = computed(
    () => props.item.status === 'RMA_PENDING' || props.item.status === 'SOLD',
)

// 8. Computed — formatted price
const formattedPrice = computed(() =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
        props.item.unit_price,
    ),
)

// 9. Methods
const handleRemove = () => {
    emit('remove', props.item.id)
}
</script>

<template>
    <div
        :tabindex="0"
        :data-item-id="item.id"
        :class="[
            'group relative flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-150 cursor-default',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pos-primary focus-visible:ring-offset-2',
            isFocused
                ? 'border-pos-primary bg-pos-primary-subtle'
                : 'border-pos-border bg-pos-surface-raised hover:bg-pos-surface-sunken',
            isBlocked && 'opacity-75',
        ]"
        @focus="emit('focus', item.id)"
        @keydown.delete.prevent="handleRemove"
        :aria-label="`${item.product_name} SN:${item.serial_number} ${item.status}`"
    >
        <!-- Status stripe -->
        <div
            :class="[
                'absolute left-0 top-0 bottom-0 w-1 rounded-l-lg',
                item.status === 'IN_STOCK' && 'bg-pos-success',
                item.status === 'RESERVED' && 'bg-pos-warning',
                (item.status === 'RMA_PENDING' || item.status === 'SOLD') && 'bg-pos-danger',
            ]"
            aria-hidden="true"
        />

        <!-- Product info -->
        <div class="flex-1 min-w-0 pl-2">
            <div class="flex items-center gap-2 flex-wrap">
                <span
                    :class="[
                        'text-sm font-semibold text-pos-text-primary leading-tight',
                        isBlocked && 'line-through text-pos-text-muted',
                    ]"
                >
                    {{ item.product_name }}
                </span>
                <!-- Status badge -->
                <span
                    :class="[
                        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
                        statusBadge.classes,
                    ]"
                >
                    {{ statusBadge.label }}
                </span>
            </div>
            <div class="flex items-center gap-3 mt-0.5">
                <span class="text-xs font-mono text-pos-text-secondary">
                    SN: {{ item.serial_number }}
                </span>
                <span class="text-xs text-pos-text-muted">{{ item.sku }}</span>
            </div>
        </div>

        <!-- Price -->
        <div class="text-right shrink-0">
            <span
                :class="[
                    'text-base font-bold',
                    isBlocked ? 'text-pos-text-muted line-through' : 'text-pos-text-primary',
                ]"
            >
                {{ formattedPrice }}
            </span>
        </div>

        <!-- Remove button -->
        <button
            type="button"
            class="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg
                   text-pos-text-muted hover:text-pos-danger hover:bg-pos-danger-subtle
                   transition-colors duration-150 opacity-0 group-hover:opacity-100 focus-visible:opacity-100
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pos-danger focus-visible:ring-offset-1"
            :aria-label="`Remove ${item.product_name} from cart`"
            @click.stop="handleRemove"
        >
            <Trash2 class="w-4 h-4" aria-hidden="true" />
        </button>
    </div>
</template>
