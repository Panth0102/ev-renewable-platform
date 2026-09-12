# EV Renewable Platform — Setup Guide

Full-stack platform for EV charging and renewable energy management.

**Stack**

| Layer | Technology |
|---|---|
| Frontend | React.js + Vite |
| Backend | Java 17 + Spring Boot 3 |
| Database | PostgreSQL 15 |
| Optimization Service | Python 3.11 + FastAPI |
| Auth | Spring Security + JWT |
| Charts | Recharts |
| Maps | Leaflet + OpenStreetMap |
| Reverse Proxy | Nginx |
| Deployment | Docker + Docker Compose |

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Prerequisites](#2-prerequisites)
3. [Environment Variables — Where & What](#3-environment-variables--where--what)
4. [Database — PostgreSQL](#4-database--postgresql)
5. [Backend — Spring Boot](#5-backend--spring-boot)
6. [Optimization Service — FastAPI](#6-optimization-service--fastapi)
7. [Frontend — React + Vite](#7-frontend--react--vite)
8. [Nginx Reverse Proxy](#8-nginx-reverse-proxy)
9. [Running Everything with Docker Compose](#9-running-everything-with-docker-compose)
10. [Verifying the Setup](#10-verifying-the-setup)
11. [Common Issues & Fixes](#11-common-issues--fixes)
12. [Quick-Start Cheat Sheet](#12-quick-start-cheat-sheet)

---

## 1. Project Structure

```
ev-renewable-platform/
│
├── .env.example                  ← Docker Compose shared vars ONLY (copy → .env)
├── .gitignore                    ← Root-level, covers entire monorepo
├── docker-compose.yml
├── setup.md
│
├── backend/                      ← Java 17 + Spring Boot 3
│   ├── .env.example              ← Spring Boot service vars (copy → .env)
│   ├── .gitignore
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── java/com/evrenewable/
│       │   │   ├── config/       ← SecurityConfig, CorsConfig, SwaggerConfig
│       │   │   ├── controller/   ← REST controllers
│       │   │   ├── dto/
│       │   │   │   ├── request/  ← Incoming request DTOs
│       │   │   │   └── response/ ← Outgoing response DTOs
│       │   │   ├── exception/    ← GlobalExceptionHandler, custom exceptions
│       │   │   ├── model/        ← JPA entities
│       │   │   ├── repository/   ← Spring Data JPA repositories
│       │   │   ├── security/     ← JwtFilter, JwtUtil, UserDetailsService
│       │   │   ├── service/      ← Business logic
│       │   │   └── util/         ← Helpers / constants
│       │   └── resources/
│       │       ├── application.properties
│       │       ├── application-dev.properties
│       │       ├── application-prod.properties
│       │       ├── static/       ← Static assets (if any)
│       │       └── templates/    ← Thymeleaf templates (if any)
│       └── test/
│           └── java/com/evrenewable/
│
├── frontend/                     ← React 18 + Vite
│   ├── .env.example              ← Vite public vars (copy → .env)
│   ├── .gitignore
│   ├── Dockerfile
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── public/                   ← Static public assets (favicon, robots.txt)
│   └── src/
│       ├── main.jsx              ← App entry point
│       ├── App.jsx               ← Root component + router
│       ├── assets/
│       │   ├── icons/            ← SVG / PNG icons
│       │   └── images/           ← Images
│       ├── components/
│       │   ├── common/           ← Button, Modal, Spinner, etc.
│       │   ├── charts/           ← Recharts wrappers
│       │   ├── maps/             ← Leaflet map components
│       │   └── forms/            ← Form components
│       ├── context/              ← React Context (AuthContext, ThemeContext)
│       ├── hooks/                ← Custom React hooks
│       ├── layouts/              ← Page layout shells (DashboardLayout, AuthLayout)
│       ├── pages/
│       │   ├── auth/             ← Login, Register, ForgotPassword
│       │   ├── dashboard/        ← Main dashboard
│       │   ├── stations/         ← EV station management
│       │   ├── analytics/        ← Analytics & charts
│       │   └── settings/         ← User / app settings
│       ├── services/             ← Axios API call functions
│       └── utils/                ← Formatters, validators, constants
│
├── optimization/                 ← Python 3.11 + FastAPI
│   ├── .env.example              ← FastAPI service vars (copy → .env)
│   ├── .gitignore
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py               ← FastAPI app entry point
│   │   ├── __init__.py
│   │   ├── algorithms/           ← Core optimisation algorithms
│   │   ├── api/
│   │   │   └── routes/           ← FastAPI routers
│   │   ├── models/               ← SQLAlchemy ORM models
│   │   ├── schemas/              ← Pydantic request/response schemas
│   │   ├── services/             ← Business logic
│   │   └── utils/                ← Helpers, constants
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   └── logs/
│
├── database/
│   ├── init/
│   │   ├── 001_schema.sql        ← Table definitions
│   │   └── 002_indexes.sql       ← Index definitions
│   ├── migrations/               ← Future Flyway / Liquibase migrations
│   ├── seeds/                    ← Development seed data
│   └── backups/                  ← DB dump files (gitignored)
│
├── nginx/
│   ├── Dockerfile
│   ├── nginx.conf                ← Reverse proxy config
│   └── certs/                    ← TLS certs for prod (gitignored)
│
├── docs/
│   ├── api.md
│   ├── architecture.md
│   ├── database.md
│   └── deployment.md
│
└── scripts/                      ← Helper shell scripts (db-reset, seed, etc.)
```

---

## 2. Prerequisites

| Tool | Min Version | Install |
|---|---|---|
| Git | 2.40+ | https://git-scm.com |
| Docker Desktop | 24+ | https://docs.docker.com/get-docker |
| Docker Compose | v2 (bundled) | — |
| Node.js | 18 LTS | https://nodejs.org |
| Java JDK | 17 | https://adoptium.net |
| Maven | 3.9+ | https://maven.apache.org |
| Python | 3.11+ | https://www.python.org/downloads |
| PostgreSQL CLI | 15 | https://www.postgresql.org/download |

Verify all at once:

```bash
git --version && docker --version && docker compose version && \
node --version && npm --version && java -version && \
mvn -version && python3 --version && pip3 --version
```

> **macOS shortcut (Homebrew):**
> ```bash
> brew install git node openjdk@17 maven python@3.11 postgresql@15
> brew install --cask docker
> ```

---

## 3. Environment Variables — Where & What

The project uses **four separate `.env` files**. Each service owns its own config — nothing leaks across boundaries.

```
ev-renewable-platform/
├── .env              ← Docker Compose only  (DB creds for the 'db' container, port mappings)
├── backend/.env      ← Spring Boot          (DB connection, JWT secret, CORS, mail)
├── frontend/.env     ← Vite / React         (VITE_* public API URLs, map config)
└── optimization/.env ← FastAPI / Python     (DB URL, backend URL, algorithm tuning)
```

### Step 1 — Copy all example files

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp optimization/.env.example optimization/.env
```

### Step 2 — Fill in secrets

Open each `.env` and replace every `change_me_*` placeholder:

**Root `.env`** — sets PostgreSQL container credentials used by Docker Compose:
```dotenv
POSTGRES_PASSWORD=a_real_strong_password
```

**`backend/.env`** — Spring Boot reads these via `${VAR}` in `application.properties`:
```dotenv
DB_PASSWORD=same_password_as_root_env
JWT_SECRET=run_openssl_rand_hex_32_and_paste_here
```

Generate a JWT secret:
```bash
openssl rand -hex 32
```

**`frontend/.env`** — Only `VITE_` prefixed vars are bundled into the browser. Never put secrets here:
```dotenv
VITE_API_BASE_URL=http://localhost:8080/api
VITE_OPTIMIZATION_URL=http://localhost:8001
```

**`optimization/.env`** — FastAPI loads via `python-dotenv`:
```dotenv
DATABASE_URL=postgresql+asyncpg://ev_user:same_password@localhost:5432/ev_renewable_db
INTERNAL_API_KEY=a_shared_secret_between_backend_and_optimizer
```

> **Docker vs local dev URLs:**
> When running locally, use `localhost`. When running in Docker Compose, replace hostnames with Docker service names (`db`, `backend`, `optimization`). The `docker-compose.yml` injects the correct values automatically via its `environment` block.

---

## 4. Database — PostgreSQL

### Option A — Docker (recommended, skip to Section 9)

PostgreSQL starts automatically with `docker compose up`. No manual setup needed.

### Option B — Local PostgreSQL

```bash
# macOS
brew services start postgresql@15

# Ubuntu / Debian
sudo systemctl start postgresql
```

Create the database and user:

```bash
psql -U postgres
```

```sql
CREATE USER ev_user WITH PASSWORD 'your_password';
CREATE DATABASE ev_renewable_db OWNER ev_user;
GRANT ALL PRIVILEGES ON DATABASE ev_renewable_db TO ev_user;
\q
```

Apply schema and indexes:

```bash
psql -U ev_user -d ev_renewable_db -f database/init/001_schema.sql
psql -U ev_user -d ev_renewable_db -f database/init/002_indexes.sql
```

Seed development data (optional):

```bash
for f in database/seeds/*.sql; do
  psql -U ev_user -d ev_renewable_db -f "$f"
done
```

---

## 5. Backend — Spring Boot

```bash
java -version   # must show 17
mvn -version    # must show 3.9+
```

### Install & build

```bash
cd backend
mvn clean install -DskipTests
```

### Run (dev)

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

API available at **http://localhost:8080**
Swagger UI: **http://localhost:8080/swagger-ui.html**

### Run tests

```bash
cd backend
mvn test
```

### How properties are loaded

`application.properties` delegates to env vars:

```properties
spring.datasource.url=jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
jwt.secret=${JWT_SECRET}
```

These are populated from `backend/.env` locally, or from the Docker Compose `environment` block in containers.

---

## 6. Optimization Service — FastAPI

```bash
python3 --version   # must show 3.11+
```

### Create and activate a virtual environment

```bash
cd optimization
python3 -m venv venv

# macOS / Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

### Install dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

If `requirements.txt` is empty, install core packages then freeze:

```bash
pip install fastapi==0.111.0 "uvicorn[standard]==0.29.0" \
  sqlalchemy==2.0.30 asyncpg==0.29.0 psycopg2-binary==2.9.9 \
  pydantic==2.7.1 pydantic-settings==2.2.1 python-dotenv==1.0.1 \
  scipy==1.13.0 numpy==1.26.4 httpx==0.27.0 pytest==8.2.0
pip freeze > requirements.txt
```

### Run (dev)

```bash
cd optimization
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

Service available at **http://localhost:8001**
Interactive docs: **http://localhost:8001/docs**

### Run tests

```bash
cd optimization
pytest tests/ -v
```

---

## 7. Frontend — React + Vite

```bash
node --version   # must show 18+
npm --version    # must show 9+
```

### Install dependencies

```bash
cd frontend
npm install
```

### Leaflet CSS — required import

Make sure `src/main.jsx` includes:

```jsx
import 'leaflet/dist/leaflet.css';
```

### Run dev server

```bash
cd frontend
npm run dev
```

App available at **http://localhost:5173** with hot reload.

### Build for production

```bash
cd frontend
npm run build        # outputs to frontend/dist/
npm run preview      # local preview of the production build
```

---

## 8. Nginx Reverse Proxy

Used in Docker/production to:
- Serve the built React static files from `frontend/dist/`
- Proxy `/api/*` → Spring Boot on port 8080
- Proxy `/optimization/*` → FastAPI on port 8001

`nginx/nginx.conf` key routing:

```nginx
location /          { root /usr/share/nginx/html; try_files $uri /index.html; }
location /api/      { proxy_pass http://backend:8080/api/; }
location /optimization/ { proxy_pass http://optimization:8001/; }
```

Not needed in local dev — Vite runs its own dev server with proxy config in `vite.config.js`.

---

## 9. Running Everything with Docker Compose

```bash
# Build images and start all services
docker compose up --build

# Detached (background)
docker compose up --build -d
```

| Service | Container | Exposed port |
|---|---|---|
| PostgreSQL | db | 5432 |
| Spring Boot | backend | 8080 |
| FastAPI | optimization | 8001 |
| React + Nginx | frontend | 80 |

```bash
# Follow logs
docker compose logs -f

# Single service logs
docker compose logs -f backend

# Stop
docker compose down

# Stop + wipe DB volume
docker compose down -v

# Rebuild one service
docker compose up --build backend
```

---

## 10. Verifying the Setup

```bash
# PostgreSQL — list tables
psql -h localhost -U ev_user -d ev_renewable_db -c "\dt"

# Spring Boot health
curl http://localhost:8080/actuator/health
# → {"status":"UP"}

# Get a JWT token
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
# → {"token":"eyJ..."}

# Optimization service health
curl http://localhost:8001/health
# → {"status":"ok"}
```

Open **http://localhost:5173** (dev) or **http://localhost** (Docker):
- Login page loads
- Dashboard renders Recharts charts
- Map page shows OpenStreetMap tiles via Leaflet

---

## 11. Common Issues & Fixes

**Port already in use**
```bash
lsof -ti:8080 | xargs kill -9
```

**`JAVA_HOME` not set (macOS)**
```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 17)' >> ~/.zshrc
```

**PostgreSQL connection refused**
```bash
brew services start postgresql@15   # macOS
# or start via Docker:
docker compose up db
```

**Python venv not activated — `ModuleNotFoundError`**
```bash
source optimization/venv/bin/activate
```

**Leaflet map tiles not loading**
Confirm `leaflet/dist/leaflet.css` is imported in `main.jsx` and you have internet access for the OSM CDN.

**`vite: command not found`**
```bash
cd frontend && npm install
```

**JWT `SignatureException`**
`JWT_SECRET` in `backend/.env` doesn't match the token. Regenerate with `openssl rand -hex 32` and update only `backend/.env`.

**`VITE_*` variable is `undefined` in the browser**
All frontend env vars must be prefixed with `VITE_`. Restart the Vite dev server after editing `.env`.

**Docker Compose v1 vs v2**
Use `docker compose` (space, v2). The old `docker-compose` (hyphen, v1) is deprecated.

---

## 12. Quick-Start Cheat Sheet

```bash
# 1. Clone
git clone <repo-url> ev-renewable-platform
cd ev-renewable-platform

# 2. Copy env files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp optimization/.env.example optimization/.env

# 3. Edit each .env — replace every change_me_* value
#    Generate JWT secret:
openssl rand -hex 32

# 4. Start the full stack
docker compose up --build

# 5. Open in browser
open http://localhost
```

---

*Hackout@DAU 2026 — EV Renewable Platform*
