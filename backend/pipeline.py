"""
pipeline.py — FIFA World Cup 2026 Match Collector
Fetches finished match data from BSD API → pushes to Supabase.

Usage (run from FIFA26/ folder):
  python backend/pipeline.py --cron          # Render cron: auto-detect newly finished
  python backend/pipeline.py --id 8291 8292  # Force-collect specific events
  python backend/pipeline.py --all           # Re-collect every match in Supabase
  python backend/pipeline.py --force         # Re-collect even if already finished
  python backend/pipeline.py --populate      # Fetch managers + venues from BSD → Supabase
  python backend/pipeline.py --schema        # Print SQL to run in Supabase dashboard

Requires: pip install requests python-dotenv supabase
"""

import os, sys, json, time, argparse
from pathlib import Path
from datetime import datetime, timezone

# ── .env loading — relative, no hardcoded paths ──────────────────────────────
from dotenv import load_dotenv
_HERE   = Path(__file__).resolve().parent      # FIFA26/backend/
_FIFA26 = _HERE.parent                         # FIFA26/
load_dotenv(_FIFA26 / '.env')                  # FIFA26/.env
load_dotenv(_FIFA26.parent / '.env')           # parent .env fallback
load_dotenv()                                  # cwd fallback

import requests

# ── Config ────────────────────────────────────────────────────────────────────
BSD_BASE  = 'https://sports.bzzoiro.com'
BSD_TOKEN = os.getenv('BSD_TOKEN') or os.getenv('bsd', '')
HEADERS   = {'Authorization': f'Token {BSD_TOKEN}'}
DELAY     = 0.5   # seconds between BSD API calls

# Local cache dir (development only — not required on Render)
CACHE_DIR = _FIFA26 / 'BSD' / 'completed_v2'
CACHE_DIR.mkdir(parents=True, exist_ok=True)

FINISHED = {'finished', 'ft', 'ended', 'complete', 'awarded'}

# ── Supabase ──────────────────────────────────────────────────────────────────
_pid         = os.getenv('project_id', '').strip()
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL') or (f'https://{_pid}.supabase.co' if _pid else '')
SERVICE_KEY  = os.getenv('SUPABASE_SERVICE_ROLE') or os.getenv('service_role', '').strip()

if not SUPABASE_URL or not SERVICE_KEY:
    sys.exit('ERROR: Supabase credentials missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE in .env')
if not BSD_TOKEN:
    sys.exit('ERROR: BSD_TOKEN (or bsd) missing from .env')

try:
    from supabase import create_client
except ImportError:
    sys.exit('ERROR: run  pip install supabase  first')

sb = create_client(SUPABASE_URL, SERVICE_KEY)

# ── Normalise helpers ─────────────────────────────────────────────────────────
def nv(v): s = str(v).strip() if v is not None else ''; return s or None
def ni(v): s = str(v).strip() if v is not None else ''; return int(float(s)) if s else None
def nf(v): s = str(v).strip() if v is not None else ''; return float(s) if s else None

# ── BSD API ───────────────────────────────────────────────────────────────────
def get(path: str, retries: int = 3):
    url = path if path.startswith('http') else f'{BSD_BASE}{path}'
    for attempt in range(retries):
        try:
            r = requests.get(url, headers=HEADERS, timeout=30)
            if r.status_code == 200:
                return r.json()
            print(f'    HTTP {r.status_code}: {url}')
        except Exception as e:
            print(f'    Error: {e}')
        if attempt < retries - 1:
            time.sleep(1.5)
    return None

def flatten_player_stats(raw):
    if isinstance(raw, list):
        return raw
    if isinstance(raw, dict):
        if 'home' in raw or 'away' in raw:
            home = raw.get('home') or []
            away = raw.get('away') or []
            for p in home: p.setdefault('is_home', True)
            for p in away: p.setdefault('is_home', False)
            return home + away
        for key in ('results', 'player_stats'):
            if key in raw:
                return raw[key]
    return []

