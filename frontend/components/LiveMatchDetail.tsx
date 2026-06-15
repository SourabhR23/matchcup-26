'use client'

import { useEffect, useState, useCallback } from 'react'
import { getAbbrev } from '@/lib/flags'
import FlagImg from '@/components/FlagImg'
import MatchTabs from '@/components/MatchTabs'
import type { ExtStats } from '@/components/MatchTabs'
import type { Incident } from '@/lib/types'
import type { MatchPrediction } from '@/lib/predictions'

/* ── Raw types from /api/live/{id} ──────────────────────────────── */
interface LiveDetail {
  id: number
  home_team: string; away_team: string
  home_team_id?: number; away_team_id?: number
  home_score: number; away_score: number
  home_score_ht?: number | null; away_score_ht?: number | null
  current_minute: number | null; period: string; status: string
  group_name?: string; round_name?: string; round_number?: number
  event_date?: string
  home_xg_live?: number | null; away_xg_live?: number | null
  actual_home_xg?: number | null; actual_away_xg?: number | null
  venue?: { name?: string; city?: string; capacity?: number }
  referee?: { name?: string }
  weather?: { temperature_c?: number; description?: string }
  lineups?: LineupsRaw
}
interface LineupPlayer {
  id?: number; name?: string; player_name?: string
  short_name?: string; position?: string; jersey_number?: number
}
interface LineupTeamRaw  { formation?: string; players?: unknown[]; substitutes?: unknown[] }
interface LineupsRaw     { home?: LineupTeamRaw; away?: LineupTeamRaw }

/* ── Status helpers ─────────────────────────────────────────────── */
function minuteLabel(d: LiveDetail): string {
  const p = (d.period ?? d.status ?? '').toLowerCase()
  if (p === 'half_time' || p === 'ht')                            return 'HT'
  if (p === 'extra_time' || p === 'et')                           return `ET ${d.current_minute ?? '?'}'`
  if (p === 'penalty_shootout' || p === 'penalty' || p === 'pso') return 'PSO'
  if (p === 'finished' || p === 'ft' || p === 'ended')            return 'FT'
  return d.current_minute ? `${d.current_minute}'` : 'LIVE'
}

function groupWatermark(d: LiveDetail): string {
  const m = (d.group_name ?? '').match(/Group\s+([A-Z])/i)
  if (m) return `GRP ${m[1]}`
  const r = (d.round_name ?? '').toLowerCase()
  if (r.includes('32')) return 'R32'
  if (r.includes('16')) return 'R16'
  if (r.includes('quarter')) return 'QF'
  if (r.includes('semi'))    return 'SF'
  if (r.includes('final'))   return 'FNL'
  return 'WC26'
}

/* ── Stats builder ──────────────────────────────────────────────── */
// BSD /statistics/ returns keys as stat display names (e.g. "Ball Possession", "Total Shots")
// Try title-case then snake_case fallback
function gs(obj: Record<string, number>, ...keys: string[]): number {
  for (const k of keys) {
    const v = obj[k]
    if (v != null && v !== 0) return v
    const sk = k.toLowerCase().replace(/ /g, '_')
    const sv = obj[sk]
    if (sv != null && sv !== 0) return sv
  }
  return 0
}

function buildExtStats(obj: Record<string, number>, xg: number | null): ExtStats {
  return {
    shots:          gs(obj, 'Total Shots', 'Shots'),
    onTarget:       gs(obj, 'Shots on Target', 'On Target'),
    passes:         gs(obj, 'Total Passes', 'Passes', 'Accurate Passes'),
    accuratePasses: gs(obj, 'Accurate Passes'),
    dribbles:       gs(obj, 'Dribbles', 'Dribble Attempts'),
    dribblesWon:    gs(obj, 'Dribbles Won'),
    tackles:        gs(obj, 'Tackles'),
    tacklesWon:     gs(obj, 'Tackles Won'),
    clearances:     gs(obj, 'Clearances'),
    interceptions:  gs(obj, 'Interceptions'),
    blocks:         gs(obj, 'Blocked Shots'),
    recoveries:     gs(obj, 'Ball Recoveries', 'Recoveries'),
    longBalls:      gs(obj, 'Long Balls'),
    crosses:        gs(obj, 'Total Crosses', 'Crosses'),
    aerialWon:      gs(obj, 'Aerial Duels Won'),
    aerialTotal:    gs(obj, 'Aerial Duels'),
    fouls:          gs(obj, 'Fouls'),
    fouled:         gs(obj, 'Was Fouled', 'Fouled'),
    yellow:         gs(obj, 'Yellow Cards'),
    red:            gs(obj, 'Red Cards'),
    xg:             xg ?? 0,
    keyPasses:      gs(obj, 'Key Passes'),
  }
}

