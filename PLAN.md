# TrackIt → Production TMS: Architecture Plan

## Context

The starting point is a throwaway single-file React prototype (`raw/tms-app (4).jsx.txt`, a Claude-artifact demo) implementing "TrackIt," a trucking/logistics Transportation Management System (TMS) dashboard for an Indonesian company. It has a full feature set — dashboard, order lifecycle management, live delivery monitoring, master data (customers/drivers/trucks), a driver mobile view, and Excel reporting — but it was never meant to run outside the Claude-artifact sandbox: it persists data via `window.storage` (a fake, artifact-only key/value API), has zero authentication, and its "photo upload" and "GPS tracking" features are cosmetic simulations.

The goal is to turn this into a real, deployable, production-ready application: a proper backend with a real database, real authentication, real file storage, and a Docker Compose setup for running/deploying the whole stack. This plan is the output of an architecture-design pass (via a planning subagent) reconciled with explicit decisions the user made up front.

## Decisions Locked In (user-approved, not to be revisited)

1. **Backend**: Python — FastAPI + SQLAlchemy + PostgreSQL, Alembic for migrations.
2. **Real-time updates**: plain HTTP polling (no WebSockets).
3. **Driver photo uploads**: real files on a local disk volume mounted into the backend container (no S3/MinIO).
4. **Automated testing**: explicitly skipped for this sprint — Docker Compose is for running/deploying the app, not CI/test infra.
5. **Deployment**: Docker Compose — docker-compose.yml + Dockerfiles for backend and frontend.

## Production Gaps Being Closed (the prototype had none of this)

