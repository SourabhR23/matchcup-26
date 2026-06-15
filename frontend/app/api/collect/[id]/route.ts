/**
 * POST /api/collect/:id
 * Fetches all BSD match data for a completed event and saves it to
 * BSD/completed_v2/event_{id}/ — the same structure as manually-collected events.
 *
 * Called automatically by LiveMatchDetail when it detects status === 'finished'.
 * Safe to call multiple times (idempotent: skips if all files already exist).
 */

import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

const BSD_BASE  = 'https://sports.bzzoiro.com'
const BSD_TOKEN = process.env.BSD_TOKEN ?? ''
const HDR       = { Authorization: `Token ${BSD_TOKEN}` }

export const dynamic = 'force-dynamic'

const DONE_V2     = path.join(process.cwd(), '..', 'BSD', 'completed_v2')
const EVENTS_FILE = path.join(process.cwd(), '..', 'BSD', 'raw', 'events_all.json')

const FINISHED = new Set(['finished', 'ft', 'ended', 'complete', 'awarded'])

interface Params { params: Promise<{ id: string }> }
type Raw = Record<string, unknown>

async function bsd(endpoint: string): Promise<Raw | null> {
  try {
    const r = await fetch(`${BSD_BASE}${endpoint}`, { headers: HDR, cache: 'no-store' })
    return r.ok ? await r.json() : null
  } catch { return null }
}

function writeJson(filePath: string, data: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

function readJson<T>(filePath: string): T | null {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T } catch { return null }
}

/* ── Build match_summary.json from raw pieces ───────────────────── */
function buildSummary(
  eventId: number,
  detail: Raw,
  incidents: Raw[],
  lineups: Raw | null,
  playerStats: Raw[]
) {
  const homeTeam = detail.home_team as string ?? ''
  const awayTeam = detail.away_team as string ?? ''

  const homeScorers: Raw[] = [], awayScorers: Raw[] = []
  const homeCards:   Raw[] = [], awayCards:   Raw[] = []
  const homeSubs:    Raw[] = [], awaySubs:    Raw[] = []
  const timeline:    Raw[] = []

  for (const inc of incidents) {
    const itype   = inc.type as string ?? ''
    const isHome  = inc.is_home as boolean | undefined
    const player  = (inc.player ?? inc.player_name ?? '') as string
    const minute  = inc.minute as number | undefined
    const added   = inc.added_time as number | undefined

    const isOg = itype === 'own_goal' || itype === 'owngoal' || inc.goal_type === 'own_goal'

    if (itype === 'goal' || isOg) {
      const entry: Raw = { player, minute }
      if (added) entry.added_time = added
      if (isOg)  entry.own_goal   = true
      // Own goal attributed to other team
      if (isOg) { (isHome ? awayScorers : homeScorers).push(entry) }
      else      { (isHome ? homeScorers : awayScorers).push(entry) }
    }

    if (itype === 'card') {
      const entry: Raw = { player, minute, card_type: inc.card_type ?? 'yellow' }
      if (added) entry.added_time = added
      ;(isHome ? homeCards : awayCards).push(entry)
    }

    if (itype === 'substitution') {
      const pin  = (inc.player_in  ?? inc.player        ?? '') as string
      const pout = (inc.player_out ?? inc.player_out_name ?? '') as string
      const entry: Raw = { player_in: pin, player_out: pout, minute }
      ;(isHome ? homeSubs : awaySubs).push(entry)
    }

    const detailVal = (inc.card_type ?? inc.text ?? inc.detail) as string | null ?? null
    timeline.push({
      minute, added_time: added,
      type: itype,
      team: isHome === true ? homeTeam : isHome === false ? awayTeam : null,
      player: player || null,
      player_out: (inc.player_out ?? inc.player_out_name) as string | null ?? null,
      detail: detailVal,
      home_score: inc.home_score ?? null,
      away_score: inc.away_score ?? null,
    })
  }

  timeline.sort((a, b) =>
    ((a.minute as number) ?? 0) - ((b.minute as number) ?? 0) ||
    ((a.added_time as number) ?? 0) - ((b.added_time as number) ?? 0)
  )

  const topRated = playerStats
    .filter(p => p.rating != null)
    .sort((a, b) => ((b.rating as number) ?? 0) - ((a.rating as number) ?? 0))
    .slice(0, 5)
    .map(p => ({ player_id: p.player_id, player: p.player_name, team_id: p.team_id, rating: p.rating }))

  const linData = (lineups?.lineups ?? lineups) as Raw | null
  const homeForm = ((linData?.home as Raw)?.formation ?? null) as string | null
  const awayForm = ((linData?.away as Raw)?.formation ?? null) as string | null

  const venue = (detail.venue as Raw) ?? {}
  const ref   = (detail.referee as Raw) ?? {}

  return {
    event_id: eventId,
    extracted_at: new Date().toISOString(),
    match: {
      home_team: homeTeam, away_team: awayTeam,
      score_ht:  `${detail.home_score_ht ?? 0}-${detail.away_score_ht ?? 0}`,
      score_ft:  `${detail.home_score ?? 0}-${detail.away_score ?? 0}`,
      status: detail.status, period: detail.period,
      venue:  venue.name   ?? null,
      city:   venue.city   ?? null,
      referee: ref.name    ?? null,
      home_xg: detail.actual_home_xg ?? detail.home_xg_live ?? null,
      away_xg: detail.actual_away_xg ?? detail.away_xg_live ?? null,
    },
    scorers:       { home: homeScorers, away: awayScorers },
    cards:         { home: homeCards,   away: awayCards },
    substitutions: { home: homeSubs,    away: awaySubs },
    top_rated_players: topRated,
    formations:    { home: homeForm,    away: awayForm },
    timeline,
  }
}

