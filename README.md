# PC Hardware Point-of-Sale (POS) System

A modern Point-of-Sale (POS) system engineered specifically for PC hardware and component retail. This project utilizes an **Event Sourcing** approach for highly accurate inventory tracking and an integrated **Compatibility Engine** to ensure real-time PC build validation.

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Laravel 11 (PHP 8.3+) |
| **Database** | PostgreSQL (with JSONB support) |
| **Event Sourcing** | Spatie Laravel Event Sourcing |
| **Frontend** | Vue 3 (Composition API) + Inertia.js |
| **Styling** | Tailwind CSS (Semantic Token System) |
| **Real-time** | Laravel Reverb (WebSockets) |

## ✨ Key Features

* **Serialized Inventory Tracking**: Every physical unit is tracked by its unique Manufacturer Serial Number rather than simple product quantities.
* **"Will It Boot?" Engine**: Real-time compatibility validation between components (e.g., CPU Socket vs. Motherboard Socket) utilizing JSONB metadata.
* **Immutable Audit Trail**: All transactions and stock adjustments are recorded in an append-only `stored_events` ledger (audit-safe).
* **Keyboard-First Interface**: Optimized for cashier speed with comprehensive keyboard shortcut support and global barcode scanning.
* **Hardware Integration**: Direct browser-to-hardware communication with ESC/POS thermal printers and barcode scanners via WebUSB/Web Serial APIs.

## 📂 Project Structure

* `PROMPT CONTRACT/`: Contains architectural guidelines, UI standards, and progress trackers for AI Agent collaboration.
* `app/Aggregates/`: Core business logic handling domain commands via Aggregate Roots.
* `database/migrations/`: Database schema heavily optimized for PostgreSQL capabilities.

## 🚀 Installation (Local Development)

1. **Clone & Install Dependencies**
   ```bash
   git clone [https://github.com/username/pc-hardware-pos.git](https://github.com/username/pc-hardware-pos.git)
   cd pc-hardware-pos
   composer install
   pnpm install

```

2. **Environment Setup**
Copy `.env.example` to `.env` and configure your PostgreSQL database credentials. Ensure the `php-pgsql` extension is enabled in your system.
3. **Database Initialization**
```bash
php artisan migrate

```


4. **Run Development Server**
```bash
php artisan serve
pnpm dev

```

