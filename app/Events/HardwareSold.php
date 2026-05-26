<?php

namespace App\Events;

use Spatie\EventSourcing\StoredEvents\ShouldBeStored;

class HardwareSold extends ShouldBeStored
{
    public function __construct(
        public string $serialNumber,
        public int $priceAtSale, // Mencatat harga saat terjual (penting untuk laporan laba rugi)
    ) {}
}
