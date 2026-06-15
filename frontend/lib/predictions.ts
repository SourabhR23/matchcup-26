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
  most_likely_score:    string | null
  confidence:           number | null
  prob_btts_yes:        number | null
  prob_over_15:         number | null
  prob_over_25:         number | null
  prob_over_35:         number | null
  btts_recommend:       boolean | null
  over_15_recommend:    boolean | null
  over_25_recommend:    boolean | null
  over_35_recommend:    boolean | null
  winner_recommend:     boolean | null
  expected_home_goals:  number | null
  expected_away_goals:  number | null
  favorite:             string | null
  predicted_result:     string | null
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
      .select('event_id, event_data, prob_home_win, prob_draw, prob_away_win, most_likely_score, confidence, prob_btts_yes, prob_over_15, prob_over_25, prob_over_35, btts_recommend, over_15_recommend, over_25_recommend, over_35_recommend, winner_recommend, expected_home_goals, expected_away_goals, favorite, predicted_result')
      .eq('event_id', eventId)
      .maybeSingle()

    if (error || !data) return null

    const eventData = (data.event_data as string) ?? ''

    return {
      event_id:             eventId,
      funfacts:             extractFunfacts(eventData),
      ai_preview:           extractAiPreview(eventData),
      prob_home_win:        data.prob_home_win        as number | null,
      prob_draw:            data.prob_draw             as number | null,
      prob_away_win:        data.prob_away_win         as number | null,
      most_likely_score:    data.most_likely_score     as string | null,
      confidence:           data.confidence            as number | null,
      prob_btts_yes:        data.prob_btts_yes         as number | null,
      prob_over_15:         data.prob_over_15          as number | null,
      prob_over_25:         data.prob_over_25          as number | null,
      prob_over_35:         data.prob_over_35          as number | null,
      btts_recommend:       data.btts_recommend        as boolean | null,
      over_15_recommend:    data.over_15_recommend     as boolean | null,
      over_25_recommend:    data.over_25_recommend     as boolean | null,
      over_35_recommend:    data.over_35_recommend     as boolean | null,
      winner_recommend:     data.winner_recommend      as boolean | null,
      expected_home_goals:  data.expected_home_goals   as number | null,
      expected_away_goals:  data.expected_away_goals   as number | null,
      favorite:             data.favorite              as string | null,
      predicted_result:     data.predicted_result      as string | null,
    }
  } catch {
    return null
  }
}
