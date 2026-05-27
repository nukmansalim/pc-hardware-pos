// =============================================================================
// POS — Shared TypeScript Interfaces
// Source of truth for all POS-related data shapes (Inertia prop contracts).
// =============================================================================

// ---------------------------------------------------------------------------
// Section 3.1 — Serialized Cart
// ---------------------------------------------------------------------------

export interface CartLineItem {
    id: string
    product_name: string
    sku: string
    serial_number: string
    unit_price: number
    status: 'IN_STOCK' | 'RESERVED' | 'RMA_PENDING' | 'SOLD'
    specs: Record<string, string | number> // e.g. { socket: 'AM5', tdp_watts: 125 }
}

/** Spec §3.1 Search Logic — result shape for the serial-number selection dropdown */
export interface ProductSearchResult {
    product_name: string
    sku: string
    unit_price: number
    specs: Record<string, string | number>
    /** Only IN_STOCK serials not already in the cart */
    available_serials: Array<{ id: string; serial_number: string }>
}

// ---------------------------------------------------------------------------
// Section 3.2 — Compatibility Report
// ---------------------------------------------------------------------------

export interface CompatibilityCheck {
    id: string
    label: string   // "CPU Socket ↔ Motherboard Socket"
    status: 'pass' | 'fail' | 'warning'
    detail: string  // "AM5 / AM5" or "DDR4 detected, DDR5 expected"
}

export interface CompatibilityReport {
    overall: 'ok' | 'warn' | 'fail'
    checks: CompatibilityCheck[]
    estimated_wattage: number
    psu_capacity: number | null
}

// ---------------------------------------------------------------------------
// Section 3.4 — Real-Time Notifications
// ---------------------------------------------------------------------------

export interface PosNotification {
    id: string
    type: 'info' | 'success' | 'warning' | 'error'
    title: string
    message: string
    timestamp: string       // ISO 8601
    persistent?: boolean    // if true, stays until dismissed
}
