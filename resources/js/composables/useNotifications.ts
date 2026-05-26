import { ref } from 'vue'
import { echo } from '@laravel/echo-vue'
import type { PosNotification } from '@/types/pos'

// ---------------------------------------------------------------------------
// useNotifications — Echo subscriptions + reactive toast list
// Spec: project-overview.md §3.4
// ---------------------------------------------------------------------------

export function useNotifications() {
    // ── Reactive state ──────────────────────────────────────────────────────
    const notifications = ref<PosNotification[]>([])

    // ── Internal helpers ────────────────────────────────────────────────────
    const AUTO_DISMISS_MS = 6_000

    const push = (notification: PosNotification) => {
        notifications.value.push(notification)

        // Auto-dismiss after 6s unless persistent or error
        if (!notification.persistent && notification.type !== 'error') {
            setTimeout(() => dismiss(notification.id), AUTO_DISMISS_MS)
        }
    }

    const dismiss = (id: string) => {
        notifications.value = notifications.value.filter((n) => n.id !== id)
    }

    const makeId = () => `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

    // ── Echo subscriptions ──────────────────────────────────────────────────

    /**
     * Subscribe to all POS channels for a given cashier.
     * @param cashierId — authenticated user ID from Inertia $page.props.auth.user.id
     */
    const subscribe = (cashierId: number | string) => {
        const posChannel = echo().private(`pos.${cashierId}`)

        // SpecsImported
        posChannel.listen('SpecsImported', (data: { product_name?: string }) => {
            push({
                id: makeId(),
                type: 'success',
                title: 'Specs Imported',
                message: `Specs for ${data.product_name ?? 'product'} imported successfully.`,
                timestamp: new Date().toISOString(),
            })
        })

        // LedgerUpdated
        posChannel.listen('LedgerUpdated', (data: { serial_number?: string; status?: string }) => {
            push({
                id: makeId(),
                type: 'info',
                title: 'Ledger Updated',
                message: `SN-${data.serial_number ?? '?'} marked as ${data.status ?? 'updated'}.`,
                timestamp: new Date().toISOString(),
            })
        })

        // CompatibilityResult — feeds BuildStatus panel via useCompatibility
        // (the actual update happens in useCompatibility; this triggers an info toast)
        posChannel.listen('CompatibilityResult', (data: { overall?: string }) => {
            if (data.overall === 'fail') {
                push({
                    id: makeId(),
                    type: 'error',
                    title: 'Compatibility Fail',
                    message: 'Build incompatibility detected. Check the "Will It Boot?" panel.',
                    timestamp: new Date().toISOString(),
                    persistent: true,
                })
            }
        })

        // StockLevelLow — public inventory channel
        echo()
            .channel('inventory')
            .listen('StockLevelLow', (data: { product_name?: string; remaining?: number }) => {
                push({
                    id: makeId(),
                    type: 'warning',
                    title: 'Low Stock Alert',
                    message: `⚠ ${data.product_name ?? 'Item'}: only ${data.remaining ?? '?'} unit(s) remaining.`,
                    timestamp: new Date().toISOString(),
                    persistent: true,
                })
            })
    }

    /**
     * Unsubscribe from all channels (call on component unmount).
     */
    const unsubscribe = (cashierId: number | string) => {
        echo().private(`pos.${cashierId}`).stopListening('SpecsImported')
        echo().private(`pos.${cashierId}`).stopListening('LedgerUpdated')
        echo().private(`pos.${cashierId}`).stopListening('CompatibilityResult')
        echo().channel('inventory').stopListening('StockLevelLow')
    }

    // ── Manual push (for local events like checkout confirmation) ─────────────
    const notify = (
        type: PosNotification['type'],
        title: string,
        message: string,
        persistent = false,
    ) => {
        push({ id: makeId(), type, title, message, timestamp: new Date().toISOString(), persistent })
    }

    // ── Expose ────────────────────────────────────────────────────────────────
    return {
        notifications,
        subscribe,
        unsubscribe,
        dismiss,
        notify,
    }
}
