<?php

namespace App\Events;

use Spatie\EventSourcing\StoredEvents\ShouldBeStored;

class HardwareMarkedForRMA extends ShouldBeStored
{
    public function __construct(
        public string $serialNumber,
        public string $reason,
    ) {}
}
