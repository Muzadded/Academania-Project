# Academania

Academic Project & Research Services Platform — production monorepo aligned with the [MVP Implementation Plan](../Docs/MVP_Implementation_Plan_v2.docx).

## Stack

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Frontend | Next.js 14, TypeScript, TailwindCSS, ShadCN UI |
| Backend  | NestJS, Prisma, PostgreSQL, JWT, Socket.IO      |
| Shared   | TypeScript API contracts (`shared/types`)       |
| Infra    | Docker Compose, GitHub Actions, Vercel-ready    |

## Repository structure

```
Academania-Project/
├── frontend/          # Next.js 14 App Router
├── Backend/           # NestJS REST + WebSocket API
├── shared/            # Shared TypeScript types (api.ts)
├── .github/workflows/ # CI pipeline
├── docker-compose.yml
└── .env.example
```

### Frontend (`frontend/src`)

```
app/
├── (public)/          # Landing, services, order, contact, legal
├── (auth)/            # login, register, forgot/reset password
├── (client)/dashboard # Client portal
├── (admin)/admin      # Admin portal
└── api/auth/          # NextAuth route handler
components/
├── ui/                # ShadCN primitives
├── layout/            # Header, footer, sidebars
└── features/          # Domain components (chat, notifications, …)
lib/                   # API client, auth, utils
hooks/                 # useSocket, etc.
config/                # Site metadata
types/                 # NextAuth extensions
```

### Backend (`Backend/src`)

```
modules/
├── auth/              # JWT, register, login, password reset
├── orders/            # Order submission & client tracking
├── meetings/          # Booking & confirmation
├── payments/          # Proof upload & verification
├── chat/              # Messages + Socket.IO gateway
├── notifications/     # In-app notifications
├── contact/           # Public contact form
├── services/          # Service catalog
├── admin/             # Admin orders, clients, analytics
└── storage/           # GCS file uploads
common/                # Guards, decorators, filters
prisma/                # Schema + seed
```

## Quick start

### Prerequisites

- Node.js 20+
- Docker Desktop (for PostgreSQL)

### 1. Environment

```bash
cp .env.example .env
# Edit .env with your secrets
```

### 2. Install dependencies

```bash
npm install
```

### 3. Database

```bash
docker compose up -d postgres
npm run db:migrate
npm run db:seed
```

Seed creates:

- Admin: `admin@academania.com` / `Admin@12345`
- 6 sample services

### 4. Run development

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api/v1

## Team workflow (from MVP plan)

- Each member owns **full-stack features** on feature branches.
- Shared types live in `shared/types/api.ts` — do not duplicate interfaces.
- Never commit `.env` files.
- PRs require one approval; CI runs lint + build + tests.

## API overview

| Method | Endpoint                    | Description              |
| ------ | --------------------------- | ------------------------ |
| POST   | `/auth/register`            | Register client          |
| POST   | `/auth/login`               | Login, receive JWT       |
| POST   | `/contact`                  | Contact inquiry          |
| GET    | `/services`                 | Service list             |
| POST   | `/orders`                   | Submit order (public)    |
| GET    | `/orders`                   | Client orders (auth)     |
| POST   | `/meetings`                 | Book meeting slots       |
| POST   | `/payments/proof`           | Upload payment screenshot|
| GET    | `/messages/:orderId`        | Chat history             |
| GET    | `/admin/orders`             | Admin order management   |

## Deployment targets

- **Frontend:** Vercel
- **Backend:** Google Cloud Run / Railway
- **Database:** Cloud SQL (PostgreSQL)
- **Files:** Google Cloud Storage

## License

Private — Academania team.
