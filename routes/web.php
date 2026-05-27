<?php

use App\Http\Controllers\CompatibilityController;
use App\Http\Controllers\InventorySearchController;
use App\Http\Controllers\PosController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'Welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'Dashboard')->name('dashboard');
    Route::get('/pos', [PosController::class, 'index'])->name('pos.index');
    Route::get('/api/inventory/search', [InventorySearchController::class, 'search'])->name('api.inventory.search');
    Route::post('/api/compatibility/check', [CompatibilityController::class, 'check'])
        ->name('api.compatibility.check');
});

require __DIR__.'/settings.php';