- **Auth**: the prototype had no login concept at all. Adding a minimal JWT-based auth system with exactly two roles:
  - `staff` — full back-office access (dashboard, orders, master data, reporting).
  - `driver` — restricted to the Driver Mobile view, scoped to their own assigned orders only (replacing the prototype's insecure "pick any driver to preview" dropdown).
- **Persistence**: replace `window.storage` with real PostgreSQL via SQLAlchemy + Alembic.
- **Photo uploads**: replace the fake "Upload Photo" boolean toggle with a real multipart upload endpoint that saves to the mounted disk volume and records metadata in the DB.
- **Excel export**: stays client-side using the `xlsx` npm package (same approach as the prototype) — see rationale below.

## Explicitly Out of Scope (avoid scope creep)

No WebSockets, no S3/MinIO, no automated test suite/CI, no multi-tenancy, no audit-log/event-sourcing table, no permissions matrix beyond the 2 roles above, no native mobile app (Driver Mobile stays a responsive web page).

---

## 1. Repo Layout

```
tms/
├── docker-compose.yml
├── .env.example
├── README.md
├── PLAN.md
├── raw/                              # reference only, untouched
│   └── tms-app (4).jsx.txt
│
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── entrypoint.sh                 # alembic upgrade head && uvicorn ...
│   ├── alembic/
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/
│   └── app/
│       ├── main.py                   # FastAPI() instance, CORS, router includes
│       ├── config.py                 # pydantic-settings Settings (reads env)
│       ├── database.py               # engine, SessionLocal, Base
│       ├── deps.py                   # get_db, get_current_user, require_role(*roles), get_owned_order
│       ├── security.py               # password hash/verify, JWT encode/decode
│       ├── models/                   # user, customer, driver, truck, order, order_photo
│       ├── schemas/                  # matching Pydantic schemas
│       ├── routers/                  # auth, customers, drivers, trucks, orders (incl. assign/status/location/photos)
│       ├── services/                 # order_service.py, photo_service.py
│       └── scripts/
│           └── seed_admin.py         # one-off: create first staff user
│
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx                   # react-router-dom route tree
        ├── auth/                     # AuthContext, ProtectedRoute
        ├── api/                      # client.js (fetch wrapper) + per-resource modules
        ├── hooks/                    # TanStack Query hooks per resource
        ├── components/               # Sidebar, StatusPill, RouteStrip, KpiCard, PhotoOverlay, MasterDataTable
        ├── pages/                    # Login, Dashboard, Orders, OrderDetail, LiveMonitor, Customers, Drivers, Trucks, DriverMobile, Reporting
        └── lib/                      # constants.js, exportExcel.js
```

## 2. Database Schema

Design calls:
- **Status fields**: `VARCHAR` + `CHECK` constraint, not native Postgres `ENUM` (easier to alter later; status sets are small and stable enough that this is a non-issue).
- **users ↔ drivers**: one `users` table for all login (both roles), with an optional FK to `drivers`. Keeps auth mechanics separate from operational driver data and gives one consistent login code path for both roles.
- **Photos**: separate `order_photos` table (one-to-many) — an order can accumulate multiple proof photos over its lifecycle; a normalized child table is easier to query/paginate than a JSON column.

**`users`**: id, username (unique), hashed_password, role (`staff`|`driver`), driver_id (nullable FK), full_name, is_active, created_at.

**`customers`**: id, name, contact, created_at, updated_at.

**`drivers`**: id, name, phone, status (`available`|`on_trip`), created_at, updated_at.

**`trucks`**: id, plate (unique), type, status (`available`|`on_trip`), created_at, updated_at.

**`orders`**: id, order_no (unique, server-generated e.g. `ORD-20260812-0007`), customer_id (FK), load_location, unload_location, ship_date, load_time, cargo_type, tonnage, notes, driver_id (nullable FK), truck_id (nullable FK), status (`ORDER`|`ASSIGNED`|`ARRIVED`|`UNLOADING`|`COMPLETED`), current_location, eta (free text, matching the prototype), est_unload_start, est_unload_end, created_at, updated_at. Indexes on customer_id, driver_id, truck_id, status, ship_date.

**`order_photos`**: id, order_id (FK, cascade delete), driver_id (nullable — uploader), file_path (relative to `UPLOAD_DIR`), original_filename, content_type, uploaded_at.

**Business rule (implementer decision, not explicit in the prototype)**: when an order transitions to `COMPLETED`, the service layer automatically flips its driver's and truck's status back to `available` — otherwise the "available" pool used for assignment never replenishes.

## 3. API Design

All paths prefixed `/api`.

**Auth**: `POST /auth/login` (public) → `{access_token, token_type, user}`; `GET /auth/me` (any authenticated user) to restore session on load.

**Customers / Drivers / Trucks** (staff only): standard `GET (list, filterable)`, `POST`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`. Driver create/update optionally accepts `username`+`password` to create/reset the linked login in the same request — this is the only "user management" surface needed, no separate admin page.

**Orders** (role-scoped — driver requests are always filtered server-side to their own `driver_id`, regardless of query params):
- `GET /orders?status=&customer_id=&driver_id=&date_from=&date_to=&search=&page=&page_size=` — powers Dashboard, Live Monitor, Reporting, and Driver Mobile alike (one endpoint, no redundant variants).
- `GET /orders/stats?...` — status counts for KPI cards.
- `POST /orders` (staff, defaults status `ORDER`), `GET/PUT/DELETE /orders/{id}`.
- `POST /orders/{id}/assign` (staff) — body `{driver_id, truck_id}`, validates both `available`, flips to `on_trip`, sets order to `ASSIGNED`.
- `PATCH /orders/{id}/status` (staff) — frees driver/truck automatically on `COMPLETED`.
- `PATCH /orders/{id}/location` (staff/driver-own) — `{current_location, eta, est_unload_start?, est_unload_end?}`.
- `POST /orders/{id}/photos` (staff/driver-own) — multipart upload.
- `GET /orders/{id}/photos` and `GET /orders/{id}/photos/{photo_id}/file` (staff/driver-own) — metadata list and an *authenticated* file stream (chosen over a raw static mount so driver-scoping is actually enforced).

No dedicated dashboard/export endpoints — Dashboard, Reporting, and Excel export all reuse `GET /orders` + `GET /orders/stats` + `GET /drivers` + `GET /trucks`.

## 4. Auth Design

- Hashing: `passlib[bcrypt]` (pin `bcrypt==4.0.1` to avoid a known passlib compatibility break with newer bcrypt releases).
- JWT: `PyJWT`, HS256, secret from `JWT_SECRET_KEY`. Payload: `{sub: user_id, role, driver_id, exp, iat}`.
- Single access token, ~12–24h expiry, no refresh-token rotation — simple is acceptable for v1. On 401, frontend redirects to `/login`.
- Frontend stores the token in `localStorage`, attaches `Authorization: Bearer <token>` via a fetch wrapper. Accepted trade-off given no refresh-rotation system was wanted.
- Backend gating: `deps.get_current_user`, `deps.require_role(*roles)`, and a shared `deps.get_owned_order(order_id, user)` used by all order-detail-adjacent endpoints (staff pass through, drivers checked against `order.driver_id`).
- Frontend gating: `AuthContext` + `<ProtectedRoute allowedRoles={[...]}>`; wrong role → their own default landing page (`staff → /dashboard`, `driver → /driver`).
- First staff account: no signup UI — provisioned via `backend/app/scripts/seed_admin.py`, run once via `docker compose exec backend python -m app.scripts.seed_admin`.

## 5. Frontend Architecture

**Routing** (react-router-dom v6): `/login` (public), `/dashboard`, `/orders`, `/orders/:id`, `/live-monitor`, `/customers`, `/drivers`, `/trucks`, `/reporting` (all staff, nested under a `<Layout>` with Sidebar), `/driver` (driver role, standalone responsive page, no sidebar chrome).

**Data fetching**: TanStack Query over plain fetch+useEffect — the app spans 5+ CRUD resources, needs polling (Live Monitor, Order Detail, Driver Mobile) and cross-resource cache invalidation (e.g. assigning a driver must refresh drivers-availability, order detail, and dashboard KPIs). `refetchInterval` replaces hand-rolled `setInterval`.

**Component/page porting map** (from the prototype):
| Prototype | New location | Change |
|---|---|---|
| Sidebar | `components/Sidebar.jsx` | `NavLink`-based, shows current user/logout |
| Dashboard | `pages/DashboardPage.jsx` | KPIs from `/orders/stats`, table from `/orders` |
| OrdersView | `pages/OrdersPage.jsx` | inline customer sub-form now POSTs `/customers` |
| OrderDetail | `pages/OrderDetailPage.jsx` | assign/status/location call real endpoints; photos fetched via authenticated blob URLs |
| LiveMonitor | `pages/LiveMonitorPage.jsx` | `useQuery` + `refetchInterval` (~10–15s) |
| MasterDataPage | `components/MasterDataTable.jsx` (generic) | same config-driven pattern, swap storage for API modules |
| DriverMobile | `pages/DriverMobilePage.jsx` | driver picker removed — identity comes from `AuthContext`; fake photo toggle replaced by real `<input type="file" capture="environment">` upload |
| ReportingView | `pages/ReportingPage.jsx` | filters drive `/orders` + `/orders/stats`; export logic unchanged in spirit |
| StatusPill, RouteStrip, KpiCard, PhotoOverlay | `components/` | ported near-verbatim, presentational only |

**Excel export stays client-side** (`xlsx` npm package): it's a direct port of already-working logic, order volumes for a single company are well within browser generation limits, and it avoids adding a file-streaming endpoint for no functional gain.

## 6. Docker Compose Design

**Frontend serving: nginx static build**, not the Vite dev server — correct call for "production ready," and nginx reverse-proxying `/api/*` to the backend gives the SPA a single origin (no CORS handling needed in production).

**Services**:
- `db`: `postgres:16-alpine`, volume `pgdata:/var/lib/postgresql/data`, healthcheck via `pg_isready`.
- `backend`: builds `backend/Dockerfile`, volume `uploads:/app/uploads`, env `DATABASE_URL`/`JWT_SECRET_KEY`/`JWT_ACCESS_TOKEN_EXPIRE_MINUTES`/`UPLOAD_DIR`, `depends_on: db (healthy)`, port `8000:8000` published for direct Swagger access during verification.
- `frontend`: multi-stage build, port `8080:80` — the single public entrypoint, `depends_on: backend`.

**Volumes**: `pgdata` (Postgres durability), `uploads` (photo storage).

**Backend Dockerfile**: `python:3.12-slim` → install `requirements.txt` (`psycopg2-binary`/`psycopg[binary]` to skip needing build tools) → copy app/alembic → `entrypoint.sh` runs `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000` (migrations auto-apply on every start).

**Frontend Dockerfile**: multi-stage — `node:22-alpine` builds (`npm ci && npm run build`) → `nginx:alpine` serves `dist/` with SPA fallback (`try_files $uri /index.html`) and `location /api/ { proxy_pass http://backend:8000/api/; }`.

**`.env.example`**:
```
POSTGRES_USER=tms
POSTGRES_PASSWORD=change_me
POSTGRES_DB=tms
DATABASE_URL=postgresql+psycopg2://tms:change_me@db:5432/tms
JWT_SECRET_KEY=change_me_to_a_long_random_value
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440
UPLOAD_DIR=/app/uploads
```
Since nginx proxies `/api`, the frontend needs no runtime API-base-URL env var — it calls relative `/api/...` paths.

## 7. Implementation Phase Order

1. Repo scaffolding (dirs, `requirements.txt`, `package.json`, empty compose/env/README).
2. DB layer: SQLAlchemy models, `database.py`, Alembic init + first migration.
3. Auth foundation: `security.py`, `deps.py`, `routers/auth.py`, `seed_admin.py`.
4. Master-data CRUD APIs: customers, drivers (incl. optional login creation), trucks.
5. Order workflow APIs: list/create/detail/stats, `order_service.py` (assign, status transitions incl. auto-free-on-COMPLETED, location update).
6. Photo upload API: `photo_service.py`, upload/list/file endpoints with ownership checks.
7. Backend verification via Swagger `/docs` before touching the frontend.
8. Frontend scaffold: Vite+React, Tailwind theme ported, router, `AuthContext`/`ProtectedRoute`, `api/client.js`, TanStack Query provider.
9. Auth UI: LoginPage, token storage, role-based redirect, logout.
10. Port staff views in dependency order: MasterDataTable/Customers/Drivers/Trucks → OrdersPage → OrderDetailPage → DashboardPage → LiveMonitorPage.
11. Photo UI on staff side (OrderDetailPage + PhotoOverlay).
12. DriverMobilePage (identity from AuthContext, real photo upload).
13. ReportingPage + Excel export.
14. Dockerization: backend Dockerfile + entrypoint, frontend Dockerfile + nginx.conf, finalize docker-compose.yml + `.env.example`.
15. End-to-end manual verification in Docker: fresh `docker compose up --build`, confirm migrations auto-apply, run `seed_admin`, walk the full feature list against the composed stack, confirm uploaded photos survive a `down`/`up` cycle.

### Critical Files
- `docker-compose.yml`
- `backend/app/routers/orders.py`
- `backend/app/deps.py`
- `backend/app/models/order.py`
- `frontend/src/api/client.js`
