# GreenCharge ⚡

> **Charge smarter. Use cleaner energy. Stress the grid less.**

GreenCharge is a renewable-aware EV charging platform built for **HackOut '26** by **Team SyntaX Error**. It optimises *when* and *how* EVs charge by combining real-time renewable availability, carbon intensity, electricity price, and grid load — then scheduling charging to maximise green energy use while guaranteeing every vehicle reaches its target SOC before departure.

---

## The Problem

EVs typically charge immediately at full power the moment they plug in — without any awareness of grid conditions or renewable availability. This causes:

- **Missed renewable windows** — charging peaks when solar/wind are lowest
- **Grid stress** — uncoordinated demand spikes during already loaded periods
- **Higher cost** — charging at peak-price hours unnecessarily

EV charging is *flexible demand*. The opportunity is to shift it intelligently.

---

## The Solution

GreenCharge takes EV requirements (current SOC, target SOC, battery capacity, departure time) alongside live energy signals and finds the optimal charging schedule — respecting all hard constraints while minimising cost, carbon, and grid load.

```
Renewable Availability  ──┐
Carbon Intensity         ──┤
Electricity Price        ──┼──▶  GreenCharge  ──▶  Optimal Schedule
Grid Load Conditions     ──┤     Optimizer         + Green Score
EV Requirements (SOC)   ──┤                        + Cost Estimate
Station Capacity         ──┘                        + CO₂ Estimate
```

**Outputs per schedule:**
- ✓ On-time charging — target SOC met before departure (hard constraint)
- ↓ Estimated cost (using live per-kWh price from energy signals)
- ↓ Estimated emissions (kg CO₂)
- ↑ Renewable alignment %
- Green Score (0–100)

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | React + Vite | 18 / 5 |
| Backend API | Spring Boot + Hibernate | 2.7.18 / Java 11 |
| Database | PostgreSQL | 15 |
| Optimization Engine | Python + FastAPI | 3.11+ / 0.141 |
| Auth | Spring Security + JWT (jjwt) | 0.11.5 |
| Charts | Recharts | 2.x |
| Maps | Leaflet + OpenStreetMap | 1.9 |
| HTTP Client | Axios | 1.7 |
| Reverse Proxy | Nginx | — |
| Deployment | Docker + Docker Compose | — |

---

## Project Structure

```
ev-renewable-platform/
│
├── frontend/                   React + Vite UI
│   ├── src/
│   │   ├── pages/
│   │   │   ├── auth/           Login, Register  (real JWT auth)
│   │   │   ├── dashboard/      Live KPI cards from /api/v1/dashboard/kpi
│   │   │   ├── stations/       Leaflet map + live station list from API
│   │   │   ├── charging/       Vehicle/station selector → async optimisation + polling
│   │   │   ├── fleet/          Fleet selector → fleet optimisation + polling
│   │   │   ├── analytics/      Area, pie, bar, radial charts
│   │   │   └── settings/       Profile, notifications, theme
│   │   ├── context/            AuthContext (real login/register/logout), ThemeContext
│   │   ├── hooks/              useApi (data fetching with loading/error state)
│   │   ├── layouts/            AuthLayout, DashboardLayout
│   │   └── services/           Axios client with JWT attach + token-refresh interceptor
│   └── .env.example
│
├── backend/                    Spring Boot REST API
│   ├── src/main/java/com/evrenewable/
│   │   ├── model/              13 JPA entities (UUID PKs, JPA auditing)
│   │   ├── repository/         11 Spring Data JPA repositories
│   │   ├── service/            AuthService, ChargingSessionService, OptimisationService,
│   │   │                       FleetOptimisationService, StationService, VehicleService,
│   │   │                       DashboardService, AuditLogService, AsyncOptimisationRunner
│   │   ├── controller/         AuthController, StationController, VehicleController,
│   │   │                       ChargingSessionController, OptimisationController,
│   │   │                       FleetOptimisationController, DashboardController
│   │   ├── security/           JwtAuthFilter, JwtAuthEntryPoint, UserDetailsServiceImpl
│   │   └── config/             SecurityConfig (JWT + CORS), AppConfig (RestTemplate with
│   │                           timeouts), AsyncConfig (bounded thread pool), CorsConfig
│   └── .env.example
│
├── optimization/               Python FastAPI optimization engine
│   ├── app/
│   │   ├── main.py             FastAPI app — CORS, lifespan, route registration
│   │   ├── config.py           Pydantic settings from .env
│   │   ├── db.py               Async SQLAlchemy engine + get_db dependency
│   │   ├── algorithms/
│   │   │   └── greedy_optimizer.py   Renewable-first greedy scheduler
│   │   ├── api/routes/
│   │   │   ├── optimize.py     POST /optimize  (called by Spring AsyncOptimisationRunner)
│   │   │   └── health.py       GET /health, GET /health/db
│   │   ├── models/
│   │   │   └── energy_signal.py      SQLAlchemy ORM (read-only mirror of energy_signals)
│   │   ├── schemas/
│   │   │   └── optimize.py     OptimizeRequest / OptimizeResponse / ScheduleSlot
│   │   └── services/
│   │       └── optimize_service.py   Fetches signals from DB, runs optimizer
│   ├── tests/unit/             10 passing unit tests (no DB required)
│   ├── requirements.txt
│   └── .env.example
│
├── database/
│   ├── init/
│   │   ├── 000_master.sql      Single-command: schema + indexes + seed
│   │   ├── 001_schema.sql      All 13 tables, enums, views, triggers
│   │   └── 002_indexes.sql     30 targeted indexes + GIN on audit JSONB
│   └── seeds/
│       └── 001_seed_data.sql   Dev seed: 4 users, 5 stations, 14 chargers, 5 vehicles
│
├── scripts/
│   └── db-setup.sh             One-command DB setup from .env
│
├── nginx/
│   └── nginx.conf              Reverse proxy: /api → :8080, /optimization → :8001
│
├── docs/
├── setup.md                    Full step-by-step setup guide
├── docker-compose.yml
└── .env.example
```

