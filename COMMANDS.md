# GreenCharge — Command Reference

---

## First time ever

```bash
# 1. Stop any local Postgres / Java / Python already using these ports
brew services stop postgresql@15     # or postgresql
lsof -ti:8080 | xargs kill -9 2>/dev/null
lsof -ti:5432 | xargs kill -9 2>/dev/null

# 2. Build images + create DB + seed data + start everything (~10 min)
docker compose up --build
```

Open **http://localhost** once you see:
```
backend-1  | Started EvRenewableApplication in X seconds
```

---

## Every day after (no code changes)

```bash
docker compose up
```

Starts in ~10 seconds. DB data is preserved.

---

## After changing code

```bash
docker compose up --build
```

Only rebuilds the service whose code changed. Cached layers make it fast.

---

## Stop

```bash
Ctrl+C                  # stops and keeps all data
docker compose down     # removes containers, keeps DB volume
```

---

## Full reset (wipe DB and start clean)

```bash
docker compose down -v
docker compose up --build
```

⚠️ This deletes all data and re-seeds from scratch.

---

## URLs when running

| What | URL |
|---|---|
| **App** | http://localhost |
| Spring API | http://localhost:8080 |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| FastAPI docs | http://localhost:8001/docs |
| API health | http://localhost:8080/actuator/health |

---

## Login credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@evrenewable.com` | `admin123` |
| Operator | `priya@evrenewable.com` | `operator123` |
| Driver | `rahul@driver.com` | `driver123` |
| Driver | `ananya@driver.com` | `driver123` |

---

## Useful debug commands

```bash
# See logs from all services live
docker compose logs -f

# See logs for one service only
docker compose logs -f backend
docker compose logs -f db
docker compose logs -f optimization
docker compose logs -f frontend

# Check what tables exist in the DB
docker exec ev-renewable-platform-db-1 \
  psql -U ev_user -d ev_renewable_db -c "\dt"

# Check seeded users
docker exec ev-renewable-platform-db-1 \
  psql -U ev_user -d ev_renewable_db \
  -c "SELECT email, role FROM users;"

# Test login directly (no browser needed)
curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@evrenewable.com","password":"admin123"}' | python3 -m json.tool

# Re-seed data without rebuilding images
docker exec ev-renewable-platform-db-1 \
  psql -U ev_user -d ev_renewable_db \
  -f /docker-entrypoint-initdb.d/seeds/001_seed_data.sql
```

---

## Port conflicts

```bash
# Kill whatever is using port 8080 (usually a leftover mvn spring-boot:run)
lsof -ti:8080 | xargs kill -9

# Kill whatever is using port 5432 (local Postgres)
brew services stop postgresql@15
# or
lsof -ti:5432 | xargs kill -9
```
