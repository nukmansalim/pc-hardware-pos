// =============================================================================
// escpos.ts — Raw ESC/POS byte command builder utility
// Spec: project-overview.md §3.3.2
//
// Implements all 7 required byte sequences plus common helpers for building
// receipt and RMA ticket documents as Uint8Array buffers ready for WebUSB /
// Web Serial transmission.
// =============================================================================

// ---------------------------------------------------------------------------
// §3.3.2 Required ESC/POS Command Sequences
// ---------------------------------------------------------------------------

/** ESC/POS command bytes (spec §3.3.2) */
export const CMD = {
    /** 0x1B 0x40 — Reset printer to default state */
    INIT:          new Uint8Array([0x1b, 0x40]),
    /** 0x1B 0x61 0x01 — Center-align text */
    ALIGN_CENTER:  new Uint8Array([0x1b, 0x61, 0x01]),
    /** 0x1B 0x61 0x00 — Left-align text */
    ALIGN_LEFT:    new Uint8Array([0x1b, 0x61, 0x00]),
    /** 0x1B 0x45 0x01 — Bold on */
    BOLD_ON:       new Uint8Array([0x1b, 0x45, 0x01]),
    /** 0x1B 0x45 0x00 — Bold off (normal weight) */
    BOLD_OFF:      new Uint8Array([0x1b, 0x45, 0x00]),
    /** 0x1D 0x56 0x41 0x10 — Feed paper and cut */
    FEED_AND_CUT:  new Uint8Array([0x1d, 0x56, 0x41, 0x10]),
    /** 0x0A — Line feed (new line) */
    LINE_FEED:     new Uint8Array([0x0a]),
} as const

// ---------------------------------------------------------------------------
// Builder utilities
// ---------------------------------------------------------------------------

const TEXT_ENCODER = new TextEncoder()

/** Convert a plain string to ESC/POS-compatible bytes (UTF-8 subset / ASCII) */
function encodeText(text: string): Uint8Array {
    return TEXT_ENCODER.encode(text)
}

/** Concatenate multiple Uint8Arrays into a single buffer */
export function concatBytes(...chunks: Uint8Array[]): Uint8Array {
    const totalLength = chunks.reduce((sum, c) => sum + c.length, 0)
    const result = new Uint8Array(totalLength)
    let offset = 0

    for (const chunk of chunks) {
        result.set(chunk, offset)
        offset += chunk.length
    }

    return result
}

/** Append a text line followed by a line feed */
export function line(text: string): Uint8Array {
    return concatBytes(encodeText(text), CMD.LINE_FEED)
}

/** Append a blank line */
export function blankLine(): Uint8Array {
    return CMD.LINE_FEED
}

/** Repeat a character to fill the printer width (default 42 cols) */
export function divider(char = '-', width = 42): Uint8Array {
    return line(char.repeat(width))
}

/**
 * Format two strings left + right justified within `width` columns.
 * Uses ASCII space padding — sufficient for receipt printers.
 */
export function twoColumn(left: string, right: string, width = 42): Uint8Array {
    const paddingLen = Math.max(1, width - left.length - right.length)
    const row = left + ' '.repeat(paddingLen) + right

    return line(row.slice(0, width))
}

/** Center-pad a string within `width` columns */
export function centered(text: string, width = 42): Uint8Array {
    const pad = Math.max(0, Math.floor((width - text.length) / 2))

    return line(' '.repeat(pad) + text)
}

// ---------------------------------------------------------------------------
// Currency formatter
// ---------------------------------------------------------------------------

/** Format a number as IDR (Rupiah) receipt string, e.g. "Rp 15.999.000" */
export function formatIDR(amount: number): string {
    return `Rp ${amount.toLocaleString('id-ID')}`
}

// ---------------------------------------------------------------------------
// Transaction type (expected from Inertia / usePrinter)
// ---------------------------------------------------------------------------

export interface ReceiptLineItem {
    product_name: string
    serial_number: string
    unit_price: number
}

export interface ReceiptTransaction {
    id: string
    cashier_name: string
    items: ReceiptLineItem[]
    subtotal: number
    tax: number
    total: number
    payment_method: string
    paid_at: string // ISO 8601
}

export interface RMATicket {
    rma_reference: string
    product_name: string
    serial_number: string
    reason: string
    reported_at: string // ISO 8601
    cashier_id: string
}

// ---------------------------------------------------------------------------
// Receipt document builder (§3.3.2 — Receipt layout)
// ---------------------------------------------------------------------------

const STORE_NAME    = 'PC HARDWARE STORE'
const STORE_ADDRESS = 'Jl. Pahlawan No. 1, Kota'
const STORE_PHONE   = 'Telp: (021) 555-1234'
const RECEIPT_WIDTH = 42

/**
 * Build a complete sales receipt as a raw ESC/POS byte array.
 * Includes: store header, transaction ID, itemized SN lines with price,
 * subtotal, tax, total, payment method, and a footer note.
 */
