import Link from 'next/link'
import { notFound } from 'next/navigation'
import pageStyles from './page.module.css'
import {
  getMatchDetail,
  getMatchIncidents,
  getMatchSummary,
  getPlayerStats,
  getMatchLineups,
  getEvents,
  getMatchBsdStats,
  getRoster,
  getGroupStandings,
} from '@/lib/data'
import { getAbbrev } from '@/lib/flags'
import LiveMatchDetail from '@/components/LiveMatchDetail'
import MatchTabs from '@/components/MatchTabs'
import FlagImg from '@/components/FlagImg'
import StickyScoreBar from '@/components/StickyScoreBar'
import type { ExtStats } from '@/components/MatchTabs'
import { getMatchPrediction } from '@/lib/predictions'

export const dynamic = 'force-dynamic'

interface Params { params: Promise<{ id: string }> }

/* ── Watermark helper ─────────────────────────────────────────── */
function watermark(group: string, round: string): string {
  const m = group.match(/Group\s+([A-Z])/i)
  if (m) return `GRP ${m[1]}`
  const r = round.toLowerCase()
  if (r.includes('32')) return 'R32'
  if (r.includes('16')) return 'R16'
  if (r.includes('quarter')) return 'QF'
  if (r.includes('semi')) return 'SF'
  if (r.includes('final')) return 'FNL'
  return 'WC26'
}