---

## Database Schema

13 tables covering the full platform domain:

| Table | Purpose |
|---|---|
| `users` | Platform users — ADMIN / OPERATOR / DRIVER |
| `refresh_tokens` | JWT refresh token store (SHA-256 hashed — raw token never persists) |
| `stations` | Physical charging locations with GPS |
| `chargers` | Charger units per station (AC slow/fast, DC fast/ultra) |
| `fleets` | Vehicle groups for fleet optimisation |
| `vehicles` | EVs with battery capacity, SOC, charger limits |
| `energy_signals` | Hourly renewable %, carbon intensity, price, grid load |
| `optimisation_requests` | Single-EV scheduling requests + results (Green Score, cost, CO₂) |
| `optimisation_schedule_slots` | Hourly power slots per optimisation |
| `fleet_optimisation_runs` | Multi-vehicle fleet scheduling runs |
| `fleet_vehicle_schedules` | Per-vehicle hourly slots from fleet runs |
| `charging_sessions` | Actual session records with energy, cost, CO₂ metrics |
| `audit_log` | Immutable audit trail (JSONB detail, IP, no FK to users) |

**Views:** `v_station_summary`, `v_dashboard_kpi`
**Triggers:** Auto `updated_at` on all mutable tables

---

## Quick Start

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | 18+ |
| Java JDK | 11 |
| Maven | 3.9+ |
| Python | 3.11+ |
| PostgreSQL | 15 |
| Docker Desktop | 24+ (optional) |

### 1 — Clone

```bash
git clone <repo-url> ev-renewable-platform
cd ev-renewable-platform
```

### 2 — Environment variables

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp optimization/.env.example optimization/.env
```

Edit each `.env` and replace the `change_me_*` placeholders. Generate the JWT secret:

```bash
openssl rand -hex 32
```

### 3 — Database

```bash
# Creates user, DB, schema, indexes, and seed data in one shot
PGPASSWORD="your_postgres_password" ./scripts/db-setup.sh

# Or manually:
psql -U ev_user -d ev_renewable_db -f database/init/000_master.sql
```

### 4 — Backend

```bash
cd backend
mvn clean install -DskipTests
mvn spring-boot:run -Dspring-boot.run.profiles=dev
# API at    http://localhost:8080
# Swagger at http://localhost:8080/swagger-ui.html
```

### 5 — Optimization service

```bash
cd optimization
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
# Docs at http://localhost:8001/docs
# Health at http://localhost:8001/health
```

### 6 — Frontend

```bash
cd frontend
npm install
npm run dev
# App at http://localhost:5173
```

### Or — run everything with Docker

```bash
docker compose up --build
# Frontend → http://localhost
# Backend  → http://localhost:8080
# FastAPI  → http://localhost:8001
```

---

## API Overview

### Auth — `/api/v1/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | Public | Register new user |
| POST | `/login` | Public | Login → `accessToken` + `refreshToken` |
| POST | `/refresh` | Public | Exchange refresh token for new tokens |
| POST | `/logout` | JWT | Revoke all refresh tokens |
| GET | `/me` | JWT | Get current user profile |

