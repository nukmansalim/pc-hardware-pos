import { ref } from 'vue'

// ---------------------------------------------------------------------------
// useWebSerialScanner — Web Serial API barcode scanner
// Spec: project-overview.md §3.3.1
//
// For scanners connected via RS-232 or USB-CDC serial port (not HID mode).
// Uses the Web Serial API (Chrome 89+). Requires a user gesture to open the
// port picker (call connect() from a button click handler).
//
// Usage:
//   const { isConnected, isSupported, portName, connect, disconnect } =
//     useWebSerialScanner((barcode) => handleScan(barcode))
// ---------------------------------------------------------------------------

const LINE_TERMINATOR = '\n'
/** Minimum valid barcode length */
const MIN_BARCODE_LENGTH = 3

export function useWebSerialScanner(onScan: (barcode: string) => void) {
    const isSupported = ref('serial' in navigator)
    const isConnected = ref(false)
    const isConnecting = ref(false)
    const portName = ref<string | null>(null)
    const error = ref<string | null>(null)

    let port: SerialPort | null = null
    let reader: ReadableStreamDefaultReader<string> | null = null
    let abortController: AbortController | null = null

    // ── Internal: read loop ──────────────────────────────────────────────────
    const startReadLoop = async (serialPort: SerialPort) => {
        if (!serialPort.readable) return

        const textDecoder = new TextDecoderStream()
        const pipeAbort = new AbortController()
        abortController = pipeAbort

        // Pipe the raw byte stream through a text decoder.
        // Cast required: DOM lib types TextDecoderStream.writable as WritableStream<BufferSource>
        // while our SerialPort.readable is ReadableStream<Uint8Array> — runtime-compatible.
        serialPort.readable.pipeTo(textDecoder.writable as unknown as WritableStream<Uint8Array>, { signal: pipeAbort.signal }).catch(() => {
            // Pipe broken — port was closed or disconnected
        })

        reader = textDecoder.readable.getReader()
        let lineBuffer = ''

        try {
            while (true) {
                const { value, done } = await reader.read()
                if (done) break
                if (value === undefined) continue

                lineBuffer += value

                // Process all complete lines in the buffer
                let newlineIndex: number
                while ((newlineIndex = lineBuffer.indexOf(LINE_TERMINATOR)) !== -1) {
                    const line = lineBuffer.slice(0, newlineIndex).trim()
                    lineBuffer = lineBuffer.slice(newlineIndex + 1)

                    if (line.length >= MIN_BARCODE_LENGTH) {
                        onScan(line)
                    }
                }
            }
        } catch (err) {
            if ((err as Error).name !== 'AbortError') {
                error.value = `Read error: ${(err as Error).message}`
                console.error('[useWebSerialScanner] Read loop error:', err)
            }
        } finally {
            reader.releaseLock()
            reader = null
        }
    }

    // ── connect — opens the OS port picker and begins reading ────────────────
    // MUST be called from a user gesture (click/keydown handler).
    const connect = async (options: SerialOptions = { baudRate: 9600 }) => {
        if (!isSupported.value) {
            error.value = 'Web Serial API is not supported in this browser.'
            return
        }
        if (isConnected.value) return

        isConnecting.value = true
        error.value = null

        try {
            // Prompts the user with the OS port picker dialog
            port = await navigator.serial.requestPort()
            await port.open(options)

            // Best-effort port name (not all browsers expose this)
            const info = port.getInfo()
            portName.value = info.usbVendorId
                ? `USB ${info.usbVendorId.toString(16).toUpperCase()}:${info.usbProductId?.toString(16).toUpperCase()}`
                : 'Serial Port'

            isConnected.value = true
            startReadLoop(port)
        } catch (err) {
            if ((err as Error).name !== 'NotFoundError') {
                // NotFoundError = user cancelled the picker, not a real error
                error.value = `Failed to connect: ${(err as Error).message}`
                console.error('[useWebSerialScanner] Connection error:', err)
            }
        } finally {
            isConnecting.value = false
        }
    }

    // ── disconnect — gracefully closes port and cleans up ────────────────────
    const disconnect = async () => {
        if (!port) return

        try {
            // Abort the pipe so the read loop exits cleanly
            abortController?.abort()
            if (reader) {
                await reader.cancel()
                reader = null
            }
            await port.close()
        } catch (err) {
            console.warn('[useWebSerialScanner] Disconnect error:', err)
        } finally {
            port = null
            abortController = null
            isConnected.value = false
            portName.value = null
        }
    }

    return {
        /** Whether Web Serial API is available in this browser */
        isSupported,
        /** Whether a port is currently open and reading */
        isConnected,
        /** Whether the connect() flow is in progress (picker is open) */
        isConnecting,
        /** Display-friendly port identifier */
        portName,
        /** Last error message, if any */
        error,
        /** Open port picker and begin reading (must be called from a user gesture) */
        connect,
        /** Close the port and stop reading */
        disconnect,
    }
}
