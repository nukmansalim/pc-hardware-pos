<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Models\Product;
use Illuminate\Http\Request;

class InventorySearchController extends Controller
{
    public function search(Request $request)
    {
        $searchQuery = $request->query('q');

        if (empty($searchQuery)) {
            return response()->json([
                'type' => 'empty',
                'data' => [],
            ]);
        }

        // =====================================================================
        // MODE 1: Pengecekan Exact Match untuk Serial Number (SN)
        // =====================================================================
        $exactItem = InventoryItem::with('product')
            ->where('serial_number', $searchQuery)
            ->where('status', 'IN_STOCK')
            ->first();

        if ($exactItem) {
            return response()->json([
                'type' => 'exact_sn',
                'data' => [
                    'id' => $exactItem->id,
                    'product_name' => $exactItem->product->name,
                    'sku' => $exactItem->product->sku,
                    'serial_number' => $exactItem->serial_number,
                    'unit_price' => $exactItem->product->price,
                    'status' => $exactItem->status,
                    'specs' => $exactItem->product->compatibility_metadata ?? [], // Kolom JSONB kamu
                ],
            ]);
        }

        // =====================================================================
        // MODE 2: Discovery Match berdasarkan Nama Produk atau SKU
        // =====================================================================
        $products = Product::where('name', 'LIKE', "%{$searchQuery}%")
            ->orWhere('sku', 'LIKE', "%{$searchQuery}%")
            ->with(['inventoryItems' => function ($query) {
                // Hanya ambil item fisik yang statusnya masih ready di gudang
                $query->where('status', 'IN_STOCK');
            }])
            ->get();

        $groupedResults = [];
        foreach ($products as $product) {
            if ($product->inventoryItems->isNotEmpty()) {
                $groupedResults[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'sku' => $product->sku,
                    // Sediakan daftar SN yang bisa dipilih kasir di UI
                    'available_sns' => $product->inventoryItems->map(function ($item) use ($product) {
                        return [
                            'id' => $item->id,
                            'serial_number' => $item->serial_number,
                            'status' => $item->status,
                            'unit_price' => $product->price,
                            'specs' => $product->compatibility_metadata ?? [],
                        ];
                    }),
                ];
            }
        }

        if (! empty($groupedResults)) {
            return response()->json([
                'type' => 'product_group',
                'data' => $groupedResults,
            ]);
        }

        // Jika tidak ada satu pun yang cocok
        return response()->json([
            'type' => 'not_found',
            'data' => [],
        ]);
    }
}
