<?php

namespace App\Aggregates;

use App\Events\CompatibilityOverrideLogged;
use App\Events\HardwareAdded;
use App\Events\HardwareMarkedForRMA;
use App\Events\HardwareReserved;
use App\Events\HardwareSold;
use App\Services\CompatibilityEngine;
use Spatie\EventSourcing\AggregateRoots\AggregateRoot;

class InventoryAggregate extends AggregateRoot
{
    private string $currentStatus = 'IN_STOCK';

    public function addHardware(int $productId, string $serialNumber): self
    {
        $this->recordThat(new HardwareAdded($productId, $serialNumber));

        return $this;
    }

    public function sellHardware(string $serialNumber, int $price): self
    {
        if ($this->currentStatus === 'RMA_PENDING') {
            throw new \Exception("Unit {$serialNumber} tidak bisa dijual karena sedang dalam status RMA!");
        }

        if ($this->currentStatus === 'SOLD') {
            throw new \Exception("Unit {$serialNumber} sudah terjual sebelumnya!");
        }
        $this->recordThat(new HardwareSold($serialNumber, $price));

        return $this;
    }

    public function reserveHardware(string $serialNumber, string $customer)
    {
        $this_recordThat(new HardwareReserved($serialNumber, $customer));

        return $this;
    }

    public function markForRMA(string $serialNumber, string $reason)
    {
        $this->recordThat(new HardwareMarkedForRMA($serialNumber, $reason));

        return $this;
    }

    protected function applyHardwareAdded(HardwareAdded $event): void
    {
        $this->currentStatus = 'IN_STOCK';
    }

    protected function applyHardwareReserved(HardwareReserved $event): void
    {
        $this->currentStatus = 'RESERVED';
    }

    protected function applyHardwareMarkedForRMA(HardwareMarkedForRMA $event): void
    {
        $this->currentStatus = 'RMA_PENDING';
    }

    protected function applyHardwareSold(HardwareSold $event): void
    {
        $this->currentStatus = 'SOLD';
    }

    public function validateCartCompatibility(array $items): self
    {
        $engine = new CompatibilityEngine;
        $report = $engine->check($items);

        if ($report['overall'] === 'fail') {
            $this->recordThat(new CompatibilityOverrideLogged(
                cashierId: auth()->id(),
                issues: $report['checks']
            ));
        }

        return $this;
    }

    public function checkCompatibility(array $items): self
    {
        $engine = new CompatibilityEngine;
        $report = $engine->check($items);

        if ($report['overall'] === 'fail') {
            throw new \Exception('Komponen tidak kompatibel! Cek detail: '.$report['checks'][0]['detail']);
        }

        return $this;
    }

    public function addItemToCart(string $inventoryItemId)
    {
        $item = InventoryItem::find($inventoryItemId);

        // Karantina ketat: Jangan biarkan barang rusak atau sudah terjual masuk keranjang
        if (! $item || $item->status !== 'IN_STOCK') {
            throw new \Exception('Item ini tidak tersedia atau sedang dalam proses RMA.');
        }

        // Jika lolos, catat event-nya ke dalam stored_events
        $this->recordThat(new ItemAddedToCart($inventoryItemId));
    }
}
