# inve - Laboratory Inventory System 🧪

A modern, fullstack Laboratory Inventory & Reagent Management System built with **Next.js 15 (App Router)**, **TypeScript**, **Zod**, **PostgreSQL**, and **RustFS S3**.

Deployed and orchestrated on **Dokploy** under domain [vector-intertek.web.id](https://vector-intertek.web.id).

---

## 🌟 Key Features

1. **Laboratory Inventory Catalog**:
   - Reagents, chemicals, glassware, culture media, consumables, and lab equipment.
   - CAS registry number tracking, lot/batch numbers, and expiration dates.
   - Hazard classification badges (Flammable, Corrosive, Toxic, Biohazard, Oxidizing).
   - Storage locations (Acid Cabinet, Flammable Storage, Cold Room, Shelf, etc.).
   - Low-stock and expiration threshold warnings with real-time status indicators.

2. **Stock Movements & Audit Trail**:
   - Stock OUT (Usage in experiments, QC sample testing, dilution).
   - Stock IN (Purchase delivery, buffer stock replenishment).
   - Stock ADJUSTMENT (Periodic physical stock audit).
   - Atomic database transactions with row-level locks preventing negative balances.
   - Complete historical audit log showing analyst name, experiment purpose, and stock change.

3. **RustFS S3 Document Storage**:
   - Direct integration with high-performance RustFS S3 object storage.
   - Upload Safety Data Sheets (MSDS), Certificates of Analysis (CoA), and equipment manuals.

4. **Direct PostgreSQL Connection & Adminer**:
   - PostgreSQL 16 Alpine containerized on Dokploy.
   - Integrated Adminer web GUI for direct database inspection and management.

5. **Zod Schema Validation**:
   - Strict runtime validation on all item creation, updates, and stock transaction payloads.

---

## 🛠️ Tech Stack & Infrastructure

- **Framework**: Next.js 15 (App Router, Standalone build) + React 19
- **Validation**: Zod 3
- **Database**: PostgreSQL 16 (Running on Dokploy)
- **Object Storage**: RustFS S3 Object Storage
- **Database GUI**: Adminer (Dokploy)
- **Deployment & PaaS**: Dokploy via Docker Swarm & Traefik Reverse Proxy
- **DNS & CDN**: Cloudflare (`vector-intertek.web.id`)

---

## 🔐 Environment Variables

```env
# Database Connection (Direct to Dokploy PostgreSQL)
DATABASE_URL=postgresql://inve_user:InveLab2026SecurePass@149.41.198.83:5432/inve_db

# RustFS S3 Object Storage
S3_ENDPOINT=http://149.41.198.83:9000
S3_ACCESS_KEY=inve_rustfs_admin
S3_SECRET_KEY=InveRustfs2026SecureKey
S3_BUCKET=inve-storage
S3_REGION=us-east-1

# External Tools & App URLs
ADMINER_URL=http://149.41.198.83:8080
NEXT_PUBLIC_APP_URL=https://vector-intertek.web.id
```

---

## 🚀 Running Locally

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build
pnpm start
```