# ── Populate reference tables ─────────────────────────────────────────────────
def populate_managers():
    """Fetch all WC2026 managers from BSD and upsert into the managers table."""
    print('\n  Fetching managers from BSD …')
    data = get(f'/api/v2/managers/?league_id=27&season_id=188')
    if not data:
        print('    FAILED: cannot reach managers endpoint'); return
    results = data.get('results', []) if isinstance(data, dict) else data
    print(f'  {len(results)} manager(s) returned')
    rows = []
    for m in results:
        rows.append({
            'id':                ni(m.get('id')),
            'name':              nv(m.get('name')),
            'short_name':        nv(m.get('short_name')),
            'nationality':       nv(m.get('country')),
            'tactical_profile':  nv(m.get('tactical_profile')),
            'preferred_formation': nv(m.get('preferred_formation')),
            'current_team_id':   ni(m.get('current_team_id')),
            'career_matches':    ni(m.get('matches_total')),
            'career_wins':       ni(m.get('wins')),
            'career_draws':      ni(m.get('draws')),
            'career_losses':     ni(m.get('losses')),
            'win_rate':          nf(m.get('win_pct')),
            'avg_goals_scored':  nf(m.get('avg_goals_scored')),
            'avg_goals_conceded': nf(m.get('avg_goals_conceded')),
            'updated_at':        nv(m.get('stats_updated_at')),
        })
    if rows:
        upsert('managers', rows, 'id', label='(WC2026 managers)')
    return len(rows)


def populate_venues():
    """Fetch each venue referenced in matches from BSD and upsert into venues table."""
    print('\n  Fetching distinct venue_ids from Supabase …')
    res = sb.table('matches').select('venue_id').execute()
    ids = {r['venue_id'] for r in (res.data or []) if r.get('venue_id')}
    print(f'  {len(ids)} unique venue_id(s)')
    rows = []
    for vid in sorted(ids):
        v = get(f'/api/v2/venues/{vid}/')
        if not v:
            print(f'    SKIP venue {vid}: not found'); continue
        rows.append({
            'id':         ni(v.get('id')),
            'name':       nv(v.get('name')),
            'city':       nv(v.get('city')),
            'country':    nv(v.get('country')),
            'capacity':   ni(v.get('capacity')),
            'latitude':   nf(v.get('latitude')),
            'longitude':  nf(v.get('longitude')),
            'built_year': ni(v.get('built_year')),
        })
        print(f'    {vid}: {v.get("name")}, {v.get("city")} (cap {v.get("capacity")})')
        time.sleep(DELAY)
    if rows:
        upsert('venues', rows, 'id', label='(WC2026 venues)')
    return len(rows)


# ── Supabase upsert helper ────────────────────────────────────────────────────
def upsert(table: str, rows: list, on_conflict: str, label: str = ''):
    if not rows:
        return
    try:
        sb.table(table).upsert(rows, on_conflict=on_conflict).execute()
        print(f'    OK  {table} — {len(rows)} row(s) {label}')
    except Exception as e:
        print(f'    ERR {table} — {e}')

