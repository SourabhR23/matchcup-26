'use client'

import styles from './OvD1Classic.module.css'
import type { OvProps } from '../types'
import OvPredBanner from './OvPredBanner'
import IncidentTimeline from '@/components/IncidentTimeline'
import TopPlayersSection from '../shared/TopPlayersSection'
import MatchFactsSection from '../shared/MatchFactsSection'

export default function OvD1Classic({ homeTeam, awayTeam, homeAbbr, awayAbbr, incidents, hStats, aStats, hasStats, xgHome, xgAway, homeYellows, awayYellows, hPassAcc, aPassAcc, topPlayers, playerImageMap, bsdStats, prediction, venue, matchDate, roundLabel }: OvProps) {
  const bsd = bsdStats?.stats
  const fmt = (v: number, pct?: boolean, dec?: boolean) => dec ? v.toFixed(2) : pct ? `${v}%` : String(v)
  const statList = [
    { label:'Shots',      h:hStats.shots,         a:aStats.shots },
    { label:'On Target',  h:hStats.onTarget,      a:aStats.onTarget },
    { label:'Passes',     h:hStats.passes,        a:aStats.passes },
    { label:'Pass Acc.',  h:Math.round(hPassAcc), a:Math.round(aPassAcc), pct:true },
    { label:'Dribbles',   h:hStats.dribbles,      a:aStats.dribbles },
    { label:'Tackles',    h:hStats.tackles,       a:aStats.tackles },
    { label:'Fouls',      h:hStats.fouls,         a:aStats.fouls },
    { label:'Yellow',     h:homeYellows,          a:awayYellows },
    ...(bsd ? [
      { label:'Possession', h:bsd.home.ball_possession??0, a:bsd.away.ball_possession??0, pct:true },
      { label:'Corners',    h:bsd.home.corner_kicks??0,    a:bsd.away.corner_kicks??0 },
      { label:'Offsides',   h:bsd.home.offsides??0,        a:bsd.away.offsides??0 },
    ] : []),
  ]
  return (
    <div style={{ background:'#111' }}>
      <OvPredBanner prediction={prediction} homeAbbr={homeAbbr} awayAbbr={awayAbbr} />
      <div className={styles.twoCol}>
        <div style={{ borderRight:'1px solid #1c1c1c' }}>
          <div style={{ padding:'20px 20px 16px' }}>
            <div style={{ fontSize:9, letterSpacing:3, fontWeight:800, color:'var(--color-accent)', borderBottom:'1px solid #1c1c1c', paddingBottom:8, marginBottom:14 }}>MATCH EVENTS</div>
            {incidents.length === 0
              ? <div style={{ fontSize:11, color:'#2a2a2a', textAlign:'center', padding:'24px 0' }}>No event data.</div>
              : <IncidentTimeline incidents={incidents} homeTeam={homeTeam} awayTeam={awayTeam} homeLabel={homeAbbr} awayLabel={awayAbbr} />}
          </div>
          <TopPlayersSection topPlayers={topPlayers} homeTeam={homeTeam} awayTeam={awayTeam} playerImageMap={playerImageMap} />
        </div>
        <div style={{ padding:'20px 20px 16px' }}>
          <div style={{ fontSize:9, letterSpacing:3, fontWeight:700, color:'#3a3a3a', borderBottom:'1px solid #1c1c1c', paddingBottom:8, marginBottom:12 }}>TEAM STATS</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', marginBottom:6 }}>
            <span style={{ fontSize:9, fontWeight:700, color:'var(--color-accent)', letterSpacing:1 }}>{homeAbbr}</span>
            <span />
            <span style={{ fontSize:9, color:'#444', letterSpacing:1, textAlign:'right' }}>{awayAbbr}</span>
          </div>
          {statList.map(r => {
            const t = r.h + r.a || 1; const bw = (r.h/t)*100
            return (
              <div key={r.label} style={{ padding:'7px 0', borderBottom:'0.5px solid #1a1a1a' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center', marginBottom:4 }}>
                  <span style={{ fontSize:16, fontWeight:900, color:hasStats?'#f0ece4':'#222', fontVariantNumeric:'tabular-nums' }}>{hasStats?fmt(r.h,r.pct):'—'}</span>
                  <span style={{ fontSize:7, letterSpacing:2, color:'#2e2e2e', textTransform:'uppercase', padding:'0 8px' }}>{r.label}</span>
                  <span style={{ fontSize:16, color:hasStats?'#444':'#222', textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{hasStats?fmt(r.a,r.pct):'—'}</span>
                </div>
                <div style={{ height:2, background:'#1c1c1c' }}>
                  <div style={{ width:`${bw}%`, height:'100%', background:'var(--color-accent)', opacity:0.7 }} />
                </div>
              </div>
            )
          })}
          {xgHome !== null && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', padding:'10px 0 4px', borderTop:'1px solid #1c1c1c', marginTop:4 }}>
              <span style={{ fontSize:26, fontWeight:900, color:'var(--color-accent)', fontVariantNumeric:'tabular-nums' }}>{xgHome.toFixed(2)}</span>
              <span style={{ fontSize:7, color:'#2e2e2e', letterSpacing:2, alignSelf:'center' }}>xG</span>
              <span style={{ fontSize:20, color:'#333', textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{xgAway?.toFixed(2)??'—'}</span>
            </div>
          )}
          <MatchFactsSection venue={venue} matchDate={matchDate} roundLabel={roundLabel} />
        </div>
      </div>
    </div>
  )
}
