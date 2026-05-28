# ERP Backend Server — Setup Guide

## Prerequisites

- Node.js v22+
- PostgreSQL 16+
- npm

## Quick Start

```bash
# 1. Navigate to server directory
cd server

# 2. Install dependencies
npm install

# 3. Create PostgreSQL database
createdb erp_db
# Or: psql -c "CREATE DATABASE erp_db;"

# 4. Generate Prisma client
npx prisma generate

# 5. Push schema to database
npx prisma db push

# 6. Seed initial data
npx tsx prisma/seed.ts

# 7. Start development server
npm run dev
```

## Environment Variables

Copy `.env` to configure:
| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/erp_db` | PostgreSQL connection |
| `JWT_SECRET` | (required) | JWT signing secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | (required) | Refresh token signing secret |
| `PORT` | `4000` | API server port |
| `CORS_ORIGIN` | `http://localhost:3000` | Frontend URL for CORS |

## API Endpoints

### Health
- `GET /api/health` — Server health check

### Authentication
- `POST /api/auth/login` — Login with username/password
- `POST /api/auth/register` — Register new user (admin only)
- `POST /api/auth/refresh` — Refresh access token
- `POST /api/auth/logout` — Logout (invalidate refresh token)
- `GET /api/auth/me` — Get current user
- `PUT /api/auth/password` — Change password
- `POST /api/auth/forgot-password` — Reset password with National ID
- `GET /api/auth/users` — List all users (admin only)

### Inventory
- `GET /api/inventory` — List items (paginated, searchable)
- `GET /api/inventory/low-stock` — Low stock alerts
- `GET /api/inventory/:id` — Get item by ID
- `POST /api/inventory` — Create item
- `PUT /api/inventory/:id` — Update item
- `DELETE /api/inventory/:id` — Soft delete item
- `POST /api/inventory/:id/adjust` — Adjust quantity

## Default Users

| Username | Password | Role |
|---|---|---|
| `admin` | `Admin@123` | admin |
| `manager` | `Admin@123` | manager |
| `rep1` | `Admin@123` | rep |
| `rep2` | `Admin@123` | rep |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | TypeScript build |
| `npm start` | Production start |
| `npx prisma db push` | Push schema changes |
| `npx prisma migrate dev` | Create migration |
| `npx prisma studio` | Database GUI |
| `npx tsx prisma/seed.ts` | Seed database |
