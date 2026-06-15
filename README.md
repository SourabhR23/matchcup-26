# FIFA World Cup 2026 — Live Dashboard

A real-time football dashboard for the FIFA World Cup 2026, covering all 104 matches across the Group Stage, Round of 32, Round of 16, Quarterfinals, Semifinals, and the Final.

---

## What It Shows

### Homepage — Tournament Overview
- **Tournament at a glance** — 48 nations, 12 groups, 104 matches, 16 stadiums
- **Live matches** — any match currently in play, with live score and match minute
- **Recent results** — last completed matches with final scores
- **Upcoming matches** — next scheduled fixtures with kickoff times and venues
- **All 48 nations** — every participating team with their group

### Matches Page
- Full schedule of all 104 matches across every stage
- Filter by stage: Group Stage · Round of 32 · Round of 16 · Quarterfinal · Semifinal · Final
- Matches grouped by calendar date
- Live matches auto-update every 30 seconds — no page refresh needed
- Each match shows: teams, score, kickoff time, venue city, referee

### Match Detail Page
- Full-time and half-time score
- **Incident timeline** — goals, cards, substitutions with exact minute
- **Starting lineups** and formations for both teams
- **Player ratings** and individual match statistics (passes, shots, tackles, etc.)
- **Head-to-head** history between the two teams
- **Match predictions** — win probabilities and expected goals before kickoff

### Groups Page
- Live standings for all 12 groups (A through L)
- Each group table shows: played, won, drawn, lost, goals for/against, goal difference, points
- Top 2 teams from each group advance to the Round of 32

### Teams Page
- Individual page for each of the 48 nations
- Squad roster with player positions and jersey numbers

### Players Page
- Individual player profile — club, nationality, age, position
- Tournament stats where available

---

## How It Works

```
Live Football API
      ↓  (real-time)
  Backend (Python)  ──→  Supabase DB
      ↓  (REST)               ↑
  Frontend (Next.js)    (writes on FT)
```

**Live matches** — the backend polls the live football data API during active match windows. The frontend calls the backend every 30 seconds and merges live scores into the schedule.

**Completed matches** — as soon as a match ends (`status: finished`), the backend detects it and writes the full match record — scores, player stats, incidents, lineups — to Supabase. The frontend then reads completed data directly from Supabase.

**Upcoming matches** — fetched from the API on demand. No database storage needed.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| Backend | Python, FastAPI |
| Database | Supabase (PostgreSQL) |
| Deployment | Render (frontend + backend as separate web services) |

---

## Project Structure

```
FIFA26/
├── frontend/               ← Next.js application
│   ├── app/                ← Pages and API routes
│   │   ├── page.tsx        ← Homepage (overview)
│   │   ├── matches/        ← All matches + match detail
│   │   ├── groups/         ← Group standings
│   │   ├── teams/          ← Team pages
│   │   ├── players/        ← Player profiles
│   │   └── api/            ← Internal API routes (live, events, predictions)
│   ├── components/         ← UI components
│   └── lib/                ← Data utilities, Supabase client, types
├── backend/
│   ├── collect_completed.py  ← Detects finished matches, writes to Supabase
│   ├── setup_supabase.py     ← One-time DB setup helper
│   ├── schema.sql            ← Database schema
│   └── requirements.txt
├── .env.example            ← Environment variable template
└── .gitignore
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```
FOOTBALL_API_KEY=        # Live data API token
SUPABASE_URL=            # Supabase project URL
SUPABASE_SERVICE_KEY=    # Supabase service role key (backend only)
NEXT_PUBLIC_SUPABASE_URL=       # Supabase URL (frontend)
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase anon key (frontend)
NEXT_PUBLIC_BACKEND_URL=        # Backend service URL
```

---

## Running Locally

**Frontend**
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

**Backend**
```bash
cd backend
pip install -r requirements.txt
python collect_completed.py --live
```

---

## Deployment on Render

Two services in the same GitHub repo:

| Service | Root Directory | Build Command | Start Command |
|---|---|---|---|
| Frontend | `frontend/` | `npm install && npm run build` | `npm start` |
| Backend | `backend/` | `pip install -r requirements.txt` | `uvicorn main:app --host 0.0.0.0 --port 8000` |

Set all environment variables in each service's Render dashboard.
