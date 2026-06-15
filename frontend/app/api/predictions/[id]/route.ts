import { NextResponse } from 'next/server'
import { getMatchPrediction } from '@/lib/predictions'

export const dynamic = 'force-dynamic'

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const eventId = parseInt(id, 10)
  if (isNaN(eventId)) return NextResponse.json(null)

  const pred = await getMatchPrediction(eventId)
  return NextResponse.json(pred)
}
