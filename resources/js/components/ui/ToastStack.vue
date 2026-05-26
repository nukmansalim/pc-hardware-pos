<script setup lang="ts">
// 1. Vue core imports
import { computed } from 'vue'

// 2. Third-party imports
import { X, Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-vue-next'

// 3. Types
import type { PosNotification } from '@/types/pos'

// 4. Props
const props = defineProps<{
    notifications: PosNotification[]
}>()

// 5. Emits
const emit = defineEmits<{
    dismiss: [id: string]
}>()

// 6. Computed helpers
const iconFor = (type: PosNotification['type']) => {
    switch (type) {
        case 'success': return CheckCircle2
        case 'warning': return AlertTriangle
        case 'error':   return XCircle
        default:        return Info
    }
}

const colorClasses = (type: PosNotification['type']) => {
    switch (type) {
        case 'success':
            return {
                wrapper: 'bg-pos-surface-raised border-pos-success/30',
                icon:    'text-pos-success',
                title:   'text-pos-success',
                body:    'text-pos-text-secondary',
            }
        case 'warning':
            return {
                wrapper: 'bg-pos-surface-raised border-pos-warning/40',
                icon:    'text-pos-warning',
                title:   'text-pos-warning',
                body:    'text-pos-text-secondary',
            }
        case 'error':
            return {
                wrapper: 'bg-pos-danger-subtle border-pos-danger/40',
                icon:    'text-pos-danger',
                title:   'text-pos-danger',
                body:    'text-pos-text-secondary',
            }
        default:
            return {
                wrapper: 'bg-pos-surface-raised border-pos-border',
                icon:    'text-pos-info',
                title:   'text-pos-text-primary',
                body:    'text-pos-text-secondary',
            }
    }
}
</script>

<template>
    <!-- Fixed stack — top-right, never over cart/checkout -->
    <div
        class="fixed top-4 right-4 z-40 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)] pointer-events-none"
        role="region"
        aria-label="Notifications"
        aria-live="polite"
        aria-atomic="false"
    >
        <TransitionGroup
            tag="div"
            class="flex flex-col gap-2"
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="opacity-0 translate-x-4 scale-95"
            enter-to-class="opacity-100 translate-x-0 scale-100"
            leave-active-class="transition-all duration-200 ease-in absolute w-full"
            leave-from-class="opacity-100 translate-x-0"
            leave-to-class="opacity-0 translate-x-4"
        >
            <div
                v-for="n in notifications"
                :key="n.id"
                :class="[
                    'pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg',
                    colorClasses(n.type).wrapper,
                ]"
                role="alert"
                :aria-label="`${n.type} notification: ${n.title}`"
            >
                <!-- Icon -->
                <component
                    :is="iconFor(n.type)"
                    :class="['w-5 h-5 shrink-0 mt-0.5', colorClasses(n.type).icon]"
                    aria-hidden="true"
                />

                <!-- Content -->
                <div class="flex-1 min-w-0">
                    <p :class="['text-sm font-semibold leading-snug', colorClasses(n.type).title]">
                        {{ n.title }}
                    </p>
                    <p :class="['text-xs leading-relaxed mt-0.5', colorClasses(n.type).body]">
                        {{ n.message }}
                    </p>
                    <p class="text-xs text-pos-text-muted mt-1">
                        {{ new Date(n.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }}
                    </p>
                </div>

                <!-- Dismiss button (always shown; persistent toasts also have this) -->
                <button
                    type="button"
                    :id="`dismiss-toast-${n.id}`"
                    :class="[
                        'shrink-0 flex items-center justify-center w-6 h-6 rounded-md transition-colors duration-150',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pos-primary focus-visible:ring-offset-1',
                        colorClasses(n.type).icon,
                        'hover:bg-black/10',
                    ]"
                    :aria-label="`Dismiss: ${n.title}`"
                    @click="emit('dismiss', n.id)"
                >
                    <X class="w-3.5 h-3.5" aria-hidden="true" />
                </button>
            </div>
        </TransitionGroup>
    </div>
</template>
