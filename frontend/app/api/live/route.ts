import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

const BSD_BASE = 'https://sports.bzzoiro.com'
const BSD_TOKEN = process.env.BSD_TOKEN ?? ''
const HDR = { Authorization: `Token ${BSD_TOKEN}` }

export const dynamic = 'force-dynamic'

interface RawInc { type?: string; goal_type?: string; player?: string; player_name?: string; minute?: number; is_home?: boolean; team?: string }

export async function GET() {
  try {
    const res = await fetch(
      `${BSD_BASE}/api/v2/events/live/?league_id=27&season_id=188`,
      { headers: HDR, next: { revalidate: 0 } }
    )

    const bsdEvents: Record<string, unknown>[] = res.ok
      ? ((await res.json()) as { count: number; events: Record<string, unknown>[] }).events ?? []
      : []

    /* Fetch incidents for each live match in parallel, extract goals only */
    const liveEventsWithGoals = await Promise.all(
      bsdEvents.map(async (ev) => {
        const id = ev.id as number
        const homeTeam = (ev.home_team as string) ?? ''
        try {
          const incRes = await fetch(
            `${BSD_BASE}/api/v2/events/${id}/incidents/`,
            { headers: HDR, next: { revalidate: 0 } }
          )
          if (!incRes.ok) return { ...ev, goal_scorers: [], starting_soon: false }

          const incData = await incRes.json()
          const incidents: RawInc[] = Array.isArray(incData)
            ? incData
            : (incData.incidents ?? [])

          const goal_scorers = incidents
            .filter((i) =>
              i.type === 'goal' ||
              i.type === 'own_goal' ||
              i.type === 'owngoal' ||
              i.goal_type === 'own_goal'
            )
            .sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0))
            .map((i) => ({
              player:   i.player ?? i.player_name ?? '',
              minute:   i.minute ?? 0,
              is_home:  i.is_home ?? (i.team !== undefined ? i.team === homeTeam : true),
              own_goal: i.type === 'own_goal' || i.type === 'owngoal' || i.goal_type === 'own_goal',
            }))

          return { ...ev, goal_scorers, starting_soon: false }
        } catch {
          return { ...ev, goal_scorers: [], starting_soon: false }
        }
      })
    )

    /* ── Starting Soon fallback ─────────────────────────────────────────
       Fetch matches from Supabase that are scheduled to kick off within
       the next 30 minutes and haven't been reported live by BSD yet.
       Show them with starting_soon: true so the UI can badge them
       differently ("STARTING SOON") instead of hiding the section.
    ─────────────────────────────────────────────────────────────────── */
    const liveIds = new Set(liveEventsWithGoals.map((e) => (e as Record<string, unknown>).id as number))

    const now   = new Date()
    const soon  = new Date(now.getTime() + 30 * 60 * 1000)  // +30 min
    const grace = new Date(now.getTime() - 10 * 60 * 1000)  // -10 min (just-started grace)

    const { data: soonRows } = await supabaseServer
      .from('matches')
      .select('*')
      .in('status', ['notstarted', 'scheduled'])
      .gte('event_date', grace.toISOString())
      .lte('event_date', soon.toISOString())

    const soonEvents: Record<string, unknown>[] = (soonRows ?? [])
      .filter((r) => !liveIds.has(r.id))
      .map((r) => {
        const kickoff    = new Date(r.event_date)
        const minsToKick = Math.round((kickoff.getTime() - now.getTime()) / 60000)
        return {
          id:            r.id,
          home_team:     r.home_team_name ?? '',
          away_team:     r.away_team_name ?? '',
          home_team_id:  r.home_team_id,
          away_team_id:  r.away_team_id,
          home_score:    r.home_score ?? 0,
          away_score:    r.away_score ?? 0,
          home_score_ht: r.home_score_ht ?? 0,
          away_score_ht: r.away_score_ht ?? 0,
          current_minute: null,
          period:        'notstarted',
          status:        'notstarted',
          group_name:    r.group_name ?? '',
          round_name:    r.round_name ?? '',
          event_date:    r.event_date,
          mins_to_kick:  minsToKick,
          goal_scorers:  [],
          starting_soon: true,
          just_finished: false,
        }
      })

    /* ── Just Finished fallback ──────────────────────────────────────────
       Show matches that finished within the last 45 minutes so the card
       stays visible while the pipeline runs and data lands in Supabase.
       Window: status = finished AND event_date within the last 135 min
       (90 min match + 45 min grace period).
    ─────────────────────────────────────────────────────────────────── */
    const soonIds  = new Set(soonEvents.map((e) => (e as Record<string, unknown>).id as number))
    const ftCutoff = new Date(now.getTime() - 165 * 60 * 1000)  // 165 min ago (covers ET + penalties)

    const { data: ftRows } = await supabaseServer
      .from('matches')
      .select('*')
      .eq('status', 'finished')
      .gte('event_date', ftCutoff.toISOString())
      .lte('event_date', now.toISOString())

    const ftEvents: Record<string, unknown>[] = (ftRows ?? [])
      .filter((r) => !liveIds.has(r.id) && !soonIds.has(r.id))
      .map((r) => ({
        id:             r.id,
        home_team:      r.home_team_name ?? '',
        away_team:      r.away_team_name ?? '',
        home_team_id:   r.home_team_id,
        away_team_id:   r.away_team_id,
        home_score:     r.home_score ?? 0,
        away_score:     r.away_score ?? 0,
        home_score_ht:  r.home_score_ht ?? 0,
        away_score_ht:  r.away_score_ht ?? 0,
        current_minute: null,
        period:         'finished',
        status:         'finished',
        group_name:     r.group_name ?? '',
        round_name:     r.round_name ?? '',
        event_date:     r.event_date,
        goal_scorers:   [],
        starting_soon:  false,
        just_finished:  true,
      }))

    /* ── Gap coverage ──────────────────────────────────────────────────────
       Match kicked off 100–115 min ago, no longer in BSD live, but
       Supabase status not yet 'finished' (pipeline delay up to 5 min).
       Show as FT using time-based detection instead of status.
    ─────────────────────────────────────────────────────────────────── */
    const ftIds    = new Set(ftEvents.map((e) => (e as Record<string, unknown>).id as number))
    const gapStart = new Date(now.getTime() - 165 * 60 * 1000)
    const gapEnd   = new Date(now.getTime() - 100 * 60 * 1000)

    const { data: gapRows } = await supabaseServer
      .from('matches')
      .select('*')
      .neq('status', 'finished')
      .gte('event_date', gapStart.toISOString())
      .lte('event_date', gapEnd.toISOString())

    const gapEvents: Record<string, unknown>[] = (gapRows ?? [])
      .filter((r) => !liveIds.has(r.id) && !soonIds.has(r.id) && !ftIds.has(r.id))
      .map((r) => ({
        id:             r.id,
        home_team:      r.home_team_name ?? '',
        away_team:      r.away_team_name ?? '',
        home_team_id:   r.home_team_id,
        away_team_id:   r.away_team_id,
        home_score:     r.home_score ?? 0,
        away_score:     r.away_score ?? 0,
        home_score_ht:  r.home_score_ht ?? 0,
        away_score_ht:  r.away_score_ht ?? 0,
        current_minute: null,
        period:         'finished',
        status:         'finished',
        group_name:     r.group_name ?? '',
        round_name:     r.round_name ?? '',
        event_date:     r.event_date,
        goal_scorers:   [],
        starting_soon:  false,
        just_finished:  true,
      }))

    const allEvents = [...liveEventsWithGoals, ...ftEvents, ...gapEvents, ...soonEvents]

    return NextResponse.json({ count: allEvents.length, events: allEvents })
  } catch {
    return NextResponse.json({ count: 0, events: [], error: 'Failed to fetch' }, { status: 200 })
  }
}
