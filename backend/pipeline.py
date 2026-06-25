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

# BSD league_id + season_id → human-readable competition name
COMPETITION_MAP: dict = {
    (27, 188): 'World Cup 2026',
    (27, 189): 'World Cup 2022',
    (27, 381): 'World Cup 2014',
    (27, 382): 'World Cup 2018',
    (31, None): 'Friendly',
    (65, None): 'Nations League',
    (67, None): 'Gold Cup 2024',
    (69, None): 'Gold Cup 2025',
}

def get_competition_name(league_id, season_id):
    if league_id is None:
        return 'Unknown'
    key = (league_id, season_id)
    if key in COMPETITION_MAP:
        return COMPETITION_MAP[key]
    league_key = (league_id, None)
    if league_key in COMPETITION_MAP:
        return COMPETITION_MAP[league_key]
    if league_id == 27:
        return 'World Cup'
    if league_id == 31:
        return 'Friendly'
    return f'League {league_id}'

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


def populate_referees():
    """Fetch WC2026 referees from BSD → upsert referees table → backfill matches.referee_name."""
    print('\n  Fetching referees from BSD (league_id=27, season_id=188) ...')
    data = get('/api/v2/referees/?league_id=27&season_id=188')
    if not data:
        print('    FAILED: cannot reach referees endpoint'); return 0
    results = data.get('results', []) if isinstance(data, dict) else data
    print(f'  {len(results)} referee(s) in bulk response')

    def _ref_row(r):
        return {
            'id':                  ni(r.get('id')),
            'name':                nv(r.get('name')),
            'country':             nv(r.get('country')),
            'birthdate':           nv(r.get('birthdate')) or None,
            'nationality_a3':      nv(r.get('nationality_a3') or r.get('alpha3')),
            'career_games':        ni(r.get('career_games') or r.get('matches_total') or r.get('total_matches')),
            'career_yellow_cards': ni(r.get('career_yellow_cards') or r.get('yellow_cards') or r.get('total_yellow_cards')),
            'career_red_cards':    ni(r.get('career_red_cards') or r.get('red_cards') or r.get('total_red_cards')),
        }

    rows = [_ref_row(r) for r in results if ni(r.get('id'))]
    if rows:
        upsert('referees', rows, 'id', label='(WC2026 referees bulk)')

    # Find referee IDs used in matches but not returned by bulk endpoint
    existing_ids = {row['id'] for row in rows}
    match_ids_res = sb.table('matches').select('referee_id').not_.is_('referee_id', 'null').execute()
    match_ref_ids = {r['referee_id'] for r in (match_ids_res.data or []) if r.get('referee_id')}
    missing_ids = match_ref_ids - existing_ids
    if missing_ids:
        print(f'  {len(missing_ids)} referee ID(s) missing from bulk — fetching individually ...')
        for rid in sorted(missing_ids):
            rdata = get(f'/api/v2/referees/{rid}/')
            if not rdata or not isinstance(rdata, dict):
                print(f'    SKIP {rid}: not found on BSD'); continue
            row = _ref_row(rdata)
            row['id'] = row['id'] or rid
            if row['name']:
                upsert('referees', [row], 'id', label=f'({rid})')
                print(f'    {rid}: {row["name"]}')
            time.sleep(DELAY)

    # Backfill matches.referee_name from referees table (denorm text fallback)
    all_refs = sb.table('referees').select('id,name').execute().data or []
    ref_map = {r['id']: r['name'] for r in all_refs if r.get('name')}
    updated = 0
    for rid, name in ref_map.items():
        try:
            sb.table('matches').update({'referee_name': name}).eq('referee_id', rid).execute()
            updated += 1
        except Exception as e:
            print(f'    ERR matches referee_name {rid}: {e}')
        time.sleep(0.05)
    print(f'    Backfilled referee_name in matches for {updated} referee(s)')
    return len(rows) + len(missing_ids)


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


def backfill_local():
    """Read all BSD/completed_v2/event_*/detail.json files and upsert into matches (no API calls)."""
    event_dirs = sorted(CACHE_DIR.glob('event_*/detail.json'))
    print(f'\n  backfill_local: {len(event_dirs)} local detail.json files found')
    rows = []
    for path in event_dirs:
        try:
            detail = json.loads(path.read_text(encoding='utf-8'))
        except Exception as e:
            print(f'    SKIP {path}: {e}'); continue
        eid = ni(detail.get('id'))
        if not eid:
            continue
        home_id = ni(detail.get('home_team_id'))
        away_id = ni(detail.get('away_team_id'))
        venue   = detail.get('venue') or {}
        ref     = detail.get('referee') or {}
        if isinstance(ref, str): ref = {'name': ref}
        weather = detail.get('weather') or {}
        home_coach = detail.get('home_coach') or {}
        away_coach = detail.get('away_coach') or {}
        if isinstance(home_coach, str): home_coach = {'name': home_coach}
        if isinstance(away_coach, str): away_coach = {'name': away_coach}
        status = (detail.get('status') or '').lower()
        db_status = 'finished' if status in FINISHED else status
        rows.append({
            'id':                  eid,
            'event_date':          detail.get('event_date'),
            'status':              db_status,
            'round_name':          nv(detail.get('round_name')),
            'round_number':        ni(detail.get('round_number')),
            'group_name':          nv(detail.get('group_name')),
            'home_team_id':        home_id,
            'home_team_name':      nv(detail.get('home_team')),
            'away_team_id':        away_id,
            'away_team_name':      nv(detail.get('away_team')),
            'home_score':          ni(detail.get('home_score')),
            'away_score':          ni(detail.get('away_score')),
            'home_score_ht':       ni(detail.get('home_score_ht')),
            'away_score_ht':       ni(detail.get('away_score_ht')),
            'venue_id':            ni(venue.get('id') or detail.get('venue_id')),
            'venue_name':          nv(venue.get('name') or detail.get('venue_name')),
            'venue_city':          nv(venue.get('city') or detail.get('venue_city')),
            'referee_id':          ni(ref.get('id') or detail.get('referee_id')),
            'referee_name':        nv(ref.get('name') or detail.get('referee_name')),
            'home_coach':          nv(home_coach.get('name')),
            'away_coach':          nv(away_coach.get('name')),
            'home_coach_id':       ni(detail.get('home_coach_id')),
            'away_coach_id':       ni(detail.get('away_coach_id')),
            'period':              nv(detail.get('period')),
            'current_minute':      ni(detail.get('current_minute')),
            'attendance':          ni(detail.get('attendance')),
            'temperature_c':       nf(weather.get('temperature_c') or detail.get('temperature_c')),
            'wind_speed':          nf(weather.get('wind_speed') or detail.get('wind_speed')),
            'weather_code':        ni(weather.get('code')),
            'weather_description': nv(weather.get('description')),
            'pitch_condition':     ni(detail.get('pitch_condition')),
            'is_local_derby':      bool(detail.get('is_local_derby', False)),
            'is_neutral_ground':   bool(detail.get('is_neutral_ground', False)),
            'penalty_shootout':    detail.get('penalty_shootout') or None,
            'extra_time_score':    nv(detail.get('extra_time_score')),
            'h2h_data':            detail.get('head_to_head') or None,
            'highlights':          detail.get('highlights') or None,
        })
    if not rows:
        print('  Nothing to upsert.'); return 0
    # Batch upsert in chunks of 50
    chunk = 50
    for i in range(0, len(rows), chunk):
        batch = rows[i:i+chunk]
        try:
            sb.table('matches').upsert(batch, on_conflict='id').execute()
            print(f'    OK  matches — rows {i+1}–{i+len(batch)}')
        except Exception as e:
            print(f'    ERR batch {i}: {e}')
    return len(rows)


