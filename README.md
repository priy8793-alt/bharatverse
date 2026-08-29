# BharatVerse — India's Living Heritage

A full-stack prototype for the digital preservation of India's living cultural
heritage — art forms, crafts, dance, festivals, oral history and the artisan
communities that keep them alive.

> **Read this first:** BharatVerse is a Smart India Hackathon **prototype**, not
> a production system with live government data feeds. Wherever this project
> shows AI output, a confidence score, a health/risk score, or a dataset, it is
> explicitly labelled **Live**, **Demo**, or **Prototype Dataset** so a judge
> (or a user) never mistakes a prototype estimate for a certified fact. See
> [Prototype Limitations](#prototype-limitations) below.

---

## 1. Project Overview

BharatVerse helps people **discover → identify → verify → document → assess
risk → preserve → support** India's living heritage:

- Browse traditions, art forms, crafts, dances and festivals by state/region
- Click real state/UT boundaries on a GIS map to see what's documented there
- Upload a photo of an art form and get it identified (with an honest
  live/demo status — see [AI Architecture](#ai-architecture))
- Chat with **Bharat AI**, a retrieval-grounded assistant that answers only
  from BharatVerse's own verified records
- See a transparent **Heritage Health** score for how at-risk a tradition is
- Read artisan stories and record a (prototype-safe) enquiry to support them
- **Add Your Heritage** — submit a tradition, craft, festival, recipe, oral
  history or heritage site for community verification
- Test what you've learned with the **Heritage Quiz**
- Track progress on the **Preservation Dashboard**

## 2. Problem Statement

Much of India's living heritage — regional art forms, oral histories, minority
languages, artisan crafts — is undocumented, practiced by a shrinking and
aging population, and at real risk of disappearing with no digital record.
Existing cultural websites are largely static and don't measure risk, invite
contribution, or connect the public to the artisans themselves.

## 3. Solution

BharatVerse combines a real GIS map, a RAG-grounded AI assistant, a
transparent risk-scoring engine, and a community contribution workflow into
one platform — built so that **every piece of "smart" functionality is either
genuinely working or clearly labelled as a prototype**, never silently faked.

## 4. Key Features

| Feature | What's real | What's prototype-labelled |
|---|---|---|
| GIS Heritage Map | Real GADM state/UT boundaries, click/hover/zoom/pan/search, live marker layers | Boundaries predate Telangana (2014) & J&K/Ladakh (2019) splits — flagged in-app |
| Art Recognition | Real upload → backend → deterministic, non-random demo pipeline; pluggable for a real vision model | No vision model is configured in this build — every result says "Demo Mode" |
| Bharat AI | Real RAG: MongoDB text search → context → optional live model call | Falls back to an honest DEMO answer grounded in the same retrieved records if no `AI_API_KEY` is set |
| Heritage Health | Real, documented weighted-average scoring engine | Labelled "prototype assessment", not an official rating |
| Artisan Support | Real enquiry capture endpoint | No real payments — explicitly future scope |
| Add Your Heritage | Real submission → Pending Verification workflow, stored in MongoDB | Nothing auto-publishes; a verifier must move it through review |
| Heritage Quiz | Real curated question bank, graded server-side | Small built-in demo bank if the database is unavailable |
| Dashboard | Real live aggregation query over the database | Falls back to labelled static numbers if the backend is unreachable |
| Search | Real unified `GET /api/search` across all collections | Instant local index is the fallback layer if the backend is unreachable |

## 5. Architecture

```
USER
  ↓
BHARATVERSE WEB APP (frontend/index.html)
  ↓
REST API (backend/, Express)
  ↓
CULTURAL DATABASE (MongoDB / Mongoose)
  ↓
AI / RAG (services/ai.service.js)         ← only reachable from the backend, never the browser
  ↓
VERIFICATION ENGINE (services/verification.service.js)
  ↓
HERITAGE HEALTH ENGINE (services/heritageRisk.service.js)
  ↓
COMMUNITY + ARTISAN ECOSYSTEM (contributions, artisans, quiz)
```

The frontend **never** calls an AI provider or holds an API key. Every
"smart" feature (recognition, chat, search, dashboard) is a `fetch()` to this
backend, which decides — honestly — whether to serve a live result or a
clearly-labelled demo one.

## 6. Tech Stack

- **Frontend**: static HTML/CSS/JS (no build step), Leaflet 1.9 for the GIS map
- **Backend**: Node.js, Express
- **Database**: MongoDB via Mongoose
- **Auth**: JWT + bcrypt
- **Uploads**: Multer (local disk by default; Cloudinary-ready via env vars)
- **Security**: Helmet, CORS, express-rate-limit, centralized error handling

## 7. Folder Structure

```
bharatverse/
├── frontend/
│   └── index.html                 # the whole frontend (static, no build step)
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   ├── config/db.js
│   ├── models/                    # User, State, Heritage, Artisan, Event,
│   │                               # Story, Contribution, Recognition,
│   │                               # QuizQuestion, QuizAttempt
│   ├── routes/                    # one *.routes.js per resource
│   ├── controllers/                # one *.controller.js per resource
│   ├── middleware/                # auth.js, upload.js, errorHandler.js
│   ├── services/                  # ai, recognition, heritageRisk, verification
│   ├── seed/
│   │   ├── seedData.js            # npm run seed
│   │   └── india-states.geojson   # real, simplified state/UT boundaries
│   └── uploads/                   # local file storage (gitignored)
└── README.md                      # this file
```

## 8. Installation

```bash
git clone <this project>
cd bharatverse/backend
npm install
```

Requires Node.js 18+ (uses the built-in `fetch`).

## 9. MongoDB Setup

Run MongoDB locally (`mongod`) or point `MONGO_URI` at a hosted instance
(e.g. MongoDB Atlas). The backend runs even without a database — every
endpoint that needs it returns an honest `503 { error: "Database
unavailable." }` instead of faking data — but seeding, quizzes-from-the-real-bank,
dashboard numbers, search and contributions all need a real connection to do
anything useful.

## 10. Environment Variables

```bash
cd backend
cp .env.example .env
```

| Variable | Required | Purpose |
|---|---|---|
| `PORT` | no (default 5000) | API port |
| `CLIENT_ORIGIN` | recommended | CORS origin for the frontend |
| `MONGO_URI` | yes, for DB features | MongoDB connection string |
| `JWT_SECRET` | yes, for auth | Long random string |
| `AI_PROVIDER` / `AI_API_KEY` / `AI_MODEL` | no | Enables **live** Bharat AI. Unset → honest DEMO mode |
| `VISION_PROVIDER` / `VISION_API_KEY` | no | Enables live art recognition. Unset → honest DEMO mode |
| `CLOUDINARY_*` | no | Enables cloud file storage. Unset → local `/uploads` |

**Never** commit a real `.env`. `AI_API_KEY`, `VISION_API_KEY`, `MONGO_URI`
and `JWT_SECRET` are never sent to the frontend.

## 11. Seed the Database

```bash
npm run seed
```

Inserts prototype data (all tagged `verificationStatus: "prototype"`) for 11
priority states — Jharkhand, Rajasthan, Gujarat, Bihar, Odisha, Madhya
Pradesh, Maharashtra, West Bengal, Tamil Nadu, Kerala, Assam — plus 15
Heritage Quiz questions and 5 artisan profiles.

## 12. Run the Backend

```bash
npm start          # or: npm run dev (auto-restart on change)
```

Health check: `GET http://localhost:5000/api/health`

## 12b. Deploy for a Live SIH Demo (fixes "Backend unavailable" on the hosted site)

If the frontend is deployed as a static site (e.g. Vercel) but the backend
only ever ran on your laptop at `localhost:5000`, every visitor to the live
URL will see the honest "Backend unavailable" banners — the browser can't
reach your laptop. This is expected behaviour, not a bug, but you'll want a
real backend running before judging. Two things to do once:

1. **Database** — create a free [MongoDB Atlas](https://www.mongodb.com/atlas)
   cluster, get its connection string, and run `npm run seed` locally against
   it once (point `MONGO_URI` at Atlas in your local `.env`, then `npm run
   seed`).
2. **Backend hosting** — deploy `backend/` to any Node host (Render, Railway,
   Fly.io, etc). A ready-to-use `render.yaml` blueprint is included at the
   repo root: on Render, **New → Blueprint**, pick this repo, fill in
   `MONGO_URI` (from step 1) and `CLIENT_ORIGIN` (your Vercel URL), and Render
   builds/deploys it automatically. You'll get a URL like
   `https://bharatverse-backend.onrender.com`.

Then point the already-deployed frontend at that backend **without
redeploying it** — open the live site once with `?api=` in the URL:

```
https://bharatverse-three.vercel.app/?api=https://bharatverse-backend.onrender.com
```

The frontend saves this to `localStorage` and reuses it on every later visit
from that browser. The "Backend unavailable" banners also have a **"set the
deployed backend URL"** link that does the same thing via a prompt, for
demo-day laptops where editing the address bar is inconvenient. (For a
permanent fix across all visitors, you can instead add
`<script>window.BHARATVERSE_API_BASE = "https://bharatverse-backend.onrender.com"</script>`
just before the closing `</head>` tag in `frontend/index.html` and redeploy
the frontend.)

Free-tier hosts sleep after inactivity — hit `/api/health` a minute before
your demo slot to warm it up.

## 13. Run the Frontend

The frontend is a single static file with no build step.

```bash
cd frontend
python3 -m http.server 5173   # or any static file server
```

Open `http://localhost:5173`. It talks to the backend at
`http://localhost:5000` by default — override with
`window.BHARATVERSE_API_BASE` if you serve the backend elsewhere.

If the backend isn't running, the page still loads and works using its
bundled prototype content — every live section shows a **"Backend
unavailable — Demo Mode"** banner instead of breaking.

## 14. API Documentation

All routes are prefixed `/api`. See inline comments in `backend/routes/` and
`backend/controllers/` for full detail; summary:

| Method | Route | Notes |
|---|---|---|
| GET | `/health` | Server + DB status |
| POST | `/auth/register`, `/auth/login` | JWT auth |
| GET | `/auth/me` | Requires Bearer token |
| GET | `/states`, `/states/:name` | Requires DB |
| GET | `/states/geojson` | Always available — file-based, no DB needed |
| GET | `/heritage`, `/heritage/:id`, `/heritage/search?q=` | |
| POST | `/heritage` | verifier/admin only |
| GET | `/artisans`, `/artisans/:id` | |
| POST | `/artisans/:id/support`, `/artisans/:id/contact` | Prototype-safe, no real payment |
| GET | `/events` | |
| GET | `/stories` | |
| POST | `/contributions` | multipart/form-data — Add Your Heritage |
| GET | `/contributions` | |
| PATCH | `/contributions/:id/status` | verifier/admin only |
| POST | `/recognition` | multipart/form-data, field `image` |
| GET | `/recognition/status` | live/demo status |
| POST | `/ai/chat` | `{ message, language }` |
| GET | `/ai/status` | live/demo status |
| GET | `/dashboard` | live aggregated metrics |
| GET | `/search?q=` | unified search across all collections |
| GET | `/quiz?count=&state=&category=` | never returns answers |
| POST | `/quiz/submit` | server-side grading |

## 15. AI Architecture

```
frontend
  ↓  POST /api/ai/chat  { message, language }
backend validates
  ↓
MongoDB text search over Heritage + State (retrieval)
  ↓
build a grounded context block from the top matches
  ↓
AI_API_KEY set?  → call the configured model with that context, return its answer, mode:"live"
AI_API_KEY unset? → build an answer directly from the same retrieved records, mode:"demo"
  ↓
{ answer, language, sources, verificationStatus, relatedHeritage, mode }
```

The frontend renders a **Live** / **Demo** badge from `mode` — it never
pretends demo output is live, and never calls a model directly itself.

## 16. RAG Architecture

Retrieval uses MongoDB text indexes on `Heritage` (`name`, `state`,
`description`, `category`) and `State` (`name`, `region`, `highlights`). The
top 4 Heritage + 2 State matches become the context block sent to the model
(live mode) or become the DEMO answer's source material (demo mode) — so
both paths are grounded in the same verified records, never invented.

## 17. GIS Architecture

`GET /api/states/geojson` serves real state/UT boundaries — GADM v2.8 data
(via the [geohacker/india](https://github.com/geohacker/india) dataset),
simplified with `mapshaper` from ~22MB to ~1.8MB for web delivery. The
frontend renders it with Leaflet: hover highlights a state, click opens its
info panel (or an honest "no detailed profile yet" message for UTs not in
the curated dataset), a search box flies to any state/UT by name, and a
layer-control legend toggles Heritage/Artisan/Event marker layers. Heritage
markers are placed at their real seeded coordinates and colour-coded by
Heritage Health status; artisan and event markers are approximated to their
state's centroid (real per-record geocoding is future scope, and — for
artisans — also a privacy consideration).

## 18. Heritage Health Methodology

Implemented in `backend/services/heritageRisk.service.js`. A weighted average
of six 0–100 indicators:

| Indicator | Weight |
|---|---|
| Documentation | 15% |
| Practitioner Base | 20% |
| Youth Participation | 20% |
| Practice Frequency | 15% |
| Economic Viability | 15% |
| Community Participation | 15% |

Missing indicators are excluded and the remaining weights re-normalized, so a
partially-documented tradition isn't unfairly penalized. Thresholds: **70+ →
Stable**, **40–69 → Vulnerable**, **below 40 → At Risk**. Every score ships
with a plain-language `explanation` and is labelled "prototype assessment",
never an official certification.

## 19. Verification Workflow

`backend/services/verification.service.js` defines the shared lifecycle:

```
pending → review → verified → published   (or → rejected, from any non-terminal state)
```

Every cultural record also carries a `verificationStatus` of `prototype`,
`pending`, `community_verified` or `institution_verified` (the last is not
yet implemented — future scope), rendered in the UI as a badge (✓ / ⚠ / ○).
See the in-app **Sources & Methodology** modal (on the map section) for the
full explanation shown to end users.

## 20. Security

- `helmet`, `cors` (configurable origin), `express-rate-limit` on all `/api` routes
- Centralized error handler — no stack traces leak in production
- `multer` file-type and size validation on every upload route
- Passwords hashed with `bcryptjs`; JWT auth with role-based route guards
  (`user` / `artisan` / `verifier` / `admin`)
- Secrets (`MONGO_URI`, `JWT_SECRET`, `AI_API_KEY`, `VISION_API_KEY`,
  Cloudinary credentials) live only in `backend/.env`, never in the frontend
  or in version control

## 21. Prototype Limitations

Stated plainly, per this project's own honesty requirement:

- No live connection to any government heritage database
- Map boundaries (GADM-derived) predate the 2014 Telangana bifurcation and
  the 2019 Jammu & Kashmir/Ladakh reorganisation — flagged in-app and here
- Art recognition ships with **no vision model configured** — every result
  is an explicitly-labelled deterministic demo sample, never a real image
  analysis, and never chosen at random
- Bharat AI ships with **no live model configured** by default — answers are
  grounded in the same seed data either way, but only labelled "Live" once
  `AI_API_KEY` is set
- Heritage Health and Recognition confidence are prototype estimates, not
  certified figures
- Artisan/event map markers are approximated to state centroids, not real
  per-record geocoding
- "Support Artisan" and "Contact Artisan" record an enquiry only — no real
  payment processing (explicit future scope)
- Seed artisan profiles are prototype placeholders, not verified real people

## 22. Future Scalability

- District-level GIS drill-down (the GeoJSON pipeline already supports
  swapping in a district-level dataset)
- Real vision-model integration behind `VISION_PROVIDER`/`VISION_API_KEY`
  (the service is already structured for this — see
  `recognition.service.js`)
- Institutional verification accounts (ASI, state culture departments,
  craft councils) able to grant `institution_verified` status
- Real marketplace/payment integration for artisan support
- Per-record precise geocoding for artisans and events
- Full multilingual UI translation (current build translates navigation,
  headings and key labels; full content translation is future scope)

## 23. SIH Demo Flow (~5 minutes)

| Time | Focus |
|---|---|
| 0:00–0:30 | Problem |
| 0:30–1:15 | Real GIS Heritage Map — click Jharkhand → Hazaribagh → Sohrai |
| 1:15–2:00 | AI Image Recognition — upload → analyze → result → confidence/notice → sources |
| 2:00–2:45 | Heritage Health — show a Vulnerable score and its indicators |
| 2:45–3:30 | Artisan — craft → story → Support Artisan |
| 3:30–4:15 | Community — Add Your Heritage → photo → location → submit → Pending Verification |
| 4:15–5:00 | Impact & scalability — Discover → Understand → Verify → Preserve → Support |

---

*BharatVerse is a full-stack digital heritage ecosystem prototype: Discover →
Identify → Verify → Document → Assess Risk → Preserve → Support.*
