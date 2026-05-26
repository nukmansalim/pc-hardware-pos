<?php

namespace App\Projectors;

use App\Events\HardwareAdded;
use App\Events\HardwareMarkedForRMA;
use App\Events\HardwareReserved;
use App\Events\HardwareSold;
use App\Models\InventoryItem;
use Spatie\EventSourcing\EventHandlers\Projectors\Projector;

class InventoryProjector extends Projector
{
    public function onHardwareAdded(HardwareAdded $event): void
    {
        InventoryItem::create([
            'product_id' => $event->productId,
            'serial_number' => $event->serialNumber,
            'status' => 'IN_STOCK',
        ]);
    }

    public function onHardwareReserved(HardwareReserved $event): void
    {
        InventoryItem::where('serial_number', $event->serialNumber)
            ->update(['status' => 'RESERVED']);
    }

    public function onHardwareMarkedForRMA(HardwareMarkedForRMA $event): void
    {
        InventoryItem::where('serial_number', $event->serialNumber)
            ->update(['status' => 'RMA_PENDING']);
    }

    public function onHardwareSold(HardwareSold $event): void
    {
        InventoryItem::where('serial_number', $event->serialNumber)
            ->update(['status' => 'SOLD']);
    }
}
