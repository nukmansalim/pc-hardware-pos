import { onMounted, onUnmounted, ref } from 'vue'

// ---------------------------------------------------------------------------
// useBarcodeScan — HID USB barcode scanner (keyboard-emulation mode)
// Spec: project-overview.md §3.3.1
//
// USB HID scanners emulate a keyboard — they fire keydown events in rapid
// succession (typically < 5 ms apart). Human typing is naturally > 50 ms
// between keystrokes. This composable distinguishes the two by timestamping
// each keydown and flushing the buffer on Enter or after a 100 ms idle gap.
//
// Usage:
//   const { lastScan, isScanning } = useBarcodeScan((barcode) => {
//     // handle complete barcode
//   })
// ---------------------------------------------------------------------------

/** Inter-keystroke delay threshold (ms) that distinguishes scanner vs human */
const SCANNER_THRESHOLD_MS = 50
/** Idle timeout (ms) after last character before flushing buffer automatically */
const IDLE_FLUSH_MS = 100
/** Minimum barcode length to be considered valid */
const MIN_BARCODE_LENGTH = 3

export function useBarcodeScan(onScan: (barcode: string) => void) {
    const lastScan = ref<string>('')
    const isScanning = ref(false)

    let buffer = ''
    let lastKeyTime = 0
    let idleTimer: ReturnType<typeof setTimeout> | null = null

    const flushBuffer = () => {
        if (idleTimer !== null) {
            clearTimeout(idleTimer)
            idleTimer = null
        }
        const code = buffer.trim()
        buffer = ''
        isScanning.value = false

        if (code.length >= MIN_BARCODE_LENGTH) {
            lastScan.value = code
            onScan(code)
        }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
        const now = Date.now()
        const timeSinceLastKey = now - lastKeyTime
        lastKeyTime = now

        // Ignore modifier-only events
        if (event.key === 'Shift' || event.key === 'Alt' || event.key === 'Control' || event.key === 'Meta') {
            return
        }

        // Enter key — scanner signaling end of barcode
        if (event.key === 'Enter') {
            if (buffer.length > 0) {
                // Prevent Enter from submitting a form / firing other listeners
                // only when we have accumulated scanner input
                event.stopPropagation()
                flushBuffer()
            }
            return
        }

        // If the inter-keystroke gap is human-speed, reset (not a scanner)
        if (buffer.length > 0 && timeSinceLastKey > SCANNER_THRESHOLD_MS) {
            // Human typing interrupted the buffer — discard partial scan
            buffer = ''
            isScanning.value = false
            if (idleTimer !== null) {
                clearTimeout(idleTimer)
                idleTimer = null
            }
        }

        // Accept printable single characters
        if (event.key.length === 1) {
            buffer += event.key
            isScanning.value = true

            // Reset idle flush timer
            if (idleTimer !== null) clearTimeout(idleTimer)
            idleTimer = setTimeout(flushBuffer, IDLE_FLUSH_MS)
        }
    }

    onMounted(() => {
        // Capture phase: runs before any element-level handlers so the scanner
        // can intercept input regardless of which element has focus.
        window.addEventListener('keydown', handleKeyDown, { capture: true })
    })

    onUnmounted(() => {
        window.removeEventListener('keydown', handleKeyDown, { capture: true })
        if (idleTimer !== null) clearTimeout(idleTimer)
    })

    return {
        /** The most recently completed barcode scan */
        lastScan,
        /** True while scanner keystrokes are being buffered */
        isScanning,
    }
}