def backfill_player_stats():
    """Read all local BSD/completed_v2/event_*/player_stats.json and upsert into player_match_stats."""
    KEEP = {
        'player_id', 'event_id', 'player_name', 'team_id', 'team_name', 'rating', 'minutes_played', 'touches',
        'goals', 'goal_assist', 'expected_goals', 'expected_assists',
        'total_shots', 'shots_on_target', 'key_pass',
        'total_pass', 'accurate_pass', 'total_long_balls', 'accurate_long_balls',
        'total_cross', 'accurate_cross', 'total_contest', 'won_contest',
        'duel_won', 'duel_lost', 'aerial_won', 'aerial_lost',
        'total_tackle', 'won_tackle', 'total_clearance', 'interception',
        'ball_recovery', 'blocked_scoring_attempt', 'dispossessed', 'possession_lost',
        'was_fouled', 'fouls', 'yellow_card', 'red_card',
        'saves', 'goals_conceded', 'punches',
    }

    def _upsert_rows(rows):
        """Upsert a batch; on FK violation fall back to row-by-row skipping unknown players."""
        try:
            sb.table('player_match_stats').upsert(rows, on_conflict='event_id,player_id').execute()
            return len(rows)
        except Exception as e:
            if '23503' not in str(e):
                raise
        # FK violation — insert one by one, skip rows whose player_id isn't in players table
        ok = 0
        for row in rows:
            try:
                sb.table('player_match_stats').upsert([row], on_conflict='event_id,player_id').execute()
                ok += 1
            except Exception as e2:
                if '23503' in str(e2):
                    print(f'      SKIP player_id={row.get("player_id")} not in players table')
                else:
                    print(f'      ERR player_id={row.get("player_id")}: {e2}')
        return ok

    stat_files = sorted(CACHE_DIR.glob('event_*/player_stats.json'))
    print(f'\n  backfill_player_stats: {len(stat_files)} player_stats.json files found')
    total = 0
    for path in stat_files:
        try:
            data = json.loads(path.read_text(encoding='utf-8'))
            players = data.get('player_stats') or (data if isinstance(data, list) else [])
            if not players:
                continue
            rows = [{k: v for k, v in p.items() if k in KEEP} for p in players if p.get('player_id')]
            for i in range(0, len(rows), 50):
                total += _upsert_rows(rows[i:i+50])
        except Exception as e:
            print(f'    ERR {path}: {e}')
    print(f'  done — {total} player-stat rows upserted')
    return total


def backfill_venue_names():
    """Copy venue name/city from venues table into matches.venue_name / venue_city."""
    print('\n  backfill_venue_names …')
    venues_data = sb.table('venues').select('id,name,city').execute().data or []
    vid_map = {v['id']: v for v in venues_data}
    print(f'    {len(vid_map)} venues in reference table')
    matches = sb.table('matches').select('id,venue_id,venue_name').execute().data or []
    updated = 0
    for row in matches:
        vid = row.get('venue_id')
        if not vid or row.get('venue_name'):
            continue
        v = vid_map.get(vid)
        if not v:
            continue
        sb.table('matches').update({'venue_name': v['name'], 'venue_city': v.get('city')}).eq('id', row['id']).execute()
        updated += 1
        time.sleep(0.05)
    print(f'    Updated venue_name/city for {updated} match(es)')
    return updated


def backfill_coach_names():
    """Copy coach name from managers table into matches.home_coach / away_coach text columns."""
    print('\n  backfill_coach_names …')
    mgr_data = sb.table('managers').select('id,name').execute().data or []
    mgr_map = {m['id']: m['name'] for m in mgr_data}
    print(f'    {len(mgr_map)} managers in reference table')
    # Find coach IDs that are missing from managers and fetch them individually
    matches = sb.table('matches').select('id,home_coach_id,away_coach_id,home_coach,away_coach').execute().data or []
    missing_ids = set()
    for row in matches:
        for cid_key in ('home_coach_id', 'away_coach_id'):
            cid = row.get(cid_key)
            if cid and cid not in mgr_map:
                missing_ids.add(cid)
    for cid in sorted(missing_ids):
        print(f'    fetching missing manager {cid} from BSD …')
        data = get(f'/api/v2/managers/{cid}/')
        name = nv((data or {}).get('name'))
        if name:
            mgr_map[cid] = name
            sb.table('managers').upsert([{'id': cid, 'name': name}], on_conflict='id').execute()
        time.sleep(DELAY)
    updated = 0
    for row in matches:
        updates = {}
        hcid = row.get('home_coach_id')
        acid = row.get('away_coach_id')
        if hcid and hcid in mgr_map and not row.get('home_coach'):
            updates['home_coach'] = mgr_map[hcid]
        if acid and acid in mgr_map and not row.get('away_coach'):
            updates['away_coach'] = mgr_map[acid]
        if updates:
            sb.table('matches').update(updates).eq('id', row['id']).execute()
            updated += 1
            time.sleep(0.05)
    print(f'    Updated home_coach/away_coach for {updated} match(es)')
    return updated


