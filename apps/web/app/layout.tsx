import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'lunari — cycle-synced nutrition',
  description: 'The first cycle-synced nutrition system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
