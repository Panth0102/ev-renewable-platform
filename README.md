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
- ↓ Estimated cost
- ↓ Estimated emissions
- ↑ Renewable alignment %
- Green Score (0–100)

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | React + Vite | 18 / 5 |
| Backend API | Spring Boot + Hibernate | 2.7.18 / Java 11 |
| Database | PostgreSQL | 15 |
| Optimization Engine | Python + FastAPI | 3.14 / 0.141 |
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
│   │   │   ├── auth/           Login, Register
│   │   │   ├── dashboard/      KPI cards, energy mix charts
│   │   │   ├── stations/       Leaflet map + station list
│   │   │   ├── charging/       SOC form → Green Score + schedule
│   │   │   ├── fleet/          Multi-vehicle optimisation
│   │   │   ├── analytics/      Area, pie, bar, radial charts
│   │   │   └── settings/       Profile, notifications, theme
│   │   ├── context/            AuthContext, ThemeContext (light/dark/system)
│   │   ├── layouts/            AuthLayout, DashboardLayout
│   │   └── services/           Axios API client
│   └── .env.example
│
├── backend/                    Spring Boot REST API
│   ├── src/main/java/com/evrenewable/
│   │   ├── model/              JPA Entities (11 tables)
│   │   ├── repository/         Spring Data JPA Repositories
│   │   ├── service/            Business logic (in progress)
│   │   ├── controller/         REST endpoints (in progress)
│   │   ├── security/           JWT filter + Spring Security (in progress)
│   │   └── config/             CORS, Swagger, Security config (in progress)
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   ├── application-dev.properties
│   │   └── application-prod.properties
│   └── .env.example
│
├── optimization/               Python FastAPI optimization engine
│   ├── app/
│   │   ├── main.py             FastAPI entry point (in progress)
│   │   ├── algorithms/         OR-Tools constraint solver (in progress)
│   │   ├── api/routes/         /optimize, /fleet-optimize (in progress)
│   │   ├── schemas/            Pydantic request/response models (in progress)
│   │   └── services/           Scheduling logic (in progress)
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
| `refresh_tokens` | JWT refresh token store |
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
| `audit_log` | Immutable audit trail (JSONB detail, IP) |

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
# API at http://localhost:8080
# Swagger at http://localhost:8080/swagger-ui.html
```

### 5 — Optimization service

```bash
cd optimization
source venv/bin/activate          # venv already created with all packages
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
# Docs at http://localhost:8001/docs
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

## Demo Credentials

The frontend uses mock auth until the backend auth endpoints are wired up.

| Field | Value |
|---|---|
| Email | `admin@evrenewable.com` |
| Password | `admin123` |

These are pre-filled on the login page — just click **Sign in →**.

---

## Pages

| Route | Description |
|---|---|
| `/login` | Auth with pre-filled demo credentials |
| `/dashboard` | KPI cards, energy mix area chart, station activity bar chart, recent activity feed |
| `/stations` | Leaflet map with 5 Indian cities + expandable station list |
| `/charging` | SOC sliders → optimizer → Green Score ring, recommended window chart, cost/CO₂ estimate |
| `/fleet` | Vehicle table → run fleet optimisation → naive vs optimised load comparison chart |
| `/analytics` | Weekly energy area chart, energy source pie, CO₂ saved bar chart, radial efficiency gauge |
| `/settings` | Profile form, notification toggles, **working light/dark/system theme switcher** |

---

## Optimization Workflow

```
01  EV Request      current SOC · target SOC · battery kWh · departure · charger limit
        ↓
02  Energy Signals  renewable % · carbon intensity · electricity price · grid load
        ↓
03  Constraints     station capacity · charger power limit · EV availability window
        ↓
04  Optimization    multi-objective scheduling — balance renewable, carbon, cost, grid load
        ↓
05  Schedule        best window · hourly power slots · Green Score · cost · CO₂ estimate
```

> **DRIVER DEADLINE = HARD CONSTRAINT** — the schedule can shift charging but it will always reach the target SOC before departure.

---

## Environment Variables

Each service owns its own `.env`. Never put secrets from one service into another's file.

```
.env                ← Docker Compose only (Postgres creds, port mappings)
backend/.env        ← Spring Boot (DB, JWT secret, CORS, mail)
frontend/.env       ← Vite (VITE_* API URLs, map config, token keys)
optimization/.env   ← FastAPI (DB URL, internal API key, algorithm config)
```

---

## What's Working vs In Progress

| Area | Status |
|---|---|
| Frontend — all 7 pages | ✅ Complete |
| Frontend — theme switching (light/dark/system) | ✅ Complete |
| Database — schema, indexes, seed, views, triggers | ✅ Complete |
| Backend — pom.xml, config, entities, repositories | ✅ Complete |
| Backend — services, controllers, JWT security | 🔄 In progress |
| Optimization — FastAPI app, OR-Tools solver | 🔄 In progress |
| Docker Compose — full stack | 🔄 In progress |

---

## Team

**Team SyntaX Error** — HackOut '26 @ DAU

---

*GreenCharge · HackOut '26 · EV Charging Network Renewable Optimization*  
*From smarter charging decisions to smarter energy coordination.*