### Stations — `/api/v1/stations`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | JWT | List all active stations with chargers |
| GET | `/{id}` | JWT | Get station by ID |
| POST | `/` | ADMIN/OPERATOR | Create station |
| PATCH | `/{id}/status` | ADMIN/OPERATOR | Update station status |
| GET | `/{id}/chargers` | JWT | List chargers for a station |
| POST | `/{id}/chargers` | ADMIN/OPERATOR | Add charger to station |
| PATCH | `/chargers/{id}/status` | ADMIN/OPERATOR | Update charger status |

### Vehicles — `/api/v1/vehicles`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | JWT | List all vehicles |
| GET | `/{id}` | JWT | Get vehicle by ID |
| GET | `/fleet/{fleetId}` | JWT | List vehicles in a fleet |
| POST | `/` | JWT | Register new vehicle |
| PATCH | `/{id}/soc` | JWT | Update vehicle state-of-charge |

### Charging Sessions — `/api/v1/sessions`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/active` | JWT | Get all active sessions |
| GET | `/{id}` | JWT | Get session by ID |
| GET | `/vehicle/{vehicleId}` | JWT | Sessions for a vehicle |
| GET | `/station/{stationId}` | JWT | Sessions for a station |
| POST | `/start` | JWT | Start a charging session |
| POST | `/{id}/stop` | JWT | Stop session + record metrics (JSON body) |

### Optimisation — `/api/v1/optimise`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | JWT | Submit optimisation → returns immediately with `status: PENDING` |
| GET | `/{id}` | JWT | Poll result — status: PENDING → RUNNING → COMPLETED/FAILED |
| GET | `/vehicle/{vehicleId}` | JWT | Optimisation history for a vehicle |

### Fleet Optimisation — `/api/v1/fleet-optimise`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | JWT | Submit fleet run (fleetId + stationCapKw + departureTime) |
| GET | `/{id}` | JWT | Poll result |
| GET | `/fleet/{fleetId}` | JWT | Fleet optimisation history |

### Dashboard — `/api/v1/dashboard`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/kpi` | JWT | Live KPIs: active stations, sessions, energy today, solar share %, CO₂ saved |

### Optimization Service — `http://localhost:8001`

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness probe |
| GET | `/health/db` | DB connectivity check |
| POST | `/optimize` | Run greedy renewable-first optimizer (called internally by Spring) |
| GET | `/docs` | Interactive Swagger UI |

---

## Optimization Workflow

```
01  EV Request       current SOC · target SOC · battery kWh · departure · charger limit
         ↓
02  Spring submits   POST /api/v1/optimise → saves PENDING record, fires async task
         ↓
03  AsyncRunner      calls FastAPI POST /optimize  (5 s connect / 15 s read timeout)
         ↓  (if FastAPI down or times out → falls back to built-in Java greedy solver)
04  FastAPI          reads energy_signals from DB for the departure window
                     sorts slots by renewable_pct desc, allocates power greedily
                     returns green_score, cost (using per-signal price), CO₂, slots[]
         ↓
05  Spring saves     COMPLETED record with all result fields
         ↓
06  Frontend polls   GET /api/v1/optimise/{id} every 1.5 s until COMPLETED or FAILED
         ↓
07  UI renders       Green Score ring, best window, cost, CO₂, per-hour bar chart
```

> **Driver deadline = hard constraint** — the schedule always reaches the target SOC before departure.

---

## Key Design Decisions

**Async optimisation** — `POST /optimise` returns immediately with `status: PENDING`. The heavy work runs in a bounded Spring `ThreadPoolTaskExecutor` (`async-opt-*` threads, 4 core / 8 max). The frontend polls `GET /optimise/{id}` until done. This means the HTTP request never blocks waiting for the optimizer.

