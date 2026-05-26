<?php

namespace App\Services;

class CompatibilityEngine
{
    public function check(array $items): array
    {
        $results = [];
        $totalTdp = 0;

        $cpu = $this->findProductByCategory($items, 'CPU');
        $motherboard = $this->findProductByCategory($items, 'Motherboard');
        $psu = $this->findProductByCategory($items, 'PSU');

        // 1. Pengecekan Socket
        if ($cpu && $motherboard) {
            $cpuSocket = $cpu->compatibility_metadata['socket'] ?? 'Unknown';
            $mbSocket = $motherboard->compatibility_metadata['socket'] ?? 'Unknown';

            $results[] = [
                'id' => 'socket_check',
                'label' => 'CPU Socket ↔ Motherboard Socket',
                'status' => ($cpuSocket === $mbSocket) ? 'pass' : 'fail',
                'detail' => "$cpuSocket / $mbSocket",
            ];
        }

        // 2. Kalkulasi Total TDP dari semua item
        foreach ($items as $item) {
            $totalTdp += $item->product->compatibility_metadata['tdp_watts'] ?? 0;
        }

        // 3. Pengecekan Wattage (DIPINDAH KE LUAR AGAR SELALU JALAN)
        $psuCapacity = $psu ? ($psu->compatibility_metadata['capacity_watts'] ?? 0) : 0;

        $results[] = [
            'id' => 'wattage_check',
            'label' => 'Estimated Wattage',
            // Status warning jika melebihi kapasitas ATAU jika tidak ada PSU sama sekali
            'status' => ($psuCapacity > 0 && $totalTdp <= $psuCapacity) ? 'pass' : 'warning',
            'detail' => $psu
                ? "{$totalTdp}W / {$psuCapacity}W PSU"
                : "{$totalTdp}W / No PSU detected",
        ];

        return [
            'overall' => $this->determineOverallStatus($results),
            'checks' => $results,
            'estimated_wattage' => $totalTdp,
            'psu_capacity' => $psu ? $psuCapacity : null, // Kembalikan angka asli jika ada
        ];
    }

    private function findProductByCategory(array $items, string $category)
    {
        foreach ($items as $item) {
            if ($item->product->category === $category) {
                return $item->product;
            }
        }

        return null;
    }

    private function determineOverallStatus(array $results): string
    {
        foreach ($results as $check) {
            if ($check['status'] === 'fail') {
                return 'fail';
            }
        }

        return 'ok';
    }
}
