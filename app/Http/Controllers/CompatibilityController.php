<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use Illuminate\Http\Request;

class CompatibilityController extends Controller
{
    public function check(Request $request)
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required',
        ]);

        $itemIds = collect($request->input('items'))->pluck('id')->toArray();

        $inventoryItems = InventoryItem::with('product')
            ->whereIn('id', $itemIds)
            ->get();

        $aggregateId = 'compatibility-'.auth()->id();

        $aggregate = InventoryAggregate::retrieve($aggregateId);
        $report = $aggregate->validateCartCompatibility($inventoryItems->all());

        return response()->json($report);
    }
}
