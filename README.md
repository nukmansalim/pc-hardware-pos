```markdown
# PC Hardware Point-of-Sale (POS) System

A modern Point-of-Sale (POS) system engineered specifically for PC hardware and component retail. This project utilizes an **Event Sourcing** approach for highly accurate inventory tracking and an integrated **Compatibility Engine** to ensure real-time PC build validation.

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Laravel 11 (PHP 8.3+) |
| **Database** | PostgreSQL (with JSONB support) |
| **Event Sourcing** | Spatie Laravel Event Sourcing |
| **Frontend** | Vue 3 (Composition API) + Inertia.js |
| **Styling** | Tailwind CSS (Semantic Token System) |
| **Real-time** | Laravel Reverb (WebSockets) |

## ✨ Key Features

- **Serialized Inventory Tracking**: Every physical unit is tracked by its unique Manufacturer Serial Number rather than simple product quantities.
- **"Will It Boot?" Engine**: Real-time compatibility validation between components (e.g., CPU Socket vs. Motherboard Socket) utilizing JSONB metadata.
- **Immutable Audit Trail**: All transactions and stock adjustments are recorded in an append-only `stored_events` ledger (audit-safe).
- **Keyboard-First Interface**: Optimized for cashier speed with comprehensive keyboard shortcut support and global barcode scanning.
- **Hardware Integration**: Direct browser-to-hardware communication with ESC/POS thermal printers and barcode scanners via WebUSB/Web Serial APIs.

## 📂 Project Structure

- `PROMPT CONTRACT/`: Contains architectural guidelines, UI standards, and progress trackers for AI Agent collaboration.
- `app/Aggregates/`: Core business logic handling domain commands via Aggregate Roots.
- `database/migrations/`: Database schema heavily optimized for PostgreSQL capabilities.

## Installation (Local Development)

1. **Clone the Repository**

```bash
git clone https://github.com/nukmansalim/pc-hardware-pos.git
cd pc-hardware-pos
```

2. **Install Dependencies**

```bash
composer install
npm install
```

3. **Environment Setup**

```bash
cp .env.example .env
php artisan key:generate
```

Open the `.env` file and configure it:
- Change `DB_CONNECTION=pgsql` (PostgreSQL is recommended)
- Fill in your PostgreSQL database credentials
- Add the **Reverb** configuration (see example below)

4. **Database Migration**

```bash
php artisan migrate
```

5. **Run Development Servers**

```bash
php artisan serve
npm run dev
```

> **Reverb Configuration (Real-time Features)**  
> Add the following lines to your `.env` file:
> ```env
> REVERB_APP_ID=your_app_id
> REVERB_APP_KEY=your_app_key
> REVERB_APP_SECRET=your_app_secret
> REVERB_HOST=localhost
> REVERB_PORT=8080
> REVERB_SCHEME=http
>
> VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
> VITE_REVERB_HOST="${REVERB_HOST}"
> VITE_REVERB_PORT="${REVERB_PORT}"
> VITE_REVERB_SCHEME="${REVERB_SCHEME}"
> ```
> Then run the Reverb server in a separate terminal:
> ```bash
> php artisan reverb:start
> ```

6. **Build for Production**

```bash
npm run build
```

## About

This project was built with a focus on performance, auditability, and real-world retail hardware store needs. It combines modern Laravel practices with a powerful Vue 3 + Inertia frontend.
```