const emptyStats = (): ExtStats => ({
  shots: 0, onTarget: 0, passes: 0, accuratePasses: 0,
  dribbles: 0, dribblesWon: 0, tackles: 0, tacklesWon: 0,
  clearances: 0, interceptions: 0, blocks: 0, recoveries: 0,
  longBalls: 0, crosses: 0, aerialWon: 0, aerialTotal: 0,
  fouls: 0, fouled: 0, yellow: 0, red: 0, xg: 0, keyPasses: 0,
})

/* ── Lineup normaliser ──────────────────────────────────────────── */
function normPlayers(arr: unknown[]) {
  return (arr as LineupPlayer[]).map(p => ({
    id:            p.id ?? 0,
    name:          p.name ?? p.player_name ?? '',
    short_name:    p.short_name,
    position:      p.position ?? '',
    jersey_number: p.jersey_number,
  }))
}

function normLineups(raw: LineupsRaw | null | undefined) {
  if (!raw?.home && !raw?.away) return null
  return {
    home: {
      formation:   raw.home?.formation ?? '',
      players:     normPlayers(raw.home?.players    ?? []),
      substitutes: normPlayers(raw.home?.substitutes ?? []),
    },
    away: {
      formation:   raw.away?.formation ?? '',
      players:     normPlayers(raw.away?.players    ?? []),
      substitutes: normPlayers(raw.away?.substitutes ?? []),
    },
  }
}

