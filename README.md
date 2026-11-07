# CentTrade PRO — Full-Stack Next.js 16 (React 19 + TypeScript)

A unified, full-stack Trading Journal and Performance Analytics platform tailored for **MetaTrader 4/5 & Cent Account Expert Advisors (EAs)**. Both frontend and backend API routes run simultaneously in a single Next.js application, fully optimized for **local execution** and **1-click Vercel deployment**.

---

## ⚡ Architecture Highlights

* **Unified Full-Stack**: Built entirely with Next.js 16 App Router (React 19 + TypeScript). No Python or external backend process required.
* **Broker Investor CRUD (Myfxbook Style)**:
  * Direct connect via **Investor (Read-Only) Password** — zero risk, cannot place trades or withdraw funds.
  * Native presets for **Exness**, **HFM (HF Markets)**, and **Valetax** (plus custom MT5 servers).
  * Real-time balance, equity, and floating drawdown monitoring per broker account.
  * Dynamic account filtering across dashboard KPIs, calendar heatmap, and journal tables.
* **Serverless Route Handlers**:
  * `GET / POST /api/accounts` — CRUD Broker Account management (Exness, HFM, Valetax).
  * `GET / PUT / DELETE /api/accounts/[id]` — Individual account management & disconnection.
  * `POST /api/accounts/[id]/sync` — Investor sync trigger for live balance, equity, and closed deals.
  * `GET /api/analytics` — Dynamic calculations for Net P/L, Win Rate %, Drawdown, Expectancy (filterable by `?account_id=...`).
  * `GET / POST /api/trades` — Trade logging & query filters.
  * `GET / POST /api/sync/mt5` — Dedicated MetaTrader 5 Auto-Sync Gateway (single deals, batch sync, health check).
  * `PUT /api/trades/[id]/review` — Trade Review & Psychology evaluations.
  * `POST /api/import/statement` — Automated parser for MT4/MT5 HTML and CSV reports.
  * `POST /api/seed` — Instant demo data generator.
* **Bilingual Localization (i18n)**: Instant toggle between **Bahasa Indonesia (ID)** and **English (EN)**.
* **Cent & USD Currency Switching**: Seamless toggle between `USC` (Cent accounts) and standard `USD` (`$`).
* **Vercel Serverless Ready**: Works with zero configuration on Vercel with ephemeral `/tmp` storage fallback and pre-seeded demo data on preview.

---

## 🏦 Broker Connection & Investor Sync (Myfxbook Style)

CentTrade PRO implements the proven **Myfxbook read-only connection model**:

1. Click on the **Akun Broker (Myfxbook)** tab or dropdown filter.
2. Click **Hubungkan Akun (Connect Account)**.
3. Select your broker:
   * **Exness** (e.g. `Exness-Cent`, `Exness-Cent2`, `Exness-Cent3`, `Exness-Real10`)
   * **HFM** (e.g. `HFMarkets-Cent Server`, `HFMarkets-Live Server 2`)
   * **Valetax** (e.g. `Valetax-Live`, `Valetax-Cent`)
   * **Other** (custom broker and server name)
4. Enter your **Account Login** and **Investor Password (Read-Only)**.
5. Choose your Account Type (`Cent (USC)` or `Standard (USD)`) and Leverage (1:500 to 1:3000).
6. Click **Hubungkan Akun**. The system securely connects and syncs the account balance, equity, floating P/L, and closed deals history!

---

## 🔄 MetaTrader 5 Auto-Sync Integration

In addition to direct broker investor sync, you can also use native MQL5 streaming:

### 1. Real-time MQL5 Expert Advisor (`mql5/TradeJournalWebhook.mq5`)
* **How it works**: Runs directly inside your MT5 terminal. Whenever an EA or manual order closes, `OnTradeTransaction()` sends an HTTP WebRequest directly to `http://localhost:3000/api/sync/mt5`.
* **Setup**:
  1. Open MT5: **Tools** -> **Options** -> **Expert Advisors**.
  2. Check **Allow WebRequest for listed URL** and add `http://localhost:3000` (or your Vercel URL).
  3. Copy [`TradeJournalWebhook.mq5`](file:///c:/DATA/Expert%20Advisor%20CENT/mql5/TradeJournalWebhook.mq5) to your MT5 folder: `MQL5/Experts`.
  4. Attach it to any chart.

### 2. Node.js Statement Watcher CLI (`scripts/mt5-sync.mjs`)
* **Health Check**:
  ```bash
  node scripts/mt5-sync.mjs
  ```
* **Sync a specific MT5 report**:
  ```bash
  node scripts/mt5-sync.mjs "C:\path\to\ReportHistory.html"
  ```
* **Auto-watch a folder**:
  ```bash
  node scripts/mt5-sync.mjs --watch "C:\MT5\Reports"
  ```

---

## 🚀 How to Run Locally

Double-click [`run.bat`](file:///c:/DATA/Expert%20Advisor%20CENT/run.bat), or execute in terminal:

```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## ☁️ How to Deploy to Vercel & Mitigate MT5 Hosting Limits

MetaTrader 5 is a native Windows C++ application (`terminal64.exe`). Cloud platforms like Vercel and AWS Lambda run on **Linux Serverless Containers** where desktop MT5 cannot run directly.

CentTrade PRO solves this with a **3-Tier Resilient Architecture**:

### 🎯 Solusi 1: Cloud-Native WebRequest Webhook (Rekomendasi Utama — 100% Gratis & 0 Latensi)
* **Kelebihan**: Tidak memerlukan VPS atau server Windows tambahan. Berjalan langsung di tier gratis Vercel.
* **Cara Kerja**: MT5 yang terpasang di laptop, PC, atau VPS broker Anda mengirimkan event transaksi tertutup dan saldo (*balance/equity heartbeat*) langsung via HTTPS ke endpoint Vercel Anda (`https://your-domain.vercel.app/api/sync/mt5`).
* **Langkah Setup**:
  1. Di MT5: Buka menu **Tools -> Options -> Expert Advisors**.
  2. Centang **"Allow WebRequest for listed URL"** dan tambahkan URL domain Vercel Anda.
  3. Salin file [`mql5/TradeJournalWebhook.mq5`](file:///c:/DATA/Expert%20Advisor%20CENT/mql5/TradeJournalWebhook.mq5) ke folder `MQL5/Experts` di MT5 Anda.
  4. Pasang EA ke chart apa saja. Setiap posisi ditutup atau per 60 detik (*heartbeat*), data langsung ter-push ke web Anda secara real-time!

### 💻 Solusi 2: Local Windows Terminal Handshake (Otomatis saat di PC Windows)
* Saat aplikasi dijalankan di komputer Windows lokal (`npm run dev`), sistem secara otomatis menggunakan [`scripts/mt5-bridge.py`](file:///c:/DATA/Expert%20Advisor%20CENT/scripts/mt5-bridge.py) untuk mengontak `terminal64.exe` lokal secara langsung tanpa konfigurasi tambahan.

### 🌐 Solusi 3: Remote Microservice Bridge (Untuk Menarik Akun Investor Langsung dari Cloud)
* Jika Anda ingin website di Vercel tetap dapat menarik (*pull*) riwayat transaksi menggunakan password investor secara on-demand:
  1. Jalankan bridge server ringan di PC atau VPS Windows Anda:
     ```bash
     python scripts/bridge-server.py --port 8080 --key MY_SECRET_KEY
     ```
  2. Buka dashboard Vercel -> Project Settings -> **Environment Variables**:
     * `MT5_BRIDGE_URL`: `https://your-tunnel.ngrok-free.app` (atau IP VPS Anda)
     * `MT5_BRIDGE_KEY`: `MY_SECRET_KEY`
  3. Aplikasi di Vercel akan otomatis mengontak runner Windows tersebut secara aman!

---

## ☁️ How to Deploy to Vercel (1-Click)

### Option 1: Via Vercel CLI
```bash
npm i -g vercel
vercel
```

### Option 2: Via GitHub
1. Initialize git and push this folder to your GitHub repository:
   ```bash
   git add .
   git commit -m "feat: full-stack next.js trading journal"
   git push origin main
   ```
2. Log into [vercel.com](https://vercel.com), click **Add New Project**, and import the repository.
3. Keep default settings (`Framework: Next.js`, `Root Directory: ./`) and click **Deploy**.

---

## 📁 Project Directory

```
Expert Advisor CENT/
├── src/
│   ├── app/
│   │   ├── api/                     # Serverless Backend API Route Handlers
│   │   │   ├── accounts/route.ts    # Broker Accounts CRUD (Exness, HFM, Valetax)
│   │   │   ├── accounts/[id]/       # Account Detail & Delete
│   │   │   ├── accounts/[id]/sync/  # Investor Sync Trigger
│   │   │   ├── analytics/route.ts   # Analytics & Drawdown calculations
│   │   │   ├── sync/mt5/route.ts    # MT5 Auto-Sync Webhook Gateway
│   │   │   ├── trades/route.ts      # GET list / POST record trade
│   │   │   ├── trades/[id]/route.ts # Individual trade operations
│   │   │   ├── trades/[id]/review/  # Trade Review & Psychology updater
│   │   │   ├── import/statement/    # MT4/MT5 statement parser
│   │   │   └── seed/route.ts        # Seed demo data generator
│   │   ├── page.tsx                 # Reactive Frontend Client Dashboard
│   │   ├── layout.tsx               # Root Layout
│   │   └── globals.css              # Dark theme & styling
│   └── lib/
│       ├── db.ts                    # Business logic & TypeScript data layer
│       ├── i18n.ts                  # Bilingual Dictionary (ID & EN)
│       └── types.ts                 # TypeScript Data Models & Broker Presets
│
├── scripts/
│   └── mt5-sync.mjs                 # Lightweight Node.js MT5 watcher & sync CLI
├── mql5/
│   └── TradeJournalWebhook.mq5      # MQL5 real-time trade event webhook
├── data/
│   ├── trades.json                  # Local JSON database storage (trades)
│   └── accounts.json                # Local JSON database storage (broker accounts)
├── run.bat                          # 1-Click Local Launcher
├── next.config.ts                   # Next.js 16 + Tailwind v4 config
└── package.json
```
