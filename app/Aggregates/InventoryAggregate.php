<?php

namespace App\Aggregates;

use App\Events\HardwareAdded;
use App\Events\HardwareSold;
use Spatie\EventSourcing\AggregateRoots\AggregateRoot;

class InventoryAggregate extends AggregateRoot
{
    public function addHardware(int $productId, string $serialNumber): self
    {
        $this->recordThat(new HardwareAdded($productId, $serialNumber));

        return $this;
    }

    public function sellHardware(string $serialNumber, int $price): self
    {
        $this->recordThat(new HardwareSold($serialNumber, $price));

        return $this;
    }
}