def backfill_missing_referees():
    """Fetch individual referee records from BSD for any match with referee_id but NULL referee_name."""
    print('\n  backfill_missing_referees …')
    res = sb.table('matches').select('referee_id').is_('referee_name', 'null').execute().data or []
    missing = {r['referee_id'] for r in res if r.get('referee_id')}
    print(f'    {len(missing)} unique referee ID(s) with NULL name')
    fixed = 0
    for rid in sorted(missing):
        data = get(f'/api/v2/referees/{rid}/')
        name = nv((data or {}).get('name')) if isinstance(data, dict) else None
        if name:
            sb.table('matches').update({'referee_name': name}).eq('referee_id', rid).execute()
            print(f'    {rid}: {name}')
            fixed += 1
        else:
            print(f'    {rid}: not found on BSD')
        time.sleep(DELAY)
    print(f'    Fixed referee_name for {fixed} referee(s)')
    return fixed


def verify_coaches():
    """Cross-check coaches table vs managers table — print mismatches."""
    print('\n  verify_coaches …')
    try:
        coaches_data = sb.table('coaches').select('*').execute().data or []
    except Exception as e:
        print(f'    coaches table error: {e}'); return
    mgr_data = sb.table('managers').select('id,name').execute().data or []
    mgr_map = {m['id']: m['name'] for m in mgr_data}
    print(f'    coaches table: {len(coaches_data)} rows')
    print(f'    managers table: {len(mgr_map)} rows')
    if not coaches_data:
        print('    coaches table is empty — safe to ignore'); return
    mismatches = []
    missing_from_managers = []
    for c in coaches_data:
        cid = c.get('id') or c.get('coach_id')
        cname = c.get('name') or c.get('coach_name') or ''
        if cid not in mgr_map:
            missing_from_managers.append((cid, cname))
        elif mgr_map[cid] != cname and cname:
            mismatches.append((cid, cname, mgr_map[cid]))
    if missing_from_managers:
        print(f'\n    IDs in coaches but NOT in managers ({len(missing_from_managers)}):')
        for cid, cname in missing_from_managers:
            print(f'      id={cid} name={cname}')
    if mismatches:
        print(f'\n    Name mismatches ({len(mismatches)}):')
        for cid, c_name, m_name in mismatches:
            print(f'      id={cid}  coaches={c_name!r}  managers={m_name!r}')
    if not missing_from_managers and not mismatches:
        print('    coaches table is a clean subset of managers — safe to ignore')


# ── team_form helpers ─────────────────────────────────────────────────────────
def _extract_side_stats(side: dict, team_score, opp_score, is_finished: bool) -> dict:
    """Pull display stats from one side of a BSD stats response."""
    xg_raw = side.get('xg') or {}
    xg = nf(xg_raw.get('actual') if isinstance(xg_raw, dict) else xg_raw) or nf(side.get('expected_goals'))
    result = None
    if is_finished and team_score is not None and opp_score is not None:
        result = 'W' if team_score > opp_score else ('L' if team_score < opp_score else 'D')
    return {
        'result':          result,
        'possession':      ni(side.get('ball_possession')),
        'shots':           ni(side.get('total_shots')),
        'shots_on_target': ni(side.get('shots_on_target')),
        'xg':              xg,
        'corners':         ni(side.get('corner_kicks')),
        'yellow_cards':    ni(side.get('yellow_cards')),
        'red_cards':       ni(side.get('red_cards')),
        'pass_accuracy':   nf(side.get('pass_accuracy_pct')),
        'big_chances':     ni(side.get('big_chances')),
    }


def upsert_team_form_for_event(detail: dict, inner: dict):
    """Build and upsert two team_form rows (home + away) for a match."""
    event_id = ni(detail.get('id'))
    if not event_id:
        return
    league_id   = ni(detail.get('league_id'))
    season_id   = ni(detail.get('season_id'))
    home_id     = ni(detail.get('home_team_id'))
    away_id     = ni(detail.get('away_team_id'))
    home_score  = ni(detail.get('home_score'))
    away_score  = ni(detail.get('away_score'))
    event_date  = detail.get('event_date')
    competition = get_competition_name(league_id, season_id)
    status      = (detail.get('status') or '').lower()
    is_finished = status in FINISHED

    home_stats = inner.get('home') or {}
    away_stats = inner.get('away') or {}

    rows = []
    if home_id:
        rows.append({
            'team_id':        home_id,
            'event_id':       event_id,
            'opponent_id':    away_id,
            'opponent_name':  nv(detail.get('away_team')) or '',
            'competition':    competition,
            'league_id':      league_id,
            'season_id':      season_id,
            'event_date':     event_date,
            'is_home':        True,
            'team_score':     home_score,
            'opponent_score': away_score,
            **_extract_side_stats(home_stats, home_score, away_score, is_finished),
        })
    if away_id:
        rows.append({
            'team_id':        away_id,
            'event_id':       event_id,
            'opponent_id':    home_id,
            'opponent_name':  nv(detail.get('home_team')) or '',
            'competition':    competition,
            'league_id':      league_id,
            'season_id':      season_id,
            'event_date':     event_date,
            'is_home':        False,
            'team_score':     away_score,
            'opponent_score': home_score,
            **_extract_side_stats(away_stats, away_score, home_score, is_finished),
        })
    if rows:
        upsert('team_form', rows, 'team_id,event_id', label=f'(event {event_id})')


