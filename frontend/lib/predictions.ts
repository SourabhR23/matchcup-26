/**
 * Fetch pre-match prediction data from Supabase for a given event.
 * The `event_data` column is a Python-dict string; we extract only the
 * fields we need (funfacts, ai_preview) via targeted regex rather than
 * trying to fully parse the whole dict.
 */
import { supabaseServer } from './supabase-server'

export interface MatchPrediction {
  event_id:      number
  funfacts:      string[]
  ai_preview:    string | null
  prob_home_win: number | null
  prob_draw:     number | null
  prob_away_win: number | null
  most_likely_score: string | null
  confidence:    number | null
}

/* ── Extract funfact sentences ─────────────────────────────────── */
function extractFunfacts(eventData: string): string[] {
  // If the key is missing or explicitly None, bail out
  if (!/'funfacts'/.test(eventData)) return []
  if (/'funfacts':\s*None\b/.test(eventData)) return []

  // Grab the funfacts block — stops at the next top-level key
  const blockMatch = eventData.match(/'funfacts':\s*(\[[\s\S]*?\])(?=,\s*'[a-z_]+'|$)/)
  const block = blockMatch ? blockMatch[1] : eventData

  const sentences: string[] = []

  // Sentences using double-quotes (apostrophes inside: "haven't")
  for (const m of block.matchAll(/'sentence':\s*"([^"]+)"/g)) {
    sentences.push(m[1])
  }

  // Sentences using single-quotes (no apostrophe inside)
  for (const m of block.matchAll(/'sentence':\s*'([^']+)'/g)) {
    sentences.push(m[1])
  }

  return sentences
}

/* ── Extract AI preview text ───────────────────────────────────── */
function extractAiPreview(eventData: string): string | null {
  if (!/'ai_preview'/.test(eventData)) return null
  if (/'ai_preview':\s*None\b/.test(eventData)) return null

  // Pattern: 'text': "..." followed by ', 'generated_at'
  const m = eventData.match(/'text':\s*"([\s\S]*?)",\s*'generated_at'/)
  if (!m) return null

  return m[1]
    .replace(/\\n/g, '\n')   // unescape newlines
    .replace(/\\"/g, '"')    // unescape quotes
    .trim()
}

/* ── Main export ───────────────────────────────────────────────── */
export async function getMatchPrediction(eventId: number): Promise<MatchPrediction | null> {
  try {
    const { data, error } = await supabaseServer
      .from('predictions')
      .select('event_id, event_data, prob_home_win, prob_draw, prob_away_win, most_likely_score, confidence')
      .eq('event_id', eventId)
      .maybeSingle()

    if (error || !data) return null

    const eventData = (data.event_data as string) ?? ''

    return {
      event_id:          eventId,
      funfacts:          extractFunfacts(eventData),
      ai_preview:        extractAiPreview(eventData),
      prob_home_win:     data.prob_home_win  as number | null,
      prob_draw:         data.prob_draw      as number | null,
      prob_away_win:     data.prob_away_win  as number | null,
      most_likely_score: data.most_likely_score as string | null,
      confidence:        data.confidence     as number | null,
    }
  } catch {
    return null
  }
}