**FastAPI fallback** — If the Python service is unreachable or returns an error, `AsyncOptimisationRunner` transparently falls back to a built-in Java greedy solver. The caller always gets a result.

**Refresh token rotation** — On every `/refresh` call the old token is revoked and a new one issued. Only SHA-256 hashes of tokens are stored — raw tokens never touch the database.

**Audit trail** — `AuditLogService` writes asynchronously in a `REQUIRES_NEW` transaction. A log-write failure never rolls back the business operation. The `audit_log` table has no FK to `users` so deleting a user doesn't erase their history.

**Green score formula** — Single-EV session: `0.7 × renewablePct + 0.3 × savingsRatio`. Optimisation request: `renewableAlignment × 0.6 + timeBufferBonus (20 or 10) + 10 base`, capped at 100.

**Cost calculation** — Uses `electricity_price_per_kwh` from `energy_signals` when available; falls back to ₹8.5/kWh average.

---

## Pages

| Route | Description |
|---|---|
| `/login` | Real JWT auth via backend |
| `/register` | Creates account via `POST /api/v1/auth/register` |
| `/dashboard` | Live KPI cards (activeStations, energyToday, activeSessions, solarShare%, CO₂ saved) |
| `/stations` | Leaflet map + live station list from API; summary counts from real data |
| `/charging` | Vehicle + station selector → async optimisation → polling → Green Score + schedule chart |
| `/fleet` | Fleet + departure + capacity inputs → fleet optimisation → polling → peak reduction metrics |
| `/analytics` | Weekly energy charts, energy source pie, CO₂ bar chart, radial efficiency gauge |
| `/settings` | Profile form, notification toggles, light/dark/system theme switcher |

---

## Environment Variables

Each service owns its own `.env`. Never put secrets from one service into another's file.

```
.env                ← Docker Compose only (Postgres creds, port mappings)
backend/.env        ← Spring Boot (DB, JWT secret, CORS, HTTP timeouts, async pool)
frontend/.env       ← Vite (VITE_* API URLs, map config, token keys)
optimization/.env   ← FastAPI (DB URL, algorithm config, fallback rate)
```

Key variables:

| File | Variable | Description |
|---|---|---|
| `backend/.env` | `JWT_SECRET` | Min 32-char secret — generate with `openssl rand -hex 32` |
| `backend/.env` | `OPTIMIZATION_SERVICE_URL` | FastAPI base URL (default: `http://localhost:8001`) |
| `backend/.env` | `OPTIMIZATION_CONNECT_TIMEOUT_MS` | HTTP connect timeout to FastAPI (default: 5000) |
| `backend/.env` | `OPTIMIZATION_READ_TIMEOUT_MS` | HTTP read timeout to FastAPI (default: 15000) |
| `backend/.env` | `ASYNC_CORE_POOL_SIZE` | Optimizer thread pool core size (default: 4) |
| `frontend/.env` | `VITE_API_BASE_URL` | Spring backend URL (default: `http://localhost:8080/api`) |
| `optimization/.env` | `DATABASE_URL` | Async DSN for asyncpg (`postgresql+asyncpg://...`) |

---

## What's Complete

| Area | Status |
|---|---|
| Database — 13 tables, indexes, views, triggers, seed data | ✅ |
| Backend — all entities, repositories, services, controllers | ✅ |
| Backend — JWT auth with refresh token rotation | ✅ |
| Backend — async optimisation with FastAPI + built-in fallback | ✅ |
| Backend — fleet optimisation service + controller | ✅ |
| Backend — audit log (async, failure-safe) | ✅ |
| Backend — RestTemplate timeouts | ✅ |
| Backend — green score formula (0.7 × renewable + 0.3 × savings) | ✅ |
| Optimization — FastAPI app, greedy solver, DB integration | ✅ |
| Optimization — 10 unit tests passing | ✅ |
| Frontend — real JWT login/register/logout | ✅ |
| Frontend — token refresh interceptor | ✅ |
| Frontend — live KPIs, stations, optimisation, fleet from API | ✅ |
| Frontend — theme switching (light/dark/system) | ✅ |
| Docker Compose — full stack | ✅ |

---

## Team

**Team SyntaX Error** — HackOut '26 @ DAU

---

*GreenCharge · HackOut '26 · EV Charging Network Renewable Optimization*
*From smarter charging decisions to smarter energy coordination.*