# ── Collect one event from BSD API → Supabase ─────────────────────────────────
def collect_event(event_id: int, force: bool = False, save_local: bool = True) -> bool:
    print(f'\n  [{event_id}] fetching detail …')

    detail = get(f'/api/v2/events/{event_id}/')
    if not detail:
        print(f'    FAILED: cannot reach BSD API'); return False

    status   = (detail.get('status') or '').lower()
    home     = detail.get('home_team', '?')
    away     = detail.get('away_team', '?')
    hs, as_  = detail.get('home_score', '?'), detail.get('away_score', '?')
    print(f'    {home} {hs}-{as_} {away}  |  status: {status}')

    if status not in FINISHED and not force:
        print(f'    SKIP: not finished yet'); return False

    # ── Optional local cache ──
    out_dir = CACHE_DIR / f'event_{event_id}'
    if save_local:
        out_dir.mkdir(exist_ok=True)
        (out_dir / 'detail.json').write_text(
            json.dumps(detail, ensure_ascii=False, indent=2), encoding='utf-8')

    # ── Resolve home/away IDs ──
    home_id = ni(detail.get('home_team_id') or (detail.get('home_team_obj') or {}).get('id'))
    away_id = ni(detail.get('away_team_id') or (detail.get('away_team_obj') or {}).get('id'))

    # Venue + referee come directly from BSD detail
    venue = detail.get('venue') or {}
    ref   = detail.get('referee') or {}
    if isinstance(ref, str):
        ref = {'name': ref}
    weather = detail.get('weather') or {}

    # Coach IDs — BSD returns home_coach_id / away_coach_id as top-level ints
    home_coach_id = ni(detail.get('home_coach_id'))
    away_coach_id = ni(detail.get('away_coach_id'))

    # Coach name objects (fallback if BSD ever returns name directly)
    home_coach = detail.get('home_coach') or {}
    away_coach = detail.get('away_coach') or {}
    if isinstance(home_coach, str): home_coach = {'name': home_coach}
    if isinstance(away_coach, str): away_coach = {'name': away_coach}

    # ── 1. matches ──
    db_status = 'finished' if status in FINISHED else status

    match_row = {
        'id':               event_id,
        'event_date':       detail.get('event_date'),
        'status':           db_status,
        'round_name':       nv(detail.get('round_name')),
        'round_number':     ni(detail.get('round_number')),
        'group_name':       nv(detail.get('group_name')),
        'home_team_id':     home_id,
        'home_team_name':   nv(detail.get('home_team')),
        'away_team_id':     away_id,
        'away_team_name':   nv(detail.get('away_team')),
        'home_score':       ni(detail.get('home_score')),
        'away_score':       ni(detail.get('away_score')),
        'home_score_ht':    ni(detail.get('home_score_ht')),
        'away_score_ht':    ni(detail.get('away_score_ht')),
        'home_xg':          nf(detail.get('actual_home_xg') or detail.get('home_xg_live')),
        'away_xg':          nf(detail.get('actual_away_xg') or detail.get('away_xg_live')),
        'venue_id':         ni(venue.get('id') or detail.get('venue_id')),
        'venue_name':       nv(venue.get('name') or detail.get('venue_name')),
        'venue_city':       nv(venue.get('city') or detail.get('venue_city')),
        'referee_id':       ni(ref.get('id') or detail.get('referee_id')),
        'referee_name':     nv(ref.get('name') or detail.get('referee_name')),
        'home_coach':       nv(home_coach.get('name')),
        'away_coach':       nv(away_coach.get('name')),
        'home_coach_id':    home_coach_id,
        'away_coach_id':    away_coach_id,
        'attendance':       ni(detail.get('attendance')),
        'temperature_c':    nf(weather.get('temperature_c') or detail.get('temperature_c')),
        'wind_speed':       nf(weather.get('wind_speed') or detail.get('wind_speed')),
    }
    def _upsert_match(row):
        try:
            sb.table('matches').upsert([row], on_conflict='id').execute()
            print(f'    OK  matches — 1 row(s)')
            return
        except Exception as e:
            es = str(e)
            # PostgREST schema cache hasn't picked up new columns yet — strip them and retry
            if 'PGRST204' in es or 'home_coach_id' in es or 'away_coach_id' in es:
                row = {k: v for k, v in row.items() if k not in ('home_coach_id', 'away_coach_id')}
                try:
                    sb.table('matches').upsert([row], on_conflict='id').execute()
                    print(f'    OK  matches — 1 row(s) (coach_id cols not in cache yet)')
                    return
                except Exception as e2:
                    es = str(e2)
            if '23503' in es or 'referee_id' in es:
                row['referee_id'] = None
                try:
                    sb.table('matches').upsert([row], on_conflict='id').execute()
                    print(f'    OK  matches — 1 row(s) (referee_id cleared)')
                    return
                except Exception as e3:
                    print(f'    ERR matches — {e3}')
            else:
                print(f'    ERR matches — {es}')

    _upsert_match(dict(match_row))
    time.sleep(DELAY)

    # ── 2. player_match_stats ──
    print(f'    fetching player stats …')
    raw_ps = get(f'/api/v2/events/{event_id}/player-stats/') or \
             get(f'/api/v2/events/{event_id}/player_stats/')
    players = flatten_player_stats(raw_ps)
    print(f'    {len(players)} players')

    if save_local and players:
        (out_dir / 'player_stats.json').write_text(
            json.dumps({'event_id': event_id, 'player_stats': players}, ensure_ascii=False, indent=2),
            encoding='utf-8')

    ps_rows = []
    for p in players:
        pid = ni(p.get('player_id') or p.get('id'))
        if not pid:
            continue
        team_id = ni(p.get('team_id')) or (home_id if p.get('is_home') else away_id)
        ps_rows.append({
            'event_id':            event_id,
            'player_id':           pid,
            'team_id':             team_id,
            'player_name':         nv(p.get('player_name') or p.get('name')),
            'team_name':           nv(p.get('team_name') or p.get('team')),
            'position':            nv(p.get('position') or p.get('specific_position')),
            'rating':              nf(p.get('rating')),
            'minutes_played':      ni(p.get('minutes_played')),
            'goals':               ni(p.get('goals')),
            'goal_assist':         ni(p.get('goal_assist') or p.get('assists')),
            'expected_goals':      nf(p.get('expected_goals')),
            'expected_assists':    nf(p.get('expected_assists')),
            'total_shots':         ni(p.get('total_shots')),
            'shots_on_target':     ni(p.get('shots_on_target')),
            'total_pass':          ni(p.get('total_pass')),
            'accurate_pass':       ni(p.get('accurate_pass')),
            'key_pass':            ni(p.get('key_pass')),
            'total_cross':         ni(p.get('total_cross')),
            'accurate_cross':      ni(p.get('accurate_cross')),
            'total_long_balls':    ni(p.get('total_long_balls')),
            'accurate_long_balls': ni(p.get('accurate_long_balls')),
            'dribble_attempted':   ni(p.get('dribble_attempted') or p.get('total_contest')),
            'dribble_won':         ni(p.get('dribble_won') or p.get('won_contest')),
            'duel_won':            ni(p.get('duel_won')),
            'duel_lost':           ni(p.get('duel_lost')),
            'won_tackle':          ni(p.get('won_tackle')),
            'total_tackle':        ni(p.get('total_tackle')),
            'interception':        ni(p.get('interception')),
            'total_clearance':     ni(p.get('total_clearance')),
            'fouls':               ni(p.get('fouls')),
            'was_fouled':          ni(p.get('was_fouled')),
            'yellow_card':         ni(p.get('yellow_card')),
            'red_card':            ni(p.get('red_card')),
            'saves':               ni(p.get('saves')),
            'goals_conceded':      ni(p.get('goals_conceded')),
            'touches':             ni(p.get('touches')),
            'ball_recovery':       ni(p.get('ball_recovery')),
        })

    if ps_rows:
        for i in range(0, len(ps_rows), 50):
            upsert('player_match_stats', ps_rows[i:i+50], 'event_id,player_id')
    time.sleep(DELAY)

    # ── 3. match_bsd_stats ──
    print(f'    fetching BSD stats …')
    bsd_raw = get(f'/api/v2/events/{event_id}/stats/') or {}
    inner   = bsd_raw.get('stats') or {}
    # Unwrap double-nested stats if needed
    if isinstance(inner.get('stats'), dict):
        inner = inner['stats']

    shotmap  = bsd_raw.get('shotmap')  or get(f'/api/v2/events/{event_id}/shotmap/')  or []
    time.sleep(DELAY)
    xg       = bsd_raw.get('xg_per_minute') or get(f'/api/v2/events/{event_id}/xg/') or []
    time.sleep(DELAY)
    momentum = bsd_raw.get('momentum') or get(f'/api/v2/events/{event_id}/momentum/') or []
    time.sleep(DELAY)
    avg_pos  = bsd_raw.get('average_positions') or get(f'/api/v2/events/{event_id}/average_positions/') or {}

    if save_local:
        (out_dir / 'bsd_stats.json').write_text(
            json.dumps({'event_id': event_id, 'stats': inner, 'shotmap': shotmap,
                        'xg_per_minute': xg, 'momentum': momentum, 'average_positions': avg_pos},
                       ensure_ascii=False, indent=2), encoding='utf-8')

    if inner.get('home') or inner.get('away') or shotmap:
        upsert('match_bsd_stats', [{
            'event_id':          event_id,
            'stats':             inner or None,
            'shotmap':           shotmap,
            'average_positions': avg_pos,
            'xg_per_minute':     xg,
            'momentum':          momentum,
        }], 'event_id')
    else:
        print(f'    SKIP match_bsd_stats (no data)')
    time.sleep(DELAY)

    # ── 4. incidents (save locally; push to Supabase if table exists) ──
    print(f'    fetching incidents …')
    inc_raw  = get(f'/api/v2/events/{event_id}/incidents/') or {}
    inc_list = inc_raw if isinstance(inc_raw, list) else inc_raw.get('incidents', [])
    print(f'    {len(inc_list)} incidents')

    if save_local and inc_list:
        (out_dir / 'incidents.json').write_text(
            json.dumps(inc_raw, ensure_ascii=False, indent=2), encoding='utf-8')
    time.sleep(DELAY)

    # ── 5. lineups (save locally; push to Supabase if table exists) ──
    print(f'    fetching lineups …')
    lineups_raw = get(f'/api/v2/events/{event_id}/lineups/') or {}
    if save_local and lineups_raw:
        (out_dir / 'lineups.json').write_text(
            json.dumps(lineups_raw, ensure_ascii=False, indent=2), encoding='utf-8')
    time.sleep(DELAY)

    print(f'    DONE {home} {hs}-{as_} {away}')
    return True


