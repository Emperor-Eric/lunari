import type { Metadata } from 'next'
import { Marcellus, Raleway } from 'next/font/google'
import './globals.css'

// Display / headings — Marcellus only ships a 400 weight.
const marcellus = Marcellus({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-marcellus',
  display: 'swap',
})

// Body / data — full weight range used across the UI.
const raleway = Raleway({
  weight: ['200', '300', '400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-raleway',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'lunari — cycle-synced nutrition',
  description: 'The first cycle-synced nutrition system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${marcellus.variable} ${raleway.variable}`}>
      <body>{children}</body>
    </html>
  )
}