export function buildReceiptBuffer(transaction: ReceiptTransaction): Uint8Array {
    const date = new Date(transaction.paid_at)
    const dateStr = date.toLocaleDateString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
    })
    const timeStr = date.toLocaleTimeString('id-ID', {
        hour: '2-digit', minute: '2-digit',
    })

    const chunks: Uint8Array[] = [
        // ── Header ────────────────────────────────────────────────────────────
        CMD.INIT,
        CMD.ALIGN_CENTER,
        CMD.BOLD_ON,
        line(STORE_NAME),
        CMD.BOLD_OFF,
        line(STORE_ADDRESS),
        line(STORE_PHONE),
        divider('=', RECEIPT_WIDTH),

        CMD.ALIGN_LEFT,
        twoColumn('TRX ID:', transaction.id, RECEIPT_WIDTH),
        twoColumn('Kasir :', transaction.cashier_name, RECEIPT_WIDTH),
        twoColumn('Tanggal:', dateStr, RECEIPT_WIDTH),
        twoColumn('Jam    :', timeStr, RECEIPT_WIDTH),
        divider('-', RECEIPT_WIDTH),

        // ── Itemized lines ────────────────────────────────────────────────────
    ]

    for (const item of transaction.items) {
        chunks.push(
            CMD.BOLD_ON,
            line(item.product_name.slice(0, RECEIPT_WIDTH)),
            CMD.BOLD_OFF,
            line(`  SN: ${item.serial_number}`),
            twoColumn('  Harga:', formatIDR(item.unit_price), RECEIPT_WIDTH),
            blankLine(),
        )
    }

    chunks.push(
        // ── Totals ────────────────────────────────────────────────────────────
        divider('-', RECEIPT_WIDTH),
        twoColumn('Subtotal:', formatIDR(transaction.subtotal), RECEIPT_WIDTH),
        twoColumn('Pajak (11%):', formatIDR(transaction.tax), RECEIPT_WIDTH),
        CMD.BOLD_ON,
        twoColumn('TOTAL:', formatIDR(transaction.total), RECEIPT_WIDTH),
        CMD.BOLD_OFF,
        twoColumn('Pembayaran:', transaction.payment_method, RECEIPT_WIDTH),
        divider('=', RECEIPT_WIDTH),

        // ── Footer ────────────────────────────────────────────────────────────
        CMD.ALIGN_CENTER,
        blankLine(),
        line('Terima kasih atas kunjungan Anda!'),
        line('Barang yang sudah dibeli tidak'),
        line('dapat dikembalikan tanpa nota.'),
        blankLine(),
        line(`ID: ${transaction.id}`),
        blankLine(),
        blankLine(),

        // ── Feed & cut ────────────────────────────────────────────────────────
        CMD.FEED_AND_CUT,
    )

    return concatBytes(...chunks)
}

// ---------------------------------------------------------------------------
// RMA Ticket document builder (§3.3.2 — RMA ticket layout)
// ---------------------------------------------------------------------------

/**
 * Build a Return Merchandise Authorization (RMA) ticket as a raw ESC/POS byte array.
 * Includes: RMA reference, product name + serial, reason, date, cashier ID.
 */
export function buildRMABuffer(ticket: RMATicket): Uint8Array {
    const date = new Date(ticket.reported_at)
    const dateStr = date.toLocaleDateString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
    })
    const timeStr = date.toLocaleTimeString('id-ID', {
        hour: '2-digit', minute: '2-digit',
    })

    return concatBytes(
        // ── Header ────────────────────────────────────────────────────────────
        CMD.INIT,
        CMD.ALIGN_CENTER,
        CMD.BOLD_ON,
        line('TIKET RMA'),
        line(STORE_NAME),
        CMD.BOLD_OFF,
        divider('=', RECEIPT_WIDTH),

        // ── RMA Details ───────────────────────────────────────────────────────
        CMD.ALIGN_LEFT,
        CMD.BOLD_ON,
        twoColumn('No. RMA:', ticket.rma_reference, RECEIPT_WIDTH),
        CMD.BOLD_OFF,
        divider('-', RECEIPT_WIDTH),

        line('PRODUK:'),
        CMD.BOLD_ON,
        line(`  ${ticket.product_name.slice(0, RECEIPT_WIDTH - 2)}`),
        CMD.BOLD_OFF,
        line(`  SN: ${ticket.serial_number}`),
        blankLine(),

        line('ALASAN PENGEMBALIAN:'),
        // Wrap reason text at RECEIPT_WIDTH chars
        ...wrapText(ticket.reason, RECEIPT_WIDTH - 2).map((l) => line(`  ${l}`)),
        blankLine(),

        divider('-', RECEIPT_WIDTH),
        twoColumn('Tanggal:', dateStr, RECEIPT_WIDTH),
        twoColumn('Jam    :', timeStr, RECEIPT_WIDTH),
        twoColumn('Kasir  :', ticket.cashier_id, RECEIPT_WIDTH),
        divider('=', RECEIPT_WIDTH),

        // ── Footer ────────────────────────────────────────────────────────────
        CMD.ALIGN_CENTER,
        blankLine(),
        line('Simpan tiket ini untuk klaim garansi.'),
        blankLine(),
        blankLine(),
        CMD.FEED_AND_CUT,
    )
}

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

/** Word-wrap a string at `maxWidth` characters, returning array of lines */
function wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''

    for (const word of words) {
        if ((currentLine + ' ' + word).trim().length <= maxWidth) {
            currentLine = (currentLine + ' ' + word).trim()
        } else {
            if (currentLine) {
lines.push(currentLine)
}

            currentLine = word.slice(0, maxWidth)
        }
    }

    if (currentLine) {
lines.push(currentLine)
}

    return lines
}
