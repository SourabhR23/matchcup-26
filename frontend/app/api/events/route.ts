import { NextResponse } from 'next/server'
import { getEvents } from '@/lib/data'

export const dynamic = 'force-dynamic'

export async function GET() {
  const events = await getEvents()
  return NextResponse.json(events)
}
