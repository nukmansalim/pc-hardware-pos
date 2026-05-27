import axios from 'axios'
import { ref, computed, watch } from 'vue'
import type { CompatibilityCheck, CompatibilityReport, CartLineItem } from '@/types/pos'

// ---------------------------------------------------------------------------
// useCompatibility — reactive compatibility checks via debounced HTTP POST
// Architecture: Debounced POST to /api/compatibility/check (300ms)
// Spec: project-overview.md §3.2 | Urgent.md §2 (Best-Practice Refactor)
//
// Design decisions:
//   - Primary validation: POST /api/compatibility/check (single source of truth)
//   - WebSocket Echo listener for CompatibilityResult has been REMOVED per Urgent.md §3
//   - Client-side wattage sum is retained ONLY for instant progress-bar feedback
//     while the network round-trip is in-flight (does not override server result)
//   - Debounce of 300ms prevents server spam during rapid barcode scanning
// ---------------------------------------------------------------------------

/** Minimal debounce utility — avoids importing all of lodash */
function debounce<T extends (...args: Parameters<T>) => void>(fn: T, delay: number): T {
    let timer: ReturnType<typeof setTimeout> | null = null

    return ((...args: Parameters<T>) => {
        if (timer !== null) {
clearTimeout(timer)
}

        timer = setTimeout(() => {
            timer = null
            fn(...args)
        }, delay)
    }) as T
}

export function useCompatibility(cartItems: () => CartLineItem[]) {
    // ── Reactive state ──────────────────────────────────────────────────────
    const report = ref<CompatibilityReport | null>(null)
    const isLoading = ref(false)
    const hasNetworkError = ref(false)

    // ── Client-side wattage (instant visual feedback only) ──────────────────
    // NOTE: This is a first-pass visual aid displayed while the POST is in-flight.
    // The authoritative check is always the server response.
    const clientWattageCheck = computed<CompatibilityCheck>(() => {
        const items = cartItems()
        const totalTdp = items.reduce((sum, item) => {
            const tdp = typeof item.specs?.tdp_watts === 'number' ? item.specs.tdp_watts : 0

            return sum + tdp
        }, 0)

        const psuItem = items.find((i) => {
            const cap = i.specs?.capacity_watts

            return typeof cap === 'number' && cap > 0
        })
        const psuCapacity = psuItem ? (psuItem.specs.capacity_watts as number) : 0

        let status: 'pass' | 'fail' | 'warning'
        let detail: string

        if (totalTdp === 0) {
            status = 'pass'
            detail = 'No power draw detected'
        } else if (!psuItem) {
            status = 'warning'
            detail = `${totalTdp}W total — No PSU detected`
        } else if (totalTdp > psuCapacity) {
            status = 'warning'
            detail = `${totalTdp}W / ${psuCapacity}W PSU — OVER CAPACITY`
        } else {
            status = 'pass'
            detail = `${totalTdp}W / ${psuCapacity}W PSU`
        }

        return {
            id: 'client_wattage',
            label: 'Estimated Wattage',
            status,
            detail,
        }
    })

    // ── Instant visual report (shown during in-flight request) ───────────────
    const instantReport = computed<CompatibilityReport>(() => {
        const items = cartItems()
        const watt = clientWattageCheck.value
        const totalTdp = items.reduce((s, i) =>
            s + (typeof i.specs?.tdp_watts === 'number' ? i.specs.tdp_watts : 0), 0)
        const psuItem = items.find((i) => typeof i.specs?.capacity_watts === 'number' && (i.specs.capacity_watts as number) > 0)

        return {
            overall: watt.status === 'pass' ? 'ok' : 'warn',
            checks: [watt],
            estimated_wattage: totalTdp,
            psu_capacity: psuItem ? (psuItem.specs.capacity_watts as number) : null,
        }
    })

    // ── Effective report exposed to UI ───────────────────────────────────────
    // While loading: show instantReport (client wattage only, visually snappy).
    // Once server responds: show full server report with client wattage merged.
    const effectiveReport = computed<CompatibilityReport | null>(() => {
        const items = cartItems()

        if (items.length === 0) {
return null
}

        if (isLoading.value || report.value === null) {
            // In-flight or not yet fetched — use instant client-only report
            return instantReport.value
        }

        // Merge: replace any server-provided wattage check with our live client one
        const serverChecks = report.value.checks.filter((c) => c.id !== 'client_wattage')
        const allChecks = [...serverChecks, clientWattageCheck.value]
        const overall = allChecks.some((c) => c.status === 'fail')
            ? 'fail'
            : allChecks.some((c) => c.status === 'warning')
                ? 'warn'
                : 'ok'

        return {
            ...report.value,
            checks: allChecks,
            overall,
        }
    })

    // ── Debounced server validation (300ms) ──────────────────────────────────
    // TODO: Requires backend — /api/compatibility/check POST endpoint (out of scope)
    const fetchServerValidation = debounce(async (items: CartLineItem[]) => {
        if (items.length === 0) {
            report.value = null
            isLoading.value = false
            hasNetworkError.value = false

            return
        }

        try {
            const response = await axios.post<CompatibilityReport>('/api/compatibility/check', {
                items: items.map((item) => ({
                    id: item.id,
                    specs: item.specs,
                })),
            })
            report.value = response.data
            hasNetworkError.value = false
        } catch (error) {
            // Network failure — keep the last known server report (if any) and
            // surface the client-side wattage check as a fallback. Do not clear report.
            hasNetworkError.value = true
            console.error('[useCompatibility] Server validation failed:', error)
        } finally {
            isLoading.value = false
        }
    }, 300)

    // ── Watch cart items and trigger debounced validation ───────────────────
    watch(
        () => cartItems(),
        (newItems) => {
            if (newItems.length === 0) {
                report.value = null
                isLoading.value = false
                hasNetworkError.value = false

                return
            }

            isLoading.value = true
            fetchServerValidation(newItems)
        },
        { deep: true },
    )

    // ── Expose ────────────────────────────────────────────────────────────────
    return {
        report: effectiveReport,
        isLoading,
        hasNetworkError,
        /** Manually clear report when cart is fully emptied */
        clearReport: () => {
            report.value = null
            isLoading.value = false
            hasNetworkError.value = false
        },
    }
}
