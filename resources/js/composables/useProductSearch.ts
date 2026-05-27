// =============================================================================
// useProductSearch — Spec §3.1 Search Logic
// "If the search query matches a general product/SKU, the UI must display a
//  dropdown of available IN_STOCK Serial Numbers for the cashier to select.
//  If it matches an exact Serial Number, add it to the cart directly."
// =============================================================================

import { computed, watch } from 'vue'
import type { Ref } from 'vue'
import type { CartLineItem } from '@/types/pos'

// ---------------------------------------------------------------------------
// Internal catalog types (shape expected from backend when available)
// ---------------------------------------------------------------------------
interface CatalogSerial {
    id: string
    serial_number: string
    status: 'IN_STOCK' | 'RESERVED' | 'RMA_PENDING' | 'SOLD'
}

interface CatalogProduct {
    product_name: string
    sku: string
    unit_price: number
    specs: Record<string, string | number>
    inventory: CatalogSerial[]
}

// ---------------------------------------------------------------------------
// Public result type consumed by CartPanel dropdown
// ---------------------------------------------------------------------------
export interface ProductSearchResult {
    product_name: string
    sku: string
    unit_price: number
    specs: Record<string, string | number>
    /** Only IN_STOCK serials not already in the cart */
    available_serials: Array<{ id: string; serial_number: string }>
}

