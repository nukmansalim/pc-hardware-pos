<script setup lang="ts">
// 1. Vue core imports
import { X, AlertTriangle, ShieldAlert } from 'lucide-vue-next'
import { ref, computed } from 'vue'

// 2. Third-party imports

// 3. Types
import type { CompatibilityCheck } from '@/types/pos'

// 4. Props
const props = defineProps<{
    open: boolean
    checks: CompatibilityCheck[]
}>()

// 5. Emits
const emit = defineEmits<{
    close: []
    override: []
}>()

// 6. Reactive state
const confirmed = ref(false)

// 7. Computed
const failedChecks = computed(() => props.checks.filter((c) => c.status === 'fail'))

// 8. Methods
const handleOverride = () => {
    if (!confirmed.value) {
return
}

    emit('override')
    confirmed.value = false
}

const handleClose = () => {
    confirmed.value = false
    emit('close')
}

const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
handleClose()
}
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
                aria-labelledby="override-modal-title"
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
                        class="w-full max-w-md rounded-2xl bg-pos-surface-raised border border-pos-danger/40 shadow-xl overflow-hidden"
                    >
                        <!-- Warning header -->
                        <div class="flex items-center gap-3 px-6 py-4 bg-pos-danger-subtle border-b border-pos-danger/30">
                            <ShieldAlert class="w-6 h-6 text-pos-danger shrink-0" aria-hidden="true" />
                            <div>
                                <h2
                                    id="override-modal-title"
                                    class="text-base font-bold text-pos-danger"
                                >
                                    Incompatibility Override
                                </h2>
                                <p class="text-xs text-pos-danger/80 mt-0.5">
                                    This action will be logged under your cashier ID.
                                </p>
                            </div>
                            <button
                                type="button"
                                class="ml-auto flex items-center justify-center w-8 h-8 rounded-lg text-pos-danger/60
                                       hover:text-pos-danger hover:bg-pos-danger/10
                                       transition-colors duration-150
                                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pos-danger focus-visible:ring-offset-1"
                                aria-label="Close override modal"
                                @click="handleClose"
                            >
                                <X class="w-4 h-4" aria-hidden="true" />
                            </button>
                        </div>

                        <!-- Body -->
                        <div class="px-6 py-4 space-y-4">
                            <p class="text-sm text-pos-text-secondary leading-relaxed">
                                The following incompatibilities were detected. Proceeding may result in hardware damage or customer dissatisfaction.
                            </p>

                            <!-- Failed checks list -->
                            <div class="rounded-lg border border-pos-danger/30 overflow-hidden">
                                <div
                                    v-for="check in failedChecks"
                                    :key="check.id"
                                    class="flex items-start gap-3 px-4 py-3 border-b border-pos-danger/20 last:border-b-0 bg-pos-danger-subtle/50"
                                >
                                    <AlertTriangle class="w-4 h-4 text-pos-danger shrink-0 mt-0.5" aria-hidden="true" />
                                    <div>
                                        <p class="text-xs font-semibold text-pos-danger">{{ check.label }}</p>
                                        <p class="text-xs text-pos-text-secondary mt-0.5 font-mono">{{ check.detail }}</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Explicit confirmation checkbox -->
                            <label
                                for="override-confirm"
                                class="flex items-start gap-3 cursor-pointer group"
                            >
                                <input
                                    id="override-confirm"
                                    type="checkbox"
                                    v-model="confirmed"
                                    class="mt-0.5 w-4 h-4 rounded border-pos-danger text-pos-danger
                                           focus-visible:ring-2 focus-visible:ring-pos-danger focus-visible:ring-offset-1
                                           cursor-pointer"
                                />
                                <span class="text-sm text-pos-text-primary leading-snug group-hover:text-pos-text-primary">
                                    I understand the risks and take responsibility for proceeding with this sale.
                                </span>
                            </label>
                        </div>

                        <!-- Footer -->
                        <div class="px-6 py-4 border-t border-pos-border flex justify-end gap-3 bg-pos-surface-sunken">
                            <button
                                type="button"
                                id="btn-override-cancel"
                                class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                                       bg-pos-surface border border-pos-border text-pos-text-secondary text-sm font-medium
                                       transition-colors duration-150 hover:bg-pos-surface-sunken
                                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pos-border-strong focus-visible:ring-offset-2
                                       min-h-[44px]"
                                @click="handleClose"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                id="btn-override-confirm"
                                :disabled="!confirmed"
                                class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                                       bg-pos-danger text-pos-on-danger text-sm font-semibold
                                       transition-colors duration-150 hover:bg-pos-danger/90
                                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pos-danger focus-visible:ring-offset-2
                                       disabled:opacity-50 disabled:cursor-not-allowed
                                       min-h-[44px]"
                                @click="handleOverride"
                            >
                                <ShieldAlert class="w-4 h-4" aria-hidden="true" />
                                Override &amp; Proceed
                            </button>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>
    </Teleport>
</template>
