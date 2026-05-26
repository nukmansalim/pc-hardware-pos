# 🛠️ Backend Development Summary - PC Hardware POS
## Arsitektur: Event Sourcing & Real-time Synchronization

Dokumen ini merangkum seluruh fitur dan infrastruktur backend yang telah berhasil diimplementasikan hingga tahap ini.

---

### 1. Core Architecture: Event Sourcing (Spatie)
Sistem tidak lagi menggunakan penyimpanan status tradisional, melainkan berbasis kejadian (events).
- **Aggregate Root (`InventoryAggregate`)**: Pusat logika bisnis yang mengelola state internal.
- **Event Storage**: Setiap perubahan (stok masuk, terjual, ralat) tercatat secara permanen di tabel `stored_events`.
- **Projectors**: Menangani sinkronisasi otomatis antara event log dengan database relasional (`products`, `inventory_items`).
- **Internal State Validation**: Mekanisme yang mencegah aksi ilegal, seperti menjual barang yang sudah laku atau barang yang sedang dalam proses garansi (RMA).

### 2. Inventory & Stock Management
Manajemen stok tingkat lanjut dengan pelacakan unit spesifik (Serial Number).
- **Serial Number Tracking**: Setiap barang memiliki identitas unik, bukan sekadar jumlah (quantity).
- **Status Lifecycle**: Alur status barang yang jelas: `IN_STOCK` ➔ `RESERVED` ➔ `SOLD` / `RMA_PENDING`.
- **RMA (Return Merchandise Authorization)**: Fitur karantina otomatis untuk barang rusak agar tidak sengaja terjual kembali.
- **Stock Correction**: Kemampuan untuk melakukan ralat data (adjustment) melalui event log tanpa merusak integritas sejarah data.

### 3. Intelligence: Compatibility Engine
Mesin cerdas untuk validasi teknis komponen PC secara otomatis.
- **JSON Metadata Casting**: Implementasi kolom `compatibility_metadata` pada tabel produk untuk menyimpan detail teknis (Socket, TDP, RAM Slot).
- **Socket Matcher**: Validasi otomatis kecocokan antara CPU dan Motherboard (Contoh: Menolak pemasangan CPU Intel LGA1700 di board AMD AM5).
- **Wattage Calculator**: Menghitung estimasi konsumsi daya (TDP) secara real-time berdasarkan isi keranjang belanja.
- **Dynamic Warnings**: Memberikan status `pass`, `fail`, atau `warning` (misal: "No PSU detected" atau "Underpowered PSU") sesuai kontrak data frontend.

### 4. Real-time Connectivity (Laravel Reverb)
Integrasi WebSocket untuk pengalaman pengguna yang reaktif.
- **Broadcasting Interface**: Event-event penting (seperti `HardwareSold`) kini mengimplementasikan `ShouldBroadcast`.
- **WebSocket Server**: Konfigurasi server Reverb untuk pengiriman data instan tanpa refresh halaman.
- **Vite & Echo Integration**: Sinkronisasi sisi klien (Frontend) dengan backend menggunakan `@laravel/echo-vue`.

### 5. Database & Schema
- **PostgreSQL JSONB Support**: Penggunaan tipe data JSON untuk metadata fleksibel.
- **Foreign Key Integrity**: Relasi antara `products` dan `inventory_items` yang terjaga.
- **Casting System**: Otomatisasi konversi data JSON ke Array PHP pada Model Eloquent.

---

**Status Progres: 95% (Backend Ready)**
*Langkah selanjutnya: Implementasi UI Frontend (Point of Sale Interface).*
