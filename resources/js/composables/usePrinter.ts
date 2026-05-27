import { ref } from 'vue'
import {
    buildReceiptBuffer,
    buildRMABuffer,
    type ReceiptTransaction,
    type RMATicket,
} from '@/utils/escpos'

// ---------------------------------------------------------------------------
// usePrinter — WebUSB / Web Serial ESC/POS thermal receipt printer
// Spec: project-overview.md §3.3.2
//
// Supports two connection modes (user's choice):
//   1. WebUSB  — navigator.usb.requestDevice()     (Chrome 61+, Linux/Win/Mac)
//   2. Web Serial — navigator.serial.requestPort() (Chrome 89+)
//
// Usage:
//   const { isConnected, mode, connectUSB, connectSerial, disconnect,
//           printReceipt, printRMATicket } = usePrinter()
// ---------------------------------------------------------------------------

/** WebUSB printer filter — targets common thermal receipt printer class */
const USB_FILTERS: USBDeviceFilter[] = [
    { classCode: 0x07 },     // Printer class
]

/** Common serial options for thermal printers (most ship at 9600 or 115200) */
const SERIAL_OPTIONS: SerialOptions = { baudRate: 9600 }

export type PrinterMode = 'usb' | 'serial' | null

export function usePrinter() {
    const isConnected = ref(false)
    const isConnecting = ref(false)
    const mode = ref<PrinterMode>(null)
    const error = ref<string | null>(null)

    // ── WebUSB state ─────────────────────────────────────────────────────────
    let usbDevice: USBDevice | null = null
    let usbEndpoint: number | null = null

    // ── Web Serial state ──────────────────────────────────────────────────────
    let serialPort: SerialPort | null = null
    let serialWriter: WritableStreamDefaultWriter<Uint8Array> | null = null

    // ── Internal: write bytes ─────────────────────────────────────────────────
    const writeBytes = async (data: Uint8Array): Promise<void> => {
        if (mode.value === 'usb') {
            if (!usbDevice || usbEndpoint === null) throw new Error('USB device not ready')
            await usbDevice.transferOut(usbEndpoint, data)
            return
        }

        if (mode.value === 'serial') {
            if (!serialWriter) throw new Error('Serial writer not ready')
            await serialWriter.write(data)
            return
        }

        throw new Error('No printer connected')
    }

    // ── Connect via WebUSB ────────────────────────────────────────────────────
    const connectUSB = async () => {
        if (!('usb' in navigator)) {
            error.value = 'WebUSB is not supported in this browser.'
            return
        }
        if (isConnected.value) return

        isConnecting.value = true
        error.value = null

        try {
            usbDevice = await navigator.usb.requestDevice({ filters: USB_FILTERS })
            await usbDevice.open()

            // Select configuration 1 (standard for most printers)
            if (usbDevice.configuration === null) {
                await usbDevice.selectConfiguration(1)
            }

            // Find the BULK OUT endpoint on the first interface
            const iface = usbDevice.configuration?.interfaces[0]
            await usbDevice.claimInterface(iface!.interfaceNumber)

            const alternate = iface!.alternates[0]
            const endpoint = alternate.endpoints.find(
                (ep: USBEndpoint) => ep.direction === 'out' && ep.type === 'bulk'
            )
            if (!endpoint) throw new Error('No bulk OUT endpoint found on USB printer')

            usbEndpoint = endpoint.endpointNumber
            mode.value = 'usb'
            isConnected.value = true
        } catch (err) {
            if ((err as Error).name !== 'NotFoundError') {
                error.value = `USB connection failed: ${(err as Error).message}`
                console.error('[usePrinter] USB error:', err)
            }
            usbDevice = null
            usbEndpoint = null
        } finally {
            isConnecting.value = false
        }
    }

    // ── Connect via Web Serial ────────────────────────────────────────────────
    const connectSerial = async (options: SerialOptions = SERIAL_OPTIONS) => {
        if (!('serial' in navigator)) {
            error.value = 'Web Serial API is not supported in this browser.'
            return
        }
        if (isConnected.value) return

        isConnecting.value = true
        error.value = null

        try {
            serialPort = await navigator.serial.requestPort()
            await serialPort.open(options)

            serialWriter = serialPort.writable!.getWriter()
            mode.value = 'serial'
            isConnected.value = true
        } catch (err) {
            if ((err as Error).name !== 'NotFoundError') {
                error.value = `Serial connection failed: ${(err as Error).message}`
                console.error('[usePrinter] Serial error:', err)
            }
            serialPort = null
            serialWriter = null
        } finally {
            isConnecting.value = false
        }
    }

    // ── Disconnect ────────────────────────────────────────────────────────────
    const disconnect = async () => {
        try {
            if (mode.value === 'usb' && usbDevice) {
                await usbDevice.close()
                usbDevice = null
                usbEndpoint = null
            }

            if (mode.value === 'serial') {
                if (serialWriter) {
                    await serialWriter.close()
                    serialWriter.releaseLock()
                    serialWriter = null
                }
                if (serialPort) {
                    await serialPort.close()
                    serialPort = null
                }
            }
        } catch (err) {
            console.warn('[usePrinter] Disconnect error:', err)
        } finally {
            mode.value = null
            isConnected.value = false
        }
    }

    // ── printReceipt ──────────────────────────────────────────────────────────
    // Spec §3.3.2: Receipt layout includes store header, transaction ID,
    // itemized serial-number lines with price, subtotal, tax, total,
    // payment method, and footer note.
    const printReceipt = async (transaction: ReceiptTransaction): Promise<void> => {
        if (!isConnected.value) {
            error.value = 'No printer connected. Please connect a printer first.'
            return
        }

        try {
            error.value = null
            const buffer = buildReceiptBuffer(transaction)
            await writeBytes(buffer)
        } catch (err) {
            error.value = `Print failed: ${(err as Error).message}`
            console.error('[usePrinter] printReceipt error:', err)
            throw err
        }
    }

    // ── printRMATicket ────────────────────────────────────────────────────────
    // Spec §3.3.2: RMA ticket includes RMA reference, product name + serial,
    // reason, date, and cashier ID.
    const printRMATicket = async (rma: RMATicket): Promise<void> => {
        if (!isConnected.value) {
            error.value = 'No printer connected. Please connect a printer first.'
            return
        }

        try {
            error.value = null
            const buffer = buildRMABuffer(rma)
            await writeBytes(buffer)
        } catch (err) {
            error.value = `Print failed: ${(err as Error).message}`
            console.error('[usePrinter] printRMATicket error:', err)
            throw err
        }
    }

    return {
        /** Whether a printer is currently connected */
        isConnected,
        /** Whether a connection attempt is in progress (picker is open) */
        isConnecting,
        /** Active connection mode: 'usb' | 'serial' | null */
        mode,
        /** Last error message, or null if no error */
        error,
        /** Connect to a USB printer via WebUSB (must be called from a user gesture) */
        connectUSB,
        /** Connect to a serial printer via Web Serial (must be called from a user gesture) */
        connectSerial,
        /** Gracefully close the printer connection */
        disconnect,
        /** Print a full sales receipt. Throws on write failure. */
        printReceipt,
        /** Print an RMA return ticket. Throws on write failure. */
        printRMATicket,
    }
}
