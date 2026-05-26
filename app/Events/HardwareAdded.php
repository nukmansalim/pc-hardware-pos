<?php

namespace App\Events;

use Spatie\EventSourcing\StoredEvents\ShouldBeStored;

class HardwareAdded extends ShouldBeStored
{
    public function __construct(
        public int $productId,
        public string $serialNumber
    ) {}
}
