'use client'

import styles from './OvD2Dashboard.module.css'
import type { OvProps } from '../types'
import OvPredBanner from './OvPredBanner'
import IncidentTimeline from '@/components/IncidentTimeline'
import TopPlayersSection from '../shared/TopPlayersSection'
import MatchFactsSection from '../shared/MatchFactsSection'

export default function OvD2Dashboard({ homeTeam, awayTeam, homeAbbr, awayAbbr, incidents, hStats, aStats, hasStats, xgHome, xgAway, homeYellows, awayYellows, hPassAcc, aPassAcc, topPlayers, playerImageMap, bsdStats, prediction, venue, matchDate, roundLabel }: OvProps) {
  const bsd = bsdStats?.stats
  const bigCards = [
    { label:'POSSESSION',     h:bsd?.home.ball_possession??0,  a:bsd?.away.ball_possession??0,  pct:true, avail:!!bsd },
    { label:'SHOTS',          h:hStats.shots,                  a:aStats.shots,                  avail:true },
    { label:'ON TARGET',      h:hStats.onTarget,               a:aStats.onTarget,               avail:true },
    { label:'xG',             h:xgHome??0,                     a:xgAway??0,                     dec:true, avail:xgHome!==null },
    { label:'BOX SHOTS',      h:bsd?.home.shots_inside_box??0, a:bsd?.away.shots_inside_box??0, avail:!!bsd },
    { label:'PASS ACC.',      h:Math.round(hPassAcc),          a:Math.round(aPassAcc),          pct:true, avail:true },
  ].filter(c => c.avail)

  const home = topPlayers.filter(p => p.team === homeTeam).slice(0, 3)
  const away = topPlayers.filter(p => p.team === awayTeam).slice(0, 3)
  const ratingBg = (r: number) => r >= 8.0 ? '#16a34a' : r >= 7.5 ? '#2563eb' : r >= 7.0 ? '#6b7280' : '#4b5563'

  /* match facts data inline so we can style without row lines */
  const fmtKickoff = (d: string) => {
    const dt = new Date(d)
    const date = dt.toLocaleDateString('en-US', { weekday:'short', year:'numeric', month:'short', day:'numeric' })
    const time = dt.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:false, timeZone:'UTC' })
    return `${date} · ${time} UTC`
  }
  const factRows: [string, string][] = [
    ...(venue?.name ? [['Stadium', `${venue.name}${venue.city ? ` · ${venue.city}` : ''}`] as [string,string]] : []),
    ...(venue?.capacity ? [['Capacity', venue.capacity.toLocaleString()] as [string,string]] : []),
    ...(venue?.country ? [['Country', venue.country] as [string,string]] : []),
    ...(matchDate ? [['Kickoff', fmtKickoff(matchDate)] as [string,string]] : []),
    ...(roundLabel ? [['Round', roundLabel] as [string,string]] : []),
    ['Competition', 'World Cup 2026'],
  ]

  return (
    <div style={{ background:'#111' }}>
      {/* Prediction banner */}
      {prediction?.probHomeWin != null && (
        <div style={{ display:'flex', alignItems:'center', padding:'10px 20px', gap:14, background:'#0d0d0d', borderBottom:'1px solid #1c1c1c' }}>
          <div style={{ minWidth:48 }}>
            <div style={{ fontSize:24, fontWeight:900, color:'#f0ece4', lineHeight:1 }}>{prediction.probHomeWin.toFixed(0)}%</div>
            <div style={{ fontSize:7, color:'#888', letterSpacing:1.5, marginTop:2 }}>{homeAbbr}</div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:7, color:'#777', letterSpacing:1.5, textAlign:'center', marginBottom:4 }}>
              PRE-MATCH{prediction.mostLikelyScore ? ` · ${prediction.mostLikelyScore}` : ''}
            </div>
            <div style={{ display:'flex', height:4, overflow:'hidden' }}>
              <div style={{ flex:prediction.probHomeWin, background:'var(--color-accent)' }} />
              <div style={{ flex:prediction.probDraw??0, background:'#444' }} />
              <div style={{ flex:prediction.probAwayWin??0, background:'#2a2a2a' }} />
            </div>
            <div style={{ fontSize:7, color:'#777', textAlign:'center', marginTop:3 }}>DRAW {(prediction.probDraw??0).toFixed(1)}%</div>
          </div>
          <div style={{ minWidth:48, textAlign:'right' }}>
            <div style={{ fontSize:24, fontWeight:900, color:'#aaa', lineHeight:1 }}>{(prediction.probAwayWin??0).toFixed(0)}%</div>
            <div style={{ fontSize:7, color:'#888', letterSpacing:1.5, marginTop:2 }}>{awayAbbr}</div>
          </div>
        </div>
      )}
      {/* Metric cards — cream background, black bold text */}
      <div style={{ padding:'16px 16px 0' }}>
        <div className={styles.cardsRow}>
          <span style={{ fontSize:17, fontWeight:800, color:'var(--color-accent)', letterSpacing:1 }}>{homeAbbr}</span>
          <span style={{ fontSize:11, letterSpacing:3, color:'#777' }}>KEY METRICS</span>
          <span style={{ fontSize:17, fontWeight:800, color:'#aaa', letterSpacing:1 }}>{awayAbbr}</span>
        </div>
        <div className={styles.cardsGrid} style={{ display:'grid', gridTemplateColumns:`repeat(${bigCards.length}, 1fr)`, gap:6, paddingBottom:16 }}>
          {bigCards.map(c => {
            const t = c.h + c.a || 1; const hPct = (c.h/t)*100
            const fh = (c as {dec?:boolean}).dec ? c.h.toFixed(2) : c.pct ? `${c.h}%` : String(c.h)
            const fa = (c as {dec?:boolean}).dec ? c.a.toFixed(2) : c.pct ? `${c.a}%` : String(c.a)
            return (
              <div key={c.label} style={{ background:'#f5f0e8', padding:'14px 10px' }}>
                <div style={{ fontSize:9, letterSpacing:1.5, color:'#555', fontWeight:700, marginBottom:10, textAlign:'center' }}>{c.label}</div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8, padding:'0 4px' }}>
                  <span className={styles.cardNum} style={{ fontWeight:900, color:hasStats?'#111':'#aaa', fontVariantNumeric:'tabular-nums' }}>{hasStats?fh:'—'}</span>
                  <span className={styles.cardNum} style={{ fontWeight:900, color:hasStats?'#555':'#aaa', fontVariantNumeric:'tabular-nums' }}>{hasStats?fa:'—'}</span>
                </div>
                <div style={{ height:3, display:'flex', overflow:'hidden' }}>
                  <div style={{ width:`${hPct}%`, height:'100%', background:'var(--color-accent)' }} />
                  <div style={{ flex:1, height:'100%', background:'#999' }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {/* 2-col: events left | players+facts right (dark bg) */}
      <div className={styles.bodyGrid}>
        <div style={{ padding:'18px 18px 16px', borderRight:'1px solid #1c1c1c' }}>
          <div style={{ fontSize:14, letterSpacing:3, fontWeight:800, color:'var(--color-accent)', paddingBottom:8, marginBottom:14, borderBottom:'2px solid var(--color-accent)' }}>MATCH EVENTS</div>
          {incidents.length === 0
            ? <div style={{ fontSize:11, color:'#888', textAlign:'center', padding:'24px 0' }}>No event data.</div>
            : <IncidentTimeline incidents={incidents} homeTeam={homeTeam} awayTeam={awayTeam} homeLabel={homeAbbr} awayLabel={awayAbbr} />}
        </div>
        {/* Players + facts — dark background */}
        <div style={{ background:'#0d0d0d', padding:'18px 18px 16px' }}>
          {(home.length > 0 || away.length > 0) && (
            <>
              <div style={{ fontSize:14, letterSpacing:3, fontWeight:800, color:'var(--color-accent)', paddingBottom:8, marginBottom:14, borderBottom:'2px solid var(--color-accent)' }}>TOP PLAYERS</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1px 1fr', gap:'0 16px', marginBottom:20 }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#888', letterSpacing:1.5, marginBottom:8 }}>{homeTeam.toUpperCase()}</div>
                  {home.map((p, i) => {
                    const imgUrl = playerImageMap?.get(p.name)
                    const initials = p.name.trim().split(/\s+/).map(w => w[0]).join('').slice(0,2).toUpperCase()
                    return (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 0' }}>
                        <div style={{ width:36, height:36, borderRadius:'50%', background:'#1e1e1e', border:'1px solid #333', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                          {imgUrl
                            ? <img src={imgUrl} width={36} height={36} alt={p.name} style={{ objectFit:'cover', width:'100%', height:'100%' }} />
                            : <span style={{ fontSize:10, fontWeight:700, color:'#aaa' }}>{initials}</span>
                          }
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:700, color:'#f0ece4', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                          <div style={{ fontSize:10, color:'#666', letterSpacing:1 }}>{p.pos}{p.goals>0?` · ⚽ ${p.goals}`:''}</div>
                        </div>
                        <div style={{ width:32, height:32, borderRadius:4, background:ratingBg(p.rating), flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <span style={{ fontSize:12, fontWeight:900, color:'#fff' }}>{p.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div style={{ background:'#1c1c1c' }} />
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#888', letterSpacing:1.5, marginBottom:8 }}>{awayTeam.toUpperCase()}</div>
                  {away.map((p, i) => {
                    const imgUrl = playerImageMap?.get(p.name)
                    const initials = p.name.trim().split(/\s+/).map(w => w[0]).join('').slice(0,2).toUpperCase()
                    return (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 0' }}>
                        <div style={{ width:36, height:36, borderRadius:'50%', background:'#1e1e1e', border:'1px solid #333', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                          {imgUrl
                            ? <img src={imgUrl} width={36} height={36} alt={p.name} style={{ objectFit:'cover', width:'100%', height:'100%' }} />
                            : <span style={{ fontSize:10, fontWeight:700, color:'#aaa' }}>{initials}</span>
                          }
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:700, color:'#f0ece4', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                          <div style={{ fontSize:10, color:'#666', letterSpacing:1 }}>{p.pos}{p.goals>0?` · ⚽ ${p.goals}`:''}</div>
                        </div>
                        <div style={{ width:32, height:32, borderRadius:4, background:ratingBg(p.rating), flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <span style={{ fontSize:12, fontWeight:900, color:'#fff' }}>{p.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
          {/* Match facts — no row lines */}
          {factRows.length > 1 && (
            <>
              <div style={{ fontSize:14, letterSpacing:3, fontWeight:800, color:'var(--color-accent)', paddingBottom:8, marginBottom:12, borderBottom:'2px solid var(--color-accent)' }}>MATCH FACTS</div>
              {factRows.map(([k, v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', padding:'6px 0', gap:12 }}>
                  <span style={{ fontSize:13, color:'#666', flexShrink:0 }}>{k}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:'#f0ece4', textAlign:'right' }}>{v}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
