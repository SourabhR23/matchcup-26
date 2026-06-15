import { NextResponse } from 'next/server'

const BSD_BASE  = 'https://sports.bzzoiro.com'
const BSD_TOKEN = process.env.BSD_TOKEN ?? ''
const HDR       = { Authorization: `Token ${BSD_TOKEN}` }

export const dynamic = 'force-dynamic'

interface Params { params: Promise<{ id: string }> }

type IncRaw = Record<string, unknown>

/* Normalize BSD live incident → same shape as incidents.json */
function normalize(inc: IncRaw, homeTeam: string): IncRaw {
  const n: IncRaw = { ...inc }

  // player_name → player  |  player_out_name → player_out  |  player_in_name → player_in
  if (!n.player     && n.player_name)     n.player     = n.player_name
  if (!n.player_out && n.player_out_name) n.player_out = n.player_out_name
  if (!n.player_in  && n.player_in_name)  n.player_in  = n.player_in_name

  // team string → is_home boolean
  if (n.team !== undefined && n.is_home === undefined)
    n.is_home = n.team === homeTeam

  // flatten type variants
  if (n.type === 'yellow_card')                          { n.type = 'card'; n.card_type = 'yellow' }
  else if (n.type === 'red_card' || n.type === 'yellow_red_card') { n.type = 'card'; n.card_type = 'red' }
  else if (n.type === 'own_goal' || n.type === 'owngoal') { n.type = 'goal'; n.goal_type = 'own_goal' }
  else if (n.type === 'var_decision')                    { n.type = 'varDecision' }
  else if (n.type === '1T' || n.type === '2T' || n.type === 'HT' || n.type === 'FT') {
    n.text = n.type; n.type = 'period'
  }

  // For period markers from BSD live (may use text/period field)
  if (n.type === 'period' && !n.text && n.detail) n.text = n.detail

  return n
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const eventId = parseInt(id, 10)
  if (isNaN(eventId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  try {
    const [detailRes, incRes, statsRes, lineupRes] = await Promise.all([
      fetch(`${BSD_BASE}/api/v2/events/${eventId}/`,            { headers: HDR, next: { revalidate: 0 } }),
      fetch(`${BSD_BASE}/api/v2/events/${eventId}/incidents/`,  { headers: HDR, next: { revalidate: 0 } }),
      fetch(`${BSD_BASE}/api/v2/events/${eventId}/statistics/`, { headers: HDR, next: { revalidate: 0 } }),
      fetch(`${BSD_BASE}/api/v2/events/${eventId}/lineups/`,    { headers: HDR, next: { revalidate: 0 } }),
    ])

    const detail     = detailRes.ok ? await detailRes.json() as Record<string, unknown> : {}
    const incData    = incRes.ok    ? await incRes.json()    : { incidents: [] }
    const statsRaw   = statsRes.ok  ? await statsRes.json()  : null
    const lineupRaw  = lineupRes.ok ? await lineupRes.json() as Record<string, unknown> : null

    const homeTeam = (detail.home_team as string) ?? ''

    /* Normalize + sort incidents */
    const rawList: IncRaw[] = Array.isArray(incData) ? incData : (incData.incidents ?? [])
    const incidents = rawList
      .map((i) => normalize(i, homeTeam))
      .sort((a, b) =>
        ((a.minute as number) ?? 0) - ((b.minute as number) ?? 0) ||
        ((a.added_time as number) ?? 0) - ((b.added_time as number) ?? 0)
      )

    /* Stats (try /statistics/ endpoint) */
    let stats: Record<string, Record<string, number>> | null = null
    if (statsRaw) {
      try {
        const home: Record<string, number> = {}
        const away: Record<string, number> = {}
        const arr = Array.isArray(statsRaw) ? statsRaw : (statsRaw.statistics ?? statsRaw.groups ?? null)
        if (Array.isArray(arr)) {
          for (const row of arr as IncRaw[]) {
            const name = (row.name ?? row.stat_name ?? '') as string
            if (!name) continue
            home[name] = row.home !== undefined ? parseFloat(String(row.home)) : (home[name] ?? 0)
            away[name] = row.away !== undefined ? parseFloat(String(row.away)) : (away[name] ?? 0)
          }
        }
        if (Object.keys(home).length > 0) stats = { home, away }
      } catch { stats = null }
    }

    /* Lineups — normalize from BSD API shape */
    type LineupPlayerShape = { id?: number; name?: string; player_name?: string; short_name?: string; position?: string; jersey_number?: number }
    type LineupTeamShape   = { formation?: string; players?: unknown[]; substitutes?: unknown[] }
    type LineupShape       = { home?: LineupTeamShape; away?: LineupTeamShape }

    let lineups: LineupShape | null = null
    if (lineupRaw) {
      const src: LineupShape = (lineupRaw.lineups ?? lineupRaw) as LineupShape
      if (src.home || src.away) {
        const norm = (team: LineupTeamShape | undefined): LineupTeamShape => ({
          formation:   team?.formation,
          players:     (team?.players    ?? []) as LineupPlayerShape[],
          substitutes: (team?.substitutes ?? []) as LineupPlayerShape[],
        })
        lineups = { home: norm(src.home), away: norm(src.away) }
      } else if ((detail.lineups as LineupShape)?.home) {
        lineups = detail.lineups as LineupShape
      }
    } else if ((detail.lineups as LineupShape)?.home) {
      lineups = detail.lineups as LineupShape
    }

    return NextResponse.json({ detail, incidents, stats, lineups })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