def populate_team_form():
    """
    For every team in the DB, fetch their recent match history from BSD
    (/api/v2/events/?team_id=X) and upsert into team_form.
    Run once with --populate-form; WC 2026 rows auto-update via collect_event.
    """
    print('\n  populate_team_form …')
    teams_res = sb.table('teams').select('id,name').execute()
    all_teams = teams_res.data or []
    print(f'  {len(all_teams)} teams in DB')

    total = 0
    for team in all_teams:
        team_id   = team['id']
        team_name = team['name']
        print(f'\n  [{team_id}] {team_name} …')

        data = get(f'/api/v2/events/?team_id={team_id}')
        if not data:
            print(f'    SKIP: no data from BSD'); continue

        matches = data.get('results', []) if isinstance(data, dict) else (data if isinstance(data, list) else [])
        if not matches:
            print(f'    no matches'); continue

        # Sort newest-first, process latest 25 (10 finished + buffer for upcoming + WC history)
        matches_sorted = sorted(
            [m for m in matches if m.get('event_date')],
            key=lambda x: x['event_date'],
            reverse=True
        )
        recent = matches_sorted[:25]
        print(f'    {len(recent)} matches to process')

        rows = []
        for match in recent:
            event_id = ni(match.get('id'))
            if not event_id:
                continue
            league_id  = ni(match.get('league_id'))
            season_id  = ni(match.get('season_id'))
            home_id    = ni(match.get('home_team_id'))
            away_id    = ni(match.get('away_team_id'))
            home_score = ni(match.get('home_score'))
            away_score = ni(match.get('away_score'))
            status     = (match.get('status') or '').lower()
            is_fin     = status in FINISHED
            is_home    = (home_id == team_id)
            team_score = home_score if is_home else away_score
            opp_score  = away_score if is_home else home_score
            competition = get_competition_name(league_id, season_id)

            row: dict = {
                'team_id':        team_id,
                'event_id':       event_id,
                'opponent_id':    away_id if is_home else home_id,
                'opponent_name':  nv(match.get('away_team') if is_home else match.get('home_team')) or '',
                'competition':    competition,
                'league_id':      league_id,
                'season_id':      season_id,
                'event_date':     match.get('event_date'),
                'is_home':        is_home,
                'team_score':     team_score,
                'opponent_score': opp_score,
                'result':         None,
            }

            if is_fin and team_score is not None and opp_score is not None:
                row['result'] = 'W' if team_score > opp_score else ('L' if team_score < opp_score else 'D')

            if is_fin:
                time.sleep(DELAY)
                stats_raw = get(f'/api/v2/events/{event_id}/stats/') or {}
                inner = stats_raw.get('stats') or {}
                if isinstance(inner.get('stats'), dict):
                    inner = inner['stats']
                side = inner.get('home' if is_home else 'away') or {}
                xg_raw = side.get('xg') or {}
                xg = nf(xg_raw.get('actual') if isinstance(xg_raw, dict) else xg_raw) or nf(side.get('expected_goals'))
                row.update({
                    'possession':      ni(side.get('ball_possession')),
                    'shots':           ni(side.get('total_shots')),
                    'shots_on_target': ni(side.get('shots_on_target')),
                    'xg':              xg,
                    'corners':         ni(side.get('corner_kicks')),
                    'yellow_cards':    ni(side.get('yellow_cards')),
                    'red_cards':       ni(side.get('red_cards')),
                    'pass_accuracy':   nf(side.get('pass_accuracy_pct')),
                    'big_chances':     ni(side.get('big_chances')),
                })

            rows.append(row)

        if rows:
            # Upsert in batches of 50
            for i in range(0, len(rows), 50):
                upsert('team_form', rows[i:i+50], 'team_id,event_id', label=f'({team_name}: rows {i+1}-{i+len(rows[i:i+50])})')
        total += len(rows)
        time.sleep(DELAY)

    print(f'\n  populate_team_form done — {total} rows upserted across {len(all_teams)} teams')
    return total


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

    # ── Read existing row for merge (preserve non-null values BSD strips post-match) ──
    existing = {}
    try:
        res = sb.table('matches').select('*').eq('id', event_id).execute()
        if res.data:
            existing = res.data[0]
    except Exception:
        pass

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
        'period':           nv(detail.get('period')),
        'current_minute':   ni(detail.get('current_minute')),
        'attendance':          ni(detail.get('attendance')),
        'temperature_c':       nf(weather.get('temperature_c') or detail.get('temperature_c')),
        'wind_speed':          nf(weather.get('wind_speed') or detail.get('wind_speed')),
        'weather_code':        ni(weather.get('code')),
        'weather_description': nv(weather.get('description')),
        'pitch_condition':     ni(detail.get('pitch_condition')),
        'is_local_derby':      bool(detail.get('is_local_derby', False)),
        'is_neutral_ground':   bool(detail.get('is_neutral_ground', False)),
        'penalty_shootout':    detail.get('penalty_shootout') or None,
        'extra_time_score':    nv(detail.get('extra_time_score')),
        'h2h_data':            detail.get('head_to_head') or None,
        'highlights':          detail.get('highlights') or None,
    }

    # ── Layer 1: merge — BSD strips these post-match, keep existing non-null values ──
    PRESERVE_IF_SET = (
        'venue_name', 'venue_city', 'home_coach', 'away_coach', 'referee_name',
        'round_name', 'group_name', 'home_team_name', 'away_team_name',
        'attendance', 'h2h_data', 'highlights',
    )
    for field in PRESERVE_IF_SET:
        if match_row.get(field) is None and existing.get(field) is not None:
            match_row[field] = existing[field]

    def _upsert_match(row):
        try:
            sb.table('matches').upsert([row], on_conflict='id').execute()
            print(f'    OK  matches — 1 row(s)')
            return
        except Exception as e:
            es = str(e)
            # PostgREST schema cache hasn't picked up new columns yet — strip them and retry
            _new_cols = ('home_coach_id', 'away_coach_id', 'weather_code', 'weather_description',
                         'pitch_condition', 'is_local_derby', 'is_neutral_ground', 'h2h_data', 'highlights',
                         'penalty_shootout', 'extra_time_score', 'period', 'current_minute')
            if 'PGRST204' in es or any(c in es for c in _new_cols):
                row = {k: v for k, v in row.items() if k not in _new_cols}
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

    # ── Layer 2: reference table fallback — fill any still-null text cols from Supabase refs ──
    ref_updates = {}
    if not match_row.get('venue_name') and match_row.get('venue_id'):
        v = sb.table('venues').select('name,city').eq('id', match_row['venue_id']).execute()
        if v.data:
            ref_updates['venue_name'] = v.data[0].get('name')
            ref_updates['venue_city'] = v.data[0].get('city')
    if not match_row.get('referee_name') and match_row.get('referee_id'):
        r = sb.table('referees').select('name').eq('id', match_row['referee_id']).execute()
        if r.data:
            ref_updates['referee_name'] = r.data[0].get('name')
    if not match_row.get('home_coach') and match_row.get('home_coach_id'):
        m = sb.table('managers').select('name').eq('id', match_row['home_coach_id']).execute()
        if m.data:
            ref_updates['home_coach'] = m.data[0].get('name')
    if not match_row.get('away_coach') and match_row.get('away_coach_id'):
        m = sb.table('managers').select('name').eq('id', match_row['away_coach_id']).execute()
        if m.data:
            ref_updates['away_coach'] = m.data[0].get('name')
    if ref_updates:
        try:
            sb.table('matches').update(ref_updates).eq('id', event_id).execute()
            print(f'    filled from ref tables: {list(ref_updates.keys())}')
        except Exception as e:
            print(f'    ERR ref table fill — {e}')

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
        is_home  = p.get('is_home', True)
        team_id  = ni(p.get('team_id')) or (home_id if is_home else away_id)
        pl_obj   = p.get('player') or {}
        pl_name  = nv(pl_obj.get('name') or p.get('player_name') or p.get('name'))
        tm_name  = nv(p.get('team_name') or (detail.get('home_team') if is_home else detail.get('away_team')))
        ps_rows.append({
            'event_id':                event_id,
            'player_id':               pid,
            'player_name':             pl_name,
            'team_id':                 team_id,
            'team_name':               tm_name,
            'rating':                  nf(p.get('rating')),
            'minutes_played':          ni(p.get('minutes_played')),
            'goals':                   ni(p.get('goals')),
            'goal_assist':             ni(p.get('goal_assist') or p.get('assists')),
            'expected_goals':          nf(p.get('expected_goals')),
            'expected_assists':        nf(p.get('expected_assists')),
            'total_shots':             ni(p.get('total_shots')),
            'shots_on_target':         ni(p.get('shots_on_target')),
            'key_pass':                ni(p.get('key_pass')),
            'total_pass':              ni(p.get('total_pass')),
            'accurate_pass':           ni(p.get('accurate_pass')),
            'total_long_balls':        ni(p.get('total_long_balls')),
            'accurate_long_balls':     ni(p.get('accurate_long_balls')),
            'total_cross':             ni(p.get('total_cross')),
            'accurate_cross':          ni(p.get('accurate_cross')),
            'total_contest':           ni(p.get('total_contest') or p.get('dribble_attempted')),
            'won_contest':             ni(p.get('won_contest') or p.get('dribble_won')),
            'duel_won':                ni(p.get('duel_won')),
            'duel_lost':               ni(p.get('duel_lost')),
            'aerial_won':              ni(p.get('aerial_won')),
            'aerial_lost':             ni(p.get('aerial_lost')),
            'total_tackle':            ni(p.get('total_tackle')),
            'won_tackle':              ni(p.get('won_tackle')),
            'total_clearance':         ni(p.get('total_clearance')),
            'interception':            ni(p.get('interception')),
            'ball_recovery':           ni(p.get('ball_recovery')),
            'blocked_scoring_attempt': ni(p.get('blocked_scoring_attempt')),
            'dispossessed':            ni(p.get('dispossessed')),
            'possession_lost':         ni(p.get('possession_lost')),
            'was_fouled':              ni(p.get('was_fouled')),
            'fouls':                   ni(p.get('fouls')),
            'yellow_card':             ni(p.get('yellow_card')),
            'red_card':                ni(p.get('red_card')),
            'saves':                   ni(p.get('saves')),
            'goals_conceded':          ni(p.get('goals_conceded')),
            'punches':                 ni(p.get('punches')),
            'touches':                 ni(p.get('touches')),
        })

    if ps_rows:
        for i in range(0, len(ps_rows), 50):
            batch = ps_rows[i:i+50]
            try:
                sb.table('player_match_stats').upsert(batch, on_conflict='event_id,player_id').execute()
                print(f'    OK  player_match_stats — {len(batch)} row(s)')
            except Exception as e:
                if '23503' not in str(e):
                    print(f'    ERR player_match_stats — {e}')
                    continue
                # FK violation: insert row-by-row, skip players not yet in players table
                ok = 0
                for row in batch:
                    try:
                        sb.table('player_match_stats').upsert([row], on_conflict='event_id,player_id').execute()
                        ok += 1
                    except Exception as e2:
                        if '23503' not in str(e2):
                            print(f'    ERR player_match_stats row — {e2}')
                print(f'    OK  player_match_stats — {ok}/{len(batch)} row(s) (FK skips applied)')
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

    # ── 4a. team_form — upsert two rows (home + away) for this event ──
    detail['league_id'] = 27  # collect_event always handles WC 2026 events
    detail['season_id'] = 188
    upsert_team_form_for_event(detail, inner)

    # ── 5. incidents (save locally; push to Supabase if table exists) ──
    print(f'    fetching incidents …')
    inc_raw  = get(f'/api/v2/events/{event_id}/incidents/') or {}
    inc_list = inc_raw if isinstance(inc_raw, list) else inc_raw.get('incidents', [])
    print(f'    {len(inc_list)} incidents')

    if save_local and inc_list:
        (out_dir / 'incidents.json').write_text(
            json.dumps(inc_raw, ensure_ascii=False, indent=2), encoding='utf-8')
    time.sleep(DELAY)

    # ── 6. lineups (save locally; push to Supabase if table exists) ──
    print(f'    fetching lineups …')
    lineups_raw = get(f'/api/v2/events/{event_id}/lineups/') or {}
    if save_local and lineups_raw:
        (out_dir / 'lineups.json').write_text(
            json.dumps(lineups_raw, ensure_ascii=False, indent=2), encoding='utf-8')
    time.sleep(DELAY)

    print(f'    DONE {home} {hs}-{as_} {away}')
    return True