/* ── Update events_all.json status + scores ──────────────────────── */
function patchEventsFile(detail: Raw) {
  const events = readJson<Raw[]>(EVENTS_FILE)
  if (!events) return
  const eid = detail.id as number
  const ev  = events.find(e => e.id === eid)
  if (!ev) return
  ev.status        = detail.status
  ev.home_score    = detail.home_score
  ev.away_score    = detail.away_score
  ev.home_score_ht = detail.home_score_ht
  ev.away_score_ht = detail.away_score_ht
  ev.period        = detail.period
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2), 'utf-8')
}

/* ── Route handler ───────────────────────────────────────────────── */
export async function POST(_req: Request, { params }: Params) {
  const { id } = await params
  const eventId = parseInt(id, 10)
  if (isNaN(eventId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const outDir      = path.join(DONE_V2, `event_${eventId}`)
  const detailFile  = path.join(outDir, 'detail.json')
  const summaryFile = path.join(outDir, 'match_summary.json')

  // Idempotent: if fully collected already, skip
  const existingFiles = fs.existsSync(outDir) ? fs.readdirSync(outDir) : []
  const allPresent = ['detail.json', 'incidents.json', 'lineups.json',
                      'player_stats.json', 'h2h.json', 'match_summary.json']
                     .every(f => existingFiles.includes(f))
  if (allPresent) {
    return NextResponse.json({ ok: true, status: 'already_collected', eventId })
  }

  // 1. Fetch detail first — verify it's actually finished
  const detail = await bsd(`/api/v2/events/${eventId}/`)
  if (!detail) return NextResponse.json({ error: 'BSD unreachable' }, { status: 502 })

  const status = ((detail.status as string) ?? '').toLowerCase()
  if (!FINISHED.has(status)) {
    return NextResponse.json({ ok: false, reason: `not_finished (${status})`, eventId })
  }

  // 2. Fetch everything else in parallel
  const [incRaw, linRaw, statsRaw, h2hRaw] = await Promise.all([
    bsd(`/api/v2/events/${eventId}/incidents/`),
    bsd(`/api/v2/events/${eventId}/lineups/`),
    bsd(`/api/v2/events/${eventId}/player_stats/`),
    bsd(`/api/v2/events/${eventId}/h2h/`),
  ])

  // 3. Normalise each payload
  const incidentsList: Raw[] = Array.isArray(incRaw)
    ? incRaw
    : ((incRaw?.incidents ?? []) as Raw[])

  const lineups = linRaw ?? null
  if (lineups && !lineups.event_id) lineups.event_id = eventId

  const statsList: Raw[] = Array.isArray(statsRaw)
    ? statsRaw
    : ((statsRaw?.player_stats ?? []) as Raw[])

  // H2H — use API response or minimal fallback
  const h2h: Raw = h2hRaw ?? {
    total_matches: 0, home_wins: 0, draws: 0, away_wins: 0,
    home_goals: 0, away_goals: 0, avg_total_goals: 0,
    home_win_rate: 0, away_win_rate: 0, recent_matches: [],
  }

  // 4. Write all files
  fs.mkdirSync(outDir, { recursive: true })
  writeJson(detailFile, detail)
  writeJson(path.join(outDir, 'incidents.json'), { event_id: eventId, incidents: incidentsList })
  writeJson(path.join(outDir, 'lineups.json'), lineups ?? { event_id: eventId, lineups: {} })
  writeJson(path.join(outDir, 'player_stats.json'), { event_id: eventId, count: statsList.length, player_stats: statsList })
  writeJson(path.join(outDir, 'h2h.json'), h2h)
  writeJson(summaryFile, buildSummary(eventId, detail, incidentsList, lineups, statsList))

  // 5. Patch events_all.json so the matches list shows correct score/status
  patchEventsFile(detail)

  return NextResponse.json({
    ok: true,
    status: 'collected',
    eventId,
    score: `${detail.home_score}-${detail.away_score}`,
    files: ['detail.json', 'incidents.json', 'lineups.json', 'player_stats.json', 'h2h.json', 'match_summary.json'],
  })
}