# ── Cron mode: query Supabase → process newly finished ───────────────────────
def run_cron():
    print(f'[{datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")}] Cron run started')

    collected = 0

    # Step 1: check BSD live endpoint for just-finished matches
    print('\n  Checking BSD live endpoint …')
    live_data   = get('/api/v2/events/live/?league_id=27&season_id=188') or {}
    live_events = live_data.get('events', [])
    print(f'  {len(live_events)} live event(s) from BSD')

    for ev in live_events:
        if (ev.get('status') or '').lower() in FINISHED:
            if collect_event(ev['id'], save_local=True):
                collected += 1

    # Step 2: query Supabase for non-finished matches that should be done by now
    print('\n  Querying Supabase for pending matches …')
    res = sb.table('matches') \
            .select('id, status, home_team_name, away_team_name, event_date') \
            .neq('status', 'finished') \
            .execute()

    pending = res.data or []
    print(f'  {len(pending)} pending match(es) in Supabase')

    now_ts = datetime.now(timezone.utc).timestamp()
    for row in pending:
        # Only attempt matches scheduled more than 100 minutes ago
        try:
            kick = datetime.fromisoformat(row['event_date'].replace('Z', '+00:00')).timestamp()
        except Exception:
            kick = 0
        if now_ts - kick < 100 * 60:
            continue  # too soon, skip
        if collect_event(row['id'], save_local=True):
            collected += 1
        time.sleep(0.3)

    print(f'\nCron done. Collected {collected} event(s).')
    return collected


