import { ref, computed } from 'vue'
import { echo } from '@laravel/echo-vue'
import type { CompatibilityCheck, CompatibilityReport, CartLineItem } from '@/types/pos'

// ---------------------------------------------------------------------------
// useCompatibility — reactive compatibility checks + Echo listener
// Spec: project-overview.md §3.2
// ---------------------------------------------------------------------------

export function useCompatibility(cartItems: () => CartLineItem[]) {
    // ── Reactive state ──────────────────────────────────────────────────────
    const report = ref<CompatibilityReport | null>(null)
    const isLoading = ref(false)

    // ── Client-side wattage check (§3.2 — first-pass, no server round-trip) ──
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

    // ── Build effective report (client + optional server data) ───────────────
    const effectiveReport = computed<CompatibilityReport | null>(() => {
        if (cartItems().length === 0) return null

        if (report.value) {
            // Merge server report: replace any existing client_wattage with our live version
            const serverChecks = report.value.checks.filter((c) => c.id !== 'client_wattage')
            const allChecks = [...serverChecks, clientWattageCheck.value]
            const overall = allChecks.some((c) => c.status === 'fail')
                ? 'fail'
                : allChecks.some((c) => c.status === 'warning')
                    ? 'warn'
                    : 'ok'
            return { ...report.value, checks: allChecks, overall }
        }

        // Client-only mode (server report not yet received)
        const watt = clientWattageCheck.value
        return {
            overall: watt.status === 'pass' ? 'ok' : 'warn',
            checks: [watt],
            estimated_wattage: cartItems().reduce((s, i) =>
                s + (typeof i.specs?.tdp_watts === 'number' ? i.specs.tdp_watts : 0), 0),
            psu_capacity: null,
        }
    })

    // ── Echo — listen for server compatibility result ────────────────────────
    // Channel: pos.{cashier_id} → event: CompatibilityResult (private channel)
    let channelName = ''

    const startListening = (cashierId: number | string) => {
        channelName = `pos.${cashierId}`
        echo()
            .private(channelName)
            .listen('CompatibilityResult', (data: CompatibilityReport) => {
                isLoading.value = false
                report.value = data
            })
    }

    const stopCompatibilityListening = (cashierId: number | string) => {
        const ch = `pos.${cashierId}`
        echo().private(ch).stopListening('CompatibilityResult')
    }

    // ── Expose ────────────────────────────────────────────────────────────────
    return {
        report: effectiveReport,
        isLoading,
        /** Signal that cart changed — show loader while server recalculates */
        setLoading: () => { isLoading.value = true },
        /** Clear report when cart is emptied */
        clearReport: () => { report.value = null },
        startListening,
        stopCompatibilityListening,
    }
}
