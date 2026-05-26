<?php

namespace App\Events;

use Spatie\EventSourcing\StoredEvents\ShouldBeStored;

class HardwareReserved extends ShouldBeStored
{
    public function __construct(
        public string $serialNumber,
        public string $customerName,
    ) {}
}