/* ── Component ──────────────────────────────────────────────────── */
export default function LiveMatchDetail({ eventId }: { eventId: number }) {
  const [detail,     setDetail]     = useState<LiveDetail | null>(null)
  const [incidents,  setIncidents]  = useState<Incident[]>([])
  const [stats,      setStats]      = useState<Record<string, Record<string, number>> | null>(null)
  const [lineups,    setLineups]    = useState<LineupsRaw | null>(null)
  const [prediction, setPrediction] = useState<MatchPrediction | null>(null)
  const [lastUpdate, setLastUpdate] = useState('')
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const r = await fetch(`/api/live/${eventId}`, { cache: 'no-store' })
      if (!r.ok) { setError(true); return }
      const data = await r.json() as {
        detail: LiveDetail
        incidents: Incident[]
        stats: Record<string, Record<string, number>> | null
        lineups: LineupsRaw | null
      }
      if (data.detail) {
        setDetail(data.detail)
        setIncidents(data.incidents ?? [])
        setStats(data.stats ?? null)
        setLineups(data.lineups ?? null)
        setLastUpdate(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
        setError(false)
        const s = (data.detail.status ?? '').toLowerCase()
        if (s === 'finished' || s === 'ft' || s === 'ended') {
          fetch(`/api/collect/${eventId}`, { method: 'POST' }).catch(() => {})
        }
      } else {
        setError(true)
      }
    } catch { setError(true) }
    finally   { setLoading(false) }
  }, [eventId])

  useEffect(() => {
    fetchData()
    const iv = setInterval(fetchData, 30000)
    return () => clearInterval(iv)
  }, [fetchData])

  useEffect(() => {
    fetch(`/api/predictions/${eventId}`)
      .then(r => r.ok ? r.json() : null)
      .then((d: MatchPrediction | null) => { if (d) setPrediction(d) })
      .catch(() => {})
  }, [eventId])

  /* Loading / error */
  if (loading) return (
    <div style={{ background: '#111', padding: '48px 20px', textAlign: 'center' }}>
      <div className="font-display" style={{ fontSize: 28, letterSpacing: 4, color: '#666' }}>LOADING…</div>
    </div>
  )
  if (error || !detail) return (
    <div style={{ background: '#111', padding: '48px 20px', textAlign: 'center' }}>
      <div className="font-display" style={{ fontSize: 24, letterSpacing: 3, color: '#666' }}>DATA UNAVAILABLE</div>
      <div style={{ fontSize: 11, color: '#666', marginTop: 8 }}>Live data may not yet be available.</div>
    </div>
  )

  /* ── Derived ── */
  const homeAbbr = getAbbrev(detail.home_team)
  const awayAbbr = getAbbrev(detail.away_team)
  const wm       = groupWatermark(detail)
  const minute   = minuteLabel(detail)

  const LIVE_STATUSES = ['inprogress', 'live', '1H', '2H', 'first_half', 'second_half',
                         'ET', 'extra_time', 'penalty', 'penalty_shootout', 'interrupted']
  const isHT   = detail.period === 'half_time' || detail.period === 'HT'
              || detail.status === 'HT'         || detail.status === 'half_time'
  const isFT   = detail.status === 'finished'  || detail.status === 'FT' || detail.status === 'ended'
  const isLive = LIVE_STATUSES.includes(detail.status)
              || (!isHT && !isFT && detail.current_minute != null)
  const hasScore = detail.home_score != null && detail.away_score != null

  const xgHome = detail.home_xg_live ?? detail.actual_home_xg ?? null
  const xgAway = detail.away_xg_live ?? detail.actual_away_xg ?? null

  const homeFormation = lineups?.home?.formation ?? detail.lineups?.home?.formation
  const awayFormation = lineups?.away?.formation ?? detail.lineups?.away?.formation

  /* ExtStats */
  const h        = stats?.home ?? {}
  const a        = stats?.away ?? {}
  const hasStats = Object.keys(h).length > 0
  const hStats   = hasStats ? buildExtStats(h, xgHome) : emptyStats()
  const aStats   = hasStats ? buildExtStats(a, xgAway) : emptyStats()

  /* Scorers */
  const homeScorers: Record<string, number> = {}
  const awayScorers: Record<string, number> = {}
  for (const inc of incidents) {
    if (inc.type === 'goal') {
      const map  = inc.is_home ? homeScorers : awayScorers
      const name = inc.player ?? 'Unknown'
      map[name]  = (map[name] || 0) + 1
    }
  }

  /* Lineups + prediction for MatchTabs */
  const normLu = normLineups(lineups ?? detail.lineups)
  const pred = prediction ? {
    probHomeWin:        prediction.prob_home_win,
    probDraw:           prediction.prob_draw,
    probAwayWin:        prediction.prob_away_win,
    mostLikelyScore:    prediction.most_likely_score,
    confidence:         prediction.confidence,
    probBttsYes:        prediction.prob_btts_yes,
    probOver15:         prediction.prob_over_15,
    probOver25:         prediction.prob_over_25,
    probOver35:         prediction.prob_over_35,
    bttsRecommend:      prediction.btts_recommend,
    over15Recommend:    prediction.over_15_recommend,
    over25Recommend:    prediction.over_25_recommend,
    over35Recommend:    prediction.over_35_recommend,
    winnerRecommend:    prediction.winner_recommend,
    expectedHomeGoals:  prediction.expected_home_goals,
    expectedAwayGoals:  prediction.expected_away_goals,
    favorite:           prediction.favorite,
    predictedResult:    prediction.predicted_result,
    funfacts:           prediction.funfacts,
    aiPreview:          prediction.ai_preview,
  } : null

  const roundLabel = detail.round_number
    ? `Round ${detail.round_number}`
    : (detail.round_name || detail.group_name || 'Group Stage')

  const pill: React.CSSProperties = { background: '#1a1a1a', padding: '4px 10px', fontSize: 10, color: '#777', letterSpacing: 1 }

  return (
    <div>
      {/* ══ HERO — identical structure to completed match page ══════════ */}
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
          {[detail.group_name || detail.round_name].filter(Boolean).join(' · ').toUpperCase()}
        </div>

        {/* Context line */}
        <div style={{ fontSize: 11, color: '#555', letterSpacing: 1, marginBottom: 16, position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <span>🏆</span>
          <span>World Cup 2026</span>
          <span style={{ color: '#666' }}>·</span>
          <span>{roundLabel}</span>
          {detail.event_date && (
            <>
              <span style={{ color: '#666' }}>·</span>
              <span>{new Date(detail.event_date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </>
          )}
        </div>

        {/* Teams + score */}
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative', zIndex: 1, gap: 0, marginBottom: 8 }}>
          {/* Home */}
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 8 }}><FlagImg country={detail.home_team} width={48} cdnSize={80} /></div>
            <div style={{ fontSize: 11, color: '#555', letterSpacing: '2.5px', marginBottom: 2 }}>{homeAbbr}</div>
            <div className="font-display" style={{ fontSize: 52, color: '#f5f0e8', lineHeight: 1, letterSpacing: 2 }}>
              {detail.home_team.toUpperCase()}
            </div>
          </div>

          {/* Score */}
          <div style={{ textAlign: 'center', padding: '0 16px', minWidth: 100 }}>
            {hasScore ? (
              <>
                <div className="font-display" style={{ fontSize: 72, color: 'var(--color-accent)', lineHeight: 1, letterSpacing: 4 }}>
                  {detail.home_score}–{detail.away_score}
                </div>
                {detail.home_score_ht != null && (
                  <div style={{ fontSize: 11, color: '#777', letterSpacing: 1, marginTop: 2 }}>
                    HT: {detail.home_score_ht}–{detail.away_score_ht}
                  </div>
                )}
              </>
            ) : (
              <div className="font-display" style={{ fontSize: 52, color: '#666', lineHeight: 1, letterSpacing: 4 }}>VS</div>
            )}
          </div>

          {/* Away */}
          <div style={{ flex: 1, textAlign: 'right' }}>
            <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'flex-end' }}><FlagImg country={detail.away_team} width={48} cdnSize={80} /></div>
            <div style={{ fontSize: 11, color: '#555', letterSpacing: '2.5px', marginBottom: 2 }}>{awayAbbr}</div>
            <div className="font-display" style={{ fontSize: 52, color: '#f5f0e8', lineHeight: 1, letterSpacing: 2 }}>
              {detail.away_team.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Info pills — same layout as completed page */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderTop: '0.5px solid #222', paddingTop: 12, marginTop: 12, paddingBottom: 16,
          position: 'relative', zIndex: 1, gap: 8, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Status pill */}
            {isHT ? (
              <span style={{ ...pill, color: '#888' }}>⏸ HALF TIME</span>
            ) : isLive ? (
              <span style={{ ...pill, color: '#cc0000' }}>● LIVE · {minute}</span>
            ) : isFT ? (
              <span style={pill}>FULL TIME</span>
            ) : (
              <span style={{ ...pill, color: 'var(--color-accent)' }}>KICK OFF SOON</span>
            )}

            {xgHome != null && (
              <span style={pill}>xG {xgHome.toFixed(2)} – {xgAway?.toFixed(2) ?? '—'}</span>
            )}
            {homeFormation && awayFormation && (
              <span style={pill}>{homeFormation} vs {awayFormation}</span>
            )}
            {detail.weather?.temperature_c != null && (
              <span style={pill}>{detail.weather.temperature_c}°C{detail.weather.description ? ` · ${detail.weather.description}` : ''}</span>
            )}
          </div>

          {/* Right: venue block */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            {detail.venue?.name && (
              <span style={{ fontSize: 12, color: '#f5f0e8', fontWeight: 600, letterSpacing: 1 }}>
                {detail.venue.name.toUpperCase()}
              </span>
            )}
            {detail.venue?.city && (
              <span style={{ fontSize: 10, color: '#555', letterSpacing: 1 }}>
                {detail.venue.city.toUpperCase()}
                {detail.venue.capacity ? ` · ${detail.venue.capacity.toLocaleString()}` : ''}
              </span>
            )}
            <span style={{ fontSize: 9, color: '#777', letterSpacing: 1, marginTop: 2 }}>
              {detail.referee?.name ? `${detail.referee.name}  ·  ` : ''}
              {lastUpdate ? `Updated ${lastUpdate}` : ''}
              {isLive && <span style={{ color: '#cc0000' }}> · auto-refresh 30s</span>}
            </span>
          </div>
        </div>
      </div>

      {/* ══ MATCH TABS — same component as completed page ══════════════ */}
      <MatchTabs
        homeTeam={detail.home_team}
        awayTeam={detail.away_team}
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
        topPlayers={[]}
        lineups={normLu}
        bsdStats={null}
        prediction={pred}
        venue={detail.venue ?? null}
        matchDate={detail.event_date ?? null}
        roundLabel={roundLabel}
        isLive={isLive || isHT}
      />
    </div>
  )
}
