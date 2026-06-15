'use client'

import { useState, useMemo } from 'react'
import styles from './MatchTabs.module.css'
import FlagImg from './FlagImg'
import { buildPlayerFlags } from './match/lineup/pitchUtils'
import LineupPitchView from './match/lineup/LineupPitchView'
import BsdStatsPanel from './match/stats/BsdStatsPanel'
import BsdVizPanel from './match/stats/BsdVizPanel'
import StandingsPanel from './match/standings/StandingsPanel'
import OverviewTab from './match/overview/OverviewTab'
import PredictionTab from './match/prediction/PredictionTab'
import { StatSectionA, StatRowA } from './match/stats/helpers'
import type { OvProps } from './match/types'

export type { ExtStats, MatchTabsProps } from './match/types'

import type { MatchTabsProps } from './match/types'

type Tab = 'overview' | 'lineups' | 'stats' | 'analysis' | 'standings' | 'prediction'

export default function MatchTabs({
  homeTeam, awayTeam, homeAbbr, awayAbbr,
  incidents, hStats, aStats, hasStats,
  xgHome, xgAway, homeScorers, awayScorers,
  topPlayers, playerRosterImages, lineups, bsdStats, prediction,
  venue, matchDate, roundLabel, homeCoach, awayCoach,
  groupStandings, groupName, isLive,
}: MatchTabsProps) {
  const [tab, setTab] = useState<Tab>(isLive && lineups ? 'lineups' : 'overview')

  const homeYellows = incidents.filter(i => i.is_home && i.type === 'card' && i.card_type === 'yellow').length
  const awayYellows = incidents.filter(i => !i.is_home && i.type === 'card' && i.card_type === 'yellow').length
  const homeReds    = incidents.filter(i => i.is_home && i.type === 'card' && i.card_type === 'red').length
  const awayReds    = incidents.filter(i => !i.is_home && i.type === 'card' && i.card_type === 'red').length
  const hPassAcc    = hStats.passes > 0 ? (hStats.accuratePasses / hStats.passes) * 100 : 0
  const aPassAcc    = aStats.passes > 0 ? (aStats.accuratePasses / aStats.passes) * 100 : 0
  const playerFlags = buildPlayerFlags(incidents)

  const playerImageMap = useMemo(() => {
    const m = new Map<string, string>()
    // Roster names match topPlayers names (both from Supabase)
    for (const p of (playerRosterImages ?? [])) {
      m.set(p.name, p.imageUrl)
    }
    // Also index by lineup player names as fallback (BSD API names)
    if (lineups) {
      const all = [...lineups.home.players, ...lineups.home.substitutes, ...lineups.away.players, ...lineups.away.substitutes]
      for (const p of all) { if (p.image_url) m.set(p.name, p.image_url) }
    }
    return m
  }, [lineups, playerRosterImages])

  const tabBtn = (t: Tab, label: string) => (
    <button onClick={() => setTab(t)} style={{
      padding: '12px 20px', fontSize: 10, letterSpacing: 2, fontWeight: 700,
      background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase',
      color: tab === t ? '#111' : '#aaa',
      borderBottom: tab === t ? '2px solid #111' : '2px solid transparent',
      transition: 'color 0.15s, border-color 0.15s',
    }}>
      {label}
    </button>
  )

  const ovProps: OvProps = {
    homeTeam, awayTeam, homeAbbr, awayAbbr,
    incidents, hStats, aStats, hasStats,
    xgHome, xgAway,
    homeYellows, awayYellows, homeReds, awayReds,
    hPassAcc, aPassAcc,
    topPlayers, playerImageMap, bsdStats, prediction,
    venue, matchDate, roundLabel, isLive,
  }

  return (
    <div style={{ background: '#f5f0e8' }}>

      {/* ── Tab bar ── */}
      <div className={styles.tabBar} style={{ background: '#fff', borderBottom: '1px solid #e8e2d8', paddingLeft: 4 }}>
        {tabBtn('overview', 'Overview')}
        {tabBtn('lineups', 'Lineups')}
        {(!isLive || hasStats || bsdStats) && tabBtn('stats', 'Stats')}
        {bsdStats && tabBtn('analysis', 'Analysis')}
        {groupStandings && groupStandings.length > 0 && tabBtn('standings', 'Standings')}
        {prediction && tabBtn('prediction', 'Prediction')}
      </div>

      {/* ── Overview ── */}
      {tab === 'overview' && <OverviewTab {...ovProps} />}

      {/* ══ LINEUPS ══════════════════════════════════════════════════ */}
      {tab === 'lineups' && (
        lineups ? (
          <LineupPitchView
            lineups={lineups}
            homeTeam={homeTeam} awayTeam={awayTeam}
            homeAbbr={homeAbbr} awayAbbr={awayAbbr}
            flags={playerFlags}
            homeCoach={homeCoach}
            awayCoach={awayCoach}
          />
        ) : (
          <div style={{ padding: 48, textAlign: 'center', fontSize: 12, color: '#777' }}>Lineup data not available.</div>
        )
      )}

      {/* ══ STATS ══════════════════════════════════════════════════ */}
      {tab === 'stats' && bsdStats && (
        <BsdStatsPanel
          bsd={bsdStats}
          homeTeam={homeTeam} awayTeam={awayTeam}
          homeAbbr={homeAbbr} awayAbbr={awayAbbr}
          incidents={incidents}
          xgHome={xgHome} xgAway={xgAway}
          lineups={lineups}
        />
      )}
      {tab === 'analysis' && bsdStats && (
        <BsdVizPanel
          bsd={bsdStats}
          homeTeam={homeTeam} awayTeam={awayTeam}
          incidents={incidents}
          lineups={lineups}
        />
      )}
      {tab === 'stats' && !bsdStats && (
        /* ── Variant A: Dark Broadcast ── */
        <div style={{ background: '#111', padding: '0 24px 28px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #1e1e1e', marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#f5f0e8', letterSpacing: 1 }}>{homeTeam.toUpperCase()}</span>
            <span style={{ fontSize: 9, letterSpacing: 3, color: '#666' }}>MATCH STATS</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#666', letterSpacing: 1 }}>{awayTeam.toUpperCase()}</span>
          </div>

          {hasStats ? (
            <>
              <StatSectionA title="ATTACKING" />
              <StatRowA label="Shots" h={hStats.shots} a={aStats.shots} />
              <StatRowA label="Shots on Target" h={hStats.onTarget} a={aStats.onTarget} />
              <StatRowA label="Shot Accuracy" h={hStats.shots > 0 ? Math.round((hStats.onTarget/hStats.shots)*100) : 0} a={aStats.shots > 0 ? Math.round((aStats.onTarget/aStats.shots)*100) : 0} isPercent />
              <StatRowA label="Expected Goals (xG)" h={parseFloat((xgHome ?? 0).toFixed(2))} a={parseFloat((xgAway ?? 0).toFixed(2))} />
              <StatRowA label="Key Passes" h={hStats.keyPasses} a={aStats.keyPasses} hideWhenZero />

              <StatSectionA title="POSSESSION" />
              <StatRowA label="Total Passes" h={hStats.passes} a={aStats.passes} />
              <StatRowA label="Pass Accuracy" h={Math.round(hPassAcc)} a={Math.round(aPassAcc)} isPercent />
              <StatRowA label="Long Balls" h={hStats.longBalls} a={aStats.longBalls} hideWhenZero />
              <StatRowA label="Crosses" h={hStats.crosses} a={aStats.crosses} hideWhenZero />

              <StatSectionA title="DUELS & DRIBBLES" />
              <StatRowA label="Dribbles Attempted" h={hStats.dribbles} a={aStats.dribbles} hideWhenZero />
              <StatRowA label="Dribbles Won" h={hStats.dribblesWon} a={aStats.dribblesWon} hideWhenZero />
              <StatRowA label="Aerial Duels Won" h={hStats.aerialWon} a={aStats.aerialWon} hideWhenZero />

              <StatSectionA title="DEFENDING" />
              <StatRowA label="Tackles Won" h={hStats.tacklesWon} a={aStats.tacklesWon} hideWhenZero />
              <StatRowA label="Clearances" h={hStats.clearances} a={aStats.clearances} hideWhenZero />
              <StatRowA label="Interceptions" h={hStats.interceptions} a={aStats.interceptions} hideWhenZero />
              <StatRowA label="Blocks" h={hStats.blocks} a={aStats.blocks} hideWhenZero />
              <StatRowA label="Ball Recoveries" h={hStats.recoveries} a={aStats.recoveries} hideWhenZero />

              <StatSectionA title="DISCIPLINE" />
              <StatRowA label="Fouls Committed" h={hStats.fouls} a={aStats.fouls} />
              <StatRowA label="Yellow Cards" h={homeYellows} a={awayYellows} />
              {(homeReds + awayReds) > 0 && <StatRowA label="Red Cards" h={homeReds} a={awayReds} />}
            </>
          ) : (
            <>
              <StatSectionA title="DISCIPLINE" />
              <StatRowA label="Yellow Cards" h={homeYellows} a={awayYellows} />
              {(homeReds + awayReds) > 0 && <StatRowA label="Red Cards" h={homeReds} a={awayReds} />}
              <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 12, color: '#666' }}>
                Detailed player statistics not yet available.
              </div>
            </>
          )}

          {/* xG footer */}
          {(xgHome !== null || xgAway !== null) && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1e1e1e', marginTop: 20, paddingTop: 18 }}>
              <div>
                <div className="font-display" style={{ fontSize: 52, color: xgHome ? 'var(--color-accent)' : '#2a2a2a', lineHeight: 1 }}>{xgHome?.toFixed(2) ?? '—'}</div>
                <div style={{ fontSize: 9, color: '#777', letterSpacing: 2, marginTop: 3 }}>{homeAbbr} EXPECTED GOALS</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="font-display" style={{ fontSize: 36, color: '#666', lineHeight: 1 }}>{xgAway?.toFixed(2) ?? '—'}</div>
                <div style={{ fontSize: 9, color: '#666', letterSpacing: 2, marginTop: 3 }}>{awayAbbr} EXPECTED GOALS</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ STANDINGS ══════════════════════════════════════════════ */}
      {tab === 'standings' && groupStandings && groupStandings.length > 0 && (
        <StandingsPanel
          teams={groupStandings}
          groupName={groupName}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
        />
      )}

      {/* ══ PREDICTION ═════════════════════════════════════════════ */}
      {tab === 'prediction' && prediction && (
        <PredictionTab
          prediction={prediction}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          homeAbbr={homeAbbr}
          awayAbbr={awayAbbr}
        />
      )}

    </div>
  )
}
