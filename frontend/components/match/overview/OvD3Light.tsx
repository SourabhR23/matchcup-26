'use client'

import styles from './OvD3Light.module.css'
import type { OvProps } from '../types'
import OvPredBanner from './OvPredBanner'
import IncidentTimeline from '@/components/IncidentTimeline'
import TopPlayersSection from '../shared/TopPlayersSection'
import MatchFactsSection from '../shared/MatchFactsSection'

export default function OvD3Light({ homeTeam, awayTeam, homeAbbr, awayAbbr, incidents, hStats, aStats, hasStats, xgHome, xgAway, homeYellows, awayYellows, hPassAcc, aPassAcc, topPlayers, bsdStats, prediction, venue, matchDate, roundLabel }: OvProps) {
  const bsd = bsdStats?.stats
  const statList = [
    { label:'Shots',      h:hStats.shots,         a:aStats.shots },
    { label:'On Target',  h:hStats.onTarget,      a:aStats.onTarget },
    { label:'Passes',     h:hStats.passes,        a:aStats.passes },
    { label:'Pass Acc.',  h:Math.round(hPassAcc), a:Math.round(aPassAcc), pct:true },
    { label:'Dribbles',   h:hStats.dribbles,      a:aStats.dribbles },
    { label:'Tackles',    h:hStats.tackles,       a:aStats.tackles },
    { label:'Fouls',      h:hStats.fouls,         a:aStats.fouls },
    { label:'Yellow',     h:homeYellows,          a:awayYellows },
  ] as { label:string; h:number; a:number; pct?:boolean }[]
  return (
    <div style={{ background:'#fff' }}>
      {prediction?.probHomeWin != null && (
        <div style={{ display:'flex', alignItems:'center', borderBottom:'2px solid #111', padding:'12px 20px', gap:16 }}>
          <div style={{ minWidth:56, flexShrink:0 }}>
            <div style={{ fontSize:30, fontWeight:900, color:'#111', lineHeight:1, fontVariantNumeric:'tabular-nums' }}>{prediction.probHomeWin.toFixed(0)}%</div>
            <div style={{ fontSize:9, color:'#aaa', letterSpacing:1.5, marginTop:2 }}>{homeAbbr}</div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:8, color:'#aaa', letterSpacing:1.5, textAlign:'center', marginBottom:5 }}>
              PRE-MATCH{prediction.mostLikelyScore ? ` · PREDICTED ${prediction.mostLikelyScore}` : ''}
            </div>
            <div style={{ display:'flex', height:6, overflow:'hidden', background:'#eee' }}>
              <div style={{ flex:prediction.probHomeWin, background:'#111' }} />
              <div style={{ flex:prediction.probDraw??0, background:'#999' }} />
              <div style={{ flex:prediction.probAwayWin??0, background:'#ccc' }} />
            </div>
            <div style={{ fontSize:8, color:'#aaa', letterSpacing:1.5, textAlign:'center', marginTop:4 }}>DRAW {(prediction.probDraw??0).toFixed(1)}%</div>
          </div>
          <div style={{ minWidth:56, flexShrink:0, textAlign:'right' }}>
            <div style={{ fontSize:30, fontWeight:900, color:'#aaa', lineHeight:1, fontVariantNumeric:'tabular-nums' }}>{(prediction.probAwayWin??0).toFixed(0)}%</div>
            <div style={{ fontSize:9, color:'#aaa', letterSpacing:1.5, marginTop:2 }}>{awayAbbr}</div>
          </div>
        </div>
      )}
      <div className={styles.twoCol}>
        <div className={styles.eventsPane}>
          <div style={{ padding:20, flex:'0 0 auto' }}>
            <div style={{ fontSize:9, letterSpacing:3, fontWeight:800, color:'#111', borderBottom:'2px solid #111', paddingBottom:6, marginBottom:14 }}>MATCH EVENTS</div>
            {incidents.length === 0
              ? <div style={{ fontSize:12, color:'#ccc', textAlign:'center', padding:'24px 0' }}>No event data.</div>
              : <IncidentTimeline incidents={incidents} homeTeam={homeTeam} awayTeam={awayTeam} homeLabel={homeAbbr} awayLabel={awayAbbr} />}
          </div>
          <TopPlayersSection topPlayers={topPlayers} homeTeam={homeTeam} awayTeam={awayTeam} />
        </div>
        <div style={{ display:'flex', flexDirection:'column' }}>
          <div style={{ padding:20, borderBottom:'1px solid #eee' }}>
            <div style={{ fontSize:9, letterSpacing:3, fontWeight:800, color:'#111', borderBottom:'2px solid #111', paddingBottom:6, marginBottom:10 }}>TEAM STATS</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:'0 8px' }}>
              <span style={{ fontSize:9, fontWeight:700, color:'#111', letterSpacing:1 }}>{homeAbbr}</span>
              <span />
              <span style={{ fontSize:9, fontWeight:700, color:'#999', letterSpacing:1, textAlign:'right' }}>{awayAbbr}</span>
            </div>
            {statList.map(({ label, h, a, pct }) => (
              <div key={label} style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:'0 8px', padding:'7px 0', borderBottom:'0.5px solid #eee', alignItems:'center' }}>
                <span style={{ fontSize:16, fontWeight:900, color:hasStats?'#111':'#ddd', fontVariantNumeric:'tabular-nums' }}>{hasStats?(pct?`${h}%`:h):'—'}</span>
                <span style={{ fontSize:8, letterSpacing:2, color:'#aaa', textAlign:'center', textTransform:'uppercase' }}>{label}</span>
                <span style={{ fontSize:16, color:hasStats?'#aaa':'#ddd', textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{hasStats?(pct?`${a}%`:a):'—'}</span>
              </div>
            ))}
            {bsd && ([
              { label:'Possession', h:bsd.home.ball_possession??0, a:bsd.away.ball_possession??0, pct:true },
              { label:'Corners',    h:bsd.home.corner_kicks??0,    a:bsd.away.corner_kicks??0 },
              { label:'Offsides',   h:bsd.home.offsides??0,        a:bsd.away.offsides??0 },
            ] as { label:string; h:number; a:number; pct?:boolean }[]).map(({ label, h, a, pct }) => (
              <div key={label} style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:'0 8px', padding:'7px 0', borderBottom:'0.5px solid #eee', alignItems:'center' }}>
                <span style={{ fontSize:16, fontWeight:900, color:'#111', fontVariantNumeric:'tabular-nums' }}>{pct?`${h}%`:h}</span>
                <span style={{ fontSize:8, letterSpacing:2, color:'#aaa', textAlign:'center', textTransform:'uppercase' }}>{label}</span>
                <span style={{ fontSize:16, color:'#aaa', textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{pct?`${a}%`:a}</span>
              </div>
            ))}
            {(xgHome !== null || xgAway !== null) && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:'0 8px', padding:'10px 0', alignItems:'center' }}>
                <span style={{ fontSize:28, fontWeight:900, color:'var(--color-accent)', fontVariantNumeric:'tabular-nums' }}>{xgHome?.toFixed(2)??'—'}</span>
                <span style={{ fontSize:8, letterSpacing:2, color:'#aaa', textAlign:'center' }}>xG</span>
                <span style={{ fontSize:20, color:'#bbb', textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{xgAway?.toFixed(2)??'—'}</span>
              </div>
            )}
          </div>
          <MatchFactsSection venue={venue} matchDate={matchDate} roundLabel={roundLabel} />
        </div>
      </div>
    </div>
  )
}
