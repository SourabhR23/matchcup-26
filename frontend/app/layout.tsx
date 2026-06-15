import type { Metadata } from 'next'
import { Bebas_Neue, Inter } from 'next/font/google'
import './globals.css'
import Topbar from '@/components/Topbar'
import LiveTicker from '@/components/LiveTicker'

const bebas = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Matchday — FIFA World Cup 2026',
  description: 'Live scores, group standings, fixtures and squads for FIFA World Cup 2026',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bebas.variable} ${inter.variable}`}>
      <body className="min-h-screen" suppressHydrationWarning>
        <Topbar />
        <LiveTicker />
        <main className="max-w-[1280px] mx-auto px-5 py-5">{children}</main>
      </body>
    </html>
  )
}
