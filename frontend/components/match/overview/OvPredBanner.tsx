'use client'

import type { OvProps } from '../types'

export default function OvPredBanner({ prediction, homeAbbr, awayAbbr }: { prediction: OvProps['prediction']; homeAbbr:string; awayAbbr:string }) {
  if (!prediction?.probHomeWin) return null
  const hw = prediction.probHomeWin, dr = prediction.probDraw??0, aw = prediction.probAwayWin??0
  return (
    <div style={{ display:'flex', alignItems:'center', padding:'10px 20px', gap:14, background:'#0d0d0d', borderBottom:'1px solid #1c1c1c' }}>
      <div style={{ minWidth:48 }}>
        <div style={{ fontSize:24, fontWeight:900, color:'#f0ece4', lineHeight:1 }}>{hw.toFixed(0)}%</div>
        <div style={{ fontSize:7, color:'#333', letterSpacing:1.5, marginTop:2 }}>{homeAbbr}</div>
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:7, color:'#282828', letterSpacing:1.5, textAlign:'center', marginBottom:4 }}>
          PRE-MATCH{prediction.mostLikelyScore ? ` · ${prediction.mostLikelyScore}` : ''}
        </div>
        <div style={{ display:'flex', height:4, overflow:'hidden' }}>
          <div style={{ flex:hw, background:'var(--color-accent)' }} />
          <div style={{ flex:dr, background:'#2e2e2e' }} />
          <div style={{ flex:aw, background:'#1a1a1a' }} />
        </div>
        <div style={{ fontSize:7, color:'#282828', textAlign:'center', marginTop:3 }}>DRAW {dr.toFixed(1)}%</div>
      </div>
      <div style={{ minWidth:48, textAlign:'right' }}>
        <div style={{ fontSize:24, fontWeight:900, color:'#2a2a2a', lineHeight:1 }}>{aw.toFixed(0)}%</div>
        <div style={{ fontSize:7, color:'#282828', letterSpacing:1.5, marginTop:2 }}>{awayAbbr}</div>
      </div>
    </div>
  )
}
