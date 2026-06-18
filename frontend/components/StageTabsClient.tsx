'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { GroupTeamStat, MatchEvent } from '@/lib/types'
import AllGroupsGrid from './AllGroupsGrid'
import KnockoutBracket from './KnockoutBracket'

type Stage = 'group-stage' | 'knockout'

interface Props {
  sortedGroups: [string, GroupTeamStat[]][]
  knockoutMatches: MatchEvent[]
  defaultStage: Stage
}

export default function StageTabsClient({ sortedGroups, knockoutMatches, defaultStage }: Props) {
  const [stage, setStage] = useState<Stage>(defaultStage)

  const tabs: { id: Stage; label: string }[] = [
    { id: 'group-stage', label: 'GROUP STAGE' },
    { id: 'knockout',    label: 'KNOCKOUT'    },
  ]

  return (
    <div>
      {/* Stage tab row */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '0.5px solid #ddd8cc' }}>
        {tabs.map(tab => {
          const active = stage === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setStage(tab.id)}
              style={{
                fontFamily: 'var(--font-bebas, sans-serif)',
                fontSize: 16,
                padding: '8px 20px',
                background: 'transparent',
                color: active ? 'var(--color-ink)' : '#999',
                border: 'none',
                borderBottom: active ? '2px solid var(--color-accent)' : '2px solid transparent',
                cursor: 'pointer',
                letterSpacing: 2,
                transition: 'all 0.15s',
                marginBottom: -1,
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {stage === 'group-stage' && (
        sortedGroups.length === 0 ? (
          <div className="mt-8 bg-surface border border-muted p-6 text-center">
            <div className="font-display text-2xl tracking-[2px] mb-2">FIXTURES INCOMING</div>
            <p className="text-sm text-ink-faint">
              Group stage standings will appear here as matches are played.
            </p>
            <Link
              href="/matches"
              className="inline-block mt-4 bg-ink text-accent font-display text-[14px] tracking-[2px] px-6 py-2"
            >
              VIEW ALL MATCHES
            </Link>
          </div>
        ) : (
          <AllGroupsGrid sortedGroups={sortedGroups} />
        )
      )}
      {stage === 'knockout' && <KnockoutBracket matches={knockoutMatches} />}
    </div>
  )
}