# ── Pre-fill referee names for upcoming matches ───────────────────────────────
def prefill_upcoming_referees():
    """For upcoming matches where referee_id is set but referee_name is NULL, fill from referees table or BSD API."""
    print('\n  prefill_upcoming_referees …')
    res = sb.table('matches') \
            .select('id,referee_id') \
            .neq('status', 'finished') \
            .not_.is_('referee_id', 'null') \
            .is_('referee_name', 'null') \
            .execute()
    rows = res.data or []
    print(f'    {len(rows)} upcoming match(es) with referee_id but no referee_name')
    if not rows:
        return 0

    all_refs = sb.table('referees').select('id,name').execute().data or []
    ref_map = {r['id']: r['name'] for r in all_refs if r.get('name')}

    filled = 0
    for row in rows:
        rid = row['referee_id']
        name = ref_map.get(rid)
        if not name:
            data = get(f'/api/v2/referees/{rid}/')
            name = nv((data or {}).get('name')) if isinstance(data, dict) else None
            if name:
                ref_map[rid] = name
                sb.table('referees').upsert([{'id': rid, 'name': name}], on_conflict='id').execute()
                print(f'    {rid}: {name} (fetched from BSD)')
            else:
                print(f'    {rid}: not found on BSD')
                continue
            time.sleep(DELAY)
        if name:
            sb.table('matches').update({'referee_name': name}).eq('id', row['id']).execute()
            filled += 1

    print(f'    Pre-filled referee_name for {filled} upcoming match(es)')
    return filled


