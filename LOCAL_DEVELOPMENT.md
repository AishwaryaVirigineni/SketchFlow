# Local Development Guide for SketchFlow

This guide explains how to run the entire SketchFlow application (Frontend + Backend + Database + Redis) on your local machine, completely independent of AWS.

## 1. Prerequisites

Ensure you have the following installed:
- **Node.js** (v18 or higher)
- **Git**
- **Docker Desktop** (Recommended for easy Database/Redis setup)
  - *Alternative*: Install PostgreSQL and Redis manually on your OS.

---

## 2. Infrastructure Setup (Database & Redis)

The easiest way to run the required infrastructure is using Docker.

### Option A: Using Docker (Recommended)
Run these commands in your terminal to start Postgres and Redis in the background:

```bash
# Start PostgreSQL (Database)
docker run --name local-postgres \
  -e POSTGRES_PASSWORD=password \
  -d -p 5432:5432 \
  postgres:16

# Start Redis (Real-time Sync)
docker run --name local-redis \
  -d -p 6379:6379 \
  redis:alpine
```

### Option B: Manual Installation
If you cannot use Docker:
1.  **Postgres**: Install via [Postgres.app](https://postgresapp.com/) (Mac) or installer. Create a user `postgres` with password `password`.
2.  **Redis**: Install via `brew install redis` and start with `brew services start redis`.

---

## 3. Configuration (Environment Variables)

You need to tell the code to look at `localhost` instead of AWS.

### Backend Configuration
Create/Edit `backend/.env`:

```ini
# Connect to Local Docker Postgres
DATABASE_URL="postgresql://postgres:password@localhost:5432/whiteboard?schema=public"

# Connect to Local Docker Redis
REDIS_URL="redis://localhost:6379"

# Allow requests from Local Frontend
FRONTEND_URL="http://localhost:3000"

# Security (Can be anything for local dev)
JWT_SECRET="dev_secret_123"

# Port to run backend on
PORT=4000
```

### Frontend Configuration
Create/Edit `frontend/.env.local`:

```ini
# Point to Local Backend API
NEXT_PUBLIC_API_URL="http://localhost:4000"

# Point to Local Backend WebSocket
NEXT_PUBLIC_WS_URL="ws://localhost:4000/ws"
```

---

## 4. Initialize Database

Before running the app, you need to create the tables in your local Postgres.

Open a terminal in the `backend/` folder:

```bash
cd backend

# Install dependencies
npm install

# Push the schema to the database
npx prisma db push

# (Optional) Open Prisma Studio to view data
# npx prisma studio
```

---

## 5. Run the Application

You will need **Two Terminal Windows**.

### Terminal 1: Backend
```bash
cd backend
npm run dev
```
*Expected Output*: `Backend running on port 4000` / `Connected to Redis`

### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```
*Expected Output*: `Ready in ... ms` on `http://localhost:3000`

---

## 6. Testing

1.  Open Chrome and go to `http://localhost:3000`.
2.  **Login**: Use any fake email/password (e.g., `test@test.com` / `password`).
3.  **Create Board**: Verify it saves to your local database.
4.  **Real-Time**: Open the same board in an Incognito window. Draw in one, see it in the other.

---

## 7. Stopping Everything

When you are done:
1.  **Stop Terminals**: `Ctrl + C` in both windows.
2.  **Stop Docker Containers**:
    ```bash
    docker stop local-postgres local-redis
    docker rm local-postgres local-redis
    ```
