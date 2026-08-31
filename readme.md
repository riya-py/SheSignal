<div align="center">

# 🛡️ SheSignal

**Crowdsourced safety intelligence for the streets you actually walk.**

Report incidents anonymously, see live risk heatmaps, get an AI-scored safety read on any street route before you take it — all built on a transparent, tunable risk engine instead of a black box.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![FastAPI](https://img.shields.io/badge/backend-FastAPI-009688)](./backend)
[![React](https://img.shields.io/badge/frontend-React%2018%20%2B%20Vite-61DAFB)](./frontend)
[![Supabase](https://img.shields.io/badge/data-Supabase%20%2F%20PostGIS-3ECF8E)](./backend/supabase_db)
[![Tests](https://img.shields.io/badge/backend%20tests-16%20suites-brightgreen)](./backend/tests)

</div>

---

## The problem

Personal-safety apps usually do one of two things badly: they either broadcast raw, unmoderated crime data with no context, or they hide behind a vague "safety score" nobody can inspect. Meanwhile the people who most need street-level, *recent*, *hyperlocal* safety signal — women walking alone, late-shift commuters, students on unfamiliar campuses — are left guessing.

**SheSignal** turns anonymous, community-submitted reports into an explainable risk score, live pattern clusters on a map, and a route planner that tells you *which turn* is the risky one — not just a single number for an entire city.

---

## What it does

| | |
|---|---|
| 🗺️ **Live safety map** | Every report and detected hotspot rendered on an interactive MapLibre map, color-coded by risk level. |
| 📝 **Anonymous incident reports** | Submit harassment, stalking, poor lighting, unsafe transit, and more in a few taps — reporter identity is never exposed, even to other endpoints. |
| 🤖 **AI report enrichment** | Every report is passed through an LLM (any OpenAI-compatible endpoint — Gemini, Groq, OpenAI, OpenRouter) to extract severity, time-of-day context, and contributing factors — asynchronously, and *never* blocking the report submission itself. |
| 📈 **Deterministic, explainable risk engine** | A transparent 4-factor score (density, severity, recency, diversity) — not an opaque ML score. Every weight lives in config, not code. |
| 🧭 **Route safety scoring** | Paste a start/destination, get the walking route broken into risk-scored segments so you can see exactly where the danger is concentrated, powered by OpenRouteService. |
| 🔍 **Pattern detection** | Reports are geo-clustered (geohash-based) into recurring "patterns" so isolated one-offs don't skew the map — a hotspot only appears once it's a *pattern*. |
| 💡 **Personalized recommendations** | Context-aware safety tips generated from the nearby pattern factors, not generic advice. |
| 🔐 **Privacy & abuse-resistant by design** | Supabase RLS policies, per-user + per-IP rate limiting on every write path, and reports that 404 (not 403) when you try to probe someone else's data. |

---

## How the risk score actually works

No black box. The score is a weighted blend of four signals, each independently testable (see [`backend/tests/test_risk_engine.py`](./backend/tests/test_risk_engine.py)):

```
risk = (density × 0.35) + (severity × 0.35) + (recency × 0.20) + (diversity × 0.10)
```

- **Density** — report volume near the point, saturating at a configurable threshold so one hotspot can't max out the scale forever.
- **Severity** — weighted by AI-classified severity (low/medium/high) across nearby patterns.
- **Recency** — exponential half-life decay (default 30 days), so a cluster of reports from a year ago fades relative to activity from last week.
- **Diversity** — how many *distinct* contributing factors are present (poor lighting + stalking + no security presence is scarier than three reports of the same thing).

Every weight, saturation point, half-life, and radius is a config value — nothing is hardcoded — so the model can be re-tuned without touching engine code.

---

## Architecture

```
┌─────────────────────┐         ┌──────────────────────────────┐        ┌─────────────────────┐
│   React + Vite SPA  │  HTTPS  │        FastAPI backend        │  SQL   │   Supabase/Postgres │
│  MapLibre · Tailwind│ ──────► │  rate limiting · auth · risk  │ ─────► │  + PostGIS · RLS     │
│  shadcn/ui · React  │ ◄────── │  engine · pattern clustering  │ ◄───── │  policies             │
│  Query · Zod         │         └───────────┬────────────────┘        └─────────────────────┘
└─────────────────────┘                     │
                                             ▼
                              ┌────────────────────────────┐      ┌───────────────────────────┐
                              │  AI extraction (any OpenAI- │      │  Route provider (any ORS-  │
                              │  compatible chat endpoint)  │      │  compatible directions API)│
                              └────────────────────────────┘      └───────────────────────────┘
```

**Flow for a new report:** `Report form → Supabase insert (201 immediately) → async AI extraction → validated JSON → report_analysis table → feeds pattern clustering → feeds risk & recommendation engines`. A failing or rate-limited AI call never blocks or rolls back the report itself.

---

## Tech stack

**Frontend** — React 18, Vite, Tailwind CSS, shadcn/ui + Radix primitives, MapLibre GL / react-map-gl, TanStack Query, React Hook Form + Zod, Framer Motion, Supabase JS client.

**Backend** — FastAPI, Pydantic Settings, Supabase (Postgres + PostGIS + RLS), a pluggable AI client (any OpenAI-compatible `/chat/completions` endpoint), a pluggable routing provider (any OpenRouteService-compatible directions API), in-memory sliding-window rate limiting.

---

## Getting started

### Prerequisites
- Node 18+ and Python 3.11+
- A free [Supabase](https://supabase.com) project (Postgres + PostGIS + Auth)
- A free API key from any OpenAI-compatible LLM provider (Gemini's OpenAI-compat layer works out of the box and is free)
- A free [OpenRouteService](https://openrouteservice.org) API key for route safety scoring

### 1. Database

Run the migrations in `backend/supabase_db/migrations/` against your Supabase project in order (`0001` → `0004`). `rls_tests.sql` verifies your Row-Level Security policies are locked down correctly.

### 2. Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate      # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env    # fill in SUPABASE_*, AI_API_KEY, ROUTE_PROVIDER_API_KEY
uvicorn app.main:app --reload
```

API docs available at `http://localhost:8000/docs`.

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env    # fill in VITE_API_BASE_URL + Supabase public keys
npm run dev
```

App runs at `http://localhost:5173`.

```

---

## API surface

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `POST` | `/reports` | ✅ | Submit an incident report; triggers async AI analysis |
| `GET` | `/reports` | — | Public, paginated, sanitized report feed |
| `GET` | `/reports/{id}/analysis` | ✅ (owner) | AI-extracted severity/factors for your own report |
| `POST` | `/reports/{id}/reanalyze` | ✅ (owner) | Re-run AI extraction on a failed analysis |
| `GET` | `/patterns` | — | Geo-clustered recurring incident patterns |
| `GET` | `/risk` | — | Deterministic risk score for a lat/lng |
| `POST` | `/route-risk` | ✅ | Segment-by-segment risk score for a walking route |
| `GET` | `/recommendations` | — | Context-aware safety tips for a location |
| `GET` | `/health` | — | Liveness check |

Full interactive schema at `/docs` once the backend is running.

---

## Security & privacy choices worth calling out

- **Reporter identity is never returned** by any endpoint — not `/reports`, not the analysis endpoints. Confirmed in the router docstring and enforced in the response models.
- **404, not 403**, when you try to fetch a report analysis you don't own — avoids confirming another user's report even exists.
- **Rate limiting is per-authenticated-user on write paths**, not per-IP, so it can't be bypassed by switching networks — and per-IP on public read paths to blunt scraping.
- **AI failures degrade gracefully.** A report is saved and returns `201` regardless of whether the AI enrichment pipeline succeeds, fails, or is rate-limited.
- **Supabase Row-Level Security** locks down every table, verified by a dedicated `rls_tests.sql` suite.

---

## Roadmap ideas

- Push notifications when a new pattern emerges near a saved location
- Community verification / corroboration for high-severity reports
- Multi-language report submission and AI extraction
- Offline-first PWA mode for low-connectivity areas

---

## License

MIT — see [LICENSE](./LICENSE).

<div align="center">

*Built with the belief that safety data should be transparent, explainable, and owned by the community it protects.*

</div>