# ── Tournament top scorers ────────────────────────────────────────────────────
def fetch_top_scorers():
    """Fetch WC2026 top scorers from BSD and upsert into top_scorers table."""
    print('\n  fetch_top_scorers …')
    data = get(f'/api/v2/leagues/27/top-scorers/?season_id=188')
    if not data:
        print('    FAILED or no data'); return 0
    results = data.get('results', []) if isinstance(data, dict) else (data if isinstance(data, list) else [])
    print(f'    {len(results)} top scorer entries from BSD')
    if not results:
        return 0
    rows = []
    for p in results:
        player = p.get('player') or {}
        team   = p.get('team') or {}
        rows.append({
            'player_id':      ni(player.get('id') or p.get('player_id')),
            'player_name':    nv(player.get('name') or p.get('player_name') or p.get('name')),
            'short_name':     nv(player.get('short_name') or p.get('short_name')),
            'team_id':        ni(team.get('id') or p.get('team_id')),
            'team_name':      nv(team.get('name') or p.get('team_name')),
            'image_url':      nv(player.get('image_url') or p.get('image_url')),
            'goals':          ni(p.get('goals') or p.get('total_goals')),
            'assists':        ni(p.get('assists') or p.get('goal_assist')),
            'penalties':      ni(p.get('penalty_goals') or p.get('penalties')),
            'matches_played': ni(p.get('matches_played') or p.get('appearances')),
            'minutes_played': ni(p.get('minutes_played')),
            'rank':           ni(p.get('rank') or p.get('position')),
        })
    rows = [r for r in rows if r.get('player_id')]
    if rows:
        upsert('top_scorers', rows, 'player_id', label=f'({len(rows)} scorers)')
    return len(rows)


# ── Tournament group standings ────────────────────────────────────────────────
def fetch_standings():
    """Fetch WC2026 group standings from BSD and upsert into tournament_standings table."""
    print('\n  fetch_standings …')
    # Try multiple BSD endpoint patterns for standings/groupings
    data = None
    for endpoint in [
        '/api/v2/leagues/27/standings/?season_id=188',
        '/api/v2/leagues/27/groupings/?season_id=188',
        '/api/v2/seasons/188/standings/',
        '/api/v2/seasons/188/groupings/',
    ]:
        data = get(endpoint)
        if data:
            print(f'    Got data from {endpoint}')
            break
        time.sleep(DELAY)
    if not data:
        print('    FAILED: no standings data from any endpoint'); return 0

    # Normalise response into a list of group objects
    raw = []
    if isinstance(data, list):
        raw = data
    elif isinstance(data, dict):
        # Try known list-valued keys first
        for key in ('standings', 'results', 'groups', 'groupings'):
            val = data.get(key)
            if val:
                raw = val; break
        # If still empty, check if the dict itself IS the group map: {"Group A": [...], ...}
        if not raw:
            raw = data  # will be handled as dict below

    # Convert dict format {"Group A": [teams]} → list of {group_name, teams}
    if isinstance(raw, dict):
        raw = [{'group_name': gname, 'rows': gteams}
               for gname, gteams in raw.items()
               if isinstance(gteams, list)]

    if not raw:
        print(f'    No standings data parseable from response'); return 0
    print(f'    {len(raw)} group entries found')

    rows = []
    for entry in raw:
        if not isinstance(entry, dict):
            continue
        # Handle grouped format: {group_name, rows/teams: [...]}
        group_name = nv(entry.get('group_name') or entry.get('group') or entry.get('name'))
        teams = entry.get('rows') or entry.get('teams') or entry.get('standings') or []
        if not teams and entry.get('team_id'):
            teams = [entry]
        for t in teams:
            team = t.get('team') or {}
            rows.append({
                'group_name':      group_name or nv(t.get('group_name')),
                'team_id':         ni(team.get('id') or t.get('team_id')),
                'team_name':       nv(team.get('name') or t.get('team_name') or t.get('name')),
                'position':        ni(t.get('position') or t.get('rank') or t.get('pos')),
                'played':          ni(t.get('matches_played') or t.get('played') or t.get('mp')),
                'won':             ni(t.get('wins') or t.get('won') or t.get('w')),
                'drawn':           ni(t.get('draws') or t.get('drawn') or t.get('d')),
                'lost':            ni(t.get('losses') or t.get('lost') or t.get('l')),
                'goals_for':       ni(t.get('goals_scored') or t.get('goals_for') or t.get('gf')),
                'goals_against':   ni(t.get('goals_conceded') or t.get('goals_against') or t.get('ga')),
                'goal_difference': ni(t.get('goal_difference') or t.get('gd')),
                'points':          ni(t.get('points') or t.get('pts')),
                'form':            nv(t.get('form')),
            })
    rows = [r for r in rows if r.get('team_id') and r.get('group_name')]
    if rows:
        upsert('tournament_standings', rows, 'group_name,team_id', label=f'({len(rows)} team rows)')
    return len(rows)