// ---------------------------------------------------------------------------
// MOCK — remove when Inertia prop / API is available
// ---------------------------------------------------------------------------
const MOCK_CATALOG: CatalogProduct[] = [
    {
        product_name: 'NVIDIA GeForce RTX 4090',
        sku: 'GPU-RTX4090',
        unit_price: 24_999_000,
        specs: { tdp_watts: 450, vram_gb: 24 },
        inventory: [
            { id: 'cat-gpu-1', serial_number: 'SN-GPU-A1B2C3', status: 'IN_STOCK' },
            { id: 'cat-gpu-2', serial_number: 'SN-GPU-D4E5F6', status: 'IN_STOCK' },
            { id: 'cat-gpu-3', serial_number: 'SN-GPU-G7H8I9', status: 'RESERVED' },
        ],
    },
    {
        product_name: 'NVIDIA GeForce RTX 4080 Super',
        sku: 'GPU-RTX4080S',
        unit_price: 14_999_000,
        specs: { tdp_watts: 320, vram_gb: 16 },
        inventory: [
            { id: 'cat-gpu-4', serial_number: 'SN-4080S-AA11', status: 'IN_STOCK' },
            { id: 'cat-gpu-5', serial_number: 'SN-4080S-BB22', status: 'IN_STOCK' },
        ],
    },
    {
        product_name: 'Intel Core i9-14900K',
        sku: 'CPU-I9-14900K',
        unit_price: 8_499_000,
        specs: { socket: 'LGA1700', tdp_watts: 125, cores: 24 },
        inventory: [
            { id: 'cat-cpu-1', serial_number: 'SN-CPU-D4E5F6', status: 'IN_STOCK' },
            { id: 'cat-cpu-2', serial_number: 'SN-CPU-M3N4O5', status: 'IN_STOCK' },
        ],
    },
    {
        product_name: 'Intel Core i7-14700K',
        sku: 'CPU-I7-14700K',
        unit_price: 5_499_000,
        specs: { socket: 'LGA1700', tdp_watts: 125, cores: 20 },
        inventory: [
            { id: 'cat-cpu-3', serial_number: 'SN-I7-AA11BB', status: 'IN_STOCK' },
            { id: 'cat-cpu-4', serial_number: 'SN-I7-CC22DD', status: 'IN_STOCK' },
        ],
    },
    {
        product_name: 'AMD Ryzen 9 7950X',
        sku: 'CPU-R9-7950X',
        unit_price: 9_299_000,
        specs: { socket: 'AM5', tdp_watts: 170, cores: 16 },
        inventory: [
            { id: 'cat-amd-1', serial_number: 'SN-R9-EE33FF', status: 'IN_STOCK' },
            { id: 'cat-amd-2', serial_number: 'SN-R9-GG44HH', status: 'IN_STOCK' },
        ],
    },
    {
        product_name: 'AMD Ryzen 7 7700X',
        sku: 'CPU-R7-7700X',
        unit_price: 4_299_000,
        specs: { socket: 'AM5', tdp_watts: 105, cores: 8 },
        inventory: [
            { id: 'cat-amd-3', serial_number: 'SN-R7-II55JJ', status: 'IN_STOCK' },
            { id: 'cat-amd-4', serial_number: 'SN-R7-KK66LL', status: 'IN_STOCK' },
        ],
    },
    {
        product_name: 'ASUS ROG Maximus Z790',
        sku: 'MB-Z790-ROG',
        unit_price: 6_299_000,
        specs: { socket: 'LGA1700', ram_slots: 4, form_factor: 'ATX' },
        inventory: [
            { id: 'cat-mb-1', serial_number: 'SN-MB-G7H8I9', status: 'IN_STOCK' },
            { id: 'cat-mb-2', serial_number: 'SN-MB-P6Q7R8', status: 'IN_STOCK' },
        ],
    },
    {
        product_name: 'MSI MAG B650 TOMAHAWK',
        sku: 'MB-B650-MAG',
        unit_price: 3_299_000,
        specs: { socket: 'AM5', ram_slots: 4, form_factor: 'ATX' },
        inventory: [
            { id: 'cat-mb-3', serial_number: 'SN-B650-MM77NN', status: 'IN_STOCK' },
            { id: 'cat-mb-4', serial_number: 'SN-B650-OO88PP', status: 'IN_STOCK' },
        ],
    },
    {
        product_name: 'Corsair HX1200 PSU',
        sku: 'PSU-HX1200',
        unit_price: 3_199_000,
        specs: { capacity_watts: 1200, tdp_watts: 0 },
        inventory: [
            { id: 'cat-psu-1', serial_number: 'SN-PSU-J0K1L2', status: 'IN_STOCK' },
            { id: 'cat-psu-2', serial_number: 'SN-PSU-QQ99RR', status: 'IN_STOCK' },
        ],
    },
    {
        product_name: 'G.Skill Trident Z5 32GB DDR5-6000',
        sku: 'RAM-TZ5-32G-6000',
        unit_price: 2_199_000,
        specs: { capacity_gb: 32, speed_mhz: 6000, generation: 'DDR5', tdp_watts: 5 },
        inventory: [
            { id: 'cat-ram-1', serial_number: 'SN-RAM-SS11TT', status: 'IN_STOCK' },
            { id: 'cat-ram-2', serial_number: 'SN-RAM-UU22VV', status: 'IN_STOCK' },
        ],
    },
    {
        product_name: 'Samsung 990 Pro 2TB NVMe',
        sku: 'SSD-990PRO-2T',
        unit_price: 2_799_000,
        specs: { capacity_gb: 2000, interface: 'PCIe 4.0', tdp_watts: 7 },
        inventory: [
            { id: 'cat-ssd-1', serial_number: 'SN-SSD-WW33XX', status: 'IN_STOCK' },
            { id: 'cat-ssd-2', serial_number: 'SN-SSD-YY44ZZ', status: 'IN_STOCK' },
        ],
    },
]

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------
export function useProductSearch(
    searchQuery: Ref<string>,
    cart: Ref<CartLineItem[]>,
    onExactMatch: (item: CartLineItem) => void,
) {
    /** Serial numbers already in the cart — used to exclude duplicates */
    const cartSerials = computed(() => new Set(cart.value.map((i) => i.serial_number)))

    /**
     * Detect an exact serial number match in the catalog.
     * Returns the matching CartLineItem if found and not already in cart.
     */
    const exactMatch = computed<CartLineItem | null>(() => {
        const q = searchQuery.value.trim().toUpperCase()

        if (q.length < 4) {
return null
} // Serials are always longer than 3 chars

        for (const product of MOCK_CATALOG) {
            const serial = product.inventory.find(
                (inv) =>
                    inv.serial_number.toUpperCase() === q &&
                    inv.status === 'IN_STOCK' &&
                    !cartSerials.value.has(inv.serial_number),
            )

            if (serial) {
                return {
                    id: serial.id,
                    product_name: product.product_name,
                    sku: product.sku,
                    serial_number: serial.serial_number,
                    unit_price: product.unit_price,
                    status: 'IN_STOCK',
                    specs: product.specs,
                }
            }
        }

        return null
    })

    /**
     * When an exact serial is detected, auto-add to cart immediately.
     * This handles the barcode scanner use-case where a full SN is emitted.
     */
    watch(exactMatch, (match) => {
        if (match) {
onExactMatch(match)
}
    })

    /**
     * For partial name/SKU queries — returns grouped results for the dropdown.
     * Returns empty if: query is too short, or an exact SN match was already found.
     */
    const searchResults = computed<ProductSearchResult[]>(() => {
        const q = searchQuery.value.trim().toLowerCase()

        if (q.length < 2) {
return []
}

        // If there's an exact SN match, the watcher handles it; suppress dropdown
        if (exactMatch.value) {
return []
}

        return MOCK_CATALOG
            .filter(
                (p) =>
                    p.product_name.toLowerCase().includes(q) ||
                    p.sku.toLowerCase().includes(q),
            )
            .map((p) => ({
                product_name: p.product_name,
                sku: p.sku,
                unit_price: p.unit_price,
                specs: p.specs,
                available_serials: p.inventory
                    .filter(
                        (inv) =>
                            inv.status === 'IN_STOCK' &&
                            !cartSerials.value.has(inv.serial_number),
                    )
                    .map((inv) => ({ id: inv.id, serial_number: inv.serial_number })),
            }))
            .filter((r) => r.available_serials.length > 0)
    })

    return { searchResults }
}
