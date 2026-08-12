# TrackIt TMS

Production Transportation Management System for a trucking/logistics operation. FastAPI + PostgreSQL backend, React frontend, Docker Compose deployment.

## Quick start

```bash
cp .env.example .env
docker compose up --build
docker compose exec backend python -m app.scripts.seed_admin
```

Frontend: http://localhost:8080
Backend API docs: http://localhost:8000/docs

## Architecture

See [PLAN.md](./PLAN.md) for the full architecture plan and design decisions.