# ── Serve mode: long-running web service for Render free tier ────────────────
def run_serve(interval: int = 300):
    """
    Starts a background scheduler loop that calls run_cron() every `interval`
    seconds, plus a minimal HTTP server on $PORT so Render keeps the service
    alive and UptimeRobot can ping it.

    UptimeRobot: add an HTTP monitor pointing to your Render service URL,
    ping every 5 minutes — this prevents the free instance from spinning down.
    """
    import threading
    import http.server

    last_run: dict = {'time': 'never', 'collected': 0}

    def scheduler():
        while True:
            try:
                print(f'\n[scheduler] Starting collection …')
                n = run_cron()
                last_run['time'] = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')
                last_run['collected'] = n
            except Exception as e:
                print(f'[scheduler] ERROR: {e}')
            print(f'[scheduler] Sleeping {interval}s until next run …\n')
            time.sleep(interval)

    thread = threading.Thread(target=scheduler, daemon=True)
    thread.start()
    print(f'[serve] Scheduler started — interval={interval}s')

    # Minimal HTTP health-check server
    class HealthHandler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            body = (
                f'FIFA WC 2026 Collector — OK\n'
                f'Last run: {last_run["time"]}\n'
                f'Collected this run: {last_run["collected"]}\n'
            ).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        def log_message(self, *args):
            pass  # silence access logs

    port = int(os.getenv('PORT', '8000'))
    server = http.server.HTTPServer(('0.0.0.0', port), HealthHandler)
    print(f'[serve] Health check listening on port {port}')
    print(f'[serve] Add this URL to UptimeRobot to keep the service alive\n')
    server.serve_forever()


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description='FIFA WC 2026 — BSD → Supabase match pipeline')
    parser.add_argument('--serve',    action='store_true', help='Web service mode: runs scheduler loop + HTTP health check (for Render free tier)')
    parser.add_argument('--interval', type=int, default=300, help='Seconds between collection runs in --serve mode (default: 300)')
    parser.add_argument('--cron',     action='store_true', help='Single cron run: auto-detect + collect newly finished matches')
    parser.add_argument('--id',       type=int, nargs='+', help='Collect specific event ID(s)')
    parser.add_argument('--all',      action='store_true', help='Re-collect all matches in Supabase')
    parser.add_argument('--force',    action='store_true', help='Re-collect even if already finished in Supabase')
    parser.add_argument('--populate', action='store_true', help='Fetch all WC2026 managers + venues from BSD → Supabase reference tables')
    parser.add_argument('--schema',   action='store_true', help='Print SQL to run in Supabase dashboard to add coach ID columns')
    args = parser.parse_args()

    print(f'Supabase: {SUPABASE_URL}')
    print(f'BSD API:  {BSD_BASE}\n')

    if args.schema:
        print("-- Run this SQL in your Supabase dashboard (SQL Editor):\n")
        print("ALTER TABLE matches ADD COLUMN IF NOT EXISTS home_coach_id INTEGER REFERENCES managers(id);")
        print("ALTER TABLE matches ADD COLUMN IF NOT EXISTS away_coach_id INTEGER REFERENCES managers(id);")
        print()
        print("-- FK from venue_id to venues (needed for PostgREST join in frontend)")
        print("ALTER TABLE matches ADD CONSTRAINT IF NOT EXISTS fk_matches_venue")
        print("  FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE SET NULL;")
        return

    if args.populate:
        m = populate_managers()
        v = populate_venues()
        print(f'\nPopulate done — {m} manager(s), {v} venue(s) upserted.')
        return

    if args.serve:
        run_serve(interval=args.interval)
        return  # blocks forever

    if args.cron:
        run_cron()
        return

    if args.id:
        for eid in args.id:
            print(f'\n{"="*52}')
            collect_event(eid, force=args.force, save_local=True)
        return

    if args.all:
        res = sb.table('matches').select('id, home_team_name, away_team_name').execute()
        rows = res.data or []
        print(f'Re-collecting {len(rows)} match(es) from Supabase …')
        for row in rows:
            collect_event(row['id'], force=True, save_local=True)
            time.sleep(0.3)
        return

    parser.print_help()


if __name__ == '__main__':
    main()