# ── Data repair: backfill NULL player_name / team_name in player_match_stats ──
def repair_player_stats():
    """
    Finds player_match_stats rows where player_name or team_name is NULL
    and backfills them from the players + teams reference tables.
    Safe to run every cron cycle — only touches rows that need fixing.
    """
    print('\n  repair_player_stats …')

    # Find all stat rows with missing player_name
    res = sb.table('player_match_stats') \
            .select('player_id, team_id') \
            .is_('player_name', 'null') \
            .execute()
    rows = res.data or []
    if not rows:
        print('    All player_match_stats rows have player_name — nothing to repair')
        return 0

    player_ids = list({r['player_id'] for r in rows if r.get('player_id')})
    team_ids   = list({r['team_id']   for r in rows if r.get('team_id')})
    print(f'    {len(rows)} stat row(s) with NULL player_name — {len(player_ids)} unique player(s)')

    # Build player_id → {name, national_team_name} map from players table
    player_map: dict = {}
    for i in range(0, len(player_ids), 100):
        batch = player_ids[i:i+100]
        p_res = sb.table('players') \
                  .select('id, name, short_name, national_team_name') \
                  .in_('id', batch).execute()
        for p in (p_res.data or []):
            player_map[p['id']] = p

    # Build team_id → name map from teams table (fallback for team_name)
    team_map: dict = {}
    for i in range(0, len(team_ids), 100):
        batch = team_ids[i:i+100]
        t_res = sb.table('teams').select('id, name').in_('id', batch).execute()
        for t in (t_res.data or []):
            team_map[t['id']] = t['name']

    fixed = 0
    for pid in player_ids:
        player = player_map.get(pid)
        if not player:
            print(f'    SKIP player_id={pid}: not found in players table')
            continue
        update: dict = {
            'player_name': player.get('name') or player.get('short_name'),
        }
        # team_name: prefer national_team_name from players row
        nat_name = player.get('national_team_name')
        if nat_name:
            update['team_name'] = nat_name

        try:
            sb.table('player_match_stats') \
              .update(update) \
              .eq('player_id', pid) \
              .is_('player_name', 'null') \
              .execute()
            fixed += 1
        except Exception as e:
            print(f'    ERR player_id={pid}: {e}')
        time.sleep(0.02)

    # Second pass: fix team_name=NULL rows where player_name is already set
    res2 = sb.table('player_match_stats') \
             .select('player_id, team_id') \
             .is_('team_name', 'null') \
             .not_.is_('team_id', 'null') \
             .execute()
    team_null_rows = res2.data or []
    if team_null_rows:
        team_null_pids = list({r['team_id'] for r in team_null_rows if r.get('team_id')})
        for i in range(0, len(team_null_pids), 100):
            batch = team_null_pids[i:i+100]
            t_res = sb.table('teams').select('id, name').in_('id', batch).execute()
            for t in (t_res.data or []):
                team_map[t['id']] = t['name']
        for row in team_null_rows:
            tid  = row.get('team_id')
            name = team_map.get(tid)
            if not name or not tid:
                continue
            try:
                sb.table('player_match_stats') \
                  .update({'team_name': name}) \
                  .eq('player_id', row['player_id']) \
                  .eq('team_id', tid) \
                  .is_('team_name', 'null') \
                  .execute()
            except Exception as e:
                print(f'    ERR team_name team_id={tid}: {e}')
            time.sleep(0.02)
        print(f'    Fixed team_name for {len(team_null_rows)} stat row(s)')

    print(f'    Repaired player_name for {fixed} player(s)')
    return fixed


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

    # Step 3: pre-fill referee names for upcoming matches (assigned 2-3 days early)
    prefill_upcoming_referees()

    # Step 4: refresh top scorers + group standings when new matches collected
    if collected > 0:
        fetch_top_scorers()
        fetch_standings()

    # Step 5: always repair broken player_name/team_name links
    repair_player_stats()

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
    parser.add_argument('--populate',        action='store_true', help='Fetch all WC2026 managers + venues + referees from BSD → Supabase reference tables')
    parser.add_argument('--backfill-local',         action='store_true', help='Read all local BSD/completed_v2/event_*/detail.json and upsert to matches (no API calls)')
    parser.add_argument('--backfill-player-stats',  action='store_true', help='Read all local BSD/completed_v2/event_*/player_stats.json and upsert to player_match_stats')
    parser.add_argument('--fix-refs',        action='store_true', help='Fetch individual referee records for matches with NULL referee_name')
    parser.add_argument('--prefill-refs',    action='store_true', help='Pre-fill referee names for upcoming matches where referee_id is already set')
    parser.add_argument('--fetch-stats',     action='store_true', help='Fetch tournament top scorers + group standings from BSD → Supabase')
    parser.add_argument('--repair-stats',    action='store_true', help='Backfill NULL player_name/team_name in player_match_stats from players/teams tables')
    parser.add_argument('--verify-coaches',  action='store_true', help='Cross-check coaches table vs managers table')
    parser.add_argument('--populate-form',   action='store_true', help='Fetch recent match history for all teams from BSD → team_form table')
    parser.add_argument('--schema',          action='store_true', help='Print SQL to run in Supabase dashboard')
    args = parser.parse_args()

    print(f'Supabase: {SUPABASE_URL}')
    print(f'BSD API:  {BSD_BASE}\n')

    if args.schema:
        print("-- Run this SQL in your Supabase SQL Editor:\n")
        print("ALTER TABLE matches ADD COLUMN IF NOT EXISTS home_coach_id INTEGER REFERENCES managers(id);")
        print("ALTER TABLE matches ADD COLUMN IF NOT EXISTS away_coach_id INTEGER REFERENCES managers(id);")
        print("ALTER TABLE matches ADD COLUMN IF NOT EXISTS weather_code INTEGER;")
        print("ALTER TABLE matches ADD COLUMN IF NOT EXISTS weather_description TEXT;")
        print("ALTER TABLE matches ADD COLUMN IF NOT EXISTS pitch_condition INTEGER;")
        print("ALTER TABLE matches ADD COLUMN IF NOT EXISTS is_local_derby BOOLEAN DEFAULT false;")
        print("ALTER TABLE matches ADD COLUMN IF NOT EXISTS is_neutral_ground BOOLEAN DEFAULT false;")
        print("ALTER TABLE matches ADD COLUMN IF NOT EXISTS h2h_data JSONB;")
        print("ALTER TABLE matches ADD COLUMN IF NOT EXISTS highlights JSONB;")
        print()
        print("ALTER TABLE matches DROP CONSTRAINT IF EXISTS fk_matches_venue;")
        print("ALTER TABLE matches ADD CONSTRAINT fk_matches_venue")
        print("  FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE SET NULL;")
        print()
        print("NOTIFY pgrst, 'reload schema';")
        print()
        print("-- team_form table (recent match history per team, all competitions)")
        print("CREATE TABLE IF NOT EXISTS team_form (")
        print("  id              SERIAL PRIMARY KEY,")
        print("  team_id         INTEGER NOT NULL REFERENCES teams(id),")
        print("  event_id        INTEGER NOT NULL,")
        print("  opponent_id     INTEGER,")
        print("  opponent_name   TEXT NOT NULL DEFAULT '',")
        print("  competition     TEXT,")
        print("  league_id       INTEGER,")
        print("  season_id       INTEGER,")
        print("  event_date      TIMESTAMPTZ NOT NULL,")
        print("  is_home         BOOLEAN NOT NULL DEFAULT true,")
        print("  team_score      INTEGER,")
        print("  opponent_score  INTEGER,")
        print("  result          TEXT,")
        print("  possession      INTEGER,")
        print("  shots           INTEGER,")
        print("  shots_on_target INTEGER,")
        print("  xg              FLOAT8,")
        print("  corners         INTEGER,")
        print("  yellow_cards    INTEGER,")
        print("  red_cards       INTEGER,")
        print("  pass_accuracy   FLOAT8,")
        print("  big_chances     INTEGER,")
        print("  fetched_at      TIMESTAMPTZ DEFAULT NOW(),")
        print("  UNIQUE (team_id, event_id)")
        print(");")
        print("CREATE INDEX IF NOT EXISTS idx_team_form_team_date ON team_form (team_id, event_date DESC);")
        print()
        print("NOTIFY pgrst, 'reload schema';")
        print()
        print("-- Top scorers table")
        print("CREATE TABLE IF NOT EXISTS top_scorers (")
        print("  player_id      INTEGER PRIMARY KEY,")
        print("  player_name    TEXT,")
        print("  short_name     TEXT,")
        print("  team_id        INTEGER,")
        print("  team_name      TEXT,")
        print("  image_url      TEXT,")
        print("  goals          INTEGER DEFAULT 0,")
        print("  assists        INTEGER DEFAULT 0,")
        print("  penalties      INTEGER DEFAULT 0,")
        print("  matches_played INTEGER DEFAULT 0,")
        print("  minutes_played INTEGER DEFAULT 0,")
        print("  rank           INTEGER,")
        print("  updated_at     TIMESTAMPTZ DEFAULT NOW()")
        print(");")
        print()
        print("-- Group standings table")
        print("CREATE TABLE IF NOT EXISTS tournament_standings (")
        print("  id              SERIAL PRIMARY KEY,")
        print("  group_name      TEXT NOT NULL,")
        print("  team_id         INTEGER NOT NULL,")
        print("  team_name       TEXT,")
        print("  position        INTEGER,")
        print("  played          INTEGER DEFAULT 0,")
        print("  won             INTEGER DEFAULT 0,")
        print("  drawn           INTEGER DEFAULT 0,")
        print("  lost            INTEGER DEFAULT 0,")
        print("  goals_for       INTEGER DEFAULT 0,")
        print("  goals_against   INTEGER DEFAULT 0,")
        print("  goal_difference INTEGER DEFAULT 0,")
        print("  points          INTEGER DEFAULT 0,")
        print("  form            TEXT,")
        print("  updated_at      TIMESTAMPTZ DEFAULT NOW(),")
        print("  UNIQUE (group_name, team_id)")
        print(");")
        print()
        print("NOTIFY pgrst, 'reload schema';")
        return

    if args.populate:
        m = populate_managers()
        v = populate_venues()
        r = populate_referees()
        print(f'\nPopulate done — {m} manager(s), {v} venue(s), {r} referee(s) updated.')
        return

    if args.backfill_local:
        n = backfill_local()
        bv = backfill_venue_names()
        bc = backfill_coach_names()
        print(f'\nBackfill done — {n} match(es) upserted, {bv} venue(s) named, {bc} coach name(s) filled.')
        return

    if args.backfill_player_stats:
        backfill_player_stats()
        return

    if args.fix_refs:
        backfill_missing_referees()
        return

    if args.prefill_refs:
        prefill_upcoming_referees()
        return

    if args.fetch_stats:
        s = fetch_top_scorers()
        g = fetch_standings()
        print(f'\nDone — {s} top scorer(s), {g} standing row(s) updated.')
        return

    if args.repair_stats:
        repair_player_stats()
        return

    if args.verify_coaches:
        verify_coaches()
        return

    if args.populate_form:
        n = populate_team_form()
        print(f'\nDone — {n} team_form row(s) upserted.')
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
