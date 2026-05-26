<script setup lang="ts">
// 1. Vue core imports
import { computed } from 'vue'

// 2. Third-party imports
import { CheckCircle2, XCircle, AlertTriangle, Zap, Cpu } from 'lucide-vue-next'

// 3. Types
import type { CompatibilityReport, CompatibilityCheck } from '@/types/pos'

// 4. Props
const props = defineProps<{
    report: CompatibilityReport | null
    isLoading?: boolean
}>()

// 5. Computed
const overallStatus = computed(() => props.report?.overall ?? 'ok')

const overallBanner = computed(() => {
    switch (overallStatus.value) {
        case 'fail':
            return {
                classes: 'bg-pos-danger-subtle border-pos-danger/40 text-pos-danger animate-pulse',
                icon: 'fail',
                label: '⚠ Incompatible Build — Checkout Blocked',
            }
        case 'warn':
            return {
                classes: 'bg-pos-warning-subtle border-pos-warning/40 text-pos-warning',
                icon: 'warn',
                label: '⚡ Warning — Review before checkout',
            }
        default:
            return {
                classes: 'bg-pos-success-subtle border-pos-success/30 text-pos-success',
                icon: 'ok',
                label: '✔ Build Looks Good',
            }
    }
})

const statusIcon = (status: CompatibilityCheck['status']) => {
    switch (status) {
        case 'pass':    return CheckCircle2
        case 'fail':    return XCircle
        case 'warning': return AlertTriangle
    }
}

const statusRowClasses = (status: CompatibilityCheck['status']) => {
    switch (status) {
        case 'pass':    return 'text-pos-success'
        case 'fail':    return 'text-pos-danger'
        case 'warning': return 'text-pos-warning'
    }
}
</script>

<template>
    <div class="flex flex-col h-full bg-pos-surface border border-pos-border rounded-2xl overflow-hidden shadow-sm">
        <!-- Panel header -->
        <div class="flex items-center gap-2 px-4 py-3 bg-pos-surface-panel border-b border-pos-border-panel">
            <Cpu class="w-5 h-5 text-pos-surface-panel-fg" aria-hidden="true" />
            <h2 class="text-sm font-semibold text-pos-surface-panel-fg tracking-wide uppercase">
                Will It Boot?
            </h2>
            <span class="ml-auto text-xs text-pos-border-panel font-mono">F10</span>
        </div>

        <!-- Body -->
        <div class="flex-1 flex flex-col px-3 py-3 gap-3 overflow-y-auto">
            <!-- Empty / waiting state -->
            <div
                v-if="!report && !isLoading"
                class="flex-1 flex flex-col items-center justify-center py-10 text-center"
            >
                <Cpu class="w-10 h-10 text-pos-text-muted mb-2" aria-hidden="true" />
                <p class="text-sm text-pos-text-secondary">Add items to the cart to run compatibility checks.</p>
            </div>

            <!-- Loading skeleton -->
            <div v-else-if="isLoading" class="space-y-2 animate-pulse">
                <div class="h-4 rounded bg-pos-surface-sunken w-3/4" />
                <div class="h-4 rounded bg-pos-surface-sunken w-1/2" />
                <div class="h-4 rounded bg-pos-surface-sunken w-2/3" />
            </div>

            <template v-else-if="report">
                <!-- Overall status banner -->
                <div
                    :class="[
                        'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all duration-300',
                        overallBanner.classes,
                    ]"
                    role="status"
                    :aria-label="overallBanner.label"
                >
                    <XCircle v-if="overallStatus === 'fail'" class="w-4 h-4 shrink-0" aria-hidden="true" />
                    <AlertTriangle v-else-if="overallStatus === 'warn'" class="w-4 h-4 shrink-0" aria-hidden="true" />
                    <CheckCircle2 v-else class="w-4 h-4 shrink-0" aria-hidden="true" />
                    {{ overallBanner.label }}
                </div>

                <!-- Checks list -->
                <div class="rounded-lg border border-pos-border overflow-hidden bg-pos-surface-raised">
                    <div
                        v-for="check in report.checks"
                        :key="check.id"
                        class="flex items-center gap-3 px-4 py-2.5 border-b border-pos-border last:border-b-0 hover:bg-pos-surface-sunken transition-colors duration-100"
                    >
                        <component
                            :is="statusIcon(check.status)"
                            :class="['w-4 h-4 shrink-0', statusRowClasses(check.status)]"
                            aria-hidden="true"
                        />
                        <div class="flex-1 min-w-0">
                            <p class="text-xs font-medium text-pos-text-primary truncate">{{ check.label }}</p>
                            <p class="text-xs font-mono text-pos-text-secondary mt-0.5">{{ check.detail }}</p>
                        </div>
                        <span
                            :class="[
                                'text-xs font-bold uppercase shrink-0',
                                statusRowClasses(check.status),
                            ]"
                        >
                            {{ check.status }}
                        </span>
                    </div>
                </div>

                <!-- Wattage summary -->
                <div class="rounded-lg border border-pos-border bg-pos-surface-sunken px-4 py-3">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1.5">
                            <Zap class="w-4 h-4 text-pos-warning" aria-hidden="true" />
                            <span class="text-xs font-semibold text-pos-text-secondary uppercase tracking-wide">Estimated Draw</span>
                        </div>
                        <span class="text-sm font-bold font-mono text-pos-text-primary">
                            {{ report.estimated_wattage }}W
                            <span v-if="report.psu_capacity" class="text-pos-text-muted font-normal">
                                / {{ report.psu_capacity }}W PSU
                            </span>
                            <span v-else class="text-pos-text-muted font-normal text-xs"> — no PSU</span>
                        </span>
                    </div>
                    <!-- Wattage bar -->
                    <div
                        v-if="report.psu_capacity"
                        class="mt-2 h-1.5 rounded-full bg-pos-surface-panel/20 overflow-hidden"
                        aria-hidden="true"
                    >
                        <div
                            :style="{ width: `${Math.min((report.estimated_wattage / report.psu_capacity) * 100, 100)}%` }"
                            :class="[
                                'h-full rounded-full transition-all duration-500',
                                report.estimated_wattage > report.psu_capacity
                                    ? 'bg-pos-danger'
                                    : report.estimated_wattage > report.psu_capacity * 0.8
                                        ? 'bg-pos-warning'
                                        : 'bg-pos-success',
                            ]"
                        />
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>