/* ── Page ─────────────────────────────────────────────────────── */
export default async function MatchDetailPage({ params }: Params) {
  const { id } = await params
  const eventId = parseInt(id, 10)
  if (isNaN(eventId)) return notFound()

  const [detail, events] = await Promise.all([getMatchDetail(eventId), getEvents()])
  const baseEvent = events.find((e) => e.id === eventId)

  if (!detail && !baseEvent) return notFound()

  // No completed local data → delegate to LiveMatchDetail (live + upcoming)
  if (!detail) {
    return (
      <div>
        <Link href="/matches" className="back-btn mb-4 block">← BACK TO MATCHES</Link>
        <LiveMatchDetail eventId={eventId} />
      </div>
    )
  }

  /* ── Data ── */
  const ev = detail
  const [incidents, summary, lineups, rawStats, prediction, allStandings] = await Promise.all([
    getMatchIncidents(eventId),
    getMatchSummary(eventId),
    getMatchLineups(eventId),
    getPlayerStats(eventId),
    getMatchPrediction(eventId),
    getGroupStandings(),
  ])
  const groupName = ev.group_name ?? null
  const groupStandings = groupName ? (allStandings[groupName] ?? null) : null

  const homeTeam = ev.home_team
  const awayTeam = ev.away_team
  const homeAbbr = getAbbrev(homeTeam)
  const awayAbbr = getAbbrev(awayTeam)
  const wm       = watermark(ev.group_name ?? '', ev.round_name ?? '')

  // Venue from events_all.json (not in detail.json)
  const venue = baseEvent?.venue as { name?: string; city?: string; capacity?: number; country?: string } | undefined

  /* Formations */
  const homeFormation = lineups?.home?.formation ?? summary?.formations?.home ?? null
  const awayFormation = lineups?.away?.formation ?? summary?.formations?.away ?? null

  /* Extended team stats — aggregate from player stats */
  const homeId   = ev.home_team_id ?? 0
  const homeName = homeTeam.toLowerCase()
  const emptyStats = (): ExtStats => ({
    shots: 0, onTarget: 0, passes: 0, accuratePasses: 0,
    dribbles: 0, dribblesWon: 0, tackles: 0, tacklesWon: 0,
    clearances: 0, interceptions: 0, blocks: 0, recoveries: 0,
    longBalls: 0, crosses: 0, aerialWon: 0, aerialTotal: 0,
    fouls: 0, fouled: 0, yellow: 0, red: 0, xg: 0, keyPasses: 0,
  })

  const hStats = emptyStats()
  const aStats = emptyStats()

  for (const p of rawStats) {
    // Prefer team_id match; fall back to team_name when team_id is missing/zero
    const pid = p.team_id as number | undefined
    const isHome = (homeId > 0 && pid && pid > 0)
      ? pid === homeId
      : ((p.team_name as string) ?? '').toLowerCase() === homeName
    const side = isHome ? hStats : aStats
    side.shots         += Number(p.total_shots)              || 0
    side.onTarget      += Number(p.shots_on_target)          || 0
    side.passes        += Number(p.total_pass)               || 0
    side.accuratePasses+= Number(p.accurate_pass)            || 0
    side.dribbles      += Number(p.total_contest)            || 0
    side.dribblesWon   += Number(p.won_contest)              || 0
    side.tackles       += Number(p.won_tackle)               || 0
    side.tacklesWon    += Number(p.won_tackle)               || 0
    side.clearances    += Number(p.total_clearance)          || 0
    side.interceptions += Number(p.interception)             || 0
    side.blocks        += Number(p.blocked_scoring_attempt)  || 0
    side.recoveries    += Number(p.ball_recovery)            || 0
    side.longBalls     += Number(p.total_long_balls)         || 0
    side.crosses       += Number(p.total_cross)              || 0
    side.aerialWon     += Number(p.aerial_won)               || 0
    side.aerialTotal   += (Number(p.aerial_won) + Number(p.aerial_lost)) || 0
    side.fouls         += Number(p.fouls)                    || 0
    side.fouled        += Number(p.was_fouled)               || 0
    side.yellow        += Number(p.yellow_card)              || 0
    side.red           += Number(p.red_card)                 || 0
    side.xg            += Number(p.expected_goals)           || 0
    side.keyPasses     += Number(p.key_pass)                 || 0
  }

  // BSD full team stats — always null (not stored in Supabase)
  const bsdStats = await getMatchBsdStats(eventId)

  // Fall back to BSD team-level stats when per-player stats are unavailable
  if (rawStats.length === 0 && bsdStats?.stats) {
    const bh = bsdStats.stats.home
    const ba = bsdStats.stats.away
    // Guard: BSD sometimes returns stats without home/away sub-keys
    if (bh && ba) {
      const fill = (s: ExtStats, b: typeof bh) => {
        s.shots          = b.total_shots          ?? 0
        s.onTarget       = b.shots_on_target      ?? 0
        s.passes         = b.passes               ?? 0
        s.accuratePasses = b.accurate_passes      ?? 0
        s.dribbles       = b.dribbles?.total      ?? 0
        s.dribblesWon    = b.dribbles?.value      ?? 0
        s.tackles        = b.tackles              ?? 0
        s.clearances     = b.clearances           ?? 0
        s.interceptions  = b.interceptions        ?? 0
        s.recoveries     = b.recoveries           ?? 0
        s.longBalls      = b.long_balls?.value    ?? 0
        s.crosses        = b.crosses?.value       ?? 0
        s.aerialWon      = b.aerial_duels?.value  ?? 0
        s.aerialTotal    = b.aerial_duels?.total  ?? 0
        s.fouls          = b.fouls                ?? 0
        s.yellow         = b.yellow_cards         ?? 0
        s.red            = b.red_cards            ?? 0
        s.xg             = b.expected_goals       ?? 0
      }
      fill(hStats, bh)
      fill(aStats, ba)
    }
  }

  const hasStats = rawStats.length > 0 || !!(bsdStats?.stats?.home && bsdStats?.stats?.away)


  /* Scorers from incidents */
  const homeScorers: Record<string, number> = {}
  const awayScorers: Record<string, number> = {}
  for (const inc of incidents) {
    if (inc.type === 'goal') {
      const map  = inc.is_home ? homeScorers : awayScorers
      const name = inc.player ?? 'Unknown'
      map[name]  = (map[name] || 0) + 1
    }
  }

  /* Scorer lines with minutes for hero display */
  const fmtMin = (m: number) => m > 90 ? `90+${m - 90}'` : `${m}'`
  type ScorerLine = { name: string; minutes: string[]; playerId?: number }
  const buildScorerLines = (isHome: boolean): ScorerLine[] => {
    const map = new Map<string, { mins: number[]; playerId?: number }>()
    for (const inc of incidents) {
      if (inc.type === 'goal' && !!inc.is_home === isHome) {
        const name = inc.player ?? 'Unknown'
        const min = inc.minute ?? 0
        if (!map.has(name)) map.set(name, { mins: [], playerId: inc.player_id })
        map.get(name)!.mins.push(min)
      }
    }
    return Array.from(map.entries())
      .sort((a, b) => Math.min(...a[1].mins) - Math.min(...b[1].mins))
      .map(([name, { mins, playerId }]) => ({ name, minutes: mins.sort((a, b) => a - b).map(fmtMin), playerId }))
  }
  const homeScorerLines = buildScorerLines(true)
  const awayScorerLines = buildScorerLines(false)
  const htGoals = incidents
    .filter(i => i.type === 'goal' && (i.minute ?? 0) <= 45)
    .sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0))

  /* xG */
  const xgHome = ev.actual_home_xg ?? (hasStats && hStats.xg > 0 ? parseFloat(hStats.xg.toFixed(2)) : null)
  const xgAway = ev.actual_away_xg ?? (hasStats && aStats.xg > 0 ? parseFloat(aStats.xg.toFixed(2)) : null)

  /* Top players — derive from player_stats + roster name lookup */
  const awayId = ev.away_team_id ?? 0
  const [homeRoster, awayRoster] = await Promise.all([getRoster(homeId), getRoster(awayId)])
  const topPlayers = (() => {
    if (rawStats.length === 0) {
      return (summary?.top_rated_players ?? []).map(p => ({
        name: String(p.name ?? ''), team: String(p.team ?? ''),
        pos: String(p.pos ?? ''), rating: Number(p.rating ?? 0), goals: Number(p.goals ?? 0),
      }))
    }
    const playerLookup = new Map<number, { name: string; pos: string }>()
    for (const p of [...homeRoster, ...awayRoster]) {
      const pp = p as unknown as Record<string, unknown>
      playerLookup.set(p.id, {
        name: String(pp.name ?? ''),
        pos: String(pp.specific_position ?? pp.position ?? ''),
      })
    }
    const pick = (tid: number, teamName: string) =>
      rawStats
        .filter(p => (p.team_id as number) === tid && Number(p.rating) > 0)
        .sort((a, b) => Number(b.rating) - Number(a.rating))
        .slice(0, 3)
        .map(p => {
          const info = playerLookup.get(p.player_id as number)
          return {
            name: info?.name || 'Unknown', team: teamName,
            pos: info?.pos || '', rating: Number(p.rating) || 0, goals: Number(p.goals) || 0,
          }
        })
    return [...pick(homeId, homeTeam), ...pick(awayId, awayTeam)]
  })()

  /* Player image lookup from rosters */
  const playerImageMap = new Map<number, string>()
  const playerRosterImages: { name: string; imageUrl: string }[] = []
  for (const p of [...homeRoster, ...awayRoster]) {
    const pp = p as unknown as Record<string, unknown>
    if (pp.image_url && typeof pp.image_url === 'string') {
      playerImageMap.set(p.id, pp.image_url)
      if (pp.name && typeof pp.name === 'string') {
        playerRosterImages.push({ name: pp.name, imageUrl: pp.image_url })
      }
    }
  }

  /* Enrich lineup players with image_url */
  const enrichedLineups = lineups ? {
    home: {
      ...lineups.home,
      players:    lineups.home.players.map(p => ({ ...p, image_url: playerImageMap.get(p.id) })),
      substitutes: lineups.home.substitutes.map(p => ({ ...p, image_url: playerImageMap.get(p.id) })),
    },
    away: {
      ...lineups.away,
      players:    lineups.away.players.map(p => ({ ...p, image_url: playerImageMap.get(p.id) })),
      substitutes: lineups.away.substitutes.map(p => ({ ...p, image_url: playerImageMap.get(p.id) })),
    },
  } : lineups

  /* Shared inline styles */
  const pill: React.CSSProperties = { background: '#1a1a1a', padding: '4px 10px', fontSize: 10, color: '#777', letterSpacing: 1 }

  return (
    <div>
      <Link href="/matches" className="back-btn mb-4 block">← BACK TO MATCHES</Link>

      {/* Sticky score bar — slides in on scroll */}
      <StickyScoreBar
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        homeAbbr={homeAbbr}
        awayAbbr={awayAbbr}
        homeScore={ev.home_score}
        awayScore={ev.away_score}
        scrollThreshold={220}
      />

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <div style={{ background: '#111', padding: '28px 20px 0', position: 'relative', overflow: 'hidden' }}>

        {/* Watermark */}
        <div className="font-display" style={{
          fontSize: 160, color: '#1a1a1a', position: 'absolute',
          top: -20, left: -10, lineHeight: 1,
          pointerEvents: 'none', userSelect: 'none', letterSpacing: -5,
        }}>
          {wm}
        </div>

        {/* Breadcrumb */}
        <div style={{ fontSize: 10, color: '#555', letterSpacing: 3, marginBottom: 12, position: 'relative', zIndex: 1 }}>
          {[ev.group_name || ev.round_name].filter(Boolean).join(' · ').toUpperCase()}
        </div>

        {/* Match context line */}
        {(() => {
          const d = new Date(ev.event_date)
          const dateStr = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
          const roundLabel = ev.round_number ? `Round ${ev.round_number}` : (ev.round_name || ev.group_name || 'Group Stage')
          return (
            <div style={{ fontSize: 11, color: '#555', letterSpacing: 1, marginBottom: 16, position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <span>🏆</span>
              <span>World Cup 2026</span>
              <span style={{ color: '#333' }}>·</span>
              <span>{roundLabel}</span>
              <span style={{ color: '#333' }}>·</span>
              <span>{dateStr}</span>
            </div>
          )
        })()}

        {/* Teams + score */}
        <div className={pageStyles.heroRow} style={{ position: 'relative', zIndex: 1, marginBottom: 8 }}>
          {/* Home */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Link href={homeId ? `/teams/${homeId}` : '#'} style={{ textDecoration: 'none', display: 'inline-block' }}>
              <div style={{ marginBottom: 10, width: 64, height: 64, borderRadius: '50%', border: '2px solid #2a2a2a', background: '#0d0d0d', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FlagImg country={homeTeam} width={72} cdnSize={80} />
              </div>
              <div style={{ fontSize: 11, color: '#555', letterSpacing: '2.5px', marginBottom: 2 }}>{homeAbbr}</div>
              <div className={`font-display ${pageStyles.teamName}`}>
                {homeTeam.toUpperCase()}
              </div>
            </Link>
            {homeScorerLines.length > 0 && (
              <div style={{ marginTop: 10 }}>
                {homeScorerLines.map(({ name, minutes, playerId }) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                    <span style={{ fontSize: 11 }}>⚽</span>
                    {playerId ? (
                      <Link href={`/players/${playerId}`} style={{ fontSize: 11, color: '#c8c8c8', fontWeight: 600, textDecoration: 'none' }}>{name}</Link>
                    ) : (
                      <span style={{ fontSize: 11, color: '#c8c8c8', fontWeight: 600 }}>{name}</span>
                    )}
                    <span style={{ fontSize: 10, color: '#555' }}>{minutes.join(', ')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Score */}
          <div className={pageStyles.scoreBlock}>
            <div className={`font-display ${pageStyles.scoreNum}`}>
              {ev.home_score}–{ev.away_score}
            </div>
            {ev.home_score_ht !== null && (
              <div style={{ fontSize: 11, color: '#444', letterSpacing: 1, marginTop: 4 }}>
                HT · {ev.home_score_ht}–{ev.away_score_ht}
              </div>
            )}
          </div>

          {/* Away */}
          <div style={{ flex: 1, textAlign: 'right', minWidth: 0 }}>
            <Link href={awayId ? `/teams/${awayId}` : '#'} style={{ textDecoration: 'none', display: 'inline-block', textAlign: 'right' }}>
              <div style={{ marginBottom: 10, width: 64, height: 64, borderRadius: '50%', border: '2px solid #2a2a2a', background: '#0d0d0d', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' }}>
                <FlagImg country={awayTeam} width={72} cdnSize={80} />
              </div>
              <div style={{ fontSize: 11, color: '#555', letterSpacing: '2.5px', marginBottom: 2 }}>{awayAbbr}</div>
              <div className={`font-display ${pageStyles.teamName}`}>
                {awayTeam.toUpperCase()}
              </div>
            </Link>
            {awayScorerLines.length > 0 && (
              <div style={{ marginTop: 10 }}>
                {awayScorerLines.map(({ name, minutes, playerId }) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5, marginTop: 3 }}>
                    <span style={{ fontSize: 10, color: '#555' }}>{minutes.join(', ')}</span>
                    {playerId ? (
                      <Link href={`/players/${playerId}`} style={{ fontSize: 11, color: '#888', fontWeight: 600, textDecoration: 'none' }}>{name}</Link>
                    ) : (
                      <span style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>{name}</span>
                    )}
                    <span style={{ fontSize: 11 }}>⚽</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info pills row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderTop: '0.5px solid #222', paddingTop: 12, marginTop: 12, paddingBottom: 16,
          position: 'relative', zIndex: 1, gap: 8, flexWrap: 'wrap',
        }}>
          {/* Left pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={pill}>FULL TIME</span>
            {xgHome !== null && (
              <span style={pill}>xG {xgHome.toFixed(2)} – {xgAway?.toFixed(2) ?? '—'}</span>
            )}
            {homeFormation && awayFormation && (
              <span style={pill}>{homeFormation} vs {awayFormation}</span>
            )}
            {detail.weather && (
              <span style={pill}>{detail.weather.temperature_c}°C · {detail.weather.description}</span>
            )}
          </div>

          {/* Right: Stadium name */}
          {venue?.name && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
              <span style={{ fontSize: 12, color: '#f5f0e8', fontWeight: 600, letterSpacing: 1 }}>
                {venue.name.toUpperCase()}
              </span>
              {venue.city && (
                <span style={{ fontSize: 10, color: '#555', letterSpacing: 1 }}>
                  {venue.city.toUpperCase()}
                  {venue.capacity ? ` · ${venue.capacity.toLocaleString()}` : ''}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ══ TABBED CONTENT ════════════════════════════════════════ */}
      <MatchTabs
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        homeAbbr={homeAbbr}
        awayAbbr={awayAbbr}
        incidents={incidents}
        hStats={hStats}
        aStats={aStats}
        hasStats={hasStats}
        xgHome={xgHome}
        xgAway={xgAway}
        homeScorers={homeScorers}
        awayScorers={awayScorers}
        topPlayers={topPlayers}
        playerRosterImages={playerRosterImages}
        lineups={enrichedLineups}
        homeCoach={ev.home_coach?.name ?? null}
        awayCoach={ev.away_coach?.name ?? null}
        bsdStats={bsdStats}
        venue={venue ?? null}
        matchDate={ev.event_date}
        roundLabel={ev.round_number
          ? `Round ${ev.round_number}${ev.group_name ? ` · ${ev.group_name}` : ''}`
          : (ev.group_name || ev.round_name || null)}
        prediction={prediction ? {
          probHomeWin:    prediction.prob_home_win,
          probDraw:       prediction.prob_draw,
          probAwayWin:    prediction.prob_away_win,
          mostLikelyScore: prediction.most_likely_score,
        } : null}
        groupStandings={groupStandings}
        groupName={groupName}
      />

      {/* ══ BOTTOM BAR ════════════════════════════════════════════ */}
      <div style={{ background: '#111', padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <div style={{ fontSize: 10, color: '#333', letterSpacing: 2 }}>
          WC2026 · {(ev.group_name || ev.round_name || 'GROUP STAGE').toUpperCase()}
        </div>
      </div>
    </div>
  )
}
